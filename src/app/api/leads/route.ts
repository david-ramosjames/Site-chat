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
    include: { featureToggles: true, notificationSettings: true },
  });
  if (!client || client.status !== "active") {
    return withCors(NextResponse.json({ error: "unknown_client" }, { status: 404 }));
  }

  const a = payload.answers as Record<string, unknown>;
  const pick = (k: string) => (typeof a[k] === "string" ? (a[k] as string) : undefined);

  const spam =
    client.featureToggles?.enableSpamProtection &&
    looksLikeSpam({ name: pick("name"), email: pick("email"), notes: pick("notes") });

  const serviceRequested = pick("service") ?? pick("serviceRequested");
  const urgency = pick("urgency");

  const lead = await prisma.lead.create({
    data: {
      clientId: client.id,
      name: pick("name"),
      phone: pick("phone"),
      email: pick("email"),
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
