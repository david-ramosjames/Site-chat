"use client";

import { useState, useTransition } from "react";

type Option = { value: string; label: string };
type NextLogic = { byOption?: Record<string, string> | null; default?: string | null } | null;
type LeadFieldByOption = Record<string, string> | null;
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
  leadField: "" | "name" | "phone" | "email" | "service" | "qualified" | "referral";
  leadFieldOnYes: string;
  leadFieldOnNo: string;
  leadFieldByOption: LeadFieldByOption;
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
  const next: NonNullable<NextLogic> = { ...(current ?? {}) };
  if (Object.keys(byOption).length === 0) delete (next as { byOption?: unknown }).byOption;
  else next.byOption = byOption;
  if (!next.byOption && !(next as { default?: string }).default) return null;
  return next;
}

function getDefaultBranch(step: Step): string {
  return (step.nextLogic as { default?: string } | null)?.default ?? "";
}

function setDefaultBranch(current: NextLogic, target: string | null): NextLogic {
  const next: { byOption?: Record<string, string> | null; default?: string } = {
    ...(current ?? {}),
    default: undefined,
  };
  if (current?.byOption) next.byOption = current.byOption;
  if (target) next.default = target;
  if (!next.byOption && !next.default) return null;
  return next;
}

function getLeadWrite(step: Step, optionValue: string): string {
  return step.leadFieldByOption?.[optionValue] ?? "";
}

function setLeadWrite(
  current: LeadFieldByOption,
  optionValue: string,
  write: string
): LeadFieldByOption {
  const next: Record<string, string> = { ...(current ?? {}) };
  if (write) next[optionValue] = write;
  else delete next[optionValue];
  return Object.keys(next).length ? next : null;
}

