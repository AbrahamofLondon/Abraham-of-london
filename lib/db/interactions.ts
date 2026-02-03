// lib/db/interactions.ts
import { prisma } from '@/lib/db/prisma'; // Ensure this uses the Neon adapter

/**
 * ATOMIC MUTATION: toggleInteraction
 * Uses a serializable-safe transaction to flip the state.
 */
export async function toggleInteraction(
  shortSlug: string,
  action: 'like' | 'save',
  sessionId: string
) {
  return await prisma.$transaction(async (tx) => {
    const existing = await tx.shortInteraction.findUnique({
      where: {
        shortSlug_sessionId_action: { // Assumes a @@unique([shortSlug, sessionId, action]) in Prisma
          shortSlug,
          sessionId,
          action,
        },
      },
    });

    if (existing) {
      // Toggle logic
      return await tx.shortInteraction.update({
        where: { id: existing.id },
        data: { deletedAt: existing.deletedAt ? null : new Date() },
      });
    }

    return await tx.shortInteraction.create({
      data: { shortSlug, sessionId, action },
    });
  }, {
    // Neon recommendation for concurrent serverless writes
    isolationLevel: 'Serializable', 
  });
}