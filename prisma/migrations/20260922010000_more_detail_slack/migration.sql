-- Optional Slack thread metadata so follow-ups (contract sent, more details)
-- can reply on the original lead post. Bot token + channel enable chat.postMessage.

ALTER TABLE "NotificationSettings" ADD COLUMN "slackBotToken" TEXT;
ALTER TABLE "NotificationSettings" ADD COLUMN "slackChannel" TEXT;

ALTER TABLE "Lead" ADD COLUMN "slackTs" TEXT;
ALTER TABLE "Lead" ADD COLUMN "slackChannel" TEXT;
