import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import {
  evaluateValueReadinessGate,
} from "@/lib/product/value-readiness-gate";
import {
  checkFulfilmentTransitionEvidence,
} from "@/lib/product/fulfilment-evidence-gates";
import { getProductValueContract } from "@/lib/product/product-value-contracts";
import { assessProductIntake } from "@/lib/product/product-intake-requirements";

const productCode = "boardroom_brief";
const artifactId = "PROOF-BOARDROOM-BRIEF-001";

const intake = {
  decision_or_issue:
    "Whether to approve a 90-day accelerated rollout of an enterprise onboarding platform before legal review and customer operations are fully aligned.",
  commercial_context:
    "The customer is a B2B software company with a strategic account pipeline worth GBP 1.8m in annual contract value. Sales wants the rollout live this quarter to protect expansion momentum.",
  current_constraint:
    "Legal has not signed off the data-processing variation, customer operations has not trained the implementation team, and finance is concerned about support-cost exposure if onboarding defects rise.",
  desired_outcome:
    "Make a board-defensible go / hold / staged-release decision that protects the pipeline without creating avoidable contractual or operational exposure.",
  available_evidence:
    "Pipeline forecast, legal redline log, customer operations capacity estimate, implementation defect history, CFO support-cost sensitivity, and customer deadline pressure.",
  urgency_or_deadline:
    "Board pack closes in 72 hours. The strategic account expects a confirmed rollout position within seven days.",
  stakeholders:
    "CEO, CFO, General Counsel, VP Sales, Head of Customer Operations, implementation leads, and two strategic account sponsors.",
  options_considered:
    "Approve full rollout now, delay until legal sign-off, or approve a restricted staged release with named conditions.",
  previous_attempts:
    "The team tried to resolve the issue through a standard launch checklist, but ownership split between Sales, Legal, and Customer Operations left the final authority unclear.",
  consequence_of_delay:
    "A full delay may weaken strategic-account confidence and push expansion revenue into the next quarter. Premature approval may create contractual exposure and service failure.",
  definition_of_success:
    "The board can defend the chosen route, name the release authority, define non-negotiable conditions, and start execution with a 72-hour control sequence.",
};

function generateBoardroomBriefArtifact(input: typeof intake): string {
  return `# Boardroom Brief: Enterprise Onboarding Rollout

## Input Basis
The customer input basis is a live decision about ${input.decision_or_issue}

The evidence base provided includes: ${input.available_evidence}

The commercial context is specific: ${input.commercial_context} The immediate deadline is: ${input.urgency_or_deadline}

## Problem Definition
The problem is not whether the organisation wants growth. The problem is whether the board can approve a rollout when authority, legal exposure, and operating readiness are not yet aligned. The current constraint is: ${input.current_constraint}

## Diagnosis
The diagnosis is an authority-and-sequencing failure. Sales is treating the opportunity as a revenue protection decision. Legal is treating it as a contractual exposure decision. Customer Operations is treating it as a delivery capacity decision. The board is being asked to decide before those three realities have been converted into one accountable release condition.

## Evidence Interpretation
The evidence means the rollout is commercially attractive but not yet approval-ready as a full release. The pipeline forecast indicates upside, but the legal redline log and operations capacity estimate suggest the uncontrolled path carries execution risk. Because the implementation defect history and CFO support-cost sensitivity both point to downstream burden, a simple yes/no recommendation would hide the real dependency map.

## Commercial Consequence
The commercial consequence has two sides. If the board delays everything, expansion value may move out of quarter and customer confidence may weaken. If the board approves the full rollout without conditions, the organisation may protect near-term revenue while creating avoidable service defects, support-cost leakage, and legal exposure. The value protected by a governed staged decision is the ability to keep the account warm without pretending unresolved risk has disappeared.

## Options
Option 1: approve full rollout now. This maximises speed but transfers unresolved legal and delivery risk into execution.

Option 2: delay until every open item is complete. This protects control quality but may damage the account relationship and the quarter's commercial position.

Option 3: approve a restricted staged release. This path allows limited progress only for accounts that meet legal, operational, and support-readiness conditions.

## Recommendation
The recommended next move is Option 3: approve a restricted staged release with explicit board conditions. The decision should state that no full rollout is authorised until General Counsel confirms the data-processing variation, Customer Operations confirms named implementation capacity, and Finance signs off the support-cost tolerance.

## Falsification / Challenge
This recommendation would be wrong if Legal confirms there is no material contractual exposure, Customer Operations shows trained capacity for the full release, and Finance accepts the support-cost sensitivity in writing before the board pack closes. The challenge question for the CEO is: who has authority to stop the rollout if one condition fails after approval?

## Risk and Dependency Map
Primary risk: contractual exposure from an incomplete data-processing variation. Dependency: General Counsel sign-off.

Execution risk: implementation defects under deadline pressure. Dependency: trained Customer Operations capacity.

Commercial risk: strategic-account confidence weakens if the customer sees indecision. Dependency: VP Sales message discipline and sponsor communication.

Governance risk: no named release authority. Dependency: board minutes must name the release owner and stop authority.

## Execution Sequence
Step 1, first 24 hours: CEO names a single release authority and asks Legal, Finance, and Customer Operations for written pass/fail conditions.

Step 2, by 48 hours: board pack includes the three decision paths, condition owners, and the commercial consequence of delay versus premature approval.

Step 3, by 72 hours: approve only the restricted staged release if all minimum conditions are evidenced. If any condition is missing, record a hold decision with the exact remediation owner.

Step 4, within seven days: send the strategic account a controlled implementation position that protects confidence without promising an ungoverned full rollout.

## Customer-Specific Value Claim
For this customer case, the decision value is not another launch opinion. The commercial value claim is protection of the GBP 1.8m pipeline while reducing avoidable legal, support-cost, and execution failure exposure.`;
}

