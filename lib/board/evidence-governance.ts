/**
 * Board-Facing Evidence Governance
 *
 * Ensures that board-facing products classify all claims by evidence basis
 * and suppress or downgrade unsupported board-grade language.
 *
 * Non-negotiable: Board-facing material must not present user estimates,
 * subjective inputs, or rule-based inferences as verified board evidence.
 */

export type EvidenceClass =
  | "verified_evidence"
  | "documented_evidence"
  | "user_supplied_claim"
  | "user_estimate"
  | "derived_inference"
  | "unsupported_claim"
  | "missing_evidence";

export type BoardClaim = {
  text: string;
  evidenceClass: EvidenceClass;
  basis: string;
  supportingEvidence?: string[];
  limitations?: string[];
};

export type EvidenceSource = {
  sourceType: "verified" | "user_supplied" | "derived" | "missing";
  description: string;
  credibility: "high" | "medium" | "low" | "unverified";
};

export type BoardEvidenceBoundary = {
  verifiedClaims: string[];
  documentedClaims?: string[];
  userSuppliedClaims: string[];
  derivedInferences: string[];
  unsupportedClaims: string[];
  missingEvidence: string[];
  nextEvidenceActions: string[];
};

/**
 * Classify a board-facing claim by its evidence basis
 */
export function classifyBoardClaim(
  claim: string,
  basis: string,
  evidenceAvailable: boolean,
  isUserInput: boolean,
  isEstimate: boolean,
): EvidenceClass {
  if (isEstimate) {
    return "user_estimate";
  }
  if (isUserInput && !evidenceAvailable) {
    return "user_supplied_claim";
  }
  if (!evidenceAvailable) {
    return "missing_evidence";
  }
  if (isUserInput) {
    return "user_supplied_claim";
  }
  if (basis === "derived" || basis === "inferred") {
    return "derived_inference";
  }
  if (evidenceAvailable && !isUserInput) {
    return "documented_evidence";
  }
  return "unsupported_claim";
}

/**
 * Classify an evidence source
 */
export function classifyEvidenceSource(
  source: string,
  isVerified: boolean,
  isUserSupplied: boolean,
): EvidenceSource {
  if (isUserSupplied) {
    return {
      sourceType: "user_supplied",
      description: `User-supplied: ${source}`,
      credibility: "unverified",
    };
  }
  if (isVerified) {
    return {
      sourceType: "verified",
      description: source,
      credibility: "high",
    };
  }
  return {
    sourceType: "derived",
    description: `Derived from: ${source}`,
    credibility: "medium",
  };
}

/**
 * Detect unsupported board claims
 */
export function detectUnsupportedBoardClaim(
  claim: string,
  evidenceClass: EvidenceClass,
): { unsupported: boolean; reason?: string } {
  // Detection list — these patterns are flagged when found in board-facing output
  // without evidence boundary context. This is a guard definition, not a claim.
  const boardyPhrases = [
    "board-ready",
    "board approved",
    "investment-ready",
    "governance assured",
    "executive certainty",
    "decision approved",
    "guaranteed",
    "verified cost",
    "proven board case",
  ];

  const claimLower = claim.toLowerCase();
  const hasOversizing = boardyPhrases.some((phrase) =>
    claimLower.includes(phrase)
  );

  if (
    hasOversizing &&
    (evidenceClass === "user_supplied_claim" ||
      evidenceClass === "user_estimate" ||
      evidenceClass === "derived_inference" ||
      evidenceClass === "unsupported_claim" ||
      evidenceClass === "missing_evidence")
  ) {
    return {
      unsupported: true,
      reason: `Cannot claim "${
        boardyPhrases.find((p) => claimLower.includes(p)) || "board-ready"
      }" with evidence class: ${evidenceClass}`,
    };
  }

  return { unsupported: false };
}

/**
 * Downgrade unsupported board language
 */
export function downgradeUnsupportedBoardLanguage(
  claim: string,
  evidenceClass: EvidenceClass,
): string {
  const replacements: Record<string, string> = {
    "board-ready": "board-facing draft",
    "board approved": "board-review material",
    "investment-ready": "requires investment review",
    "governance assured": "governance-eligible",
    "executive certainty": "evidence-limited assessment",
    "decision approved": "decision-eligible",
    guaranteed: "subject to verification",
    "verified cost": "estimated cost",
    "proven board case": "preliminary board case",
  };

  let downgraded = claim;

  if (
    evidenceClass !== "verified_evidence" &&
    evidenceClass !== "documented_evidence"
  ) {
    for (const [original, replacement] of Object.entries(replacements)) {
      downgraded = downgraded.replace(
        new RegExp(original, "gi"),
        replacement
      );
    }
  }

  return downgraded;
}

/**
 * Build board evidence boundary
 */
