/**
 * lib/living-intelligence/adapters/gmi-adapter.ts
 *
 * GMI (Global Market Intelligence) domain adapter — Phase 5B.
 *
 * Translates GMI lifecycle records, registry entries, and content documents
 * into LivingStateObjects. The lifecycle authority is the single source of
 * publication truth — registry `current` flags are admin in-preparation focus
 * only, and MDX/frontmatter cannot override lifecycle state.
 *
 * Sources inspected:
 *   lib/intelligence/market-intelligence-lifecycle.ts  (publication authority)
 *   lib/commercial/gmi/gmi-edition-registry.ts         (commercial/catalog view)
 *   lib/commercial/gmi/gmi-edition-factory.ts          (factory validation)
 *   pages/intelligence/gmi/index.tsx                   (public surface)
 *   content/intelligence/**                             (content documents)
 *   reports/living-estate-intelligence-report.json     (estate checker output)
 *
 * Every object answers:
 *   1. What is the document/report?
 *   2. What lifecycle state does the authority claim?
 *   3. What does the registry claim?
 *   4. What does content frontmatter claim?
 *   5. Is the route public?
 *   6. Is the object current, forthcoming, archived, draft, or superseded?
 *   7. Is it purchasable or merely visible?
 *   8. Is there a contradiction?
 *   9. Who must act?
 *  10. What is the next governed action?
 *
 * The system REFUSES to infer:
 *   - publication from file existence
 *   - current status from registry focus alone
 *   - commercial availability from route presence
 *   - archive status without lifecycle support
 *   - release readiness from MDX/frontmatter alone
 *   - supersession from naming convention alone
 */

import {
  MARKET_INTELLIGENCE_LIFECYCLE,
  getMarketIntelligenceCommercialState,
  getCurrentPublishedMarketIntelligenceReport,
  getUpcomingMarketIntelligenceReport,
  type MarketIntelligenceLifecycleRecord,
} from "@/lib/intelligence/market-intelligence-lifecycle";
import { GMI_EDITION_REGISTRY } from "@/lib/commercial/gmi/gmi-edition-registry";
import type { GmiEditionRegistryEntry } from "@/lib/commercial/gmi/gmi-edition-registry";

import {
  readString,
  readBool,
  readStringArray,
  type LivingDomainAdapter,
  type LivingDomainAdapterInput,
} from "@/lib/living-intelligence/living-domain-adapter-contract";
import type {
  LivingStateArtifactStatus,
  LivingStateBlockerCode,
  LivingStateConsentStatus,
  LivingStateEvidenceStatus,
  LivingStateObject,
  LivingStateStage,
} from "@/lib/living-intelligence/living-state-object-contract";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Map lifecycle state to a living stage.
 */
function lifecycleToStage(state: string): LivingStateStage {
  switch (state) {
    case "DRAFT":
    case "SCHEDULED":
      return "draft_generated";
    case "ACTIVE":
    case "ACTIVE_UNTIL_SUPERSEDED":
      return "published";
    case "SUPERSEDED":
      return "archived";
    case "ARCHIVED":
      return "archived";
    case "RETIRED":
      return "archived";
    default:
      return "draft_generated";
  }
}

/**
 * Map registry status to a living stage.
 */
function registryStatusToStage(status: string): LivingStateStage {
  switch (status) {
    case "draft":
      return "draft_generated";
    case "active":
    case "manual_billing":
      return "published";
    case "archived":
      return "archived";
    case "retired":
      return "archived";
    default:
      return "draft_generated";
  }
}

/**
 * Derive evidence status from lifecycle and registry agreement.
 */
function deriveGmiEvidence(
  lifecycleRecord: MarketIntelligenceLifecycleRecord | null,
  registryEntry: GmiEditionRegistryEntry | null,
): LivingStateEvidenceStatus {
  if (!lifecycleRecord && !registryEntry) return "unverified";
  if (!lifecycleRecord) return "inferred";
  if (!registryEntry) return "weakly_indicated";

  // Check for contradiction between lifecycle and registry.
  const lifecyclePublished = lifecycleRecord.lifecycleState === "ACTIVE" ||
    lifecycleRecord.lifecycleState === "ACTIVE_UNTIL_SUPERSEDED";
  const registryPublished = registryEntry.status === "active" ||
    registryEntry.status === "manual_billing";

  if (lifecyclePublished !== registryPublished) return "contradictory";

  return lifecyclePublished ? "verified" : "weakly_indicated";
}

