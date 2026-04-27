import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import InstallSnippet from "./InstallSnippet";

export const dynamic = "force-dynamic";

export default async function InstallPage({ params }: { params: { clientId: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.clientId },
    include: { widgetSettings: true },
  });
  if (!client) notFound();

  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  const previewEn = `/demo?clientId=${encodeURIComponent(client.id)}&lang=en`;
  const previewEs = `/demo?clientId=${encodeURIComponent(client.id)}&lang=es`;
  const translationsEnabled = client.widgetSettings?.enableTranslation ?? false;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Install script</h2>
          <p className="text-sm text-ink-500">
            Paste this snippet into <strong>{client.name}</strong>&apos;s website to turn on the
            chat widget.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={previewEn} className="btn-secondary" target="_blank" rel="noreferrer">
            Preview — English ↗
          </Link>
          {translationsEnabled && (
            <Link href={previewEs} className="btn-secondary" target="_blank" rel="noreferrer">
              Preview — Spanish ↗
            </Link>
          )}
        </div>
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
