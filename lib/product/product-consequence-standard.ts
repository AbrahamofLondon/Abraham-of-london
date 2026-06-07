/**
 * lib/product/product-consequence-standard.ts
 *
 * Consequence Standard — the authority gate for product ladder excellence.
 *
 * A product surface is not excellent because it exists.
 * It is excellent when it:
 *   1. Identifies a buyer and their pressure moment precisely
 *   2. Poses a specific testable question
 *   3. Produces a defined, named output artifact
 *   4. Opens or closes a gate in the governed progression
 *   5. Points to one unambiguous next admissible move
 *   6. Shows proof that it is real (audit trail, evidence, hash)
 *   7. Has no commercial confusion (price/entitlement consistent)
 *
 * Usage:
 *   evaluateProductConsequence('decision_pressure_signal')
 *   evaluateAllConsequence() — returns all surfaces with consequence score
 *   getConsequenceFailures() — returns surfaces below threshold
 */

import { PRODUCT_SURFACE_REGISTRY, type ProductSurface } from './product-surface-registry'

// ─── Consequence Dimension Record ─────────────────────────────────────────────

export interface ConsequenceRecord {
  surfaceId: string
  displayName: string

  // The 7 consequence dimensions
  buyerType: string                    // who specifically this is for
  pressureMoment: string               // the situation that triggers this surface
  testQuestion: string                 // the specific question the system asks the buyer
  outputArtifact: string               // what is produced and in what form
  gateCondition: string                // what must be true before entry is allowed
  nextAdmissibleMove: string           // the one unambiguous next step after this surface
  proofOfAuthority: string             // what evidence makes the claim credible

  // Commercial and operational state
  commercialStatus: 'free' | 'paid' | 'contracted' | 'manual_billing' | 'internal_only' | 'inactive'
  exposureStatus: string
  maturityScore: number                // 0–10
  evidenceSource: string               // where the underlying data/evidence comes from
  adminState: string                   // what admin can see/do with this surface
  userState: string                    // what the user sees/receives from this surface
}

// ─── Consequence Evaluation Result ────────────────────────────────────────────

export interface ConsequenceEvaluation {
  surfaceId: string
  displayName: string
  consequenceScore: number             // 0–10; derived from dimension completeness
  missingBuyerSignal: boolean          // buyerType is generic or absent
  missingGate: boolean                 // gateCondition is absent or trivial
  missingOutput: boolean               // outputArtifact is absent or vague
  missingProof: boolean                // proofOfAuthority is absent
  missingNextMove: boolean             // nextAdmissibleMove is absent or generic
  commercialConfusion: boolean         // price/entitlement/exposure inconsistency
  hasCriticalGap: boolean              // any single dimension is FAIL-level
  recommendation: string               // highest-priority action to improve this surface
}

// ─── Canonical Consequence Registry ───────────────────────────────────────────
// Each active public or paid surface must declare all 7 dimensions.

