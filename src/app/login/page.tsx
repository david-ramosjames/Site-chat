"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginInner() {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/admin";
  const error = params.get("error");

  // NextAuth surfaces `?error=AccessDenied` when our signIn callback
  // rejects an account (wrong email domain, unverified address, etc.).
  // The other error codes ("Configuration", "Verification", …) get a
  // generic message — we don't need to leak detail to a stranger.
  const errorMessage =
    error === "AccessDenied"
      ? "That account isn't allowed. Sign in with your @ramosjames.com email."
      : error
        ? "Sign-in failed. Please try again."
        : null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-100/60 px-4">
      <div className="w-full max-w-sm rounded-xl border border-ink-300/60 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-base font-semibold text-white">
            RJ
          </span>
          <span className="text-base font-semibold">RJL-Chat admin</span>
        </div>
        <h1 className="text-lg font-semibold">Sign in</h1>
        <p className="mt-1 text-sm text-ink-500">
          Use your Ramos James Google account to access the admin panel.
        </p>

        {errorMessage ? (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl })}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-md border border-ink-300 bg-white px-4 py-2.5 text-sm font-medium text-ink-700 shadow-sm hover:bg-ink-100"
        >
          <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.4 0 10.3-2.1 14-5.4l-6.5-5.5C29.5 34.7 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8.1l-6.5 5C9.6 39.6 16.2 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.4 5.6l6.5 5.5C40.6 36.5 44 30.8 44 24c0-1.3-.1-2.4-.4-3.5z"
            />
          </svg>
          Continue with Google
        </button>
      </div>
    </div>
  );
}

export default function LoginPage() {
  // useSearchParams needs a Suspense boundary in the App Router.
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
