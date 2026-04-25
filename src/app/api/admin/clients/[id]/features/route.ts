import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { featureTogglesSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = featureTogglesSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const features = await prisma.featureToggles.upsert({
    where: { clientId: params.id },
    create: { clientId: params.id, ...parsed.data },
    update: parsed.data,
  });
  return NextResponse.json({ features });
}
