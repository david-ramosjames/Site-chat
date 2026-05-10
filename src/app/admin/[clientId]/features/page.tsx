import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FeaturesForm from "./FeaturesForm";

export const dynamic = "force-dynamic";

const DEFAULTS = {
  showProgress: true,
  allowFileUpload: false,
  collectUtm: true,
  collectPageUrl: true,
  collectReferrer: true,
  enableAiSummary: false,
  enableLeadScoring: false,
  llmProvider: "openai",
  llmModel: "gpt-4o-mini",
  enableAfterHours: false,
  enableSmsAlerts: false,
  enableEmailAlerts: true,
  enableSlackAlerts: false,
  enableGoogleSheetSync: false,
  enableCrmWebhook: false,
  enableMedia: true,
  enableFallbackForm: true,
  enableSpamProtection: true,
};

function llmProvider(value?: string | null): "openai" | "anthropic" | "custom" {
  return value === "anthropic" || value === "custom" ? value : "openai";
}

export default async function FeaturesPage({ params }: { params: { clientId: string } }) {
  const client = await prisma.client.findUnique({ where: { id: params.clientId } });
  if (!client) notFound();

  const features = await prisma.featureToggles.findUnique({
    where: { clientId: params.clientId },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Feature toggles</h2>
        <p className="text-sm text-ink-500">Turn RJL-Chat behaviors on and off for this business.</p>
      </div>
      <FeaturesForm
        clientId={params.clientId}
        initial={{
          showProgress: features?.showProgress ?? DEFAULTS.showProgress,
          allowFileUpload: features?.allowFileUpload ?? DEFAULTS.allowFileUpload,
          collectUtm: features?.collectUtm ?? DEFAULTS.collectUtm,
          collectPageUrl: features?.collectPageUrl ?? DEFAULTS.collectPageUrl,
          collectReferrer: features?.collectReferrer ?? DEFAULTS.collectReferrer,
          enableAiSummary: features?.enableAiSummary ?? DEFAULTS.enableAiSummary,
          enableLeadScoring: features?.enableLeadScoring ?? DEFAULTS.enableLeadScoring,
          llmProvider: llmProvider(features?.llmProvider ?? DEFAULTS.llmProvider),
          llmModel: features?.llmModel ?? DEFAULTS.llmModel,
          llmApiKey: "",
          hasLlmApiKey: Boolean(features?.llmApiKey),
          enableAfterHours: features?.enableAfterHours ?? DEFAULTS.enableAfterHours,
          enableSmsAlerts: features?.enableSmsAlerts ?? DEFAULTS.enableSmsAlerts,
          enableEmailAlerts: features?.enableEmailAlerts ?? DEFAULTS.enableEmailAlerts,
          enableSlackAlerts: features?.enableSlackAlerts ?? DEFAULTS.enableSlackAlerts,
          enableGoogleSheetSync: features?.enableGoogleSheetSync ?? DEFAULTS.enableGoogleSheetSync,
          enableCrmWebhook: features?.enableCrmWebhook ?? DEFAULTS.enableCrmWebhook,
          enableMedia: features?.enableMedia ?? DEFAULTS.enableMedia,
          enableFallbackForm: features?.enableFallbackForm ?? DEFAULTS.enableFallbackForm,
          enableSpamProtection: features?.enableSpamProtection ?? DEFAULTS.enableSpamProtection,
        }}
      />
    </div>
  );
}
