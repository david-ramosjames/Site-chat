-- Adds three feature blocks to WidgetSettings:
--   * second welcome message + delay (re-engagement on the bubble tooltip)
--   * side action buttons (Phone/SMS/Messenger/WhatsApp etc.) stored as JSON
--   * end-of-flow CTAs (Call/Text/Schedule/etc.) stored as JSON
ALTER TABLE "WidgetSettings"
  ADD COLUMN "secondWelcomeMessage"  TEXT,
  ADD COLUMN "secondWelcomeDelaySec" INTEGER NOT NULL DEFAULT 30,
  ADD COLUMN "sideButtons"           JSONB,
  ADD COLUMN "endCtas"               JSONB;
