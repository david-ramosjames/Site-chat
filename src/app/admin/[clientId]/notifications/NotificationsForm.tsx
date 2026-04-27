"use client";

import { useState, useTransition } from "react";

type Notifications = {
  email: string;
  phone: string;
  slackWebhookUrl: string;
  crmWebhookUrl: string;
  googleSheetWebhookUrl: string;
};

export default function NotificationsForm({
  clientId,
  initial,
}: {
  clientId: string;
  initial: Notifications;
}) {
  const [form, setForm] = useState<Notifications>(initial);
  const [saving, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof Notifications, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function save(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/clients/${clientId}/notifications`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.issues ? "Please check the highlighted fields." : "Could not save.");
        return;
      }
      setMessage("Saved.");
    });
  }

  return (
    <form onSubmit={save} className="card space-y-4 p-6">
      <Field label="Notification email" helpAnchor="email">
        <input
          className="input"
          type="email"
          placeholder="leads@yourbusiness.com"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </Field>
      <Field label="SMS phone number" helpAnchor="sms" help="Leads will be relayed to this number when SMS alerts are enabled.">
        <input
          className="input"
          placeholder="+15125550100"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
      </Field>
      <Field label="Slack webhook URL" helpAnchor="slack">
        <input
          className="input"
          placeholder="https://hooks.slack.com/services/..."
          value={form.slackWebhookUrl}
          onChange={(e) => set("slackWebhookUrl", e.target.value)}
        />
      </Field>
      <Field label="CRM webhook URL" helpAnchor="crm">
        <input
          className="input"
          placeholder="https://your-crm.example.com/webhooks/leads"
          value={form.crmWebhookUrl}
          onChange={(e) => set("crmWebhookUrl", e.target.value)}
        />
      </Field>
      <Field
        label="Google Sheet webhook URL"
        helpAnchor="google-sheet"
        help="Use a Google Apps Script endpoint or Zapier Catch Hook to append each lead to a sheet."
      >
        <input
          className="input"
          placeholder="https://script.google.com/macros/s/.../exec"
          value={form.googleSheetWebhookUrl}
          onChange={(e) => set("googleSheetWebhookUrl", e.target.value)}
        />
      </Field>

      <div className="flex items-center gap-3 border-t border-ink-300/60 pt-4">
        <button className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        {message && <span className="text-sm text-emerald-600">{message}</span>}
        {error && <span className="text-sm text-rose-600">{error}</span>}
      </div>
    </form>
  );
}

function Field({
  label,
  helpAnchor,
  help,
  children,
}: {
  label: string;
  helpAnchor: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label className="label">{label}</label>
        <a
          className="text-xs font-medium text-brand-600 hover:underline"
          href={`/admin/help/notifications#${helpAnchor}`}
          target="_blank"
          rel="noreferrer"
          title="How to set this up"
        >
          How? ↗
        </a>
      </div>
      {children}
      {help && <p className="help">{help}</p>}
    </div>
  );
}
