import "dotenv/config";
import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  bootstrapProtectedGmiReleaseState,
  getDurableReceipt,
  getDurableReleaseState,
  grantOwnerAuthority,
  recordDataLock,
  releaseGmiEditionDurable,
  revokeOwnerAuthority,
  upsertReleaseState,
  type GateResolver,
} from "@/lib/intelligence/gmi-release-store.server";
import {
  DURABLE_GMI_RELEASE_GATE_VECTOR,
  resolveDurableReleaseState,
} from "@/lib/intelligence/gmi-release-durable-resolver.server";

const run = `gmi_persist_${Date.now().toString(36)}`;
const futurePredecessor = "GMI-Q2-2099";
const futureSuccessor = "GMI-Q3-2099";
const otherSuccessor = "GMI-Q4-2099";
const passGates: GateResolver = async () => ({ passed: true, blockers: [] });
const failGates: GateResolver = async () => ({ passed: false, blockers: ["Injected evidence blocker"] });

function releaseInput(editionId: string, candidateHash = `${run}_${editionId}_candidate`) {
  return {
    editionId,
    candidateHash,
    sourceSnapshotHash: `${run}_${editionId}_source`,
    reportContentHash: `${run}_${editionId}_content`,
    methodologyVersion: "gmi-methodology-test-v1",
    pdfHash: `${run}_${editionId}_pdf`,
    releaseChecklistVersion: "release-checklist-test-v1",
  };
}

async function cleanup() {
  await prisma.gmiReleaseReceipt.deleteMany({ where: { editionId: { in: [futurePredecessor, futureSuccessor, otherSuccessor] } } });
  await prisma.gmiReleaseAuthority.deleteMany({ where: { editionId: { in: [futurePredecessor, futureSuccessor, otherSuccessor] } } });
  await prisma.gmiEditionReleaseState.deleteMany({ where: { editionId: { in: [futurePredecessor, futureSuccessor, otherSuccessor] } } });
  await prisma.systemAuditLog.deleteMany({ where: { resourceType: "gmi_release", resourceId: { in: [futurePredecessor, futureSuccessor, otherSuccessor] } } });
}

async function seedReleasePair(successor = futureSuccessor, candidateHash = `${run}_${successor}_candidate`) {
  const predecessor = successor === otherSuccessor ? futureSuccessor : futurePredecessor;
  await upsertReleaseState({
    editionId: predecessor,
    lifecycleState: "ACTIVE_UNTIL_SUPERSEDED",
    publicVisible: true,
    purchasable: false,
  });
  await upsertReleaseState({
    editionId: successor,
    lifecycleState: "RELEASE_CANDIDATE",
    candidateHash,
    sourceSnapshotHash: `${run}_${successor}_source`,
    reportContentHash: `${run}_${successor}_content`,
    methodologyVersion: "gmi-methodology-test-v1",
    dataLockedAt: new Date("2099-07-08T12:00:00.000Z"),
    releaseCandidateAt: new Date("2099-07-08T12:01:00.000Z"),
    publishedAt: null,
    supersedes: predecessor,
    supersededBy: null,
    publicVisible: false,
    purchasable: false,
  });
  await grantOwnerAuthority({
    editionId: successor,
    candidateHash,
    authorizedBy: `${run}_owner`,
    authorityScope: "GMI_RELEASE",
  });
}

