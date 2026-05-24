ALTER TABLE "WidgetSettings"
  ADD COLUMN "headerSubtitle" TEXT,
  ADD COLUMN "headerSubtitleEs" TEXT,
  ADD COLUMN "showVideoControls" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "headerButtonColor" TEXT;
