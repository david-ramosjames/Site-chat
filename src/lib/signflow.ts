// Sign Flow sits in front of DocuSeal. We POST its intake API; it creates a
// pre-filled submission and returns a signing URL. Env (Railway, server-only):
//   SIGNFLOW_BASE_URL     e.g. https://ramos-james-law-document.up.railway.app
//   SIGNFLOW_INTAKE_TOKEN shared bearer (must match Sign Flow's token)

export type SigningConfig = {
  mode?: "embed" | "redirect" | "newtab" | null;
  url?: string | null;
  templateIdEn?: string | null;
  templateIdEs?: string | null;
  dateOfLossKey?: string | null;
  buttonLabel?: string | null;
};

export type SignFlowStep = {
  stepKey: string;
  inputType: string;
  leadField?: string | null;
  signing?: SigningConfig | null;
};

export type SignContact = {
  clientName: string;
  phone: string | null;
  email: string | null;
};

export function asSigningConfig(raw: unknown): SigningConfig | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const o = raw as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const mode = str(o.mode);
  return {
    mode: mode === "embed" || mode === "redirect" || mode === "newtab" ? mode : "newtab",
    url: str(o.url) || null,
    templateIdEn: str(o.templateIdEn) || null,
    templateIdEs: str(o.templateIdEs) || null,
    dateOfLossKey: str(o.dateOfLossKey) || null,
    buttonLabel: str(o.buttonLabel) || null,
  };
}

export function pickTemplateId(
  locale: string,
  step: SigningConfig | null | undefined,
  defaults: { templateIdEn?: string | null; templateIdEs?: string | null }
): string {
  const isEs = locale.toLowerCase().startsWith("es");
  const en = (step?.templateIdEn || defaults.templateIdEn || "").trim();
  const es = (step?.templateIdEs || defaults.templateIdEs || "").trim();
  return (isEs ? es : en) || en;
}

export function extractSignContact(
  steps: SignFlowStep[],
  answers: Record<string, unknown>
): SignContact {
  const pick = (pred: (s: SignFlowStep) => boolean) => {
    for (const s of steps) {
      if (!pred(s)) continue;
      const v = answers[s.stepKey];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return null;
  };

  const byField = (field: string, ...legacyKeys: string[]) => {
    const fromCol = pick((s) => s.leadField === field);
    if (fromCol) return fromCol;
    for (const k of legacyKeys) {
      const v = answers[k];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return null;
  };

  const name =
    byField("name", "name", "full_name", "first_name", "clientName") || "";
  const phone = byField("phone", "phone") || pick((s) => s.inputType === "phone");
  const email = byField("email", "email") || pick((s) => s.inputType === "email");

  return { clientName: name, phone, email };
}

export function extractDateOfLoss(
  steps: SignFlowStep[],
  answers: Record<string, unknown>,
  dateOfLossKey?: string | null
): string | null {
  const key =
    (dateOfLossKey || "").trim() ||
    steps.find((s) => s.inputType === "date")?.stepKey ||
    "";
  if (!key) return null;
  const v = answers[key];
  if (typeof v !== "string" || !v.trim()) return null;
  const trimmed = v.trim();
  const iso = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
  return iso ? iso[1] : trimmed;
}

/** Best-effort E.164 for Sign Flow. Bare 10-digit US numbers get +1. */
export function phoneToE164(raw: string | null | undefined, country: "US" | "MX" = "US"): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/[^\d]/g, "");
  if (!digits) return null;
  if (hasPlus) return "+" + digits;
  if (country === "MX") {
    if (digits.length === 10) return "+52" + digits;
    if (digits.length === 12 && digits.startsWith("52")) return "+" + digits;
    return digits.length ? "+" + digits : null;
  }
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  return digits ? "+" + digits : null;
}

export type CreateSigningResult =
  | { ok: true; signingUrl: string; via: "signflow" | "static" }
  | { ok: false; error: string; status: number };

export async function createSigningUrl(opts: {
  locale: string;
  answers: Record<string, unknown>;
  steps: SignFlowStep[];
  signing: SigningConfig | null;
  defaults: { templateIdEn?: string | null; templateIdEs?: string | null };
  phoneCountry?: "US" | "MX";
  source?: string;
}): Promise<CreateSigningResult> {
  const locale = opts.locale || "en";
  const isEs = locale.toLowerCase().startsWith("es");
  const templateId = pickTemplateId(locale, opts.signing, opts.defaults);
  const fallbackUrl = (opts.signing?.url || "").trim();
  const base = (process.env.SIGNFLOW_BASE_URL || "").trim().replace(/\/+$/, "");
  const token = (process.env.SIGNFLOW_INTAKE_TOKEN || "").trim();

  if (!templateId || !base || !token) {
    if (fallbackUrl) return { ok: true, signingUrl: fallbackUrl, via: "static" };
    return {
      ok: false,
      error: "Signing isn’t configured.",
      status: 400,
    };
  }

  const contact = extractSignContact(opts.steps, opts.answers);
  const dateOfLoss = extractDateOfLoss(opts.steps, opts.answers, opts.signing?.dateOfLossKey);
  const phone = phoneToE164(contact.phone, opts.phoneCountry || "US");

  try {
    const res = await fetch(`${base}/api/intake`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        clientName: contact.clientName,
        phone,
        email: contact.email,
        language: isEs ? "es" : "en",
        templateId,
        dateOfLoss,
        source: opts.source || "chat",
        sendSms: false,
        sendEmail: false,
        reminderEnabled: true,
      }),
    });
    const data = (await res.json().catch(() => ({}))) as {
      signingUrl?: string;
      error?: unknown;
    };
    if (!res.ok || !data.signingUrl) {
      const msg =
        typeof data.error === "string" ? data.error : `Sign Flow returned ${res.status}.`;
      console.error("[signflow] Sign Flow rejected", {
        templateId,
        status: res.status,
        error: data.error ?? null,
      });
      if (fallbackUrl) return { ok: true, signingUrl: fallbackUrl, via: "static" };
      return { ok: false, error: msg, status: 502 };
    }
    return { ok: true, signingUrl: data.signingUrl, via: "signflow" };
  } catch (e) {
    console.error("[signflow] could not reach Sign Flow", {
      templateId,
      base,
      error: e instanceof Error ? e.message : String(e),
    });
    if (fallbackUrl) return { ok: true, signingUrl: fallbackUrl, via: "static" };
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Could not reach Sign Flow.",
      status: 502,
    };
  }
}