/**
 * Build the list of things the system refuses to infer.
 */
function buildCannotInfer(
  lifecycleRecord: MarketIntelligenceLifecycleRecord | null,
  registryEntry: GmiEditionRegistryEntry | null,
): string[] {
  const cannot: string[] = [];
  cannot.push("Publication from file existence — a content file is not a published report.");
  cannot.push("Current status from registry focus alone — registry `current` is admin focus, not publication truth.");
  cannot.push("Commercial availability from route presence — a route does not create purchase permission.");
  cannot.push("Archive status without lifecycle support — lifecycle authority decides archive state.");
  cannot.push("Release readiness from MDX/frontmatter alone — lifecycle authority decides publication readiness.");
  cannot.push("Supersession from naming convention alone — lifecycle authority decides supersession.");
  return cannot;
}

/**
 * Detect lifecycle contradictions between lifecycle authority and registry.
 */
function detectLifecycleContradictions(
  lifecycleRecord: MarketIntelligenceLifecycleRecord | null,
  registryEntry: GmiEditionRegistryEntry | null,
): { code: LivingStateBlockerCode; explanation: string; requiredAction: string }[] {
  const blockers: { code: LivingStateBlockerCode; explanation: string; requiredAction: string }[] = [];

  if (!lifecycleRecord && registryEntry) {
    blockers.push({
      code: "source_of_truth_conflict",
      explanation: `GMI edition "${registryEntry.editionId}" exists in the registry but has no lifecycle record. The lifecycle authority is the single source of publication truth.`,
      requiredAction: "Add a lifecycle record for this edition or remove it from the registry.",
    });
  }

  if (lifecycleRecord && !registryEntry) {
    blockers.push({
      code: "source_of_truth_conflict",
      explanation: `GMI edition "${lifecycleRecord.id}" exists in the lifecycle but has no registry entry. The commercial catalog cannot represent this edition.`,
      requiredAction: "Add a registry entry for this edition or remove the lifecycle record.",
    });
  }

  if (lifecycleRecord && registryEntry) {
    const lifecyclePublished = lifecycleRecord.lifecycleState === "ACTIVE" ||
      lifecycleRecord.lifecycleState === "ACTIVE_UNTIL_SUPERSEDED";
    const registryPublished = registryEntry.status === "active" ||
      registryEntry.status === "manual_billing";

    if (lifecyclePublished && !registryPublished) {
      blockers.push({
        code: "lifecycle_conflict",
        explanation: `Lifecycle says "${lifecycleRecord.id}" is ${lifecycleRecord.lifecycleState} (published) but registry status is "${registryEntry.status}" (not published). The registry must agree with the lifecycle authority.`,
        requiredAction: "Update the registry entry status to match the lifecycle authority.",
      });
    }

    if (!lifecyclePublished && registryPublished) {
      blockers.push({
        code: "lifecycle_conflict",
        explanation: `Registry says "${registryEntry.editionId}" is "${registryEntry.status}" (published) but lifecycle state is "${lifecycleRecord.lifecycleState}" (not published). The lifecycle authority must agree.`,
        requiredAction: "Either update the lifecycle to published or downgrade the registry to draft.",
      });
    }

    // Draft lifecycle but registry has current:true (admin focus flag used as publication truth).
    if (!lifecyclePublished && registryEntry.current) {
      blockers.push({
        code: "source_of_truth_conflict",
        explanation: `Registry entry "${registryEntry.editionId}" has current=true (admin focus) but lifecycle state is "${lifecycleRecord.lifecycleState}" (not published). Registry current is admin in-preparation focus only — it must not be treated as publication truth.`,
        requiredAction: "Do not use registry `current` as publication authority. The lifecycle decides what is current published.",
      });
    }

    // Draft lifecycle but purchasable in lifecycle record.
    if (!lifecyclePublished && lifecycleRecord.purchasable) {
      blockers.push({
        code: "checkout_permission_conflict",
        explanation: `Lifecycle record "${lifecycleRecord.id}" is ${lifecycleRecord.lifecycleState} (not published) but is marked purchasable. Draft editions must not be purchasable.`,
        requiredAction: "Set purchasable=false on the lifecycle record until the edition is published.",
      });
    }

    // Active lifecycle but not purchasable (may be intentional for free editions).
    // This is informational only.
  }

  return blockers;
}

