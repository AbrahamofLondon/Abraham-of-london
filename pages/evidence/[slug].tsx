import * as React from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";

// ─────────────────────────────────────────────────────────────────────────────
// TOKENS
// ─────────────────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const VOID = "rgb(3 3 5)";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

// ─────────────────────────────────────────────────────────────────────────────
// TYPE
// ─────────────────────────────────────────────────────────────────────────────

type Basis = "Observed" | "Anonymised" | "Modelled" | "Inferred";

type TimelineEntry = { marker: string; event: string };

type BoardActions = {
  immediate: string[];
  nearTerm: string[];
  structural: string[];
};

type EvidenceAsset = {
  slug: string;
  dossierSlug: string;
  title: string;
  // 1. Classification
  conditionType: string;
  domain: string;
  confidence: string;
  evidenceBasis: Array<{ label: string; basis: Basis }>;
  decisionRelevance: string;
  // 2. Context
  context: string;
  // 3. Signal register
  primarySignals: string[];
  secondarySignals: string[];
  systemInterpretation: string;
  // 4. System classification
  systemClassification: string;
  reclassification: string;
  // 5. Classification basis
  classificationBasis: string[];
  // 6. Failure pattern
  failurePattern: string;
  // 7. Decision frame
  requiredDecision: string;
  constraints: string[];
  // 8. Timeline
  timeline: TimelineEntry[];
  // 9. Counterfactual
  wrongAction: string;
  resultOfPath: string;
  exposureAnchor?: string;
  // 10. Implications
  implications: string[];
  // 11. Board actions (banded)
  boardActions: BoardActions;
  // 12. Decision consequence
  decisionConsequence: string[];
  // 13. System trace
  systemFeeds: string[];
  principle: string;
  systemLink: { label: string; href: string };
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────

const ASSETS: Record<string, EvidenceAsset> = {
  "tariff-shock-growth-break": {
    slug: "tariff-shock-growth-break",
    dossierSlug: "case-dossier-tariff-shock",
    title: "When Growth Models Broke Under Tariff Shock",
    conditionType: "Structural Inflection",
    domain: "Market Regime / Institutional Positioning",
    confidence: "High",
    evidenceBasis: [
      { label: "Tariff repricing magnitude", basis: "Observed" },
      { label: "Consensus positioning data", basis: "Observed" },
      { label: "Institutional repositioning lag", basis: "Observed" },
      { label: "Exposure compounding estimate", basis: "Modelled" },
    ],
    decisionRelevance: "Portfolio allocation, growth-dependency assumptions, decision-delay cost",
    context: "April 2026. US\u2013China tariff escalation repriced import costs by 15\u201340% across key sectors in under 72 hours.",
    primarySignals: [
      "Growth consensus priced into equity, credit, and forward earnings across Q2 2026",
      "Tariff announcements repriced import costs 15\u201340% in under 72 hours",
      "Institutional positioning calibrated to a growth regime that ceased to exist",
    ],
    secondarySignals: [
      "Credit spreads widened before equity indices corrected",
      "Supply-chain forward contracts repriced before spot markets moved",
      "Consensus analyst revisions lagged observable repricing by 4\u20136 weeks",
    ],
    systemInterpretation: "Regime change, not correction. Growth-model dependency was structural, not cyclical.",
    systemClassification: "STRUCTURAL BREAK",
    reclassification: "Growth \u2192 Survivability",
    classificationBasis: [
      "Tariff repricing magnitude exceeded normal cyclical range (15\u201340% vs typical 2\u20135%)",
      "Repricing speed occurred within 72 hours \u2014 too fast for consensus adjustment",
      "Cross-asset confirmation present: credit, equities, and supply chain moved in sequence",
      "Analyst/consensus lag exceeded market adjustment window by 4\u20136 weeks",
    ],
    failurePattern: "Consensus Anchoring Under Regime Shift",
    requiredDecision: "Reclassify regime from growth to survivability and reallocate accordingly.",
    constraints: [
      "Consensus had not yet moved",
      "Mandate inertia in institutional allocators",
      "Political sensitivity of tariff-driven repositioning",
    ],
    timeline: [
      { marker: "T0", event: "Tariff announcement" },
      { marker: "T+72h", event: "Import cost repricing across key sectors" },
      { marker: "T+2w", event: "Credit spread adjustment; equity correction begins" },
      { marker: "T+4\u20136w", event: "Consensus analyst revisions begin (lagging)" },
      { marker: "T+6w+", event: "Structural drawdown realised for late movers" },
    ],
    wrongAction: "Treating the tariff shock as a temporary dislocation and maintaining growth allocations. Consensus response: wait for reversion.",
    resultOfPath: "Reversion did not come. Structural break compounded for 6 weeks. Estimated additional exposure: 12\u201318% drawdown for late movers.",
    exposureAnchor: "Derived from: delayed reallocation window (6 weeks), sector drawdown differential (growth vs survivability baskets), and concentration assumptions in growth-dependent positions.",
    implications: [
      "Growth assumptions must be stress-tested against trade regime shifts, not macro data alone",
      "Decision delay during structural breaks compounds exposure geometrically",
      "Consensus lag is not caution \u2014 it is unpriced risk",
    ],
    boardActions: {
      immediate: [
        "Mandate regime-break stress test for all growth-dependent allocations",
        "Establish 72-hour tariff-event decision protocol",
      ],
      nearTerm: [
        "Require explicit survivability scenario in quarterly portfolio review",
        "Flag consensus-dependent positioning as a standing risk item",
      ],
      structural: [
        "Commission Executive Reporting to price current exposure under reclassified regime",
        "Build regime-break detection into standing intelligence cadence",
      ],
    },
    decisionConsequence: [
      "Avoidable drawdown: 12\u201318% additional loss for those who waited for consensus confirmation",
      "Forced late reallocation under worse pricing conditions and reduced liquidity",
      "Loss of positioning advantage \u2014 early movers captured survivability premium",
    ],
    systemFeeds: [
      "Executive Reporting \u2014 Financial Exposure / regime-break detection",
      "Decision Exposure Instrument \u2014 Reversibility and concentration risk scoring",
      "Intelligence layer \u2014 Tariff-driven structural repricing signals",
    ],
    principle: "The cost of waiting for consensus to confirm a structural break is the break itself.",
    systemLink: { label: "Executive Reporting", href: "/diagnostics/executive-reporting" },
  },

  "team-alignment-illusion": {
    slug: "team-alignment-illusion",
    dossierSlug: "case-dossier-team-alignment-illusion",
    title: "The Illusion of Team Alignment Under Pressure",
    conditionType: "Hidden Divergence",
    domain: "Team Governance / Execution Coherence",
    confidence: "High",
    evidenceBasis: [
      { label: "Leadership self-assessment (4 domains)", basis: "Observed" },
      { label: "Team respondent scores (n=34)", basis: "Observed" },
      { label: "OKR/reporting gap analysis", basis: "Observed" },
      { label: "Restructuring impact projection", basis: "Inferred" },
    ],
    decisionRelevance: "Restructuring decisions, team investment, governance reporting accuracy",
    context: "Mid-size firm. Leadership reported 85% alignment across 4 domains. Team respondents (n=34) scored 42\u201358%.",
    primarySignals: [
      "Leadership rated alignment at 85% across 4 domains",
      "Team respondents scored 42\u201358% on the same domains",
      "Gap not visible in performance reviews, OKRs, or management reporting",
    ],
    secondarySignals: [
      "Highest divergence in Strategic Alignment domain (85% vs 42%)",
      "Narrowest gap in Operational Velocity (80% vs 58%)",
      "Exit interview data retrospectively consistent with measured divergence",
    ],
    systemInterpretation: "Alignment was assumed at the top and contradicted at the base. Standard governance instruments did not detect the gap.",
    systemClassification: "HIDDEN DIVERGENCE",
    reclassification: "Aligned \u2192 Structurally Fractured",
    classificationBasis: [
      "Leadership confidence was high (85%) across all measured domains",
      "Respondent-derived rankings diverged materially (42\u201358% vs 85%)",
      "Execution allocation did not match stated priorities across multiple teams",
      "Alignment therefore classified as declared, not operational",
    ],
    failurePattern: "Declared Alignment / Absent Execution Alignment",
    requiredDecision: "Halt restructuring. Measure execution-layer alignment before any structural change.",
    constraints: [
      "Restructuring already approved by board",
      "Leadership confidence in alignment reading was high",
      "No prior precedent for overriding leadership self-assessment",
    ],
    timeline: [
      { marker: "T0", event: "Leadership alignment confidence established at 85%" },
      { marker: "T+1w", event: "Assessment respondent evidence gathered (n=34)" },
      { marker: "T+1\u20132w", event: "Divergence pattern visible across all 4 domains" },
      { marker: "T+30d", event: "Execution coordination cost compounds if untreated" },
      { marker: "T+90d", event: "Projected dissonance increase to 50\u201365 points if restructured" },
    ],
    wrongAction: "Proceeding with restructuring based on leadership\u2019s alignment reading. Consolidating teams already fractured at execution level.",
    resultOfPath: "Intervention would have amplified the divergence. Projected dissonance increase from 30\u201343 to 50\u201365 points within 90 days.",
    implications: [
      "Alignment cannot be assessed from the top \u2014 it must be measured at execution level",
      "Restructuring decisions that rely on assumed alignment carry compounding risk",
      "Standard governance instruments (OKRs, reviews) do not detect perception divergence",
    ],
    boardActions: {
      immediate: [
        "Halt restructuring pending execution-layer alignment measurement",
        "Commission Team Assessment for affected units",
      ],
      nearTerm: [
        "Add team perception gap to standing governance risk register",
        "Flag leadership self-assessment as insufficient for structural decisions",
      ],
      structural: [
        "Mandate bi-annual Team Assessment for any unit above 20 headcount",
        "Institutionalise execution-layer validation in restructuring governance",
      ],
    },
    decisionConsequence: [
      "Hidden coordination cost: teams executing against misread priorities waste 20\u201340% of discretionary effort",
      "Structural fragmentation: consolidating fractured teams produces cosmetic alignment, not operational alignment",
      "False confidence at leadership level persists until failure surfaces in delivery metrics",
    ],
    systemFeeds: [
      "Diagnostics \u2014 Team Assessment / perception gap measurement",
      "Mandate Clarity Framework \u2014 Authority divergence detection",
      "Executive Reporting \u2014 Team coherence index and restructuring risk scoring",
    ],
    principle: "What leadership believes about alignment is not evidence. Measurement is.",
    systemLink: { label: "Diagnostics", href: "/diagnostics" },
  },

  "escalation-denied-case": {
    slug: "escalation-denied-case",
    dossierSlug: "case-dossier-escalation-denied",
    title: "Why Escalation Was Denied (And That Saved the System)",
    conditionType: "Premature Escalation",
    domain: "Escalation Governance / Evidence Sufficiency",
    confidence: "High",
    evidenceBasis: [
      { label: "Failure mode identification (3 domains)", basis: "Observed" },
      { label: "Escalation readiness score", basis: "Observed" },
      { label: "Evidence sufficiency assessment", basis: "Observed" },
      { label: "Board response projection", basis: "Inferred" },
      { label: "Root cause attribution", basis: "Anonymised" },
    ],
    decisionRelevance: "Escalation timing, evidence threshold governance, intervention sequencing",
    context: "Institutional client. Three failure modes active simultaneously. Leadership requested immediate board-level escalation.",
    primarySignals: [
      "Three failure modes active: mandate drift, execution fragility, stakeholder misalignment",
      "Leadership requested immediate escalation to board level",
      "Surface signals alarming \u2014 evidence base incomplete",
    ],
    secondarySignals: [
      "Escalation readiness score: 38/100",
      "Evidence documented in 1 of 3 failure domains only",
      "Stakeholder misalignment was reported, not measured",
    ],
    systemInterpretation: "Signal severity was high. Evidence readiness was low. Escalation under these conditions amplifies risk, not resolution.",
    systemClassification: "PREMATURE ESCALATION",
    reclassification: "Escalate \u2192 Gather Evidence",
    classificationBasis: [
      "Visible pressure present across 3 domains",
      "Evidence threshold incomplete: documented in 1 of 3 failure domains",
      "Causal chain not yet stable \u2014 root cause attribution contested",
      "Intervention ownership unclear across stakeholder group",
      "Escalation therefore not justified under governed criteria",
    ],
    failurePattern: "Premature Escalation Under Incomplete Evidence",
    requiredDecision: "Deny escalation. Complete evidence gathering across all 3 failure domains before board engagement.",
    constraints: [
      "Leadership urgency was genuine",
      "Political cost of denying escalation was high",
      "Failure signals were real, even if evidence was partial",
    ],
    timeline: [
      { marker: "T0", event: "Urgent condition signalled by operations" },
      { marker: "T+3d", event: "Pressure to escalate intensifies; leadership requests board intervention" },
      { marker: "T+5d", event: "Assessment: evidence deemed incomplete (38/100 readiness)" },
      { marker: "T+5\u201319d", event: "Stabilisation path: evidence gathering across all 3 failure domains" },
      { marker: "T+21d", event: "Complete evidence base; targeted intervention deployed" },
      { marker: "T+60d", event: "Condition resolved without board-level crisis" },
    ],
    wrongAction: "Escalating to the board with incomplete evidence. Board would have demanded immediate restructuring targeting visible symptoms.",
    resultOfPath: "Restructuring would have targeted symptoms, not structure. Root cause (mandate drift) reinforced. Projected: 60\u201390 day crisis recurrence with reduced credibility for second escalation attempt.",
    implications: [
      "Escalation is not always the correct response to urgency",
      "Signal severity and evidence readiness are independent variables",
      "Governed escalation criteria prevent compounding intervention errors",
    ],
    boardActions: {
      immediate: [
        "Adopt explicit escalation readiness threshold (minimum 65/100 before board engagement)",
        "Document escalation denials as governed decisions, not inaction",
      ],
      nearTerm: [
        "Require evidence coverage across all identified failure domains before escalation",
        "Separate urgency assessment from evidence assessment in escalation protocols",
      ],
      structural: [
        "Commission full evidence gathering with 14-day deadline before re-evaluation",
        "Build escalation readiness scoring into standing governance cadence",
      ],
    },
    decisionConsequence: [
      "Misdirected intervention: restructuring targets symptoms, reinforces actual root cause",
      "Political friction: premature board engagement burns escalation credibility for future genuine need",
      "Amplified instability: partial-evidence intervention creates secondary failure cascade within 60\u201390 days",
    ],
    systemFeeds: [
      "Strategy Room \u2014 Entry gated by evidence sufficiency, not urgency",
      "Escalation Readiness Scorecard \u2014 38/100 triggered denial",
      "Intervention Path Selector \u2014 Monitor path selected over Escalate",
      "Executive Reporting \u2014 Evidence completeness scoring",
    ],
    principle: "The discipline to deny escalation under pressure is a system capability, not a failure.",
    systemLink: { label: "Strategy Room", href: "/strategy-room" },
  },
};

const ALL_SLUGS = Object.keys(ASSETS);

// ─────────────────────────────────────────────────────────────────────────────
// PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>{children}</span>
    </div>
  );
}

