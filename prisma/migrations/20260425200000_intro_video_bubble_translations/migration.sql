-- AlterTable: WidgetSettings — intro video + bubble avatar + translation toggle
ALTER TABLE "WidgetSettings"
  ADD COLUMN "introVideoEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "introVideoUrl" TEXT,
  ADD COLUMN "introPosterUrl" TEXT,
  ADD COLUMN "bubbleImageUrl" TEXT,
  ADD COLUMN "bubbleTooltip" TEXT,
  ADD COLUMN "enableTranslation" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "translations" JSONB;

-- AlterTable: FlowStep — per-step translations
ALTER TABLE "FlowStep"
  ADD COLUMN "translations" JSONB;
