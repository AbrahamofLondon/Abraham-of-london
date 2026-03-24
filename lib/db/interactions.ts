/* lib/db/interactions.ts — Unified Interaction Engine (build-safe, tx-safe) */
/* eslint-disable no-console */

import "server-only";
import { prisma } from "@/lib/prisma.server";

export type InteractionAction = "like" | "save";

export type InteractionCounts = {
  likes: number;
  saves: number;
};

export type InteractionStats = InteractionCounts & {
  userLiked: boolean;
  userSaved: boolean;
  deletedAt?: string | null;
};

export type UserInteractionState = {
  slug: string;
  actorId: string;
  liked: boolean;
  saved: boolean;
  updatedAt?: Date;
};

type InteractionRow = {
  id?: string;
  action?: string;
  updatedAt?: Date;
};

type GroupedRow = {
  action?: string;
  _count?: number | { action?: number } | Record<string, unknown>;
  count?: number;
  [key: string]: any;
};

// Adjusted to be compatible with Prisma's internal generated types
type InteractionModel = {
  groupBy: (args: any) => Promise<any[]>;
  findMany: (args: {
    where?: Record<string, unknown>;
    select?: Record<string, boolean>;
  }) => Promise<InteractionRow[]>;
  findFirst: (args: {
    where?: Record<string, unknown>;
    select?: Record<string, boolean>;
  }) => Promise<InteractionRow | null>;
  create: (args: {
    data: Record<string, unknown>;
  }) => Promise<unknown>;
  delete: (args: {
    where: Record<string, unknown>;
  }) => Promise<unknown>;
};

// Use 'any' to allow the Prisma Client (which has specific Enums) 
// to be assigned to this interface.
type InteractionClientLike = any;

type ModelCandidate = {
  model: InteractionModel;
  fields: {
    slugField: "shortSlug";
    actorField: "actorId";
    actionField: "action";
  };
};

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function safeNumber(value: unknown, fallback = 0): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function cleanSlug(v: unknown): string {
  return safeString(v).trim().toLowerCase();
}

function cleanActor(v: unknown): string {
  return safeString(v).trim();
}

function cleanAction(v: unknown): InteractionAction | null {
  const a = safeString(v).trim().toLowerCase();
  return a === "like" || a === "save" ? a : null;
}

function normalizeHasArgs(
  slug: unknown,
  a2: unknown,
  a3: unknown,
): { slug: string; action: InteractionAction | null; actor: string } {
  const s = cleanSlug(slug);
  const action2 = cleanAction(a2);
  const action3 = cleanAction(a3);

  if (action2) {
    return { slug: s, action: action2, actor: cleanActor(a3) };
  }
  if (action3) {
    return { slug: s, action: action3, actor: cleanActor(a2) };
  }
  return { slug: s, action: null, actor: cleanActor(a3) || cleanActor(a2) };
}

function getModel(client: InteractionClientLike | null | undefined): ModelCandidate | null {
  // Use bracket notation to avoid direct property access issues on 'any'
  const model = client?.shortInteraction;
  if (!model) return null;

  if (
    typeof model.groupBy !== "function" ||
    typeof model.findMany !== "function" ||
    typeof model.findFirst !== "function" ||
    typeof model.create !== "function" ||
    typeof model.delete !== "function"
  ) {
    return null;
  }

  return {
    model,
    fields: {
      slugField: "shortSlug",
      actorField: "actorId",
      actionField: "action",
    },
  };
}

function extractCount(row: GroupedRow | undefined, actionField: string): number {
  if (!row || typeof row !== "object") return 0;

  if (typeof row._count === "number") {
    return safeNumber(row._count, 0);
  }
  if (row._count && typeof row._count === "object") {
    const nested = (row._count as Record<string, unknown>)[actionField];
    if (nested != null) return safeNumber(nested, 0);
  }
  if (row.count != null) {
    return safeNumber(row.count, 0);
  }
  return 0;
}

// ----------------------------------------------------------------------------
// Core Logic
// ----------------------------------------------------------------------------

async function getStatsForActor(
  client: InteractionClientLike,
  slug: string,
  actor: string,
): Promise<InteractionStats> {
  const mapping = getModel(client);
  if (!mapping) {
    return { likes: 0, saves: 0, userLiked: false, userSaved: false };
  }

  const { model, fields } = mapping;
  const whereBase: Record<string, unknown> = { [fields.slugField]: slug };
  const whereUser: Record<string, unknown> = { [fields.slugField]: slug, [fields.actorField]: actor };

  try {
    const [groupedRaw, userRowsRaw] = await Promise.all([
      model.groupBy({
        by: [fields.actionField],
        where: whereBase,
        _count: { [fields.actionField]: true },
      }),
      model.findMany({
        where: whereUser,
        select: { [fields.actionField]: true, updatedAt: true },
      }),
    ]);

    const grouped = Array.isArray(groupedRaw) ? groupedRaw : [];
    const userRows = Array.isArray(userRowsRaw) ? userRowsRaw : [];

    const likes = extractCount(
      grouped.find((g) => cleanAction(g?.[fields.actionField]) === "like"),
      fields.actionField,
    );

    const saves = extractCount(
      grouped.find((g) => cleanAction(g?.[fields.actionField]) === "save"),
      fields.actionField,
    );

    const actions = userRows
      .map((r) => cleanAction(r?.[fields.actionField as keyof InteractionRow]))
      .filter((a): a is InteractionAction => a === "like" || a === "save");

    return {
      likes,
      saves,
      userLiked: actions.includes("like"),
      userSaved: actions.includes("save"),
    };
  } catch (error) {
    console.error("[INTERACTIONS_STATS_ERROR]", error);
    return { likes: 0, saves: 0, userLiked: false, userSaved: false };
  }
}

