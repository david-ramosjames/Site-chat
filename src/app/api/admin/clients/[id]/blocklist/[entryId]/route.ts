import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; entryId: string } }
) {
  const existing = await prisma.blockedLead.findFirst({
    where: { id: params.entryId, clientId: params.id },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "not_found" }, { status: 404 });

  await prisma.blockedLead.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
