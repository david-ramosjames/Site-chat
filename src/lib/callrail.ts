import type { Lead, NotificationSettings } from "@prisma/client";

// CallRail Form Capture API client.
// Docs: https://apidocs.callrail.com/#form-submissions

export type CallRailContext = {
  /** Where the chat lived when the visitor submitted (full URL). */
  formUrl?: string | null;
  /** First page in the visitor's session (sessionStorage-persisted by widget). */
  landingPage?: string | null;
  /** document.referrer at submit time. */
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  gclid?: string | null;
  msclkid?: string | null;
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
  if (ctx.msclkid) formData["msclkid"] = ctx.msclkid;
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
  // with "either session_id or all 3 of … are required". Use formUrl
  // as the safe default when a specific URL is missing.
  if (ctx.trackerSession) submission["session_id"] = ctx.trackerSession;
  submission["referrer"] = ctx.referrer || formUrl;
  submission["referring_url"] = formUrl;
  submission["landing_page_url"] = ctx.landingPage || formUrl;

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
