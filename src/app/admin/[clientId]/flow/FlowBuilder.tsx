"use client";

import { useState, useTransition } from "react";

type Option = { value: string; label: string };
type NextLogic = { byOption?: Record<string, string> | null } | null;
type Step = {
  stepKey: string;
  order: number;
  question: string;
  inputType:
    | "text"
    | "phone"
    | "email"
    | "multiple_choice"
    | "yes_no"
    | "textarea"
    | "date"
    | "zip";
  isRequired: boolean;
  options: Option[];
  nextLogic: NextLogic;
  mediaType: "none" | "image" | "video";
  mediaUrl: string;
  thumbnailUrl: string;
  altText: string;
  mediaDisplayStyle: "above" | "below" | "background";
  translations: {
    es: { question: string; options: Option[] };
  };
};

const INPUT_TYPES: Step["inputType"][] = [
  "text",
  "phone",
  "email",
  "multiple_choice",
  "yes_no",
  "textarea",
  "date",
  "zip",
];

const INPUT_TYPE_LABELS: Record<Step["inputType"], string> = {
  text: "Text",
  phone: "Phone",
  email: "Email",
  multiple_choice: "Multiple choice",
  yes_no: "Yes / No",
  textarea: "Long text",
  date: "Date",
  zip: "ZIP code",
};

function getBranch(step: Step, optionValue: string): string {
  return step.nextLogic?.byOption?.[optionValue] ?? "";
}

function setBranch(
  current: NextLogic,
  optionValue: string,
  target: string | null
): NextLogic {
  const byOption: Record<string, string> = { ...(current?.byOption ?? {}) };
  if (target) byOption[optionValue] = target;
  else delete byOption[optionValue];
  if (Object.keys(byOption).length === 0) return null;
  return { ...(current ?? {}), byOption };
}

function BranchSelect({
  value,
  onChange,
  steps,
  currentStepKey,
}: {
  value: string;
  onChange: (target: string | null) => void;
  steps: Step[];
  currentStepKey: string;
}) {
  return (
    <select
      className="select mt-0 w-44"
      value={value}
      onChange={(e) => onChange(e.target.value || null)}
      title="Where this answer routes the visitor"
    >
      <option value="">→ Next question</option>
      <option value="__end">→ End: success + CTAs</option>
      <option value="__decline">→ End: thanks, can&apos;t help</option>
      <optgroup label="Jump to step">
        {steps
          .filter((s) => s.stepKey && s.stepKey !== currentStepKey)
          .map((s) => (
            <option key={s.stepKey} value={s.stepKey}>
              {s.stepKey}
            </option>
          ))}
      </optgroup>
    </select>
  );
}

function blankStep(index: number): Step {
  return {
    stepKey: `step_${index + 1}`,
    order: index,
    question: "New question",
    inputType: "text",
    isRequired: true,
    options: [],
    nextLogic: null as NextLogic,
    mediaType: "none",
    mediaUrl: "",
    thumbnailUrl: "",
    altText: "",
    mediaDisplayStyle: "above",
    translations: { es: { question: "", options: [] } },
  };
}

