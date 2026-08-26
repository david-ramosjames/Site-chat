// Resolve what to write to a Lead column (qualified / referral / …) from
// a flow step's answer. Multiple-choice steps use leadFieldByOption
// (option value → yes/no). Yes/no steps use leadFieldOnYes / OnNo.
// Empty-string overrides mean "leave the column blank". Missing
// override → store the raw answer.

export type LeadFieldOverrides = {
  leadFieldOnYes?: string | null;
  leadFieldOnNo?: string | null;
  leadFieldByOption?: Record<string, string> | null;
};

export function asLeadFieldByOption(value: unknown): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
  }
  return Object.keys(out).length ? out : null;
}

export function resolveLeadColumnValue(
  raw: string | undefined,
  step: LeadFieldOverrides | null | undefined
): string | undefined {
  if (raw === undefined) return undefined;
  if (!step) return raw;

  const byOption = step.leadFieldByOption;
  if (byOption && Object.prototype.hasOwnProperty.call(byOption, raw)) {
    return byOption[raw] || undefined;
  }
  if (raw === "yes" && step.leadFieldOnYes != null) {
    return step.leadFieldOnYes || undefined;
  }
  if (raw === "no" && step.leadFieldOnNo != null) {
    return step.leadFieldOnNo || undefined;
  }
  return raw;
}
