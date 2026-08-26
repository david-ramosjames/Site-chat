import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsPreflight, withCors } from "@/lib/cors";
import { leadSubmissionSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { looksLikeSpam } from "@/lib/spam";
import { sendLeadNotifications } from "@/lib/notifications";
import { postToCallRail } from "@/lib/callrail";
import { generateLeadIntelligence } from "@/lib/lead-intelligence";
import { deriveAttribution } from "@/lib/attribution";
import { asLeadFieldByOption, resolveLeadColumnValue } from "@/lib/lead-field";

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
  // when no step has explicitly claimed a column. Multiple-choice
  // options map through leadFieldByOption (e.g. "No" and "second
  // opinion" → qualified=yes); yes/no steps use leadFieldOnYes/OnNo.
  const stepByColumn: Record<string, (typeof client.flowSteps)[number]> = {};
  client.flowSteps.forEach((s) => {
    if (s.leadField && !stepByColumn[s.leadField]) stepByColumn[s.leadField] = s;
  });
  function fromColumn(col: string, ...legacyKeys: string[]) {
    const mapped = stepByColumn[col];
    if (mapped) {
      const raw = pick(mapped.stepKey);
      if (raw !== undefined) {
        return resolveLeadColumnValue(raw, {
          leadFieldOnYes: mapped.leadFieldOnYes,
          leadFieldOnNo: mapped.leadFieldOnNo,
          leadFieldByOption: asLeadFieldByOption(mapped.leadFieldByOption),
        });
      }
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

  // Fill blank utm_* fields from ad-platform signals (click IDs, Google
  // Ads ValueTrack params on the landing page). Explicit utm_* always
  // wins; this only kicks in for visitors who arrived via a campaign URL
  // without UTM tagging.
  function clickIdFromLanding(key: string): string | null {
    const url = payload.landingPageUrl ?? payload.sourceUrl ?? null;
    if (!url) return null;
    try {
      return new URL(url).searchParams.get(key);
    } catch {
      return null;
    }
  }
  const gclid = payload.gclid || clickIdFromLanding("gclid");
  const msclkid = payload.msclkid || clickIdFromLanding("msclkid");
  const fbclid = payload.fbclid || clickIdFromLanding("fbclid");
  const ttclid = payload.ttclid || clickIdFromLanding("ttclid");
  const wbraid = payload.wbraid || clickIdFromLanding("wbraid");
  const gbraid = payload.gbraid || clickIdFromLanding("gbraid");
  const ndclid = payload.ndclid || clickIdFromLanding("ndclid");
  const derived = deriveAttribution({
    utmSource: payload.utm?.source ?? null,
    utmMedium: payload.utm?.medium ?? null,
    utmCampaign: payload.utm?.campaign ?? null,
    utmTerm: payload.utm?.term ?? null,
    utmContent: payload.utm?.content ?? null,
    gclid,
    msclkid,
    fbclid,
    ttclid,
    wbraid,
    gbraid,
    ndclid,
    landingPageUrl: payload.landingPageUrl ?? null,
  });

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
      utmSource: client.featureToggles?.collectUtm ? derived.utmSource : null,
      utmMedium: client.featureToggles?.collectUtm ? derived.utmMedium : null,
      utmCampaign: client.featureToggles?.collectUtm ? derived.utmCampaign : null,
      utmTerm: client.featureToggles?.collectUtm ? derived.utmTerm : null,
      utmContent: client.featureToggles?.collectUtm ? derived.utmContent : null,
      gclid,
      msclkid,
      fbclid,
      ttclid,
      wbraid,
      gbraid,
      ndclid,
      landingPageUrl: payload.landingPageUrl ?? null,
      callrailSessionId: payload.callrailSessionId ?? null,
      chatSessionId: payload.chatSessionId ?? null,
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
        // Derived UTMs fill Google Ads auto-tagging (gclid, no utm_*).
        // CallRail's Source column is driven by `referrer` as a source
        // name (google_paid), not by these UTM fields — see callrail.ts.
        utmSource: derived.utmSource,
        utmMedium: derived.utmMedium,
        utmCampaign: derived.utmCampaign,
        utmTerm: derived.utmTerm,
        utmContent: derived.utmContent,
        gclid,
        msclkid,
        fbclid,
        ttclid,
        wbraid,
        gbraid,
        ndclid,
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
