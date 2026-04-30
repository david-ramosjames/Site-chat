"use client";

import { signOut, useSession } from "next-auth/react";

export default function AdminUserMenu() {
  const { data } = useSession();
  const email = data?.user?.email;
  if (!email) return null;
  return (
    <div className="border-t border-ink-300/60 px-5 py-4 text-xs text-ink-500">
      <div className="truncate" title={email}>
        Signed in as <span className="font-medium text-ink-700">{email}</span>
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mt-2 text-ink-500 underline-offset-2 hover:text-ink-700 hover:underline"
      >
        Sign out
      </button>
    </div>
  );
}
