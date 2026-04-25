import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEMO_CLIENT_ID } from "@/lib/demo";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("clientId") ?? DEMO_CLIENT_ID;
  const leads = await prisma.lead.findMany({
    where: { clientId },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ leads });
}
