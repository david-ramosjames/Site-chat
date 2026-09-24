import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { corsPreflight, withCors } from "@/lib/cors";
import { rateLimit } from "@/lib/rate-limit";
import {
  asSigningConfig,
  createSigningUrl,
  extractSignContact,
  type SignFlowStep,
} from "@/lib/signflow";
import { postSlackContractSent } from "@/lib/notifications";
import { findBlockedMatch } from "@/lib/find-blocked";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  clientId: z.string().min(1),
  stepKey: z.string().max(64).optional().nullable(),
  leadId: z.string().max(80).optional().nullable(),
  locale: z.string().max(12).optional().nullable(),
  answers: z.record(z.any()).default({}),
});

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  if (!rateLimit(`sign:${ip}`, 10, 60_000).ok) {
    return withCors(NextResponse.json({ error: "rate_limited" }, { status: 429 }));
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return withCors(NextResponse.json({ error: "invalid_json" }, { status: 400 }));
  }
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return withCors(NextResponse.json({ error: "invalid_payload" }, { status: 400 }));
  }
  const { clientId, stepKey, leadId, locale, answers } = parsed.data;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      widgetSettings: true,
      notificationSettings: true,
      flowSteps: { orderBy: { order: "asc" } },
    },
  });
  if (!client || client.status !== "active") {
    return withCors(NextResponse.json({ error: "unknown_client" }, { status: 404 }));
  }

  const steps: SignFlowStep[] = client.flowSteps.map((s) => ({
    stepKey: s.stepKey,
    inputType: s.inputType,
    leadField: s.leadField,
    signing: asSigningConfig(s.signing),
  }));

  const signStep =
    (stepKey ? steps.find((s) => s.stepKey === stepKey && s.inputType === "sign") : null) ||
    steps.find((s) => s.inputType === "sign") ||
    null;

  const contact = extractSignContact(steps, answers as Record<string, unknown>);
  const blocked = await findBlockedMatch(client.id, {
    name: contact.clientName,
    phone: contact.phone,
    email: contact.email,
  });
  if (blocked) {
    console.warn(
      `[blocklist] skipped signing for client ${client.id} (${blocked.kind}=${blocked.value})`
    );
    return withCors(NextResponse.json({ ok: false, blocked: true }));
  }

  const result = await createSigningUrl({
    locale: locale || "en",
    answers: answers as Record<string, unknown>,
    steps,
    signing: signStep?.signing ?? null,
    defaults: {
      templateIdEn: client.widgetSettings?.signTemplateIdEn,
      templateIdEs: client.widgetSettings?.signTemplateIdEs,
    },
    phoneCountry: (client.widgetSettings?.defaultPhoneCountry as "US" | "MX" | undefined) ?? "US",
    source: "chat",
  });

  if (!result.ok) {
    return withCors(NextResponse.json({ ok: false, error: result.error }, { status: result.status }));
  }

  if (leadId) {
    try {
      const lead = await prisma.lead.findFirst({
        where: { id: leadId, clientId: client.id },
      });
      if (lead && !lead.contractSent) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { contractSent: true, ending: lead.ending || "sign" },
        });
        if (
          client.notificationSettings?.slackWebhookUrl ||
          client.notificationSettings?.slackBotToken
        ) {
          await postSlackContractSent(
            client.notificationSettings,
            { ...lead, contractSent: true, ending: "sign" },
            client.name
          ).catch((e) => console.warn("[sign] Slack contract-sent failed:", e));
        }
      }
    } catch (e) {
      console.error("[sign] Slack contract-sent notify failed", e);
    }
  }

  return withCors(NextResponse.json({ ok: true, signingUrl: result.signingUrl }));
}
