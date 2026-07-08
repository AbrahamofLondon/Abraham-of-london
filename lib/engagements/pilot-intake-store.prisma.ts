/**
 * lib/engagements/pilot-intake-store.prisma.ts
 *
 * §11/§14 — PRODUCTION Operator Pilot persistence adapter (Postgres/Prisma), backing the
 * same PilotIntakeStore contract as the SQLite adapter. History-preserving: every state
 * change appends an OperatorPilotTransition row (who moved it, under what authority, why).
 * Reuses the pure helpers (fingerprint, initialState, toCustomerStatus, nextOperation,
 * ALLOWED) from the canonical store module so business rules are not forked.
 */

import { prisma } from "@/lib/prisma";
import type { PilotIntake, QualificationResult } from "./operator-pilot-qualification";
import {
  fingerprintPilotIntake,
  hashPilotIdempotencyKey,
  initialState,
  ALLOWED,
  nextOperation,
  newPilotReference,
  PILOT_REFERENCE_RE,
  issuePilotStatusSecret,
  type PilotIntakeRecord,
  type PilotLifecycleState,
  type PilotQueueItem,
  type SavePilotIntakeOptions,
} from "./pilot-intake-store.shared";
import { hashPilotStatusAccessIdentifier, hashPilotStatusSecret } from "./pilot-status-security";

const newReference = newPilotReference;

function toRecord(r: {
  reference: string; createdAt: Date; updatedAt: Date; intakeJson: unknown; qualificationJson: unknown;
  reviewStatus: string; owner: string | null; operatorNote: string | null; requestedInformation: string | null;
  finalDecision: string | null; intakeFingerprint: string; statusSecretHash: string | null; statusSecretExpiresAt: Date | null; statusSecretRevokedAt: Date | null;
}): PilotIntakeRecord {
  return {
    reference: r.reference,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    intake: r.intakeJson as PilotIntake,
    qualification: r.qualificationJson as QualificationResult,
    reviewStatus: r.reviewStatus as PilotLifecycleState,
    owner: r.owner ?? null,
    operatorNote: r.operatorNote ?? null,
    requestedInformation: r.requestedInformation ?? null,
    finalDecision: r.finalDecision ?? null,
    fingerprint: r.intakeFingerprint,
    statusSecretHash: r.statusSecretHash,
    statusSecretExpiresAt: r.statusSecretExpiresAt?.toISOString() ?? null,
    statusSecretRevokedAt: r.statusSecretRevokedAt?.toISOString() ?? null,
  };
}

export async function savePilotIntake(intake: PilotIntake, qualification: QualificationResult, options: SavePilotIntakeOptions = {}): Promise<PilotIntakeRecord> {
  const fp = fingerprintPilotIntake(intake);
  const idempotencyHash = options.idempotencyKey ? hashPilotIdempotencyKey(options.idempotencyKey) : null;
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  return prisma.$transaction(async (tx) => {
    if (idempotencyHash) {
      const replay = await tx.operatorPilotSubmissionIdempotency.findUnique({ where: { idempotencyHash } });
      if (replay && replay.expiresAt.getTime() > Date.now()) {
        if (replay.requestFingerprint !== fp) throw new Error("PILOT_IDEMPOTENCY_CONFLICT");
        const row = await tx.operatorPilotIntake.findUnique({ where: { reference: replay.intakeRef } });
        if (row) return { ...toRecord(row), duplicateClassification: "EXACT_RETRY" };
      }
    }

    const existing = await tx.operatorPilotIntake.findFirst({ where: { intakeFingerprint: fp }, orderBy: { createdAt: "desc" } });
    if (existing) {
      if (idempotencyHash) {
        await tx.operatorPilotSubmissionIdempotency.create({ data: { idempotencyHash, requestFingerprint: fp, intakeRef: existing.reference, expiresAt } }).catch(() => null);
      }
      return { ...toRecord(existing), duplicateClassification: idempotencyHash ? "EXACT_RETRY" : "POSSIBLE_DUPLICATE" };
    }

    const state = initialState(qualification);
    const statusSecret = issuePilotStatusSecret();
    const created = await tx.operatorPilotIntake.create({
      data: {
        reference: newReference(),
        intakeJson: intake as object,
        qualificationJson: qualification as object,
        qualificationStatus: qualification.status,
        reviewStatus: state,
        requestedInformation: state === "MORE_INFORMATION_REQUIRED" ? qualification.reasons.join(" ") : null,
        finalDecision: state === "DECLINED" ? qualification.reasons.join(" ") : null,
        intakeFingerprint: fp,
        statusSecretHash: statusSecret.hash,
        statusSecretExpiresAt: new Date(statusSecret.expiresAt),
      },
    });
    if (idempotencyHash) {
      await tx.operatorPilotSubmissionIdempotency.create({ data: { idempotencyHash, requestFingerprint: fp, intakeRef: created.reference, expiresAt } });
    }
    return { ...toRecord(created), statusSecret: statusSecret.secret, duplicateClassification: "NEW_INTAKE" };
  });
}
export async function getPilotIntakeByRef(reference: string): Promise<PilotIntakeRecord | null> {
  if (!PILOT_REFERENCE_RE.test(reference)) return null;
  const r = await prisma.operatorPilotIntake.findUnique({ where: { reference } });
  return r ? toRecord(r) : null;
}

