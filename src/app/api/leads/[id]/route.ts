import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { corsPreflight, withCors } from "@/lib/cors";
import { rateLimit } from "@/lib/rate-limit";
import { appendMoreDetail } from "@/lib/more-detail";
import { postSlackMoreDetail } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  clientId: z.string().min(1),
  extraDetail: z.string().max(4000),
  slug: z.string().max(80).optional(),
  org: z.string().max(80).optional(),
});

export async function OPTIONS() {
  return corsPreflight();
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  if (!rateLimit(`lead-detail:${ip}`, 20, 60_000).ok) {
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

  const extra = parsed.data.extraDetail;
  const merged = appendMoreDetail(null, extra);
  if (!merged) {
    return withCors(NextResponse.json({ error: "empty_detail" }, { status: 400 }));
  }

  const lead = await prisma.lead.findFirst({
    where: { id: params.id, clientId: parsed.data.clientId },
    include: { client: { include: { notificationSettings: true } } },
  });
  if (!lead) {
    return withCors(NextResponse.json({ error: "not_found" }, { status: 404 }));
  }

  const currentAnswers =
    lead.answers && typeof lead.answers === "object" && !Array.isArray(lead.answers)
      ? (lead.answers as Record<string, unknown>)
      : {};
  const next = appendMoreDetail(currentAnswers, extra);
  if (!next) {
    return withCors(NextResponse.json({ error: "empty_detail" }, { status: 400 }));
  }

  const updated = await prisma.lead.update({
    where: { id: lead.id },
    data: { answers: next.answers as object },
  });

  const settings = lead.client.notificationSettings;
  if (settings?.slackWebhookUrl || settings?.slackBotToken) {
    await postSlackMoreDetail(settings, updated, next.appended).catch((e) =>
      console.warn("[more-detail] Slack follow-up failed:", e)
    );
  }

  return withCors(NextResponse.json({ ok: true }));
}
