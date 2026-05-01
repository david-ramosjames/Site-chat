import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ params }: { params: { clientId: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.clientId },
    include: { widgetSettings: true },
  });
  if (!client) notFound();

  const ws = client.widgetSettings;
  const translations =
    (ws?.translations as
      | {
          es?: {
            welcomeMessage?: string;
            bubbleText?: string;
            bubbleTooltip?: string;
            secondWelcomeMessage?: string;
            declineHeadline?: string;
            declineMessage?: string;
          };
        }
      | null) ?? null;
  const sideButtons =
    (ws?.sideButtons as
      | Array<{
          type: "phone" | "sms" | "messenger" | "whatsapp" | "custom";
          label?: string | null;
          destination: string;
          showOnDesktop: boolean;
          showOnMobile: boolean;
          showInEnglish: boolean;
          showInSpanish: boolean;
        }>
      | null) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Widget settings</h2>
        <p className="text-sm text-ink-500">Branding, intro video, bubble appearance, and translations.</p>
      </div>
      <SettingsForm
        clientId={client.id}
        initial={{
          businessName: client.name,
          industry: client.industry,
          primaryColor: ws?.primaryColor ?? "#1d4ed8",
          accentColor: ws?.accentColor ?? "#1e3a8a",
          logoUrl: ws?.logoUrl ?? "",
          welcomeMessage: ws?.welcomeMessage ?? "Hi! How can we help?",
          bubbleText: ws?.bubbleText ?? "Chat with us",
          widgetPosition: (ws?.widgetPosition as "bottom-right" | "bottom-left") ?? "bottom-right",
          isActive: ws?.isActive ?? true,
          introVideoEnabled: ws?.introVideoEnabled ?? false,
          introVideoUrl: ws?.introVideoUrl ?? "",
          introPosterUrl: ws?.introPosterUrl ?? "",
          introVideoEndImageUrl: ws?.introVideoEndImageUrl ?? "",
          introVideoStyle: (ws?.introVideoStyle as "top" | "background") ?? "top",
          bubbleImageUrl: ws?.bubbleImageUrl ?? "",
          bubbleTooltip: ws?.bubbleTooltip ?? "",
          bubbleTooltipBgColor: ws?.bubbleTooltipBgColor ?? "",
          bubbleTooltipTextColor: ws?.bubbleTooltipTextColor ?? "",
          chatAvatarUrl: ws?.chatAvatarUrl ?? "",
          enableTranslation: ws?.enableTranslation ?? false,
          translations: {
            es: {
              welcomeMessage: translations?.es?.welcomeMessage ?? "",
              bubbleText: translations?.es?.bubbleText ?? "",
              bubbleTooltip: translations?.es?.bubbleTooltip ?? "",
              secondWelcomeMessage: translations?.es?.secondWelcomeMessage ?? "",
              declineHeadline: translations?.es?.declineHeadline ?? "",
              declineMessage: translations?.es?.declineMessage ?? "",
            },
          },
          declineHeadline: ws?.declineHeadline ?? "",
          declineMessage: ws?.declineMessage ?? "",
          secondWelcomeMessage: ws?.secondWelcomeMessage ?? "",
          secondWelcomeDelaySec: ws?.secondWelcomeDelaySec ?? 30,
          secondWelcomeBgColor: ws?.secondWelcomeBgColor ?? "",
          secondWelcomeTextColor: ws?.secondWelcomeTextColor ?? "",
          brandingFooterEnabled: ws?.brandingFooterEnabled ?? true,
          brandingFooterText: ws?.brandingFooterText ?? "",
          sideButtons: sideButtons.map((b) => ({
            type: b.type,
            label: b.label ?? "",
            destination: b.destination,
            showOnDesktop: b.showOnDesktop ?? true,
            showOnMobile: b.showOnMobile ?? true,
            showInEnglish: b.showInEnglish ?? true,
            showInSpanish: b.showInSpanish ?? true,
          })),
          sideButtonsPosition: (ws?.sideButtonsPosition as "bottom" | "center") ?? "bottom",
          openOnLoad: ws?.openOnLoad ?? false,
          googleAdsConversionId: ws?.googleAdsConversionId ?? "",
          googleAdsConversionLabel: ws?.googleAdsConversionLabel ?? "",
          callRailUseDynamicNumber: ws?.callRailUseDynamicNumber ?? false,
          callRailSwapWaitMs: ws?.callRailSwapWaitMs ?? 800,
          callRailDynamicNumberSelector: ws?.callRailDynamicNumberSelector ?? "",
          defaultPhoneCountry: (ws?.defaultPhoneCountry as "US" | "MX") ?? "US",
        }}
      />
    </div>
  );
}
