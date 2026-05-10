import type { FeatureToggles } from "@prisma/client";

export function publicFeatureToggles(features: FeatureToggles | null) {
  if (!features) return null;
  return {
    showProgress: features.showProgress,
    allowFileUpload: features.allowFileUpload,
    collectUtm: features.collectUtm,
    collectPageUrl: features.collectPageUrl,
    collectReferrer: features.collectReferrer,
    enableAfterHours: features.enableAfterHours,
    enableMedia: features.enableMedia,
    enableFallbackForm: features.enableFallbackForm,
    enableSpamProtection: features.enableSpamProtection,
  };
}
