import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Bulk-delete chat events for a given host or page label. Used by the
// analytics page to clean up test traffic from staging / demo URLs.
//
// Query params:
//   host=example.com       → matches every event whose sourceUrl hostname
//                            equals "example.com"
//   page=example.com/foo   → matches every event whose hostname+pathname
//                            equals "example.com/foo" (matches the
//                            pageLabel format used in the analytics view)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const url = req.nextUrl;
  const host = (url.searchParams.get("host") || "").trim().toLowerCase();
  const page = (url.searchParams.get("page") || "").trim().toLowerCase();

  if (!host && !page) {
    return NextResponse.json({ error: "missing host or page" }, { status: 400 });
  }

  // Narrow the SQL fetch with a `contains` filter so we don't pull the
  // whole event table just to filter in code. The final match is verified
  // via URL parsing.
  const needle = host || page.split("/")[0];
  const events = await prisma.chatEvent.findMany({
    where: {
      clientId: params.id,
      sourceUrl: { contains: needle, mode: "insensitive" },
    },
    select: { id: true, sourceUrl: true },
  });

  const matchingIds = events
    .filter((e) => {
      if (!e.sourceUrl) return false;
      try {
        const parsed = new URL(e.sourceUrl);
        const eventHost = parsed.hostname.toLowerCase();
        const eventLabel = `${eventHost}${parsed.pathname}`.toLowerCase();
        if (host) return eventHost === host;
        return eventLabel === page;
      } catch {
        return false;
      }
    })
    .map((e) => e.id);

  if (matchingIds.length === 0) {
    return NextResponse.json({ deleted: 0 });
  }

  const result = await prisma.chatEvent.deleteMany({
    where: { id: { in: matchingIds } },
  });

  return NextResponse.json({ deleted: result.count });
}