export function buildBoardEvidenceBoundary(
  claims: Array<{ text: string; evidenceClass: EvidenceClass }>,
): BoardEvidenceBoundary {
  const boundary: BoardEvidenceBoundary = {
    verifiedClaims: [],
    userSuppliedClaims: [],
    derivedInferences: [],
    unsupportedClaims: [],
    missingEvidence: [],
    nextEvidenceActions: [],
  };

  for (const { text, evidenceClass } of claims) {
    switch (evidenceClass) {
      case "verified_evidence":
      case "documented_evidence":
        boundary.verifiedClaims.push(text);
        break;
      case "user_supplied_claim":
        boundary.userSuppliedClaims.push(text);
        break;
      case "derived_inference":
        boundary.derivedInferences.push(text);
        break;
      case "unsupported_claim":
        boundary.unsupportedClaims.push(text);
        break;
      case "missing_evidence":
        boundary.missingEvidence.push(text);
        break;
      case "user_estimate":
        boundary.userSuppliedClaims.push(`[ESTIMATE] ${text}`);
        break;
    }
  }

  return boundary;
}

/**
 * Build next evidence action based on missing evidence
 */
export function buildNextEvidenceAction(
  missingEvidenceDescriptions: string[],
): string[] {
  if (missingEvidenceDescriptions.length === 0) {
    return [];
  }

  const actions: string[] = [];

  for (const missing of missingEvidenceDescriptions) {
    const lowerMissing = missing.toLowerCase();

    if (lowerMissing.includes("cost") || lowerMissing.includes("financial")) {
      actions.push(
        "Verify financial impact through cost analysis or financial review"
      );
    } else if (
      lowerMissing.includes("authority") ||
      lowerMissing.includes("owner")
    ) {
      actions.push(
        "Confirm decision authority and accountability structure"
      );
    } else if (lowerMissing.includes("evidence")) {
      actions.push("Gather and document supporting evidence");
    } else if (
      lowerMissing.includes("stakeholder") ||
      lowerMissing.includes("impact")
    ) {
      actions.push("Assess stakeholder impact and dependencies");
    } else {
      actions.push(`Address missing evidence: ${missing}`);
    }
  }

  return [...new Set(actions)]; // Remove duplicates
}

/**
 * Determine if claim can be made with given evidence
 */
export function canMakeBoardClaim(
  desiredClaim: string,
  evidenceClass: EvidenceClass,
): boolean {
  // Detection list — these patterns are checked for evidence basis before allowing.
  // This is a guard definition, not a claim.
  const strongClaims = [
    "board-ready",
    "governance assured",
    "verified",
    "proven",
    "approved",
  ];

  const hasStrongClaim = strongClaims.some((sc) =>
    desiredClaim.toLowerCase().includes(sc)
  );

  if (hasStrongClaim) {
    // Strong claims only allowed with verified evidence
    return (
      evidenceClass === "verified_evidence" ||
      evidenceClass === "documented_evidence"
    );
  }

  // Weaker claims allowed with better evidence classes
  return evidenceClass !== "unsupported_claim" && evidenceClass !== "missing_evidence";
}

/**
 * Format board-facing boundary for display
 */
export function formatBoardEvidenceBoundary(
  boundary: BoardEvidenceBoundary
): string {
  const sections: string[] = [];

  if (boundary.verifiedClaims.length > 0) {
    sections.push(
      `VERIFIED EVIDENCE:\n${boundary.verifiedClaims.map((c) => `  ✓ ${c}`).join("\n")}`
    );
  }

  if ((boundary.documentedClaims?.length ?? 0) > 0) {
    sections.push(
      `DOCUMENTED EVIDENCE:\n${(boundary.documentedClaims || [])
        .map((c: string) => `  • ${c}`)
        .join("\n")}`
    );
  }

  if (boundary.userSuppliedClaims.length > 0) {
    sections.push(
      `USER-SUPPLIED CLAIMS (unverified):\n${boundary.userSuppliedClaims
        .map((c) => `  ⓘ ${c}`)
        .join("\n")}`
    );
  }

  if (boundary.derivedInferences.length > 0) {
    sections.push(
      `DERIVED INFERENCES:\n${boundary.derivedInferences
        .map((c) => `  → ${c}`)
        .join("\n")}`
    );
  }

  if (boundary.unsupportedClaims.length > 0) {
    sections.push(
      `UNSUPPORTED CLAIMS (suppressed):\n${boundary.unsupportedClaims
        .map((c) => `  ✗ ${c}`)
        .join("\n")}`
    );
  }

  if (boundary.missingEvidence.length > 0) {
    sections.push(
      `MISSING EVIDENCE:\n${boundary.missingEvidence
        .map((c) => `  ⚠ ${c}`)
        .join("\n")}`
    );
  }

  if (boundary.nextEvidenceActions.length > 0) {
    sections.push(
      `NEXT EVIDENCE ACTIONS:\n${boundary.nextEvidenceActions
        .map((a) => `  → ${a}`)
        .join("\n")}`
    );
  }

  return sections.join("\n\n");
}
