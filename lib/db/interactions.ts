import "server-only";
import { prisma } from "@/lib/prisma"; // Ensure correct path to your prisma singleton

/**
 * 🏛️ [INSTITUTIONAL TYPE RECOVERY]
 * Instead of importing 'Prisma', we extract the transaction type directly 
 * from the $transaction method signature. This survives 'Module has no 
 * exported member Prisma' errors.
 */
type PrismaTransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

export async function toggleInteraction(
  shortSlug: string,
  action: "like" | "save",
  sessionId: string
) {
  // We use the derived type to ensure 'tx' is recognized by the compiler
  return prisma.$transaction(async (tx: PrismaTransactionClient) => {
    // 🛡️ Asset Protection: Accessing the model via 'tx'
    const existing = await (tx as any).shortInteraction.findUnique({
      where: {
        shortSlug_sessionId_action: {
          shortSlug,
          sessionId,
          action,
        },
      },
    });

    if (existing) {
      return (tx as any).shortInteraction.update({
        where: { id: existing.id },
        data: { deletedAt: existing.deletedAt ? null : new Date() },
      });
    }

    return (tx as any).shortInteraction.create({
      data: {
        shortSlug,
        sessionId,
        action,
      },
    });
  });
}

/**
 * 📊 PORTFOLIO ANALYTICS
 * Counting active engagements across the 75 briefs.
 */
export async function getInteractionCounts(shortSlug: string) {
  const [likes, saves] = await Promise.all([
    (prisma as any).shortInteraction.count({
      where: { shortSlug, action: "like", deletedAt: null },
    }),
    (prisma as any).shortInteraction.count({
      where: { shortSlug, action: "save", deletedAt: null },
    }),
  ]);

  return { likes, saves };
}

/**
 * 🔍 AUTHENTICATION PROBE
 * Verifying specific interaction status for the vault.
 */
export async function hasUserInteracted(
  shortSlug: string,
  sessionId: string,
  action: "like" | "save"
) {
  const interaction = await (prisma as any).shortInteraction.findUnique({
    where: {
      shortSlug_sessionId_action: {
        shortSlug,
        sessionId,
        action,
      },
    },
  });

  return {
    interacted: !!interaction && !interaction.deletedAt,
    wasDeleted: !!interaction?.deletedAt,
  };
}