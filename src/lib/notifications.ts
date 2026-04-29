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

async function postSlack(url: string, lead: Lead, _summary: string, businessName: string) {
  // Slack webhooks treat `text` as mrkdwn by default, so a simple
  // multi-line message renders as a tidy card without the strictness of
  // Block Kit (which can 400 on tiny config issues like a missing
  // protocol on a URL or unknown field).
  const adminLink = safeAdminLink(lead);

  // Header signals priority at a glance: 🔥 for qualified, 🎁 for referral,
  // both when applicable. Falls back to the standard 🟢 lead emoji.
  const isQualified = lead.qualified === "yes";
  const isReferral = lead.referral === "yes";
  let header: string;
  if (isQualified && isReferral) header = `🔥 *PRIORITY + Referral — ${businessName}*`;
  else if (isQualified) header = `🔥 *PRIORITY lead (qualified) — ${businessName}*`;
  else if (isReferral) header = `🎁 *Referral — ${businessName}*`;
  else header = `🟢 *New lead — ${businessName}*`;

  const lines = [
    header,
    "",
    fieldLine("Qualified", formatYesNo(lead.qualified)),
    fieldLine("Referral", formatYesNo(lead.referral)),
    fieldLine("Name", lead.name),
    fieldLine("Phone", lead.phone),
    fieldLine("Email", lead.email),
    fieldLine("Service", lead.serviceRequested),
    lead.sourceUrl ? `*From:* <${lead.sourceUrl}>` : null,
    fieldLine("UTM", utmSummary(lead)),
    adminLink ? `\n<${adminLink}|Open in admin →>` : null,
  ]
    .filter((s): s is string => !!s)
    .join("\n");

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: lines }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`Slack webhook returned ${res.status}: ${body}`);
    }
  } catch (err) {
    console.warn("Slack webhook failed:", err);
  }
}

function safeAdminLink(lead: Lead): string | null {
  let base = (process.env.NEXT_PUBLIC_APP_URL || "").trim().replace(/\/$/, "");
  if (!base) return null;
  // Slack rejects link URLs without a scheme, so auto-prepend https:// if
  // the admin set NEXT_PUBLIC_APP_URL bare (e.g. railway.app/...).
  if (!/^https?:\/\//i.test(base)) base = "https://" + base;
  try {
    new URL(base);
  } catch {
    return null;
  }
  return `${base}/admin/${lead.clientId}/leads/${lead.id}`;
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

function formatYesNo(v: string | null | undefined): string | null {
  if (v === "yes") return "✅ Yes";
  if (v === "no") return "No";
  return v ?? null;
}

function utmSummary(lead: Lead) {
  const parts: string[] = [];
  if (lead.utmSource) parts.push(`source=${lead.utmSource}`);
  if (lead.utmMedium) parts.push(`medium=${lead.utmMedium}`);
  if (lead.utmCampaign) parts.push(`campaign=${lead.utmCampaign}`);
  return parts.length ? parts.join(" / ") : null;
}
