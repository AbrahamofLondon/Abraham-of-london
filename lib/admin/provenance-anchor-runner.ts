import { composeDecisionProvenance } from "@/lib/admin/decision-provenance-record";
import {
  createProvenanceChainAnchor,
  type ProvenanceChainAnchorRecord,
} from "@/lib/admin/provenance-chain-ledger";
import type { ProvenanceChainLeaf } from "@/lib/admin/provenance-chain-anchor";
import { listRetainedReviewCycles } from "@/lib/product/retained-cadence-service";
import type { RetainedReviewCycle } from "@/lib/product/retained-cadence-contract";

export type CountOversightProvenanceLeavesResult = {
  version: 1;
  scope: CreateOversightProvenanceAnchorInput["scope"];
  scopeId: string;
  validLeafCount: number;
  unavailableCount: number;
  canCreateAnchor: boolean;
  message: string;
};

export type CreateOversightProvenanceAnchorInput = {
  scope: "DAILY" | "ACCOUNT" | "ORGANISATION" | "CYCLE_BATCH";
  scopeId: string;
  limit?: number;
  fromTimestamp?: string;
  toTimestamp?: string;
};

export type OversightProvenanceAnchorResult =
  | {
      version: 1;
      status: "ANCHORED";
      scope: CreateOversightProvenanceAnchorInput["scope"];
      scopeId: string;
      requestedCount: number;
      leafCount: number;
      unavailableCount: number;
      anchor: ProvenanceChainAnchorRecord;
    }
  | {
      version: 1;
      status: "UNAVAILABLE";
      scope: CreateOversightProvenanceAnchorInput["scope"];
      scopeId: string;
      requestedCount: number;
      leafCount: 0;
      unavailableCount: number;
      anchor: null;
      reason: string;
    };

function parseLimit(value: number | undefined): number {
  if (!Number.isFinite(value ?? NaN)) return 50;
  return Math.min(Math.max(Math.floor(value!), 1), 200);
}

function parseTimestamp(value: string | undefined, field: string): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    throw new Error(`${field} must be a valid ISO timestamp.`);
  }
  return date;
}

function dailyRange(scopeId: string): { from: Date; to: Date } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(scopeId)) return null;
  const from = new Date(`${scopeId}T00:00:00.000Z`);
  if (!Number.isFinite(from.getTime())) return null;
  const to = new Date(from);
  to.setUTCDate(to.getUTCDate() + 1);
  return { from, to };
}

function cycleAnchorTimestamp(cycle: RetainedReviewCycle): Date {
  const updated = new Date(cycle.updatedAt);
  if (Number.isFinite(updated.getTime())) return updated;
  const created = new Date(cycle.createdAt);
  return Number.isFinite(created.getTime()) ? created : new Date(0);
}

function isWithinRange(cycle: RetainedReviewCycle, from: Date | null, to: Date | null): boolean {
  const timestamp = cycleAnchorTimestamp(cycle).getTime();
  return (!from || timestamp >= from.getTime()) && (!to || timestamp <= to.getTime());
}

function filterCycles(
  cycles: RetainedReviewCycle[],
  input: CreateOversightProvenanceAnchorInput,
): RetainedReviewCycle[] {
  const explicitFrom = parseTimestamp(input.fromTimestamp, "fromTimestamp");
  const explicitTo = parseTimestamp(input.toTimestamp, "toTimestamp");
  const inferredDailyRange = input.scope === "DAILY" && !explicitFrom && !explicitTo
    ? dailyRange(input.scopeId)
    : null;
  const from = explicitFrom ?? inferredDailyRange?.from ?? null;
  const to = explicitTo ?? inferredDailyRange?.to ?? null;

  return cycles
    .filter((cycle) => {
      if (!cycle.cycleId) return false;
      if (!isWithinRange(cycle, from, to)) return false;

      switch (input.scope) {
        case "DAILY":
          return true;
        case "ACCOUNT":
          return cycle.accountId === input.scopeId;
        case "ORGANISATION":
          return cycle.organisationId === input.scopeId;
        case "CYCLE_BATCH":
          return cycle.cycleId === input.scopeId;
      }
    })
    .sort((left, right) =>
      cycleAnchorTimestamp(left).getTime() - cycleAnchorTimestamp(right).getTime()
      || left.cycleId.localeCompare(right.cycleId),
    )
    .slice(0, parseLimit(input.limit));
}

