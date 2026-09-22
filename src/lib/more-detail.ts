export const MORE_DETAIL_KEY = "more_detail";
export const MORE_DETAIL_LABEL = "More details";

export function answerFieldLabel(key: string): string {
  return key === MORE_DETAIL_KEY ? MORE_DETAIL_LABEL : key;
}

/** Merge extra case text onto answers.more_detail. Empty input → null (reject). */
export function appendMoreDetail(
  answers: Record<string, unknown> | null | undefined,
  extraDetail: string
): { answers: Record<string, unknown>; appended: string } | null {
  const text = extraDetail.trim();
  if (!text) return null;
  const prev =
    typeof answers?.[MORE_DETAIL_KEY] === "string"
      ? String(answers[MORE_DETAIL_KEY]).trim()
      : "";
  const merged = prev ? `${prev}\n\n${text}` : text;
  return {
    answers: { ...(answers ?? {}), [MORE_DETAIL_KEY]: merged },
    appended: text,
  };
}
