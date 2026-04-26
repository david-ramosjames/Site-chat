-- Adds a post-video image. After the intro video finishes playing the
-- widget swaps the <video> for an <img> at this URL (same position,
-- same object-fit). Plus, the intro video no longer loops.
ALTER TABLE "WidgetSettings"
  ADD COLUMN "introVideoEndImageUrl"  TEXT,
  ADD COLUMN "sideButtonsPosition"    TEXT NOT NULL DEFAULT 'bottom';