export const CONSEQUENCE_REGISTRY: ConsequenceRecord[] = [

  // ═══ MARKET ACTIVATION ═══════════════════════════════════════════════════

  {
    surfaceId: 'decision_pressure_signal',
    displayName: 'Decision Pressure Signal',
    buyerType: 'An operator carrying one consequential decision who cannot isolate whether the real problem is missing evidence, unclear authority, execution risk, or structural delay.',
    pressureMoment: 'The decision has been discussed but not resolved. Meeting after meeting concludes with the same deferral. The buyer knows something is wrong but cannot name it.',
    testQuestion: 'Where is the real pressure on this decision — is it evidence, authority, timing, or execution — and how severe is each dimension?',
    outputArtifact: 'Pressure band classification (LOW/MODERATE/HIGH/CRITICAL) per dimension, missing evidence signal, authority risk flag, cost/consequence estimate, and one recommended next admissible move.',
    gateCondition: 'No prior state required. Free entry. No authentication. Stateless or persisted depending on route.',
    nextAdmissibleMove: 'If pressure is HIGH/CRITICAL: Boardroom Brief or Executive Reporting. If MODERATE: Decision Exposure Instrument. If LOW: Fast Diagnostic.',
    proofOfAuthority: 'PressureSignalEvent persisted to DB; pressure band derived from scored question responses, not from fixed templates.',
    commercialStatus: 'free',
    exposureStatus: 'controlled_access',
    maturityScore: 6,
    evidenceSource: 'User responses to pressure diagnostic questions; DB-persisted event record',
    adminState: 'Signal events require admin visibility — not yet implemented.',
    userState: 'Buyer sees pressure band, missing evidence flags, authority risk, and next route recommendation.',
  },

  {
    surfaceId: 'fast_diagnostic',
    displayName: 'Fast Diagnostic',
    buyerType: 'A buyer who needs a quick orientation across multiple decision dimensions before committing to a deeper instrument.',
    pressureMoment: 'The buyer is not sure which product applies to their situation. They need a routing diagnostic, not a deep analysis.',
    testQuestion: 'Across evidence sufficiency, ownership clarity, authority, and execution readiness — where does the most significant weakness sit?',
    outputArtifact: 'Weighted gap summary across four dimensions; single recommended entry route into the paid corridor.',
    gateCondition: 'No prior state required. Free entry. Stateless — result is not persisted.',
    nextAdmissibleMove: 'Routes to: Pressure Signal (if pressure is clear), Decision Exposure Instrument (if ownership is the gap), or Boardroom Brief (if evidence is the gap).',
    proofOfAuthority: 'Result is explicitly labelled as non-persistent. Buyer is told where their answer goes (nowhere) and what the next step is.',
    commercialStatus: 'free',
    exposureStatus: 'controlled_access',
    maturityScore: 6,
    evidenceSource: 'User responses; no DB write; stateless label must be shown in UI',
    adminState: 'No admin view — stateless; conversion tracking not yet wired.',
    userState: 'Buyer receives gap summary and next-route CTA. Told explicitly result is not saved.',
  },

  {
    surfaceId: 'quick_decision_health_check',
    displayName: 'Quick Decision Health Check',
    buyerType: 'A buyer with 2 minutes who wants to know whether a decision they are carrying has a structural health problem.',
    pressureMoment: 'The buyer is in a meeting, preparing for one, or has 10 minutes between calls. They want a signal, not a session.',
    testQuestion: 'Is this decision healthy? Does it have an owner, a deadline, sufficient evidence, and clear authority?',
    outputArtifact: '2-minute triage result: health label (HEALTHY / AT_RISK / CRITICAL) across four dimensions. Stateless — result displayed but not saved.',
    gateCondition: 'No prior state required. Free entry. Explicitly labelled: result is not persisted.',
    nextAdmissibleMove: 'If AT_RISK or CRITICAL: Decision Pressure Signal or Decision Exposure Instrument. If HEALTHY: acknowledge and offer next diagnostic.',
    proofOfAuthority: 'Health labels derived from boolean question responses. Speed and simplicity are the value claim — buyer must be told this is a triage, not a diagnosis.',
    commercialStatus: 'free',
    exposureStatus: 'controlled_access',
    maturityScore: 7,
    evidenceSource: 'User responses to 4–6 boolean health questions; stateless',
    adminState: 'No admin view; no conversion tracking.',
    userState: 'Buyer sees health label and specific gap flags. Next-route CTA shown.',
  },

  {
    surfaceId: 'scenario_stress_test',
    displayName: 'Scenario Stress Test',
    buyerType: 'A buyer who has a decision in principle and wants to understand how it behaves under pressure assumptions before committing to execution.',
    pressureMoment: 'The decision has been approved. The buyer is not confident about what happens when conditions deteriorate. They need stress-test logic, not reassurance.',
    testQuestion: 'Under the pressure assumptions provided, does this decision survive — or does it collapse on evidence, authority, execution, or dependency grounds?',
    outputArtifact: 'Scenario stress result: survival verdict per assumption, collapse point identification, and recommended next governance move. Explicitly NOT a market forecast.',
    gateCondition: 'Scenario Explorer feature flag must be false — no live market data, no Bloomberg/Reuters integration, no predictive model. Simulations only.',
    nextAdmissibleMove: 'If decision survives: proceed to Strategy Room. If decision collapses: escalate to Executive Reporting or Boardroom Mode.',
    proofOfAuthority: 'Scenario logic is declared as simulation, not forecast. No live feed. No external market data. All outputs carry "simulation only" label.',
    commercialStatus: 'free',
    exposureStatus: 'controlled_access',
    maturityScore: 6,
    evidenceSource: 'User-provided assumptions; no external data; simulation engine only',
    adminState: 'Feature-flagged (GMI_SCENARIO_EXPLORER_ENABLED=false). Not yet production-live.',
    userState: 'Buyer sees stress result per assumption with explicit simulation label. No forecast claims.',
  },

  {
    surfaceId: 'boardroom_brief_public_entry',
    displayName: 'Boardroom Brief (Public Entry)',
    buyerType: 'A senior executive, founder, or board-facing leader who needs a structured, evidence-based dossier before a consequential board conversation.',
    pressureMoment: 'The board meeting is approaching. The executive has the evidence but not the governed structure. They need a document that survives challenge.',
    testQuestion: 'Does the evidence available justify a board-facing dossier, and can the system structure that evidence into a governed recommendation posture?',
    outputArtifact: 'Paid-gated BoardroomDossier: structured recommendation, evidence chain, risk dimensions, authority analysis, and PDF artifact with SHA-256 hash.',
    gateCondition: 'Requires real paid BoardroomBriefOrder (paymentStatus=paid). assertPaidDeliveryAuthorised() must pass. No fixture, no sample, no synthetic spine.',
    nextAdmissibleMove: 'After dossier delivery: Strategy Room (if execution must follow) or Boardroom Mode (if adversarial challenge preparation is required).',
    proofOfAuthority: 'inputSnapshotHash + artifactHash persisted on every dossier. orderId FK links delivery to paid order. Admin delivery status tracks fulfilment.',
    commercialStatus: 'paid',
    exposureStatus: 'public_limited',
    maturityScore: 8,
    evidenceSource: 'Paid BoardroomBriefOrder → IntelligenceSpine → dossier generation pipeline',
    adminState: 'Admin sees order status, delivery status, dossier hash, orderId link. Full audit trail.',
    userState: 'Buyer receives governed dossier PDF with evidence chain. Confirmation email triggered on delivery.',
  },

  // ═══ OPERATIONAL CORRIDOR ════════════════════════════════════════════════

  {
    surfaceId: 'team_assessment',
    displayName: 'Team Assessment',
    buyerType: 'A team leader, operations director, or executive who suspects their team is not describing the same decision, owner, blocker, or evidence position.',
    pressureMoment: 'The team believes it is aligned. Execution is failing anyway. The gap is not strategy — it is divergence at the respondent level.',
    testQuestion: 'Do team members describe the same decision, owner, authority, blocker, and evidence — or is the divergence itself the primary execution risk?',
    outputArtifact: 'Team alignment map: respondent divergence by dimension, shared-position percentage, primary conflict zone, and recommended next governance move.',
    gateCondition: 'Requires minimum respondent count (typically 3+). Respondents must complete the same session context. Results held until threshold met.',
    nextAdmissibleMove: 'If divergence is HIGH: Enterprise Assessment (to widen scope). If divergence is structural: Executive Reporting (to produce a recommendation). If divergence is recoverable: Strategy Room.',
    proofOfAuthority: 'Respondent session records persisted. Comparison logic run at server side. Result not client-computed. Divergence score derived from actual response variance.',
    commercialStatus: 'paid',
    exposureStatus: 'controlled_access',
    maturityScore: 7,
    evidenceSource: 'CampaignParticipant session records; server-side divergence computation',
    adminState: 'Admin sees campaign state, respondent count, completion rate, and aggregate result.',
    userState: 'Buyer sees divergence map with specific conflict zones. Gets one recommended next move.',
  },

  {
    surfaceId: 'enterprise_assessment',
    displayName: 'Enterprise Assessment',
    buyerType: 'A CFO, COO, or CEO whose decision crosses multiple functions and whose failure mode is dependency collapse, not strategic error.',
    pressureMoment: 'The decision is approved in principle. No one has mapped what must move across which functions and in what order. Execution failure is risk, not incompetence.',
    testQuestion: 'Across financial, operational, client, market, and compliance dimensions — what is the actual dependency load, exposure level, and authority gap for this decision?',
    outputArtifact: 'Enterprise exposure scorecard: dependency map, exposure score per dimension, authority gap analysis, and recommended governance posture.',
    gateCondition: 'Requires organisation scan record or team assessment result. Cannot be entered cold without prior evidence state.',
    nextAdmissibleMove: 'If exposure is HIGH: Executive Reporting. If authority gaps are structural: Boardroom Mode. If dependencies are manageable: Strategy Room.',
    proofOfAuthority: 'Organisation scan record persisted. Exposure scoring derived from declared dependency relationships, not from estimates.',
    commercialStatus: 'paid',
    exposureStatus: 'controlled_access',
    maturityScore: 7,
    evidenceSource: 'Organisation scan record; declared dependency relationships; exposure scoring engine',
    adminState: 'Admin sees organisation record, campaign state, exposure result, and delivery status.',
    userState: 'Buyer receives exposure scorecard and dependency map. Next governance move clearly stated.',
  },

  {
    surfaceId: 'executive_reporting',
    displayName: 'Executive Reporting',
    buyerType: 'A board-facing executive, strategy director, or senior operator who needs their carried evidence turned into board-grade judgement and a defensible recommendation.',
    pressureMoment: 'The evidence exists. The decision is formed. It has not been tested for board survivability. The executive needs a governed document, not an opinion.',
    testQuestion: 'Given the evidence provided, can a board-grade recommendation be constructed that is internally consistent, risk-aware, and governable?',
    outputArtifact: 'Executive Report: recommendation posture, evidence chain, risk dimensions, governance conditions, board challenge readiness score, and PDF artifact with hash.',
    gateCondition: 'Evidence completeness gate must pass before report generation. Minimum evidence threshold enforced. No report on insufficient evidence.',
    nextAdmissibleMove: 'After report delivery: Boardroom Brief (for board-facing dossier) or Boardroom Mode (for adversarial challenge prep). If execution follows: Strategy Room.',
    proofOfAuthority: 'Report run/order persisted. Artifact hash computed. Delivery status tracked. Evidence completeness check logged. Admin sees fulfilment state.',
    commercialStatus: 'paid',
    exposureStatus: 'public_limited',
    maturityScore: 8,
    evidenceSource: 'User-provided evidence record; evidence completeness engine; report generation pipeline',
    adminState: 'Admin sees report order, evidence gate result, artifact hash, delivery status, and customer confirmation.',
    userState: 'Buyer receives report PDF with evidence chain and recommendation posture. Email confirmation on delivery.',
  },

  {
    surfaceId: 'boardroom_mode',
    displayName: 'Boardroom Mode',
    buyerType: 'An executive who is preparing for adversarial board scrutiny and needs to know whether their recommendation, evidence, and governance posture will survive challenge.',
    pressureMoment: 'The presentation is ready. The exec is not sure whether the board will accept it. They need the hardest questions asked before the room does.',
    testQuestion: 'Under adversarial board challenge conditions, does this recommendation survive — or does it collapse on evidence, governance, authority, or financial grounds?',
    outputArtifact: 'Boardroom challenge result: adversarial question set, evidence survival verdict, governance gap flags, and recommended pre-meeting actions.',
    gateCondition: 'Requires prior Executive Report or Boardroom Brief. Cannot be entered without an existing evidence record. Distinct from Boardroom Brief — this is challenge prep, not dossier generation.',
    nextAdmissibleMove: 'If recommendation survives: proceed to board meeting with confidence. If it does not: return to Executive Reporting to strengthen evidence.',
    proofOfAuthority: 'Challenge questions drawn from governed adversarial question bank. Results traceable to specific evidence weaknesses, not generic advice.',
    commercialStatus: 'paid',
    exposureStatus: 'evidence_gated',
    maturityScore: 7,
    evidenceSource: 'Prior Executive Report or Boardroom Brief; adversarial question engine',
    adminState: 'Admin sees challenge session record, evidence survival verdict, and delivery state.',
    userState: 'Buyer sees adversarial questions with specific evidence gap flags. Pre-meeting action list.',
  },

  {
    surfaceId: 'strategy_room',
    displayName: 'Strategy Room',
    buyerType: 'A senior executive or operations director who has an approved decision and needs governed execution — not another planning session.',
    pressureMoment: 'The decision is made. The owner is clear. The execution keeps fragmenting. Each checkpoint ends with drift. The system needs to hold the line.',
    testQuestion: 'Can this decision be broken into governed execution with a named owner, time-bounded checkpoints, blocker logic, and a return brief that verifies outcome?',
    outputArtifact: 'StrategyCase with execution record: owner, checkpoints, blocker log, intervention log, feedback history, return brief trigger, and audit trail.',
    gateCondition: 'Requires a prior decision record (Executive Report, Boardroom Brief, or Enterprise Assessment). Cannot be entered cold — execution must follow evidence.',
    nextAdmissibleMove: 'After each checkpoint: evaluate return brief (if deadline passed). After completion: submit Return Brief. If execution fails: return to Executive Reporting or escalate to Retainer.',
    proofOfAuthority: 'StrategyCase persisted with owner FK. Checkpoint records with completion timestamps. Blocker log with intervention history. Return brief record on deadline.',
    commercialStatus: 'paid',
    exposureStatus: 'public_limited',
    maturityScore: 8,
    evidenceSource: 'StrategyCase DB record; checkpoint completion; blocker log; return brief trigger',
    adminState: 'Admin sees case state, checkpoint status, blocker log, intervention history, and return brief.',
    userState: 'Buyer sees case dashboard with checkpoints, blockers, next actions, and return brief prompt.',
  },

  {
    surfaceId: 'retainer_review_queue',
    displayName: 'Retainer Review Queue',
    buyerType: 'An organisation with durable decision history, recurring risk pattern, and repeated high-stakes decisions that has accumulated enough evidence to warrant ongoing oversight.',
    pressureMoment: 'The organisation has been through multiple decisions using the system. A pattern of risk has emerged. One-off engagements are no longer sufficient.',
    testQuestion: 'Does the accumulated evidence record — runs, dossiers, outcomes, risk triggers — justify ongoing oversight rather than periodic one-off engagements?',
    outputArtifact: 'Readiness evaluation record: dimension scores across 6 criteria, readiness class (NOT_READY/CANDIDATE/REVIEW_READY), and admin review request.',
    gateCondition: 'Readiness evaluation must reach REVIEW_READY. All 6 automated criteria must pass. Admin approval is always required — system cannot auto-activate retainer.',
    nextAdmissibleMove: 'If REVIEW_READY and admin approves: Retainer Oversight activated. If CANDIDATE: continue building evidence record. If NOT_READY: resume individual instruments.',
    proofOfAuthority: 'RetainerReadinessEvaluation persisted with dimension scores. Admin approval required with named approver. Readiness class cannot be self-declared.',
    commercialStatus: 'manual_billing',
    exposureStatus: 'review_gated',
    maturityScore: 7,
    evidenceSource: 'DecisionInstrumentRun records; DecisionOutcomeRecord history; risk trigger log',
    adminState: 'Admin sees readiness evaluation, dimension scores, evidence source IDs, and approval controls.',
    userState: 'Buyer sees readiness class and specific gaps. Cannot request retainer — must be invited after admin review.',
  },

  {
    surfaceId: 'retainer_oversight',
    displayName: 'Retainer Oversight',
    buyerType: 'An organisation that has passed readiness review and been approved for ongoing decision oversight, with a named contract and recurring monthly cycle.',
    pressureMoment: 'The organisation recognises that decision quality decays without a governing infrastructure. They need accountability, not just advice.',
    testQuestion: 'Across each monthly oversight cycle: is decision health stable, deteriorating, or requiring intervention — and what is the evidence for that classification?',
    outputArtifact: 'Monthly OversightReviewCycle artifact: drift score, health classification, intervention log, outcome summary, next cycle date, and client-safe status report.',
    gateCondition: 'RetainerContract must exist. readinessClass must be APPROVED. Admin has opened the contract. No self-serve activation.',
    nextAdmissibleMove: 'Each cycle: produce cycle artifact, log interventions, update client health status. After deterioration: escalate to Executive Reporting or Strategy Room. After pattern: inform Decision Authority Index.',
    proofOfAuthority: 'OversightReviewCycle persisted per contract. Drift score computed per cycle. Intervention log maintained. Client status route exposes safe fields only — no raw drift, no internal notes.',
    commercialStatus: 'contracted',
    exposureStatus: 'dormant',
    maturityScore: 9,
    evidenceSource: 'OversightReviewCycle DB record; intervention log; drift computation; client health scoring',
    adminState: 'Admin sees full cycle record, drift score, intervention log, internal notes, and cycle management controls.',
    userState: 'Client sees health label, last review date, next review date, open interventions count. Never sees drift score or internal notes.',
  },

  // ═══ DECISION INSTRUMENTS ════════════════════════════════════════════════

  {
    surfaceId: 'instrument_decision_exposure',
    displayName: 'Decision Exposure Instrument',
    buyerType: 'An operator who suspects a decision carries hidden exposure across financial, operational, reputational, strategic, or temporal dimensions but has not quantified it.',
    pressureMoment: 'The decision feels risky. Nobody has named where the risk actually sits. The conversation has used the word "exposure" without measuring it.',
    testQuestion: 'Across financial, operational, reputational, strategic, and temporal dimensions — what is the actual exposure, and which dimension is the primary failure vector?',
    outputArtifact: 'Exposure scorecard: per-dimension exposure score, primary failure vector label, risk band (LOW/MODERATE/HIGH/CRITICAL), and recommended next instrument or corridor stage.',
    gateCondition: 'Requires entitlement verification (paid). Requires userId or userEmail — no anonymous runs. Run persisted before computation begins.',
    nextAdmissibleMove: 'If exposure is HIGH/CRITICAL on financial: Boardroom Brief. If operational: Strategy Room. If all dimensions: Executive Reporting.',
    proofOfAuthority: 'DecisionInstrumentRun persisted with status, entitlementVerified=true, scoreJson, artifactHash. No synthetic or fixture input allowed.',
    commercialStatus: 'paid',
    exposureStatus: 'public_active',
    maturityScore: 9,
    evidenceSource: 'User-provided decision context; scoring rubric; DecisionInstrumentRun record',
    adminState: 'Admin sees run record, entitlement state, score, artifact state, and run duration.',
    userState: 'Buyer sees exposure scorecard with primary failure vector and next recommended move.',
  },

  {
    surfaceId: 'instrument_mandate_clarity',
    displayName: 'Mandate Clarity Framework',
    buyerType: 'An executive, director, or decision owner who is uncertain whether they have the authority, scope, and sponsorship to make the decision they are carrying.',
    pressureMoment: 'The decision keeps getting kicked back. Approval was given but something keeps blocking execution. The issue is not strategy — it is mandate.',
    testQuestion: 'Is decision ownership, scope, delegation, accountability, and sponsorship sufficiently clear to move — or is mandate ambiguity the primary execution blocker?',
    outputArtifact: 'Mandate clarity score: ownership, scope, delegation, accountability, and sponsorship each rated CLEAR/PARTIAL/ABSENT. Primary clarity gap and recommended resolution path.',
    gateCondition: 'Paid entitlement required. Run persisted before computation.',
    nextAdmissibleMove: 'If mandate is ABSENT on ownership: return to sponsor. If scope is PARTIAL: Strategy Room to define execution boundaries. If all CLEAR: proceed to Executive Reporting.',
    proofOfAuthority: 'DecisionInstrumentRun persisted. Score derived from declared mandate dimensions, not from estimates.',
    commercialStatus: 'paid',
    exposureStatus: 'public_active',
    maturityScore: 9,
    evidenceSource: 'User-declared mandate dimensions; scoring rubric; run record',
    adminState: 'Admin sees run record, mandate score, artifact state.',
    userState: 'Buyer sees mandate clarity score per dimension with primary gap and next step.',
  },

  // ═══ INTELLIGENCE ════════════════════════════════════════════════════════

  {
    surfaceId: 'gmi_landing',
    displayName: 'GMI Quarterly Intelligence',
    buyerType: 'A board member, CXO, or senior strategist who needs structured quarterly intelligence on global market conditions — not news, not opinion.',
    pressureMoment: 'The next board or strategy conversation will involve market conditions. The executive cannot rely on news aggregation or analyst consensus for board-level claims.',
    testQuestion: 'Given the current quarter\'s evidence signals, what is the authoritative intelligence position on market conditions relevant to this organisation\'s decision horizon?',
    outputArtifact: 'Quarterly GMI Report: verified intelligence signals, source confidence scores, board-pack artefact, falsification record, and release authority audit trail.',
    gateCondition: 'Edition must pass GMI release authority gate: source confidence checked, falsification complete, board-pack generated, no live-feed content.',
    nextAdmissibleMove: 'After consuming GMI edition: use as evidence basis for Executive Reporting, Boardroom Brief, or Boardroom Mode.',
    proofOfAuthority: 'Edition release requires signed release authority. Falsification record shows what was tested and rejected. Source confidence scores published with edition.',
    commercialStatus: 'paid',
    exposureStatus: 'public_limited',
    maturityScore: 8,
    evidenceSource: 'Governed intelligence signals; source confidence engine; falsification engine; board-pack generator',
    adminState: 'Admin sees edition state, release authority record, falsification result, and source confidence scores.',
    userState: 'Subscriber sees quarterly report, board-pack artifact, and source confidence transparency.',
  },

  // ═══ CONTINUITY & SUBSCRIPTION ═══════════════════════════════════════════

  {
    surfaceId: 'professional_subscription',
    displayName: 'Professional Subscription',
    buyerType: 'A senior professional who makes recurring consequential decisions and needs ongoing access to the decision infrastructure, not one-off tool access.',
    pressureMoment: 'The buyer has used a one-off product and recognises that the pressure does not stop at one decision. They need a durable access layer.',
    testQuestion: 'Does this professional\'s decision frequency and complexity justify ongoing infrastructure access versus repeated one-off purchases?',
    outputArtifact: 'Active entitlement set: access to instrument suite, continuity console, return brief history, and professional account memory.',
    gateCondition: 'Requires active Stripe subscription. Entitlement managed via subscription status. Lapses must deactivate instrument access.',
    nextAdmissibleMove: 'Access to full instrument suite. After each decision: Return Brief. After pattern accumulates: Retainer Review eligibility.',
    proofOfAuthority: 'Stripe subscription status linked to entitlement. Entitlement check runs on every instrument run. Access revoked on lapse.',
    commercialStatus: 'paid',
    exposureStatus: 'public_limited',
    maturityScore: 8,
    evidenceSource: 'Stripe subscription; entitlement authority; account record',
    adminState: 'Admin sees subscription status, active entitlements, and access history.',
    userState: 'Buyer sees active subscription, available instruments, account memory, and next renewal date.',
  },

  // ═══ OUTCOME LOOP ════════════════════════════════════════════════════════

  {
    surfaceId: 'return_brief',
    displayName: 'Return Brief',
    buyerType: 'Any buyer who used the system for a decision that has now reached its deadline or conclusion and needs to record what happened.',
    pressureMoment: 'The decision deadline has passed. Something happened. The system needs to know whether the decision succeeded, failed, was deferred, or was mitigated.',
    testQuestion: 'What happened? Was the decision owner correct? Was evidence missing? What changed? What should be carried into the next decision cycle?',
    outputArtifact: 'DecisionOutcomeRecord: outcome class (SUCCESS/MITIGATED/PARTIAL/FAILURE/DEFERRED/UNKNOWN), outcome detail, owner correctness, evidence gaps, carry-forward learning, and memory summary.',
    gateCondition: 'Requires authentication. Run/dossier/case ownership verified before submission. Outcome class must be declared — UNKNOWN is allowed but not silent.',
    nextAdmissibleMove: 'Memory summary surfaces in future diagnostics: "Last time a similar decision appeared, the outcome was X." Outcome accumulation triggers Retainer Review eligibility.',
    proofOfAuthority: 'DecisionOutcomeRecord persisted with submittedByEmail. memorySummary system-generated, not user-provided. Linked to originating run/dossier/case.',
    commercialStatus: 'free',
    exposureStatus: 'evidence_gated',
    maturityScore: 8,
    evidenceSource: 'DecisionOutcomeRecord; linked to DecisionInstrumentRun, BoardroomDossier, or StrategyCase',
    adminState: 'Admin sees outcome record, submitter, outcome class, and memory summary. Can mark as reviewed.',
    userState: 'Buyer submits outcome and receives confirmation. Memory note shown for future diagnostics.',
  },
]

