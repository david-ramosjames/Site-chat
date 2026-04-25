import type { Lead, NotificationSettings } from "@prisma/client";

// MVP: stub the outbound notifications. In production replace with SendGrid /
// Twilio / Slack / Zapier webhooks.
export async function sendLeadNotifications(
  lead: Lead,
  settings: NotificationSettings | null,
  businessName: string
) {
  if (!settings) return;
  const summary = `New lead for ${businessName}: ${lead.name ?? "(no name)"} — ${
    lead.phone ?? lead.email ?? "no contact"
  }`;

  if (settings.email) console.log(`[email -> ${settings.email}] ${summary}`);
  if (settings.phone) console.log(`[sms -> ${settings.phone}] ${summary}`);

  const webhooks = [settings.slackWebhookUrl, settings.crmWebhookUrl, settings.googleSheetWebhookUrl].filter(
    (u): u is string => !!u
  );
  await Promise.all(
    webhooks.map(async (url) => {
      try {
        await fetch(url, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ lead, summary }),
        });
      } catch (err) {
        console.warn(`Webhook ${url} failed:`, err);
      }
    })
  );
}
