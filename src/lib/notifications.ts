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

  const tasks: Promise<void>[] = [];

  if (settings.email) {
    tasks.push(sendEmail(settings.email, lead, summary, businessName));
  }
  if (settings.phone) {
    tasks.push(sendSms(settings.phone, summary));
  }
  if (settings.slackWebhookUrl) {
    tasks.push(postSlack(settings.slackWebhookUrl, lead, summary, businessName, settings));
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

async function sendEmail(to: string, lead: Lead, summary: string, businessName: string) {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.SENDGRID_FROM_EMAIL;
  if (!apiKey || !from) {
    console.warn("Email skipped: SENDGRID_API_KEY and SENDGRID_FROM_EMAIL are required");
    return;
  }

  const adminLink = safeAdminLink(lead);
  const text = [
    summary,
    "",
    fieldLine("Qualified", formatYesNo(lead.qualified)),
    fieldLine("Referral", formatYesNo(lead.referral)),
    fieldLine("Name", lead.name),
    fieldLine("Phone", lead.phone),
    fieldLine("Email", lead.email),
    fieldLine("Service", lead.serviceRequested),
    lead.aiSummary ? `AI summary: ${lead.aiSummary}` : null,
    lead.leadScore != null ? `Lead score: ${lead.leadScore}` : null,
    adminLink ? `Open in admin: ${adminLink}` : null,
  ]
    .filter((line): line is string => Boolean(line))
    .join("\n");

  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiKey}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from, name: "RJL-Chat" },
        subject: `New lead for ${businessName}`,
        content: [{ type: "text/plain", value: text }],
      }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.warn(`SendGrid returned ${res.status}: ${body}`);
    }
  } catch (err) {
    console.warn("Email dispatch failed:", err);
  }
}

async function sendSms(to: string, summary: string) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM_PHONE;
  if (!accountSid || !authToken || !from) {
    console.warn("SMS skipped: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_FROM_PHONE are required");
    return;
  }

  const body = new URLSearchParams({
    To: to,
    From: from,
    Body: summary.slice(0, 1500),
  });

  try {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body,
      },
    );
    if (!res.ok) {
      const responseBody = await res.text().catch(() => "");
      console.warn(`Twilio returned ${res.status}: ${responseBody}`);
    }
  } catch (err) {
    console.warn("SMS dispatch failed:", err);
  }
}

async function postSlack(
  url: string,
  lead: Lead,
  _summary: string,
  businessName: string,
  settings: NotificationSettings
) {
  // Slack webhooks treat `text` as mrkdwn by default, so a simple
  // multi-line message renders as a tidy card without the strictness of
  // Block Kit (which can 400 on tiny config issues like a missing
  // protocol on a URL or unknown field).
  const adminLink = safeAdminLink(lead);

  // Header signals priority at a glance. Each state can be customised on
  // the Notifications page; {{businessName}} expands to the client's name.
  const isQualified = lead.qualified === "yes";
  const isReferral = lead.referral === "yes";
  const expand = (tpl: string) =>
    tpl.replace(/\{\{\s*businessName\s*\}\}/g, businessName);
  let header: string;
  if (isQualified && isReferral) {
    header = settings.slackHeaderPriorityReferral
      ? expand(settings.slackHeaderPriorityReferral)
      : `🔥 *PRIORITY + Referral — ${businessName}*`;
  } else if (isQualified) {
    header = settings.slackHeaderPriority
      ? expand(settings.slackHeaderPriority)
      : `🔥 *PRIORITY lead (qualified) — ${businessName}*`;
  } else if (isReferral) {
    header = settings.slackHeaderReferral
      ? expand(settings.slackHeaderReferral)
      : `🎁 *Referral — ${businessName}*`;
  } else {
    header = settings.slackHeaderDefault
      ? expand(settings.slackHeaderDefault)
      : `🟢 *New lead — ${businessName}*`;
  }

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