// ─── Lookup ───────────────────────────────────────────────────────────────────

export function getConsequenceRecord(surfaceId: string): ConsequenceRecord | undefined {
  return CONSEQUENCE_REGISTRY.find((r) => r.surfaceId === surfaceId)
}

// ─── Evaluator ────────────────────────────────────────────────────────────────

/**
 * Evaluate the consequence completeness of a single surface.
 * Cross-references the consequence registry with the surface registry.
 */
export function evaluateProductConsequence(surfaceId: string): ConsequenceEvaluation {
  const record = getConsequenceRecord(surfaceId)
  const surface = PRODUCT_SURFACE_REGISTRY.find((s) => s.surfaceId === surfaceId)

  if (!record) {
    return {
      surfaceId,
      displayName: surface?.displayName ?? surfaceId,
      consequenceScore: 0,
      missingBuyerSignal: true,
      missingGate: true,
      missingOutput: true,
      missingProof: true,
      missingNextMove: true,
      commercialConfusion: false,
      hasCriticalGap: true,
      recommendation: `Surface "${surfaceId}" has no consequence record. Declare all 7 consequence dimensions.`,
    }
  }

  // Score each dimension
  const missingBuyerSignal = !record.buyerType || record.buyerType.length < 30
  const missingGate = !record.gateCondition || record.gateCondition.length < 20
  const missingOutput = !record.outputArtifact || record.outputArtifact.length < 20
  const missingProof = !record.proofOfAuthority || record.proofOfAuthority.length < 20
  const missingNextMove = !record.nextAdmissibleMove || record.nextAdmissibleMove.length < 20

  // Commercial confusion: paid surface with no entitlementSlug, or free surface with stripePriceId
  const commercialConfusion =
    (record.commercialStatus === 'paid' && surface !== undefined && !surface.entitlementSlug && surface.acceptsPayment) ||
    (record.commercialStatus === 'free' && surface !== undefined && surface.stripePriceId !== null)

  const gaps = [missingBuyerSignal, missingGate, missingOutput, missingProof, missingNextMove, commercialConfusion]
  const gapCount = gaps.filter(Boolean).length
  const hasCriticalGap = gapCount > 0

  // Consequence score: 10 minus penalties
  const baseScore = record.maturityScore
  const penalty = gapCount * 0.5
  const consequenceScore = Math.max(0, Math.min(10, baseScore - penalty))

  // Recommendation: highest priority gap
  const recommendation = buildRecommendation(record, {
    missingBuyerSignal,
    missingGate,
    missingOutput,
    missingProof,
    missingNextMove,
    commercialConfusion,
  })

  return {
    surfaceId,
    displayName: record.displayName,
    consequenceScore: Number(consequenceScore.toFixed(1)),
    missingBuyerSignal,
    missingGate,
    missingOutput,
    missingProof,
    missingNextMove,
    commercialConfusion,
    hasCriticalGap,
    recommendation,
  }
}

