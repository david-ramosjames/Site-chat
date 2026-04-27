-- Editable copy shown above the end CTAs after a lead submits.
-- ("Thanks — we got it!" + "The team will reach out shortly.")
ALTER TABLE "WidgetSettings"
  ADD COLUMN "successHeadline" TEXT,
  ADD COLUMN "successMessage"  TEXT;
