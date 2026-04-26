import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { endCtasUpdateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = endCtasUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const updated = await prisma.widgetSettings.upsert({
    where: { clientId: params.id },
    create: {
      clientId: params.id,
      endCtas: parsed.data.endCtas as object,
    },
    update: { endCtas: parsed.data.endCtas as object },
  });
  return NextResponse.json({ endCtas: updated.endCtas ?? [] });
}
