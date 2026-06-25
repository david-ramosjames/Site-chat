ALTER TABLE "NotificationSettings"
  ADD COLUMN "slackPostPriorityReferral" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "slackPostPriority" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "slackPostReferral" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "slackPostDefault" BOOLEAN NOT NULL DEFAULT true;
