import { prisma } from "@/lib/prisma";
import { DEMO_CLIENT_ID } from "@/lib/demo";
import NotificationsForm from "./NotificationsForm";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const n = await prisma.notificationSettings.findUnique({
    where: { clientId: DEMO_CLIENT_ID },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Notifications</h1>
        <p className="text-sm text-ink-500">
          Where new leads should go. Email is the default — SMS, Slack and webhooks are optional.
        </p>
      </div>
      <NotificationsForm
        clientId={DEMO_CLIENT_ID}
        initial={{
          email: n?.email ?? "",
          phone: n?.phone ?? "",
          slackWebhookUrl: n?.slackWebhookUrl ?? "",
          crmWebhookUrl: n?.crmWebhookUrl ?? "",
          googleSheetWebhookUrl: n?.googleSheetWebhookUrl ?? "",
        }}
      />
    </div>
  );
}
