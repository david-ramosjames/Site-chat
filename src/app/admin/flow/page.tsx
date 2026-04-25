import { prisma } from "@/lib/prisma";
import { DEMO_CLIENT_ID } from "@/lib/demo";
import FlowBuilder from "./FlowBuilder";

export const dynamic = "force-dynamic";

export default async function FlowPage() {
  const steps = await prisma.flowStep.findMany({
    where: { clientId: DEMO_CLIENT_ID },
    orderBy: { order: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Flow builder</h1>
        <p className="text-sm text-ink-500">
          The questions your widget asks visitors. Reorder, edit, or add steps — click Save when you&apos;re done.
        </p>
      </div>
      <FlowBuilder
        clientId={DEMO_CLIENT_ID}
        initialSteps={steps.map((s) => ({
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
          nextLogic: s.nextLogic ?? null,
          mediaType: s.mediaType as "none" | "image" | "video",
          mediaUrl: s.mediaUrl ?? "",
          thumbnailUrl: s.thumbnailUrl ?? "",
          altText: s.altText ?? "",
          mediaDisplayStyle: s.mediaDisplayStyle as "above" | "below" | "background",
        }))}
      />
    </div>
  );
}
