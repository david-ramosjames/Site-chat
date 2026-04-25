import { prisma } from "@/lib/prisma";
import { DEMO_CLIENT_ID } from "@/lib/demo";
import InstallSnippet from "./InstallSnippet";

export const dynamic = "force-dynamic";

export default async function InstallPage() {
  const client = await prisma.client.findUnique({ where: { id: DEMO_CLIENT_ID } });
  if (!client) return <p className="card p-8 text-sm">No client found.</p>;

  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Install script</h1>
        <p className="text-sm text-ink-500">
          Paste this snippet into your site to turn on the chat widget.
        </p>
      </div>
      <InstallSnippet clientId={client.id} baseUrl={base} />

      <section className="card p-6">
        <h2 className="text-sm font-semibold">Where to paste it</h2>
        <p className="mt-2 text-sm text-ink-700">
          Paste this before the closing <code className="rounded bg-ink-100 px-1">&lt;/body&gt;</code>{" "}
          tag of your website, or add it through your WordPress header/footer plugin.
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink-700">
          <li><strong>WordPress:</strong> Insert Headers and Footers, WPCode, or your theme&apos;s footer.php.</li>
          <li><strong>Webflow:</strong> Project settings → Custom code → Footer code.</li>
          <li><strong>Squarespace:</strong> Settings → Advanced → Code injection → Footer.</li>
          <li><strong>Shopify:</strong> Online store → Themes → Edit code → theme.liquid, before <code className="rounded bg-ink-100 px-1">&lt;/body&gt;</code>.</li>
          <li><strong>Custom site:</strong> Paste before <code className="rounded bg-ink-100 px-1">&lt;/body&gt;</code> in your main template.</li>
        </ul>
      </section>
    </div>
  );
}
