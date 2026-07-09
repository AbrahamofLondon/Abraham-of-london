/**
 * scripts/run-living-state-objects.ts
 *
 * Living State Object runner (TS entrypoint, executed via tsx by the governance
 * checker). This is the SINGLE place where the real engine produces the new
 * living-state reports — no logic is duplicated in JS. It is additive: it writes
 * only the new reports and never touches the existing estate-structure outputs.
 *
 * Emits:
 *   reports/living-state-objects.json
 *   reports/living-state-view-model.json
 *   reports/living-state-summary.md
 *   reports/living-state-memory.json   (durable per-object memory)
 *
 * Source of truth for the Boardroom proof case is the real delivery state
 * machine + value-readiness gate; the engine applies the cross-cutting rules.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { boardroomAdapter } from "@/lib/living-intelligence/adapters/boardroom-adapter";
import { assessmentAdapter } from "@/lib/living-intelligence/adapters/assessment-adapter";
import { commercialAdapter } from "@/lib/living-intelligence/adapters/commercial-adapter";
import { fulfilmentAdapter } from "@/lib/living-intelligence/adapters/fulfilment-adapter";
import { gmiAdapter } from "@/lib/living-intelligence/adapters/gmi-adapter";
import { contentAdapter } from "@/lib/living-intelligence/adapters/content-adapter";
import { decisionCentreAdapter } from "@/lib/living-intelligence/adapters/decision-centre-adapter";
import { strategyRoomAdapter } from "@/lib/living-intelligence/adapters/strategy-room-adapter";
import { retainerOversightAdapter } from "@/lib/living-intelligence/adapters/retainer-oversight-adapter";
import { professionalAdapter } from "@/lib/living-intelligence/adapters/professional-adapter";
import { evaluateLivingStateObject } from "@/lib/living-intelligence/living-state-engine";
import {
  applyMemoryToBatch,
  coerceMemoryStore,
  emptyMemoryStore,
} from "@/lib/living-intelligence/living-state-memory";
import { buildLivingStateViewModel } from "@/lib/living-intelligence/living-state-view-model";
import {
  composeLivingStateObjectsPayload,
  composeLivingStateSummaryMarkdown,
} from "@/lib/living-intelligence/living-state-report-composer";
import type { LivingStateObject } from "@/lib/living-intelligence/living-state-object-contract";
import { runFeedbackEngine } from "@/lib/living-intelligence/living-action-feedback-engine";
import { LIVING_ACTION_FEEDBACK_SUMMARY_PATH } from "@/lib/living-intelligence/living-action-feedback-contract";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const REPORTS_DIR = path.join(ROOT, "reports");

function writeJson(rel: string, data: unknown): void {
  const abs = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(data, null, 2), "utf8");
}

function writeText(rel: string, content: string): void {
  const abs = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf8");
}

function readJson(rel: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
  } catch {
    return null;
  }
}

// ─── Real route discovery (Pages + App router) ───────────────────────────────

function discoverRoutes(): string[] {
  const routes = new Set<string>();

  const walk = (dir: string, toRoute: (file: string) => string | null): void => {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        walk(full, toRoute);
      } else {
        const route = toRoute(full);
        if (route) routes.add(route);
      }
    }
  };

  // Pages router: pages/**/*.tsx → route
  const pagesDir = path.join(ROOT, "pages");
  walk(pagesDir, (file) => {
    if (!/\.(tsx|ts|jsx|js)$/.test(file)) return null;
    const rel = path.relative(pagesDir, file).replace(/\\/g, "/");
    if (rel.startsWith("api/")) return null;
    if (/(^|\/)_(app|document|error)\./.test(rel)) return null;
    let route = "/" + rel.replace(/\.(tsx|ts|jsx|js)$/, "");
    route = route.replace(/\/index$/, "");
    return route === "" ? "/" : route;
  });

  // App router: app/**/page.tsx → route (dir path)
  const appDir = path.join(ROOT, "app");
  walk(appDir, (file) => {
    const rel = path.relative(appDir, file).replace(/\\/g, "/");
    if (!/(^|\/)page\.(tsx|ts|jsx|js)$/.test(rel)) return null;
    let route = "/" + rel.replace(/\/page\.(tsx|ts|jsx|js)$/, "").replace(/^page\.(tsx|ts|jsx|js)$/, "");
    // strip route groups (group)
    route = route.replace(/\/\([^)]+\)/g, "");
    return route === "" ? "/" : route;
  });

  return [...routes];
}