beforeEach(cleanup);
afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("durable GMI recurring-edition release persistence", () => {
  it("bootstrap is non-destructive: re-running never regresses released durable state", async () => {
    // GMI-Q2-2026 was released on 2026-07-08 through the atomic transaction.
    // Bootstrap seeds rows only when missing (seedReleaseStateIfMissing) and must
    // never downgrade a released edition back to its bootstrap defaults.
    const q2Before = await getDurableReleaseState("GMI-Q2-2026");
    const q1Before = await getDurableReleaseState("GMI-Q1-2026");

    await bootstrapProtectedGmiReleaseState();

    const q1 = await getDurableReleaseState("GMI-Q1-2026");
    const q2 = await getDurableReleaseState("GMI-Q2-2026");
    const q2Receipt = await getDurableReceipt("GMI-Q2-2026");

    // Bootstrap changed nothing on existing rows.
    expect(q2?.lifecycleState).toBe(q2Before?.lifecycleState);
    expect(q2?.publishedAt?.toISOString() ?? null).toBe(q2Before?.publishedAt?.toISOString() ?? null);
    expect(q1?.lifecycleState).toBe(q1Before?.lifecycleState);
    expect(q1?.supersededBy).toBe(q1Before?.supersededBy ?? null);

    // Released truth remains authoritative and receipt-bound.
    expect(q2?.lifecycleState).toBe("ACTIVE_UNTIL_SUPERSEDED");
    expect(q2?.publishedAt).not.toBeNull();
    expect(q2?.dataLockedAt).not.toBeNull();
    expect(q2Receipt).not.toBeNull();
    expect(q1?.lifecycleState).toBe("SUPERSEDED");
    expect(q1?.supersededBy).toBe("GMI-Q2-2026");

    // The receipt is bound to a non-revoked, hash-matching authority row.
    const authority = await prisma.gmiReleaseAuthority.findFirst({
      where: { editionId: "GMI-Q2-2026", revokedAt: null, candidateHash: q2Receipt!.candidateHash },
    });
    expect(authority).not.toBeNull();
    expect(q2Receipt!.authorityId).toBe(authority!.id);
  });

  it("resolves the complete 10-gate vector from durable state and fails closed on missing authority", async () => {
    await upsertReleaseState({
      editionId: futureSuccessor,
      lifecycleState: "RELEASE_CANDIDATE",
      candidateHash: `${run}_no_authority`,
      dataLockedAt: new Date("2099-07-08T12:00:00.000Z"),
      publicVisible: false,
      purchasable: false,
    });

    const state = await resolveDurableReleaseState(futureSuccessor);
    expect(state.gates.map((gate) => gate.gate)).toEqual([...DURABLE_GMI_RELEASE_GATE_VECTOR]);
    expect(state.gates.find((gate) => gate.gate === "OWNER_RELEASE_AUTHORITY")?.status).toBe("FAIL");
    expect(state.releaseReady).toBe(false);
  });

  it("blocks hash mismatch and revoked authority without receipt or supersession", async () => {
    await seedReleasePair(futureSuccessor, `${run}_candidate_a`);
    await revokeOwnerAuthority(futureSuccessor, `${run}_revoker`, `${run}_candidate_a`);

    const revoked = await releaseGmiEditionDurable(releaseInput(futureSuccessor, `${run}_candidate_a`), { gateResolver: passGates });
    expect(revoked.ok).toBe(false);
    expect(revoked.reason).toBe("OWNER_AUTHORITY_MISSING");

    await grantOwnerAuthority({ editionId: futureSuccessor, candidateHash: `${run}_candidate_a`, authorizedBy: `${run}_owner2`, authorityScope: "GMI_RELEASE" });
    const mismatch = await releaseGmiEditionDurable(releaseInput(futureSuccessor, `${run}_candidate_b`), { gateResolver: passGates });
    expect(mismatch.ok).toBe(false);
    expect(mismatch.reason).toBe("CANDIDATE_HASH_MISMATCH");

    expect(await getDurableReceipt(futureSuccessor)).toBeNull();
    expect((await getDurableReleaseState(futurePredecessor))?.lifecycleState).toBe("ACTIVE_UNTIL_SUPERSEDED");
    expect((await getDurableReleaseState(futureSuccessor))?.lifecycleState).toBe("RELEASE_CANDIDATE");
  });

  it("rolls back evidence failure and preserves predecessor/successor state", async () => {
    const input = releaseInput(futureSuccessor);
    await seedReleasePair(futureSuccessor, input.candidateHash);

    const result = await releaseGmiEditionDurable(input, { gateResolver: failGates });

    expect(result.ok).toBe(false);
    expect(result.reason).toBe("EVIDENCE_GATES_FAILED");
    expect(await getDurableReceipt(futureSuccessor)).toBeNull();
    expect((await getDurableReleaseState(futurePredecessor))?.lifecycleState).toBe("ACTIVE_UNTIL_SUPERSEDED");
    expect((await getDurableReleaseState(futureSuccessor))?.lifecycleState).toBe("RELEASE_CANDIDATE");
  });

  it("releases a future recurring quarter atomically and survives a new Prisma client", async () => {
    const input = releaseInput(futureSuccessor);
    await seedReleasePair(futureSuccessor, input.candidateHash);

    const result = await releaseGmiEditionDurable(input, { gateResolver: passGates, now: () => new Date("2099-07-08T13:00:00.000Z") });

    expect(result.ok).toBe(true);
    expect(result.receipt?.editionId).toBe(futureSuccessor);
    expect((await getDurableReleaseState(futureSuccessor))?.lifecycleState).toBe("ACTIVE_UNTIL_SUPERSEDED");
    expect((await getDurableReleaseState(futurePredecessor))?.lifecycleState).toBe("SUPERSEDED");
    expect((await getDurableReleaseState(futurePredecessor))?.supersededBy).toBe(futureSuccessor);

    const independentClient = new PrismaClient();
    try {
      const persistedReceipt = await independentClient.gmiReleaseReceipt.findUnique({ where: { editionId: futureSuccessor } });
      const persistedSuccessor = await independentClient.gmiEditionReleaseState.findUnique({ where: { editionId: futureSuccessor } });
      const audit = await independentClient.systemAuditLog.findFirst({ where: { resourceType: "gmi_release", resourceId: futureSuccessor, action: "gmi_release_succeeded" } });
      expect(persistedReceipt?.candidateHash).toBe(input.candidateHash);
      expect(persistedSuccessor?.lifecycleState).toBe("ACTIVE_UNTIL_SUPERSEDED");
      expect(audit).not.toBeNull();
    } finally {
      await independentClient.$disconnect();
    }
  });

  it("allows exactly one receipt under concurrent independent-client release attempts", async () => {
    const input = releaseInput(futureSuccessor);
    await seedReleasePair(futureSuccessor, input.candidateHash);

    const clientA = new PrismaClient();
    const clientB = new PrismaClient();
    try {
      const results = await Promise.all([
        releaseGmiEditionDurable(input, { db: clientA, gateResolver: passGates, now: () => new Date("2099-07-08T14:00:00.000Z") }),
        releaseGmiEditionDurable(input, { db: clientB, gateResolver: passGates, now: () => new Date("2099-07-08T14:00:00.000Z") }),
      ]);

      expect(results.filter((result) => result.ok)).toHaveLength(1);
      expect(results.filter((result) => !result.ok).map((result) => result.reason)).toEqual(
        expect.arrayContaining([expect.stringMatching(/ALREADY_RELEASED|CONCURRENT_RELEASE/)]),
      );
      expect(await prisma.gmiReleaseReceipt.count({ where: { editionId: futureSuccessor } })).toBe(1);
      expect((await getDurableReleaseState(futurePredecessor))?.supersededBy).toBe(futureSuccessor);
    } finally {
      await clientA.$disconnect();
      await clientB.$disconnect();
    }
  });
});
