"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function BlockLeadButton({
  clientId,
  leadId,
  name,
}: {
  clientId: string;
  leadId: string;
  name: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function block() {
    const label = name || "this visitor";
    const ok = window.confirm(
      `Block ${label}? Their name, phone, and email will be added to the blocklist. Future chats will not create a lead or Slack message, and this lead will be marked spam.`
    );
    if (!ok) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/clients/${clientId}/blocklist`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fromLeadId: leadId }),
      });
      if (!res.ok) {
        setMessage("Could not block.");
        return;
      }
      setMessage("Blocked. Future submissions from them will be dropped.");
      router.refresh();
    });
  }

  return (
    <div className="card p-5">
      <h2 className="text-sm font-semibold">Block this person</h2>
      <p className="mt-2 text-sm text-ink-500">
        Stops this name, phone, and email from creating another lead or Slack alert.
      </p>
      <button
        type="button"
        className="btn-secondary mt-4"
        disabled={pending}
        onClick={block}
      >
        {pending ? "Blocking…" : "Add to blocklist"}
      </button>
      {message && <p className="mt-2 text-xs text-ink-500">{message}</p>}
    </div>
  );
}