// ─── Fulfilment proof records (Phase 5A) ─────────────────────────────────────
//
// These exercise the fulfilment adapter generically across different source
// types and delivery states. They are NOT hardcoded to Boardroom — they test
// paid-without-fulfilment, draft-without-review, delivery-claim-without-artifact,
// and case-study-without-consent scenarios.

function fulfilmentProofRecords(): Record<string, unknown>[] {
  return [
    {
      sourceType: "boardroom_brief_order",
      sourceId: "fulfilment-proof-paid-order",
      productCode: "boardroom_brief",
      deliveryStatus: "paid",
      generationStatus: null,
      proofStatus: null,
      isOverdue: false,
      adminRoute: "/admin/boardroom/orders/fulfilment-proof-paid-order",
      nextAction: "Start review",
    },
    {
      sourceType: "product_artifact",
      sourceId: "fulfilment-proof-draft-artifact",
      productCode: "boardroom_brief",
      deliveryStatus: "draft_generated",
      generationStatus: "DRAFT",
      proofStatus: null,
      isOverdue: false,
      adminRoute: "/admin/artifacts",
      nextAction: "Review draft",
    },
    {
      sourceType: "boardroom_brief_order",
      sourceId: "fulfilment-proof-delivery-claim",
      productCode: "boardroom_brief",
      deliveryStatus: "delivered",
      generationStatus: "PENDING",
      proofStatus: null,
      isOverdue: false,
      adminRoute: "/admin/boardroom/orders/fulfilment-proof-delivery-claim",
      nextAction: "Verify delivery",
    },
    {
      sourceType: "case_study",
      sourceId: "fulfilment-proof-case-study",
      sourceCode: "case_study",
      deliveryStatus: "DRAFT",
      generationStatus: "DRAFT",
      consentStatus: "MISSING",
      proofStatus: null,
      isOverdue: false,
      adminRoute: "/admin/case-studies",
      nextAction: "Review draft and request consent",
    },
  ];
}

// ─── Decision Centre proof records (Phase 5C) ────────────────────────────────

function dcProofRecords(): Record<string, unknown>[] {
  return [
    {
      caseId: "dc-proof-signal-discovery",
      title: "Decision under pressure — signal discovery phase",
      cognitiveState: "SIGNAL_DISCOVERY",
      evidenceTier: "user_reported",
      unresolvedContradictions: 0,
      nextRequiredAction: "Complete a Fast Diagnostic to establish evidence baseline",
      primaryFinding: "A consequential decision is being delayed past the point where delay itself becomes the dominant risk.",
      governanceImplication: "Without a governed next move, exposure compounds while no party owns the decision.",
      strategyRoomActive: false,
      returnBriefTriggered: false,
      counselWarranted: false,
      continuityStatus: "NEW",
      priorOccurrences: 0,
    },
    {
      caseId: "dc-proof-structural-recognition",
      title: "Organisational drift — structural recognition",
      cognitiveState: "STRUCTURAL_RECOGNITION",
      evidenceTier: "single_source",
      unresolvedContradictions: 1,
      nextRequiredAction: "Resolve identified contradiction before advancing",
      primaryFinding: "Multiple stakeholders are operating under different mandates.",
      governanceImplication: "Authority diffusion is preventing structural progress.",
      strategyRoomActive: false,
      returnBriefTriggered: false,
      counselWarranted: false,
      continuityStatus: "REPEATED",
      priorOccurrences: 2,
    },
    {
      caseId: "dc-proof-execution-governance",
      title: "Strategy Room execution — active governance",
      cognitiveState: "EXECUTION_GOVERNANCE",
      evidenceTier: "multi_source",
      unresolvedContradictions: 0,
      nextRequiredAction: "Complete Strategy Room execution and trigger return brief",
      primaryFinding: "Execution path identified but not yet confirmed.",
      governanceImplication: "Strategy Room session is active but return brief has not been triggered.",
      strategyRoomActive: true,
      returnBriefTriggered: false,
      counselWarranted: false,
      continuityStatus: "WORSENING",
      priorOccurrences: 3,
    },
    {
      caseId: "dc-proof-counsel-warranted",
      title: "Founder identity lock — counsel sensitivity",
      cognitiveState: "INTERVENTION_READINESS",
      evidenceTier: "multi_source",
      unresolvedContradictions: 2,
      nextRequiredAction: "Assign operator review for counsel escalation",
      primaryFinding: "Founder identity is operationally embedded.",
      governanceImplication: "Counsel escalation is warranted but no review path exists.",
      strategyRoomActive: false,
      returnBriefTriggered: false,
      counselWarranted: true,
      continuityStatus: "VERIFIED_PATTERN",
      priorOccurrences: 5,
    },
  ];
}

