import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsPreflight, withCors } from "@/lib/cors";
import { leadSubmissionSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";
import { looksLikeSpam } from "@/lib/spam";
import { sendLeadNotifications } from "@/lib/notifications";

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
    include: { featureToggles: true, notificationSettings: true, flowSteps: true },
  });
  if (!client || client.status !== "active") {
    return withCors(NextResponse.json({ error: "unknown_client" }, { status: 404 }));
  }

  const a = payload.answers as Record<string, unknown>;
  const pick = (k: string | undefined | null) =>
    k && typeof a[k] === "string" ? (a[k] as string) : undefined;

  // Build the lead column → stepKey map from the flow's per-step
  // leadField setting. Falls back to legacy stepKey-name conventions
  // when no step has explicitly claimed a column.
  const fieldMap: Record<string, string> = {};
  client.flowSteps.forEach((s) => {
    if (s.leadField && !fieldMap[s.leadField]) fieldMap[s.leadField] = s.stepKey;
  });
  const fromMap = (col: string, ...legacyKeys: string[]) =>
    pick(fieldMap[col]) ?? legacyKeys.map((k) => pick(k)).find((v) => v !== undefined);

  const name = fromMap("name", "name");
  const phone = fromMap("phone", "phone");
  const email = fromMap("email", "email");
  const serviceRequested = fromMap(
    "service",
    "service",
    "serviceRequested",
    "matter_type",
    "service_type",
    "request_type"
  );
  const urgency = fromMap(
    "urgency",
    "urgency",
    "incident_when",
    "when",
    "timing",
    "pickup_date"
  );

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
      urgency,
      status: spam ? "spam" : "new",
      sourceUrl: client.featureToggles?.collectPageUrl ? payload.sourceUrl ?? null : null,
      referrer: client.featureToggles?.collectReferrer ? payload.referrer ?? null : null,
      utmSource: client.featureToggles?.collectUtm ? payload.utm?.source ?? null : null,
      utmMedium: client.featureToggles?.collectUtm ? payload.utm?.medium ?? null : null,
      utmCampaign: client.featureToggles?.collectUtm ? payload.utm?.campaign ?? null : null,
      userAgent: payload.userAgent ?? null,
      answers: payload.answers as object,
      transcript: payload.transcript as object,
    },
  });

  if (!spam) {
    await sendLeadNotifications(lead, client.notificationSettings, client.name).catch((e) =>
      console.warn("Notification dispatch failed:", e)
    );
  }

  return withCors(NextResponse.json({ ok: true, leadId: lead.id }));
}