export async function createOversightProvenanceAnchor(
  input: CreateOversightProvenanceAnchorInput,
): Promise<OversightProvenanceAnchorResult> {
  const scopeId = input.scopeId.trim();
  if (!scopeId) {
    throw new Error("scopeId is required to create a provenance anchor.");
  }

  const cycles = filterCycles(await listRetainedReviewCycles(), {
    ...input,
    scopeId,
  });

  let unavailableCount = 0;
  const leaves: ProvenanceChainLeaf[] = [];

  for (const cycle of cycles) {
    try {
      const record = await composeDecisionProvenance({
        subjectType: "OVERSIGHT_CYCLE",
        subjectId: cycle.cycleId,
      });
      if (!record.provenanceHash) {
        unavailableCount += 1;
        continue;
      }
      leaves.push({
        subjectType: "OVERSIGHT_CYCLE",
        subjectId: cycle.cycleId,
        provenanceHash: record.provenanceHash,
        computedAt: cycleAnchorTimestamp(cycle).toISOString(),
      });
    } catch {
      unavailableCount += 1;
    }
  }

  if (leaves.length === 0) {
    return {
      version: 1,
      status: "UNAVAILABLE",
      scope: input.scope,
      scopeId,
      requestedCount: cycles.length,
      leafCount: 0,
      unavailableCount,
      anchor: null,
      reason: cycles.length === 0
        ? "No retained oversight cycles matched the requested anchor scope."
        : "No valid provenance hashes were available for the matched oversight cycles.",
    };
  }

  const anchor = await createProvenanceChainAnchor({
    scope: input.scope,
    scopeId,
    leaves,
    fromTimestamp: input.fromTimestamp ?? null,
    toTimestamp: input.toTimestamp ?? null,
    unavailableCount,
  });

  return {
    version: 1,
    status: "ANCHORED",
    scope: input.scope,
    scopeId,
    requestedCount: cycles.length,
    leafCount: leaves.length,
    unavailableCount,
    anchor,
  };
}

export async function countOversightProvenanceLeaves(
  input: CreateOversightProvenanceAnchorInput,
): Promise<CountOversightProvenanceLeavesResult> {
  const scopeId = input.scopeId.trim();
  if (!scopeId) {
    throw new Error("scopeId is required to count provenance leaves.");
  }

  const cycles = filterCycles(await listRetainedReviewCycles(), { ...input, scopeId });
  let validLeafCount = 0;
  let unavailableCount = 0;

  for (const cycle of cycles) {
    try {
      const record = await composeDecisionProvenance({
        subjectType: "OVERSIGHT_CYCLE",
        subjectId: cycle.cycleId,
      });
      if (record.provenanceHash) {
        validLeafCount += 1;
      } else {
        unavailableCount += 1;
      }
    } catch {
      unavailableCount += 1;
    }
  }

  const canCreateAnchor = validLeafCount > 0;
  const message = cycles.length === 0
    ? "No retained oversight cycles matched this scope."
    : canCreateAnchor
      ? `${validLeafCount} valid provenance record${validLeafCount === 1 ? "" : "s"} found. Anchor can be created.`
      : "No valid provenance records found for this scope/scopeId. Anchor creation would be unavailable.";

  return {
    version: 1,
    scope: input.scope,
    scopeId,
    validLeafCount,
    unavailableCount,
    canCreateAnchor,
    message,
  };
}
