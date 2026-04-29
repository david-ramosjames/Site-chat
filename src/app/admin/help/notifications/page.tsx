import Link from "next/link";

export const metadata = {
  title: "RJL-Chat — Notifications setup guide",
};

export default function NotificationsHelp() {
  return (
    <article className="mx-auto max-w-3xl space-y-8 pb-16">
      <header>
        <Link href="/admin" className="text-xs text-ink-500 hover:text-ink-700">
          ← Back to admin
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Notifications setup guide</h1>
        <p className="mt-2 text-sm text-ink-500">
          Step-by-step for every notification destination on the Notifications page. Fill in only
          the channels you want — leaving a field blank disables that destination.
        </p>
      </header>

      <nav className="card p-4 text-sm">
        <p className="font-semibold">Jump to</p>
        <ul className="mt-2 grid gap-1 sm:grid-cols-2">
          <li><a className="text-brand-600 hover:underline" href="#email">Email</a></li>
          <li><a className="text-brand-600 hover:underline" href="#sms">SMS / phone</a></li>
          <li><a className="text-brand-600 hover:underline" href="#slack">Slack webhook</a></li>
          <li><a className="text-brand-600 hover:underline" href="#crm">CRM webhook</a></li>
          <li><a className="text-brand-600 hover:underline" href="#google-sheet">Google Sheet</a></li>
          <li><a className="text-brand-600 hover:underline" href="#callrail">CallRail</a></li>
          <li><a className="text-brand-600 hover:underline" href="#test">Testing</a></li>
        </ul>
      </nav>

      <Section id="email" title="Email">
        <p>
          The simplest channel. Drop in any inbox you check regularly — a personal email,
          a shared <code className="rounded bg-ink-100 px-1">leads@</code> alias, your CRM&apos;s
          email-to-lead address, etc.
        </p>
        <Steps>
          <li>Decide where leads should land. A shared inbox or distribution list is best so they don&apos;t miss you when one person is out.</li>
          <li>Paste the address into <strong>Notification email</strong>.</li>
          <li>Save. Future leads send a one-line summary plus the answer payload to that address.</li>
        </Steps>
        <Note>For MVP we log to the server console and post to webhooks. To go live with real email, plug in SendGrid, Postmark, or Resend in <code className="rounded bg-ink-100 px-1">src/lib/notifications.ts</code>.</Note>
      </Section>

      <Section id="sms" title="SMS / phone">
        <p>
          The phone number that should receive lead alerts. Use international format (
          <code className="rounded bg-ink-100 px-1">+15125550100</code>) so it&apos;s
          unambiguous.
        </p>
        <Steps>
          <li>Pick the phone number — usually a shared business line, an on-call rotation, or your intake assistant&apos;s mobile.</li>
          <li>Format it as <code className="rounded bg-ink-100 px-1">+1XXXXXXXXXX</code>.</li>
          <li>Paste into <strong>SMS phone number</strong>. Save.</li>
        </Steps>
        <Note>To send actual texts, wire up Twilio (or MessageBird/Sinch) inside <code className="rounded bg-ink-100 px-1">src/lib/notifications.ts</code>. The number you save here is what we pass to that service.</Note>
      </Section>

      <Section id="slack" title="Slack webhook">
        <p>
          Slack&apos;s incoming webhooks let you post into a channel without writing any code.
          Each lead becomes a Slack message with the visitor&apos;s details.
        </p>
        <Steps>
          <li>Open <a className="text-brand-600 hover:underline" href="https://api.slack.com/apps" target="_blank" rel="noreferrer">api.slack.com/apps</a> and click <strong>Create New App → From scratch</strong>.</li>
          <li>Name the app (e.g. <em>RJL-Chat Leads</em>) and pick your workspace. Click <strong>Create App</strong>.</li>
          <li>In the left nav, open <strong>Incoming Webhooks</strong> and toggle <strong>Activate Incoming Webhooks</strong> to On.</li>
          <li>Scroll down and click <strong>Add New Webhook to Workspace</strong>.</li>
          <li>Pick the channel for lead notifications (e.g. <code className="rounded bg-ink-100 px-1">#leads</code>) and click <strong>Allow</strong>.</li>
          <li>Back on the Incoming Webhooks page, click <strong>Copy</strong> next to the new webhook URL. It looks like:
            <pre className="mt-2 overflow-x-auto rounded bg-ink-900 p-3 text-xs text-ink-100">https://hooks.slack.com/services/T0XXXXXXX/B0XXXXXXX/abc123…</pre>
          </li>
          <li>Paste it into <strong>Slack webhook URL</strong>. Save.</li>
        </Steps>
        <Note>Treat the webhook URL like a password — anyone with it can post to that channel. If it leaks, regenerate it from the same Slack page.</Note>
      </Section>

      <Section id="crm" title="CRM webhook">
        <p>
          Any CRM that accepts inbound webhooks (HubSpot Workflows, Pipedrive, Salesforce
          Flow, Zapier Catch Hook, Make.com, n8n) can ingest leads from RJL-Chat. We post a
          JSON body with the full lead record and a one-line summary.
        </p>
        <Steps>
          <li>Inside your CRM (or Zapier/Make/n8n), create a new webhook trigger and copy its inbound URL.</li>
          <li>If you&apos;re using Zapier: Trigger → <strong>Webhooks by Zapier</strong> → <strong>Catch Hook</strong>. The URL appears on the Test tab.</li>
          <li>If you&apos;re using HubSpot: <strong>Workflows → Create Workflow → Webhook (POST)</strong> won&apos;t work for INCOMING data; use <strong>Forms with raw HTML</strong> via Zapier instead, or HubSpot&apos;s API directly.</li>
          <li>Paste the URL into <strong>CRM webhook URL</strong>. Save.</li>
        </Steps>
        <Note>The exact JSON shape we POST is a <code className="rounded bg-ink-100 px-1">{`{ lead, summary }`}</code> envelope where <code className="rounded bg-ink-100 px-1">lead</code> is the row from our database (name, phone, email, answers, transcript, source URL, UTM, etc.). Most catch-hook tools will auto-detect every field on first use.</Note>
      </Section>

      <Section id="google-sheet" title="Google Sheet">
        <p>
          Drop every lead into a spreadsheet — useful for the office to triage without leaving
          Google Workspace.
        </p>
        <p className="mt-2 font-semibold">Path A — Google Apps Script (free, no third-party):</p>
        <Steps>
          <li>Create a new Google Sheet. Add a header row: <code className="rounded bg-ink-100 px-1">Created at, Name, Phone, Email, Service, Source URL</code>.</li>
          <li>From the menu choose <strong>Extensions → Apps Script</strong>.</li>
          <li>Paste this script (replace <code className="rounded bg-ink-100 px-1">SHEET_ID</code> with the part of the sheet URL between <code className="rounded bg-ink-100 px-1">/d/</code> and <code className="rounded bg-ink-100 px-1">/edit</code>):
            <pre className="mt-2 overflow-x-auto rounded bg-ink-900 p-3 text-xs text-ink-100">{`function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  const lead = body.lead || body;
  const sheet = SpreadsheetApp.openById('SHEET_ID').getSheets()[0];
  sheet.appendRow([
    new Date(),
    lead.name || '',
    lead.phone || '',
    lead.email || '',
    lead.serviceRequested || '',
    lead.sourceUrl || ''
  ]);
  return ContentService.createTextOutput('ok');
}`}</pre>
          </li>
          <li>Click <strong>Deploy → New deployment</strong>. Type: <strong>Web app</strong>. Execute as: <strong>Me</strong>. Who has access: <strong>Anyone</strong>. Click <strong>Deploy</strong>.</li>
          <li>Copy the <strong>Web app URL</strong> (ends in <code className="rounded bg-ink-100 px-1">/exec</code>).</li>
          <li>Paste it into <strong>Google Sheet webhook URL</strong>. Save.</li>
        </Steps>
        <p className="mt-2 font-semibold">Path B — Zapier (no code):</p>
        <Steps>
          <li>In Zapier, create a Zap: Trigger = <strong>Webhooks by Zapier → Catch Hook</strong>. Copy the catch URL.</li>
          <li>Action = <strong>Google Sheets → Create Spreadsheet Row</strong>. Pick your sheet and map the lead fields.</li>
          <li>Paste the catch URL into <strong>Google Sheet webhook URL</strong>. Save.</li>
        </Steps>
      </Section>

      <Section id="callrail" title="CallRail">
        <p>
          CallRail&apos;s Form Capture API lets the chatbot deliver completed leads to CallRail
          alongside calls — so they share the same attribution (GCLID, UTM, landing page,
          tracking session) and get sent into Google Ads as conversions through CallRail&apos;s
          existing pipeline.
        </p>
        <p className="mt-2 font-semibold">Account ID:</p>
        <p>
          Alphanumeric, looks like <code className="rounded bg-ink-100 px-1">ACC0892c4fd…</code>.
          This is <em>not</em> the same as the company ID in your swap.js URL.
        </p>
        <Steps>
          <li>Log into CallRail and look at the dashboard URL — it looks like{" "}
            <code className="rounded bg-ink-100 px-1">{"app.callrail.com/dashboard/{ACCOUNT_ID}/calls"}</code>.
            Copy the <code className="rounded bg-ink-100 px-1">{"{ACCOUNT_ID}"}</code> portion.</li>
          <li>Or go to <strong>Settings → Account → Account info</strong> — the Account ID is listed there.</li>
          <li>Paste it into <strong>CallRail Account ID</strong> on Notifications.</li>
        </Steps>
        <p className="mt-3 font-semibold">Company ID:</p>
        <p>Numeric, the value from your swap.js URL after <code className="rounded bg-ink-100 px-1">/companies/</code>.</p>
        <Steps>
          <li>Look at your CallRail swap.js script tag, e.g.{" "}
            <code className="rounded bg-ink-100 px-1">
              {"//cdn.callrail.com/companies/"}<strong>984308652</strong>{"/.../swap.js"}
            </code>
            .
          </li>
          <li>The number after <code className="rounded bg-ink-100 px-1">/companies/</code> is your
            Company ID. Paste it into <strong>CallRail Company ID</strong> on Notifications.</li>
        </Steps>
        <p className="mt-3 font-semibold">API key:</p>
        <Steps>
          <li>In CallRail, go to <strong>Settings → Integrations → API Keys</strong>.</li>
          <li>Click <strong>Create API Key</strong>. Name it <em>RJL-Chat</em> or similar.</li>
          <li>Copy the generated key and paste it into <strong>CallRail API key</strong>.</li>
        </Steps>
        <p className="mt-3 font-semibold">(Optional) Form ID:</p>
        <p>
          A short label like <code className="rounded bg-ink-100 px-1">rjl-chat-leads</code> that
          groups chatbot submissions under one form name in CallRail&apos;s UI. Skip if you
          don&apos;t need to filter chat-only submissions.
        </p>
        <p className="mt-3 font-semibold">Dynamic phone number on the chatbot:</p>
        <Steps>
          <li>Open <strong>Widget settings</strong> for the same business.</li>
          <li>Scroll to <strong>CallRail dynamic phone number</strong> and tick{" "}
            <em>&quot;Use the CallRail-swapped number from the host page&quot;</em>.</li>
          <li>If your site has more than one <code className="rounded bg-ink-100 px-1">tel:</code>{" "}
            link, paste a CSS selector for the canonical phone (e.g.{" "}
            <code className="rounded bg-ink-100 px-1">.header-phone a</code>).</li>
        </Steps>
        <Note>
          If CallRail is sending conversions to Google Ads for you already, leave the chatbot&apos;s
          Google Ads Conversion ID/Label fields blank to avoid double-counting. The widget will
          still push <code className="rounded bg-ink-100 px-1">rjl_chat_lead_submitted</code> to{" "}
          <code className="rounded bg-ink-100 px-1">window.dataLayer</code> for GTM either way.
        </Note>
      </Section>

      <Section id="test" title="Test it">
        <p>
          The fastest way to confirm everything works end-to-end is to submit a test lead
          through the widget yourself.
        </p>
        <Steps>
          <li>Open <Link href="/demo" className="text-brand-600 hover:underline">/demo</Link> with your business&apos;s clientId in the URL: <code className="rounded bg-ink-100 px-1">/demo?clientId=YOUR_ID</code>.</li>
          <li>Walk through the flow as a visitor would and submit.</li>
          <li>Check each destination — your inbox, the Slack channel, your CRM, the spreadsheet.</li>
          <li>The lead also appears immediately on your <strong>Leads</strong> tab in the admin.</li>
        </Steps>
        <p className="mt-3 text-sm text-ink-500">
          For Slack/webhooks specifically, you can also test the URL directly with curl:
        </p>
        <pre className="mt-2 overflow-x-auto rounded bg-ink-900 p-3 text-xs text-ink-100">{`curl -X POST -H 'Content-Type: application/json' \\
  --data '{"text":"Test from RJL-Chat 🟢"}' \\
  https://hooks.slack.com/services/...`}</pre>
      </Section>
    </article>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="card scroll-mt-8 p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="prose prose-sm mt-3 max-w-none space-y-3 text-sm text-ink-700">
        {children}
      </div>
    </section>
  );
}

function Steps({ children }: { children: React.ReactNode }) {
  return <ol className="ml-5 list-decimal space-y-2">{children}</ol>;
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
      <strong>Note:</strong> {children}
    </p>
  );
}
