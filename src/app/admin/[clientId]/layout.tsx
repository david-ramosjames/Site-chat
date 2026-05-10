import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const NAV_ITEMS = [
  { suffix: "", label: "Overview" },
  { suffix: "/settings", label: "Settings" },
  { suffix: "/install", label: "Install" },
  { suffix: "/flow", label: "Flow" },
  { suffix: "/features", label: "Features" },
  { suffix: "/notifications", label: "Notifications" },
  { suffix: "/leads", label: "Leads" },
  { suffix: "/analytics", label: "Analytics" },
];

export default async function ClientAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { clientId: string };
}) {
  const client = await prisma.client.findUnique({
    where: { id: params.clientId },
    include: { widgetSettings: true },
  });

  if (!client) notFound();

  return (
    <div className="space-y-4">
      <header className="card flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
            {client.industry}
          </p>
          <h1 className="truncate text-lg font-semibold">{client.name}</h1>
          <p className="truncate text-xs text-ink-500">{client.websiteUrl}</p>
        </div>
        <span
          className={`pill border ${
            client.widgetSettings?.isActive
              ? "border-emerald-500/40 bg-emerald-50 text-emerald-700"
              : "border-amber-500/40 bg-amber-50 text-amber-700"
          }`}
        >
          Widget {client.widgetSettings?.isActive ? "active" : "inactive"}
        </span>
      </header>

      <nav className="flex gap-1 overflow-x-auto md:hidden">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.suffix}
            href={`/admin/${client.id}${item.suffix}`}
            className="whitespace-nowrap rounded-full border border-ink-300 bg-white px-3 py-1 text-xs text-ink-700"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
