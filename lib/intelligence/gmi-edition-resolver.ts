/**
 * GMI Edition Resolver — canonical, edition-parametric resolver.
 * No Q2-specific hardcoding. All functions accept edition parameters.
 * Services import this; seed scripts reference their own constants.
 */

import { prisma } from "@/lib/prisma";

// ─── Types ───────────────────────────────────────────────────────────────────

export type GmiEditionRecord = {
  editionId: string;
  editionSlug: string;
  releaseStatus: string;
  publicationStatus: string;
  publishedAt: string | null;
  createdAt: string;
};

export class GmiEditionNotFoundError extends Error {
  constructor(identifier: string) {
    super(`GMI edition not found: "${identifier}"`);
    this.name = "GmiEditionNotFoundError";
  }
}

// ─── Internal helper ─────────────────────────────────────────────────────────

async function latestSnapshotByEdition(
  editionId: string
): Promise<GmiEditionRecord | null> {
  // The canonical source of edition identity is GmiReleaseSnapshot + GmiEditionGovernanceState.
  // We derive edition records from the latest snapshot per edition.
  const snapshot = await prisma.gmiReleaseSnapshot.findFirst({
    where: { editionId },
    orderBy: { createdAt: "desc" },
  });

  if (!snapshot) return null;

  const governance = await prisma.gmiEditionGovernanceState.findFirst({
    where: { editionId },
  });

  return {
    editionId: snapshot.editionId,
    editionSlug: snapshot.editionSlug,
    releaseStatus: snapshot.releaseStatus,
    publicationStatus: governance?.publicationStatus ?? "draft",
    publishedAt: snapshot.publishedAt?.toISOString() ?? null,
    createdAt: snapshot.createdAt.toISOString(),
  };
}

async function allEditionIds(): Promise<string[]> {
  const rows = await prisma.gmiReleaseSnapshot.findMany({
    distinct: ["editionId"],
    orderBy: { createdAt: "desc" },
    select: { editionId: true },
  });
  return rows.map((r) => r.editionId);
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Resolve an edition by its URL slug (e.g. "gmi-q2-2026").
 */
export async function resolveGmiEditionBySlug(
  slug: string
): Promise<GmiEditionRecord | null> {
  const snapshot = await prisma.gmiReleaseSnapshot.findFirst({
    where: { editionSlug: slug },
    orderBy: { createdAt: "desc" },
  });

  if (!snapshot) return null;
  return latestSnapshotByEdition(snapshot.editionId);
}

/**
 * Resolve an edition by its canonical edition ID (e.g. "GMI-Q2-2026").
 */
export async function resolveGmiEditionById(
  editionId: string
): Promise<GmiEditionRecord | null> {
  return latestSnapshotByEdition(editionId);
}

/**
 * Returns the most recently published GMI edition, or null if none exist.
 */
export async function getLatestPublishedGmiEdition(): Promise<GmiEditionRecord | null> {
  const snapshot = await prisma.gmiReleaseSnapshot.findFirst({
    where: { releaseStatus: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });

  if (!snapshot) return null;
  return latestSnapshotByEdition(snapshot.editionId);
}

/**
 * Returns the first draft GMI edition found, or null if none exist.
 */
export async function getCurrentDraftGmiEdition(): Promise<GmiEditionRecord | null> {
  const ids = await allEditionIds();

  for (const editionId of ids) {
    const record = await latestSnapshotByEdition(editionId);
    if (record && record.releaseStatus !== "PUBLISHED") {
      return record;
    }
  }

  return null;
}

/**
 * Returns the canonical public route for a GMI edition.
 */
export function getGmiEditionRoute(edition: { editionSlug: string }): string {
  return `/intelligence/gmi/${edition.editionSlug}`;
}

/**
 * Asserts that an edition exists in the DB. Throws GmiEditionNotFoundError if not.
 */
export async function assertEditionExists(editionId: string): Promise<GmiEditionRecord> {
  const record = await resolveGmiEditionById(editionId);
  if (!record) throw new GmiEditionNotFoundError(editionId);
  return record;
}

// ─── Default export (for convenience) ───────────────────────────────────────

const gmiEditionResolver = {
  resolveGmiEditionBySlug,
  resolveGmiEditionById,
  getLatestPublishedGmiEdition,
  getCurrentDraftGmiEdition,
  getGmiEditionRoute,
  assertEditionExists,
};

export default gmiEditionResolver;
