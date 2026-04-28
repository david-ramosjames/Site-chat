"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function DeleteLeadButton({
  leadId,
  name,
}: {
  leadId: string;
  name: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const ok = window.confirm(`Delete lead from ${name || "this visitor"}? This can't be undone.`);
    if (!ok) return;
    startTransition(async () => {
      const res = await fetch(`/api/admin/leads/${leadId}`, { method: "DELETE" });
      if (!res.ok) {
        alert("Could not delete lead.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      title="Delete lead"
      aria-label="Delete lead"
      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-ink-500 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
    >
      {pending ? "…" : "×"}
    </button>
  );
}
