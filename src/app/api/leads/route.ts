import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsPreflight, withCors } from "@/lib/cors";
import { leadSubmissionSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { looksLikeSpam } from "@/lib/spam";
import { sendLeadNotifications } from "@/lib/notifications";
import { postToCallRail } from "@/lib/callrail";
import { generateLeadIntelligence } from "@/lib/lead-intelligence";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  if (!rateLimit(`lead:${ip}`, 10, 60_000).ok) {
    return withCors(NextResponse.json({ error: "rate_limited" }, { status: 429 }));
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return withCors(NextResponse.json({ error: "invalid_json" }, { status: 400 }));
  }

  const parsed = leadSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return withCors(
      NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 })
    );
  }
  const payload = parsed.data;

  const client = await prisma.client.findUnique({
    where: { id: payload.clientId },
    include: {
      featureToggles: true,
      notificationSettings: true,
      flowSteps: true,
      widgetSettings: true,
    },
  });
  if (!client || client.status !== "active") {
    return withCors(NextResponse.json({ error: "unknown_client" }, { status: 404 }));
  }

  const a = payload.answers as Record<string, unknown>;
  const pick = (k: string | undefined | null) =>
    k && typeof a[k] === "string" ? (a[k] as string) : undefined;

  // Build the lead column → step lookup from the flow's per-step
  // leadField setting. Falls back to legacy stepKey-name conventions
  // when no step has explicitly claimed a column. Invert flips
  // yes/no answers before storing — useful for "Do you have an
  // attorney?" where No means qualified=yes.
  const stepByColumn: Record<string, (typeof client.flowSteps)[number]> = {};
  client.flowSteps.forEach((s) => {
    if (s.leadField && !stepByColumn[s.leadField]) stepByColumn[s.leadField] = s;
  });
  function fromColumn(col: string, ...legacyKeys: string[]) {
    const mapped = stepByColumn[col];
    if (mapped) {
      const raw = pick(mapped.stepKey);
      // Per-answer override (yes_no steps): if the admin set
      // leadFieldOnYes / leadFieldOnNo, use that value instead of the raw
      // answer. Empty string means "leave the column blank".
      if (raw === "yes" && mapped.leadFieldOnYes != null) {
        return mapped.leadFieldOnYes || undefined;
      }
      if (raw === "no" && mapped.leadFieldOnNo != null) {
        return mapped.leadFieldOnNo || undefined;
      }
      if (raw !== undefined) return raw;
    }
    return legacyKeys.map((k) => pick(k)).find((v) => v !== undefined);
  }

  const name = fromColumn("name", "name");
  const phone = fromColumn("phone", "phone");
  const email = fromColumn("email", "email");
  const serviceRequested = fromColumn(
    "service",
    "service",
    "serviceRequested",
    "matter_type",
    "service_type",
    "request_type"
  );
  const qualified = fromColumn("qualified");
  const referral = fromColumn("referral");

  const spam =
    client.featureToggles?.enableSpamProtection &&
    looksLikeSpam({ name, email, notes: pick("notes") });

  const lead = await prisma.lead.create({
    data: {
      clientId: client.id,
      name,
      phone,
      email,
      serviceRequested,
      qualified,
      referral,
      status: spam ? "spam" : "new",
      sourceUrl: client.featureToggles?.collectPageUrl ? payload.sourceUrl ?? null : null,
      referrer: client.featureToggles?.collectReferrer ? payload.referrer ?? null : null,
      utmSource: client.featureToggles?.collectUtm ? payload.utm?.source ?? null : null,
      utmMedium: client.featureToggles?.collectUtm ? payload.utm?.medium ?? null : null,
      utmCampaign: client.featureToggles?.collectUtm ? payload.utm?.campaign ?? null : null,
      utmTerm: client.featureToggles?.collectUtm ? payload.utm?.term ?? null : null,
      utmContent: client.featureToggles?.collectUtm ? payload.utm?.content ?? null : null,
      gclid: payload.gclid ?? null,
      msclkid: payload.msclkid ?? null,
      fbclid: payload.fbclid ?? null,
      ttclid: payload.ttclid ?? null,
      wbraid: payload.wbraid ?? null,
      gbraid: payload.gbraid ?? null,
      ndclid: payload.ndclid ?? null,
      landingPageUrl: payload.landingPageUrl ?? null,
      callrailSessionId: payload.callrailSessionId ?? null,
      userAgent: payload.userAgent ?? null,
      answers: payload.answers as object,
      transcript: payload.transcript as object,
    },
  });

  if (!spam) {
    void generateLeadIntelligence({
      businessName: client.name,
      serviceRequested,
      qualified,
      referral,
      answers: payload.answers as Record<string, unknown>,
      transcript: payload.transcript,
      features: client.featureToggles,
    })
      .then((intelligence) => {
        if (!intelligence) return null;
        return prisma.lead.update({
          where: { id: lead.id },
          data: {
            ...(intelligence.aiSummary !== undefined
              ? { aiSummary: intelligence.aiSummary }
              : {}),
            ...(intelligence.leadScore !== undefined
              ? { leadScore: intelligence.leadScore }
              : {}),
          },
        });
      })
      .catch((e) => console.warn("Lead intelligence failed:", e));

    await sendLeadNotifications(lead, client.notificationSettings, client.name).catch((e) =>
      console.warn("Notification dispatch failed:", e)
    );

    // Forward to CallRail if configured. Runs alongside Slack/email/webhook
    // dispatch — never blocks lead creation, errors only logged.
    if (
      !client.notificationSettings?.callRailAccountId ||
      !client.notificationSettings?.callRailApiKey
    ) {
      console.log(
        `CallRail skipped for client ${client.id}: ` +
          `missing ${!client.notificationSettings?.callRailAccountId ? "accountId" : "apiKey"}`
      );
    } else {
      const result = await postToCallRail(lead, client.notificationSettings, {
        formUrl: payload.sourceUrl ?? null,
        landingPage: payload.landingPageUrl ?? null,
        referrer: payload.referrer ?? null,
        utmSource: payload.utm?.source ?? null,
        utmMedium: payload.utm?.medium ?? null,
        utmCampaign: payload.utm?.campaign ?? null,
        utmTerm: payload.utm?.term ?? null,
        utmContent: payload.utm?.content ?? null,
        gclid: payload.gclid ?? null,
        msclkid: payload.msclkid ?? null,
        fbclid: payload.fbclid ?? null,
        ttclid: payload.ttclid ?? null,
        wbraid: payload.wbraid ?? null,
        gbraid: payload.gbraid ?? null,
        ndclid: payload.ndclid ?? null,
        trackerSession: payload.callrailSessionId ?? null,
        answers: payload.answers as Record<string, unknown>,
        defaultPhoneCountry:
          (client.widgetSettings?.defaultPhoneCountry as "US" | "MX" | undefined) ?? "US",
      });
      if (result.ok && result.formSubmissionId) {
        await prisma.lead
          .update({
            where: { id: lead.id },
            data: { callrailFormSubmissionId: result.formSubmissionId },
          })
          .catch((e) => console.warn("Saving CallRail submission id failed:", e));
      }
    }
  }

  return withCors(NextResponse.json({ ok: true, leadId: lead.id }));
}
