import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { endCtasUpdateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Translations = {
  es?: Record<string, string | null | undefined>;
} | null;

function nullable(v: string | null | undefined) {
  return v && v.length ? v : null;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = endCtasUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Merge into the existing translations.es so we don't blow away
  // welcomeMessage/bubbleText/declineHeadline/etc. set elsewhere.
  const existing = await prisma.widgetSettings.findUnique({
    where: { clientId: params.id },
  });
  const existingTranslations = (existing?.translations as Translations) ?? null;
  const mergedTranslations: Translations = {
    ...(existingTranslations ?? {}),
    es: {
      ...((existingTranslations?.es as Record<string, unknown>) ?? {}),
      successHeadline: parsed.data.translations?.es?.successHeadline ?? null,
      successMessage: parsed.data.translations?.es?.successMessage ?? null,
    },
  };

  const updated = await prisma.widgetSettings.upsert({
    where: { clientId: params.id },
    create: {
      clientId: params.id,
      endCtas: parsed.data.endCtas as object,
      successHeadline: nullable(parsed.data.successHeadline),
      successMessage: nullable(parsed.data.successMessage),
      translations: mergedTranslations as object,
    },
    update: {
      endCtas: parsed.data.endCtas as object,
      successHeadline: nullable(parsed.data.successHeadline),
      successMessage: nullable(parsed.data.successMessage),
      translations: mergedTranslations as object,
    },
  });
  return NextResponse.json({
    endCtas: updated.endCtas ?? [],
    successHeadline: updated.successHeadline ?? "",
    successMessage: updated.successMessage ?? "",
    translations: updated.translations,
  });
}
