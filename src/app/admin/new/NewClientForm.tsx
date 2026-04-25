"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const INDUSTRY_OPTIONS = [
  "Legal services",
  "Trucking & logistics",
  "Home services",
  "Healthcare",
  "Real estate",
  "Construction",
  "Professional services",
  "Other",
];

export default function NewClientForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    industry: INDUSTRY_OPTIONS[0],
    websiteUrl: "",
  });
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          body?.issues
            ? "Please check the highlighted fields."
            : "Could not create the business. Try again."
        );
        return;
      }
      const data = await res.json();
      router.push(`/admin/${data.client.id}/settings`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="card max-w-xl space-y-4 p-6">
      <div>
        <label className="label">Business name</label>
        <input
          className="input"
          placeholder="Ramos James Law"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          required
        />
      </div>
      <div>
        <label className="label">Industry</label>
        <select
          className="select"
          value={form.industry}
          onChange={(e) => set("industry", e.target.value)}
        >
          {INDUSTRY_OPTIONS.map((i) => (
            <option key={i} value={i}>
              {i}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="label">Website URL</label>
        <input
          className="input"
          type="url"
          placeholder="https://example.com"
          value={form.websiteUrl}
          onChange={(e) => set("websiteUrl", e.target.value)}
          required
        />
        <p className="help">
          We&apos;ll use this on the install screen and in the lead source data.
        </p>
      </div>

      <div className="flex items-center gap-3 border-t border-ink-300/60 pt-4">
        <button className="btn-primary" disabled={pending}>
          {pending ? "Creating…" : "Create business"}
        </button>
        {error && <span className="text-sm text-rose-600">{error}</span>}
      </div>
    </form>
  );
}
