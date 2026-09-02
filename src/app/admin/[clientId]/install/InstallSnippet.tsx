"use client";

import { useEffect, useState, type ReactNode } from "react";

function SnippetCard({
  title,
  snippet,
  children,
}: {
  title: string;
  snippet: string;
  children: ReactNode;
}) {
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
        <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{title}</p>
        <button onClick={copy} className="btn-secondary">
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto bg-ink-900 p-5 text-xs leading-6 text-ink-100">
        <code>{snippet}</code>
      </pre>
      <div className="space-y-2 border-t border-ink-300/60 px-5 py-4 text-sm text-ink-700">
        {children}
      </div>
    </div>
  );
}

export default function InstallSnippet({ clientId, baseUrl }: { clientId: string; baseUrl: string }) {
  const [origin, setOrigin] = useState<string>(baseUrl || "https://rjl-chat.example.com");
  useEffect(() => {
    if (!baseUrl && typeof window !== "undefined") setOrigin(window.location.origin);
  }, [baseUrl]);

  const src = `${origin}/widget.js`;
  const siteSnippet = `<script\n  src="${src}"\n  data-client-id="${clientId}"\n  async>\n</script>`;
  const pageSnippet = `<script\n  src="${src}"\n  data-client-id="${clientId}"\n  data-show-when="#YOUR-SECTION-ID"\n  async>\n</script>`;

  return (
    <div className="space-y-4">
      <SnippetCard title="1. Main website (site-wide)" snippet={siteSnippet}>
        <p>
          Use this on the Ramos James site — header/footer plugin, theme footer, or before{" "}
          <code className="rounded bg-ink-100 px-1">&lt;/body&gt;</code>.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Desktop:</strong> corner bubble only. Chat stays closed until they click.
          </li>
          <li>
            <strong>Mobile:</strong> same — bubble only, no auto-open.
          </li>
        </ul>
        <p className="text-xs text-ink-500">
          Client ID: <span className="font-mono text-ink-700">{clientId}</span>
        </p>
      </SnippetCard>

      <SnippetCard title="2. Lead landing page (same bot)" snippet={pageSnippet}>
        <p>
          Same <code className="rounded bg-ink-100 px-1">data-client-id</code> — same chat flow.
          Paste this on the landing page <strong>instead of</strong> the site-wide script. Do not
          load both on the same page.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Desktop:</strong> corner bubble, same as the main website. Chat does not
            auto-open.
          </li>
          <li>
            <strong>Mobile:</strong> bubble only while the tagged section is on screen. Hidden
            above/below that section. Chat still does not auto-open.
          </li>
        </ul>
        <p>
          On the landing page, add an <code className="rounded bg-ink-100 px-1">id</code> to the
          section where the bubble should appear (form, CTA, etc.):
        </p>
        <pre className="overflow-x-auto rounded-lg bg-ink-100 p-3 text-xs text-ink-800">
          <code>{`<div id="chat-section">…your form or CTA…</div>`}</code>
        </pre>
        <p>
          Then change <code className="rounded bg-ink-100 px-1">#YOUR-SECTION-ID</code> in the
          script to <code className="rounded bg-ink-100 px-1">#chat-section</code> (or whatever
          id you used). If the selector doesn&apos;t match, mobile falls back to the always-on
          bubble.
        </p>
      </SnippetCard>
    </div>
  );
}
