import { prisma } from "@/lib/prisma";
import { DEMO_CLIENT_ID } from "@/lib/demo";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const client = await prisma.client.findUnique({
    where: { id: DEMO_CLIENT_ID },
    include: { widgetSettings: true },
  });

  if (!client || !client.widgetSettings) {
    return <p className="card p-8 text-sm">Client or widget settings missing — run the seed script.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Widget settings</h1>
        <p className="text-sm text-ink-500">Branding and copy shown on the chat widget.</p>
      </div>
      <SettingsForm
        clientId={client.id}
        initial={{
          businessName: client.name,
          industry: client.industry,
          primaryColor: client.widgetSettings.primaryColor,
          accentColor: client.widgetSettings.accentColor,
          logoUrl: client.widgetSettings.logoUrl ?? "",
          welcomeMessage: client.widgetSettings.welcomeMessage,
          bubbleText: client.widgetSettings.bubbleText,
          widgetPosition: client.widgetSettings.widgetPosition as "bottom-right" | "bottom-left",
          isActive: client.widgetSettings.isActive,
        }}
      />
    </div>
  );
}
