"use client";

import { useState, useTransition } from "react";

type Features = {
  showProgress: boolean;
  allowFileUpload: boolean;
  collectUtm: boolean;
  collectPageUrl: boolean;
  collectReferrer: boolean;
  enableAiSummary: boolean;
  enableLeadScoring: boolean;
  enableAfterHours: boolean;
  enableSmsAlerts: boolean;
  enableEmailAlerts: boolean;
  enableSlackAlerts: boolean;
  enableGoogleSheetSync: boolean;
  enableCrmWebhook: boolean;
  enableMedia: boolean;
  enableFallbackForm: boolean;
  enableSpamProtection: boolean;
};

const GROUPS: { title: string; items: { key: keyof Features; label: string; help?: string }[] }[] = [
  {
    title: "Widget experience",
    items: [
      { key: "showProgress", label: "Show progress indicator", help: "Displays step N of M while chatting." },
      { key: "enableMedia", label: "Enable media in questions", help: "Shows images or videos attached to steps." },
      { key: "enableFallbackForm", label: "Show fallback contact form", help: "Offered if the visitor abandons mid-flow." },
      { key: "allowFileUpload", label: "Allow file uploads", help: "Lets visitors attach photos of the issue." },
      { key: "enableAfterHours", label: "After-hours auto message" },
    ],
  },
  {
    title: "Lead intelligence",
    items: [
      { key: "enableAiSummary", label: "AI lead summary", help: "Generates a short summary from the transcript." },
      { key: "enableLeadScoring", label: "Lead scoring", help: "Rank leads by urgency and quality signals." },
      { key: "enableSpamProtection", label: "Spam protection" },
    ],
  },
  {
    title: "Tracking",
    items: [
      { key: "collectPageUrl", label: "Collect page URL" },
      { key: "collectReferrer", label: "Collect referrer" },
      { key: "collectUtm", label: "Collect UTM parameters" },
    ],
  },
  {
    title: "Alerts & integrations",
    items: [
      { key: "enableEmailAlerts", label: "Email alerts" },
      { key: "enableSmsAlerts", label: "SMS alerts" },
      { key: "enableSlackAlerts", label: "Slack alerts" },
      { key: "enableCrmWebhook", label: "CRM webhook" },
      { key: "enableGoogleSheetSync", label: "Google Sheet sync" },
    ],
  },
];

export default function FeaturesForm({ clientId, initial }: { clientId: string; initial: Features }) {
  const [features, setFeatures] = useState<Features>(initial);
  const [saving, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggle = (key: keyof Features) =>
    setFeatures((f) => ({ ...f, [key]: !f[key] }));

  function save() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/clients/${clientId}/features`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(features),
      });
      if (!res.ok) {
        setError("Could not save feature toggles.");
        return;
      }
      setMessage("Saved.");
    });
  }

  return (
    <div className="space-y-6">
      {GROUPS.map((g) => (
        <div key={g.title} className="card p-5">
          <h2 className="text-sm font-semibold">{g.title}</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {g.items.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => toggle(item.key)}
                className={`flex items-start justify-between gap-3 rounded-lg border p-3 text-left transition ${
                  features[item.key]
                    ? "border-brand-500/50 bg-brand-50"
                    : "border-ink-300 bg-white hover:bg-ink-100"
                }`}
              >
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  {item.help && <p className="text-xs text-ink-500">{item.help}</p>}
                </div>
                <span
                  className={`mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
                    features[item.key] ? "bg-brand-500" : "bg-ink-300"
                  }`}
                >
                  <span
                    className={`h-4 w-4 transform rounded-full bg-white shadow transition ${
                      features[item.key] ? "translate-x-4" : "translate-x-0.5"
                    }`}
                  />
                </span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <button type="button" className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save toggles"}
        </button>
        {message && <span className="text-sm text-emerald-600">{message}</span>}
        {error && <span className="text-sm text-rose-600">{error}</span>}
      </div>
    </div>
  );
}
