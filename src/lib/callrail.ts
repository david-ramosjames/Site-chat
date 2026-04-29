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

  // CallRail's required: form_url AND (email OR phone_number).
  // Synthesize sensible defaults when widget didn't capture them.
  const formUrl = ctx.formUrl || ctx.landingPage || "https://unknown";
  const phone = (lead.phone || "").trim() || undefined;
  const email = (lead.email || "").trim() || undefined;
  if (!phone && !email) {
    return { ok: false, error: "missing_phone_or_email" };
  }

  // form_data is a flat object of custom field name -> value. Keep our
  // structured fields up top so they're easy to map in CallRail's UI.
  const formData: Record<string, string> = {};
  if (lead.serviceRequested) formData["Service requested"] = lead.serviceRequested;
  if (lead.qualified) formData["Qualified"] = lead.qualified;
  if (lead.referral) formData["Referral"] = lead.referral;
  if (ctx.msclkid) formData["msclkid"] = ctx.msclkid;
  if (ctx.answers) {
    for (const [key, value] of Object.entries(ctx.answers)) {
      if (value == null) continue;
      const str = typeof value === "string" ? value : JSON.stringify(value);
      // Don't double-add fields already promoted to top-level form keys.
      if (["name", "phone", "email"].includes(key)) continue;
      // Avoid clobbering the first-class fields above.
      const niceKey = key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
      if (!(niceKey in formData)) formData[niceKey] = str.slice(0, 500);
    }
  }

  const body: Record<string, unknown> = {
    form_url: formUrl,
    form_data: formData,
  };
  // company_id is required by CallRail's Form Capture API.
  if (companyId) body["company_id"] = companyId;
  if (lead.name) body["name"] = lead.name;
  if (phone) body["phone_number"] = phone;
  if (email) body["email"] = email;
  if (ctx.referrer) body["referrer"] = ctx.referrer;
  if (ctx.landingPage) body["landing_page"] = ctx.landingPage;
  if (ctx.gclid) body["gclid"] = ctx.gclid;
  if (ctx.utmSource) body["utm_source"] = ctx.utmSource;
  if (ctx.utmMedium) body["utm_medium"] = ctx.utmMedium;
  if (ctx.utmCampaign) body["utm_campaign"] = ctx.utmCampaign;
  if (ctx.utmTerm) body["utm_term"] = ctx.utmTerm;
  if (ctx.utmContent) body["utm_content"] = ctx.utmContent;
  if (ctx.trackerSession) body["tracker_session"] = ctx.trackerSession;
  if (settings.callRailFormId) body["form_id"] = settings.callRailFormId;

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
      console.warn(`CallRail form_submissions returned ${res.status}: ${text}`);
      return { ok: false, error: `${res.status}` };
    }
    let parsed: { id?: string } = {};
    try {
      parsed = JSON.parse(text);
    } catch {
      // CallRail sometimes returns a non-JSON success body; non-fatal.
    }
    return { ok: true, formSubmissionId: parsed.id };
  } catch (err) {
    console.warn("CallRail form_submissions failed:", err);
    return { ok: false, error: "network_error" };
  }
}
