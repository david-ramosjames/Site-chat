import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  status: z.enum(["new", "contacted", "booked", "lost", "spam"]).optional(),
  notes: z.string().max(5000).optional().nullable(),
});

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const lead = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!lead) return NextResponse.json({ error: "not_found" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const lead = await prisma.lead.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ lead });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.lead.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
}
