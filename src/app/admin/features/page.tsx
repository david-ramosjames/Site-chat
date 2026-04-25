import { prisma } from "@/lib/prisma";
import { DEMO_CLIENT_ID } from "@/lib/demo";
import FeaturesForm from "./FeaturesForm";

export const dynamic = "force-dynamic";

export default async function FeaturesPage() {
  const features = await prisma.featureToggles.findUnique({
    where: { clientId: DEMO_CLIENT_ID },
  });
  if (!features) return <p className="card p-8 text-sm">No feature toggles — run the seed script.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Feature toggles</h1>
        <p className="text-sm text-ink-500">Turn ChatToConvert behaviors on and off per client.</p>
      </div>
      <FeaturesForm
        clientId={DEMO_CLIENT_ID}
        initial={{
          showProgress: features.showProgress,
          allowFileUpload: features.allowFileUpload,
          collectUtm: features.collectUtm,
          collectPageUrl: features.collectPageUrl,
          collectReferrer: features.collectReferrer,
          enableAiSummary: features.enableAiSummary,
          enableLeadScoring: features.enableLeadScoring,
          enableAfterHours: features.enableAfterHours,
          enableSmsAlerts: features.enableSmsAlerts,
          enableEmailAlerts: features.enableEmailAlerts,
          enableSlackAlerts: features.enableSlackAlerts,
          enableGoogleSheetSync: features.enableGoogleSheetSync,
          enableCrmWebhook: features.enableCrmWebhook,
          enableMedia: features.enableMedia,
          enableFallbackForm: features.enableFallbackForm,
          enableSpamProtection: features.enableSpamProtection,
        }}
      />
    </div>
  );
}