function SL({ children }: { children: React.ReactNode }) {
  return <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(255,255,255,0.24)", marginBottom: "0.55rem" }}>{children}</div>;
}

function Rule() { return <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />; }
function GoldRule() { return <div className="h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/25 to-transparent" />; }

function MetaRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-start gap-3 py-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.24em", textTransform: "uppercase", color: accent ? `${GOLD}70` : "rgba(255,255,255,0.22)", minWidth: "9rem", flexShrink: 0 }}>{label}</span>
      <span style={{ ...mono, fontSize: "7.5px", lineHeight: 1.5, color: "rgba(255,255,255,0.60)" }}>{value}</span>
    </div>
  );
}

function BasisTag({ basis }: { basis: Basis }) {
  const color = basis === "Observed" ? "rgba(110,231,183,0.65)" : basis === "Anonymised" ? `${GOLD}80` : basis === "Modelled" ? "rgba(253,186,116,0.65)" : "rgba(255,255,255,0.35)";
  return <span style={{ ...mono, fontSize: "5.5px", letterSpacing: "0.18em", textTransform: "uppercase", color, border: `1px solid ${color}`, padding: "1px 4px" }}>{basis}</span>;
}

function Bullets({ items, color = "rgba(255,255,255,0.52)" }: { items: string[]; color?: string }) {
  return <div className="space-y-1">{items.map((s, i) => (
    <p key={i} style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.55, color, paddingLeft: "0.75rem", position: "relative" }}>
      <span style={{ position: "absolute", left: 0, color: "rgba(255,255,255,0.18)" }}>&middot;</span>{s}
    </p>
  ))}</div>;
}

