import { createHash } from "crypto";

import { prisma } from "@/lib/prisma.server";
import {
  buildProvenanceMerkleRoot,
  type ProvenanceChainLeaf,
} from "@/lib/admin/provenance-chain-anchor";

export type CreateProvenanceChainAnchorInput = {
  scope: "DAILY" | "ACCOUNT" | "ORGANISATION" | "CYCLE_BATCH";
  scopeId: string;
  leaves: ProvenanceChainLeaf[];
  fromTimestamp?: string | null;
  toTimestamp?: string | null;
};

export type ProvenanceChainAnchorRecord = {
  id: string;
  version: 1;
  scope: string;
  scopeId: string;
  leafCount: number;
  merkleRoot: string;
  previousRoot: string | null;
  chainHash: string;
  computedAt: string;
  fromTimestamp?: string | null;
  toTimestamp?: string | null;
};

function stableJson(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right));
    return `{${entries.map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function toIso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : null;
}

function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error(`Invalid provenance chain timestamp: ${value}`);
  }
  return date;
}

function mapAnchor(row: {
  id: string;
  version: number;
  scope: string;
  scopeId: string;
  leafCount: number;
  merkleRoot: string;
  previousRoot: string | null;
  chainHash: string;
  computedAt: Date | string;
  fromTimestamp?: Date | string | null;
  toTimestamp?: Date | string | null;
}): ProvenanceChainAnchorRecord {
  const computedAt = toIso(row.computedAt);
  if (!computedAt) {
    throw new Error(`Provenance chain anchor ${row.id} has invalid computedAt.`);
  }
  return {
    id: row.id,
    version: 1,
    scope: row.scope,
    scopeId: row.scopeId,
    leafCount: row.leafCount,
    merkleRoot: row.merkleRoot,
    previousRoot: row.previousRoot ?? null,
    chainHash: row.chainHash,
    computedAt,
    fromTimestamp: toIso(row.fromTimestamp) ?? null,
    toTimestamp: toIso(row.toTimestamp) ?? null,
  };
}

export function buildProvenanceChainHash(input: {
  version: 1;
  scope: string;
  scopeId: string;
  merkleRoot: string;
  previousRoot?: string | null;
  computedAt: string;
  fromTimestamp?: string | null;
  toTimestamp?: string | null;
}): string {
  return createHash("sha256")
    .update(stableJson({
      version: input.version,
      scope: input.scope,
      scopeId: input.scopeId,
      merkleRoot: input.merkleRoot,
      previousRoot: input.previousRoot ?? null,
      computedAt: input.computedAt,
      fromTimestamp: input.fromTimestamp ?? null,
      toTimestamp: input.toTimestamp ?? null,
    }))
    .digest("hex");
}

function buildSafeMetadata(input: CreateProvenanceChainAnchorInput) {
  const subjectTypes = Array.from(new Set(input.leaves.map((leaf) => leaf.subjectType))).sort();
  return {
    subjectCount: input.leaves.length,
    subjectTypes,
    hasRawPayloads: false,
  };
}

export async function createProvenanceChainAnchor(
  input: CreateProvenanceChainAnchorInput,
): Promise<ProvenanceChainAnchorRecord> {
  if (input.leaves.length === 0) {
    throw new Error("Cannot create provenance chain anchor with no leaves.");
  }

  const merkleRoot = buildProvenanceMerkleRoot(input.leaves);
  if (!merkleRoot) {
    throw new Error("Cannot create provenance chain anchor because Merkle root computation returned null.");
  }

  const previous = await prisma.provenanceChainAnchor.findFirst({
    where: {
      scope: input.scope,
      scopeId: input.scopeId,
    },
    orderBy: [
      { computedAt: "desc" },
      { createdAt: "desc" },
    ],
    select: {
      merkleRoot: true,
    },
  });

  const computedAt = new Date().toISOString();
  const fromTimestamp = toIso(input.fromTimestamp) ?? null;
  const toTimestamp = toIso(input.toTimestamp) ?? null;
  const previousRoot = previous?.merkleRoot ?? null;
  const chainHash = buildProvenanceChainHash({
    version: 1,
    scope: input.scope,
    scopeId: input.scopeId,
    merkleRoot,
    previousRoot,
    computedAt,
    fromTimestamp,
    toTimestamp,
  });

  const row = await prisma.provenanceChainAnchor.create({
    data: {
      version: 1,
      scope: input.scope,
      scopeId: input.scopeId,
      anchorType: "MERKLE_ROOT",
      leafCount: input.leaves.length,
      merkleRoot,
      previousRoot,
      chainHash,
      computedAt: new Date(computedAt),
      fromTimestamp: toDate(fromTimestamp),
      toTimestamp: toDate(toTimestamp),
      metadata: buildSafeMetadata(input) as never,
    },
  });

  return mapAnchor(row);
}

export async function listProvenanceChainAnchors(input: {
  scope: string;
  scopeId: string;
  limit?: number;
}): Promise<ProvenanceChainAnchorRecord[]> {
  const rows = await prisma.provenanceChainAnchor.findMany({
    where: {
      scope: input.scope,
      scopeId: input.scopeId,
    },
    orderBy: [
      { computedAt: "asc" },
      { createdAt: "asc" },
    ],
    take: input.limit ?? 100,
  });

  return rows.map(mapAnchor);
}

export function verifyProvenanceChainSequence(
  anchors: ProvenanceChainAnchorRecord[],
): {
  valid: boolean;
  failures: Array<{
    anchorId?: string;
    reason: string;
  }>;
} {
  const failures: Array<{ anchorId?: string; reason: string }> = [];

  anchors.forEach((anchor, index) => {
    const expectedHash = buildProvenanceChainHash({
      version: 1,
      scope: anchor.scope,
      scopeId: anchor.scopeId,
      merkleRoot: anchor.merkleRoot,
      previousRoot: anchor.previousRoot,
      computedAt: anchor.computedAt,
      fromTimestamp: anchor.fromTimestamp ?? null,
      toTimestamp: anchor.toTimestamp ?? null,
    });
    if (expectedHash !== anchor.chainHash) {
      failures.push({
        anchorId: anchor.id,
        reason: "chainHash does not match recomputed chain hash.",
      });
    }

    if (index === 0) {
      if (anchor.previousRoot) {
        failures.push({
          anchorId: anchor.id,
          reason: "First anchor in sequence has a previousRoot but no prior anchor is present.",
        });
      }
      return;
    }

    const previous = anchors[index - 1]!;
    if (anchor.previousRoot !== previous.merkleRoot) {
      failures.push({
        anchorId: anchor.id,
        reason: "previousRoot does not match previous anchor merkleRoot.",
      });
    }
  });

  return {
    valid: failures.length === 0,
    failures,
  };
}