const metadataShell = JSON.stringify({
  artifactId: "OLD-METADATA-SHELL-001",
  productCode,
  status: "READY",
  deliveryStatus: "PENDING",
  artifactHash: "abc123",
  adminPreviewUrl: "/admin/preview/old",
  customerAccessUrl: null,
}, null, 2);

const artifact = generateBoardroomBriefArtifact(intake);
const contract = getProductValueContract(productCode);
const intakeAssessment = assessProductIntake(productCode, intake, contract);

const beforeGate = evaluateValueReadinessGate("approval", {
  productCode,
  artifactId: "OLD-METADATA-SHELL-001",
  inspectedContentSource: "generated_artifact",
  content: metadataShell,
  hasInputSnapshot: false,
  evidenceRefCount: 0,
  contract,
});

const afterApprovalGate = evaluateValueReadinessGate("approval", {
  productCode,
  artifactId,
  inspectedContentSource: "generated_artifact",
  content: artifact,
  hasInputSnapshot: true,
  evidenceRefCount: 6,
  contract,
});

const afterDeliveryGate = evaluateValueReadinessGate("delivery", {
  productCode,
  artifactId,
  inspectedContentSource: "generated_artifact",
  content: artifact,
  hasInputSnapshot: true,
  evidenceRefCount: 6,
  contract,
});

const accessBeforeValueApproval = checkFulfilmentTransitionEvidence({
  productCode,
  deliveryClass: "manual_review_required",
  fromState: "approved_for_delivery",
  toState: "customer_access_created",
  evidence: {
    paymentConfirmed: true,
    entitlementId: "entitlement-proof-001",
    artifactId,
    artifactStatus: "READY",
    operatorApproved: true,
    accessLinkCreated: true,
    deliveredAt: null,
    webhookEventId: "webhook-proof-001",
    valueReadinessPassed: false,
    valueInspectionId: null,
  },
});

const accessAfterValueApproval = checkFulfilmentTransitionEvidence({
  productCode,
  deliveryClass: "manual_review_required",
  fromState: "approved_for_delivery",
  toState: "customer_access_created",
  evidence: {
    paymentConfirmed: true,
    entitlementId: "entitlement-proof-001",
    artifactId,
    artifactStatus: "READY",
    operatorApproved: true,
    accessLinkCreated: true,
    deliveredAt: null,
    webhookEventId: "webhook-proof-001",
    valueReadinessPassed: afterApprovalGate.allowed,
    valueInspectionId: artifactId,
  },
});