function buildRecommendation(
  record: ConsequenceRecord,
  gaps: {
    missingBuyerSignal: boolean
    missingGate: boolean
    missingOutput: boolean
    missingProof: boolean
    missingNextMove: boolean
    commercialConfusion: boolean
  },
): string {
  if (gaps.missingOutput) return `[${record.surfaceId}] Define the output artifact — what does the buyer receive, in what form, with what proof?`
  if (gaps.missingGate) return `[${record.surfaceId}] Define the gate condition — what must be true before the buyer can enter this surface?`
  if (gaps.missingNextMove) return `[${record.surfaceId}] Define the next admissible move — one specific, unambiguous next step.`
  if (gaps.missingProof) return `[${record.surfaceId}] Define proof of authority — what evidence shows this surface is real and not synthetic?`
  if (gaps.missingBuyerSignal) return `[${record.surfaceId}] Clarify the buyer type — who specifically, and what situation are they in?`
  if (gaps.commercialConfusion) return `[${record.surfaceId}] Resolve commercial confusion — entitlement slug or price inconsistency between registry and catalog.`
  return `[${record.surfaceId}] No critical gaps. Next: increase maturity score (currently ${record.maturityScore}/10).`
}

// ─── Estate-wide evaluation ───────────────────────────────────────────────────

