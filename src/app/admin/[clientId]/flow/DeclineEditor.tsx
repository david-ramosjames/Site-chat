"use client";

import { useState, useTransition } from "react";

type Initial = {
  declineHeadline: string;
  declineMessage: string;
  translations: {
    es: {
      declineHeadline: string;
      declineMessage: string;
    };
  };
};

export default function DeclineEditor({
  clientId,
  initial,
  translationsEnabled,
}: {
  clientId: string;
  initial: Initial;
  translationsEnabled: boolean;
}) {
  const [form, setForm] = useState<Initial>(initial);
  const [saving, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function set<K extends "declineHeadline" | "declineMessage">(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }
  function setEs(k: "declineHeadline" | "declineMessage", v: string) {
    setForm((f) => ({
      ...f,
      translations: {
        es: { ...f.translations.es, [k]: v },
      },
    }));
  }

  function save() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/clients/${clientId}/decline`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          declineHeadline: form.declineHeadline || null,
          declineMessage: form.declineMessage || null,
          translations: {
            es: {
              declineHeadline: form.translations.es.declineHeadline || null,
              declineMessage: form.translations.es.declineMessage || null,
            },
          },
        }),
      });
      if (!res.ok) {
        setError("Could not save the decline message.");
        return;
      }
      setMessage("Saved.");
    });
  }

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">&quot;Thanks, can&apos;t help&quot; message</h3>
          <p className="mt-0.5 text-xs text-ink-500">
            Shown when a flow branch routes to <strong>End: thanks, can&apos;t help</strong>. The
            lead is still captured — visitor just sees this courteous message instead of the
            success CTAs.
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save message"}
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="label">Headline</label>
          <input
            className="input"
            placeholder="Thanks for reaching out"
            value={form.declineHeadline}
            onChange={(e) => set("declineHeadline", e.target.value)}
          />
        </div>
        <div>
          <label className="label">Message</label>
          <textarea
            rows={3}
            className="input"
            placeholder="Unfortunately we can't take this case at this time. We wish you the best of luck."
            value={form.declineMessage}
            onChange={(e) => set("declineMessage", e.target.value)}
          />
        </div>

        {translationsEnabled && (
          <div className="rounded-lg border border-ink-300/60 bg-ink-100/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
              Spanish (es)
            </p>
            <div className="mt-3 space-y-3">
              <div>
                <label className="label">Headline — Spanish</label>
                <input
                  className="input"
                  placeholder="Gracias por escribirnos"
                  value={form.translations.es.declineHeadline}
                  onChange={(e) => setEs("declineHeadline", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Message — Spanish</label>
                <textarea
                  rows={3}
                  className="input"
                  placeholder="Lamentablemente no podemos tomar este caso..."
                  value={form.translations.es.declineMessage}
                  onChange={(e) => setEs("declineMessage", e.target.value)}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {(message || error) && (
        <p className={`mt-3 text-sm ${error ? "text-rose-600" : "text-emerald-600"}`}>
          {error || message}
        </p>
      )}
    </section>
  );
}
