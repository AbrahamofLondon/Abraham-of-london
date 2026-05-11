import * as React from "react";
import type { GetServerSideProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Stripe from "stripe";
import { ArrowRight, CheckSquare, Lock } from "lucide-react";

import Layout from "@/components/Layout";
import CheckoutButton from "@/components/commercial/CheckoutButton";
import { getProductDisplayPrice } from "@/lib/commercial/catalog";
import {
  trackAssetComplete,
  trackAssetOpen,
  trackAssetPurchase,
  trackAssetPurchaseStart,
  trackAssetStarted,
  trackAssetTransition,
  trackExecGateView,
} from "@/lib/analytics/journey-client";
import { resolveCanonicalEntitlement } from "@/lib/commercial/entitlement-authority";
import { ensureEntitlementAfterPayment } from "@/lib/commercial/payment-verification";

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const AMBER = "#F59E0B";
const VOID = "rgb(3 3 5)";

const monoStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const serifStyle: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA — FINAL QA COPY (sellable surfaces)
// ─────────────────────────────────────────────────────────────────────────────

type InstrumentData = {
  slug: string;
  title: string;
  price: string;
  priceNum: number;
  category: string;
  headline: string;
  subline: string;
  ctaLabel: string;
  whenToUse: string[];
  whatItProduces: string[];
  whatChanges: string[];
  whereFits: string[];
  secondaryCta: { label: string; href: string };
  checkoutCode: string;
  outcomeLine: string;
  usedWhenCondition: string;
  timeExpectation: string;
  outcomePromise: string[];
  guidedChecklist: string[];
  completionPrompt: string;
  consequenceIfSkipped: string[];
  transition: {
    state: "LOW_IMPACT" | "STRUCTURAL_CONDITION" | "HIGH_SEVERITY";
    label: string;
    body: string;
    cta: string;
    href: string;
  };
  pdfHref?: string;
};

const INSTRUMENT_DATA: Record<string, InstrumentData> = {
  "decision-exposure-instrument": {
    slug: "decision-exposure-instrument",
    title: "Decision Exposure Instrument",
    price: getProductDisplayPrice("decision_exposure_instrument"),
    priceNum: 29,
    category: "Worksheet",
    headline: "Know the cost before you carry it.",
    subline: "Scores five exposure dimensions against published reference bands, calculates a composite with visible arithmetic, and produces a bounded annual exposure figure.",
    ctaLabel: "Get the instrument",
    whenToUse: [
      "A decision affects revenue or cost materially",
      "Exposure is assumed but not quantified",
      "Risk is discussed but not priced",
      "Timing forces action without clarity",
    ],
    whatItProduces: [
      "Bounded annual exposure figure (\u00a3)",
      "Exposure classification (contained / exposed / critical) with published standards",
      "Probability-weighted downside calculation",
      "Composite score against revenue-band reference table",
      "Required next action with escalation note",
    ],
    whatChanges: [
      "You stop discussing risk in general terms.",
      "You make a decision with cost visibility.",
    ],
    whereFits: [
      "This is part of the decision system.",
      "It clarifies consequence before it is formally priced in Executive Reporting.",
      "If exposure is material, move forward.",
    ],
    secondaryCta: { label: `Executive Reporting \u00b7 ${getProductDisplayPrice("executive_reporting")}`, href: "/diagnostics/executive-reporting" },
    checkoutCode: "decision-exposure-instrument",
    outcomeLine: "Quantifies the cost of being wrong before the market enforces it",
    usedWhenCondition: "Used when financial consequence is unclear",
    timeExpectation: "15 minutes to a decision position",
    outcomePromise: [
      "exposure classification",
      "decision consequence statement",
      "next action",
    ],
    guidedChecklist: [
      "Name the current decision.",
      "Estimate downside if the decision is wrong.",
      "Identify the party carrying the consequence.",
      "Classify exposure as contained, exposed, or critical.",
    ],
    completionPrompt: "Mark complete after classification, consequence, and next action are written.",
    consequenceIfSkipped: [
      "Exposure remains unquantified \u2014 decisions proceed on assumption, not data",
      "Financial risk compounds silently while waiting for consensus confirmation",
      "Escalation lacks grounding \u2014 no concrete figure to anchor the board conversation",
    ],
    transition: {
      state: "STRUCTURAL_CONDITION",
      label: "Condition confirmed. Consequence not yet priced.",
      body: "Use Executive Reporting to price exposure and formalise the recommendation.",
      cta: `Executive Reporting · ${getProductDisplayPrice("executive_reporting")}`,
      href: "/diagnostics/executive-reporting",
    },
    pdfHref: "/api/downloads/instrument-pdf?slug=decision-exposure-instrument",
  },
  "mandate-clarity-framework": {
    slug: "mandate-clarity-framework",
    title: "Mandate Clarity Framework",
    price: getProductDisplayPrice("mandate_clarity_framework"),
    priceNum: 49,
    category: "Framework",
    headline: "Clarity of authority determines the quality of decisions.",
    subline: "Uses a 4-quadrant authority map and 17 forcing questions across four scored blocks to produce a Mandate Clarity Score (0\u2013100) with classification-specific corrective paths.",
    ctaLabel: "Get the framework",
    whenToUse: [
      "Decisions are delayed without clear reason",
      "Multiple stakeholders appear to own the same decision",
      "Escalation paths are unclear",
      "Authority is assumed, not verified",
    ],
    whatItProduces: [
      "4-quadrant authority map (formal / actual / sponsor / contested)",
      "Mandate Clarity Score (0\u2013100) from four scored sub-blocks",
      "Mandate classification (clear / fragmented / delayed / absent)",
      "Friction diagnosis: overlapping, absent, shadow, bottleneck",
      "Classification-specific corrective path with review cadence",
    ],
    whatChanges: [
      "You stop guessing who owns the decision.",
      "You remove hidden authority conflicts before they escalate.",
    ],
    whereFits: [
      "This instrument clarifies structure before escalation.",
      "If authority is misaligned, Executive Reporting formalises the consequence.",
      "If escalation is required, move to Strategy Room.",
    ],
    secondaryCta: { label: `Executive Reporting \u00b7 ${getProductDisplayPrice("executive_reporting")}`, href: "/diagnostics/executive-reporting" },
    checkoutCode: "mandate-clarity-framework",
    outcomeLine: "Defines who decides and where authority is breaking",
    usedWhenCondition: "Used when decision ownership is unclear or contested",
    timeExpectation: "20 minutes to a decision position",
    outcomePromise: [
      "mandate classification",
      "authority clarity",
      "corrective next action",
    ],
    guidedChecklist: [
      "Name the decision domain.",
      "Separate formal owner from actual owner.",
      "Identify shadow authority or duplicate ownership.",
      "Classify mandate as clear, fragmented, absent, or delayed.",
    ],
    completionPrompt: "Mark complete after the authority map and corrective action are stated.",
    consequenceIfSkipped: [
      "Authority gaps persist \u2014 decisions stall or get made by the wrong person",
      "Restructuring proceeds on assumed alignment that does not exist at execution level",
      "Escalation paths remain undocumented \u2014 crisis response becomes improvised",
    ],
    transition: {
      state: "STRUCTURAL_CONDITION",
      label: "Condition confirmed. Consequence not yet priced.",
      body: "Use Executive Reporting to price the cost of authority fragmentation.",
      cta: `Executive Reporting · ${getProductDisplayPrice("executive_reporting")}`,
      href: "/diagnostics/executive-reporting",
    },
    pdfHref: "/api/downloads/instrument-pdf?slug=mandate-clarity-framework",
  },
  "intervention-path-selector": {
    slug: "intervention-path-selector",
    title: "Intervention Path Selector",
    price: getProductDisplayPrice("intervention_path_selector"),
    priceNum: 79,
    category: "Toolkit",
    headline: "When action is required, the wrong move makes it worse.",
    subline: "Scores four intervention paths on three dimensions, resolves conflicts with published tie-breaker rules, and produces an ordered action stack with fallback triggers and a Strategy Room readiness indicator.",
    ctaLabel: "Get the selector",
    whenToUse: [
      "Escalation is being considered",
      "Conditions are deteriorating",
      "Multiple actions are possible, none are clear",
      "Timing matters more than completeness",
    ],
    whatItProduces: [
      "Path comparison matrix (stabilise / restructure / escalate / monitor)",
      "Formal tie-breaker logic when paths score closely",
      "Ordered action stack with resistance, effect, and failure signals",
      "Fallback trigger conditions with timeline",
      "Strategy Room readiness indicator (4-point checklist)",
    ],
    whatChanges: [
      "You stop debating options.",
      "You execute a defined path.",
    ],
    whereFits: [
      "This is the final decision layer before action.",
      "If consequence still needs formal pricing \u2192 Executive Reporting.",
      "If intervention is confirmed \u2192 Strategy Room.",
    ],
    secondaryCta: { label: `Strategy Room \u00b7 ${getProductDisplayPrice("strategy_room")}`, href: "/strategy-room" },
    checkoutCode: "intervention-path-selector",
    outcomeLine: "Selects the intervention path when inaction is no longer viable",
    usedWhenCondition: "Used when action is required but the path is contested",
    timeExpectation: "15\u201325 minutes to a decision position",
    outcomePromise: [
      "intervention classification",
      "ordered action stack",
      "escalation trigger",
    ],
    guidedChecklist: [
      "State the current condition in one sentence.",
      "Select the viable paths: stabilise, restructure, escalate, or monitor.",
      "Score immediate dependency and execution risk.",
      "Choose the dominant path and first action.",
    ],
    completionPrompt: "Mark complete after the path, dependency, and first action are defined.",
    consequenceIfSkipped: [
      "Wrong intervention selected \u2014 stabilisation attempted where restructuring was required",
      "Action delayed while options are debated without scoring framework",
      "Escalation happens reactively instead of through governed criteria",
    ],
    transition: {
      state: "HIGH_SEVERITY",
      label: "Intervention likely required.",
      body: "Move to Strategy Room if the selected path requires governed execution.",
      cta: `Strategy Room · ${getProductDisplayPrice("strategy_room")}`,
      href: "/strategy-room",
    },
    pdfHref: "/api/downloads/instrument-pdf?slug=intervention-path-selector",
  },

  // ═══ TIER 1A — NEW INSTRUMENTS ═══════════════════════════════════════════

  "escalation-readiness-scorecard": {
    slug: "escalation-readiness-scorecard",
    title: "Escalation Readiness Scorecard",
    price: getProductDisplayPrice("escalation_readiness_scorecard"),
    priceNum: 19,
    category: "Instrument",
    headline: "Know whether escalation is earned before you attempt it.",
    subline: "Scores five escalation dimensions to classify whether a decision is ready for executive, strategy, counsel, or retained escalation.",
    ctaLabel: "Get the scorecard",
    whenToUse: ["You suspect escalation is needed but lack evidence", "Stakeholders resist without clear justification", "Counsel or strategy room entry is premature without readiness proof", "A decision has been deferred repeatedly without resolution"],
    whatItProduces: ["Escalation readiness band", "Recommended escalation path", "Blocker identification", "Evidence gap analysis"],
    whatChanges: ["You stop escalating on instinct.", "You present evidence-backed escalation rationale."],
    whereFits: ["Bridges diagnostic evidence into higher-consequence surfaces.", "Qualifies Strategy Room, Counsel, or retained review entry."],
    secondaryCta: { label: "View Decision Instruments", href: "/decision-instruments" },
    checkoutCode: "escalation-readiness-scorecard",
    outcomeLine: "Classifies whether escalation is premature, warranted, or overdue",
    usedWhenCondition: "Used when escalation is considered but evidence is unclear",
    timeExpectation: "6 minutes to escalation classification",
    outcomePromise: ["escalation readiness band", "recommended path", "blocker map"],
    guidedChecklist: ["Assess evidence depth.", "Rate consequence severity.", "Evaluate authority clarity.", "Identify execution blockage.", "Check for recurrence signals."],
    completionPrompt: "Mark complete after escalation readiness and recommended path are classified.",
    consequenceIfSkipped: ["Escalation may be attempted without evidence — reducing credibility", "Premature escalation wastes executive attention", "Overdue escalation allows conditions to worsen"],
    transition: { state: "STRUCTURAL_CONDITION", label: "Escalation readiness classified.", body: "Use Executive Reporting to price the full institutional consequence.", cta: `Executive Reporting`, href: "/diagnostics/executive-reporting" },
  },

  "structural-failure-diagnostic-canvas": {
    slug: "structural-failure-diagnostic-canvas",
    title: "Structural Failure Diagnostic Canvas",
    price: getProductDisplayPrice("structural_failure_diagnostic_canvas"),
    priceNum: 19,
    category: "Instrument",
    headline: "Distinguish structural failure from surface symptoms.",
    subline: "Scores six structural dimensions to identify whether the issue is strategic, operational, authority-based, resource-based, governance-based, or alignment-based.",
    ctaLabel: "Get the canvas",
    whenToUse: ["Problems recur despite repeated fixes", "Root cause is debated but not diagnosed", "Intervention keeps targeting symptoms", "The organisation suspects the issue is structural but cannot prove it"],
    whatItProduces: ["Structural health score", "Failure pattern classification", "Root cause identification", "Intervention priority ranking", "Repair path"],
    whatChanges: ["You stop treating symptoms.", "You identify the structural root cause."],
    whereFits: ["Feeds Intervention Path Selector and Strategy Room.", "Distinguishes fixable issues from structural decay."],
    secondaryCta: { label: "Intervention Path Selector", href: "/decision-instruments/intervention-path-selector" },
    checkoutCode: "structural-failure-diagnostic-canvas",
    outcomeLine: "Identifies whether the issue is structural or symptomatic",
    usedWhenCondition: "Used when problems recur despite intervention",
    timeExpectation: "8 minutes to structural diagnosis",
    outcomePromise: ["failure pattern", "root cause", "repair path"],
    guidedChecklist: ["Rate strategy clarity.", "Assess operational execution.", "Evaluate authority structure.", "Check resource allocation.", "Review governance integrity.", "Assess stakeholder alignment."],
    completionPrompt: "Mark complete after failure pattern and root cause are identified.",
    consequenceIfSkipped: ["Interventions continue targeting symptoms", "Structural decay compounds without detection", "Resources are wasted on surface fixes"],
    transition: { state: "STRUCTURAL_CONDITION", label: "Structural failure pattern identified.", body: "Select the correct intervention path based on the diagnosis.", cta: "Intervention Path Selector", href: "/decision-instruments/intervention-path-selector" },
  },

  "execution-risk-index": {
    slug: "execution-risk-index",
    title: "Execution Risk Index",
    price: getProductDisplayPrice("execution_risk_index"),
    priceNum: 49,
    category: "Instrument",
    headline: "Measure whether the decision survives delivery reality.",
    subline: "Scores eight execution factors to produce a risk index with decay projection, authority gap detection, and vulnerability assessment.",
    ctaLabel: "Get the risk index",
    whenToUse: ["A decision has been approved but execution keeps failing", "Resources are committed but delivery is uncertain", "Authority to execute is unclear", "Prior similar efforts have failed"],
    whatItProduces: ["Execution risk index (0-100)", "Decay projection timeline", "Authority gap detection", "Execution vulnerability assessment", "Weakest factor identification"],
    whatChanges: ["You stop committing resources without execution risk visibility.", "You identify the point where execution will likely fail first."],
    whereFits: ["Feeds Strategy Room and Oversight Brief.", "Complements Intervention Path Selector for execution-phase decisions."],
    secondaryCta: { label: "Strategy Room", href: "/strategy-room" },
    checkoutCode: "execution-risk-index",
    outcomeLine: "Quantifies execution risk before resources are committed",
    usedWhenCondition: "Used when execution is uncertain despite approval",
    timeExpectation: "10 minutes to execution risk classification",
    outcomePromise: ["risk index", "decay projection", "authority gap signal"],
    guidedChecklist: ["Rate owner clarity.", "Assess resource availability.", "Evaluate timeline realism.", "Check dependency management.", "Rate stakeholder buy-in.", "Review prior failure history.", "Assess consequence visibility.", "Check escalation readiness."],
    completionPrompt: "Mark complete after risk index and decay projection are produced.",
    consequenceIfSkipped: ["Resources committed without risk visibility", "Execution fails at predictable points", "Authority gaps surface under pressure"],
    transition: { state: "STRUCTURAL_CONDITION", label: "Execution risk classified.", body: "Enter Strategy Room for governed execution.", cta: "Strategy Room", href: "/strategy-room" },
  },

  "team-alignment-gap-map": {
    slug: "team-alignment-gap-map",
    title: "Decision Alignment Gap Map",
    price: getProductDisplayPrice("team_alignment_gap_map"),
    priceNum: 29,
    category: "Instrument",
    headline: "Expose where decision owners and operators diverge.",
    subline: "Scores six alignment domains for both leader perception and team reality to map where stated agreement breaks down in practice.",
    ctaLabel: "Get the alignment map",
    whenToUse: ["Leaders believe alignment exists but execution suggests otherwise", "Team says they agree but actions diverge", "Priority conflicts surface only during execution", "Communication is frequent but not effective"],
    whatItProduces: ["Decision alignment score", "Gap map by domain", "Misalignment zone identification", "Divergence signal", "Correction priority"],
    whatChanges: ["You stop assuming agreement.", "You identify where perception and reality diverge."],
    whereFits: ["Feeds Mandate Clarity Framework.", "Complements Team Assessment for authority-level decisions."],
    secondaryCta: { label: "Mandate Clarity Framework", href: "/decision-instruments/mandate-clarity-framework" },
    checkoutCode: "team-alignment-gap-map",
    outcomeLine: "Maps the gap between stated agreement and operational reality",
    usedWhenCondition: "Used when alignment is assumed but not tested",
    timeExpectation: "10 minutes to alignment classification",
    outcomePromise: ["alignment score", "gap map", "divergence signal"],
    guidedChecklist: ["Score leader perception per domain.", "Estimate team reality per domain.", "Identify largest gaps.", "Review divergence patterns."],
    completionPrompt: "Mark complete after alignment gaps and correction priorities are identified.",
    consequenceIfSkipped: ["Decisions proceed on assumed agreement", "Misalignment surfaces under execution pressure", "Corrections cost more when discovered late"],
    transition: { state: "STRUCTURAL_CONDITION", label: "Decision alignment classified.", body: "Map mandate clarity to identify authority gaps.", cta: "Mandate Clarity Framework", href: "/decision-instruments/mandate-clarity-framework" },
  },

  "governance-drift-detector": {
    slug: "governance-drift-detector",
    title: "Governance Drift Detector",
    price: getProductDisplayPrice("governance_drift_detector"),
    priceNum: 49,
    category: "Instrument",
    headline: "Detect whether governance is drifting before it breaks.",
    subline: "Scores six governance health dimensions to classify drift pattern, correction priority, and cadence risk.",
    ctaLabel: "Get the drift detector",
    whenToUse: ["Decision cadence has slowed without explanation", "Accountability has become unclear over time", "Escalation is happening less often than it should", "Reviews feel performative rather than substantive"],
    whatItProduces: ["Governance drift score", "Drift pattern classification", "Correction priority ranking", "Cadence risk assessment", "Next review recommendation"],
    whatChanges: ["You detect governance erosion before it becomes visible.", "You address drift before it becomes structural."],
    whereFits: ["Feeds Oversight Command and Portfolio Memory.", "Ideal for quarterly governance health checks."],
    secondaryCta: { label: "Oversight Command", href: "/oversight" },
    checkoutCode: "governance-drift-detector",
    outcomeLine: "Identifies whether governance is holding, drifting, or breaking",
    usedWhenCondition: "Used for quarterly governance health reviews",
    timeExpectation: "12 minutes to drift classification",
    outcomePromise: ["drift band", "drift pattern", "correction priority"],
    guidedChecklist: ["Rate decision cadence.", "Assess review discipline.", "Evaluate escalation behaviour.", "Check accountability clarity.", "Review evidence quality.", "Rate follow-through consistency."],
    completionPrompt: "Mark complete after drift pattern and correction priority are classified.",
    consequenceIfSkipped: ["Governance erosion accumulates undetected", "Reviews become performative", "Accountability gaps widen silently"],
    transition: { state: "STRUCTURAL_CONDITION", label: "Governance drift classified.", body: "Review Oversight Command for retained governance posture.", cta: "Oversight Command", href: "/oversight" },
  },

  "strategic-priority-stack-builder": {
    slug: "strategic-priority-stack-builder",
    title: "Strategic Priority Stack Builder",
    price: getProductDisplayPrice("strategic_priority_stack_builder"),
    priceNum: 79,
    category: "Instrument",
    headline: "Rank competing priorities by governed composite.",
    subline: "Takes up to six competing priorities and ranks them by strategic importance, urgency, resource demand, consequence, and authority clarity — with conflict detection.",
    ctaLabel: "Build your priority stack",
    whenToUse: ["Multiple priorities compete for the same resources", "Sequencing is debated but never resolved", "Everything is urgent but nothing moves", "Leadership says yes to all but resources say no"],
    whatItProduces: ["Governed priority stack", "Priority conflict detection", "Resource pressure band", "Deferred-risk warning", "Sequencing recommendation"],
    whatChanges: ["You stop treating all priorities as equal.", "You present a governed sequencing recommendation."],
    whereFits: ["Feeds Executive Reporting and Board Brief Builder.", "Bridges operational pressure into board-level conversation."],
    secondaryCta: { label: "Board Brief Builder", href: "/decision-instruments/board-brief-builder" },
    checkoutCode: "strategic-priority-stack-builder",
    outcomeLine: "Converts competing priorities into a governed execution sequence",
    usedWhenCondition: "Used when priority conflicts block execution",
    timeExpectation: "15 minutes to governed priority stack",
    outcomePromise: ["priority ranking", "conflict signals", "resource pressure band"],
    guidedChecklist: ["List competing priorities.", "Score each by importance, urgency, resources, consequence, authority.", "Review conflicts.", "Accept or override the governed ranking."],
    completionPrompt: "Mark complete after priority stack and conflict signals are produced.",
    consequenceIfSkipped: ["Resources spread thin across competing demands", "No sequencing discipline — execution drift", "Board receives no governed priority recommendation"],
    transition: { state: "STRUCTURAL_CONDITION", label: "Priority stack built.", body: "Prepare a board-ready brief from the governed stack.", cta: "Board Brief Builder", href: "/decision-instruments/board-brief-builder" },
  },

  "board-brief-builder": {
    slug: "board-brief-builder",
    title: "Board Brief Builder",
    price: getProductDisplayPrice("board_brief_builder"),
    priceNum: 129,
    category: "Premium Instrument",
    headline: "Turn a serious decision into a board-ready brief.",
    subline: "Combines decision statement, strategic context, objection handling, financial exposure, and evidence assessment into a structured board presentation with readiness scoring.",
    ctaLabel: "Build your board brief",
    whenToUse: ["A decision requires board approval", "Objections are anticipated but not prepared for", "Evidence exists but is not structured for presentation", "Financial exposure needs to be positioned, not just stated"],
    whatItProduces: ["Board readiness score", "Decision posture recommendation", "Structured objection handling", "Evidence gap analysis", "Executive summary", "Boardroom readiness signal"],
    whatChanges: ["You stop presenting decisions informally.", "You present governed, structured briefs with objection handling."],
    whereFits: ["The highest-value instrument in the product line.", "Feeds directly into Boardroom archive and Proof Pack."],
    secondaryCta: { label: "Boardroom Archive", href: "/boardroom" },
    checkoutCode: "board-brief-builder",
    outcomeLine: "Produces a board-ready decision brief with structured objection handling",
    usedWhenCondition: "Used when a decision must go to the board",
    timeExpectation: "20 minutes to board-ready brief",
    outcomePromise: ["board readiness score", "decision posture", "objection responses", "evidence gaps"],
    guidedChecklist: ["State the decision.", "Provide strategic context.", "State the recommended decision.", "List known objections.", "Score financial and consequence exposure.", "Assess evidence and authority clarity."],
    completionPrompt: "Mark complete after board brief, objection handling, and readiness score are produced.",
    consequenceIfSkipped: ["Board receives unstructured proposals", "Objections surface unprepared", "Evidence gaps discovered during presentation"],
    transition: { state: "HIGH_SEVERITY", label: "Board brief produced.", body: "View the Boardroom archive to track board-level decisions.", cta: "Boardroom", href: "/boardroom" },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span style={{ ...monoStyle, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
        {children}
      </span>
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ ...monoStyle, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)", marginBottom: "0.75rem" }}>
      {children}
    </div>
  );
}

function FragmentList({ items, color = "rgba(255,255,255,0.52)" }: { items: string[]; color?: string }) {
  return (
    <div className="space-y-1.5" style={{ maxWidth: "60ch" }}>
      {items.map((item) => (
        <div key={item} style={{ ...serifStyle, fontSize: "0.92rem", lineHeight: 1.55, color, paddingLeft: "0.85rem", position: "relative" }}>
          <span style={{ position: "absolute", left: 0, color: `${GOLD}50` }}>&middot;</span>
          {item}
        </div>
      ))}
    </div>
  );
}

function GoldRule() {
  return <div className="h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/25 to-transparent" />;
}

function SoftRule() {
  return <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />;
}

function SystemText({
  children,
  color = "rgba(255,255,255,0.72)",
  size = "13px",
}: {
  children: React.ReactNode;
  color?: string;
  size?: string;
}) {
  return (
    <p style={{
      fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontSize: size,
      lineHeight: 1.55,
      color,
    }}>
      {children}
    </p>
  );
}

function CheckoutPanel({ instrument }: { instrument: InstrumentData }) {
  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("");

  async function startCheckout() {
    if (!email.trim()) {
      setMessage("Email is required to attach access to the instrument.");
      return;
    }

    setBusy(true);
    setMessage("Preparing controlled access...");
    trackAssetPurchaseStart(instrument.slug, instrument.priceNum);

    const response = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        priceCode: instrument.checkoutCode,
        originPath: `/decision-instruments/${instrument.slug}`,
      }),
    });
    const data = await response.json();

    if (data?.url) {
      window.location.href = data.url;
      return;
    }

    setBusy(false);
    setMessage("Instrument access could not be prepared. Please try again.");
  }

  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "rgba(255,255,255,0.025)", padding: "1.25rem", maxWidth: "65ch" }}>
      <div style={{ ...monoStyle, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}AA` }}>
        Confirm access
      </div>
      <SystemText color="rgba(255,255,255,0.70)" size="13px">
        You are acquiring a decision instrument. Immediate use expected.
      </SystemText>

      <div className="mt-5" style={{ border: "1px solid rgba(255,255,255,0.09)", backgroundColor: "rgb(5 6 8)", padding: "1rem" }}>
        <div style={{ ...monoStyle, fontSize: "8px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.82)" }}>
          {instrument.title}
        </div>
        <SystemText>{instrument.outcomeLine}</SystemText>
        <SystemText color="rgba(255,255,255,0.52)" size="12px">{instrument.usedWhenCondition}</SystemText>
        <div style={{ marginTop: "0.75rem", ...monoStyle, fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", color: GOLD }}>
          {instrument.price} · One-time access
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
        <input
          value={email}
          type="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email for access"
          style={{
            border: "1px solid rgba(255,255,255,0.14)",
            backgroundColor: "rgb(3 3 5)",
            padding: "0.72rem 0.85rem",
            color: "rgba(255,255,255,0.86)",
            fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
            fontSize: "13px",
          }}
        />
        <button
          type="button"
          disabled={busy}
          onClick={startCheckout}
          style={{
            border: `1px solid ${AMBER}45`,
            backgroundColor: "transparent",
            padding: "0.72rem 1rem",
            color: AMBER,
            ...monoStyle,
            fontSize: "8px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            opacity: busy ? 0.55 : 1,
          }}
        >
          {busy ? "Confirming" : "Confirm access"}
        </button>
      </div>
      {message && <SystemText color="rgba(255,255,255,0.48)" size="12px">{message}</SystemText>}
    </div>
  );
}

function DeliveryState({
  instrument,
  onOpen,
}: {
  instrument: InstrumentData;
  onOpen: () => void;
}) {
  return (
    <div style={{ border: `1px solid ${GOLD}24`, backgroundColor: `${GOLD}06`, padding: "1.25rem", maxWidth: "65ch" }}>
      <div style={{ ...monoStyle, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}AA` }}>
        Access granted. Instrument ready.
      </div>
      <h2 style={{
        marginTop: "0.8rem",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        fontSize: "1.45rem",
        lineHeight: 1.1,
        color: "rgba(255,255,255,0.92)",
      }}>
        Instrument ready.
      </h2>
      <SystemText>Open and use immediately. This is designed for active decisions.</SystemText>
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onOpen}
          style={{
            border: `1px solid ${AMBER}50`,
            backgroundColor: `${AMBER}10`,
            color: AMBER,
            padding: "0.75rem 1rem",
            ...monoStyle,
            fontSize: "8px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          Open instrument
        </button>
        <Link
          href="/diagnostics/executive-reporting"
          onClick={() => trackExecGateView()}
          style={{
            border: "1px solid rgba(255,255,255,0.14)",
            color: "rgba(255,255,255,0.68)",
            padding: "0.75rem 1rem",
            ...monoStyle,
            fontSize: "8px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
          }}
        >
          View in Executive Reporting context
        </Link>
      </div>
    </div>
  );
}

