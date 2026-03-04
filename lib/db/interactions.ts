/* lib/db/interactions.ts — Unified Interaction Engine (Build-safe, Schema-safe) */
/* eslint-disable no-console */

import "server-only";
import { prisma } from "@/lib/prisma.server";

export type InteractionAction = "like" | "save";

export type InteractionCounts = { likes: number; saves: number };

export type InteractionStats = InteractionCounts & {
  userLiked: boolean;
  userSaved: boolean;
  deletedAt?: string | null;
};

// Add UserInteractionState type
export type UserInteractionState = {
  slug: string;
  actorId: string;
  liked: boolean;
  saved: boolean;
  updatedAt?: Date;
};

function cleanSlug(v: unknown): string {
  return String(v ?? "").trim();
}

function cleanActor(v: unknown): string {
  return String(v ?? "").trim();
}

function cleanAction(v: unknown): InteractionAction | null {
  const a = String(v ?? "").trim().toLowerCase();
  if (a === "like" || a === "save") return a;
  return null;
}

/**
 * Choose model + field mapping.
 * Priority:
 * 1) AssetInteraction (member/email-based, durable)
 * 2) ShortInteraction (session-based fallback)
 */
function getModel(client: any) {
  const hasAsset = Boolean(client?.assetInteraction);
  const hasShort = Boolean(client?.shortInteraction);

  if (hasAsset) {
    return {
      model: client.assetInteraction,
      fields: {
        slugField: "slug",
        actorField: "memberId", // actorId must be memberId/emailHash depending on your app policy
        actionField: "action",
      },
    };
  }

  if (hasShort) {
    return {
      model: client.shortInteraction,
      fields: {
        slugField: "shortSlug",
        actorField: "sessionId",
        actionField: "action",
      },
    };
  }

  return null;
}

function extractCount(row: any, actionField: string): number {
  const c = row?._count;
  if (typeof c === "number") return c;
  if (c && typeof c === "object") {
    const v = (c as any)[actionField];
    if (typeof v === "number") return v;
  }
  return 0;
}

/**
 * Normalize overloaded hasUserInteracted arguments.
 *
 * Supports BOTH:
 * - hasUserInteracted(slug, action, actorId)    ✅ preferred
 * - hasUserInteracted(slug, actorId, action)    🧯 legacy safety
 */
function normalizeHasArgs(
  slug: unknown,
  a2: unknown,
  a3: unknown
): { slug: string; action: InteractionAction | null; actor: string } {
  const s = cleanSlug(slug);
  const action2 = cleanAction(a2);
  const action3 = cleanAction(a3);

  // Preferred: (slug, action, actor)
  if (action2) {
    return { slug: s, action: action2, actor: cleanActor(a3) };
  }

  // Legacy: (slug, actor, action)
  if (action3) {
    return { slug: s, action: action3, actor: cleanActor(a2) };
  }

  // Nothing valid
  return { slug: s, action: null, actor: cleanActor(a3) || cleanActor(a2) };
}

/**
 * Toggle an interaction atomically.
 * actorId is either:
 * - memberId/emailHash (AssetInteraction)
 * - sessionId (ShortInteraction)
 */
export async function toggleInteraction(
  slug: string,
  action: InteractionAction,
  actorId: string
): Promise<InteractionStats> {
  const s = cleanSlug(slug);
  const a = cleanAction(action);
  const actor = cleanActor(actorId);

  if (!s || !a || !actor) {
    return { likes: 0, saves: 0, userLiked: false, userSaved: false };
  }

  const mapping = getModel(prisma);
  if (!mapping) {
    console.warn("[INTERACTIONS] No interaction model found on Prisma client.");
    return { likes: 0, saves: 0, userLiked: false, userSaved: false };
  }

  const { fields } = mapping;

  const whereBase: Record<string, any> = { [fields.slugField]: s };
  const whereUser: Record<string, any> = { [fields.slugField]: s, [fields.actorField]: actor };

  return prisma.$transaction(async (tx: any) => {
    const txMapping = getModel(tx);
    if (!txMapping) return { likes: 0, saves: 0, userLiked: false, userSaved: false };

    const txModel = txMapping.model;
    const f = txMapping.fields;

    // 1) Toggle
    const existing = await txModel.findFirst({
      where: { ...whereUser, [f.actionField]: a },
      select: { id: true },
    });

    let deletedAt: string | null = null;

    if (existing?.id) {
      await txModel.delete({ where: { id: existing.id } });
      deletedAt = new Date().toISOString();
    } else {
      // createdAt is optional in Prisma if it has default(now()); safe either way
      await txModel.create({
        data: {
          ...whereUser,
          [f.actionField]: a,
        },
      });
    }

    // 2) Counts
    const grouped = await txModel.groupBy({
      by: [f.actionField],
      where: whereBase,
      _count: { [f.actionField]: true } as any,
    });

    const likes = extractCount(grouped.find((g: any) => g[f.actionField] === "like"), f.actionField);
    const saves = extractCount(grouped.find((g: any) => g[f.actionField] === "save"), f.actionField);

    // 3) User state
    const userRows = await txModel.findMany({
      where: whereUser,
      select: { [f.actionField]: true },
    });

    const actions = (userRows as any[]).map((r) => r[f.actionField]);
    const userLiked = actions.includes("like");
    const userSaved = actions.includes("save");

    return { likes, saves, userLiked, userSaved, deletedAt };
  });
}