export default function FlowBuilder({
  clientId,
  initialSteps,
  translationsEnabled,
}: {
  clientId: string;
  initialSteps: Step[];
  translationsEnabled: boolean;
}) {
  const [steps, setSteps] = useState<Step[]>(
    initialSteps.length ? initialSteps : [blankStep(0)]
  );
  const [saving, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const update = (i: number, patch: Partial<Step>) =>
    setSteps((s) => s.map((step, idx) => (idx === i ? { ...step, ...patch } : step)));

  const move = (i: number, delta: -1 | 1) => {
    setSteps((s) => {
      const next = [...s];
      const swap = i + delta;
      if (swap < 0 || swap >= next.length) return s;
      [next[i], next[swap]] = [next[swap], next[i]];
      return next.map((st, idx) => ({ ...st, order: idx }));
    });
  };

  const remove = (i: number) =>
    setSteps((s) => s.filter((_, idx) => idx !== i).map((st, idx) => ({ ...st, order: idx })));

  const addStep = () =>
    setSteps((s) => [...s, blankStep(s.length)]);

  function save() {
    setError(null);
    setMessage(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/clients/${clientId}/flow`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          steps: steps.map((s, i) => ({
            ...s,
            order: i,
            options: s.inputType === "multiple_choice" ? s.options : null,
            mediaUrl: s.mediaUrl || null,
            thumbnailUrl: s.thumbnailUrl || null,
            altText: s.altText || null,
            translations: {
              es: {
                question: s.translations.es.question || undefined,
                options: s.inputType === "multiple_choice" ? s.translations.es.options : undefined,
              },
            },
          })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const first = body?.issues?.fieldErrors ? JSON.stringify(body.issues.fieldErrors) : "Could not save flow.";
        setError(first);
        return;
      }
      setMessage("Flow saved.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">{steps.length} step{steps.length === 1 ? "" : "s"}</p>
        <div className="flex gap-2">
          <button type="button" onClick={addStep} className="btn-secondary">
            + Add step
          </button>
          <button type="button" onClick={save} className="btn-primary" disabled={saving}>
            {saving ? "Saving…" : "Save flow"}
          </button>
        </div>
      </div>

      {message && <p className="text-sm text-emerald-600">{message}</p>}
      {error && <p className="text-sm text-rose-600">{error}</p>}

      <ol className="space-y-4">
        {steps.map((s, i) => (
          <li key={i} className="card p-5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <input
                  className="input mt-0 w-52"
                  value={s.stepKey}
                  onChange={(e) => update(i, { stepKey: e.target.value })}
                  placeholder="step_key"
                />
              </div>
              <div className="flex gap-1">
                <button type="button" className="btn-secondary" onClick={() => move(i, -1)} disabled={i === 0}>
                  ↑
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => move(i, 1)}
                  disabled={i === steps.length - 1}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-100"
                  onClick={() => remove(i)}
                >
                  Remove
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="label">Question text</label>
                <textarea
                  rows={2}
                  className="input"
                  value={s.question}
                  onChange={(e) => update(i, { question: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Input type</label>
                <select
                  className="select"
                  value={s.inputType}
                  onChange={(e) =>
                    update(i, {
                      inputType: e.target.value as Step["inputType"],
                      options: e.target.value === "multiple_choice" ? s.options : [],
                    })
                  }
                >
                  {INPUT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {INPUT_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>
              <label className="flex items-center gap-2 pt-7">
                <input
                  type="checkbox"
                  checked={s.isRequired}
                  onChange={(e) => update(i, { isRequired: e.target.checked })}
                  className="h-4 w-4 rounded border-ink-300"
                />
                <span className="text-sm">Required</span>
              </label>

              {s.inputType === "multiple_choice" && (
                <div className="md:col-span-2">
                  <label className="label">Choices &amp; branching</label>
                  <p className="help mt-0 mb-2">
                    Each option can route to a different question, or end the flow early.
                  </p>
                  <div className="space-y-2">
                    {s.options.map((opt, idx) => (
                      <div key={idx} className="flex flex-wrap items-center gap-2">
                        <input
                          className="input mt-0 flex-1 min-w-[140px]"
                          placeholder="Label"
                          value={opt.label}
                          onChange={(e) =>
                            update(i, {
                              options: s.options.map((o, j) => (j === idx ? { ...o, label: e.target.value } : o)),
                            })
                          }
                        />
                        <input
                          className="input mt-0 w-32"
                          placeholder="value"
                          value={opt.value}
                          onChange={(e) =>
                            update(i, {
                              options: s.options.map((o, j) => (j === idx ? { ...o, value: e.target.value } : o)),
                            })
                          }
                        />
                        <BranchSelect
                          value={getBranch(s, opt.value)}
                          onChange={(target) => update(i, { nextLogic: setBranch(s.nextLogic, opt.value, target) })}
                          steps={steps}
                          currentStepKey={s.stepKey}
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() =>
                            update(i, {
                              options: s.options.filter((_, j) => j !== idx),
                              nextLogic: setBranch(s.nextLogic, opt.value, null),
                            })
                          }
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() =>
                        update(i, {
                          options: [...s.options, { value: `opt_${s.options.length + 1}`, label: "Option" }],
                        })
                      }
                    >
                      + Add option
                    </button>
                  </div>
                </div>
              )}

              {s.inputType === "yes_no" && (
                <div className="md:col-span-2 rounded-lg border border-ink-300/60 bg-ink-100/40 p-3">
                  <p className="text-sm font-semibold">Branching</p>
                  <p className="help mt-0 mb-3">Send Yes and No to different questions if needed.</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-xs font-semibold text-ink-700">Yes →</span>
                      <BranchSelect
                        value={getBranch(s, "yes")}
                        onChange={(target) => update(i, { nextLogic: setBranch(s.nextLogic, "yes", target) })}
                        steps={steps}
                        currentStepKey={s.stepKey}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-12 text-xs font-semibold text-ink-700">No →</span>
                      <BranchSelect
                        value={getBranch(s, "no")}
                        onChange={(target) => update(i, { nextLogic: setBranch(s.nextLogic, "no", target) })}
                        steps={steps}
                        currentStepKey={s.stepKey}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="md:col-span-2 rounded-lg border border-ink-300/60 bg-ink-100/40 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold">Optional media</p>
                  <select
                    className="select mt-0 w-40"
                    value={s.mediaType}
                    onChange={(e) => update(i, { mediaType: e.target.value as Step["mediaType"] })}
                  >
                    <option value="none">No media</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                  </select>
                </div>

                {s.mediaType !== "none" && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="label">Media URL</label>
                      <input
                        className="input"
                        placeholder={
                          s.mediaType === "video"
                            ? "https://www.youtube.com/embed/... or .mp4"
                            : "https://cdn.example.com/photo.jpg"
                        }
                        value={s.mediaUrl}
                        onChange={(e) => update(i, { mediaUrl: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Thumbnail URL</label>
                      <input
                        className="input"
                        placeholder="Optional — used as video poster"
                        value={s.thumbnailUrl}
                        onChange={(e) => update(i, { thumbnailUrl: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Alt text</label>
                      <input
                        className="input"
                        value={s.altText}
                        onChange={(e) => update(i, { altText: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="label">Display style</label>
                      <select
                        className="select"
                        value={s.mediaDisplayStyle}
                        onChange={(e) =>
                          update(i, { mediaDisplayStyle: e.target.value as Step["mediaDisplayStyle"] })
                        }
                      >
                        <option value="above">Above question</option>
                        <option value="below">Below question</option>
                        <option value="background">Card background</option>
                      </select>
                    </div>
                    <p className="md:col-span-2 help">
                      Recommended: host images/videos on Cloudflare R2, S3, Supabase Storage, Vimeo, or another CDN.
                      Avoid serving large media directly from the app server.
                    </p>
                  </div>
                )}
              </div>

              {translationsEnabled && (
                <div className="md:col-span-2 rounded-lg border border-ink-300/60 bg-ink-100/40 p-4">
                  <p className="text-sm font-semibold">Spanish (es)</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="label">Question — Spanish</label>
                      <textarea
                        rows={2}
                        className="input"
                        placeholder="¿Con qué tipo de asunto legal podemos ayudarle?"
                        value={s.translations.es.question}
                        onChange={(e) =>
                          update(i, {
                            translations: {
                              es: {
                                ...s.translations.es,
                                question: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    {s.inputType === "multiple_choice" && s.options.length > 0 && (
                      <div className="md:col-span-2">
                        <label className="label">Choice labels — Spanish</label>
                        <div className="space-y-2">
                          {s.options.map((opt, idx) => {
                            const esOpt = s.translations.es.options.find((o) => o.value === opt.value);
                            return (
                              <div key={idx} className="flex items-center gap-2">
                                <span className="w-32 truncate text-xs text-ink-500">{opt.label}</span>
                                <input
                                  className="input mt-0 flex-1"
                                  placeholder={`Spanish for "${opt.label}"`}
                                  value={esOpt?.label ?? ""}
                                  onChange={(e) => {
                                    const others = s.translations.es.options.filter(
                                      (o) => o.value !== opt.value
                                    );
                                    update(i, {
                                      translations: {
                                        es: {
                                          ...s.translations.es,
                                          options: [
                                            ...others,
                                            { value: opt.value, label: e.target.value },
                                          ],
                                        },
                                      },
                                    });
                                  }}
                                />
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={addStep} className="btn-secondary">
          + Add step
        </button>
        <button type="button" onClick={save} className="btn-primary" disabled={saving}>
          {saving ? "Saving…" : "Save flow"}
        </button>
      </div>
    </div>
  );
}
