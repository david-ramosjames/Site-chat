// Minimal spam heuristics placeholder. Replace with hCaptcha/Turnstile later.
const SUSPICIOUS_PATTERNS = [/https?:\/\/.+https?:\/\//i, /\bSEO\b.*\bservice/i, /casino|viagra|crypto-?airdrop/i];

export function looksLikeSpam(input: {
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  notes?: string | null;
}) {
  const haystack = `${input.name ?? ""} ${input.email ?? ""} ${input.notes ?? ""}`;
  if (!haystack.trim()) return false;
  return SUSPICIOUS_PATTERNS.some((re) => re.test(haystack));
}
