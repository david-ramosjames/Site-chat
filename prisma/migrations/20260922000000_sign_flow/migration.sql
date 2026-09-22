-- Sign Flow: default DocuSeal templates on the widget, per-step signing
-- config, and lead flags so Slack can note a contract was sent.

ALTER TABLE "WidgetSettings" ADD COLUMN "signTemplateIdEn" TEXT;
ALTER TABLE "WidgetSettings" ADD COLUMN "signTemplateIdEs" TEXT;

ALTER TABLE "FlowStep" ADD COLUMN "signing" JSONB;

ALTER TABLE "Lead" ADD COLUMN "ending" TEXT;
ALTER TABLE "Lead" ADD COLUMN "contractSent" BOOLEAN NOT NULL DEFAULT false;
