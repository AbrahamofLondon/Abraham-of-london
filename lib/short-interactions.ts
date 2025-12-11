// lib/short-interactions.ts
import { prisma } from "@/lib/prisma";

// Simple in-memory store as fallback
const memoryStore = new Map<string, { likes: Set<string>; saves: Set<string> }>();

export async function handleInteraction(slug: string, action: 'like' | 'save', userId?: string) {
  // If we have a database and user is authenticated, use Prisma
  if (userId && prisma) {
    try {
      const existing = await prisma.interaction.findUnique({
        where: {
          userId_shortSlug_action: {
            userId,
            shortSlug: slug,
            action,
          },
        },
      });

      if (existing) {
        await prisma.interaction.delete({
          where: { id: existing.id },
        });
        return { action: 'removed', count: await getInteractionCount(slug, action) };
      } else {
        await prisma.interaction.create({
          data: {
            userId,
            shortSlug: slug,
            action,
          },
        });
        return { action: 'added', count: await getInteractionCount(slug, action) };
      }
    } catch (error) {
      console.error('Database interaction failed, falling back to memory:', error);
    }
  }

  // Fallback to memory store
  const storeKey = slug;
  if (!memoryStore.has(storeKey)) {
    memoryStore.set(storeKey, { likes: new Set(), saves: new Set() });
  }

  const store = memoryStore.get(storeKey)!;
  const userSet = action === 'like' ? store.likes : store.saves;
  const userKey = userId || 'anonymous';

  if (userSet.has(userKey)) {
    userSet.delete(userKey);
    return { action: 'removed', count: userSet.size };
  } else {
    userSet.add(userKey);
    return { action: 'added', count: userSet.size };
  }
}

export async function getInteractionCount(slug: string, action?: 'like' | 'save') {
  if (action && prisma) {
    try {
      return await prisma.interaction.count({
        where: {
          shortSlug: slug,
          action,
        },
      });
    } catch (error) {
      console.error('Database count failed, falling back to memory:', error);
    }
  }

  const store = memoryStore.get(slug);
  if (!store) return { likes: 0, saves: 0 };

  if (action === 'like') return { likes: store.likes.size, saves: store.saves.size };
  if (action === 'save') return { saves: store.saves.size, likes: store.likes.size };
  
  return {
    likes: store.likes.size,
    saves: store.saves.size,
  };
}