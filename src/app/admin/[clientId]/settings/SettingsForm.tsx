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
  introVideoEndImageUrl: string;
  introVideoStyle: "top" | "background";
  bubbleImageUrl: string;
  bubbleTooltip: string;
  chatAvatarUrl: string;
  enableTranslation: boolean;
  translations: {
    es: {
      welcomeMessage: string;
      bubbleText: string;
      bubbleTooltip: string;
      secondWelcomeMessage: string;
      declineHeadline: string;
      declineMessage: string;
    };
  };
  declineHeadline: string;
  declineMessage: string;
  secondWelcomeMessage: string;
  secondWelcomeDelaySec: number;
  sideButtons: SideButton[];
  sideButtonsPosition: "bottom" | "center";
  openOnLoad: boolean;
  googleAdsConversionId: string;
  googleAdsConversionLabel: string;
};

type SideButton = {
  type: "phone" | "sms" | "messenger" | "whatsapp" | "custom";
  label: string;
  destination: string;
  showOnDesktop: boolean;
  showOnMobile: boolean;
  showInEnglish: boolean;
  showInSpanish: boolean;
};

const SIDE_BUTTON_PRESETS: Record<SideButton["type"], { label: string; placeholder: string }> = {
  phone: { label: "Phone (call)", placeholder: "+15125550100" },
  sms: { label: "SMS / Text", placeholder: "+15125550100" },
  messenger: { label: "Facebook Messenger", placeholder: "https://m.me/yourpage" },
  whatsapp: { label: "WhatsApp", placeholder: "+15125550100 or https://wa.me/15125550100" },
  custom: { label: "Custom link", placeholder: "https://..." },
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
            secondWelcomeMessage: form.translations.es.secondWelcomeMessage || undefined,
            declineHeadline: form.translations.es.declineHeadline || undefined,
            declineMessage: form.translations.es.declineMessage || undefined,
          },
        },
        sideButtons: form.sideButtons
          .filter((b) => b.destination.trim().length > 0)
          .map((b) => ({
            ...b,
            label: b.label.trim() || null,
          })),
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

        <Section
          title="How the widget appears on load"
          subtitle="Pick whether visitors see just the floating avatar/bubble or the chat panel opens automatically (great if you want the intro video to play right away)."
        >
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => set("openOnLoad", false)}
              className={`rounded-lg border p-3 text-left text-sm transition ${
                !form.openOnLoad
                  ? "border-brand-500/50 bg-brand-50"
                  : "border-ink-300 bg-white hover:bg-ink-100"
              }`}
            >
              <p className="font-semibold">Floating avatar / bubble</p>
              <p className="mt-1 text-xs text-ink-500">
                Show the chat icon in the corner. Visitor clicks to open. (Default)
              </p>
            </button>
            <button
              type="button"
              onClick={() => set("openOnLoad", true)}
              className={`rounded-lg border p-3 text-left text-sm transition ${
                form.openOnLoad
                  ? "border-brand-500/50 bg-brand-50"
                  : "border-ink-300 bg-white hover:bg-ink-100"
              }`}
            >
              <p className="font-semibold">Open chat automatically</p>
              <p className="mt-1 text-xs text-ink-500">
                Desktop only. Panel pops open on page load so the intro video starts immediately.
                Mobile visitors still see the floating avatar.
              </p>
            </button>
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
            {form.enableTranslation && (
              <Field label="Welcome message — Spanish" full>
                <textarea
                  rows={2}
                  className="input"
                  placeholder="Hola — cuéntanos sobre tu caso y te llamamos pronto."
                  value={form.translations.es.welcomeMessage}
                  onChange={(e) => setEs("welcomeMessage", e.target.value)}
                />
              </Field>
            )}
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
            {form.enableTranslation && (
              <Field label="Tooltip / opener text — Spanish">
                <input
                  className="input"
                  placeholder="Hola, ¿en qué podemos ayudarle?"
                  value={form.translations.es.bubbleTooltip}
                  onChange={(e) => setEs("bubbleTooltip", e.target.value)}
                />
              </Field>
            )}
            <Field label="Button label" help="Fallback pill button when no avatar image is set.">
              <input
                className="input"
                value={form.bubbleText}
                onChange={(e) => set("bubbleText", e.target.value)}
                required
              />
            </Field>
            {form.enableTranslation && (
              <Field label="Button label — Spanish">
                <input
                  className="input"
                  placeholder="Habla con nuestro equipo"
                  value={form.translations.es.bubbleText}
                  onChange={(e) => setEs("bubbleText", e.target.value)}
                />
              </Field>
            )}
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
              <Field label="Layout" help="Top: a 200px-tall video block above the conversation. Background: full-bleed behind the messages and options (best with a portrait/vertical video).">
                <select
                  className="select"
                  value={form.introVideoStyle}
                  onChange={(e) => set("introVideoStyle", e.target.value as "top" | "background")}
                >
                  <option value="top">Top of panel</option>
                  <option value="background">Full background</option>
                </select>
              </Field>
              <Field label="Video URL" help="MP4 from your CDN works best for background mode. YouTube/Vimeo embeds work too." full>
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
              <Field
                label="Image after video ends"
                help="Optional. When the video finishes playing, this image takes its place. Useful for a smiling close-up or a 'Tap to chat' card."
                full
              >
                <input
                  className="input"
                  placeholder="https://cdn.example.com/intro-end.jpg"
                  value={form.introVideoEndImageUrl}
                  onChange={(e) => set("introVideoEndImageUrl", e.target.value)}
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
            <p className="mt-3 text-xs text-ink-500">
              Spanish copy fields appear inline below each English field — Welcome message,
              Tooltip / opener text, and Button label above. Translate each flow step&apos;s
              question and options on the{" "}
              <a href={`/admin/${clientId}/flow`} className="text-brand-600 hover:underline">
                Flow builder
              </a>
              .
            </p>
          )}
        </Section>

        <Section
          title="Decline state"
          subtitle="Optional 'thanks but we can't help' message. Used when a flow branch routes to 'End with decline'. The lead is still captured; the visitor just sees this courteous message instead of the success CTAs."
        >
          <div className="space-y-4">
            <Field label="Headline">
              <input
                className="input"
                placeholder="Thanks for reaching out"
                value={form.declineHeadline}
                onChange={(e) => set("declineHeadline", e.target.value)}
              />
            </Field>
            <Field label="Message">
              <textarea
                rows={3}
                className="input"
                placeholder="Unfortunately we're not able to take this case. We wish you the best of luck and recommend reaching out to your local bar association for a referral."
                value={form.declineMessage}
                onChange={(e) => set("declineMessage", e.target.value)}
              />
            </Field>
            {form.enableTranslation && (
              <div className="rounded-lg border border-ink-300/60 bg-ink-100/40 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                  Spanish (es)
                </p>
                <Field label="Headline — Spanish" full>
                  <input
                    className="input"
                    placeholder="Gracias por escribirnos"
                    value={form.translations.es.declineHeadline}
                    onChange={(e) => setEs("declineHeadline", e.target.value)}
                  />
                </Field>
                <Field label="Message — Spanish" full>
                  <textarea
                    rows={3}
                    className="input"
                    placeholder="Lamentablemente no podemos tomar este caso..."
                    value={form.translations.es.declineMessage}
                    onChange={(e) => setEs("declineMessage", e.target.value)}
                  />
                </Field>
              </div>
            )}
          </div>
        </Section>

        <Section
          title="Re-engagement"
          subtitle="Show a second welcome message on the floating bubble after a delay if the visitor hasn't opened the chat yet."
        >
          <div className="grid gap-5 sm:grid-cols-[1fr_140px]">
            <Field label="Second welcome message">
              <textarea
                rows={2}
                className="input"
                placeholder="Still browsing? Tell us about your case — we reply in minutes."
                value={form.secondWelcomeMessage}
                onChange={(e) => set("secondWelcomeMessage", e.target.value)}
              />
              <p className="help">
                Replaces the bubble tooltip after the delay below. Leave blank to disable.
              </p>
            </Field>
            <Field label="Delay (seconds)">
              <input
                className="input"
                type="number"
                min={5}
                max={600}
                value={form.secondWelcomeDelaySec}
                onChange={(e) =>
                  set("secondWelcomeDelaySec", Math.max(5, Math.min(600, Number(e.target.value) || 30)))
                }
              />
            </Field>
          </div>
          {form.enableTranslation && (
            <div className="mt-4 rounded-lg border border-ink-300/60 bg-ink-100/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">
                Spanish (es)
              </p>
              <Field label="Second welcome message — Spanish" full>
                <textarea
                  rows={2}
                  className="input"
                  placeholder="¿Aún navegando? Cuéntanos sobre tu caso — respondemos en minutos."
                  value={form.translations.es.secondWelcomeMessage}
                  onChange={(e) => setEs("secondWelcomeMessage", e.target.value)}
                />
              </Field>
            </div>
          )}
        </Section>

        <Section
          title="Side action buttons"
          subtitle="A floating column of quick actions on the left side of the page (Phone, SMS, Messenger, WhatsApp). Each button is independently shown/hidden by device and language."
        >
          <Field label="Vertical alignment" help="Where the whole stack sits on the left edge of the screen.">
            <select
              className="select"
              value={form.sideButtonsPosition}
              onChange={(e) => set("sideButtonsPosition", e.target.value as "bottom" | "center")}
            >
              <option value="bottom">Bottom of left edge</option>
              <option value="center">Vertically centered</option>
            </select>
          </Field>
          <div className="mt-4">
            <SideButtonsEditor
              buttons={form.sideButtons}
              onChange={(buttons) => set("sideButtons", buttons)}
            />
          </div>
        </Section>

        <Section
          title="Conversion tracking"
          subtitle="Fires a Google Ads conversion event when a visitor reaches the success state. Requires Google Tag (gtag.js) to already be loaded on the host site."
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              label="Google Ads Conversion ID"
              help="Looks like AW-1234567890. Find it under Google Ads → Goals → Conversions → your action → Tag setup."
            >
              <input
                className="input"
                placeholder="AW-1234567890"
                value={form.googleAdsConversionId}
                onChange={(e) => set("googleAdsConversionId", e.target.value)}
              />
            </Field>
            <Field
              label="Conversion Label"
              help="The label shown on the same Tag setup screen, e.g. abcDEF123-."
            >
              <input
                className="input"
                placeholder="abcDEF123-"
                value={form.googleAdsConversionLabel}
                onChange={(e) => set("googleAdsConversionLabel", e.target.value)}
              />
            </Field>
          </div>
          <p className="mt-3 text-xs text-ink-500">
            On success the widget calls{" "}
            <code className="rounded bg-ink-100 px-1">
              gtag(&apos;event&apos;,&apos;conversion&apos;,&#123; send_to: ID/LABEL &#125;)
            </code>{" "}
            on the host page. A{" "}
            <code className="rounded bg-ink-100 px-1">
              dataLayer.push(&#123; event:&apos;rjl_chat_lead_submitted&apos; &#125;)
            </code>{" "}
            also fires either way so GTM-based setups can pick it up too.
          </p>
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

function SideButtonsEditor({
  buttons,
  onChange,
}: {
  buttons: SideButton[];
  onChange: (next: SideButton[]) => void;
}) {
  function update(i: number, patch: Partial<SideButton>) {
    onChange(buttons.map((b, idx) => (idx === i ? { ...b, ...patch } : b)));
  }
  function remove(i: number) {
    onChange(buttons.filter((_, idx) => idx !== i));
  }
  function add() {
    onChange([
      ...buttons,
      {
        type: "phone",
        label: "",
        destination: "",
        showOnDesktop: true,
        showOnMobile: true,
        showInEnglish: true,
        showInSpanish: true,
      },
    ]);
  }

  return (
    <div className="space-y-3">
      {buttons.length === 0 && (
        <p className="text-xs text-ink-500">
          No side buttons yet. Click <strong>+ Add button</strong> to add one.
        </p>
      )}
      {buttons.map((b, i) => (
        <div key={i} className="rounded-lg border border-ink-300/60 bg-white p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
            <Field label="Type">
              <select
                className="select"
                value={b.type}
                onChange={(e) => update(i, { type: e.target.value as SideButton["type"] })}
              >
                {(Object.keys(SIDE_BUTTON_PRESETS) as SideButton["type"][]).map((t) => (
                  <option key={t} value={t}>
                    {SIDE_BUTTON_PRESETS[t].label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Destination" help="Phone number for phone/SMS/WhatsApp; URL for Messenger or custom.">
              <input
                className="input"
                placeholder={SIDE_BUTTON_PRESETS[b.type].placeholder}
                value={b.destination}
                onChange={(e) => update(i, { destination: e.target.value })}
              />
            </Field>
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
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <Field label="Custom label" help="Optional — overrides the default tooltip when hovering the button.">
              <input
                className="input"
                placeholder="Call us"
                value={b.label}
                onChange={(e) => update(i, { label: e.target.value })}
              />
            </Field>
            <div className="flex items-end">
              <div className="flex flex-wrap gap-2 text-sm">
                <Toggle
                  label="Desktop"
                  checked={b.showOnDesktop}
                  onChange={(v) => update(i, { showOnDesktop: v })}
                />
                <Toggle
                  label="Mobile"
                  checked={b.showOnMobile}
                  onChange={(v) => update(i, { showOnMobile: v })}
                />
                <Toggle
                  label="English"
                  checked={b.showInEnglish}
                  onChange={(v) => update(i, { showInEnglish: v })}
                />
                <Toggle
                  label="Spanish"
                  checked={b.showInSpanish}
                  onChange={(v) => update(i, { showInSpanish: v })}
                />
              </div>
            </div>
          </div>
        </div>
      ))}
      <button type="button" className="btn-secondary" onClick={add}>
        + Add button
      </button>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label
      className={`flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition ${
        checked
          ? "border-brand-500 bg-brand-50 text-brand-700"
          : "border-ink-300 bg-white text-ink-500"
      }`}
    >
      <input
        type="checkbox"
        className="h-3 w-3"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      {label}
    </label>
  );
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
