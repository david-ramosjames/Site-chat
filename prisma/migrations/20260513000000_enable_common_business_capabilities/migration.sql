ALTER TABLE "WidgetSettings"
  ALTER COLUMN "enableTranslation" SET DEFAULT true;

UPDATE "WidgetSettings"
SET "enableTranslation" = true
WHERE "enableTranslation" = false;

UPDATE "FeatureToggles"
SET "enableMedia" = true
WHERE "enableMedia" = false;
