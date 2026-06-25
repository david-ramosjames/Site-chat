"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function RemovePageButton({
  clientId,
  page,
}: {
  clientId: string;
  page: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function remove() {
    setError(null);
    // Strip the path so the delete removes *all* events from this host —
    // typically what you want when cleaning up test traffic.
    const host = page.split("/")[0];
    const msg =
      `Remove ALL chat events from ${host}? This deletes the underlying ` +
      `event rows and cannot be undone (the leads themselves stay).`;
    if (!window.confirm(msg)) return;
    startTransition(async () => {
      const res = await fetch(
        `/api/admin/clients/${clientId}/events?host=${encodeURIComponent(host)}`,
        { method: "DELETE", cache: "no-store" }
      );
      if (!res.ok) {
        setError("Could not remove. Try again.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={remove}
      disabled={pending}
      title={error || "Remove all chat events from this host"}
      className="rounded border border-ink-300 bg-white px-2 py-0.5 text-xs text-ink-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-50"
    >
      {pending ? "…" : "Remove"}
    </button>
  );
}