// ─── Retainer Oversight proof records (Phase 5D) ─────────────────────────────

function retainerProofRecords(): Record<string, unknown>[] {
  return [
    {
      accountId: "ro-proof-active-oversight",
      status: "ACTIVE",
      tier: "EXECUTIVE_OVERSIGHT",
      signalCount: 12,
      activeCaseCount: 4,
      hasOversightBrief: true,
      escalationRequired: false,
      unresolvedCommitments: 2,
      retainerEligible: true,
    },
    {
      accountId: "ro-proof-escalation-required",
      status: "ACTIVE",
      tier: "INSTITUTIONAL_COMMAND",
      signalCount: 8,
      activeCaseCount: 3,
      hasOversightBrief: true,
      escalationRequired: true,
      unresolvedCommitments: 5,
      retainerEligible: true,
    },
    {
      accountId: "ro-proof-no-signals",
      status: "QUALIFIED",
      tier: "GOVERNED_CONTINUITY",
      signalCount: 0,
      activeCaseCount: 0,
      hasOversightBrief: false,
      escalationRequired: false,
      unresolvedCommitments: 0,
      retainerEligible: true,
    },
  ];
}

// ─── Professional proof records (Phase 5D) ────────────────────────────────────

function professionalProofRecords(): Record<string, unknown>[] {
  return [
    {
      engagementId: "prof-proof-active-verified",
      status: "active",
      verificationStatus: "verified",
      clientName: "Acme Corp",
      hasClientConsent: true,
      organisationBoundaryEnforced: true,
      canViewRawResponses: false,
      smallSampleSuppressionApplies: true,
      hasStripeMetadata: false,
      isBlocked: false,
    },
    {
      engagementId: "prof-proof-no-consent",
      status: "active",
      verificationStatus: "verified",
      clientName: "Beta Ltd",
      hasClientConsent: false,
      organisationBoundaryEnforced: true,
      canViewRawResponses: false,
      smallSampleSuppressionApplies: true,
      hasStripeMetadata: false,
      isBlocked: false,
    },
    {
      engagementId: "prof-proof-unverified-advisor",
      status: "active",
      verificationStatus: "unverified",
      clientName: "Gamma Inc",
      hasClientConsent: false,
      organisationBoundaryEnforced: false,
      canViewRawResponses: true,
      smallSampleSuppressionApplies: false,
      hasStripeMetadata: true,
      isBlocked: true,
    },
    {
      engagementId: "prof-proof-concluded",
      status: "concluded",
      verificationStatus: "verified",
      clientName: "Delta Group",
      hasClientConsent: true,
      organisationBoundaryEnforced: true,
      canViewRawResponses: false,
      smallSampleSuppressionApplies: true,
      hasStripeMetadata: false,
      isBlocked: false,
    },
  ];
}

// ─── Strategy Room proof records (Phase 5C) ───────────────────────────────────

function srProofRecords(): Record<string, unknown>[] {
  return [
    {
      sessionId: "sr-proof-pending-admission",
      caseId: "dc-proof-signal-discovery",
      admissionStatus: "PENDING",
      executionState: "PENDING",
      evidenceTier: "user_reported",
      decisionStatement: "",
      returnBriefAvailable: false,
      hasExecutionRecord: false,
      signalPressureLocked: false,
      escalationTriggerCount: 0,
      retainerEligible: false,
      artifactCount: 0,
      artifactRoutes: [],
      componentUnderwired: false,
    },
    {
      sessionId: "sr-proof-active-execution",
      caseId: "dc-proof-structural-recognition",
      admissionStatus: "ADMITTED",
      executionState: "ACTIVE",
      evidenceTier: "single_source",
      decisionStatement: "Restructure the decision authority before Q3 planning cycle.",
      returnBriefAvailable: false,
      hasExecutionRecord: true,
      signalPressureLocked: false,
      escalationTriggerCount: 1,
      retainerEligible: false,
      artifactCount: 2,
      artifactRoutes: ["/strategy-room/artifacts/1", "/strategy-room/artifacts/2"],
      componentUnderwired: false,
    },
    {
      sessionId: "sr-proof-signal-locked",
      caseId: "dc-proof-counsel-warranted",
      admissionStatus: "ADMITTED",
      executionState: "STALLED",
      evidenceTier: "insufficient",
      decisionStatement: "Resolve founder identity lock before delegation.",
      returnBriefAvailable: true,
      hasExecutionRecord: false,
      signalPressureLocked: true,
      escalationTriggerCount: 3,
      retainerEligible: true,
      artifactCount: 1,
      artifactRoutes: [],
      componentUnderwired: true,
    },
    {
      sessionId: "sr-proof-completed",
      caseId: "dc-proof-execution-governance",
      admissionStatus: "ADMITTED",
      executionState: "COMPLETED",
      evidenceTier: "multi_source",
      decisionStatement: "Execute the governance restructuring plan.",
      returnBriefAvailable: true,
      hasExecutionRecord: true,
      signalPressureLocked: false,
      escalationTriggerCount: 0,
      retainerEligible: true,
      artifactCount: 3,
      artifactRoutes: ["/strategy-room/artifacts/1", "/strategy-room/artifacts/2", "/strategy-room/artifacts/3"],
      componentUnderwired: true,
    },
  ];
}

