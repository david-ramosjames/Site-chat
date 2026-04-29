import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import NotificationsForm from "./NotificationsForm";

export const dynamic = "force-dynamic";

export default async function NotificationsPage({ params }: { params: { clientId: string } }) {
  const client = await prisma.client.findUnique({ where: { id: params.clientId } });
  if (!client) notFound();

  const n = await prisma.notificationSettings.findUnique({
    where: { clientId: params.clientId },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Notifications</h2>
          <p className="text-sm text-ink-500">
            Where new leads should go. Email is the default — SMS, Slack and webhooks are optional.
          </p>
        </div>
        <Link
          href="/admin/help/notifications"
          className="btn-secondary"
          target="_blank"
          rel="noreferrer"
        >
          Setup guide ↗
        </Link>
      </div>
      <NotificationsForm
        clientId={params.clientId}
        initial={{
          email: n?.email ?? "",
          phone: n?.phone ?? "",
          slackWebhookUrl: n?.slackWebhookUrl ?? "",
          crmWebhookUrl: n?.crmWebhookUrl ?? "",
          googleSheetWebhookUrl: n?.googleSheetWebhookUrl ?? "",
          callRailAccountId: n?.callRailAccountId ?? "",
          callRailCompanyId: n?.callRailCompanyId ?? "",
          callRailApiKey: n?.callRailApiKey ?? "",
          callRailFormId: n?.callRailFormId ?? "",
          slackHeaderPriorityReferral: n?.slackHeaderPriorityReferral ?? "",
          slackHeaderPriority: n?.slackHeaderPriority ?? "",
          slackHeaderReferral: n?.slackHeaderReferral ?? "",
          slackHeaderDefault: n?.slackHeaderDefault ?? "",
        }}
      />
    </div>
  );
}
