import { prisma } from "@/lib/prisma";
import DemoLoader from "./DemoLoader";

export const dynamic = "force-dynamic";

export default async function DemoPage({
  searchParams,
}: {
  searchParams: { clientId?: string };
}) {
  let clientId = searchParams.clientId ?? null;
  if (!clientId) {
    const first = await prisma.client.findFirst({
      where: { status: "active" },
      orderBy: { name: "asc" },
    });
    clientId = first?.id ?? null;
  }

  if (!clientId) {
    return (
      <main className="mx-auto max-w-3xl space-y-6 px-6 py-16">
        <p className="pill">Widget preview</p>
        <h1 className="text-2xl font-semibold">No business found</h1>
        <p className="text-ink-700">
          Create a business in the admin first, then come back here to preview the widget.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-6 py-16">
      <p className="pill">Widget preview</p>
      <h1 className="text-3xl font-semibold">This page simulates a customer website</h1>
      <p className="text-ink-700">
        The RJL-Chat widget has been injected in the corner of this page. Click the chat bubble
        to walk through the flow as a visitor would. Submissions land in the admin&apos;s leads
        dashboard.
      </p>
      <div className="card p-6 text-sm text-ink-700">
        <p className="font-semibold">Script loaded:</p>
        <pre className="mt-2 overflow-x-auto rounded bg-ink-900 p-3 text-xs text-ink-100">{`<script src="/widget.js" data-client-id="${clientId}" async></script>`}</pre>
      </div>
      <DemoLoader clientId={clientId} />
    </main>
  );
}
