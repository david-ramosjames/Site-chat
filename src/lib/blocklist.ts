export const BLOCK_KINDS = ["name", "phone", "email"] as const;
export type BlockKind = (typeof BLOCK_KINDS)[number];

export type BlockEntry = { kind: string; normalized: string };

export function isBlockKind(value: string): value is BlockKind {
  return (BLOCK_KINDS as readonly string[]).includes(value);
}

/** Turn admin/visitor input into a stable lookup key. Null = reject. */
export function normalizeBlockValue(kind: BlockKind, raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (kind === "email") {
    const email = trimmed.toLowerCase();
    if (!email.includes("@") || email.length < 5) return null;
    return email;
  }

  if (kind === "phone") {
    let digits = trimmed.replace(/\D/g, "");
    if (!digits) return null;
    if (digits.length === 11 && digits.startsWith("1")) digits = digits.slice(1);
    if (digits.length < 7 || digits.length > 15) return null;
    return digits.length >= 10 ? digits.slice(-10) : digits;
  }

  const name = trimmed.toLowerCase().replace(/\s+/g, " ");
  if (name.length < 2) return null;
  return name;
}

export function contactBlockKeys(input: {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
}): { kind: BlockKind; normalized: string }[] {
  const keys: { kind: BlockKind; normalized: string }[] = [];
  const name = input.name ? normalizeBlockValue("name", input.name) : null;
  const phone = input.phone ? normalizeBlockValue("phone", input.phone) : null;
  const email = input.email ? normalizeBlockValue("email", input.email) : null;
  if (name) keys.push({ kind: "name", normalized: name });
  if (phone) keys.push({ kind: "phone", normalized: phone });
  if (email) keys.push({ kind: "email", normalized: email });
  return keys;
}

export function matchesBlocklist(
  entries: BlockEntry[],
  input: { name?: string | null; phone?: string | null; email?: string | null }
): boolean {
  const keys = contactBlockKeys(input);
  if (!keys.length || !entries.length) return false;
  return keys.some((key) =>
    entries.some((entry) => entry.kind === key.kind && entry.normalized === key.normalized)
  );
}