export function evaluateAllConsequence(): ConsequenceEvaluation[] {
  // Evaluate surfaces in consequence registry
  const registeredEvals = CONSEQUENCE_REGISTRY.map((r) => evaluateProductConsequence(r.surfaceId))

  // Flag surfaces in surface registry that have NO consequence record
  const registeredIds = new Set(CONSEQUENCE_REGISTRY.map((r) => r.surfaceId))
  const unregistered = PRODUCT_SURFACE_REGISTRY
    .filter((s) => !registeredIds.has(s.surfaceId))
    .filter((s) => s.currentExposureStatus !== 'retired' && s.currentExposureStatus !== 'hidden')
    .map((s): ConsequenceEvaluation => ({
      surfaceId: s.surfaceId,
      displayName: s.displayName,
      consequenceScore: 0,
      missingBuyerSignal: true,
      missingGate: true,
      missingOutput: true,
      missingProof: true,
      missingNextMove: true,
      commercialConfusion: false,
      hasCriticalGap: true,
      recommendation: `Surface "${s.surfaceId}" has no consequence record. Declare all 7 dimensions.`,
    }))

  return [...registeredEvals, ...unregistered].sort((a, b) => a.consequenceScore - b.consequenceScore)
}

export function getConsequenceFailures(threshold = 7): ConsequenceEvaluation[] {
  return evaluateAllConsequence().filter((e) => e.consequenceScore < threshold)
}

