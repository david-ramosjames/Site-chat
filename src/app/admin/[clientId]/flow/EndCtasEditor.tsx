"use client";

import { useState, useTransition } from "react";

type EndCta = {
  type: "call" | "text" | "schedule" | "link";
  label: string;
  labelEs?: string | null;
  destination: string;
};

type SuccessCopy = {
  successHeadline: string;
  successMessage: string;
  successHeadlineEs: string;
  successMessageEs: string;
};

const PRESETS: Record<EndCta["type"], { label: string; placeholder: string; defaultLabel: string }> = {
  call: { label: "Call", placeholder: "+15125550100", defaultLabel: "Call Now" },
  text: { label: "Text", placeholder: "+15125550100", defaultLabel: "Text Now" },
  schedule: {
    label: "Schedule",
    placeholder: "https://calendly.com/yourteam/30min",
    defaultLabel: "Book a time",
  },
  link: { label: "Custom link", placeholder: "https://...", defaultLabel: "Learn more" },
};

export default function EndCtasEditor({
  clientId,
  initial,
  translationsEnabled,
  initialCopy,
}: {
  clientId: string;
  initial: EndCta[];
  translationsEnabled: boolean;
  initialCopy: SuccessCopy;
}) {
  const [ctas, setCtas] = useState<EndCta[]>(initial);
  const [copy, setCopy] = useState<SuccessCopy>(initialCopy);
  const [saving, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateCopy<K extends keyof SuccessCopy>(k: K, v: SuccessCopy[K]) {
    setCopy((c) => ({ ...c, [k]: v }));
  }

  function update(i: number, patch: Partial<EndCta>) {
    setCtas((c) => c.map((cta, idx) => (idx === i ? { ...cta, ...patch } : cta)));
  }
  function remove(i: number) {
    setCtas((c) => c.filter((_, idx) => idx !== i));
  }
  function add() {
    setCtas((c) => [
      ...c,
      { type: "call", label: PRESETS.call.defaultLabel, labelEs: "", destination: "" },
    ]);
  }

  function save() {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/clients/${clientId}/end-ctas`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          endCtas: ctas
            .filter((c) => c.destination.trim() && c.label.trim())
            .map((c) => ({
              ...c,
              labelEs: (c.labelEs || "").trim() || null,
            })),
          successHeadline: copy.successHeadline.trim() || null,
          successMessage: copy.successMessage.trim() || null,
          translations: {
            es: {
              successHeadline: copy.successHeadlineEs.trim() || null,
              successMessage: copy.successMessageEs.trim() || null,
            },
          },
        }),
      });
      if (!res.ok) {
        setError("Could not save CTAs.");
        return;
      }
      setMessage("Saved.");
    });
  }

  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Success state (after a lead submits)</h3>
          <p className="mt-0.5 text-xs text-ink-500">
            Headline + message + up to 5 buttons. Leave the message blank to use the default
            (&quot;Thanks — we got it!&quot; with a generic follow-up line).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-secondary" onClick={add} disabled={ctas.length >= 5}>
            + Add CTA
          </button>
          <button type="button" className="btn-primary" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      <div className="mb-5 space-y-3 rounded-lg border border-ink-300/60 bg-ink-100/40 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
          Success message
        </p>
        <div className="grid gap-3">
          <div>
            <label className="label">Headline</label>
            <input
              className="input"
              placeholder="Thanks — we got it!"
              value={copy.successHeadline}
              onChange={(e) => updateCopy("successHeadline", e.target.value)}
            />
          </div>
          <div>
            <label className="label">Message</label>
            <textarea
              rows={2}
              className="input"
              placeholder="The team will reach out shortly."
              value={copy.successMessage}
              onChange={(e) => updateCopy("successMessage", e.target.value)}
            />
          </div>
          {translationsEnabled && (
            <div className="grid gap-3 rounded-lg border border-ink-300/60 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                Spanish (es)
              </p>
              <div>
                <label className="label">Headline — Spanish</label>
                <input
                  className="input"
                  placeholder="¡Gracias — lo recibimos!"
                  value={copy.successHeadlineEs}
                  onChange={(e) => updateCopy("successHeadlineEs", e.target.value)}
                />
              </div>
              <div>
                <label className="label">Message — Spanish</label>
                <textarea
                  rows={2}
                  className="input"
                  placeholder="El equipo se pondrá en contacto en breve."
                  value={copy.successMessageEs}
                  onChange={(e) => updateCopy("successMessageEs", e.target.value)}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
        Buttons (up to 5)
      </p>

      {ctas.length === 0 && (
        <p className="text-xs text-ink-500">
          No CTAs yet. After someone fills out the form, they&apos;ll just see the success message
          above.
        </p>
      )}

      <ul className="space-y-3">
        {ctas.map((c, i) => (
          <li key={i} className="rounded-lg border border-ink-300/60 bg-white p-4">
            <div className="grid gap-3 md:grid-cols-[140px_1fr_2fr_auto]">
              <div>
                <label className="label">Type</label>
                <select
                  className="select"
                  value={c.type}
                  onChange={(e) => {
                    const newType = e.target.value as EndCta["type"];
                    update(i, {
                      type: newType,
                      label:
                        c.label.trim() && c.label !== PRESETS[c.type].defaultLabel
                          ? c.label
                          : PRESETS[newType].defaultLabel,
                    });
                  }}
                >
                  {(Object.keys(PRESETS) as EndCta["type"][]).map((t) => (
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
                  onChange={(e) => update(i, { label: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Destination</label>
                <input
                  className="input"
                  placeholder={PRESETS[c.type].placeholder}
                  value={c.destination}
                  onChange={(e) => update(i, { destination: e.target.value })}
                />
                <p className="help">
                  Phone number for Call/Text; full URL for Schedule (Calendly, SavvyCal, etc.) or Custom.
                </p>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => remove(i)}
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
                  placeholder={c.type === "call" ? "Llámanos" : c.type === "text" ? "Envía un mensaje" : c.type === "schedule" ? "Reservar cita" : "Más información"}
                  value={c.labelEs ?? ""}
                  onChange={(e) => update(i, { labelEs: e.target.value })}
                />
              </div>
            )}
          </li>
        ))}
      </ul>

      {(message || error) && (
        <p className={`mt-3 text-sm ${error ? "text-rose-600" : "text-emerald-600"}`}>
          {error || message}
        </p>
      )}
    </section>
  );
}
