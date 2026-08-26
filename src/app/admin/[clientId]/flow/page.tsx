import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import FlowBuilder from "./FlowBuilder";
import EndCtasEditor from "./EndCtasEditor";
import DeclineEditor from "./DeclineEditor";

export const dynamic = "force-dynamic";

type StepTranslations = {
  es?: { question?: string; options?: { value: string; label: string }[] };
};
type StepNextLogic = { byOption?: Record<string, string> | null } | null;

type EndCta = {
  type: "call" | "text" | "schedule" | "link";
  label: string;
  labelEs?: string | null;
  destination: string;
};

type WidgetTranslations = {
  es?: {
    declineHeadline?: string;
    declineMessage?: string;
    successHeadline?: string;
    successMessage?: string;
  };
} | null;

export default async function FlowPage({ params }: { params: { clientId: string } }) {
  const client = await prisma.client.findUnique({
    where: { id: params.clientId },
    include: { widgetSettings: true },
  });
  if (!client) notFound();

  const ws = client.widgetSettings;
  const endCtas = (ws?.endCtas as EndCta[] | null) ?? [];
  const declineCtas = (ws?.declineCtas as EndCta[] | null) ?? [];
  const widgetTranslations = (ws?.translations as WidgetTranslations) ?? null;

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
        translationsEnabled={client.widgetSettings?.enableTranslation ?? true}
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
            leadField:
              (s.leadField as "name" | "phone" | "email" | "service" | "qualified" | "referral" | null) ??
              "",
            leadFieldOnYes: s.leadFieldOnYes ?? "",
            leadFieldOnNo: s.leadFieldOnNo ?? "",
            leadFieldByOption:
              s.leadFieldByOption &&
              typeof s.leadFieldByOption === "object" &&
              !Array.isArray(s.leadFieldByOption)
                ? (s.leadFieldByOption as Record<string, string>)
                : null,
            translations: {
              es: {
                question: t?.es?.question ?? "",
                options: t?.es?.options ?? [],
              },
            },
          };
        })}
      />

      <EndCtasEditor
        clientId={params.clientId}
        initial={endCtas}
        translationsEnabled={ws?.enableTranslation ?? true}
        initialCopy={{
          successHeadline: ws?.successHeadline ?? "",
          successMessage: ws?.successMessage ?? "",
          successHeadlineEs: widgetTranslations?.es?.successHeadline ?? "",
          successMessageEs: widgetTranslations?.es?.successMessage ?? "",
        }}
      />

      <DeclineEditor
        clientId={params.clientId}
        translationsEnabled={ws?.enableTranslation ?? true}
        initial={{
          declineHeadline: ws?.declineHeadline ?? "",
          declineMessage: ws?.declineMessage ?? "",
          declineCtas,
          translations: {
            es: {
              declineHeadline: widgetTranslations?.es?.declineHeadline ?? "",
              declineMessage: widgetTranslations?.es?.declineMessage ?? "",
            },
          },
        }}
      />
    </div>
  );
}
