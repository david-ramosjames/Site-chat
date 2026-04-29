import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import DeleteLeadButton from "./DeleteLeadButton";

export const dynamic = "force-dynamic";

const statusStyles: Record<string, string> = {
  new: "bg-brand-50 text-brand-700 border-brand-500/40",
  contacted: "bg-amber-50 text-amber-700 border-amber-500/40",
  booked: "bg-emerald-50 text-emerald-700 border-emerald-500/40",
  lost: "bg-ink-100 text-ink-700 border-ink-300",
  spam: "bg-rose-50 text-rose-700 border-rose-500/40",
};

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export default async function LeadsPage({ params }: { params: { clientId: string } }) {
  const client = await prisma.client.findUnique({ where: { id: params.clientId } });
  if (!client) notFound();

  const leads = await prisma.lead.findMany({
    where: { clientId: params.clientId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold">Leads</h2>
          <p className="text-sm text-ink-500">Every chat submission, newest first.</p>
        </div>
        <span className="pill">{leads.length} total</span>
      </div>

      {leads.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm font-medium">No leads yet.</p>
          <p className="mt-1 text-xs text-ink-500">
            Install the widget on this site or open the install page for the snippet.
          </p>
          <Link href={`/admin/${params.clientId}/install`} className="btn-primary mt-4 inline-flex">
            Get install script
          </Link>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink-100/60 text-left text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Qualified</th>
                <th className="px-4 py-3">Referral</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">UTM</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/60">
              {leads.map((l) => (
                <tr key={l.id} className="hover:bg-ink-100/40">
                  <td className="px-4 py-3 font-medium">{l.name ?? "—"}</td>
                  <td className="px-4 py-3 text-xs">
                    <div>{l.phone ?? "—"}</div>
                    <div className="text-ink-500">{l.email ?? ""}</div>
                  </td>
                  <td className="px-4 py-3">{l.serviceRequested ?? "—"}</td>
                  <td className="px-4 py-3 capitalize">
                    {l.qualified === "yes" ? (
                      <span className="pill border border-emerald-500/40 bg-emerald-50 text-emerald-700">
                        Yes
                      </span>
                    ) : l.qualified === "no" ? (
                      <span className="pill border border-ink-300 bg-ink-100 text-ink-700">
                        No
                      </span>
                    ) : (
                      <span className="text-ink-500">{l.qualified ?? "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize">
                    {l.referral === "yes" ? (
                      <span className="pill border border-amber-500/40 bg-amber-50 text-amber-700">
                        Referral
                      </span>
                    ) : (
                      <span className="text-ink-500">{l.referral === "no" ? "No" : l.referral ?? "—"}</span>
                    )}
                  </td>
                  <td className="px-4 py-3 max-w-[220px] truncate text-xs text-ink-500">
                    {l.sourceUrl ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-500">{l.utmSource ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`pill border capitalize ${statusStyles[l.status] ?? "bg-ink-100"}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-ink-500">{formatDate(l.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/admin/${params.clientId}/leads/${l.id}`}
                        className="text-xs font-semibold text-brand-600 hover:underline"
                      >
                        Open
                      </Link>
                      <DeleteLeadButton leadId={l.id} name={l.name ?? ""} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
