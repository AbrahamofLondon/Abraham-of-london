/**
 * scripts/lib/audit-route-render-proof.mjs
 *
 * Route Render Proof Audit
 *
 * Verifies that routes render evidence-driven authority, not just import code.
 * Classifies route readiness for category demonstration.
 */

/**
 * Check if a route demonstrates the category
 */
export function classifyRouteReadiness(routeAnalysis) {
  const {
    strength,
    isPublicRoute,
    isAdminRoute,
    meetsPublicStandard,
    meetsAdminStandard,
    renders,
    limitations,
  } = routeAnalysis;

  // Strong rendered proof with limitations = category demonstrated
  if (
    strength === "strong_rendered_proof" &&
    limitations.showsLimitations &&
    limitations.showsNextAction
  ) {
    return "category_demonstrated";
  }

  // Wired but not visible = infrastructure present but hidden
  if (strength === "wired_but_not_visible") {
    return "infrastructure_present_but_hidden";
  }

  // Renders authority but not limitations = authority visible but value unclear
  if (
    (renders.rendersBadge || renders.rendersPanel) &&
    !limitations.showsLimitations
  ) {
    return "authority_visible_but_value_unclear";
  }

  // Code present but not rendered = underwired
  if (strength === "mentioned_only" || strength === "keyword_only") {
    return "static_or_decorative";
  }

  return "not_category_ready";
}

/**
 * Audit route for category readiness
 */
export function auditRouteForCategory(routeName, content, metadata = {}) {
  const {
    isProductPage = false,
    isAdminPage = false,
    isDemoPage = false,
    expectedAuthority = null,
  } = metadata;

  const analysis = {
    route: routeName,
    rendersEvidence: {
      ProductAuthorityBadge: /<ProductAuthorityBadge/i.test(content),
      ProductAuthorityPanel: /<ProductAuthorityPanel/i.test(content),
      ProductAuthorityNotice: /<ProductAuthorityNotice/i.test(content),
      ProductEvidenceStatus: /<ProductEvidenceStatus/i.test(content),
      ProductAuthorityWrapper: /<ProductAuthorityWrapper/i.test(content),
    },

    showsInformation: {
      currentAuthorityState: /currentAuthorityState|authority.*state|resolveProductAuthority|contract\./i.test(
        content
      ),
      publicClaimLanguage:
        /publicClaimLanguage|public.*claim|externally.*proven|legacy.*validated|under.*validation|contract\./i.test(
          content
        ),
      blockingReasons: /blockingReasons|blocking.*reason|blocked.*because|ProductAuthorityPanel|ProductAuthorityNotice/i.test(
        content
      ),
      nextAction:
        /nextEvidenceAction|next.*action|next.*step|require|generate.*evidence|ProductAuthorityPanel|contract\./i.test(
          content
        ),
      limitations: /limitation|limited|blocked|pending|not.*released|ProductAuthorityPanel|ProductAuthorityNotice/i.test(
        content
      ),
      evidenceSource: /evidence.*source|generated.*evidence|legacy.*evidence|ProductAuthorityPanel|contract\./i.test(
        content
      ),
    },

    routeClassification: {
      isProductPage,
      isAdminPage,
      isDemoPage,
    },
  };

  // Count rendered components (including wrapper which counts as 2 since it renders badge + text)
  const renderedCount = Object.values(analysis.rendersEvidence).filter(
    (v) => v
  ).length;
  // Wrapper counts as 2 components since it renders badge + language
  const wrapperBonus = analysis.rendersEvidence.ProductAuthorityWrapper ? 1 : 0;
  const effectiveRenderedCount = renderedCount + wrapperBonus;
  const showsCount = Object.values(analysis.showsInformation).filter(
    (v) => v
  ).length;

  // Classify readiness
  if (effectiveRenderedCount >= 2 && showsCount >= 4) {
    analysis.readiness = "category_demonstrated";
  } else if (effectiveRenderedCount >= 1 && showsCount >= 3) {
    analysis.readiness = "authority_visible_but_value_unclear";
  } else if (effectiveRenderedCount >= 1 && showsCount >= 2) {
    analysis.readiness = "authority_visible_but_value_unclear";
  } else if (effectiveRenderedCount === 0 && showsCount >= 2) {
    analysis.readiness = "infrastructure_present_but_hidden";
  } else if (showsCount === 0) {
    analysis.readiness = "not_category_ready";
  } else {
    analysis.readiness = "static_or_decorative";
  }

  // Check for overclaim risk
  if (
    analysis.readiness === "not_category_ready" &&
    /gold|proven|diagnostic|intelligence/i.test(content) &&
    !analysis.showsInformation.blockingReasons
  ) {
    analysis.overclaim_risk = true;
  }

  // Product page standards
  if (isProductPage) {
    analysis.meetsProductPageStandard =
      analysis.readiness === "category_demonstrated" &&
      analysis.showsInformation.blockingReasons &&
      !analysis.overclaim_risk;
  }

  // Admin page standards
  if (isAdminPage) {
    analysis.meetsAdminPageStandard =
      analysis.readiness === "category_demonstrated" &&
      analysis.showsInformation.blockingReasons &&
      analysis.showsInformation.nextAction &&
      analysis.showsInformation.evidenceSource;
  }

  return analysis;
}

/**
 * Classify route proof status
 */
export function getProofStatus(routeAnalysis) {
  const status = {
    strong_rendered_proof:
      routeAnalysis.readiness === "category_demonstrated",
    wired_but_not_visible:
      routeAnalysis.readiness === "infrastructure_present_but_hidden",
    mentioned_only: routeAnalysis.readiness === "static_or_decorative",
    overclaim_risk: routeAnalysis.overclaim_risk || false,
    not_ready: routeAnalysis.readiness === "not_category_ready",
  };

  return status;
}

export default {
  classifyRouteReadiness,
  auditRouteForCategory,
  getProofStatus,
};