export async function toggleInteraction(
  slug: string,
  action: InteractionAction,
  actorId: string,
): Promise<InteractionStats> {
  const s = cleanSlug(slug);
  const a = cleanAction(action);
  const actor = cleanActor(actorId);

  if (!s || !a || !actor) {
    return { likes: 0, saves: 0, userLiked: false, userSaved: false };
  }

  return prisma.$transaction(async (tx) => {
    const txClient = tx as InteractionClientLike;
    const txMapping = getModel(txClient);

    if (!txMapping) {
      return { likes: 0, saves: 0, userLiked: false, userSaved: false };
    }

    const { model, fields } = txMapping;
    const whereAction = {
      [fields.slugField]: s,
      [fields.actorField]: actor,
      [fields.actionField]: a,
    };

    try {
      const existing = await model.findFirst({
        where: whereAction,
        select: { id: true },
      });

      let deletedAt: string | null = null;

      if (existing?.id) {
        await model.delete({ where: { id: existing.id } });
        deletedAt = new Date().toISOString();
      } else {
        await model.create({
          data: {
            [fields.slugField]: s,
            [fields.actorField]: actor,
            [fields.actionField]: a,
          },
        });
      }

      const stats = await getStatsForActor(txClient, s, actor);
      return { ...stats, deletedAt };
    } catch (error) {
      console.error("[INTERACTIONS_TOGGLE_ERROR]", error);
      return { likes: 0, saves: 0, userLiked: false, userSaved: false };
    }
  });
}

export async function setInteractionState(
  slug: string,
  action: InteractionAction,
  actorId: string,
  desired: boolean,
): Promise<InteractionStats> {
  const s = cleanSlug(slug);
  const a = cleanAction(action);
  const actor = cleanActor(actorId);

  if (!s || !a || !actor) {
    return { likes: 0, saves: 0, userLiked: false, userSaved: false };
  }

  return prisma.$transaction(async (tx) => {
    const txClient = tx as InteractionClientLike;
    const txMapping = getModel(txClient);

    if (!txMapping) return { likes: 0, saves: 0, userLiked: false, userSaved: false };

    const { model, fields } = txMapping;
    const whereAction = {
      [fields.slugField]: s,
      [fields.actorField]: actor,
      [fields.actionField]: a,
    };

    try {
      const existing = await model.findFirst({ where: whereAction, select: { id: true } });

      if (desired) {
        if (!existing?.id) {
          await model.create({
            data: {
              [fields.slugField]: s,
              [fields.actorField]: actor,
              [fields.actionField]: a,
            },
          });
        }
      } else if (existing?.id) {
        await model.delete({ where: { id: existing.id } });
      }

      return await getStatsForActor(txClient, s, actor);
    } catch (error) {
      console.error("[INTERACTIONS_SET_STATE_ERROR]", error);
      return { likes: 0, saves: 0, userLiked: false, userSaved: false };
    }
  });
}

export async function getInteractionCounts(
  slug: string,
  actorId?: string,
): Promise<InteractionStats> {
  const s = cleanSlug(slug);
  const actor = actorId ? cleanActor(actorId) : "";
  if (!s) return { likes: 0, saves: 0, userLiked: false, userSaved: false };

  return getStatsForActor(prisma, s, actor);
}

export async function hasUserInteracted(
  slug: string,
  a2: InteractionAction | string,
  a3: string,
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
  } catch (error) {
    console.error("[INTERACTIONS_HAS_ERROR]", error);
    return false;
  }
}

export async function getUserInteractionState(
  slug: string,
  actorId: string,
): Promise<UserInteractionState | null> {
  const s = cleanSlug(slug);
  const actor = cleanActor(actorId);

  if (!s || !actor) return null;

  const mapping = getModel(prisma);
  if (!mapping) return null;

  const { model, fields } = mapping;

  try {
    const userRowsRaw = await model.findMany({
      where: {
        [fields.slugField]: s,
        [fields.actorField]: actor,
      },
      select: { [fields.actionField]: true, updatedAt: true },
    });

    const userRows = Array.isArray(userRowsRaw) ? userRowsRaw : [];
    const actions = userRows
      .map((r) => cleanAction(r?.[fields.actionField as keyof InteractionRow]))
      .filter((a): a is InteractionAction => a === "like" || a === "save");

    return {
      slug: s,
      actorId: actor,
      liked: actions.includes("like"),
      saved: actions.includes("save"),
      updatedAt: userRows[0]?.updatedAt,
    };
  } catch (error) {
    console.error("[INTERACTIONS_STATE_ERROR]", error);
    return null;
  }
}