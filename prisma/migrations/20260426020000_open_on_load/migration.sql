-- Adds the auto-open-on-page-load behavior toggle.
ALTER TABLE "WidgetSettings"
  ADD COLUMN "openOnLoad" BOOLEAN NOT NULL DEFAULT false;
