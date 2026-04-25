import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DEMO_CLIENT_ID } from "@/lib/demo";

const nav = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/settings", label: "Widget settings" },
  { href: "/admin/install", label: "Install script" },
  { href: "/admin/flow", label: "Flow builder" },
  { href: "/admin/features", label: "Feature toggles" },
  { href: "/admin/notifications", label: "Notifications" },
  { href: "/admin/leads", label: "Leads" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const client = await prisma.client
    .findUnique({ where: { id: DEMO_CLIENT_ID }, include: { widgetSettings: true } })
    .catch(() => null);

  return (
    <div className="min-h-screen bg-ink-100/60">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-ink-300/60 bg-white md:block">
        <div className="flex h-16 items-center gap-2 border-b border-ink-300/60 px-5 font-semibold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
            CC
          </span>
          <span>ChatToConvert</span>
        </div>
        <div className="px-4 py-4">
          <div className="rounded-lg border border-ink-300/60 bg-ink-100/60 p-3">
            <p className="text-xs text-ink-500">Active business</p>
            <p className="truncate text-sm font-semibold">{client?.name ?? "Demo client"}</p>
            <p className="truncate text-xs text-ink-500">{client?.industry}</p>
            <span
              className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                client?.widgetSettings?.isActive
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  client?.widgetSettings?.isActive ? "bg-emerald-500" : "bg-amber-500"
                }`}
              />
              Widget {client?.widgetSettings?.isActive ? "active" : "inactive"}
            </span>
          </div>
        </div>
        <nav className="space-y-0.5 px-3">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-lg px-3 py-2 text-sm text-ink-700 hover:bg-ink-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 px-5 text-xs text-ink-500">
          <Link href="/" className="hover:text-ink-700">
            ← Back to marketing site
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-3 border-b border-ink-300/60 bg-white px-4 md:pl-72">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{client?.name ?? "ChatToConvert admin"}</p>
          <p className="truncate text-xs text-ink-500">{client?.websiteUrl}</p>
        </div>
        <nav className="flex gap-1 overflow-x-auto md:hidden">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-full border border-ink-300 px-3 py-1 text-xs text-ink-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="px-4 py-6 md:pl-72 md:pr-8">{children}</main>
    </div>
  );
}
