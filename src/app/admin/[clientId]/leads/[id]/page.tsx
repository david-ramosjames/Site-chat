import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import LeadControls from "./LeadControls";

export const dynamic = "force-dynamic";

type TranscriptEntry = { role: "bot" | "user"; text: string; stepKey?: string };

export default async function LeadDetail({
  params,
}: {
  params: { clientId: string; id: string };
}) {
  const lead = await prisma.lead.findFirst({
    where: { id: params.id, clientId: params.clientId },
  });
  if (!lead) notFound();

  const transcript = (lead.transcript as TranscriptEntry[] | null) ?? [];
  const answers = (lead.answers as Record<string, unknown> | null) ?? {};

  const ctaEvents = lead.chatSessionId
    ? await prisma.chatEvent.findMany({
        where: {
          clientId: params.clientId,
          sessionId: lead.chatSessionId,
          type: "cta_click",
        },
        orderBy: { createdAt: "asc" },
        select: { source: true, createdAt: true },
      })
    : [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/${params.clientId}/leads`}
          className="text-xs text-ink-500 hover:text-ink-700"
        >
          ← Back to leads
        </Link>
        <h2 className="mt-2 text-lg font-semibold">{lead.name ?? "Anonymous lead"}</h2>
        <p className="text-sm text-ink-500">
          {lead.serviceRequested ?? "Service not specified"} · Received{" "}
          {new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(lead.createdAt)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="space-y-6">
          <div className="card p-5">
            <h2 className="text-sm font-semibold">Conversation transcript</h2>
            {transcript.length === 0 ? (
              <p className="mt-3 text-sm text-ink-500">No transcript captured.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {transcript.map((t, i) => (
                  <li
                    key={i}
                    className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <span
                      className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${
                        t.role === "user"
                          ? "rounded-tr-sm bg-brand-500 text-white"
                          : "rounded-tl-sm bg-ink-100 text-ink-900"
                      }`}
                    >
                      {t.text}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold">Answers</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
              {Object.entries(answers).map(([k, v]) => (
                <div key={k} className="rounded-lg border border-ink-300/60 bg-ink-100/40 p-3">
                  <dt className="text-xs font-medium uppercase tracking-wide text-ink-500">{k}</dt>
                  <dd className="mt-1 break-words text-sm text-ink-900">{String(v ?? "")}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="card p-5">
            <h2 className="text-sm font-semibold">AI & scoring</h2>
            <p className="mt-2 text-sm text-ink-700">
              {lead.aiSummary ?? "AI summary not generated yet — enable AI lead summary in feature toggles."}
            </p>
            <p className="mt-2 text-xs text-ink-500">
              Lead score: {lead.leadScore ?? "—"} (enable lead scoring to populate)
            </p>
          </div>
        </section>

        <aside className="space-y-6">
          <LeadControls leadId={lead.id} status={lead.status} notes={lead.notes ?? ""} />

          {ctaEvents.length > 0 && (
            <div className="card p-5 text-sm">
              <h2 className="text-sm font-semibold">CTA clicks</h2>
              <ul className="mt-3 space-y-2">
                {ctaEvents.map((ev, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg border border-ink-300/60 bg-ink-100/40 px-3 py-2">
                    <span className="font-medium capitalize">{ev.source ?? "unknown"}</span>
                    <span className="text-xs text-ink-500">
                      {new Intl.DateTimeFormat("en-US", { dateStyle: "short", timeStyle: "short" }).format(ev.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card p-5 text-sm">
            <h2 className="text-sm font-semibold">Source</h2>
            <dl className="mt-3 space-y-2">
              <div>
                <dt className="text-xs text-ink-500">Page submitted</dt>
                <dd className="break-all">{lead.sourceUrl ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-500">Landing page</dt>
                <dd className="break-all">{lead.landingPageUrl ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-500">Referrer</dt>
                <dd className="break-all">{lead.referrer ?? "—"}</dd>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <dt className="text-xs text-ink-500">utm_source</dt>
                  <dd>{lead.utmSource ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-500">utm_medium</dt>
                  <dd>{lead.utmMedium ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-500">utm_campaign</dt>
                  <dd>{lead.utmCampaign ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-ink-500">utm_term</dt>
                  <dd>{lead.utmTerm ?? "—"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-ink-500">utm_content</dt>
                  <dd className="break-all">{lead.utmContent ?? "—"}</dd>
                </div>
              </div>
              {(lead.gclid || lead.msclkid || lead.fbclid || lead.ttclid || lead.wbraid || lead.gbraid || lead.ndclid) && (
                <div className="space-y-1 rounded-md border border-ink-300/60 bg-ink-100/40 p-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                    Ad click IDs
                  </p>
                  {lead.gclid && (
                    <div>
                      <dt className="text-xs text-ink-500">gclid (Google Ads)</dt>
                      <dd className="break-all text-xs">{lead.gclid}</dd>
                    </div>
                  )}
                  {lead.msclkid && (
                    <div>
                      <dt className="text-xs text-ink-500">msclkid (Microsoft)</dt>
                      <dd className="break-all text-xs">{lead.msclkid}</dd>
                    </div>
                  )}
                  {lead.fbclid && (
                    <div>
                      <dt className="text-xs text-ink-500">fbclid (Meta)</dt>
                      <dd className="break-all text-xs">{lead.fbclid}</dd>
                    </div>
                  )}
                  {lead.ttclid && (
                    <div>
                      <dt className="text-xs text-ink-500">ttclid (TikTok)</dt>
                      <dd className="break-all text-xs">{lead.ttclid}</dd>
                    </div>
                  )}
                  {(lead.wbraid || lead.gbraid) && (
                    <div>
                      <dt className="text-xs text-ink-500">wbraid / gbraid (Google iOS)</dt>
                      <dd className="break-all text-xs">{lead.wbraid || lead.gbraid}</dd>
                    </div>
                  )}
                  {lead.ndclid && (
                    <div>
                      <dt className="text-xs text-ink-500">ndclid</dt>
                      <dd className="break-all text-xs">{lead.ndclid}</dd>
                    </div>
                  )}
                </div>
              )}
              <div>
                <dt className="text-xs text-ink-500">Browser</dt>
                <dd className="break-all text-xs">{lead.userAgent ?? "—"}</dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </div>
  );
}
