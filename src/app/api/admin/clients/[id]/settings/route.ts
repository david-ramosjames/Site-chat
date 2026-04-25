import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { widgetSettingsSchema } from "@/lib/validators";

export const dynamic = "force-dynamic";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => null);
  const parsed = widgetSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 400 });
  }
  const { businessName, industry, ...widget } = parsed.data;

  const client = await prisma.client.update({
    where: { id: params.id },
    data: {
      name: businessName,
      industry,
      widgetSettings: {
        upsert: {
          create: { ...widget, logoUrl: widget.logoUrl || null },
          update: { ...widget, logoUrl: widget.logoUrl || null },
        },
      },
    },
    include: { widgetSettings: true },
  });
  return NextResponse.json({ client });
}
