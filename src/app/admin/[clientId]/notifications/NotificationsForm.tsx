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
      <div>
        <label className="label">Notification email</label>
        <input
          className="input"
          type="email"
          placeholder="leads@yourbusiness.com"
          value={form.email}
          onChange={(e) => set("email", e.target.value)}
        />
      </div>
      <div>
        <label className="label">SMS phone number</label>
        <input
          className="input"
          placeholder="+15125550100"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
        />
        <p className="help">Leads will be relayed to this number when SMS alerts are enabled.</p>
      </div>
      <div>
        <label className="label">Slack webhook URL</label>
        <input
          className="input"
          placeholder="https://hooks.slack.com/services/..."
          value={form.slackWebhookUrl}
          onChange={(e) => set("slackWebhookUrl", e.target.value)}
        />
      </div>
      <div>
        <label className="label">CRM webhook URL</label>
        <input
          className="input"
          placeholder="https://your-crm.example.com/webhooks/leads"
          value={form.crmWebhookUrl}
          onChange={(e) => set("crmWebhookUrl", e.target.value)}
        />
      </div>
      <div>
        <label className="label">Google Sheet webhook URL</label>
        <input
          className="input"
          placeholder="https://script.google.com/macros/s/.../exec"
          value={form.googleSheetWebhookUrl}
          onChange={(e) => set("googleSheetWebhookUrl", e.target.value)}
        />
        <p className="help">Use a Google Apps Script endpoint or Zapier Catch Hook to append each lead to a sheet.</p>
      </div>

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
