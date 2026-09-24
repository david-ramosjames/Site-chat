import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isBlockKind, normalizeBlockValue, type BlockKind } from "@/lib/blocklist";

export const dynamic = "force-dynamic";

const entrySchema = z.object({
  kind: z.enum(["name", "phone", "email"]),
  value: z.string().max(200),
  note: z.string().max(200).optional().nullable(),
});

const bodySchema = z.union([
  entrySchema,
  z.object({ fromLeadId: z.string().min(1).max(80) }),
]);

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!client) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const entries = await prisma.blockedLead.findMany({
    where: { clientId: params.id },
    orderBy: [{ kind: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ entries });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!client) return NextResponse.json({ error: "not_found" }, { status: 404 });

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if ("fromLeadId" in parsed.data) {
    const lead = await prisma.lead.findFirst({
      where: { id: parsed.data.fromLeadId, clientId: params.id },
    });
    if (!lead) return NextResponse.json({ error: "not_found" }, { status: 404 });

    const created = await addEntries(params.id, [
      { kind: "name", value: lead.name, note: "From lead" },
      { kind: "phone", value: lead.phone, note: "From lead" },
      { kind: "email", value: lead.email, note: "From lead" },
    ]);
    await prisma.lead
      .update({ where: { id: lead.id }, data: { status: "spam" } })
      .catch(() => null);
    return NextResponse.json({ ok: true, entries: created, markedSpam: true });
  }

  try {
    const created = await addEntries(params.id, [parsed.data]);
    if (created.length === 0) {
      return NextResponse.json({ error: "invalid_value" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, entry: created[0] });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "already_blocked" }, { status: 409 });
    }
    throw err;
  }
}

async function addEntries(
  clientId: string,
  items: { kind: BlockKind | string; value?: string | null; note?: string | null }[]
) {
  const rows = items
    .map((item) => {
      if (!isBlockKind(item.kind) || !item.value) return null;
      const normalized = normalizeBlockValue(item.kind, item.value);
      if (!normalized) return null;
      return {
        clientId,
        kind: item.kind,
        value: item.value.trim(),
        normalized,
        note: item.note?.trim() || null,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));

  if (!rows.length) return [];

  const created = [];
  for (const row of rows) {
    const entry = await prisma.blockedLead.upsert({
      where: {
        clientId_kind_normalized: {
          clientId: row.clientId,
          kind: row.kind,
          normalized: row.normalized,
        },
      },
      create: row,
      update: { value: row.value, note: row.note },
    });
    created.push(entry);
  }
  return created;
}
