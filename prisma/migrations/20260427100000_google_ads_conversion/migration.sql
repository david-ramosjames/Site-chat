-- Adds Google Ads conversion tracking config. When both id + label are
-- set the widget fires gtag('event','conversion',{ send_to: ID/LABEL })
-- on the host page after a successful lead submit.
ALTER TABLE "WidgetSettings"
  ADD COLUMN "googleAdsConversionId"    TEXT,
  ADD COLUMN "googleAdsConversionLabel" TEXT;
