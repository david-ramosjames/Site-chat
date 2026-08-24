import type { Lead, NotificationSettings } from "@prisma/client";

// CallRail Form Capture API client.
// Docs: https://apidocs.callrail.com/#form-submissions

export type CallRailContext = {
  /** Where the chat lived when the visitor submitted (full URL). */
  formUrl?: string | null;
  /** First page in the visitor's session (sessionStorage-persisted by widget). */
  landingPage?: string | null;
  /** First-touch document.referrer (a URL). Mapped to CallRail's source name. */
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  gclid?: string | null;
  msclkid?: string | null;
  /** Meta / Facebook click id. CallRail has no top-level slot so it goes in form_data. */
  fbclid?: string | null;
  /** TikTok click id. */
  ttclid?: string | null;
  /** Google Ads iOS web-to-app click ids. */
  wbraid?: string | null;
  gbraid?: string | null;
  /** Nextdoor click id. */
  ndclid?: string | null;
  /** CallRail session id (window.CallTrk session). Links chat conversion to the call session. */
  trackerSession?: string | null;
  /** Original answer payload for the lead (becomes form_data on CallRail). */
  answers?: Record<string, unknown> | null;
  /** Default phone country for E.164 normalisation ("US" | "MX"). */
  defaultPhoneCountry?: "US" | "MX" | null;
};

export type CallRailResult = {
  ok: boolean;
  formSubmissionId?: string;
  error?: string;
};

const PAID_MEDIUMS = new Set([
  "cpc",
  "ppc",
  "paid",
  "paidsearch",
  "paid_search",
  "display",
  "video",
  "cpm",
  "cpv",
]);

function hostnameOf(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return null;
  }
}

function isHttpUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * CallRail's Form Capture `referrer` field is a SOURCE NAME
 * (`google_paid`, `google_organic`, `direct`), not document.referrer.
 * Sending the referring URL here is why the dashboard Source column
 * showed `https://www.google.com/` instead of "Google Ads".
 *
 * Native CallRail forms inherit the swap.js session, which already
 * classified the visit. External Form POSTs have to send the name
 * ourselves — CallRail then pretty-prints `google_paid` as "Google Ads".
 */
export function callRailReferrerName(ctx: CallRailContext): string {
  const source = (ctx.utmSource || "").trim().toLowerCase();
  const medium = (ctx.utmMedium || "").trim().toLowerCase();
  const paid = PAID_MEDIUMS.has(medium);

  if (ctx.gclid || ctx.gbraid || ctx.wbraid) return "google_paid";
  if (ctx.msclkid) return "bing_paid";
  if (ctx.fbclid) return "facebook";
  if (ctx.ttclid) return "tiktok";
  if (ctx.ndclid) return "nextdoor";

  if (source === "google" || source === "adwords" || source === "google ads") {
    if (medium === "ai_overview") return "google";
    return paid ? "google_paid" : "google_organic";
  }
  if (source === "bing" || source === "microsoft" || source === "msn") {
    return paid ? "bing_paid" : "bing_organic";
  }
  if (
    source === "facebook" ||
    source === "fb" ||
    source === "meta" ||
    source === "instagram" ||
    source === "ig"
  ) {
    return "facebook";
  }
  if (source === "tiktok") return "tiktok";
  if (source === "youtube") return paid ? "google_paid" : "youtube";
  if (source) return source.replace(/\s+/g, "_");

  const host = hostnameOf(ctx.referrer);
  if (!host) return "direct";
  if (
    host === "googleadservices.com" ||
    host === "googlesyndication.com" ||
    host === "doubleclick.net" ||
    host.endsWith(".doubleclick.net")
  ) {
    return "google_paid";
  }
  if (host === "google.com" || host.endsWith(".google.com")) return "google_organic";
  if (host === "bing.com" || host.endsWith(".bing.com")) return "bing_organic";
  if (
    host.includes("facebook.com") ||
    host.includes("instagram.com") ||
    host === "l.facebook.com"
  ) {
    return "facebook";
  }
  if (host.includes("tiktok.com")) return "tiktok";
  if (host.includes("youtube.com") || host === "youtu.be") return "youtube";
  if (host.includes("yahoo.")) return "yahoo";
  if (host.includes("duckduckgo.")) return "duckduckgo";
  if (
    host.includes("chatgpt.com") ||
    host.includes("openai.com") ||
    host.includes("perplexity.ai") ||
    host.includes("claude.ai")
  ) {
    return "ai_search";
  }
  return host;
}

