import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminApi } from "@/lib/access/server";
import {
  canAccessProvenanceOperation,
} from "@/lib/admin/provenance-access-policy";
import type { DecisionProvenanceRecord } from "@/lib/admin/decision-provenance-record";
import type { IntegrityStatus } from "@/lib/admin/provenance-integrity";
import { recordProvenanceOperationAudit } from "@/lib/admin/provenance-operation-audit";

type VerificationResponse = {
  version: 1;
  status: IntegrityStatus;
  subjectType: DecisionProvenanceRecord["subjectType"];
  subjectId: string;
  expectedHash: string;
  recomputedHash: string | null;
  archivedHash: string | null;
  checkedAt: string;
  message: string;
  auditWarning?: string;
};

const SUBJECT_TYPES = new Set<DecisionProvenanceRecord["subjectType"]>([
  "OVERSIGHT_CYCLE",
  "EXECUTIVE_REPORT",
  "DECISION_CASE",
  "RETAINER_ACCOUNT",
  "DELIVERY_ITEM",
]);

function single(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function resolveStatus(input: {
  expectedHash: string;
  recomputedHash: string | null;
  archivedHash: string | null;
}): { status: IntegrityStatus; message: string } {
  if (!input.recomputedHash) {
    return {
      status: "UNAVAILABLE",
      message: "Canonical provenance hash could not be recomputed for this subject.",
    };
  }

  if (input.expectedHash !== input.recomputedHash) {
    return {
      status: "MISMATCH",
      message: "Expected provenance hash does not match the canonical recomputed hash.",
    };
  }

  if (input.archivedHash && input.archivedHash !== input.recomputedHash) {
    return {
      status: "MISMATCH",
      message: "Archived provenance hash does not match the canonical recomputed hash.",
    };
  }

  return {
    status: "MATCH",
    message: input.archivedHash
      ? "Expected, recomputed, and archived provenance hashes match."
      : "Expected and recomputed provenance hashes match. No archived hash was available for comparison.",
  };
}

async function loadArchivedHash(input: {
  subjectType: DecisionProvenanceRecord["subjectType"];
  subjectId: string;
}): Promise<string | null> {
  if (input.subjectType !== "OVERSIGHT_CYCLE") return null;
  const { loadOversightCycleArchive } = await import("@/lib/product/oversight-cycle-archive");
  const archive = await loadOversightCycleArchive({ cycleId: input.subjectId });
  return archive?.record.provenanceHash ?? null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<VerificationResponse | { ok: false; error: string }>,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  const admin = await requireAdminApi(req, res);
  if (!admin) return;

  const subjectType = single(req.query.subjectType) as DecisionProvenanceRecord["subjectType"];
  const subjectId = single(req.query.subjectId).trim();
  const expectedHash = single(req.query.expectedHash).trim();

  if (!SUBJECT_TYPES.has(subjectType) || !subjectId || !expectedHash) {
    return res.status(400).json({
      ok: false,
      error: "subjectType, subjectId, and expectedHash are required",
    });
  }

  const policy = canAccessProvenanceOperation(admin, "VERIFY_PROVENANCE_HASH");
  if (!policy.allowed) {
    return res.status(policy.reason === "AUTHENTICATION_REQUIRED" ? 401 : 403).json({
      ok: false,
      error: policy.reason,
    });
  }

  const checkedAt = new Date().toISOString();
  let recomputedHash: string | null = null;
  let archivedHash: string | null = null;

  try {
    const { composeDecisionProvenance } = await import("@/lib/admin/decision-provenance-record");
    const record = await composeDecisionProvenance({ subjectType, subjectId });
    recomputedHash = record.provenanceHash;
    archivedHash = await loadArchivedHash({ subjectType, subjectId });
  } catch {
    recomputedHash = null;
    archivedHash = null;
  }

  const { status, message } = resolveStatus({
    expectedHash,
    recomputedHash,
    archivedHash,
  });

  const audit = await recordProvenanceOperationAudit({
    eventType: status === "MISMATCH" ? "PROVENANCE_HASH_MISMATCH" : "PROVENANCE_HASH_VERIFIED",
    status: status === "MISMATCH" ? "MISMATCH" : status === "UNAVAILABLE" ? "UNAVAILABLE" : "SUCCESS",
    subjectType,
    subjectId,
    provenanceHash: recomputedHash ?? expectedHash,
    actorId: admin.session?.user?.id ?? null,
    actorEmail: admin.session?.user?.email ?? null,
  });

  return res.status(200).json({
    version: 1,
    status,
    subjectType,
    subjectId,
    expectedHash,
    recomputedHash,
    archivedHash,
    checkedAt,
    message,
    ...(!audit.ok ? { auditWarning: audit.warning } : {}),
  });
}
