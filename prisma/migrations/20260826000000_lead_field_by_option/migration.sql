-- Per-option lead-column overrides for multiple-choice steps.
-- Shape: { "opt_1": "yes", "opt_2": "yes", "opt_3": "no" }
-- Lets a 3-way question (e.g. already have a lawyer?) still write
-- yes/no into Lead.qualified the way yes/no steps do via leadFieldOnYes/No.
ALTER TABLE "FlowStep" ADD COLUMN "leadFieldByOption" JSONB;