// ─── Boardroom proof case (governance self-test, not customer data) ──────────
//
// A realistic Boardroom DRAFT case that must be diagnosed as NOT approvable. It
// makes no positive authority/evidence claim — the opposite: it is mid-pipeline
// with unverified evidence, missing sections, a draft-only artifact, and missing
// publication consent. The engine must therefore block approval/publication.

function boardroomProofRecords(): Record<string, unknown>[] {
  return [
    {
      orderId: "boardroom-proof-draft-case",
      productCode: "boardroom_brief",
      deliveryStatus: "draft_generated",
      artifactStatus: "DRAFT",
      adminPreviewUrl: "",
      customerAccessUrl: "",
      approvalAllowed: false,
      valueScoreOutOf10: 7.2,
      blockingReasons: [
        "Boardroom intake is incomplete.",
        "Missing boardroom section: falsificationChallenge",
        "Missing boardroom section: recommendedNextMove",
      ],
      evidencePosture: "unverified",
      supportingEvidence: [],
      missingEvidence: [
        "Operator verification of the draft brief.",
        "Completed intake for the missing sections.",
      ],
      publicationIntended: true,
      consentStatus: "missing",
    },
  ];
}

// Assessment proof result (governance self-test, not real user data). A session
// preview with a user-reported posture: continuity is promised by doctrine but no
// durable memory exists yet, so the engine must surface assessment_without_memory
// to the operator while keeping the result safe to show the user.
function assessmentProofRecords(): Record<string, unknown>[] {
  return [
    {
      id: "assessment-proof-fast-diagnostic",
      kind: "FAST_DIAGNOSTIC",
      title: "Decision under pressure — proof case",
      band: "WATCH",
      primaryFinding:
        "A consequential decision is being delayed past the point where delay itself becomes the dominant risk.",
      failurePattern: "Avoidance loop: re-gathering information instead of committing to a governed move.",
      evidencePosture: "USER_REPORTED",
      governanceImplication:
        "Without a governed next move, exposure compounds while no party owns the decision.",
      recommendedNextMove: "Commit to the single next governed move and record it.",
      earnedRoute: {
        route: "DECISION_CENTRE",
        label: "Open in Decision Centre",
        href: "/decision-centre",
        reason: "Carry this result forward into a governed case.",
      },
      recordStatus: { level: "SESSION_PREVIEW", label: "Session preview" },
    },
  ];
}

