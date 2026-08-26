import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import RemovePageButton from "./RemovePageButton";

export const dynamic = "force-dynamic";

const RANGES = [
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
  { key: "all", label: "All time", days: null as number | null },
];

function parseDateParam(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + "T00:00:00.000Z");
  return Number.isNaN(date.getTime()) ? null : date;
}

function endOfDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999),
  );
}

function pct(numerator: number, denominator: number) {
  if (!denominator) return "—";
  return ((numerator / denominator) * 100).toFixed(1) + "%";
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function pageLabel(url?: string | null) {
  if (!url) return "Unknown page";
  try {
    const u = new URL(url);
    return `${u.hostname}${u.pathname}`;
  } catch {
    return url;
  }
}

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: { clientId: string };
  searchParams: { range?: string; start?: string; end?: string };
}) {
  const client = await prisma.client.findUnique({ where: { id: params.clientId } });
  if (!client) notFound();

  const customStart = parseDateParam(searchParams.start);
  const customEnd = parseDateParam(searchParams.end);
  const hasCustomRange = Boolean(customStart || customEnd);
  const rangeKey = searchParams.range && RANGES.some((r) => r.key === searchParams.range)
    ? searchParams.range
    : "30d";
  const range = RANGES.find((r) => r.key === rangeKey)!;
  const since = hasCustomRange
    ? customStart
    : range.days
      ? new Date(Date.now() - range.days * 24 * 60 * 60 * 1000)
      : null;
  const until = customEnd ? endOfDay(customEnd) : null;

  const where = {
    clientId: params.clientId,
    ...(since || until
      ? {
          createdAt: {
            ...(since ? { gte: since } : {}),
            ...(until ? { lte: until } : {}),
          },
        }
      : {}),
  };

  const grouped = await prisma.chatEvent.groupBy({
    by: ["type"],
    where,
    _count: { _all: true },
  });
  const counts: Record<string, number> = {
    opened: 0,
    started: 0,
    completed_success: 0,
    completed_decline: 0,
    cta_click: 0,
  };
  grouped.forEach((g) => {
    counts[g.type] = g._count._all;
  });

  // Per-session funnel: dedupe events by sessionId so counts read as
  // "unique visitors who reached this stage" instead of raw event volume.
  const events = await prisma.chatEvent.findMany({
    where,
    select: { sessionId: true, type: true, source: true, createdAt: true, sourceUrl: true },
    orderBy: { createdAt: "asc" },
  });
  const sessionStages: Record<string, Set<string>> = {
    opened: new Set(),
    started: new Set(),
    completed_success: new Set(),
    completed_decline: new Set(),
    cta_click: new Set(),
  };
  const dailyStages = new Map<string, Record<string, Set<string>>>();
  const pageStages = new Map<string, Set<string>>();
  const ctaSources = new Map<string, Set<string>>();
  events.forEach((s) => {
    sessionStages[s.type]?.add(s.sessionId);
    const day = dayKey(s.createdAt);
    if (!dailyStages.has(day)) {
      dailyStages.set(day, {
        opened: new Set(),
        started: new Set(),
        completed_success: new Set(),
        completed_decline: new Set(),
        cta_click: new Set(),
      });
    }
    dailyStages.get(day)?.[s.type]?.add(s.sessionId);
    if (s.type === "opened") {
      const label = pageLabel(s.sourceUrl);
      if (!pageStages.has(label)) pageStages.set(label, new Set());
      pageStages.get(label)?.add(s.sessionId);
    }
    if (s.type === "cta_click" && s.source) {
      if (!ctaSources.has(s.source)) ctaSources.set(s.source, new Set());
      ctaSources.get(s.source)?.add(s.sessionId);
    }
  });

  // Load leads submitted in the same window to split "completed_success"
  // into referral vs non-referral. The Lead row carries the referral flag
  // (set by the flow step's lead-column mapping); events don't.
  const leadsInRange = await prisma.lead.findMany({
    where: {
      clientId: params.clientId,
      ...(since || until
        ? {
            createdAt: {
              ...(since ? { gte: since } : {}),
              ...(until ? { lte: until } : {}),
            },
          }
        : {}),
      chatSessionId: { not: null },
    },
    select: { chatSessionId: true, referral: true },
  });
  const referralSessionIds = new Set<string>();
  leadsInRange.forEach((l) => {
    if (l.chatSessionId && l.referral === "yes") {
      referralSessionIds.add(l.chatSessionId);
    }
  });

  const opened = sessionStages.opened.size;
  const started = sessionStages.started.size;
  const successAll = sessionStages.completed_success.size;
  const referral = Array.from(sessionStages.completed_success).filter((sid) =>
    referralSessionIds.has(sid)
  ).length;
  const success = successAll - referral;
  const decline = sessionStages.completed_decline.size;
  const completed = successAll + decline;
  const ctaClicks = sessionStages.cta_click.size;
  const ctaByType = Array.from(ctaSources.entries())
    .map(([type, sessions]) => ({ type, sessions: sessions.size }))
    .sort((a, b) => b.sessions - a.sessions);
  const dailyRows = Array.from(dailyStages.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 14)
    .map(([day, stages]) => ({
      day,
      opened: stages.opened.size,
      started: stages.started.size,
      completed: stages.completed_success.size + stages.completed_decline.size,
      ctaClicks: stages.cta_click.size,
    }));
  const topPages = Array.from(pageStages.entries())
    .map(([page, sessions]) => ({ page, sessions: sessions.size }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 8);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h2 className="text-base font-semibold">Analytics</h2>
          <p className="text-sm text-ink-500">
            Conversion funnel for the chat widget. Each stage counts unique sessions.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-wrap gap-1">
            {RANGES.map((r) => (
              <a
                key={r.key}
                href={`/admin/${params.clientId}/analytics?range=${r.key}`}
                className={`pill border ${
                  !hasCustomRange && r.key === rangeKey
                    ? "border-brand-500/40 bg-brand-50 text-brand-700"
                    : "border-ink-300 bg-white text-ink-700"
                }`}
              >
                {r.label}
              </a>
            ))}
          </div>
          <form
            action={`/admin/${params.clientId}/analytics`}
            className="flex flex-wrap items-end gap-2 rounded-lg border border-ink-300/70 bg-white p-2 shadow-sm"
          >
            <div>
              <label htmlFor="analytics-start" className="block text-xs font-medium text-ink-500">
                Start
              </label>
              <input
                id="analytics-start"
                name="start"
                type="date"
                defaultValue={searchParams.start ?? ""}
                className="mt-1 h-9 rounded-lg border border-ink-300 bg-white px-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <div>
              <label htmlFor="analytics-end" className="block text-xs font-medium text-ink-500">
                End
              </label>
              <input
                id="analytics-end"
                name="end"
                type="date"
                defaultValue={searchParams.end ?? ""}
                className="mt-1 h-9 rounded-lg border border-ink-300 bg-white px-2 text-sm text-ink-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
              />
            </div>
            <button type="submit" className="btn-secondary h-9 px-3 py-0">
              Apply
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Chats opened" value={opened} sub="auto-open + bubble click" />
        <Stat label="Started" value={started} sub={`${pct(started, opened)} of opens`} />
        <Stat
          label="Completed (success)"
          value={success}
          sub={`${pct(success, started)} of starts`}
        />
        <Stat
          label="Completed (referral)"
          value={referral}
          sub={`${pct(referral, started)} of starts`}
        />
        <Stat
          label="Completed (decline)"
          value={decline}
          sub={`${pct(decline, started)} of starts`}
        />
        <Stat
          label="CTA clicks"
          value={ctaClicks}
          sub={`${pct(ctaClicks, successAll)} of success`}
        />
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold">Conversion funnel</h3>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-ink-500">
            <tr>
              <th className="py-2">Stage</th>
              <th className="py-2">Sessions</th>
              <th className="py-2">% of opens</th>
              <th className="py-2">Step conversion</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink-300/60">
            <FunnelRow label="Opened chat" value={opened} ofOpens={opened} step={null} />
            <FunnelRow
              label="Started flow (first answer)"
              value={started}
              ofOpens={opened}
              step={pct(started, opened)}
            />
            <FunnelRow
              label="Reached an end state"
              value={completed}
              ofOpens={opened}
              step={pct(completed, started)}
            />
            <FunnelRow
              label="…lead"
              value={success}
              ofOpens={opened}
              step={pct(success, completed)}
            />
            <FunnelRow
              label="…referral"
              value={referral}
              ofOpens={opened}
              step={pct(referral, completed)}
            />
            <FunnelRow
              label="…decline message"
              value={decline}
              ofOpens={opened}
              step={pct(decline, completed)}
            />
            <FunnelRow
              label="Clicked a CTA"
              value={ctaClicks}
              ofOpens={opened}
              step={pct(ctaClicks, successAll)}
            />
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="text-sm font-semibold">Daily trend</h3>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="py-2">Day</th>
                <th className="py-2">Opened</th>
                <th className="py-2">Started</th>
                <th className="py-2">Completed</th>
                <th className="py-2">CTA clicks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/60">
              {dailyRows.length ? (
                dailyRows.map((row) => (
                  <tr key={row.day}>
                    <td className="py-2 font-medium">{row.day}</td>
                    <td className="py-2 text-ink-500">{row.opened}</td>
                    <td className="py-2 text-ink-500">{row.started}</td>
                    <td className="py-2 text-ink-500">{row.completed}</td>
                    <td className="py-2 text-ink-500">{row.ctaClicks}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-3 text-ink-500" colSpan={5}>
                    No events in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold">Top pages by chat opens</h3>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="py-2">Page</th>
                <th className="py-2">Sessions</th>
                <th className="py-2 text-right" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/60">
              {topPages.length ? (
                topPages.map((row) => (
                  <tr key={row.page}>
                    <td className="max-w-[380px] truncate py-2">{row.page}</td>
                    <td className="py-2 text-ink-500">{row.sessions}</td>
                    <td className="py-2 text-right">
                      <RemovePageButton clientId={params.clientId} page={row.page} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-3 text-ink-500" colSpan={3}>
                    No page data in this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {ctaByType.length > 0 && (
        <div className="card p-5">
          <h3 className="text-sm font-semibold">CTA clicks by type</h3>
          <p className="mt-1 text-xs text-ink-500">
            Unique sessions that clicked each end-of-chat button.
          </p>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="py-2">CTA type</th>
                <th className="py-2">Sessions</th>
                <th className="py-2">% of success</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/60">
              {ctaByType.map((row) => (
                <tr key={row.type}>
                  <td className="py-2 font-medium capitalize">{row.type}</td>
                  <td className="py-2 text-ink-500">{row.sessions}</td>
                  <td className="py-2 text-ink-500">{pct(row.sessions, successAll)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="card p-5">
        <h3 className="text-sm font-semibold">Raw event volume</h3>
        <p className="mt-1 text-xs text-ink-500">
          Total events fired (a single session can fire multiple opens if the visitor closes and
          reopens the chat).
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          <li>opened: {counts.opened}</li>
          <li>started: {counts.started}</li>
          <li>completed_success: {counts.completed_success}</li>
          <li>completed_decline: {counts.completed_decline}</li>
          <li>cta_click: {counts.cta_click}</li>
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="card p-4">
      <p className="text-xs uppercase tracking-wide text-ink-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="text-xs text-ink-500">{sub}</p>
    </div>
  );
}

function FunnelRow({
  label,
  value,
  ofOpens,
  step,
}: {
  label: string;
  value: number;
  ofOpens: number;
  step: string | null;
}) {
  return (
    <tr>
      <td className="py-2">{label}</td>
      <td className="py-2 font-medium">{value}</td>
      <td className="py-2 text-ink-500">{pct(value, ofOpens)}</td>
      <td className="py-2 text-ink-500">{step ?? "—"}</td>
    </tr>
  );
}
