import Link from "next/link";
import { prisma } from "@/lib/prisma";
import AdminSidebar from "./AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminShellLayout({ children }: { children: React.ReactNode }) {
  const clients = await prisma.client
    .findMany({
      include: { widgetSettings: true },
      orderBy: { name: "asc" },
    })
    .catch(() => []);

  return (
    <div className="min-h-screen bg-ink-100/60">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-ink-300/60 bg-white md:block">
        <div className="flex h-16 items-center gap-2 border-b border-ink-300/60 px-5 font-semibold">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
            RJ
          </span>
          <span>RJL-Chat</span>
        </div>
        <AdminSidebar
          clients={clients.map((c) => ({
            id: c.id,
            name: c.name,
            industry: c.industry,
            isActive: c.widgetSettings?.isActive ?? false,
          }))}
        />
        <div className="mt-6 px-5 text-xs text-ink-500">
          <Link href="/admin/new" className="hover:text-ink-700">
            + Add another business
          </Link>
        </div>
      </aside>

      <main className="px-4 py-6 md:pl-72 md:pr-8">{children}</main>
    </div>
  );
}