export async function listPilotQueue(opts: { status?: PilotLifecycleState; limit?: number } = {}): Promise<PilotQueueItem[]> {
  const rows = await prisma.operatorPilotIntake.findMany({
    where: opts.status ? { reviewStatus: opts.status } : undefined,
    orderBy: { createdAt: "desc" },
    take: opts.limit ?? 100,
  });
  return rows.map((row) => {
    const record = toRecord(row);
    const ageHours = Math.max(0, Math.round((Date.now() - Date.parse(record.createdAt)) / 3600000));
    return { ...record, ageHours, nextOperation: nextOperation(record), evidencePosture: record.intake.existingEvidence.length > 60 ? "DETAILED" : "THIN", qualificationStatus: record.qualification.status };
  });
}

/**
 * §10/§14 — transition with append-only history + human-authority enforcement. Optimistic
 * concurrency: pass expectedUpdatedAt to reject a stale write (409-style conflict).
 */
export async function transitionPilotState(
  reference: string,
  nextState: PilotLifecycleState,
  actor: { email: string | null; humanAuthority: boolean },
  details: { requestedInformation?: string | null; finalDecision?: string | null; operatorNote?: string | null; expectedUpdatedAt?: string } = {},
): Promise<PilotIntakeRecord | null> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.operatorPilotIntake.findUnique({ where: { reference } });
    if (!existing) return null;
    const from = existing.reviewStatus as PilotLifecycleState;
    if (!ALLOWED[from].includes(nextState)) throw new Error(`Illegal pilot transition: ${from} -> ${nextState}`);
    if ((nextState === "ACCEPTED" || nextState === "DECLINED") && !actor.humanAuthority) throw new Error("Human authority required for final pilot decision");
    if (details.expectedUpdatedAt && existing.updatedAt.toISOString() !== details.expectedUpdatedAt) {
      throw new Error("PILOT_STATE_CONFLICT: the intake changed since it was loaded; refresh and retry.");
    }
    const finalDecision = nextState === "ACCEPTED" || nextState === "DECLINED" ? (details.finalDecision ?? existing.finalDecision ?? nextState) : existing.finalDecision;
    const updated = await tx.operatorPilotIntake.update({
      where: { reference },
      data: {
        reviewStatus: nextState,
        owner: actor.email,
        operatorNote: details.operatorNote ?? existing.operatorNote,
        requestedInformation: details.requestedInformation ?? existing.requestedInformation,
        finalDecision,
      },
    });
    await tx.operatorPilotTransition.create({
      data: { intakeRef: reference, fromState: from, toState: nextState, actorEmail: actor.email, humanAuthority: actor.humanAuthority, reason: details.operatorNote ?? null },
    });
    return toRecord(updated);
  });
}

export async function getPilotIntakeByStatusSecret(secret: string, context: { ip?: string | null } = {}, now = new Date()): Promise<PilotIntakeRecord | null> {
  let attemptedHash = "invalid";
  try {
    attemptedHash = hashPilotStatusSecret(secret);
  } catch {
    await prisma.operatorPilotStatusAccessAudit.create({ data: { attemptedHash, result: "INVALID_FORMAT", ipHash: context.ip ? hashPilotStatusAccessIdentifier(context.ip) : null } }).catch(() => null);
    return null;
  }

  const row = await prisma.operatorPilotIntake.findUnique({ where: { statusSecretHash: attemptedHash } });
  const expired = row?.statusSecretExpiresAt ? row.statusSecretExpiresAt.getTime() <= now.getTime() : true;
  const revoked = Boolean(row?.statusSecretRevokedAt);
  const result = !row ? "NOT_FOUND" : expired ? "EXPIRED" : revoked ? "REVOKED" : "GRANTED";

  await prisma.operatorPilotStatusAccessAudit.create({
    data: {
      intakeRef: row?.reference ?? null,
      attemptedHash,
      result,
      ipHash: context.ip ? hashPilotStatusAccessIdentifier(context.ip) : null,
    },
  }).catch(() => null);

  if (!row || expired || revoked) return null;
  return toRecord(row);
}