/**
 * Build the operator summary.
 */
function buildOperatorSummary(
  lifecycleRecord: MarketIntelligenceLifecycleRecord | null,
  registryEntry: GmiEditionRegistryEntry | null,
): string {
  const parts: string[] = [];

  if (lifecycleRecord) {
    parts.push(`GMI edition "${lifecycleRecord.id}" — lifecycle: ${lifecycleRecord.lifecycleState}.`);
    parts.push(`Public visible: ${lifecycleRecord.publicVisible}, purchasable: ${lifecycleRecord.purchasable}.`);
    const current = getCurrentPublishedMarketIntelligenceReport();
    const upcoming = getUpcomingMarketIntelligenceReport();
    if (current?.id === lifecycleRecord.id) parts.push("This is the current published issue.");
    if (upcoming?.id === lifecycleRecord.id) parts.push("This is the forthcoming issue (release candidate).");
  } else {
    parts.push("GMI edition — no lifecycle record found.");
  }

  if (registryEntry) {
    parts.push(`Registry: status="${registryEntry.status}", current=${registryEntry.current}, hiddenFromPricing=${registryEntry.hiddenFromPricing}.`);
    if (registryEntry.current && lifecycleRecord && lifecycleRecord.lifecycleState !== "ACTIVE" && lifecycleRecord.lifecycleState !== "ACTIVE_UNTIL_SUPERSEDED") {
      parts.push("⚠ Registry current=true is admin focus only — NOT publication truth.");
    }
  }

  return parts.join(" ");
}

/**
 * Build the user-visible summary.
 */
function buildUserSummary(
  lifecycleRecord: MarketIntelligenceLifecycleRecord | null,
): string {
  if (!lifecycleRecord) return "A GMI report is listed but no details are available.";
  const current = getCurrentPublishedMarketIntelligenceReport();
  const upcoming = getUpcomingMarketIntelligenceReport();

  if (current?.id === lifecycleRecord.id) {
    return `${lifecycleRecord.title} — the current published market intelligence report. ${lifecycleRecord.freshnessNote}`;
  }
  if (upcoming?.id === lifecycleRecord.id) {
    return `${lifecycleRecord.title} — forthcoming. ${lifecycleRecord.freshnessNote}`;
  }
  if (lifecycleRecord.lifecycleState === "SUPERSEDED" || lifecycleRecord.lifecycleState === "ARCHIVED") {
    return `${lifecycleRecord.title} — archive reference. ${lifecycleRecord.freshnessNote}`;
  }
  return `${lifecycleRecord.title} — ${lifecycleRecord.freshnessNote}`;
}

// ─── Map one GMI edition ──────────────────────────────────────────────────────