function renameLeadWrite(
  current: LeadFieldByOption,
  from: string,
  to: string
): LeadFieldByOption {
  if (!current || from === to || !(from in current)) return current;
  const next = { ...current };
  next[to] = next[from];
  delete next[from];
  return next;
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

function formatServerError(
  body: unknown,
  steps: { stepKey: string }[]
): string | null {
  const b = body as
    | {
        error?: string;
        detail?: string;
        issues?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
        stepIssues?: { path: (string | number)[]; message: string }[];
      }
    | undefined;
  if (!b) return null;

  // Step-level issues: path looks like ["steps", N, "stepKey", ...]. Surface
  // the first one with the human-readable step number and field.
  if (b.stepIssues?.length) {
    const first = b.stepIssues.find(
      (iss) => iss.path && iss.path[0] === "steps" && typeof iss.path[1] === "number"
    );
    if (first) {
      const idx = first.path[1] as number;
      const field = first.path
        .slice(2)
        .map((p) => String(p))
        .join(".");
      const stepLabel = steps[idx]?.stepKey ? `"${steps[idx].stepKey}"` : `#${idx + 1}`;
      return `Step ${idx + 1} ${stepLabel}: ${field || "field"} — ${first.message}`;
    }
    // Top-level issue not tied to a step (e.g. body shape).
    return b.stepIssues[0].message;
  }

  if (b.issues?.formErrors?.length) return b.issues.formErrors[0];
  if (b.issues?.fieldErrors) {
    for (const [k, msgs] of Object.entries(b.issues.fieldErrors)) {
      if (msgs?.length) return `${k}: ${msgs[0]}`;
    }
  }
  if (b.error === "db_error" && b.detail) return `Database: ${b.detail}`;
  if (b.error === "invalid_payload") return "Some fields didn't pass validation. Check option values and step keys.";
  if (b.error) return b.error;
  return null;
}

function blankStep(existing: Step[]): Step {
  // Find the next free `step_N` so we never collide with an existing key
  // (which would silently fail the save due to the DB unique constraint).
  const used = new Set(existing.map((s) => s.stepKey.trim()).filter(Boolean));
  let n = existing.length + 1;
  while (used.has(`step_${n}`)) n++;
  return {
    stepKey: `step_${n}`,
    order: existing.length,
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
    leadField: "",
    leadFieldOnYes: "",
    leadFieldOnNo: "",
    leadFieldByOption: null,
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
    initialSteps.length ? initialSteps : [blankStep([])]
  );
  // Collapsed by default so long flows are easy to scan. Newly added
  // steps open so you can fill them in immediately. A brand-new empty
  // flow starts with its placeholder step open.
  const [expanded, setExpanded] = useState<Set<number>>(
    () => (initialSteps.length ? new Set() : new Set([0]))
  );
  const [saving, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOpen = (i: number) => expanded.has(i);
  const toggle = (i: number) =>
    setExpanded((open) => {
      const next = new Set(open);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  const expandAll = () => setExpanded(new Set(steps.map((_, i) => i)));
  const collapseAll = () => setExpanded(new Set());

  const update = (i: number, patch: Partial<Step>) =>
    setSteps((s) => s.map((step, idx) => (idx === i ? { ...step, ...patch } : step)));

  const move = (i: number, delta: -1 | 1) => {
    const swap = i + delta;
    setSteps((s) => {
      const next = [...s];
      if (swap < 0 || swap >= next.length) return s;
      [next[i], next[swap]] = [next[swap], next[i]];
      return next.map((st, idx) => ({ ...st, order: idx }));
    });
    setExpanded((open) => {
      if (swap < 0 || swap >= steps.length) return open;
      const next = new Set(open);
      const a = next.has(i);
      const b = next.has(swap);
      if (a) next.add(swap);
      else next.delete(swap);
      if (b) next.add(i);
      else next.delete(i);
      return next;
    });
  };

  const remove = (i: number) => {
    setSteps((s) => s.filter((_, idx) => idx !== i).map((st, idx) => ({ ...st, order: idx })));
    setExpanded((open) => {
      const next = new Set<number>();
      for (const idx of open) {
        if (idx === i) continue;
        next.add(idx > i ? idx - 1 : idx);
      }
      return next;
    });
  };

  const addStep = () => {
    setExpanded((open) => new Set(open).add(steps.length));
    setSteps((s) => [...s, blankStep(s)]);
  };

  function save() {
    setError(null);
    setMessage(null);

    // Client-side guards so duplicate / invalid stepKeys don't silently 400.
    const keys: string[] = [];
    const dup = new Set<string>();
    const invalid = new Set<string>();
    const empty: number[] = [];
    steps.forEach((s, i) => {
      const k = s.stepKey.trim();
      if (!k) empty.push(i + 1);
      if (k && !/^[a-z0-9_\-]+$/i.test(k)) invalid.add(k);
      if (k && keys.includes(k)) dup.add(k);
      keys.push(k);
    });
    if (empty.length) {
      setError(`Step ${empty.join(", ")} is missing a step key.`);
      setExpanded((open) => {
        const next = new Set(open);
        empty.forEach((n) => next.add(n - 1));
        return next;
      });
      return;
    }
    if (invalid.size) {
      setError(
        `Step keys can only contain letters, numbers, dash, and underscore: ${[...invalid].join(", ")}`
      );
      setExpanded((open) => {
        const next = new Set(open);
        steps.forEach((s, i) => {
          if (invalid.has(s.stepKey.trim())) next.add(i);
        });
        return next;
      });
      return;
    }
    if (dup.size) {
      setError(
        `Duplicate step keys: ${[...dup].join(", ")}. Each step needs a unique key.`
      );
      setExpanded((open) => {
        const next = new Set(open);
        steps.forEach((s, i) => {
          if (dup.has(s.stepKey.trim())) next.add(i);
        });
        return next;
      });
      return;
    }

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
            leadField: s.leadField || null,
            leadFieldOnYes: s.leadFieldOnYes || null,
            leadFieldOnNo: s.leadFieldOnNo || null,
            leadFieldByOption:
              s.inputType === "multiple_choice" ? s.leadFieldByOption : null,
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
        setError(formatServerError(body, steps) || "Could not save flow.");
        return;
      }
      setMessage("Flow saved.");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <p className="text-sm text-ink-500">{steps.length} step{steps.length === 1 ? "" : "s"}</p>
          {steps.length > 1 && (
            <div className="flex gap-2 text-xs">
              <button type="button" className="text-brand-600 hover:underline" onClick={expandAll}>
                Expand all
              </button>
              <span className="text-ink-300">·</span>
              <button type="button" className="text-brand-600 hover:underline" onClick={collapseAll}>
                Collapse all
              </button>
            </div>
          )}
        </div>
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

      <ol className="space-y-2">
        {steps.map((s, i) => (
          <li key={i} className="card overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 sm:px-4">
              <button
                type="button"
                className="flex min-w-0 flex-1 items-center gap-3 rounded-lg px-1 py-1 text-left hover:bg-ink-100/60"
                onClick={() => toggle(i)}
                aria-expanded={isOpen(i)}
                aria-controls={`flow-step-${i}`}
              >
                <svg
                  viewBox="0 0 20 20"
                  className={`h-4 w-4 shrink-0 text-ink-500 transition-transform ${
                    isOpen(i) ? "rotate-90" : ""
                  }`}
                  aria-hidden
                >
                  <path
                    d="M7 5l6 5-6 5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink-900">
                    {s.question.trim() || "Untitled question"}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-ink-500">
                    {s.stepKey || "no key"} · {INPUT_TYPE_LABELS[s.inputType]}
                    {s.isRequired ? "" : " · optional"}
                  </span>
                </span>
              </button>
              <div className="flex shrink-0 gap-1">
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

            {isOpen(i) && (
              <div id={`flow-step-${i}`} className="border-t border-ink-300/60 p-5">
                <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="label">Step key</label>
                <input
                  className="input"
                  value={s.stepKey}
                  onChange={(e) => update(i, { stepKey: e.target.value })}
                  placeholder="step_key"
                />
              </div>
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
                      leadFieldByOption:
                        e.target.value === "multiple_choice" ? s.leadFieldByOption : null,
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

              <div className="md:col-span-2">
                <label className="label">Save answer to lead column</label>
                <select
                  className="select"
                  value={s.leadField}
                  onChange={(e) =>
                    update(i, { leadField: e.target.value as Step["leadField"] })
                  }
                >
                  <option value="">— Don&apos;t save to a column (still in answers JSON)</option>
                  <option value="name">Name</option>
                  <option value="phone">Phone</option>
                  <option value="email">Email</option>
                  <option value="service">Service</option>
                  <option value="qualified">Qualified</option>
                  <option value="referral">Referral</option>
                </select>
                <p className="help">
                  Pick which Lead-table column gets this answer. The full answer is also kept in
                  the lead&apos;s answers JSON regardless.
                </p>
                {s.inputType === "yes_no" &&
                  (s.leadField === "qualified" || s.leadField === "referral") && (
                    <div className="mt-3 rounded-lg border border-ink-300/60 bg-ink-100/40 p-3 text-sm">
                      <p className="font-semibold">
                        What gets written to the {s.leadField} column?
                      </p>
                      <p className="help mt-0 mb-3">
                        Override what the lead row stores based on the visitor&apos;s yes/no
                        answer. Useful when the question reads negatively, e.g. &quot;Do you have
                        an attorney?&quot; — answering No should set qualified = Yes.
                      </p>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="label">When answer is Yes, write:</label>
                          <select
                            className="select"
                            value={s.leadFieldOnYes}
                            onChange={(e) => update(i, { leadFieldOnYes: e.target.value })}
                          >
                            <option value="">— Use the raw answer (yes)</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                        <div>
                          <label className="label">When answer is No, write:</label>
                          <select
                            className="select"
                            value={s.leadFieldOnNo}
                            onChange={(e) => update(i, { leadFieldOnNo: e.target.value })}
                          >
                            <option value="">— Use the raw answer (no)</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
              </div>

              {s.inputType === "multiple_choice" && (
                <div className="md:col-span-2">
                  <label className="label">Choices &amp; branching</label>
                  <p className="help mt-0 mb-2">
                    Each option can route to a different question, or end the flow early.
                    {(s.leadField === "qualified" || s.leadField === "referral") && (
                      <>
                        {" "}
                        Because this step saves to {s.leadField}, pick what each choice writes
                        to that column (Yes / No) — otherwise the raw option value is stored.
                      </>
                    )}
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
                              options: s.options.map((o, j) =>
                                j === idx ? { ...o, value: e.target.value } : o
                              ),
                              leadFieldByOption: renameLeadWrite(
                                s.leadFieldByOption,
                                opt.value,
                                e.target.value
                              ),
                            })
                          }
                        />
                        <BranchSelect
                          value={getBranch(s, opt.value)}
                          onChange={(target) => update(i, { nextLogic: setBranch(s.nextLogic, opt.value, target) })}
                          steps={steps}
                          currentStepKey={s.stepKey}
                        />
                        {(s.leadField === "qualified" || s.leadField === "referral") && (
                          <select
                            className="select mt-0 w-36"
                            value={getLeadWrite(s, opt.value)}
                            onChange={(e) =>
                              update(i, {
                                leadFieldByOption: setLeadWrite(
                                  s.leadFieldByOption,
                                  opt.value,
                                  e.target.value
                                ),
                              })
                            }
                            title={`What to write to the ${s.leadField} column`}
                          >
                            <option value="">→ Raw value</option>
                            <option value="yes">→ Write Yes</option>
                            <option value="no">→ Write No</option>
                          </select>
                        )}
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() =>
                            update(i, {
                              options: s.options.filter((_, j) => j !== idx),
                              nextLogic: setBranch(s.nextLogic, opt.value, null),
                              leadFieldByOption: setLeadWrite(
                                s.leadFieldByOption,
                                opt.value,
                                ""
                              ),
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

              {(s.inputType === "text" ||
                s.inputType === "phone" ||
                s.inputType === "email" ||
                s.inputType === "zip" ||
                s.inputType === "date" ||
                s.inputType === "textarea") && (
                <div className="md:col-span-2 rounded-lg border border-ink-300/60 bg-ink-100/40 p-3">
                  <p className="text-sm font-semibold">After this step</p>
                  <p className="help mt-0 mb-3">
                    Where to go after the visitor answers. Use this on a final name/phone/email step
                    to end with success CTAs or with the &quot;can&apos;t help&quot; message.
                  </p>
                  <BranchSelect
                    value={getDefaultBranch(s)}
                    onChange={(target) => update(i, { nextLogic: setDefaultBranch(s.nextLogic, target) })}
                    steps={steps}
                    currentStepKey={s.stepKey}
                  />
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
              </div>
            )}
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
