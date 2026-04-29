-- Per-business Slack header overrides for the four priority states.
-- Use {{businessName}} as a placeholder; null falls back to the
-- built-in 🔥 / 🎁 / 🟢 phrasing.
ALTER TABLE "NotificationSettings"
  ADD COLUMN "slackHeaderPriorityReferral" TEXT,
  ADD COLUMN "slackHeaderPriority"         TEXT,
  ADD COLUMN "slackHeaderReferral"         TEXT,
  ADD COLUMN "slackHeaderDefault"          TEXT;
