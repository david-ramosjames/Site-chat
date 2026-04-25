-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Client_status_idx" ON "Client"("status");

-- CreateTable
CREATE TABLE "WidgetSettings" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL DEFAULT '#2563eb',
    "accentColor" TEXT NOT NULL DEFAULT '#1d4ed8',
    "logoUrl" TEXT,
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Hi! How can we help?',
    "bubbleText" TEXT NOT NULL DEFAULT 'Chat with us',
    "widgetPosition" TEXT NOT NULL DEFAULT 'bottom-right',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "WidgetSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WidgetSettings_clientId_key" ON "WidgetSettings"("clientId");

ALTER TABLE "WidgetSettings" ADD CONSTRAINT "WidgetSettings_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "FeatureToggles" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "showProgress" BOOLEAN NOT NULL DEFAULT true,
    "allowFileUpload" BOOLEAN NOT NULL DEFAULT false,
    "collectUtm" BOOLEAN NOT NULL DEFAULT true,
    "collectPageUrl" BOOLEAN NOT NULL DEFAULT true,
    "collectReferrer" BOOLEAN NOT NULL DEFAULT true,
    "enableAiSummary" BOOLEAN NOT NULL DEFAULT false,
    "enableLeadScoring" BOOLEAN NOT NULL DEFAULT false,
    "enableAfterHours" BOOLEAN NOT NULL DEFAULT false,
    "enableSmsAlerts" BOOLEAN NOT NULL DEFAULT false,
    "enableEmailAlerts" BOOLEAN NOT NULL DEFAULT true,
    "enableSlackAlerts" BOOLEAN NOT NULL DEFAULT false,
    "enableGoogleSheetSync" BOOLEAN NOT NULL DEFAULT false,
    "enableCrmWebhook" BOOLEAN NOT NULL DEFAULT false,
    "enableMedia" BOOLEAN NOT NULL DEFAULT true,
    "enableFallbackForm" BOOLEAN NOT NULL DEFAULT true,
    "enableSpamProtection" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "FeatureToggles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FeatureToggles_clientId_key" ON "FeatureToggles"("clientId");

ALTER TABLE "FeatureToggles" ADD CONSTRAINT "FeatureToggles_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "NotificationSettings" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "slackWebhookUrl" TEXT,
    "crmWebhookUrl" TEXT,
    "googleSheetWebhookUrl" TEXT,
    CONSTRAINT "NotificationSettings_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NotificationSettings_clientId_key" ON "NotificationSettings"("clientId");

ALTER TABLE "NotificationSettings" ADD CONSTRAINT "NotificationSettings_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "FlowStep" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "stepKey" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "inputType" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "options" JSONB,
    "nextLogic" JSONB,
    "mediaType" TEXT NOT NULL DEFAULT 'none',
    "mediaUrl" TEXT,
    "thumbnailUrl" TEXT,
    "altText" TEXT,
    "mediaDisplayStyle" TEXT NOT NULL DEFAULT 'above',
    CONSTRAINT "FlowStep_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FlowStep_clientId_stepKey_key" ON "FlowStep"("clientId", "stepKey");
CREATE INDEX "FlowStep_clientId_order_idx" ON "FlowStep"("clientId", "order");

ALTER TABLE "FlowStep" ADD CONSTRAINT "FlowStep_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "serviceRequested" TEXT,
    "urgency" TEXT,
    "status" TEXT NOT NULL DEFAULT 'new',
    "sourceUrl" TEXT,
    "referrer" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "userAgent" TEXT,
    "transcript" JSONB,
    "answers" JSONB,
    "aiSummary" TEXT,
    "leadScore" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Lead_clientId_createdAt_idx" ON "Lead"("clientId", "createdAt");
CREATE INDEX "Lead_clientId_status_idx" ON "Lead"("clientId", "status");

ALTER TABLE "Lead" ADD CONSTRAINT "Lead_clientId_fkey"
  FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;
