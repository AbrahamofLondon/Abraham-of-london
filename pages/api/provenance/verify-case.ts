/**
 * pages/api/provenance/verify-case.ts
 *
 * GET /api/provenance/verify-case?subjectType=...&subjectId=...
 *
 * Authenticated user required. Subject-level access required.
 * Looks up the provenance anchor for the subject and compares chainHash
 * to a recomputed hash of the canonical payload.
 *
 * Safe fields only. No raw evidence, governance events, suppression details,
 * actor IDs, or internal notes are returned.
 */

import type { NextApiRequest, NextApiResponse } from "next";
import { resolveIdentity } from "@/lib/auth/resolve-identity";
import { prisma } from "@/lib/prisma";
import { buildGovernedCaseHash } from "@/lib/product/governed-case-hash";
import { applyRateLimit } from "@/lib/server/apply-rate-limit";

// ─── Response type ───────────────────────────────────────────────────────────

export type CaseVerifyStatus = "MATCH" | "MISMATCH" | "UNAVAILABLE" | "UNSUPPORTED";

export type CaseVerifyResult = {
  status: CaseVerifyStatus;
  subjectType: string;
  subjectId: string;
  provenanceHash?: string | null;
  recomputedHash?: string | null;
  checkedAt: string;
  message: string;
  nextAction?: string;
};

// ─── UI state messages ───────────────────────────────────────────────────────

const MESSAGES: Record<CaseVerifyStatus, string> = {
  MATCH: "Hash matches. Record integrity confirmed.",
  MISMATCH: "Integrity warning. Do not rely on this record until reviewed.",
  UNAVAILABLE: "Verification not available yet for this record.",
  UNSUPPORTED: "This record type does not yet support provenance verification.",
};

// ─── Handler ─────────────────────────────────────────────────────────────────

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CaseVerifyResult | { error: string }>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Auth required
  const identity = await resolveIdentity(req);
  if (!identity?.email) {
    return res.status(401).json({ error: "Authentication required" });
  }

  const ok = await applyRateLimit(req, res, {
    scope: "PROVENANCE_VERIFY_CASE",
    identifier: identity.email,
    limit: 30,
    windowSeconds: 60,
  });
  if (!ok) return;

  const { subjectType, subjectId } = req.query;
  const checkedAt = new Date().toISOString();

  if (
    typeof subjectType !== "string" ||
    typeof subjectId !== "string" ||
    !subjectType ||
    !subjectId
  ) {
    return res.status(400).json({ error: "subjectType and subjectId are required" });
  }

  // Currently only GOVERNED_CASE is supported
  if (subjectType !== "GOVERNED_CASE") {
    const result: CaseVerifyResult = {
      status: "UNSUPPORTED",
      subjectType,
      subjectId,
      checkedAt,
      message: MESSAGES.UNSUPPORTED,
      nextAction: "Check back when support for this record type is available.",
    };
    return res.status(200).json(result);
  }

  try {
    // Verify the case belongs to the authenticated user
    const journey = await prisma.diagnosticJourney.findFirst({
      where: {
        journeyKey: subjectId,
        email: identity.email,
      },
      select: {
        journeyKey: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!journey) {
      return res.status(404).json({ error: "Case not found or access denied" });
    }

    // Look up the most recent provenance anchor for this case
    const anchor = await prisma.provenanceChainAnchor.findFirst({
      where: {
        scope: "GOVERNED_CASE",
        scopeId: subjectId,
      },
      orderBy: { computedAt: "desc" },
      select: {
        chainHash: true,
        computedAt: true,
        merkleRoot: true,
        leafCount: true,
      },
    });

    // If no anchor exists, verification is not yet available
    if (!anchor) {
      const result: CaseVerifyResult = {
        status: "UNAVAILABLE",
        subjectType,
        subjectId,
        checkedAt,
        message: MESSAGES.UNAVAILABLE,
        nextAction: "This case has not yet been included in an internal chain anchor. Anchoring occurs periodically for eligible governed cases.",
      };
      return res.status(200).json(result);
    }

    // Recompute a canonical hash from the public-safe anchor payload
    const canonicalPayload: Record<string, unknown> = {
      scope: "GOVERNED_CASE",
      scopeId: subjectId,
      merkleRoot: anchor.merkleRoot,
      leafCount: anchor.leafCount,
      computedAt: anchor.computedAt.toISOString(),
    };

    const recomputedHash = buildGovernedCaseHash(canonicalPayload);
    const isMatch = recomputedHash === anchor.chainHash;
    const status: CaseVerifyStatus = isMatch ? "MATCH" : "MISMATCH";

    const result: CaseVerifyResult = {
      status,
      subjectType,
      subjectId,
      provenanceHash: anchor.chainHash,
      recomputedHash,
      checkedAt,
      message: MESSAGES[status],
      nextAction: isMatch
        ? undefined
        : "Contact support if this case has not been manually edited.",
    };

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Provenance-Status", status);
    return res.status(200).json(result);
  } catch (err) {
    console.error("[verify-case]", err);
    const result: CaseVerifyResult = {
      status: "UNAVAILABLE",
      subjectType,
      subjectId,
      checkedAt,
      message: "Verification could not be completed due to an unexpected error.",
    };
    return res.status(200).json(result);
  }
}

export const config = {
  api: { bodyParser: false },
};
