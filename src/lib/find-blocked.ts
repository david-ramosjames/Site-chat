import { prisma } from "@/lib/prisma";
import { contactBlockKeys } from "@/lib/blocklist";

export async function findBlockedMatch(
  clientId: string,
  input: { name?: string | null; phone?: string | null; email?: string | null }
) {
  const keys = contactBlockKeys(input);
  if (!keys.length) return null;
  return prisma.blockedLead.findFirst({
    where: { clientId, OR: keys },
    select: { id: true, kind: true, value: true },
  });
}
