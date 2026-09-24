"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type Entry = {
  id: string;
  kind: string;
  value: string;
  note: string;
  createdAt: string;
};

const KINDS = [
  { value: "phone", label: "Phone" },
  { value: "email", label: "Email" },
  { value: "name", label: "Name" },
] as const;

const KIND_LABEL: Record<string, string> = {
  phone: "Phone",
  email: "Email",
  name: "Name",
};

export default function BlocklistManager({
  clientId,
  initial,
}: {
  clientId: string;
  initial: Entry[];
}) {
  const router = useRouter();
  const [kind, setKind] = useState<(typeof KINDS)[number]["value"]>("phone");
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch(`/api/admin/clients/${clientId}/blocklist`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, value: value.trim(), note: note.trim() || null }),
      });
      const body = await res.json().catch(() => null);
      if (res.status === 409) {
        setError("That value is already blocked.");
        return;
      }
      if (!res.ok) {
        setError(body?.error === "invalid_value" ? "Enter a valid name, phone, or email." : "Could not add.");
        return;
      }
      setValue("");
      setNote("");
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!window.confirm("Remove this from the blocklist?")) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/clients/${clientId}/blocklist/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError("Could not remove.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <form className="card grid gap-3 p-5 md:grid-cols-[140px_1fr_1fr_auto]" onSubmit={add}>
        <div>
          <label className="label" htmlFor="block-kind">
            Type
          </label>
          <select
            id="block-kind"
            className="select"
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
          >
            {KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="block-value">
            Value
          </label>
          <input
            id="block-value"
            className="input"
            required
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={
              kind === "phone"
                ? "(512) 555-0100"
                : kind === "email"
                  ? "spam@example.com"
                  : "Full name as they type it"
            }
          />
        </div>
        <div>
          <label className="label" htmlFor="block-note">
            Note (optional)
          </label>
          <input
            id="block-note"
            className="input"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Repeat caller, SEO spam…"
          />
        </div>
        <div className="flex items-end">
          <button type="submit" className="btn-primary w-full md:w-auto" disabled={pending}>
            {pending ? "Saving…" : "Block"}
          </button>
        </div>
        {error && <p className="md:col-span-4 text-sm text-rose-700">{error}</p>}
        <p className="md:col-span-4 help">
          Phone numbers match across formats (512-555-0100 and +1 512 555 0100 are the same).
          Names match the full name, ignoring capitalization. Emails are case-insensitive.
        </p>
      </form>

      {initial.length === 0 ? (
        <div className="card p-6 text-sm text-ink-500">
          Nothing blocked yet. Add a phone, email, or name above, or use{" "}
          <strong>Block this person</strong> on a spam lead.
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-300/60 text-xs uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3">Added</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-300/60">
              {initial.map((entry) => (
                <tr key={entry.id}>
                  <td className="px-4 py-3">
                    <span className="pill border border-ink-300 bg-ink-100">
                      {KIND_LABEL[entry.kind] ?? entry.kind}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium">{entry.value}</td>
                  <td className="px-4 py-3 text-ink-500">{entry.note || "—"}</td>
                  <td className="px-4 py-3 text-xs text-ink-500">
                    {new Intl.DateTimeFormat("en-US", {
                      dateStyle: "medium",
                    }).format(new Date(entry.createdAt))}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      className="text-xs font-semibold text-rose-600 hover:underline disabled:opacity-50"
                      disabled={pending}
                      onClick={() => remove(entry.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
