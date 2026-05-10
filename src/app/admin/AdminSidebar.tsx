"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ClientSummary = { id: string; name: string; industry: string; isActive: boolean };

const CLIENT_NAV = [
  { suffix: "", label: "Overview" },
  { suffix: "/settings", label: "Widget settings" },
  { suffix: "/install", label: "Install script" },
  { suffix: "/flow", label: "Flow builder" },
  { suffix: "/features", label: "Feature toggles" },
  { suffix: "/notifications", label: "Notifications" },
  { suffix: "/leads", label: "Leads" },
  { suffix: "/analytics", label: "Analytics" },
];

export default function AdminSidebar({ clients }: { clients: ClientSummary[] }) {
  const pathname = usePathname() || "";
  const match = pathname.match(/^\/admin\/(?!new$)([^/]+)/);
  const activeId = match?.[1] ?? null;
  const activeClient = activeId ? clients.find((c) => c.id === activeId) : null;

  return (
    <div className="space-y-5 px-4 py-4">
      <div>
        <p className="px-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
          Businesses
        </p>
        <ul className="mt-2 space-y-0.5">
          {clients.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/${c.id}`}
                className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition ${
                  activeId === c.id
                    ? "bg-brand-50 text-brand-700"
                    : "text-ink-700 hover:bg-ink-100"
                }`}
              >
                <span className="truncate">{c.name}</span>
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    c.isActive ? "bg-emerald-500" : "bg-amber-500"
                  }`}
                  title={c.isActive ? "Widget active" : "Widget inactive"}
                />
              </Link>
            </li>
          ))}
          {clients.length === 0 && (
            <li className="rounded-lg bg-ink-100/60 px-3 py-2 text-xs text-ink-500">
              No businesses yet — add one to get started.
            </li>
          )}
        </ul>
      </div>

      {activeClient && (
        <div>
          <div className="rounded-lg border border-ink-300/60 bg-ink-100/60 p-3">
            <p className="text-xs text-ink-500">Editing</p>
            <p className="truncate text-sm font-semibold">{activeClient.name}</p>
            <p className="truncate text-xs text-ink-500">{activeClient.industry}</p>
          </div>
          <ul className="mt-3 space-y-0.5">
            {CLIENT_NAV.map((item) => {
              const href = `/admin/${activeClient.id}${item.suffix}`;
              const isActive =
                item.suffix === ""
                  ? pathname === href
                  : pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={item.suffix}>
                  <Link
                    href={href}
                    className={`block rounded-lg px-3 py-1.5 text-sm transition ${
                      isActive
                        ? "bg-brand-500 text-white"
                        : "text-ink-700 hover:bg-ink-100"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