function mapOne(
  lifecycleRecord: MarketIntelligenceLifecycleRecord | null,
  registryEntry: GmiEditionRegistryEntry | null,
  input: LivingDomainAdapterInput,
): LivingStateObject {
  const editionId = lifecycleRecord?.id ?? registryEntry?.editionId ?? "unknown";
  const title = lifecycleRecord?.title ?? registryEntry?.title ?? `GMI edition ${editionId}`;
  const stage = lifecycleRecord
    ? lifecycleToStage(lifecycleRecord.lifecycleState)
    : registryEntry
      ? registryStatusToStage(registryEntry.status)
      : "draft_generated";

  const isCurrentPublished = lifecycleRecord
    ? getCurrentPublishedMarketIntelligenceReport()?.id === lifecycleRecord.id
    : false;
  const isUpcoming = lifecycleRecord
    ? getUpcomingMarketIntelligenceReport()?.id === lifecycleRecord.id
    : false;

  const evidenceStatus = deriveGmiEvidence(lifecycleRecord, registryEntry);
  const lifecycleBlockers = detectLifecycleContradictions(lifecycleRecord, registryEntry);

  const id = `gmi-${editionId}`;

  // Determine artefact status.
  let artifactStatus: LivingStateArtifactStatus = "not_required";
  if (lifecycleRecord) {
    if (lifecycleRecord.lifecycleState === "ACTIVE" || lifecycleRecord.lifecycleState === "ACTIVE_UNTIL_SUPERSEDED") {
      artifactStatus = lifecycleRecord.publicHref ? "generated" : "generated";
    } else if (lifecycleRecord.lifecycleState === "DRAFT" || lifecycleRecord.lifecycleState === "SCHEDULED") {
      artifactStatus = "draft";
    } else if (lifecycleRecord.lifecycleState === "SUPERSEDED" || lifecycleRecord.lifecycleState === "ARCHIVED") {
      artifactStatus = "delivered";
    }
  }

  // Build routes.
  const artifactRoutes: string[] = [];
  if (lifecycleRecord?.publicHref) artifactRoutes.push(lifecycleRecord.publicHref);
  if (lifecycleRecord?.institutionalHref) artifactRoutes.push(lifecycleRecord.institutionalHref);

  return {
    id,
    domain: "gmi",
    subjectType: "publication",
    sourceId: editionId,
    productCode: registryEntry?.productCode ?? lifecycleRecord?.id ?? editionId,
    title,
    currentStage: stage,
    statusLabel: lifecycleRecord
      ? `${lifecycleRecord.lifecycleState} — ${lifecycleRecord.coveragePeriod}`
      : registryEntry
        ? `${registryEntry.status} — ${registryEntry.quarter} ${registryEntry.year}`
        : "unknown",
    userVisibleSummary: buildUserSummary(lifecycleRecord),
    operatorSummary: buildOperatorSummary(lifecycleRecord, registryEntry),
    evidence: {
      status: evidenceStatus,
      supportingEvidence: lifecycleRecord
        ? [`Lifecycle authority: ${lifecycleRecord.lifecycleState}`, `Registry status: ${registryEntry?.status ?? "none"}`]
        : [],
      missingEvidence: !lifecycleRecord
        ? ["Lifecycle record for this edition"]
        : [],
      cannotInfer: buildCannotInfer(lifecycleRecord, registryEntry),
    },
    consent: {
      required: false,
      status: "not_required",
      supportingEvidence: [],
      missing: [],
    },
    artifact: {
      required: true,
      status: artifactStatus,
      artifactIds: lifecycleRecord ? [lifecycleRecord.id] : [],
      artifactRoutes,
      missing: artifactStatus === "draft" || (!lifecycleRecord && artifactStatus === "not_required")
        ? ["Published GMI report artefact"]
        : [],
    },
    publication: {
      relevant: true,
      allowed: stage === "published",
      reason: stage === "published"
        ? "Publication is allowed for active editions."
        : `Publication is not allowed — lifecycle state is "${lifecycleRecord?.lifecycleState ?? "unknown"}".`,
      missing: stage !== "published" ? ["Published lifecycle state"] : [],
    },
    blockers: lifecycleBlockers.map((b) => ({
      code: b.code,
      label: b.code === "lifecycle_conflict"
        ? "Lifecycle state conflicts with registry"
        : b.code === "source_of_truth_conflict"
          ? "Sources of truth disagree"
          : b.code === "checkout_permission_conflict"
            ? "Checkout permission conflicts with lifecycle"
            : "GMI issue",
      severity: b.code === "lifecycle_conflict" || b.code === "source_of_truth_conflict"
        ? "blocker"
        : "governed_tension",
      explanation: b.explanation,
      evidence: [
        `editionId=${editionId}`,
        `lifecycleState=${lifecycleRecord?.lifecycleState ?? "none"}`,
        `registryStatus=${registryEntry?.status ?? "none"}`,
        `registryCurrent=${registryEntry?.current ?? false}`,
      ],
      affectedItems: [editionId],
      requiredAction: b.requiredAction,
      actionOwner: "admin",
      canAutomate: false,
    })),
    nextActions: [
      ...(isUpcoming && stage !== "published"
        ? [{
            label: "Prepare for publication",
            description: `This edition (${editionId}) is the forthcoming release. Complete the publication workflow.`,
            owner: "operator" as const,
            actionType: "review_draft" as const,
            safeToAutomate: false,
            requiredEvidence: [] as string[],
          }]
        : []),
      ...(stage === "published" && !isCurrentPublished
        ? [{
            label: "Verify current published designation",
            description: `Edition ${editionId} is published but is not the current published issue. Verify this is intentional.`,
            owner: "admin" as const,
            actionType: "verify_evidence" as const,
            safeToAutomate: false,
            requiredEvidence: [] as string[],
          }]
        : []),
      ...(lifecycleBlockers.length > 0
        ? [{
            label: "Resolve lifecycle contradictions",
            description: `${lifecycleBlockers.length} contradiction(s) between lifecycle and registry must be resolved.`,
            owner: "admin" as const,
            actionType: "repair_case" as const,
            safeToAutomate: false,
            requiredEvidence: [] as string[],
          }]
        : []),
    ],
    memory: {
      recurrenceCount: 1,
      currentStage: stage,
      regressionDetected: false,
      resolvedSinceLastRun: false,
    },
    safeToShowUser: stage === "published" || (stage === "archived" && lifecycleRecord?.archiveVisible === true),
    safeToShowOperator: true,
    safeToAutomate: false,
    sourceOfTruth: [
      "lib/intelligence/market-intelligence-lifecycle.ts",
      "lib/commercial/gmi/gmi-edition-registry.ts",
      "lib/commercial/gmi/gmi-edition-factory.ts",
    ],
    raw: {
      editionId,
      lifecycleState: lifecycleRecord?.lifecycleState ?? null,
      registryStatus: registryEntry?.status ?? null,
      registryCurrent: registryEntry?.current ?? false,
      isCurrentPublished,
      isUpcoming,
      purchasable: lifecycleRecord?.purchasable ?? false,
      publicVisible: lifecycleRecord?.publicVisible ?? false,
    },
  };
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export const gmiAdapter: LivingDomainAdapter = {
  domain: "gmi",
  label: "GMI",
  detect(records) {
    return records.some(
      (record) =>
        typeof record["editionId"] === "string" ||
        typeof record["lifecycleState"] === "string" ||
        typeof record["quarter"] === "string",
    );
  },
  map(input: LivingDomainAdapterInput) {
    // Build a map of registry entries by editionId.
    const registryByEdition = new Map<string, GmiEditionRegistryEntry>();
    for (const entry of GMI_EDITION_REGISTRY) {
      registryByEdition.set(entry.editionId, entry);
    }

    // Generate one LivingStateObject per lifecycle record.
    const objects: LivingStateObject[] = [];

    for (const lifecycleRecord of MARKET_INTELLIGENCE_LIFECYCLE) {
      const registryEntry = registryByEdition.get(lifecycleRecord.id) ?? null;
      objects.push(mapOne(lifecycleRecord, registryEntry, input));
    }

    // Also generate objects for registry entries that have no lifecycle record.
    for (const registryEntry of GMI_EDITION_REGISTRY) {
      if (!registryByEdition.has(registryEntry.editionId)) {
        // Already handled above — skip.
        continue;
      }
      // Check if this registry entry's editionId is in the lifecycle.
      const hasLifecycle = MARKET_INTELLIGENCE_LIFECYCLE.some(
        (lr) => lr.id === registryEntry.editionId,
      );
      if (!hasLifecycle) {
        objects.push(mapOne(null, registryEntry, input));
      }
    }

    return objects;
  },
};

export default gmiAdapter;
