import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { notificationSettingsSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = notificationSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const data = {
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    slackWebhookUrl: parsed.data.slackWebhookUrl || null,
    crmWebhookUrl: parsed.data.crmWebhookUrl || null,
    googleSheetWebhookUrl: parsed.data.googleSheetWebhookUrl || null,
  };
  const notifications = await prisma.notificationSettings.upsert({
    where: { clientId: params.id },
    create: { clientId: params.id, ...data },
    update: data,
  });
  return NextResponse.json({ notifications });
}
