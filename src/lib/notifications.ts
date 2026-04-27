import type { Lead, NotificationSettings } from "@prisma/client";

// MVP: stub the outbound notifications. In production replace with SendGrid /
// Twilio / etc. Slack receives a properly-formatted Block Kit message;
// generic webhooks (CRM, Google Sheet, Zapier Catch Hook) receive a
// { lead, summary } envelope.
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

  const tasks: Promise<void>[] = [];

  if (settings.slackWebhookUrl) {
    tasks.push(postSlack(settings.slackWebhookUrl, lead, summary, businessName));
  }
  if (settings.crmWebhookUrl) {
    tasks.push(postGenericWebhook(settings.crmWebhookUrl, lead, summary, "CRM"));
  }
  if (settings.googleSheetWebhookUrl) {
    tasks.push(
      postGenericWebhook(settings.googleSheetWebhookUrl, lead, summary, "Google Sheet")
    );
  }

  await Promise.all(tasks);
}

async function postSlack(url: string, lead: Lead, summary: string, businessName: string) {
  // Slack incoming webhooks expect { text } or { blocks } — anything else
  // returns 400 invalid_payload. Build a tidy Block Kit message.
  const adminBase = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
  const adminLink = adminBase
    ? `${adminBase}/admin/${lead.clientId}/leads/${lead.id}`
    : null;

  const detail = [
    fieldLine("Name", lead.name),
    fieldLine("Phone", lead.phone),
    fieldLine("Email", lead.email),
    fieldLine("Service", lead.serviceRequested),
    fieldLine("Urgency", lead.urgency),
    fieldLine("From", lead.sourceUrl),
    fieldLine("UTM", utmSummary(lead)),
  ]
    .filter((s): s is string => !!s)
    .join("\n");

  const blocks: unknown[] = [
    {
      type: "header",
      text: { type: "plain_text", text: `🟢 New lead — ${businessName}`, emoji: true },
    },
  ];
  if (detail) {
    blocks.push({ type: "section", text: { type: "mrkdwn", text: detail } });
  }
  if (adminLink) {
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: { type: "plain_text", text: "Open in admin" },
          url: adminLink,
          style: "primary",
        },
      ],
    });
  }

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: summary, blocks }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`Slack webhook returned ${res.status}: ${body}`);
    }
  } catch (err) {
    console.warn("Slack webhook failed:", err);
  }
}

async function postGenericWebhook(
  url: string,
  lead: Lead,
  summary: string,
  label: string
) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lead, summary }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`${label} webhook returned ${res.status}: ${body}`);
    }
  } catch (err) {
    console.warn(`${label} webhook failed:`, err);
  }
}

function fieldLine(label: string, value: string | null | undefined) {
  if (!value) return null;
  return `*${label}:* ${value}`;
}

function utmSummary(lead: Lead) {
  const parts: string[] = [];
  if (lead.utmSource) parts.push(`source=${lead.utmSource}`);
  if (lead.utmMedium) parts.push(`medium=${lead.utmMedium}`);
  if (lead.utmCampaign) parts.push(`campaign=${lead.utmCampaign}`);
  return parts.length ? parts.join(" / ") : null;
}
