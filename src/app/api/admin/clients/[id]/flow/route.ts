import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { flowUpdateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = flowUpdateSchema.safeParse(body);
  if (!parsed.success) {
    // Surface step-level issues (path includes the step index + field) so
    // the client can render a precise message like "Step 11 (matter_type):
    // mediaUrl - Invalid url".
    return NextResponse.json(
      {
        error: "invalid_payload",
        issues: parsed.error.flatten(),
        stepIssues: parsed.error.issues.map((iss) => ({
          path: iss.path,
          message: iss.message,
          code: iss.code,
        })),
      },
      { status: 400 }
    );
  }

  try {
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
  } catch (err) {
    // Most likely cause: duplicate (clientId, stepKey) unique constraint
    // because two steps in the array share the same key.
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: "db_error", detail: message.slice(0, 400) },
      { status: 400 }
    );
  }

  const steps = await prisma.flowStep.findMany({
    where: { clientId: params.id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ steps });
}