const report = {
  generatedAt: new Date().toISOString(),
  gateResult: beforeGate.allowed === false &&
    afterApprovalGate.allowed === true &&
    afterDeliveryGate.allowed === true &&
    accessBeforeValueApproval.allowed === false &&
    accessAfterValueApproval.allowed === true
      ? "PASSED"
      : "FAILED",
  productTested: productCode,
  intakeSupplied: intake,
  intakeAssessment,
  artifactGenerated: artifact,
  requiredSectionsConfirmed: [
    "input basis",
    "problem definition",
    "diagnosis",
    "evidence interpretation",
    "commercial consequence",
    "options",
    "recommendation",
    "falsification/challenge",
    "risk/dependency map",
    "execution sequence",
  ],
  before: {
    label: "old metadata shell",
    valueScore: beforeGate.valueScore,
    approvalAllowed: beforeGate.approvalAllowed,
    deliveryAllowed: beforeGate.deliveryAllowed,
    missingSections: beforeGate.missingCriticalSections,
    blockingReasons: beforeGate.blockingReasons,
  },
  after: {
    label: "generated value-bearing artifact",
    valueScore: afterApprovalGate.valueScore,
    approvalAllowed: afterApprovalGate.approvalAllowed,
    deliveryAllowed: afterDeliveryGate.deliveryAllowed,
    missingSections: afterApprovalGate.missingCriticalSections,
    blockingReasons: afterApprovalGate.blockingReasons,
  },
  approvalResult: {
    weakArtifactApprovalAllowed: beforeGate.allowed,
    generatedArtifactApprovalAllowed: afterApprovalGate.allowed,
  },
  deliveryReadinessResult: {
    generatedArtifactDeliveryAllowed: afterDeliveryGate.allowed,
    customerAccessBeforeValueApproval: accessBeforeValueApproval,
    customerAccessAfterValueApproval: accessAfterValueApproval,
  },
};

const reportsDir = resolve(process.cwd(), "reports");
mkdirSync(reportsDir, { recursive: true });
writeFileSync(resolve(reportsDir, "premium-artefact-generation-proof.json"), `${JSON.stringify(report, null, 2)}\n`);
writeFileSync(resolve(reportsDir, "premium-artefact-generation-proof.md"), renderMarkdown(report));

console.log("PREMIUM ARTEFACT GENERATION PROOF");
console.log(`Gate result: ${report.gateResult}`);
console.log(`Product tested: ${productCode}`);
console.log(`Before score: ${beforeGate.valueScore}`);
console.log(`After score: ${afterApprovalGate.valueScore}`);
console.log(`Missing sections: ${afterApprovalGate.missingCriticalSections.join(", ") || "none"}`);
console.log(`Approval allowed after value threshold: ${afterApprovalGate.allowed}`);
console.log(`Customer access before value approval: ${accessBeforeValueApproval.allowed}`);
console.log(`Customer access after value approval: ${accessAfterValueApproval.allowed}`);

if (report.gateResult !== "PASSED") process.exitCode = 1;

function renderMarkdown(data: typeof report): string {
  return `# Premium Artefact Generation Proof

## Gate Result

${data.gateResult}

## Product Tested

${data.productTested}

## Intake Supplied

${Object.entries(data.intakeSupplied).map(([key, value]) => `- ${key}: ${value}`).join("\n")}

## Artefact Generated

${data.artifactGenerated}

## Before / After

| State | Value score | Approval allowed | Delivery allowed | Missing sections |
| --- | ---: | --- | --- | --- |
| Old metadata shell | ${data.before.valueScore} | ${data.before.approvalAllowed} | ${data.before.deliveryAllowed} | ${data.before.missingSections.join(", ") || "none"} |
| Generated artifact | ${data.after.valueScore} | ${data.after.approvalAllowed} | ${data.after.deliveryAllowed} | ${data.after.missingSections.join(", ") || "none"} |

## Approval Result

- Weak artifact approval allowed: ${data.approvalResult.weakArtifactApprovalAllowed}
- Generated artifact approval allowed: ${data.approvalResult.generatedArtifactApprovalAllowed}

## Delivery Readiness Result

- Generated artifact delivery allowed: ${data.deliveryReadinessResult.generatedArtifactDeliveryAllowed}
- Customer access before value approval allowed: ${data.deliveryReadinessResult.customerAccessBeforeValueApproval.allowed}
- Customer access before value approval missing evidence: ${data.deliveryReadinessResult.customerAccessBeforeValueApproval.missingEvidence.join(", ") || "none"}
- Customer access after value approval allowed: ${data.deliveryReadinessResult.customerAccessAfterValueApproval.allowed}

## Final Recommendation

${data.gateResult === "PASSED" ? "GREEN" : "RED"}
`;
}
