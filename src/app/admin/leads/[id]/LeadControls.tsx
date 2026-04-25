"use client";

import { useState, useTransition } from "react";

const STATUSES = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "booked", label: "Booked" },
  { value: "lost", label: "Lost" },
  { value: "spam", label: "Spam" },
];

export default function LeadControls({
  leadId,
  status,
  notes,
}: {
  leadId: string;
  status: string;
  notes: string;
}) {
  const [form, setForm] = useState({ status, notes });
  const [saving, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function update(next: Partial<typeof form>) {
    const merged = { ...form, ...next };
    setForm(merged);
    setMessage(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(merged),
      });
      if (res.ok) setMessage("Saved");
      else setMessage("Save failed");
    });
  }

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold">Lead status</h2>
      <select
        className="select mt-3"
        value={form.status}
        onChange={(e) => update({ status: e.target.value })}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <label className="label mt-5">Internal notes</label>
      <textarea
        rows={5}
        className="input"
        placeholder="Who called, next steps, quoted price…"
        value={form.notes}
        onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
        onBlur={(e) => update({ notes: e.target.value })}
      />
      <p className="mt-2 text-xs text-ink-500">
        {saving ? "Saving…" : message ? message : "Changes save automatically."}
      </p>
    </div>
  );
}
