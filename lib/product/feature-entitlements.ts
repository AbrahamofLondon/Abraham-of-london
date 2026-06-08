/**
 * lib/product/feature-entitlements.ts
 *
 * Feature-level entitlement map.
 *
 * Maps product features (as experienced by the user) to the entitlement
 * slugs required to access them. Used by UpgradePrompt and access-gate
 * components to determine what a user is missing and what they need.
 *
 * Rules:
 * - Feature slugs are stable identifiers, not display strings.
 * - A feature may require one of several entitlements (OR logic).
 * - This file does not check entitlements — it defines the map.
 *   Actual checking is done by lib/commercial/entitlements.ts.
 * - Do not hardcode prices here. Use catalog.ts for pricing.
 */

import { CATALOG } from "@/lib/commercial/catalog";

// ─── Feature slugs ────────────────────────────────────────────────────────────

export type FeatureSlug =
  | "fast_diagnostic"
  | "decision_delay_exposure"
  | "provenance_demo"
  | "decision_centre"
  | "executive_reporting"
  | "strategy_room"
  | "strategy_room_extended"
  | "governed_case_detail"
  | "return_brief"
  | "benchmark_context_basic"
  | "benchmark_context_advanced"
  | "retainer_oversight"
  | "counsel_review"
  | "boardroom"
  | "professional_tier";

// ─── Feature definition ───────────────────────────────────────────────────────

export type FeatureCapabilityType =
  | "diagnostic"     // runs a diagnostic / assessment
  | "reporting"      // produces a governed report
  | "execution"      // facilitated decision execution
  | "intelligence"   // market / intelligence layer
  | "benchmark"      // benchmark comparison capability
  | "outcome_loop"   // closes the outcome / return loop
  | "continuity"     // maintains case continuity over time
  | "governance"     // governance instrument or framework
  | "oversight"      // retainer / oversight engagement
  | "free_tool";     // free public instrument

export type FeatureDefinition = {
  slug: FeatureSlug;
  displayName: string;
  description: string;
  accessLevel: "free" | "paid" | "retainer" | "contracted";
  /** Entitlement slugs — any one of these grants access */
  requiredEntitlementSlugs: string[];
  /** Catalog product code that grants this feature (primary) */
  primaryProductCode: string | null;
  /** Catalog code of the product that owns/contains this feature */
  ownerProduct: string | null;
  /** Capability classification */
  capabilityType: FeatureCapabilityType;
  /** Where to go to upgrade/unlock this feature. Must NOT be bare /pricing for feature-specific CTAs. */
  upgradeHref: string;
  upgradeLabel: string;
  /** Where the feature actually lives when the user is entitled. May differ from upgradeHref. */
  semanticAccessRoute: string;
};

// ─── Feature map ──────────────────────────────────────────────────────────────