/**
 * @deprecated LEGACY — no longer rendered for entitled customers.
 * Entitled customers see "Run interactive instrument" CTA → /run.
 * This component is retained only as PDF worksheet fallback reference.
 * The old evidence POST has been removed.
 * All instrument persistence now uses /api/decision-instruments/results.
 */
function _LegacyInstrumentEnvironment({
  instrument,
  onComplete,
}: {
  instrument: InstrumentData;
  onComplete?: () => void;
}) {
  const [opened, setOpened] = React.useState(false);
  const [checked, setChecked] = React.useState<Record<string, boolean>>({});
  const [complete, setComplete] = React.useState(false);
  const completedCount = instrument.guidedChecklist.filter((item) => checked[item]).length;
  const completionReady = completedCount === instrument.guidedChecklist.length;

  React.useEffect(() => {
    if (opened) trackAssetOpen(instrument.slug);
  }, [opened, instrument.slug]);

  function markComplete() {
    setComplete(true);
    trackAssetComplete(instrument.slug, instrument.transition.state);
    onComplete?.();

    // Persist via instrument results API
    fetch("/api/decision-instruments/results", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        instrumentSlug: instrument.slug,
        version: "legacy-checklist",
        result: {
          transitionState: instrument.transition.state,
          checklistItems: instrument.guidedChecklist.length,
          completedAt: new Date().toISOString(),
        },
      }),
    }).catch((err) => { console.error("[instrument-legacy] Result persist failed:", err); });
  }

  const transition = instrument.transition;

  return (
    <div id="instrument-environment" className="py-8" style={{ maxWidth: "65ch" }}>
      {!opened ? (
        <DeliveryState instrument={instrument} onOpen={() => { setOpened(true); trackAssetStarted(instrument.slug); }} />
      ) : (
        <div className="space-y-5">
          <div style={{ border: "1px solid rgba(255,255,255,0.12)", backgroundColor: "rgb(5 6 8)", padding: "1.25rem" }}>
            <h2 style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "1.45rem", color: "rgba(255,255,255,0.94)", margin: 0 }}>
              Start here.
            </h2>
            <div className="mt-4 space-y-2">
              {[
                "Do not read this passively",
                "Complete it in one sitting",
                "Use current decision context only",
              ].map((line) => (
                <div key={line} className="flex gap-3">
                  <CheckSquare style={{ width: "14px", height: "14px", color: `${GOLD}AA`, marginTop: "2px", flexShrink: 0 }} />
                  <SystemText>{line}</SystemText>
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1rem", ...monoStyle, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}AA` }}>
              Time expectation · {instrument.timeExpectation}
            </div>
            <SystemText color="rgba(255,255,255,0.58)" size="12px">
              This input will affect your enforcement trajectory.
            </SystemText>
          </div>

          <div style={{ border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.02)", padding: "1.25rem" }}>
            <div style={{ ...monoStyle, fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.36)" }}>
              At completion, you will have
            </div>
            <div className="mt-3 space-y-2">
              {instrument.outcomePromise.map((item) => (
                <SystemText key={item}>– {item}</SystemText>
              ))}
            </div>
          </div>

          <div style={{ border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgb(4 5 7)", padding: "1.25rem" }}>
            <div style={{ ...monoStyle, fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: `${GOLD}AA` }}>
              Guided checklist
            </div>
            <div className="mt-4 space-y-3">
              {instrument.guidedChecklist.map((item) => (
                <label key={item} className="flex gap-3" style={{ cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={Boolean(checked[item])}
                    onChange={(event) => setChecked((prev) => ({ ...prev, [item]: event.target.checked }))}
                    style={{ marginTop: "3px" }}
                  />
                  <SystemText>{item}</SystemText>
                </label>
              ))}
            </div>
          </div>

          <div style={{ border: `1px solid ${GOLD}22`, backgroundColor: `${GOLD}05`, padding: "1.25rem" }}>
            <SystemText>{instrument.completionPrompt}</SystemText>
            <button
              type="button"
              disabled={!completionReady}
              onClick={markComplete}
              style={{
                marginTop: "1rem",
                border: `1px solid ${completionReady ? AMBER : "rgba(255,255,255,0.16)"}`,
                backgroundColor: completionReady ? `${AMBER}10` : "transparent",
                color: completionReady ? AMBER : "rgba(255,255,255,0.32)",
                padding: "0.7rem 1rem",
                ...monoStyle,
                fontSize: "8px",
                letterSpacing: "0.22em",
                textTransform: "uppercase",
              }}
            >
              Mark as complete
            </button>
          </div>

          {complete && transition.state !== "HIGH_SEVERITY" && (
            <div style={{ border: `1px solid ${GOLD}28`, backgroundColor: "rgb(2 3 5)", padding: "1.25rem" }}>
              <div style={{ ...monoStyle, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}CC` }}>
                This decision now carries consequence
              </div>
              <div className="mt-3 space-y-1.5">
                {instrument.outcomePromise.map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckSquare style={{ width: 10, height: 10, color: "rgba(110,231,183,0.60)", flexShrink: 0 }} />
                    <SystemText color="rgba(255,255,255,0.60)">{item}</SystemText>
                  </div>
                ))}
              </div>
              <Link
                href="/diagnostics/executive-reporting"
                onClick={() => {
                  trackAssetTransition(instrument.slug, transition.state);
                  trackExecGateView();
                }}
                className="mt-4 inline-flex items-center gap-2"
                style={{
                  border: `1px solid ${AMBER}45`,
                  backgroundColor: `${AMBER}08`,
                  color: AMBER,
                  padding: "0.7rem 1rem",
                  ...monoStyle,
                  fontSize: "8px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                Price consequence in Executive Reporting
                <ArrowRight style={{ width: 11, height: 11 }} />
              </Link>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => { trackAssetTransition(instrument.slug, "LOW_IMPACT"); }}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    ...monoStyle,
                    fontSize: "7px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.22)",
                  }}
                >
                  Continue without pricing
                </button>
              </div>
            </div>
          )}

          {complete && transition.state === "HIGH_SEVERITY" && (
            <div style={{ border: "1px solid rgba(252,165,165,0.22)", backgroundColor: "rgb(2 3 5)", padding: "1.25rem" }}>
              <div style={{ ...monoStyle, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(252,165,165,0.80)" }}>
                Action is now required
              </div>
              <div className="mt-3 grid gap-px grid-cols-3" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
                {[
                  { label: "Selected path", value: "Defined" },
                  { label: "Confidence", value: "Scored" },
                  { label: "Failure risk", value: "Assessed" },
                ].map((m) => (
                  <div key={m.label} style={{ backgroundColor: "rgb(4 5 7)", padding: "0.6rem 0.75rem" }}>
                    <div style={{ ...monoStyle, fontSize: "5.5px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>{m.label}</div>
                    <div style={{ ...monoStyle, fontSize: "8px", marginTop: "0.2rem", color: "rgba(252,165,165,0.70)" }}>{m.value}</div>
                  </div>
                ))}
              </div>
              <Link
                href="/strategy-room"
                onClick={() => {
                  trackAssetTransition(instrument.slug, transition.state);
                }}
                className="mt-4 inline-flex items-center gap-2"
                style={{
                  border: "1px solid rgba(252,165,165,0.35)",
                  backgroundColor: "rgba(252,165,165,0.06)",
                  color: "rgba(252,165,165,0.80)",
                  padding: "0.7rem 1rem",
                  ...monoStyle,
                  fontSize: "8px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                }}
              >
                Enter Strategy Room
                <ArrowRight style={{ width: 11, height: 11 }} />
              </Link>
            </div>
          )}

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1rem" }}>
            <SystemText color="rgba(255,255,255,0.46)" size="12px">Part of the governed decision system. This output feeds structured executive analysis.</SystemText>
            <SystemText color="rgba(255,255,255,0.46)" size="12px">This instrument isolates one condition. Do not generalise beyond its scope.</SystemText>
            {instrument.priceNum >= 49 && (
              <SystemText color="rgba(255,255,255,0.58)" size="12px">Output can be used in executive or board discussion.</SystemText>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────

type AccessState = "NO_ACCESS" | "HAS_ACCESS" | "JUST_PURCHASED" | "FIRST_USE_COMPLETE";

type PageProps = {
  instrument: InstrumentData;
  checkoutVerified: boolean;
  accessState: AccessState;
};

export default function InstrumentProductPage({ instrument, checkoutVerified, accessState }: PageProps) {
  const checkoutGranted = checkoutVerified;
  const [firstUseComplete, setFirstUseComplete] = React.useState(accessState === "FIRST_USE_COMPLETE");
  const hasAccess = accessState === "HAS_ACCESS" || accessState === "JUST_PURCHASED" || firstUseComplete;

  React.useEffect(() => {
    if (checkoutGranted) {
      trackAssetPurchase(instrument.slug, instrument.priceNum);
      const timer = window.setTimeout(() => {
        document.getElementById("instrument-environment")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 1200);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [checkoutGranted, instrument.slug, instrument.priceNum]);

  return (
    <Layout
      title={`${instrument.title} | Abraham of London`}
      description={instrument.headline}
      canonicalUrl={`/decision-instruments/${instrument.slug}`}
    >
      <Head>
        <meta name="description" content={instrument.headline} />
      </Head>

      <div style={{ backgroundColor: VOID }}>
        <div className="mx-auto max-w-6xl px-6 lg:px-12">

          {/* ── HERO ── */}
          <div className="py-14 lg:py-20">
            <Eyebrow>Decision Instrument</Eyebrow>

            <h1 style={{
              ...serifStyle,
              marginTop: "1rem",
              fontSize: "clamp(1.8rem, 6vw, 2.8rem)",
              lineHeight: 1.0,
              color: "rgba(255,255,255,0.92)",
              fontStyle: "italic",
              maxWidth: "40ch",
            }}>
              {instrument.headline}
            </h1>

            <p style={{
              ...serifStyle,
              marginTop: "1rem",
              fontSize: "1rem",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.48)",
              maxWidth: "56ch",
            }}>
              {instrument.subline}
            </p>

            <div className="mt-6">
              {hasAccess ? (
                <div style={{ border: `1px solid ${GOLD}24`, backgroundColor: `${GOLD}06`, padding: "1rem", maxWidth: "65ch" }}>
                  <div style={{ ...monoStyle, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}AA` }}>
                    {accessState === "JUST_PURCHASED"
                      ? "Access granted. Instrument ready."
                      : firstUseComplete
                        ? "Access retained. Resume or reopen."
                        : "You have access to this instrument."}
                  </div>
                </div>
              ) : (
                <CheckoutPanel instrument={instrument} />
              )}
            </div>
          </div>

          <SoftRule />

          {/* ── WHEN TO USE ── */}
          <div className="py-10 lg:py-12">
            <SectionLabel>When to use this</SectionLabel>
            <FragmentList items={instrument.whenToUse} />
          </div>

          <SoftRule />

          {/* ── WHAT IT PRODUCES ── */}
          <div className="py-10 lg:py-12">
            <SectionLabel>What this produces</SectionLabel>
            <FragmentList items={instrument.whatItProduces} />
          </div>

          <SoftRule />

          {/* ── WHAT CHANGES AFTER USE ── */}
          <div className="py-10 lg:py-12">
            <SectionLabel>What changes after use</SectionLabel>
            <div className="space-y-2" style={{ maxWidth: "60ch" }}>
              {instrument.whatChanges.map((line) => (
                <p key={line} style={{
                  ...serifStyle,
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                  color: "rgba(255,255,255,0.55)",
                }}>
                  {line}
                </p>
              ))}
            </div>
          </div>

          <SoftRule />

          {/* ── WHAT HAPPENS IF YOU DON'T USE THIS ── */}
          <div className="py-10 lg:py-12" style={{ maxWidth: "60ch" }}>
            <SectionLabel>What happens if you don&apos;t use this</SectionLabel>
            <div className="space-y-1.5">
              {instrument.consequenceIfSkipped.map((line) => (
                <p key={line} style={{ ...serifStyle, fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(252,165,165,0.55)", paddingLeft: "0.75rem", position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, color: "rgba(252,165,165,0.30)" }}>&middot;</span>
                  {line}
                </p>
              ))}
            </div>
          </div>

          <SoftRule />

          {/* ── BUNDLE PRESSURE ── */}
          <div className="py-8" style={{ maxWidth: "60ch" }}>
            <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}04`, padding: "0.85rem 1rem" }}>
              <p style={{ ...serifStyle, fontSize: "0.85rem", lineHeight: 1.55, color: "rgba(255,255,255,0.42)" }}>
                This is one part of the decision. Exposure, authority, and intervention logic must all resolve for the decision to hold.
              </p>
              <CheckoutButton
                productCode="operator_decision_pack"
                originPath={`/decision-instruments/${instrument.slug}`}
                className="mt-2.5 inline-flex items-center gap-2"
                style={{ ...monoStyle, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}90` }}
              >
                Resolve the decision fully &middot; Operator Pack {getProductDisplayPrice("operator_decision_pack")}
                <ArrowRight style={{ width: 9, height: 9 }} />
              </CheckoutButton>
            </div>
          </div>

          <GoldRule />

          {hasAccess ? (
            <div className="py-8" style={{ maxWidth: "60ch" }}>
              <div style={{ border: `1px solid ${GOLD}25`, backgroundColor: `${GOLD}06`, padding: "1.25rem" }}>
                <div style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "0.75rem" }}>
                  Instrument unlocked
                </div>
                <Link
                  href={`/decision-instruments/${instrument.slug}/run`}
                  className="flex items-center justify-between w-full"
                  style={{ padding: "14px 18px", border: `1px solid ${GOLD}50`, backgroundColor: `${GOLD}10`, color: `${GOLD}CC`, fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase" }}
                >
                  Run decision instrument
                  <ArrowRight style={{ width: 11, height: 11 }} />
                </Link>
                {instrument.pdfHref && (
                  <a
                    href={instrument.pdfHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 mt-2"
                    style={{ padding: "8px 18px", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "7px", letterSpacing: "0.15em", textTransform: "uppercase" }}
                  >
                    Download PDF worksheet
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="py-8" style={{ maxWidth: "65ch" }}>
              <div style={{ border: "1px solid rgba(255,255,255,0.10)", backgroundColor: "rgb(5 6 8)", padding: "1.25rem" }}>
                <div style={{ ...monoStyle, fontSize: "8px", letterSpacing: "0.26em", textTransform: "uppercase", color: "rgba(255,255,255,0.36)" }}>
                  Controlled instrument access
                </div>
                <SystemText color="rgba(255,255,255,0.62)">
                  Confirm access above. The first-use environment opens immediately after payment confirmation.
                </SystemText>
                <div className="mt-3 flex items-center gap-2" style={{ ...monoStyle, fontSize: "7.5px", letterSpacing: "0.20em", textTransform: "uppercase", color: `${GOLD}90` }}>
                  <Lock style={{ width: 12, height: 12 }} />
                  Tokenized access · no public PDF route
                </div>
              </div>
            </div>
          )}

          <GoldRule />

          {/* ── WHERE THIS FITS ── */}
          <div className="py-10 lg:py-12">
            <div style={{
              border: `1px solid ${GOLD}18`,
              backgroundColor: `${GOLD}04`,
              padding: "1.25rem 1.5rem",
              maxWidth: "48rem",
            }}>
              <div style={{ ...monoStyle, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "0.65rem" }}>
                Where this fits
              </div>
              <div className="space-y-2" style={{ ...serifStyle, fontSize: "0.92rem", lineHeight: 1.6, color: "rgba(255,255,255,0.45)" }}>
                {instrument.whereFits.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>

              {/* Secondary CTA */}
              <div className="mt-5">
                <Link
                  href={instrument.secondaryCta.href}
                  onClick={() => { if (instrument.secondaryCta.href.includes("executive")) trackExecGateView(); }}
                  className="inline-flex items-center gap-2 transition-all duration-200"
                  style={{
                    padding: "9px 18px",
                    border: `1px solid ${GOLD}30`,
                    backgroundColor: `${GOLD}06`,
                    color: GOLD,
                    ...monoStyle,
                    fontSize: "8px",
                    letterSpacing: "0.20em",
                    textTransform: "uppercase",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = `${GOLD}50`; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${GOLD}30`; }}
                >
                  {instrument.secondaryCta.label}
                  <ArrowRight style={{ width: 10, height: 10 }} />
                </Link>
              </div>
            </div>
          </div>

          {/* ── BACK LINKS ── */}
          <div className="pb-10 flex items-center gap-4">
            <Link
              href="/decision-instruments"
              className="inline-flex items-center gap-2 transition-all hover:underline"
              style={{ ...monoStyle, fontSize: "7.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}
            >
              All instruments
            </Link>
            <span style={{ ...monoStyle, fontSize: "7px", color: "rgba(255,255,255,0.12)" }}>&middot;</span>
            <Link
              href="/"
              className="inline-flex items-center gap-2 transition-all hover:underline"
              style={{ ...monoStyle, fontSize: "7.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SERVER-SIDE ACCESS CHECK
// ─────────────────────────────────────────────────────────────────────────────

async function verifyInstrumentCheckout(
  sessionId: string | string[] | undefined,
  instrument: InstrumentData,
): Promise<{ verified: boolean; email: string | null }> {
  if (!sessionId || Array.isArray(sessionId)) return { verified: false, email: null };
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return { verified: false, email: null };

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-03-31.basil" as any });
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const email =
    String(session.metadata?.email || session.customer_details?.email || "")
      .trim()
      .toLowerCase() || null;

  return {
    verified:
      session.payment_status === "paid" &&
      session.metadata?.priceCode === instrument.checkoutCode &&
      session.metadata?.productCode === instrument.checkoutCode,
    email,
  };
}

export const getServerSideProps: GetServerSideProps<PageProps> = async (ctx) => {
  const slug = String(ctx.params?.slug || "");
  const instrument = INSTRUMENT_DATA[slug];

  if (!instrument) {
    return { notFound: true };
  }

  // 1. Check for checkout return
  const checkoutResult =
    ctx.query.checkout === "success"
      ? await verifyInstrumentCheckout(ctx.query.session_id, instrument).catch(() => ({ verified: false, email: null }))
      : { verified: false, email: null };
  const checkoutVerified = checkoutResult.verified;

  // 2. Extract user identity from cookies (email for entitlement lookup)
  let email: string | null =
    typeof ctx.query.email === "string" ? ctx.query.email.trim().toLowerCase() : checkoutResult.email;
  let userId: string | null = null;
  try {
    const { resolveIdentity } = await import("@/lib/auth/resolve-identity");
    // Build a minimal NextRequest-like object from the SSR context
    const cookieHeader = ctx.req.headers.cookie ?? "";
    const headers = new Headers();
    headers.set("cookie", cookieHeader);
    if (ctx.req.headers.host) headers.set("host", ctx.req.headers.host);
    const fakeReq = new Request(`http://${ctx.req.headers.host ?? "localhost"}${ctx.req.url}`, { headers });
    const identity = await resolveIdentity(fakeReq as any);
    email = identity.email ?? null;
    userId = identity.subjectId ?? null;
  } catch { /* identity resolution is best-effort here */ }

  // 3. If checkout just verified, verify/repair canonical entitlement exactly once
  if (checkoutVerified && typeof ctx.query.session_id === "string" && (email || userId)) {
    try {
      await ensureEntitlementAfterPayment({
        checkoutSessionId: ctx.query.session_id,
        userId,
        email,
        slug: instrument.checkoutCode,
      });
    } catch { /* explicit access falls back to canonical resolver below */ }
  }

  // 4. Resolve canonical entitlement (survives logout, device switch)
  let hasEntitlement = false;
  if (email || userId) {
    try {
      const entitlement = await resolveCanonicalEntitlement({
        userId,
        email,
        slug: instrument.checkoutCode,
      });
      hasEntitlement = entitlement.granted;
    } catch { /* entitlement check is best-effort */ }
  }

  // 5. Determine access state
  let accessState: AccessState = "NO_ACCESS";
  if (checkoutVerified) accessState = "JUST_PURCHASED";
  else if (hasEntitlement) accessState = "HAS_ACCESS";

  return { props: { instrument, checkoutVerified, accessState } };
};
