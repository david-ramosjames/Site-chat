import type { Lead, Prisma } from "@prisma/client";

export const LEAD_STATUSES = ["new", "contacted", "booked", "lost", "spam"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type LeadFilterParams = {
  clientId: string;
  q?: string;
  status?: string;
  qualified?: string;
  referral?: string;
  start?: string;
  end?: string;
};

export function parseDateParam(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(value + "T00:00:00.000Z");
  return Number.isNaN(date.getTime()) ? null : date;
}

export function endOfDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 23, 59, 59, 999),
  );
}

export function buildLeadWhere(params: LeadFilterParams): Prisma.LeadWhereInput {
  const start = parseDateParam(params.start);
  const end = parseDateParam(params.end);
  const q = params.q?.trim();
  const status = LEAD_STATUSES.includes(params.status as LeadStatus)
    ? (params.status as LeadStatus)
    : "";
  const qualified = yesNo(params.qualified);
  const referral = yesNo(params.referral);

  return {
    clientId: params.clientId,
    ...(status ? { status } : {}),
    ...(qualified ? { qualified } : {}),
    ...(referral ? { referral } : {}),
    ...(start || end
      ? {
          createdAt: {
            ...(start ? { gte: start } : {}),
            ...(end ? { lte: endOfDay(end) } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { serviceRequested: { contains: q, mode: "insensitive" } },
            { sourceUrl: { contains: q, mode: "insensitive" } },
            { utmSource: { contains: q, mode: "insensitive" } },
            { utmCampaign: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };
}

export function leadCsv(leads: Lead[]) {
  const headers = [
    "Created At",
    "Name",
    "Phone",
    "Email",
    "Service",
    "Qualified",
    "Referral",
    "Score",
    "Status",
    "Source URL",
    "UTM Source",
    "UTM Campaign",
    "AI Summary",
  ];
  const rows = leads.map((lead) => [
    lead.createdAt.toISOString(),
    lead.name ?? "",
    lead.phone ?? "",
    lead.email ?? "",
    lead.serviceRequested ?? "",
    lead.qualified ?? "",
    lead.referral ?? "",
    lead.leadScore ?? "",
    lead.status,
    lead.sourceUrl ?? "",
    lead.utmSource ?? "",
    lead.utmCampaign ?? "",
    lead.aiSummary ?? "",
  ]);
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function yesNo(value?: string) {
  return value === "yes" || value === "no" ? value : "";
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}
