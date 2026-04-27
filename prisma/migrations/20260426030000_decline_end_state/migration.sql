-- Adds an alternative end state for flows: a polite "thanks, we can't
-- help" message shown when branching routes to __decline. Lead still
-- submits but no success CTAs are rendered.
ALTER TABLE "WidgetSettings"
  ADD COLUMN "declineHeadline" TEXT,
  ADD COLUMN "declineMessage"  TEXT;
