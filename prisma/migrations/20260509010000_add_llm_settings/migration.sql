ALTER TABLE "FeatureToggles"
  ADD COLUMN "llmProvider" TEXT NOT NULL DEFAULT 'openai',
  ADD COLUMN "llmModel" TEXT NOT NULL DEFAULT 'gpt-4o-mini',
  ADD COLUMN "llmApiKey" TEXT;
