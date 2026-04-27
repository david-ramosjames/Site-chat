"use client";

import { useEffect, useState } from "react";

export default function InstallSnippet({ clientId, baseUrl }: { clientId: string; baseUrl: string }) {
  const [origin, setOrigin] = useState<string>(baseUrl || "https://rjl-chat.example.com");
  useEffect(() => {
    if (!baseUrl && typeof window !== "undefined") setOrigin(window.location.origin);
  }, [baseUrl]);

  const snippet = `<script\n  src="${origin}/widget.js"\n  data-client-id="${clientId}"\n  async>\n</script>`;
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    });
  }

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-ink-300/60 px-5 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">Your script</p>
        <button onClick={copy} className="btn-secondary">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto bg-ink-900 p-5 text-xs leading-6 text-ink-100">
        <code>{snippet}</code>
      </pre>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-300/60 px-5 py-3 text-xs text-ink-500">
        <p>
          Client ID: <span className="font-mono text-ink-700">{clientId}</span>
        </p>
      </div>
    </div>
  );
}
