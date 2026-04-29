import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { widgetSettingsSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

function nullable(v: string | null | undefined) {
  return v && v.length ? v : null;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = widgetSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_payload", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { businessName, industry, translations, ...rest } = parsed.data;

  const widget = {
    primaryColor: rest.primaryColor,
    accentColor: rest.accentColor,
    logoUrl: nullable(rest.logoUrl),
    welcomeMessage: rest.welcomeMessage,
    bubbleText: rest.bubbleText,
    widgetPosition: rest.widgetPosition,
    isActive: rest.isActive,
    introVideoEnabled: rest.introVideoEnabled,
    introVideoUrl: nullable(rest.introVideoUrl),
    introPosterUrl: nullable(rest.introPosterUrl),
    introVideoEndImageUrl: nullable(rest.introVideoEndImageUrl),
    introVideoStyle: rest.introVideoStyle,
    bubbleImageUrl: nullable(rest.bubbleImageUrl),
    bubbleTooltip: nullable(rest.bubbleTooltip),
    chatAvatarUrl: nullable(rest.chatAvatarUrl),
    enableTranslation: rest.enableTranslation,
    translations: (translations as object | null | undefined) ?? undefined,
    secondWelcomeMessage: nullable(rest.secondWelcomeMessage),
    secondWelcomeDelaySec: rest.secondWelcomeDelaySec,
    sideButtons: (rest.sideButtons as object | null | undefined) ?? undefined,
    sideButtonsPosition: rest.sideButtonsPosition,
    endCtas: (rest.endCtas as object | null | undefined) ?? undefined,
    openOnLoad: rest.openOnLoad,
    declineHeadline: nullable(rest.declineHeadline),
    declineMessage: nullable(rest.declineMessage),
    successHeadline: nullable(rest.successHeadline),
    successMessage: nullable(rest.successMessage),
    googleAdsConversionId: nullable(rest.googleAdsConversionId)
      ?.replace(/\s+/g, "")
      .toUpperCase() ?? null,
    googleAdsConversionLabel: nullable(rest.googleAdsConversionLabel)?.trim() ?? null,
    callRailUseDynamicNumber: rest.callRailUseDynamicNumber,
    callRailSwapWaitMs: rest.callRailSwapWaitMs,
    callRailDynamicNumberSelector: nullable(rest.callRailDynamicNumberSelector),
  };

  const client = await prisma.client.update({
    where: { id: params.id },
    data: {
      name: businessName,
      industry,
      widgetSettings: {
        upsert: { create: widget, update: widget },
      },
    },
    include: { widgetSettings: true },
  });
  return NextResponse.json({ client });
}
