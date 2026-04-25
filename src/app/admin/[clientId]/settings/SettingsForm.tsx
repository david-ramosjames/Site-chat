"use client";

import { useState, useTransition } from "react";

type Initial = {
  businessName: string;
  industry: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string;
  welcomeMessage: string;
  bubbleText: string;
  widgetPosition: "bottom-right" | "bottom-left";
  isActive: boolean;
};

export default function SettingsForm({ clientId, initial }: { clientId: string; initial: Initial }) {
  const [form, setForm] = useState(initial);
  const [saving, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Initial>(key: K, value: Initial[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/clients/${clientId}/settings`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body?.issues ? "Please check the highlighted fields." : "Could not save settings.");
        return;
      }
      setMessage("Saved.");
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="card p-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="label">Business name</label>
            <input
              className="input"
              value={form.businessName}
              onChange={(e) => set("businessName", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Industry</label>
            <input
              className="input"
              value={form.industry}
              onChange={(e) => set("industry", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Primary color</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={form.primaryColor}
                onChange={(e) => set("primaryColor", e.target.value)}
                className="h-10 w-12 cursor-pointer rounded border border-ink-300"
              />
              <input
                className="input mt-0 flex-1"
                value={form.primaryColor}
                onChange={(e) => set("primaryColor", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="label">Accent color</label>
            <div className="mt-1 flex items-center gap-2">
              <input
                type="color"
                value={form.accentColor}
                onChange={(e) => set("accentColor", e.target.value)}
                className="h-10 w-12 cursor-pointer rounded border border-ink-300"
              />
              <input
                className="input mt-0 flex-1"
                value={form.accentColor}
                onChange={(e) => set("accentColor", e.target.value)}
              />
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Logo URL</label>
            <input
              className="input"
              placeholder="https://cdn.example.com/logo.png"
              value={form.logoUrl}
              onChange={(e) => set("logoUrl", e.target.value)}
            />
            <p className="help">Optional. Host your logo on your CDN and paste the public URL.</p>
          </div>
          <div className="sm:col-span-2">
            <label className="label">Welcome message</label>
            <textarea
              className="input"
              rows={2}
              value={form.welcomeMessage}
              onChange={(e) => set("welcomeMessage", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label">Bubble text</label>
            <input
              className="input"
              value={form.bubbleText}
              onChange={(e) => set("bubbleText", e.target.value)}
              required
            />
            <p className="help">Label shown next to the floating chat bubble.</p>
          </div>
          <div>
            <label className="label">Widget position</label>
            <select
              className="select"
              value={form.widgetPosition}
              onChange={(e) => set("widgetPosition", e.target.value as Initial["widgetPosition"])}
            >
              <option value="bottom-right">Bottom right</option>
              <option value="bottom-left">Bottom left</option>
            </select>
          </div>
          <label className="flex items-center gap-2 sm:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-ink-300"
            />
            <span className="text-sm">Widget is active on customer websites</span>
          </label>
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-ink-300/60 pt-4">
          <button className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
          {message && <span className="text-sm text-emerald-600">{message}</span>}
          {error && <span className="text-sm text-rose-600">{error}</span>}
        </div>
      </div>

      <aside className="card overflow-hidden">
        <div className="border-b border-ink-300/60 px-5 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Live preview</p>
        </div>
        <div className="relative h-[420px] bg-ink-100/70">
          <div
            className="absolute bottom-4 right-4 max-w-[260px] rounded-2xl p-4 shadow-card"
            style={{ background: form.primaryColor, color: "#fff" }}
          >
            <div className="flex items-center gap-2">
              {form.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logoUrl} alt="logo" className="h-6 max-w-[80px] rounded bg-white/10 object-contain" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-white/25 text-center text-sm font-semibold leading-7">
                  {form.businessName.slice(0, 1)}
                </div>
              )}
              <p className="text-sm font-semibold">{form.businessName}</p>
            </div>
            <p className="mt-2 text-sm/5 opacity-95">{form.welcomeMessage}</p>
          </div>
          <button
            type="button"
            className={`absolute bottom-4 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-card ${
              form.widgetPosition === "bottom-right" ? "right-4 translate-y-20" : "left-4 translate-y-20"
            }`}
            style={{ background: form.accentColor }}
          >
            {form.bubbleText}
          </button>
        </div>
      </aside>
    </form>
  );
}