function ActionBand({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="mb-3">
      <div style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60`, marginBottom: "0.3rem" }}>{label}</div>
      {items.map((a, i) => (
        <div key={i} className="flex items-start gap-2 py-1" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <span style={{ ...mono, fontSize: "7px", color: `${GOLD}50`, flexShrink: 0 }}>{String(i + 1).padStart(2, "0")}</span>
          <span style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.5, color: "rgba(255,255,255,0.55)" }}>{a}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE — standardised section order
// ─────────────────────────────────────────────────────────────────────────────

type PageProps = { asset: EvidenceAsset };

export default function EvidenceDetailPage({ asset }: PageProps) {
  return (
    <Layout title={`${asset.title} | Abraham of London`} description={asset.context} canonicalUrl={`/evidence/${asset.slug}`}>
      <Head><meta name="description" content={asset.context} /></Head>

      <div style={{ backgroundColor: VOID }}>
        <div className="mx-auto max-w-6xl px-6 lg:px-12">

          {/* TITLE */}
          <div className="pt-14 pb-3 lg:pt-20" data-evidence-classification="STATIC_PROOF_ASSET">
            <div className="flex items-center gap-3 mb-2">
              <Eyebrow>Case Dossier</Eyebrow>
              <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.20em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.08)", padding: "2px 6px" }}>
                Static proof asset
              </span>
            </div>
            <h1 style={{ ...serif, marginTop: "0.75rem", fontSize: "clamp(1.5rem, 4.5vw, 2.2rem)", lineHeight: 1.05, color: "rgba(255,255,255,0.92)", maxWidth: "40ch", fontStyle: "italic" }}>{asset.title}</h1>
          </div>

          {/* 1. CASE CLASSIFICATION */}
          <div className="py-5" style={{ maxWidth: "56rem" }}>
            <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem 1.25rem" }}>
              <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "0.65rem" }}>Case Classification</div>
              <MetaRow label="Condition Type" value={asset.conditionType} accent />
              <MetaRow label="Domain" value={asset.domain} />
              <MetaRow label="Confidence" value={asset.confidence} />
              <MetaRow label="Decision Relevance" value={asset.decisionRelevance} />
              <div className="mt-2.5">
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)" }}>Evidence Basis</span>
                <div className="mt-1 space-y-0.5">
                  {asset.evidenceBasis.map((eb) => (
                    <div key={eb.label} className="flex items-center gap-2"><BasisTag basis={eb.basis} /><span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.50)" }}>{eb.label}</span></div>
                  ))}
                </div>
              </div>
              <div className="mt-2.5 flex items-center gap-3" style={{ borderTop: `1px solid ${GOLD}15`, paddingTop: "0.5rem" }}>
                <span style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60` }}>System Link</span>
                <Link href={asset.systemLink.href} style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", color: `${GOLD}90`, textDecoration: "underline", textDecorationColor: `${GOLD}30` }}>{asset.systemLink.label}</Link>
              </div>
            </div>
          </div>

          <div className="pb-5" style={{ maxWidth: "56rem" }}>
            <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: "rgba(255,255,255,0.015)", padding: "0.85rem 1rem" }}>
              <div style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60`, marginBottom: "0.35rem" }}>
                Public Proof Boundary
              </div>
              <p style={{ ...serif, fontSize: "0.86rem", lineHeight: 1.55, color: "rgba(255,255,255,0.46)" }}>
                This dossier is intended to prove the condition, the decision frame, the consequence of delay, and the movement that followed. It is not intended to expose private source records, internal scoring, or proprietary operating logic.
              </p>
            </div>
          </div>

          <Rule />

          {/* 2. CONDITION SNAPSHOT */}
          <div className="py-5" style={{ maxWidth: "60ch" }}>
            <SL>Condition Snapshot</SL>
            <p style={{ ...serif, fontSize: "0.92rem", lineHeight: 1.6, color: "rgba(255,255,255,0.48)" }}>{asset.context}</p>
          </div>

          <Rule />

          {/* 3. SIGNAL REGISTER */}
          <div className="py-5" style={{ maxWidth: "56rem" }}>
            <SL>Signal Register</SL>
            <div className="grid gap-3 md:grid-cols-2">
              <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "0.75rem" }}>
                <div style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.35)", marginBottom: "0.4rem" }}>Primary Signals</div>
                <Bullets items={asset.primarySignals} color="rgba(255,255,255,0.55)" />
              </div>
              <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "0.75rem" }}>
                <div style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", marginBottom: "0.4rem" }}>Secondary Signals</div>
                <Bullets items={asset.secondarySignals} color="rgba(255,255,255,0.40)" />
              </div>
            </div>
            <div className="mt-2.5" style={{ borderLeft: `2px solid ${GOLD}30`, paddingLeft: "0.75rem" }}>
              <div style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}60`, marginBottom: "0.2rem" }}>System Interpretation</div>
              <p style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.55, color: "rgba(255,255,255,0.55)" }}>{asset.systemInterpretation}</p>
            </div>
          </div>

          <Rule />

          {/* 4. SYSTEM CLASSIFICATION */}
          <div className="py-5">
            <SL>System Classification</SL>
            <div className="flex flex-wrap items-center gap-4">
              <span style={{ ...mono, fontSize: "10px", letterSpacing: "0.10em", color: `${GOLD}CC`, fontWeight: 700 }}>{asset.systemClassification}</span>
              <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.35)" }}>{asset.reclassification}</span>
            </div>
          </div>

          {/* 5. CLASSIFICATION BASIS */}
          <div className="pb-5" style={{ maxWidth: "56rem" }}>
            <SL>Classification Basis</SL>
            <Bullets items={asset.classificationBasis} color="rgba(255,255,255,0.48)" />
          </div>

          {/* 6. FAILURE PATTERN */}
          <div className="pb-5">
            <SL>Failure Pattern</SL>
            <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.08em", color: "rgba(255,255,255,0.70)", fontWeight: 700 }}>{asset.failurePattern}</span>
          </div>

          <GoldRule />

          {/* 7. DECISION FRAME */}
          <div className="py-5" style={{ maxWidth: "56rem" }}>
            <SL>Decision Frame</SL>
            <div style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "0.25rem" }}>Required Decision</div>
            <p style={{ ...serif, fontSize: "0.92rem", lineHeight: 1.55, color: "rgba(255,255,255,0.60)" }}>{asset.requiredDecision}</p>
            <div className="mt-2.5" style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginBottom: "0.25rem" }}>Constraints</div>
            <Bullets items={asset.constraints} color="rgba(255,255,255,0.40)" />
          </div>

          <Rule />

          {/* 8. TIMELINE */}
          <div className="py-5" style={{ maxWidth: "56rem" }}>
            <SL>Timeline</SL>
            <div style={{ border: "1px solid rgba(255,255,255,0.06)", backgroundColor: "rgba(255,255,255,0.015)", padding: "0.75rem" }}>
              {asset.timeline.map((t, i) => (
                <div key={i} className="flex items-start gap-3 py-1" style={{ borderBottom: i < asset.timeline.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                  <span style={{ ...mono, fontSize: "7px", color: `${GOLD}70`, minWidth: "4rem", flexShrink: 0 }}>{t.marker}</span>
                  <span style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.5, color: "rgba(255,255,255,0.52)" }}>{t.event}</span>
                </div>
              ))}
            </div>
          </div>

          <Rule />

          {/* 9. COUNTERFACTUAL */}
          <div className="py-5" style={{ maxWidth: "60ch" }}>
            <SL>Counterfactual</SL>
            <div style={{ border: "1px solid rgba(252,165,165,0.18)", backgroundColor: "rgba(252,165,165,0.03)", padding: "0.85rem" }}>
              <div style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.55)", marginBottom: "0.35rem" }}>Wrong Action</div>
              <p style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.6, color: "rgba(255,255,255,0.52)" }}>{asset.wrongAction}</p>
              <div style={{ ...mono, fontSize: "6px", letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(252,165,165,0.55)", marginTop: "0.65rem", marginBottom: "0.35rem" }}>Result of That Path</div>
              <p style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.6, color: "rgba(252,165,165,0.65)" }}>{asset.resultOfPath}</p>
              {asset.exposureAnchor && (
                <>
                  <div style={{ ...mono, fontSize: "5.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", marginTop: "0.55rem", marginBottom: "0.25rem" }}>Exposure Derivation</div>
                  <p style={{ ...serif, fontSize: "0.8rem", lineHeight: 1.5, color: "rgba(255,255,255,0.32)", fontStyle: "italic" }}>{asset.exposureAnchor}</p>
                </>
              )}
            </div>
          </div>

          <Rule />

          {/* 10. IMPLICATIONS */}
          <div className="py-5" style={{ maxWidth: "60ch" }}>
            <SL>Outcome / Implications</SL>
            <Bullets items={asset.implications} />
          </div>

          <Rule />

          {/* 11. BOARD-LEVEL ACTIONS (banded) */}
          <div className="py-5" style={{ maxWidth: "56rem" }}>
            <SL>Board-Level Actions</SL>
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "0.75rem" }}>
              <ActionBand label="Immediate (0\u20137 days)" items={asset.boardActions.immediate} />
              <ActionBand label="Near Term (30 days)" items={asset.boardActions.nearTerm} />
              <ActionBand label="Structural (Quarterly / Ongoing)" items={asset.boardActions.structural} />
            </div>
          </div>

          <Rule />

          {/* 12. DECISION CONSEQUENCE */}
          <div className="py-5" style={{ maxWidth: "60ch" }}>
            <SL>Decision Consequence</SL>
            <Bullets items={asset.decisionConsequence} color="rgba(252,165,165,0.60)" />
          </div>

          <GoldRule />

          {/* 13. SYSTEM TRACE */}
          <div className="py-5" style={{ maxWidth: "56rem" }}>
            <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}04`, padding: "0.85rem 1.1rem" }}>
              <div style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}80`, marginBottom: "0.45rem" }}>System Trace</div>
              <Bullets items={asset.systemFeeds} color="rgba(255,255,255,0.45)" />
              <div className="mt-2.5" style={{ borderTop: `1px solid ${GOLD}15`, paddingTop: "0.5rem" }}>
                <p style={{ ...serif, fontSize: "0.88rem", lineHeight: 1.55, color: `${GOLD}90`, fontStyle: "italic" }}>{asset.principle}</p>
              </div>
            </div>
          </div>

          <Rule />

          {/* DOSSIER DOWNLOAD */}
          <div className="py-5">
            <div style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.02)", padding: "0.85rem 1.1rem", maxWidth: "48rem" }}>
              <SL>Full dossier</SL>
              <p style={{ ...serif, fontSize: "0.85rem", lineHeight: 1.5, color: "rgba(255,255,255,0.38)" }}>Available as a structured dossier for offline use and board-level discussion.</p>
              <a href={`/api/downloads/${asset.dossierSlug}`} className="mt-2.5 inline-flex items-center gap-2 transition-all duration-200"
                style={{ padding: "7px 14px", border: "1px solid rgba(255,255,255,0.14)", backgroundColor: "rgba(255,255,255,0.03)", color: "rgba(255,255,255,0.50)", ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.25)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; }}
              >Download full dossier <ArrowRight style={{ width: 9, height: 9 }} /></a>
            </div>
          </div>

          <div className="pb-5" style={{ maxWidth: "48rem" }}>
            <p style={{ ...mono, fontSize: "6px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.20)" }}>
              Need deeper substantiation?
            </p>
            <p style={{ ...serif, marginTop: "0.35rem", fontSize: "0.82rem", lineHeight: 1.5, color: "rgba(255,255,255,0.34)" }}>
              Public dossiers are designed for proof-facing review. Source-level substantiation, supporting records, and live application remain private and move only through the appropriate confidential route.
            </p>
          </div>

          {/* BACK */}
          <div className="pb-10 flex items-center gap-4">
            <Link href="/evidence" style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>All evidence</Link>
            <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.12)" }}>&middot;</span>
            <Link href="/" style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>Back to home</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export const getStaticPaths: GetStaticPaths = async () => ({
  paths: ALL_SLUGS.map((slug) => ({ params: { slug } })),
  fallback: false,
});

export const getStaticProps: GetStaticProps<PageProps> = async ({ params }) => {
  const slug = params?.slug as string;
  const asset = ASSETS[slug];
  if (!asset) return { notFound: true };
  return { props: { asset } };
};
