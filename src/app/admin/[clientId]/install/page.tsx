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
            Two snippets, same chatbot. Use the site-wide one on the main website. Use the
            landing-page one only on the lead page.
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
          Paste before the closing <code className="rounded bg-ink-100 px-1">&lt;/body&gt;</code>{" "}
          tag, or through your CMS footer / code-injection tool.
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-ink-700">
          <li><strong>WordPress:</strong> Insert Headers and Footers, WPCode, or your theme&apos;s footer.php. For the landing page, add the second snippet on that page only (page-specific custom code) and do not also load the site-wide one there.</li>
          <li><strong>Webflow:</strong> Project settings → Custom code → Footer for the main site. Landing page → Page settings → Custom code for the second snippet.</li>
          <li><strong>Squarespace:</strong> Settings → Advanced → Code injection → Footer for the main site. Landing page → Page header injection for the second snippet.</li>
          <li><strong>Shopify:</strong> theme.liquid for the main site. Landing-page template only for the second snippet.</li>
          <li><strong>Custom site:</strong> Main layout footer vs. that landing page&apos;s template.</li>
        </ul>
      </section>
    </div>
  );
}