/**
 * getInteractionCounts(slug, actorId?)
 * Returns aggregate counts and (optionally) user state if actorId provided.
 */
export async function getInteractionCounts(slug: string, actorId?: string): Promise<InteractionStats> {
  const s = cleanSlug(slug);
  const actor = actorId ? cleanActor(actorId) : "";

  if (!s) return { likes: 0, saves: 0, userLiked: false, userSaved: false };

  const mapping = getModel(prisma);
  if (!mapping) return { likes: 0, saves: 0, userLiked: false, userSaved: false };

  const { model, fields } = mapping;

  const whereBase: Record<string, any> = { [fields.slugField]: s };
  const whereUser: Record<string, any> = actor ? { [fields.slugField]: s, [fields.actorField]: actor } : {};

  try {
    const [grouped, userRows] = await Promise.all([
      model.groupBy({
        by: [fields.actionField],
        where: whereBase,
        _count: { [fields.actionField]: true } as any,
      }),
      actor
        ? model.findMany({
            where: whereUser,
            select: { [fields.actionField]: true },
          })
        : Promise.resolve([]),
    ]);

    const likes = extractCount(grouped.find((g: any) => g[fields.actionField] === "like"), fields.actionField);
    const saves = extractCount(grouped.find((g: any) => g[fields.actionField] === "save"), fields.actionField);

    const actions = (userRows as any[]).map((r) => r[fields.actionField]);
    const userLiked = actions.includes("like");
    const userSaved = actions.includes("save");

    return { likes, saves, userLiked, userSaved };
  } catch (e) {
    console.error("[INTERACTIONS_COUNTS_ERROR]:", e);
    return { likes: 0, saves: 0, userLiked: false, userSaved: false };
  }
}

/**
 * hasUserInteracted — schema-safe boolean check.
 *
 * ✅ Accepts BOTH argument orders:
 * - (slug, action, actorId) preferred
 * - (slug, actorId, action) legacy-safe
 */
export async function hasUserInteracted(
  slug: string,
  a2: InteractionAction | string,
  a3: string
): Promise<boolean> {
  const normalized = normalizeHasArgs(slug, a2, a3);
  const s = normalized.slug;
  const a = normalized.action;
  const actor = normalized.actor;

  if (!s || !a || !actor) return false;

  const mapping = getModel(prisma);
  if (!mapping) return false;

  const { model, fields } = mapping;

  try {
    const row = await model.findFirst({
      where: {
        [fields.slugField]: s,
        [fields.actorField]: actor,
        [fields.actionField]: a,
      },
      select: { id: true },
    });

    return Boolean(row?.id);
  } catch (e) {
    console.error("[INTERACTIONS_HAS_ERROR]:", e);
    return false;
  }
}

// Optional: Helper function to get full user state for a specific slug and actor
export async function getUserInteractionState(
  slug: string,
  actorId: string
): Promise<UserInteractionState | null> {
  const s = cleanSlug(slug);
  const actor = cleanActor(actorId);

  if (!s || !actor) return null;

  const mapping = getModel(prisma);
  if (!mapping) return null;

  const { model, fields } = mapping;

  try {
    const userRows = await model.findMany({
      where: {
        [fields.slugField]: s,
        [fields.actorField]: actor,
      },
      select: { [fields.actionField]: true, updatedAt: true },
    });

    const actions = userRows.map((r: any) => r[fields.actionField]);
    
    return {
      slug: s,
      actorId: actor,
      liked: actions.includes("like"),
      saved: actions.includes("save"),
      updatedAt: userRows[0]?.updatedAt,
    };
  } catch (e) {
    console.error("[INTERACTIONS_STATE_ERROR]:", e);
    return null;
  }
}