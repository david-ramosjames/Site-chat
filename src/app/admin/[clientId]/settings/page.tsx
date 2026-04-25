import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ params }: { params: { clientId: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.clientId },
    include: { widgetSettings: true },
  });
  if (!client) notFound();

  const ws = client.widgetSettings;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Widget settings</h2>
        <p className="text-sm text-ink-500">Branding and copy shown on the chat widget.</p>
      </div>
      <SettingsForm
        clientId={client.id}
        initial={{
          businessName: client.name,
          industry: client.industry,
          primaryColor: ws?.primaryColor ?? "#1d4ed8",
          accentColor: ws?.accentColor ?? "#1e3a8a",
          logoUrl: ws?.logoUrl ?? "",
          welcomeMessage: ws?.welcomeMessage ?? "Hi! How can we help?",
          bubbleText: ws?.bubbleText ?? "Chat with us",
          widgetPosition: (ws?.widgetPosition as "bottom-right" | "bottom-left") ?? "bottom-right",
          isActive: ws?.isActive ?? true,
        }}
      />
    </div>
  );
}
