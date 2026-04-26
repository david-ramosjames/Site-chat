-- Adds a layout choice for the intro video: "top" (existing 200px block at the
-- top of the panel) or "background" (full-bleed behind everything).
ALTER TABLE "WidgetSettings"
  ADD COLUMN "introVideoStyle" TEXT NOT NULL DEFAULT 'top';
