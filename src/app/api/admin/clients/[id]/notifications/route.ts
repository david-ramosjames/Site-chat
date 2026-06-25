import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notificationSettingsSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  // Trim all string fields before validating so stray whitespace on a
  // URL / ID never trips Zod's strict url()/max() and blocks the save.
  const trimmedBody =
    body && typeof body === "object"
      ? Object.fromEntries(
          Object.entries(body as Record<string, unknown>).map(([k, v]) => [
            k,
            typeof v === "string" ? v.trim() : v,
          ])
        )
      : body;
  const parsed = notificationSettingsSchema.safeParse(trimmedBody);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = {
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    slackWebhookUrl: parsed.data.slackWebhookUrl || null,
    crmWebhookUrl: parsed.data.crmWebhookUrl || null,
    googleSheetWebhookUrl: parsed.data.googleSheetWebhookUrl || null,
    callRailAccountId: parsed.data.callRailAccountId?.trim() || null,
    callRailCompanyId: parsed.data.callRailCompanyId?.trim() || null,
    callRailApiKey: parsed.data.callRailApiKey?.trim() || null,
    callRailFormId: parsed.data.callRailFormId?.trim() || null,
    slackHeaderPriorityReferral: parsed.data.slackHeaderPriorityReferral?.trim() || null,
    slackHeaderPriority: parsed.data.slackHeaderPriority?.trim() || null,
    slackHeaderReferral: parsed.data.slackHeaderReferral?.trim() || null,
    slackHeaderDefault: parsed.data.slackHeaderDefault?.trim() || null,
    slackPostPriorityReferral: parsed.data.slackPostPriorityReferral,
    slackPostPriority: parsed.data.slackPostPriority,
    slackPostReferral: parsed.data.slackPostReferral,
    slackPostDefault: parsed.data.slackPostDefault,
  };
  const notifications = await prisma.notificationSettings.upsert({
    where: { clientId: params.id },
    create: { clientId: params.id, ...data },
    update: data,
  });
  return NextResponse.json({ notifications });
}
