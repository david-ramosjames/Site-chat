import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { corsPreflight, withCors } from "@/lib/cors";
import { chatEventSchema } from "@/lib/validators";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return corsPreflight();
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "anon";
  if (!rateLimit(`event:${ip}`, 60, 60_000).ok) {
    return withCors(NextResponse.json({ error: "rate_limited" }, { status: 429 }));
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return withCors(NextResponse.json({ error: "invalid_json" }, { status: 400 }));
  }

  const parsed = chatEventSchema.safeParse(body);
  if (!parsed.success) {
    return withCors(
      NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 })
    );
  }
  const p = parsed.data;

  const client = await prisma.client.findUnique({ where: { id: p.clientId } });
  if (!client || client.status !== "active") {
    return withCors(NextResponse.json({ error: "unknown_client" }, { status: 404 }));
  }

  await prisma.chatEvent.create({
    data: {
      clientId: client.id,
      sessionId: p.sessionId,
      type: p.type,
      source: p.source ?? null,
      sourceUrl: p.sourceUrl ?? null,
      referrer: p.referrer ?? null,
      userAgent: p.userAgent ?? null,
    },
  });

  return withCors(NextResponse.json({ ok: true }));
}
