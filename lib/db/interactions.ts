// lib/db/interactions.ts
import { prisma } from "./prisma";

// ✅ Derive the transaction client type from the actual client instance.
// This survives Prisma version/typegen differences.
type PrismaTransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0];

export async function toggleInteraction(
  shortSlug: string,
  action: "like" | "save",
  sessionId: string
) {
  return prisma.$transaction(async (tx: PrismaTransactionClient) => {
    const existing = await tx.shortInteraction.findUnique({
      where: {
        shortSlug_sessionId_action: {
          shortSlug,
          sessionId,
          action,
        },
      },
    });

    if (existing) {
      return tx.shortInteraction.update({
        where: { id: existing.id },
        data: { deletedAt: existing.deletedAt ? null : new Date() },
      });
    }

    return tx.shortInteraction.create({
      data: {
        shortSlug,
        sessionId,
        action,
      },
    });
  });
}

// Optional: Add type-safe helper for counting interactions
export async function getInteractionCounts(shortSlug: string) {
  const [likes, saves] = await Promise.all([
    prisma.shortInteraction.count({
      where: {
        shortSlug,
        action: "like",
        deletedAt: null,
      },
    }),
    prisma.shortInteraction.count({
      where: {
        shortSlug,
        action: "save",
        deletedAt: null,
      },
    }),
  ]);

  return { likes, saves };
}

// Optional: Check if a session has interacted with a short
export async function hasUserInteracted(
  shortSlug: string,
  sessionId: string,
  action: "like" | "save"
) {
  const interaction = await prisma.shortInteraction.findUnique({
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