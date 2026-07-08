/**
 * lib/engagements/pilot-intake-store.prisma.ts
 *
 * §11/§14 — PRODUCTION Operator Pilot persistence adapter (Postgres/Prisma), backing the
 * same PilotIntakeStore contract as the SQLite adapter. History-preserving: every state
 * change appends an OperatorPilotTransition row (who moved it, under what authority, why).
 * Reuses the pure helpers (fingerprint, initialState, toCustomerStatus, nextOperation,
 * ALLOWED) from the canonical store module so business rules are not forked.
 */

import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { PilotIntake, QualificationResult } from "./operator-pilot-qualification";
import {
  fingerprintPilotIntake,
  initialState,
  ALLOWED,
  nextOperation,
  newPilotReference,
  PILOT_REFERENCE_RE,
  type PilotIntakeRecord,
  type PilotLifecycleState,
  type PilotQueueItem,
} from "./pilot-intake-store.shared";

const newReference = newPilotReference;

function toRecord(r: {
  reference: string; createdAt: Date; updatedAt: Date; intakeJson: unknown; qualificationJson: unknown;
  reviewStatus: string; owner: string | null; operatorNote: string | null; requestedInformation: string | null;
  finalDecision: string | null; intakeFingerprint: string;
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
  };
}

export async function savePilotIntake(intake: PilotIntake, qualification: QualificationResult): Promise<PilotIntakeRecord> {
  const fp = fingerprintPilotIntake(intake);
  // business duplicate/replay: exact fingerprint returns the existing active intake.
  const existing = await prisma.operatorPilotIntake.findFirst({ where: { intakeFingerprint: fp }, orderBy: { createdAt: "desc" } });
  if (existing) return toRecord(existing);
  const state = initialState(qualification);
  const created = await prisma.operatorPilotIntake.create({
    data: {
      reference: newReference(),
      intakeJson: intake as object,
      qualificationJson: qualification as object,
      qualificationStatus: qualification.status,
      reviewStatus: state,
      requestedInformation: state === "MORE_INFORMATION_REQUIRED" ? qualification.reasons.join(" ") : null,
      finalDecision: state === "DECLINED" ? qualification.reasons.join(" ") : null,
      intakeFingerprint: fp,
    },
  });
  return toRecord(created);
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
