import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminIndex() {
  const clients = await prisma.client.findMany({
    include: {
      widgetSettings: true,
      _count: { select: { leads: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">All businesses</h1>
          <p className="text-sm text-ink-500">
            Pick a business to manage its widget, flow, and leads.
          </p>
        </div>
        <Link href="/admin/new" className="btn-primary">
          + Add business
        </Link>
      </div>

      {clients.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm font-medium">No businesses yet.</p>
          <p className="mt-1 text-xs text-ink-500">
            Create your first business to start collecting leads.
          </p>
          <Link href="/admin/new" className="btn-primary mt-4 inline-flex">
            + Add business
          </Link>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/${c.id}`}
                className="card group flex h-full flex-col gap-3 p-5 transition hover:border-brand-500/50 hover:shadow-card"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-sm font-semibold text-white"
                    style={{ background: c.widgetSettings?.primaryColor || "#1d4ed8" }}
                  >
                    {c.name.slice(0, 2).toUpperCase()}
                  </span>
                  <span
                    className={`pill border ${
                      c.widgetSettings?.isActive
                        ? "border-emerald-500/40 bg-emerald-50 text-emerald-700"
                        : "border-amber-500/40 bg-amber-50 text-amber-700"
                    }`}
                  >
                    {c.widgetSettings?.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold">{c.name}</p>
                  <p className="truncate text-xs text-ink-500">{c.industry}</p>
                </div>
                <div className="mt-auto flex items-center justify-between text-xs text-ink-500">
                  <span>{c._count.leads} lead{c._count.leads === 1 ? "" : "s"}</span>
                  <span className="text-brand-600 group-hover:underline">Manage →</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
