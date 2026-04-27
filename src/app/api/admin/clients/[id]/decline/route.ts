import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { declineUpdateSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

type Translations = {
  es?: Record<string, string | null | undefined> & {
    declineHeadline?: string | null;
    declineMessage?: string | null;
  };
} | null;

function nullable(v: string | null | undefined) {
  return v && v.length ? v : null;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = declineUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Preserve any other locale keys (welcomeMessage, bubbleText, etc.) that
  // the Settings page already saved into translations.es.
  const existing = await prisma.widgetSettings.findUnique({
    where: { clientId: params.id },
  });
  const existingTranslations = (existing?.translations as Translations) ?? null;
  const mergedTranslations: Translations = {
    ...(existingTranslations ?? {}),
    es: {
      ...((existingTranslations?.es as Record<string, unknown>) ?? {}),
      declineHeadline: parsed.data.translations?.es?.declineHeadline ?? null,
      declineMessage: parsed.data.translations?.es?.declineMessage ?? null,
    },
  };

  const updated = await prisma.widgetSettings.upsert({
    where: { clientId: params.id },
    create: {
      clientId: params.id,
      declineHeadline: nullable(parsed.data.declineHeadline),
      declineMessage: nullable(parsed.data.declineMessage),
      translations: mergedTranslations as object,
    },
    update: {
      declineHeadline: nullable(parsed.data.declineHeadline),
      declineMessage: nullable(parsed.data.declineMessage),
      translations: mergedTranslations as object,
    },
  });

  return NextResponse.json({
    declineHeadline: updated.declineHeadline ?? "",
    declineMessage: updated.declineMessage ?? "",
    translations: updated.translations,
  });
}
