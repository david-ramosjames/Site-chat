"use client";

import { useState, useTransition } from "react";

type DeclineCta = {
  type: "call" | "text" | "schedule" | "link";
  label: string;
  labelEs?: string | null;
  destination: string;
};

type Initial = {
  declineHeadline: string;
  declineMessage: string;
  declineCtas: DeclineCta[];
  translations: {
    es: {
      declineHeadline: string;
      declineMessage: string;
    };
  };
};

const PRESETS: Record<DeclineCta["type"], { label: string; placeholder: string; defaultLabel: string }> = {
  call: { label: "Call", placeholder: "+15125550100", defaultLabel: "Call a referral line" },
  text: { label: "Text", placeholder: "+15125550100", defaultLabel: "Text us" },
  schedule: {
    label: "Schedule",
    placeholder: "https://calendly.com/yourteam/30min",
    defaultLabel: "Book a consultation",
  },
  link: { label: "Custom link", placeholder: "https://...", defaultLabel: "Visit a resource" },
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
  function updateCta(i: number, patch: Partial<DeclineCta>) {
    setForm((f) => ({
      ...f,
      declineCtas: f.declineCtas.map((c, idx) => (idx === i ? { ...c, ...patch } : c)),
    }));
  }
  function removeCta(i: number) {
    setForm((f) => ({ ...f, declineCtas: f.declineCtas.filter((_, idx) => idx !== i) }));
  }
  function addCta() {
    setForm((f) => ({
      ...f,
      declineCtas: [
        ...f.declineCtas,
        { type: "link", label: PRESETS.link.defaultLabel, labelEs: "", destination: "" },
      ],
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
          declineCtas: form.declineCtas
            .filter((c) => c.destination.trim() && c.label.trim())
            .map((c) => ({ ...c, labelEs: (c.labelEs || "").trim() || null })),
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={addCta}
            disabled={form.declineCtas.length >= 5}
          >
            + Add CTA
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
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

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
            Decline action buttons (up to 5)
          </p>
          <p className="mb-3 text-xs text-ink-500">
            Optional. Pointer the visitor at a self-help resource, referral line, or general
            consultation calendar. Same shape as success CTAs.
          </p>

          {form.declineCtas.length === 0 && (
            <p className="text-xs text-ink-500">
              No CTAs yet. Click <strong>+ Add CTA</strong> to add one.
            </p>
          )}

          <ul className="space-y-3">
            {form.declineCtas.map((c, i) => (
              <li key={i} className="rounded-lg border border-ink-300/60 bg-white p-4">
                <div className="grid gap-3 md:grid-cols-[140px_1fr_2fr_auto]">
                  <div>
                    <label className="label">Type</label>
                    <select
                      className="select"
                      value={c.type}
                      onChange={(e) => {
                        const newType = e.target.value as DeclineCta["type"];
                        updateCta(i, {
                          type: newType,
                          label:
                            c.label.trim() && c.label !== PRESETS[c.type].defaultLabel
                              ? c.label
                              : PRESETS[newType].defaultLabel,
                        });
                      }}
                    >
                      {(Object.keys(PRESETS) as DeclineCta["type"][]).map((t) => (
                        <option key={t} value={t}>
                          {PRESETS[t].label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Button label</label>
                    <input
                      className="input"
                      value={c.label}
                      onChange={(e) => updateCta(i, { label: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="label">Destination</label>
                    <input
                      className="input"
                      placeholder={PRESETS[c.type].placeholder}
                      value={c.destination}
                      onChange={(e) => updateCta(i, { destination: e.target.value })}
                    />
                    <p className="help">
                      Phone for Call/Text; URL for Schedule/Custom.
                    </p>
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => removeCta(i)}
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                {translationsEnabled && (
                  <div className="mt-3 rounded-lg border border-ink-300/60 bg-ink-100/40 p-3">
                    <label className="label">Button label — Spanish</label>
                    <input
                      className="input"
                      placeholder={
                        c.type === "call"
                          ? "Llámanos"
                          : c.type === "text"
                          ? "Envía un mensaje"
                          : c.type === "schedule"
                          ? "Reservar cita"
                          : "Más información"
                      }
                      value={c.labelEs ?? ""}
                      onChange={(e) => updateCta(i, { labelEs: e.target.value })}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {(message || error) && (
        <p className={`mt-3 text-sm ${error ? "text-rose-600" : "text-emerald-600"}`}>
          {error || message}
        </p>
      )}
    </section>
  );
}
