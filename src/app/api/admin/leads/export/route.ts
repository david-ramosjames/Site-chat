import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildLeadWhere, leadCsv } from "@/lib/lead-filters";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("clientId") ?? "";
  if (!clientId) {
    return NextResponse.json({ error: "clientId required" }, { status: 400 });
  }

  const leads = await prisma.lead.findMany({
    where: buildLeadWhere({
      clientId,
      q: req.nextUrl.searchParams.get("q") ?? undefined,
      status: req.nextUrl.searchParams.get("status") ?? undefined,
      qualified: req.nextUrl.searchParams.get("qualified") ?? undefined,
      referral: req.nextUrl.searchParams.get("referral") ?? undefined,
      start: req.nextUrl.searchParams.get("start") ?? undefined,
      end: req.nextUrl.searchParams.get("end") ?? undefined,
    }),
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  return new NextResponse(leadCsv(leads), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="leads-${clientId}.csv"`,
    },
  });
}
