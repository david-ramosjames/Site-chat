// Derive standard UTM-style attribution from ad-platform signals when the
// visitor didn't land on a URL with explicit utm_* params. Google Ads
// auto-tagging fires `gclid` (no UTM); Google Ads "manual tagging" puts
// ValueTrack params on the URL — campaignid, adgroupid, creative, keyword,
// network, device. Microsoft Ads → msclkid, Meta → fbclid, TikTok → ttclid.
// Explicit utm_* values always take precedence over derived ones.

export type AttributionInput = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  gclid: string | null;
  msclkid: string | null;
  fbclid: string | null;
  ttclid: string | null;
  wbraid: string | null;
  gbraid: string | null;
  ndclid: string | null;
  landingPageUrl: string | null;
};

export type DerivedAttribution = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
};

function parseLandingParams(url: string | null): Record<string, string> {
  if (!url) return {};
  try {
    const u = new URL(url);
    const params: Record<string, string> = {};
    u.searchParams.forEach((v, k) => {
      params[k.toLowerCase()] = v;
    });
    return params;
  } catch {
    return {};
  }
}

// Google Ads "network" ValueTrack maps to medium hints:
//   g = Google search   → cpc
//   s = search partner  → cpc
//   d = Display Network → display
//   u = Smart Shopping  → cpc
//   ytv = YouTube video → video
function googleMediumFromNetwork(network: string | undefined): string {
  switch ((network || "").toLowerCase()) {
    case "d":
      return "display";
    case "ytv":
    case "ytc":
      return "video";
    default:
      return "cpc";
  }
}

export function deriveAttribution(input: AttributionInput): DerivedAttribution {
  const lp = parseLandingParams(input.landingPageUrl);

  // utm_source: explicit > click-id-derived
  let utmSource = input.utmSource;
  if (!utmSource) {
    if (input.gclid || input.gbraid || input.wbraid) utmSource = "google";
    else if (input.msclkid) utmSource = "bing";
    else if (input.fbclid) utmSource = "facebook";
    else if (input.ttclid) utmSource = "tiktok";
  }

  // utm_medium: explicit > click-id-derived (with Google network hint)
  let utmMedium = input.utmMedium;
  if (!utmMedium) {
    if (input.gclid || input.gbraid || input.wbraid) {
      utmMedium = googleMediumFromNetwork(lp.network);
    } else if (input.msclkid) {
      utmMedium = "cpc";
    } else if (input.fbclid || input.ttclid) {
      utmMedium = "social";
    }
  }

  // utm_campaign: explicit > Google's campaignid > generic campaign param
  let utmCampaign = input.utmCampaign;
  if (!utmCampaign) {
    utmCampaign =
      lp.campaignid ||
      lp.gad_campaignid ||
      lp.campaign ||
      null;
  }

  // utm_term: explicit > Google's keyword param
  let utmTerm = input.utmTerm;
  if (!utmTerm) {
    utmTerm = lp.keyword || lp.term || null;
  }

  // utm_content: explicit > Google's creative > adgroupid
  let utmContent = input.utmContent;
  if (!utmContent) {
    utmContent = lp.creative || lp.adgroupid || lp.content || null;
  }

  return { utmSource, utmMedium, utmCampaign, utmTerm, utmContent };
}
