-- CallRail integration + extended attribution.
-- Lead: capture extra attribution (utm_term, utm_content, gclid, msclkid,
-- landing page, CallRail session id, CallRail form submission id).
-- WidgetSettings: dynamic number toggle + wait time + optional selector.
-- NotificationSettings: CallRail Form Capture API credentials.
ALTER TABLE "Lead"
  ADD COLUMN "utmTerm"                  TEXT,
  ADD COLUMN "utmContent"               TEXT,
  ADD COLUMN "gclid"                    TEXT,
  ADD COLUMN "msclkid"                  TEXT,
  ADD COLUMN "landingPageUrl"           TEXT,
  ADD COLUMN "callrailSessionId"        TEXT,
  ADD COLUMN "callrailFormSubmissionId" TEXT;

ALTER TABLE "WidgetSettings"
  ADD COLUMN "callRailUseDynamicNumber"      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "callRailSwapWaitMs"            INTEGER NOT NULL DEFAULT 800,
  ADD COLUMN "callRailDynamicNumberSelector" TEXT;

ALTER TABLE "NotificationSettings"
  ADD COLUMN "callRailAccountId" TEXT,
  ADD COLUMN "callRailApiKey"    TEXT,
  ADD COLUMN "callRailFormId"    TEXT;
