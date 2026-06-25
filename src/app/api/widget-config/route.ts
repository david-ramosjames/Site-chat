import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsPreflight, withCors } from "@/lib/cors";
import { rateLimit } from "@/lib/rate-limit";
import { publicFeatureToggles } from "@/lib/widget-config";

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
        introVideoEndImageUrl: client.widgetSettings.introVideoEndImageUrl,
        introVideoUrlEs: client.widgetSettings.introVideoUrlEs,
        introPosterUrlEs: client.widgetSettings.introPosterUrlEs,
        introVideoEndImageUrlEs: client.widgetSettings.introVideoEndImageUrlEs,
        introVideoStyle: client.widgetSettings.introVideoStyle,
        bubbleImageUrl: client.widgetSettings.bubbleImageUrl,
        bubbleTooltip: client.widgetSettings.bubbleTooltip,
        bubbleTooltipBgColor: client.widgetSettings.bubbleTooltipBgColor,
        bubbleTooltipTextColor: client.widgetSettings.bubbleTooltipTextColor,
        chatAvatarUrl: client.widgetSettings.chatAvatarUrl,
        enableTranslation: client.widgetSettings.enableTranslation,
        translations: client.widgetSettings.translations,
        secondWelcomeMessage: client.widgetSettings.secondWelcomeMessage,
        secondWelcomeDelaySec: client.widgetSettings.secondWelcomeDelaySec,
        secondWelcomeBgColor: client.widgetSettings.secondWelcomeBgColor,
        secondWelcomeTextColor: client.widgetSettings.secondWelcomeTextColor,
        brandingFooterEnabled: client.widgetSettings.brandingFooterEnabled,
        brandingFooterText: client.widgetSettings.brandingFooterText,
        sideButtons: client.widgetSettings.sideButtons ?? [],
        sideButtonsPosition: client.widgetSettings.sideButtonsPosition,
        endCtas: client.widgetSettings.endCtas ?? [],
        declineCtas: client.widgetSettings.declineCtas ?? [],
        openOnLoad: client.widgetSettings.openOnLoad,
        declineHeadline: client.widgetSettings.declineHeadline,
        declineMessage: client.widgetSettings.declineMessage,
        successHeadline: client.widgetSettings.successHeadline,
        successMessage: client.widgetSettings.successMessage,
        googleAdsConversionId: client.widgetSettings.googleAdsConversionId,
        googleAdsConversionLabel: client.widgetSettings.googleAdsConversionLabel,
        callRailUseDynamicNumber: client.widgetSettings.callRailUseDynamicNumber,
        callRailSwapWaitMs: client.widgetSettings.callRailSwapWaitMs,
        callRailDynamicNumberSelector: client.widgetSettings.callRailDynamicNumberSelector,
        defaultPhoneCountry: client.widgetSettings.defaultPhoneCountry,
        headerSubtitle: client.widgetSettings.headerSubtitle,
        headerSubtitleEs: client.widgetSettings.headerSubtitleEs,
        showVideoControls: client.widgetSettings.showVideoControls,
        introVideoStartMuted: client.widgetSettings.introVideoStartMuted,
        headerButtonColor: client.widgetSettings.headerButtonColor,
      },
      features: publicFeatureToggles(client.featureToggles),
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
