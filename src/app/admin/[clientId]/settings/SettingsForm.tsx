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
  introVideoEnabled: boolean;
  introVideoUrl: string;
  introPosterUrl: string;
  bubbleImageUrl: string;
  bubbleTooltip: string;
  chatAvatarUrl: string;
  enableTranslation: boolean;
  translations: {
    es: {
      welcomeMessage: string;
      bubbleText: string;
      bubbleTooltip: string;
    };
  };
};

export default function SettingsForm({ clientId, initial }: { clientId: string; initial: Initial }) {
  const [form, setForm] = useState<Initial>(initial);
  const [saving, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Initial>(key: K, value: Initial[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const setEs = (key: keyof Initial["translations"]["es"], value: string) =>
    setForm((f) => ({
      ...f,
      translations: { ...f.translations, es: { ...f.translations.es, [key]: value } },
    }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const payload = {
        ...form,
        translations: {
          es: {
            welcomeMessage: form.translations.es.welcomeMessage || undefined,
            bubbleText: form.translations.es.bubbleText || undefined,
            bubbleTooltip: form.translations.es.bubbleTooltip || undefined,
          },
        },
      };
      const res = await fetch(`/api/admin/clients/${clientId}/settings`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
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
      <div className="space-y-4">
        <Section title="Business" subtitle="Used in the widget header and admin nav.">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Business name">
              <input
                className="input"
                value={form.businessName}
                onChange={(e) => set("businessName", e.target.value)}
                required
              />
            </Field>
            <Field label="Industry">
              <input
                className="input"
                value={form.industry}
                onChange={(e) => set("industry", e.target.value)}
                required
              />
            </Field>
          </div>
        </Section>

        <Section title="Branding & colors">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Primary color">
              <ColorInput value={form.primaryColor} onChange={(v) => set("primaryColor", v)} />
            </Field>
            <Field label="Accent color">
              <ColorInput value={form.accentColor} onChange={(v) => set("accentColor", v)} />
            </Field>
            <Field label="Logo URL" help="Optional. Shown in the chat panel header.">
              <input
                className="input"
                placeholder="https://cdn.example.com/logo.png"
                value={form.logoUrl}
                onChange={(e) => set("logoUrl", e.target.value)}
              />
            </Field>
            <Field label="Widget position">
              <select
                className="select"
                value={form.widgetPosition}
                onChange={(e) =>
                  set("widgetPosition", e.target.value as Initial["widgetPosition"])
                }
              >
                <option value="bottom-right">Bottom right</option>
                <option value="bottom-left">Bottom left</option>
              </select>
            </Field>
            <Field label="Welcome message" full>
              <textarea
                rows={2}
                className="input"
                value={form.welcomeMessage}
                onChange={(e) => set("welcomeMessage", e.target.value)}
                required
              />
            </Field>
          </div>
          <label className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="h-4 w-4 rounded border-ink-300"
            />
            <span className="text-sm">Widget is active on customer websites</span>
          </label>
        </Section>

        <Section
          title="Floating bubble"
          subtitle="The avatar and tooltip visitors see before opening the chat."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Bubble avatar URL"
              help="Static photo, animated GIF, or a muted-looping video clip (.mp4/.webm). Lives only on the floating bubble — the chat header keeps your logo."
              full
            >
              <input
                className="input"
                placeholder="https://cdn.example.com/attorney-loop.mp4"
                value={form.bubbleImageUrl}
                onChange={(e) => set("bubbleImageUrl", e.target.value)}
              />
            </Field>
            <Field
              label="Tooltip / opener text"
              help="Speech bubble shown next to the avatar (e.g. 'Hi, how can we help?')."
            >
              <input
                className="input"
                placeholder="Hi, how can we help?"
                value={form.bubbleTooltip}
                onChange={(e) => set("bubbleTooltip", e.target.value)}
              />
            </Field>
            <Field label="Button label" help="Fallback pill button when no avatar image is set.">
              <input
                className="input"
                value={form.bubbleText}
                onChange={(e) => set("bubbleText", e.target.value)}
                required
              />
            </Field>
          </div>
        </Section>

        <Section
          title="In-chat avatar"
          subtitle="Small headshot shown next to each bot message inside the chat. Usually a clean still photo, even if the bubble itself is animated."
        >
          <Field
            label="Chat avatar URL"
            help="Square or circular photo. Recommended ~128×128px."
            full
          >
            <input
              className="input"
              placeholder="https://cdn.example.com/attorney-headshot.jpg"
              value={form.chatAvatarUrl}
              onChange={(e) => set("chatAvatarUrl", e.target.value)}
            />
          </Field>
        </Section>

        <Section
          title="Intro video"
          subtitle="Plays at the top of the chat panel as soon as it opens — great for a personal greeting."
        >
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.introVideoEnabled}
              onChange={(e) => set("introVideoEnabled", e.target.checked)}
              className="h-4 w-4 rounded border-ink-300"
            />
            <span className="text-sm">Show an intro video when the chat opens</span>
          </label>
          {form.introVideoEnabled && (
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <Field
                label="Video URL"
                help="MP4 from your CDN, or a YouTube/Vimeo embed URL."
                full
              >
                <input
                  className="input"
                  placeholder="https://www.youtube.com/embed/..."
                  value={form.introVideoUrl}
                  onChange={(e) => set("introVideoUrl", e.target.value)}
                />
              </Field>
              <Field label="Poster (thumbnail) URL" help="Shown before the video plays.">
                <input
                  className="input"
                  placeholder="https://cdn.example.com/intro-poster.jpg"
                  value={form.introPosterUrl}
                  onChange={(e) => set("introPosterUrl", e.target.value)}
                />
              </Field>
            </div>
          )}
        </Section>

        <Section
          title="Translations"
          subtitle="Spanish copy for the widget. Visitors get a language toggle in the chat header."
        >
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.enableTranslation}
              onChange={(e) => set("enableTranslation", e.target.checked)}
              className="h-4 w-4 rounded border-ink-300"
            />
            <span className="text-sm">Enable Spanish translation in the widget</span>
          </label>
          {form.enableTranslation && (
            <div className="mt-4 space-y-4 rounded-lg border border-ink-300/60 bg-ink-100/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                Spanish (es)
              </p>
              <Field label="Welcome message — Spanish" full>
                <textarea
                  rows={2}
                  className="input"
                  placeholder="Hola — cuéntanos sobre tu caso y te llamamos pronto."
                  value={form.translations.es.welcomeMessage}
                  onChange={(e) => setEs("welcomeMessage", e.target.value)}
                />
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Bubble button — Spanish">
                  <input
                    className="input"
                    placeholder="Habla con nuestro equipo"
                    value={form.translations.es.bubbleText}
                    onChange={(e) => setEs("bubbleText", e.target.value)}
                  />
                </Field>
                <Field label="Tooltip — Spanish">
                  <input
                    className="input"
                    placeholder="Hola, ¿en qué podemos ayudarle?"
                    value={form.translations.es.bubbleTooltip}
                    onChange={(e) => setEs("bubbleTooltip", e.target.value)}
                  />
                </Field>
              </div>
              <p className="text-xs text-ink-500">
                Translate each flow step&apos;s question and options on the{" "}
                <a href={`/admin/${clientId}/flow`} className="text-brand-600 hover:underline">
                  Flow builder
                </a>
                .
              </p>
            </div>
          )}
        </Section>

        <div className="flex items-center gap-3 pt-2">
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
        <div className="relative h-[460px] bg-ink-100/70">
          {form.bubbleTooltip && (
            <div
              className={`absolute bottom-24 max-w-[260px] rounded-2xl bg-white p-3 text-sm text-ink-900 shadow-card ${
                form.widgetPosition === "bottom-right" ? "right-4" : "left-4"
              }`}
            >
              {form.bubbleTooltip}
            </div>
          )}
          {form.bubbleImageUrl ? (
            isVideoUrl(form.bubbleImageUrl) ? (
              <video
                src={form.bubbleImageUrl}
                autoPlay
                muted
                loop
                playsInline
                className={`absolute bottom-4 h-16 w-16 rounded-full border-4 object-cover shadow-card ${
                  form.widgetPosition === "bottom-right" ? "right-4" : "left-4"
                }`}
                style={{ borderColor: form.primaryColor }}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.bubbleImageUrl}
                alt="bubble avatar preview"
                className={`absolute bottom-4 h-16 w-16 rounded-full border-4 object-cover shadow-card ${
                  form.widgetPosition === "bottom-right" ? "right-4" : "left-4"
                }`}
                style={{ borderColor: form.primaryColor }}
              />
            )
          ) : (
            <button
              type="button"
              className={`absolute bottom-4 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-card ${
                form.widgetPosition === "bottom-right" ? "right-4" : "left-4"
              }`}
              style={{ background: form.primaryColor }}
            >
              {form.bubbleText}
            </button>
          )}
        </div>
      </aside>
    </form>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({
  label,
  help,
  full,
  children,
}: {
  label: string;
  help?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <label className="label">{label}</label>
      {children}
      {help && <p className="help">{help}</p>}
    </div>
  );
}

function isVideoUrl(url: string) {
  return /\.(mp4|webm|mov|m4v|ogg)(\?|#|$)/i.test(url);
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="mt-1 flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-12 cursor-pointer rounded border border-ink-300"
      />
      <input
        className="input mt-0 flex-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
