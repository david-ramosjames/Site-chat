import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { flowUpdateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = flowUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }

  // Replace-all strategy keeps the flow builder logic simple.
  await prisma.$transaction([
    prisma.flowStep.deleteMany({ where: { clientId: params.id } }),
    prisma.flowStep.createMany({
      data: parsed.data.steps.map((s, i) => ({
        clientId: params.id,
        stepKey: s.stepKey,
        order: i,
        question: s.question,
        inputType: s.inputType,
        isRequired: s.isRequired,
        options: (s.options ?? undefined) as object | undefined,
        nextLogic: (s.nextLogic ?? undefined) as object | undefined,
        mediaType: s.mediaType,
        mediaUrl: s.mediaUrl || null,
        thumbnailUrl: s.thumbnailUrl || null,
        altText: s.altText || null,
        mediaDisplayStyle: s.mediaDisplayStyle,
        leadField: s.leadField || null,
        translations: (s.translations ?? undefined) as object | undefined,
      })),
    }),
  ]);

  const steps = await prisma.flowStep.findMany({
    where: { clientId: params.id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ steps });
}
