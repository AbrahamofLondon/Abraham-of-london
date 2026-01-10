import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export interface InteractionStats {
  likes: number;
  saves: number;
  userLiked: boolean;
  userSaved: boolean;
}

/**
 * DATA HYGIENE: getInteractionStats
 * Retrieves global aggregates and session-specific states.
 */
export async function getInteractionStats(
  shortSlug: string,
  sessionId?: string | null
): Promise<InteractionStats> {
  // 1. Fetch aggregates for 'like' and 'save' actions that are not deleted
  const aggregates = await prisma.shortInteraction.groupBy({
    by: ['action'],
    where: {
      shortSlug,
      deletedAt: null,
    },
    _count: true,
  });

  let userLiked = false;
  let userSaved = false;

  // 2. Determine if the current session has active interactions
  if (sessionId) {
    const userInteractions = await prisma.shortInteraction.findMany({
      where: {
        shortSlug,
        sessionId,
        deletedAt: null,
      },
      select: { action: true },
    });

    userLiked = userInteractions.some((i) => i.action === 'like');
    userSaved = userInteractions.some((i) => i.action === 'save');
  }

  const likesCount = aggregates.find((a) => a.action === 'like')?._count ?? 0;
  const savesCount = aggregates.find((a) => a.action === 'save')?._count ?? 0;

  return {
    likes: likesCount,
    saves: savesCount,
    userLiked,
    userSaved,
  };
}

/**
 * ATOMIC MUTATION: toggleInteraction
 * Uses a transactional approach to flip the state of an interaction.
 */
export async function toggleInteraction(
  shortSlug: string,
  action: 'like' | 'save',
  sessionId: string
): Promise<InteractionStats> {
  // We use a transaction to ensure the 'check and update' is atomic
  return await prisma.$transaction(async (tx) => {
    // 1. Look for an existing record (even if soft-deleted)
    const existing = await tx.shortInteraction.findFirst({
      where: {
        shortSlug,
        sessionId,
        action,
      },
    });

    if (existing) {
      if (existing.deletedAt) {
        // Restore: Builder re-engaged
        await tx.shortInteraction.update({
          where: { id: existing.id },
          data: { deletedAt: null },
        });
      } else {
        // Soft Delete: Builder withdrew engagement
        await tx.shortInteraction.update({
          where: { id: existing.id },
          data: { deletedAt: new Date() },
        });
      }
    } else {
      // Create: Initial engagement
      await tx.shortInteraction.create({
        data: {
          shortSlug,
          sessionId,
          action,
        },
      });
    }

    // Return the updated state for immediate UI feedback
    return await getInteractionStats(shortSlug, sessionId);
  });
}


