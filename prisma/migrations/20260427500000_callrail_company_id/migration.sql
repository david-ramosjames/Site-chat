-- CallRail's Form Capture API needs both the alphanumeric Account ID
-- (URL path) and the numeric Company ID (in the request body). The
-- previous integration only stored one, so 404s if you used the company
-- ID as the account ID. Add a dedicated company_id column.
ALTER TABLE "NotificationSettings"
  ADD COLUMN "callRailCompanyId" TEXT;
