-- Default country for visitor-entered phone normalisation. "US" prepends
-- +1 to 10-digit numbers; "MX" prepends +52. Used by CallRail dispatch
-- (and any future SMS integrations) to produce E.164.
ALTER TABLE "WidgetSettings"
  ADD COLUMN "defaultPhoneCountry" TEXT NOT NULL DEFAULT 'US';
