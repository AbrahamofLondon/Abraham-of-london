import { prisma } from "@/lib/prisma.server";
import { buildGovernedCaseHash } from "@/lib/product/governed-case-hash";

export type SharedCaseVerifyStatus = "MATCH" | "MISMATCH" | "UNAVAILABLE";

export type SharedCaseVerifyResult = {
  status: SharedCaseVerifyStatus;
  checkedAt: string;
  message: string;
  provenanceHash?: string | null;
  recomputedHash?: string | null;
};

export async function verifySharedGovernedCase(caseId: string): Promise<SharedCaseVerifyResult> {
  const checkedAt = new Date().toISOString();
  const anchor = await prisma.provenanceChainAnchor.findFirst({
    where: {
      scope: "GOVERNED_CASE",
      scopeId: caseId,
    },
    orderBy: { computedAt: "desc" },
    select: {
      chainHash: true,
      computedAt: true,
      merkleRoot: true,
      leafCount: true,
    },
  });

  if (!anchor) {
    return {
      status: "UNAVAILABLE",
      checkedAt,
      message: "Verification is not yet available for this record type.",
    };
  }

  const recomputedHash = buildGovernedCaseHash({
    scope: "GOVERNED_CASE",
    scopeId: caseId,
    merkleRoot: anchor.merkleRoot,
    leafCount: anchor.leafCount,
    computedAt: anchor.computedAt.toISOString(),
  });

  const status: SharedCaseVerifyStatus = recomputedHash === anchor.chainHash ? "MATCH" : "MISMATCH";
  return {
    status,
    checkedAt,
    message: status === "MATCH"
      ? "Hash matches. Record integrity confirmed."
      : "Integrity warning. Do not rely on this record until reviewed.",
    provenanceHash: anchor.chainHash,
    recomputedHash,
  };
}