function main(): void {
  const now = new Date().toISOString();
  const availableRoutes = discoverRoutes();

  // Map → evaluate. Each domain has its own adapter; all emit LivingStateObjects.
  const mapped: LivingStateObject[] = [
    ...boardroomAdapter.map({
      domain: "boardroom",
      records: boardroomProofRecords(),
      availableRoutes,
    }),
    ...assessmentAdapter.map({
      domain: "assessment",
      records: assessmentProofRecords(),
      availableRoutes,
    }),
    ...commercialAdapter.map({
      domain: "commercial",
      records: [],
      availableRoutes,
    }),
    ...fulfilmentAdapter.map({
      domain: "fulfilment",
      records: fulfilmentProofRecords(),
      availableRoutes,
    }),
    ...gmiAdapter.map({
      domain: "gmi",
      records: [],
      availableRoutes,
    }),
    ...contentAdapter.map({
      domain: "content",
      records: [],
      availableRoutes,
    }),
    ...decisionCentreAdapter.map({
      domain: "decision_centre",
      records: dcProofRecords(),
      availableRoutes,
    }),
    ...strategyRoomAdapter.map({
      domain: "strategy_room",
      records: srProofRecords(),
      availableRoutes,
    }),
    ...retainerOversightAdapter.map({
      domain: "retainer_oversight",
      records: retainerProofRecords(),
      availableRoutes,
    }),
    ...professionalAdapter.map({
      domain: "professional",
      records: professionalProofRecords(),
      availableRoutes,
    }),
  ];

  const evaluated = mapped.map((object) =>
    evaluateLivingStateObject(object, { availableRoutes }),
  );

  // Durable memory (additive store, separate from living-product-memory.json).
  const priorStore = coerceMemoryStore(readJson("reports/living-state-memory.json") ?? emptyMemoryStore());
  const { objects, store } = applyMemoryToBatch(evaluated, priorStore, now);

  const viewModel = buildLivingStateViewModel(objects, now);

  writeJson("reports/living-state-objects.json", composeLivingStateObjectsPayload(objects, now));
  writeJson("reports/living-state-view-model.json", viewModel);
  writeText("reports/living-state-summary.md", composeLivingStateSummaryMarkdown(viewModel));
  writeJson("reports/living-state-memory.json", store);

  // ── Feedback engine ─────────────────────────────────────────────────────────
  const feedback = runFeedbackEngine(objects);
  writeJson(LIVING_ACTION_FEEDBACK_SUMMARY_PATH, feedback.summary);
  console.log(`living-action-feedback: ${feedback.summary.totalActions} actions, ${feedback.repeated.length} repeated, ${feedback.resolved.length} resolved, ${feedback.regressed.length} regressed`);

  // Console summary for the parent runner.
  const boardroom = objects.find((o) => o.domain === "boardroom");
  const blockerCodes = boardroom ? boardroom.blockers.map((b) => b.code) : [];
  const hardBlocked = boardroom
    ? boardroom.blockers.some((b) => b.severity === "blocker")
    : false;

  console.log(`living-state: ${objects.length} object(s), ${viewModel.estate.blocked} blocked`);
  console.log(`living-state: routes discovered = ${availableRoutes.length}`);
  if (boardroom) {
    console.log(
      `living-state: boardroom proof case "${boardroom.id}" stage=${boardroom.currentStage} approvable=${!hardBlocked} blockers=[${blockerCodes.join(", ")}]`,
    );
  }
  const assessment = objects.find((o) => o.domain === "assessment");
  if (assessment) {
    console.log(
      `living-state: assessment proof "${assessment.id}" stage=${assessment.currentStage} safeToShowUser=${assessment.safeToShowUser} evidence=${assessment.evidence.status} blockers=[${assessment.blockers.map((b) => b.code).join(", ")}]`,
    );
  }
  const commercialObjects = objects.filter((o) => o.domain === "commercial");
  const fulfilmentObjects = objects.filter((o) => o.domain === "fulfilment");
  console.log(`living-state: commercial objects = ${commercialObjects.length} (${commercialObjects.filter((o) => o.blockers.some((b) => b.severity === "blocker")).length} blocked)`);
  console.log(`living-state: fulfilment objects = ${fulfilmentObjects.length} (${fulfilmentObjects.filter((o) => o.blockers.some((b) => b.severity === "blocker")).length} blocked)`);
  const gmiObjects = objects.filter((o) => o.domain === "gmi");
  const contentObjects = objects.filter((o) => o.domain === "content");
  console.log(`living-state: gmi objects = ${gmiObjects.length} (${gmiObjects.filter((o) => o.blockers.some((b) => b.severity === "blocker")).length} blocked)`);
  console.log(`living-state: content objects = ${contentObjects.length} (${contentObjects.filter((o) => o.blockers.some((b) => b.severity === "blocker")).length} blocked)`);
  const dcObjects = objects.filter((o) => o.domain === "decision_centre");
  const srObjects = objects.filter((o) => o.domain === "strategy_room");
  console.log(`living-state: decision_centre objects = ${dcObjects.length} (${dcObjects.filter((o) => o.blockers.some((b) => b.severity === "blocker")).length} blocked)`);
  console.log(`living-state: strategy_room objects = ${srObjects.length} (${srObjects.filter((o) => o.blockers.some((b) => b.severity === "blocker")).length} blocked)`);
  const roObjects = objects.filter((o) => o.domain === "retainer_oversight");
  const profObjects = objects.filter((o) => o.domain === "professional");
  console.log(`living-state: retainer_oversight objects = ${roObjects.length} (${roObjects.filter((o) => o.blockers.some((b) => b.severity === "blocker")).length} blocked)`);
  console.log(`living-state: professional objects = ${profObjects.length} (${profObjects.filter((o) => o.blockers.some((b) => b.severity === "blocker")).length} blocked)`);
  if (!fs.existsSync(path.join(REPORTS_DIR, "living-state-objects.json"))) {
    console.error("living-state: FAILED to write living-state-objects.json");
    process.exit(1);
  }
}

main();
