/**
 * scripts/lib/audit-evidence-strength.mjs
 *
 * Evidence Strength Classification
 *
 * Distinguishes between:
 * - strong_rendered_proof: Evidence is visible in rendered output
 * - wired_but_not_visible: Code imports/uses evidence but doesn't render it
 * - mentioned_only: Evidence term appears but no implementation
 * - keyword_only: Evidence word appears but no context
 * - absent: No evidence present
 */

/**
 * Classify evidence strength in a code snippet
 */
export function classifyEvidenceStrength(code, context = {}) {
  const {
    hasProductAuthorityContractImport = false,
    hasProductAuthorityContractUsage = false,
    rendersAuthorityBadge = false,
    rendersAuthorityPanel = false,
    rendersAuthorityNotice = false,
    rendersEvidenceStatus = false,
    showsPublicClaimLanguage = false,
    showsBlockingReasons = false,
    showsNextAction = false,
    hasLedgerReference = false,
    showsLimitationText = false,
  } = context;

  // Check for rendered proof (strongest)
  if (
    hasProductAuthorityContractUsage &&
    (rendersAuthorityBadge ||
      rendersAuthorityPanel ||
      rendersAuthorityNotice ||
      rendersEvidenceStatus) &&
    showsPublicClaimLanguage
  ) {
    return "strong_rendered_proof";
  }

  // Check for wired but not visible
  if (hasProductAuthorityContractImport && hasProductAuthorityContractUsage && !rendersAuthorityBadge && !rendersAuthorityPanel) {
    return "wired_but_not_visible";
  }

  // Check for mentioned only
  if (
    code.includes("evidence") ||
    code.includes("authority") ||
    code.includes("validation")
  ) {
    if (!hasProductAuthorityContractImport) {
      return "mentioned_only";
    }
  }

  // Check for keyword only
  if (
    (code.includes("Evidence") && !hasProductAuthorityContractImport) ||
    (code.includes("Ledger") && !hasLedgerReference)
  ) {
    return "keyword_only";
  }

  return "absent";
}

/**
 * Audit a component for evidence visibility
 */
export function auditComponentEvidence(componentCode, componentName = "Unknown") {
  const analysis = {
    componentName,
    imports: {
      hasProductAuthorityContract: componentCode.includes(
        "ProductAuthorityContract"
      ),
      hasProductAuthorityBadge: componentCode.includes(
        "ProductAuthorityBadge"
      ),
      hasProductAuthorityPanel: componentCode.includes(
        "ProductAuthorityPanel"
      ),
      hasProductAuthorityNotice: componentCode.includes(
        "ProductAuthorityNotice"
      ),
      hasProductEvidenceStatus: componentCode.includes(
        "ProductEvidenceStatus"
      ),
    },
    usages: {
      consumesContract: /contract\s*=|props\.contract|const\s+\w+\s*=.*contract/i.test(
        componentCode
      ),
      usesContractState:
        /currentAuthorityState|publicClaimLanguage|blockingReasons/i.test(
          componentCode
        ),
      passesContractToChild: /contract\s*=\s*{|<.*contract/i.test(
        componentCode
      ),
    },
    renders: {
      rendersBadge: /<ProductAuthorityBadge/i.test(componentCode),
      rendersPanel: /<ProductAuthorityPanel/i.test(componentCode),
      rendersNotice: /<ProductAuthorityNotice/i.test(componentCode),
      rendersEvidenceStatus: /<ProductEvidenceStatus/i.test(componentCode),
      rendersAuthState: /currentAuthorityState|publicClaimLanguage/i.test(
        componentCode
      ),
    },
    limitations: {
      showsBlockingReasons: /blockingReasons|blocking reason/i.test(
        componentCode
      ),
      showsNextAction: /nextEvidenceAction|next.*action/i.test(
        componentCode
      ),
      showsLimitations: /limitation|limited|blocked|pending/i.test(
        componentCode
      ),
      showsEvidenceLocation: /canonicalLocation|ledger|evidence.*path/i.test(
        componentCode
      ),
    },
  };

  // Compute overall strength
  const strengthContext = {
    hasProductAuthorityContractImport:
      analysis.imports.hasProductAuthorityContract,
    hasProductAuthorityContractUsage:
      analysis.usages.consumesContract || analysis.usages.usesContractState,
    rendersAuthorityBadge: analysis.renders.rendersBadge,
    rendersAuthorityPanel: analysis.renders.rendersPanel,
    rendersAuthorityNotice: analysis.renders.rendersNotice,
    rendersEvidenceStatus: analysis.renders.rendersEvidenceStatus,
    showsPublicClaimLanguage: analysis.renders.rendersAuthState,
    showsBlockingReasons: analysis.limitations.showsBlockingReasons,
    showsNextAction: analysis.limitations.showsNextAction,
    hasLedgerReference:
      analysis.limitations.showsEvidenceLocation,
    showsLimitationText: analysis.limitations.showsLimitations,
  };

  const strength = classifyEvidenceStrength(componentCode, strengthContext);

  return {
    ...analysis,
    strength,
    isReadyForProduction: strength === "strong_rendered_proof",
    requiresWork: strength !== "strong_rendered_proof" && strength !== "absent",
  };
}

/**
 * Audit route/page for evidence visibility
 */
export function auditRouteEvidence(content, routeName = "Unknown") {
  const analysis = auditComponentEvidence(content, routeName);

  // Additional checks for routes
  analysis.isPublicRoute =
    routeName.includes("public") ||
    routeName.includes("product") ||
    routeName.includes("diagnostics");
  analysis.isAdminRoute =
    routeName.includes("admin") ||
    routeName.includes("control") ||
    routeName.includes("board");

  // For public routes, authority visibility is critical
  if (analysis.isPublicRoute) {
    analysis.meetsPublicStandard =
      analysis.strength === "strong_rendered_proof" &&
      analysis.limitations.showsLimitations;
  }

  // For admin routes, administrative detail is required
  if (analysis.isAdminRoute) {
    analysis.meetsAdminStandard =
      analysis.strength === "strong_rendered_proof" &&
      analysis.limitations.showsBlockingReasons &&
      analysis.limitations.showsNextAction;
  }

  return analysis;
}

export default {
  classifyEvidenceStrength,
  auditComponentEvidence,
  auditRouteEvidence,
};
