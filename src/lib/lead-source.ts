import { callRailReferrerName, type CallRailContext } from "./callrail";

export type LeadSourceInput = {
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  gclid?: string | null;
  msclkid?: string | null;
  fbclid?: string | null;
  ttclid?: string | null;
  wbraid?: string | null;
  gbraid?: string | null;
  ndclid?: string | null;
  referrer?: string | null;
};

const PRETTY_NAME: Record<string, string> = {
  google_paid: "Google Ads",
  google_organic: "Google Organic",
  bing_paid: "Microsoft Ads",
  bing_organic: "Bing Organic",
  facebook: "Facebook",
  tiktok: "TikTok",
  youtube: "YouTube",
  nextdoor: "Nextdoor",
  yahoo: "Yahoo",
  duckduckgo: "DuckDuckGo",
  ai_search: "AI search",
  google: "Google",
  direct: "Direct",
};

/**
 * One-line source for Slack (and similar). Prefers paid click IDs and
 * UTM, then the referring site. Organic Google (referrer=google.com,
 * no gclid/UTM) shows as "Google Organic" instead of a blank UTM line.
 */
export function leadSourceLabel(lead: LeadSourceInput): string {
  const medium = (lead.utmMedium || "").trim().toLowerCase();
  if (medium === "ai_overview") return withCampaign("Google AI Overview", lead.utmCampaign);

  const ctx: CallRailContext = {
    utmSource: lead.utmSource,
    utmMedium: lead.utmMedium,
    gclid: lead.gclid,
    msclkid: lead.msclkid,
    fbclid: lead.fbclid,
    ttclid: lead.ttclid,
    wbraid: lead.wbraid,
    gbraid: lead.gbraid,
    ndclid: lead.ndclid,
    referrer: lead.referrer,
  };
  const key = callRailReferrerName(ctx);
  const pretty = PRETTY_NAME[key] ?? key.replace(/_/g, " ");
  return withCampaign(pretty, key === "direct" ? null : lead.utmCampaign);
}

function withCampaign(label: string, campaign: string | null | undefined): string {
  const c = (campaign || "").trim();
  return c ? `${label} · ${c}` : label;
}