/**
 * CallRail's `referring_url` is the referring entity's URL (document.referrer),
 * not the page the form lived on — that's `form_url`.
 */
export function callRailReferringUrl(ctx: CallRailContext, fallback: string): string {
  if (isHttpUrl(ctx.referrer)) return ctx.referrer as string;
  return fallback;
}

/**
 * Make sure click IDs CallRail uses to classify "Google Ads" are visible
 * on the landing page URL, even if the stored landing URL had them stripped.
 */
export function callRailLandingPageUrl(ctx: CallRailContext, fallback: string): string {
  const raw = ctx.landingPage || fallback;
  try {
    const u = new URL(raw);
    const ids: Array<[string, string | null | undefined]> = [
      ["gclid", ctx.gclid],
      ["gbraid", ctx.gbraid],
      ["wbraid", ctx.wbraid],
      ["msclkid", ctx.msclkid],
      ["fbclid", ctx.fbclid],
      ["ttclid", ctx.ttclid],
      ["ndclid", ctx.ndclid],
    ];
    for (const [key, value] of ids) {
      if (value && !u.searchParams.has(key)) u.searchParams.set(key, value);
    }
    return u.toString();
  } catch {
    return raw;
  }
}

/**
 * Submits a completed lead to CallRail's Form Capture API.
 * Returns { ok: true, formSubmissionId } on success.
 * Errors are caught and logged; never throws.
 */
