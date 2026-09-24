import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BlocklistManager from "./BlocklistManager";

export const dynamic = "force-dynamic";

export default async function BlocklistPage({ params }: { params: { clientId: string } }) {
  const client = await prisma.client.findUnique({ where: { id: params.clientId } });
  if (!client) notFound();

  const entries = await prisma.blockedLead.findMany({
    where: { clientId: params.clientId },
    orderBy: [{ kind: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Blocked leads</h2>
        <p className="text-sm text-ink-500">
          Names, phone numbers, and emails here never create a lead, Slack message, CallRail
          submission, or contract. The visitor still sees the normal thank-you screen.
        </p>
      </div>
      <BlocklistManager
        clientId={params.clientId}
        initial={entries.map((e) => ({
          id: e.id,
          kind: e.kind,
          value: e.value,
          note: e.note ?? "",
          createdAt: e.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
