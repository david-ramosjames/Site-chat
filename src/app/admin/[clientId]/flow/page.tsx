import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FlowBuilder from "./FlowBuilder";
import EndCtasEditor from "./EndCtasEditor";

export const dynamic = "force-dynamic";

type StepTranslations = {
  es?: { question?: string; options?: { value: string; label: string }[] };
};
type StepNextLogic = { byOption?: Record<string, string> | null } | null;

type EndCta = { type: "call" | "text" | "schedule" | "link"; label: string; destination: string };

export default async function FlowPage({ params }: { params: { clientId: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.clientId },
    include: { widgetSettings: true },
  });
  if (!client) notFound();

  const endCtas = (client.widgetSettings?.endCtas as EndCta[] | null) ?? [];

  const steps = await prisma.flowStep.findMany({
    where: { clientId: params.clientId },
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">Flow builder</h2>
        <p className="text-sm text-ink-500">
          The questions your widget asks visitors. Reorder, edit, or add steps — click Save when
          you&apos;re done.
        </p>
      </div>
      <FlowBuilder
        clientId={params.clientId}
        translationsEnabled={client.widgetSettings?.enableTranslation ?? false}
        initialSteps={steps.map((s) => {
          const t = (s.translations as StepTranslations | null) ?? null;
          return {
            stepKey: s.stepKey,
            order: s.order,
            question: s.question,
            inputType: s.inputType as
              | "text"
              | "phone"
              | "email"
              | "multiple_choice"
              | "yes_no"
              | "textarea"
              | "date"
              | "zip",
            isRequired: s.isRequired,
            options: (s.options as { value: string; label: string }[] | null) ?? [],
            nextLogic: (s.nextLogic as StepNextLogic) ?? null,
            mediaType: s.mediaType as "none" | "image" | "video",
            mediaUrl: s.mediaUrl ?? "",
            thumbnailUrl: s.thumbnailUrl ?? "",
            altText: s.altText ?? "",
            mediaDisplayStyle: s.mediaDisplayStyle as "above" | "below" | "background",
            translations: {
              es: {
                question: t?.es?.question ?? "",
                options: t?.es?.options ?? [],
              },
            },
          };
        })}
      />

      <EndCtasEditor clientId={params.clientId} initial={endCtas} />
    </div>
  );
}
