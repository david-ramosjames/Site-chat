import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClientSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function GET() {
  const clients = await prisma.client.findMany({
    include: { widgetSettings: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ clients });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = createClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const client = await prisma.client.create({
    data: {
      ...parsed.data,
      widgetSettings: { create: {} },
      featureToggles: { create: {} },
      notificationSettings: { create: {} },
    },
    include: { widgetSettings: true },
  });
  return NextResponse.json({ client }, { status: 201 });
}