export async function postToCallRail(
  lead: Lead,
  settings: NotificationSettings,
  ctx: CallRailContext
): Promise<CallRailResult> {
  const accountId = settings.callRailAccountId?.trim();
  const companyId = settings.callRailCompanyId?.trim();
  const apiKey = settings.callRailApiKey?.trim();
  if (!accountId || !apiKey) return { ok: false, error: "missing_credentials" };

  // CallRail's required: form_url AND (email OR phone_number) inside form_data.
  const formUrl = ctx.formUrl || ctx.landingPage || "https://unknown";
  const phone = normalizePhone(lead.phone, ctx.defaultPhoneCountry || "US") || undefined;
  const email = (lead.email || "").trim() || undefined;
  if (!phone && !email) {
    return { ok: false, error: "missing_phone_or_email" };
  }

  // form_data is a flat object of field name -> value. CallRail expects
  // name / phone_number / email here (NOT at the top level of the
  // submission), alongside any custom fields. Use snake_case keys for
  // the structured fields so they round-trip cleanly into CallRail's
  // lead record.
  const formData: Record<string, string> = {};
  if (lead.name) formData["name"] = lead.name;
  if (phone) formData["phone_number"] = phone;
  if (email) formData["email"] = email;
  if (lead.serviceRequested) formData["Service requested"] = lead.serviceRequested;
  if (lead.qualified) formData["Qualified"] = lead.qualified;
  if (lead.referral) formData["Referral"] = lead.referral;
  // Click IDs CallRail doesn't have top-level slots for. Drop them in
  // form_data so they round-trip as searchable custom fields on the
  // CallRail lead and stay attached to whatever call/text follows.
  if (ctx.msclkid) formData["msclkid"] = ctx.msclkid;
  if (ctx.fbclid) formData["fbclid"] = ctx.fbclid;
  if (ctx.ttclid) formData["ttclid"] = ctx.ttclid;
  if (ctx.wbraid) formData["wbraid"] = ctx.wbraid;
  if (ctx.gbraid) formData["gbraid"] = ctx.gbraid;
  if (ctx.ndclid) formData["ndclid"] = ctx.ndclid;
  if (ctx.answers) {
    for (const [key, value] of Object.entries(ctx.answers)) {
      if (value == null) continue;
      const str = typeof value === "string" ? value : JSON.stringify(value);
      // Don't double-add fields already promoted to first-class form keys.
      if (["name", "phone", "email"].includes(key)) continue;
      const niceKey = key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
      if (!(niceKey in formData)) formData[niceKey] = str.slice(0, 500);
    }
  }

  // Everything sits under `form_submission`. CallRail rejects requests
  // that send name/phone_number/email/form_id/company_id at the top
  // level with an opaque {"errors":{}} 400.
  const submission: Record<string, unknown> = {
    form_url: formUrl,
    form_data: formData,
  };
  if (companyId) submission["company_id"] = companyId;

  // CallRail requires either session_id, or all three of referrer +
  // referring_url + landing_page_url. Send session_id when we have it
  // and ALWAYS send the trio as a fallback so the request never 400s
  // with "either session_id or all 3 of … are required".
  //
  // `referrer` must be a source name (google_paid), NOT document.referrer.
  // `referring_url` is the actual referring URL. Mixing those up makes
  // CallRail's Source column print https://www.google.com/ instead of
  // "Google Ads". Native CallRail forms avoid this because swap.js
  // already classified the session.
  if (ctx.trackerSession) submission["session_id"] = ctx.trackerSession;
  submission["referrer"] = callRailReferrerName(ctx);
  submission["referring_url"] = callRailReferringUrl(ctx, formUrl);
  submission["landing_page_url"] = callRailLandingPageUrl(ctx, formUrl);

  if (ctx.gclid) submission["gclid"] = ctx.gclid;
  if (ctx.utmSource) submission["utm_source"] = ctx.utmSource;
  if (ctx.utmMedium) submission["utm_medium"] = ctx.utmMedium;
  if (ctx.utmCampaign) submission["utm_campaign"] = ctx.utmCampaign;
  if (ctx.utmTerm) submission["utm_term"] = ctx.utmTerm;
  if (ctx.utmContent) submission["utm_content"] = ctx.utmContent;
  if (settings.callRailFormId) submission["form_id"] = settings.callRailFormId;

  const body = { form_submission: submission };

  const url = `https://api.callrail.com/v3/a/${encodeURIComponent(accountId)}/form_submissions.json`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Token token="${apiKey}"`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const text = await res.text().catch(() => "");
    if (!res.ok) {
      // Dump the payload (without secrets) alongside the response so we
      // can diagnose CallRail's frustratingly opaque {"errors":{}} 400s.
      console.warn(
        `CallRail form_submissions returned ${res.status}: ${text}\n` +
          `payload: ${JSON.stringify(body)}`
      );
      return { ok: false, error: `${res.status}` };
    }
    let parsed: { id?: string } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      // CallRail sometimes returns a non-JSON success body; non-fatal.
    }
    console.log(
      `CallRail form_submissions OK (${res.status}) submission_id=${parsed.id ?? "?"}`
    );
    return { ok: true, formSubmissionId: parsed.id };
  } catch (err) {
    console.warn("CallRail form_submissions failed:", err);
    return { ok: false, error: "network_error" };
  }
}

/**
 * Normalise the visitor's phone into CallRail-friendly E.164. CallRail
 * accepts E.164 (+15125550100) reliably; bare numbers tend to bounce
 * silently. The country picks the implicit prefix for 10-digit input:
 *   - US → +1
 *   - MX → +52
 * Existing + prefixes and 11-digit US (leading 1) / 12-digit MX
 * (leading 52) inputs are preserved.
 */
function normalizePhone(
  raw: string | null | undefined,
  country: "US" | "MX" = "US"
): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return "";
  if (hasPlus) return "+" + digits;
  if (country === "MX") {
    if (digits.length === 10) return "+52" + digits;
    if (digits.length === 12 && digits.startsWith("52")) return "+" + digits;
    if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
    return digits;
  }
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  return digits;
}
