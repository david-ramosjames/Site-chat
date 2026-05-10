import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { buildLeadWhere, LEAD_STATUSES } from "@/lib/lead-filters";
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

export default async function LeadsPage({
  params,
  searchParams,
}: {
  params: { clientId: string };
  searchParams: {
    q?: string;
    status?: string;
    qualified?: string;
    referral?: string;
    start?: string;
    end?: string;
  };
}) {
  const client = await prisma.client.findUnique({ where: { id: params.clientId } });
  if (!client) notFound();

  const where = buildLeadWhere({ clientId: params.clientId, ...searchParams });
  const leads = await prisma.lead.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  const exportParams = new URLSearchParams(
    Object.entries({ clientId: params.clientId, ...searchParams }).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string" && entry[1].length > 0,
    ),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-base font-semibold">Leads</h2>
          <p className="text-sm text-ink-500">Every chat submission, newest first.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="pill">{leads.length} shown</span>
          <a className="btn-secondary px-3 py-1.5" href={`/api/admin/leads/export?${exportParams}`}>
            Export CSV
          </a>
        </div>
      </div>

      <form className="card grid gap-3 p-4 md:grid-cols-7" action={`/admin/${params.clientId}/leads`}>
        <div className="md:col-span-2">
          <label htmlFor="lead-q" className="label">
            Search
          </label>
          <input
            id="lead-q"
            name="q"
            className="input"
            defaultValue={searchParams.q ?? ""}
            placeholder="Name, phone, email, service..."
          />
        </div>
        <div>
          <label htmlFor="lead-status" className="label">
            Status
          </label>
          <select id="lead-status" name="status" className="select" defaultValue={searchParams.status ?? ""}>
            <option value="">Any</option>
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="lead-qualified" className="label">
            Qualified
          </label>
          <select
            id="lead-qualified"
            name="qualified"
            className="select"
            defaultValue={searchParams.qualified ?? ""}
          >
            <option value="">Any</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label htmlFor="lead-referral" className="label">
            Referral
          </label>
          <select
            id="lead-referral"
            name="referral"
            className="select"
            defaultValue={searchParams.referral ?? ""}
          >
            <option value="">Any</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>
        <div>
          <label htmlFor="lead-start" className="label">
            Start
          </label>
          <input id="lead-start" name="start" type="date" className="input" defaultValue={searchParams.start ?? ""} />
        </div>
        <div>
          <label htmlFor="lead-end" className="label">
            End
          </label>
          <input id="lead-end" name="end" type="date" className="input" defaultValue={searchParams.end ?? ""} />
        </div>
        <div className="flex items-end gap-2 md:col-span-7">
          <button className="btn-primary" type="submit">
            Apply
          </button>
          <Link href={`/admin/${params.clientId}/leads`} className="btn-secondary">
            Clear
          </Link>
        </div>
      </form>

      {leads.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-sm font-medium">No leads found.</p>
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
                <th className="px-4 py-3">Score</th>
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
                  <td className="px-4 py-3 text-xs text-ink-500">{l.leadScore ?? "â€”"}</td>
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
