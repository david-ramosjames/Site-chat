import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsPreflight, withCors } from "@/lib/cors";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return corsPreflight();
}

export async function GET(req: NextRequest) {
  const clientId = req.nextUrl.searchParams.get("clientId");
  if (!clientId) {
    return withCors(NextResponse.json({ error: "clientId required" }, { status: 400 }));
  }

  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  if (!rateLimit(`widget-config:${ip}:${clientId}`, 60, 60_000).ok) {
    return withCors(NextResponse.json({ error: "rate_limited" }, { status: 429 }));
  }

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      widgetSettings: true,
      featureToggles: true,
      flowSteps: { orderBy: { order: "asc" } },
    },
  });

  if (!client || client.status !== "active" || !client.widgetSettings?.isActive) {
    return withCors(NextResponse.json({ active: false }, { status: 200 }));
  }

  return withCors(
    NextResponse.json({
      active: true,
      clientId: client.id,
      business: {
        name: client.name,
        industry: client.industry,
        websiteUrl: client.websiteUrl,
      },
      widget: {
        primaryColor: client.widgetSettings.primaryColor,
        accentColor: client.widgetSettings.accentColor,
        logoUrl: client.widgetSettings.logoUrl,
        welcomeMessage: client.widgetSettings.welcomeMessage,
        bubbleText: client.widgetSettings.bubbleText,
        widgetPosition: client.widgetSettings.widgetPosition,
        introVideoEnabled: client.widgetSettings.introVideoEnabled,
        introVideoUrl: client.widgetSettings.introVideoUrl,
        introPosterUrl: client.widgetSettings.introPosterUrl,
        bubbleImageUrl: client.widgetSettings.bubbleImageUrl,
        bubbleTooltip: client.widgetSettings.bubbleTooltip,
        enableTranslation: client.widgetSettings.enableTranslation,
        translations: client.widgetSettings.translations,
      },
      features: client.featureToggles,
      flow: client.flowSteps.map((s) => ({
        stepKey: s.stepKey,
        order: s.order,
        question: s.question,
        inputType: s.inputType,
        isRequired: s.isRequired,
        options: s.options,
        nextLogic: s.nextLogic,
        mediaType: s.mediaType,
        mediaUrl: s.mediaUrl,
        thumbnailUrl: s.thumbnailUrl,
        altText: s.altText,
        mediaDisplayStyle: s.mediaDisplayStyle,
        translations: s.translations,
      })),
    })
  );
}
