ALTER TABLE "WidgetSettings"
  ADD COLUMN "bubbleTooltipBgColor" TEXT,
  ADD COLUMN "bubbleTooltipTextColor" TEXT,
  ADD COLUMN "secondWelcomeBgColor" TEXT,
  ADD COLUMN "secondWelcomeTextColor" TEXT,
  ADD COLUMN "brandingFooterEnabled" BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN "brandingFooterText" TEXT;