export const FEATURES: Record<FeatureSlug, FeatureDefinition> = {
  fast_diagnostic: {
    slug: "fast_diagnostic",
    displayName: "Fast Diagnostic",
    description: "Anonymous, no account required. Governed finding in under 3 minutes.",
    accessLevel: "free",
    requiredEntitlementSlugs: [],
    primaryProductCode: null,
    ownerProduct: null,
    capabilityType: "diagnostic",
    upgradeHref: "/diagnostics/fast",
    upgradeLabel: "Run the Fast Diagnostic",
    semanticAccessRoute: "/diagnostics/fast",
  },

  decision_delay_exposure: {
    slug: "decision_delay_exposure",
    displayName: "Decision Delay Exposure Instrument",
    description: "Estimate the financial and structural cost of a deferred decision.",
    accessLevel: "free",
    requiredEntitlementSlugs: [],
    primaryProductCode: null,
    ownerProduct: null,
    capabilityType: "free_tool",
    upgradeHref: "/tools/decision-delay-exposure",
    upgradeLabel: "Run the instrument",
    semanticAccessRoute: "/tools/decision-delay-exposure",
  },

  provenance_demo: {
    slug: "provenance_demo",
    displayName: "Provenance Demonstration",
    description: "See how the governed record integrity model works.",
    accessLevel: "free",
    requiredEntitlementSlugs: [],
    primaryProductCode: null,
    ownerProduct: null,
    capabilityType: "governance",
    upgradeHref: "/provenance/demo",
    upgradeLabel: "View the demo",
    semanticAccessRoute: "/provenance/demo",
  },

  decision_centre: {
    slug: "decision_centre",
    displayName: "Decision Centre",
    description: "Your governed case console. Requires a free account.",
    accessLevel: "free",
    requiredEntitlementSlugs: [],
    primaryProductCode: null,
    ownerProduct: null,
    capabilityType: "continuity",
    upgradeHref: "/decision-centre",
    upgradeLabel: "Open Decision Centre",
    semanticAccessRoute: "/decision-centre",
  },

  executive_reporting: {
    slug: "executive_reporting",
    displayName: "Executive Reporting",
    description:
      "Board-ready governed case report. Structured for director-level review.",
    accessLevel: "paid",
    requiredEntitlementSlugs: [
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      CATALOG.executive_reporting!.entitlementSlug,
    ],
    primaryProductCode: "executive_reporting",
    ownerProduct: "executive_reporting",
    capabilityType: "reporting",
    upgradeHref: "/diagnostics/executive-reporting",
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    upgradeLabel: `Access Executive Reporting — ${CATALOG.executive_reporting!.displayPrice}`,
    semanticAccessRoute: "/diagnostics/executive-reporting",
  },

  strategy_room: {
    slug: "strategy_room",
    displayName: "Strategy Room",
    description:
      "Facilitated decision execution session. Governed commitment record produced.",
    accessLevel: "paid",
    requiredEntitlementSlugs: [
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      CATALOG.strategy_room!.entitlementSlug,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      CATALOG.strategy_room_extended!.entitlementSlug,
    ],
    primaryProductCode: "strategy_room",
    ownerProduct: "strategy_room",
    capabilityType: "execution",
    upgradeHref: "/strategy-room",
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    upgradeLabel: `Enter Strategy Room — ${CATALOG.strategy_room!.displayPrice}`,
    semanticAccessRoute: "/strategy-room",
  },

  strategy_room_extended: {
    slug: "strategy_room_extended",
    displayName: "Strategy Room — Active / Multi-Decision",
    description:
      "Extended strategy room access for ongoing or multi-decision engagements.",
    accessLevel: "paid",
    requiredEntitlementSlugs: [
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      CATALOG.strategy_room_extended!.entitlementSlug,
    ],
    primaryProductCode: "strategy_room_extended",
    ownerProduct: "strategy_room_extended",
    capabilityType: "execution",
    upgradeHref: "/strategy-room",
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    upgradeLabel: `Extended access — ${CATALOG.strategy_room_extended!.displayPrice}`,
    semanticAccessRoute: "/strategy-room",
  },

  governed_case_detail: {
    slug: "governed_case_detail",
    displayName: "Governed Case Detail",
    description:
      "Full case cockpit: chain of custody, verification, return brief access.",
    accessLevel: "free",
    requiredEntitlementSlugs: [],
    primaryProductCode: null,
    ownerProduct: null,
    capabilityType: "continuity",
    upgradeHref: "/decision-centre",
    upgradeLabel: "View in Decision Centre",
    semanticAccessRoute: "/decision-centre",
  },

  return_brief: {
    slug: "return_brief",
    displayName: "Return Brief",
    description:
      "Structured case re-engagement document generation for governed cases that need continuity.",
    accessLevel: "paid",
    requiredEntitlementSlugs: [
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      CATALOG.professional!.entitlementSlug,
    ],
    primaryProductCode: "professional",
    ownerProduct: "professional",
    capabilityType: "outcome_loop",
    upgradeHref: "/professionals",
    upgradeLabel: "Upgrade to Professional",
    semanticAccessRoute: "/return-brief",
  },

  benchmark_context_basic: {
    slug: "benchmark_context_basic",
    displayName: "Basic Benchmark Context",
    description:
      "Aggregate outcome data from opted-in governed cases. Available at n ≥ 50.",
    accessLevel: "free",
    requiredEntitlementSlugs: [],
    primaryProductCode: null,
    ownerProduct: null,
    capabilityType: "benchmark",
    upgradeHref: "/benchmark-context",
    upgradeLabel: "Understand Benchmark Context",
    semanticAccessRoute: "/decision-centre",
  },

  benchmark_context_advanced: {
    slug: "benchmark_context_advanced",
    displayName: "Advanced Benchmark Context",
    description:
      "Advanced benchmark comparisons across opted-in governed cases.",
    accessLevel: "paid",
    requiredEntitlementSlugs: [
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      CATALOG.professional!.entitlementSlug,
    ],
    primaryProductCode: "professional",
    ownerProduct: "professional",
    capabilityType: "benchmark",
    upgradeHref: "/benchmark-context",
    upgradeLabel: "Upgrade to Professional for advanced benchmarks",
    semanticAccessRoute: "/benchmark-context",
  },

  retainer_oversight: {
    slug: "retainer_oversight",
    displayName: "Retained Oversight",
    description:
      "Ongoing governed decision accountability. Monthly retainer engagement.",
    accessLevel: "retainer",
    requiredEntitlementSlugs: [
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      CATALOG.retainer_core!.entitlementSlug,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      CATALOG.retainer_operational!.entitlementSlug,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      CATALOG.retainer_institutional!.entitlementSlug,
    ],
    primaryProductCode: "retainer_core",
    ownerProduct: "retainer_core",
    capabilityType: "oversight",
    upgradeHref: "/oversight",
    upgradeLabel: "Enquire about retained oversight",
    semanticAccessRoute: "/oversight",
  },

  counsel_review: {
    slug: "counsel_review",
    displayName: "Counsel Review",
    description:
      "Qualified reviewer assessment of a governed case. By referral from the system.",
    accessLevel: "contracted",
    requiredEntitlementSlugs: [],
    primaryProductCode: null,
    ownerProduct: null,
    capabilityType: "governance",
    upgradeHref: "/counsel",
    upgradeLabel: "Request counsel review",
    semanticAccessRoute: "/counsel",
  },

  boardroom: {
    slug: "boardroom",
    displayName: "Boardroom",
    description:
      "Board-level case escalation. Available for CRITICAL governed cases.",
    accessLevel: "contracted",
    requiredEntitlementSlugs: [],
    primaryProductCode: null,
    ownerProduct: "boardroom_mode",
    capabilityType: "governance",
    upgradeHref: "/boardroom-mode",
    upgradeLabel: "Understand Boardroom Mode",
    semanticAccessRoute: "/boardroom-mode",
  },

  professional_tier: {
    slug: "professional_tier",
    displayName: "Professional",
    description:
      "Unlimited active governed cases, Return Brief generation, client-safe evidence export, client-safe case sharing for reviewers and auditors, and organisation workspace.",
    accessLevel: "paid",
    requiredEntitlementSlugs: [
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      CATALOG.professional!.entitlementSlug,
    ],
    primaryProductCode: "professional",
    ownerProduct: "professional",
    capabilityType: "continuity",
    upgradeHref: "/professionals",
    upgradeLabel: "Start Professional",
    semanticAccessRoute: "/professionals",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getFeature(slug: FeatureSlug): FeatureDefinition {
  return FEATURES[slug];
}

/**
 * Returns whether a feature is free (no entitlement required).
 */
export function isFeatureFree(slug: FeatureSlug): boolean {
  return FEATURES[slug].requiredEntitlementSlugs.length === 0;
}

/**
 * Returns the primary product code needed to unlock a feature.
 * Returns null for free features.
 */
export function primaryProductForFeature(slug: FeatureSlug): string | null {
  return FEATURES[slug].primaryProductCode;
}

/**
 * Returns all paid features (requires entitlement).
 */
export function paidFeatures(): FeatureDefinition[] {
  return Object.values(FEATURES).filter((f) => f.accessLevel === "paid");
}

/**
 * Returns all retainer/contracted features.
 */
export function retainerFeatures(): FeatureDefinition[] {
  return Object.values(FEATURES).filter(
    (f) => f.accessLevel === "retainer" || f.accessLevel === "contracted",
  );
}
