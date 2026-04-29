-- Rename the leads' Urgency column to Qualified, add a Referral column,
-- and add per-yes/no answer overrides so admins can decide exactly what
-- value gets written to the column. Useful when the question reads
-- negatively, e.g. "Do you have an attorney?" — answering No means
-- qualified=yes.
ALTER TABLE "Lead" RENAME COLUMN "urgency" TO "qualified";
ALTER TABLE "Lead" ADD COLUMN "referral" TEXT;

ALTER TABLE "FlowStep"
  ADD COLUMN "leadFieldOnYes" TEXT,
  ADD COLUMN "leadFieldOnNo"  TEXT;

-- Existing flow steps that pointed leadField at the legacy 'urgency' value
-- now target the renamed 'qualified' column.
UPDATE "FlowStep" SET "leadField" = 'qualified' WHERE "leadField" = 'urgency';
