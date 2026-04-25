import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DEMO_CLIENT_ID } from "@/lib/demo";

export const dynamic = "force-dynamic";

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export default async function OverviewPage() {
  const clientId = DEMO_CLIENT_ID;
  const [client, leads, completedCount] = await Promise.all([
    prisma.client.findUnique({
      where: { id: clientId },
      include: { widgetSettings: true },
    }),
    prisma.lead.findMany({ where: { clientId }, orderBy: { createdAt: "desc" }, take: 10 }),
    prisma.lead.count({ where: { clientId, status: { not: "spam" } } }),
  ]);

  const total = completedCount;
  const newCount = await prisma.lead.count({ where: { clientId, status: "new" } });
  const bookedCount = await prisma.lead.count({ where: { clientId, status: "booked" } });
  const conversion = total ? Math.round((bookedCount / total) * 100) : 0;

  const stats = [
    { label: "Total leads", value: total },
    { label: "New leads", value: newCount },
    { label: "Completed chats", value: total },
    { label: "Booked conversion", value: `${conversion}%` },
  ];

  if (!client) {
    return (
      <div className="card p-8">
        <p className="text-sm text-ink-700">
          No demo client found. Run <code className="rounded bg-ink-100 px-1">npm run db:seed</code>{" "}
          after your database is reachable.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Overview</h1>
        <p className="text-sm text-ink-500">A quick look at your widget and the leads it&apos;s bringing in.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{s.label}</p>
            <p className="mt-1 text-2xl font-semibold">{s.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Recent leads</h2>
            <Link href="/admin/leads" className="text-xs text-brand-600 hover:underline">
              View all →
            </Link>
          </div>
          {leads.length === 0 ? (
            <p className="mt-4 text-sm text-ink-500">No leads yet. Paste your install script and start a test chat.</p>
          ) : (
            <ul className="mt-4 divide-y divide-ink-300/60">
              {leads.map((l) => (
                <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{l.name ?? "Anonymous"}</p>
                    <p className="truncate text-xs text-ink-500">
                      {l.serviceRequested ?? "—"} · {l.phone ?? l.email ?? "no contact"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="pill capitalize">{l.status}</span>
                    <p className="mt-1 text-xs text-ink-500">{formatDate(l.createdAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold">Widget status</h2>
          <div className="mt-4 space-y-2 text-sm">
            <p>
              <span className="text-ink-500">Business:</span>{" "}
              <span className="font-medium">{client.name}</span>
            </p>
            <p>
              <span className="text-ink-500">Industry:</span> {client.industry}
            </p>
            <p>
              <span className="text-ink-500">Status:</span>{" "}
              {client.widgetSettings?.isActive ? (
                <span className="font-medium text-emerald-600">Active</span>
              ) : (
                <span className="font-medium text-amber-600">Inactive</span>
              )}
            </p>
            <p className="truncate">
              <span className="text-ink-500">Website:</span> {client.websiteUrl}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/admin/install" className="btn-secondary">
              Get install script
            </Link>
            <Link href="/admin/settings" className="btn-primary">
              Edit widget
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