export function getConsequencePassers(threshold = 8): ConsequenceEvaluation[] {
  return evaluateAllConsequence().filter((e) => e.consequenceScore >= threshold)
}

// ─── Summary ──────────────────────────────────────────────────────────────────

export interface ConsequenceSummary {
  totalEvaluated: number
  passing: number               // score >= 8
  failing: number               // score < 7
  averageScore: number
  surfacesWithoutRecord: number
  highestPriorityRecommendation: string
}

export function getConsequenceSummary(): ConsequenceSummary {
  const all = evaluateAllConsequence()
  const passing = all.filter((e) => e.consequenceScore >= 8).length
  const failing = all.filter((e) => e.consequenceScore < 7).length
  const averageScore = all.length > 0
    ? Number((all.reduce((s, e) => s + e.consequenceScore, 0) / all.length).toFixed(1))
    : 0
  const surfacesWithoutRecord = all.filter((e) => e.consequenceScore === 0 && e.missingBuyerSignal && e.missingOutput).length
  const highestPriority = all.find((e) => e.hasCriticalGap)?.recommendation ?? 'No critical gaps.'

  return {
    totalEvaluated: all.length,
    passing,
    failing,
    averageScore,
    surfacesWithoutRecord,
    highestPriorityRecommendation: highestPriority,
  }
}
