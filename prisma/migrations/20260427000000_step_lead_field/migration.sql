-- Adds a per-step mapping that tells us which Lead column an answer
-- should populate. Works alongside the legacy stepKey-name conventions
-- (a step keyed "name" still goes to Lead.name when leadField is null).
ALTER TABLE "FlowStep"
  ADD COLUMN "leadField" TEXT;
