/**
 * pages/products.tsx — Commercial product router for Abraham of London.
 *
 * Routes buyer intent into the right product surface.
 * Not a shop. Not a SaaS catalogue. A governed product map.
 *
 * Rules:
 *   - /pricing remains the payment/access page.
 *   - Retainer Oversight remains gated; no public activation CTA.
 *   - Purpose Alignment is separate from Operational Decision Intelligence.
 *   - No admin/operator routes exposed.
 *   - No AI-tool framing.
 */

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  FileText,
  Gauge,
  Layers3,
  Lock,
  Radio,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";

import Layout from "@/components/Layout";
import { CATALOG } from "@/lib/commercial/catalog";
import { trackLaunch } from "@/lib/analytics/client-launch-events";

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";
const VOID = "rgb(3 3 5)";
const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};
const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

// ─── Types ────────────────────────────────────────────────────────────────────

type ProductStatus =
  | "Free"
  | "Open entry"
  | "Active"
  | "Paid"
  | "Organisational"
  | "Evidence-gated"
  | "Review-gated"
  | "Gated"
  | "Selective access"
  | "Planned"
  | "Sample"
  | "Separate line"
  | "Public instrument";

type ProductItem = {
  name: string;
  status: ProductStatus;
  role: string;
  answers: string;
  produces: string;
  href?: string;
  cta?: string;
  accessNote?: string;
  alternateHref?: string;
  alternateLabel?: string;
};

type IntentCard = {
  number: string;
  title: string;
  description: string;
  href?: string;
  cta: string;
  status: ProductStatus;
};

type CorridorStageData = {
  id: string;
  number: string;
  name: string;
  status: ProductStatus;
  price: string;
  purpose: string;
  href?: string;
  cta?: string;
};

type InstrumentItem = {
  name: string;
  status: ProductStatus;
  href?: string;
};

// ─── Status styles ────────────────────────────────────────────────────────────

const statusStyles: Record<ProductStatus, { color: string; border: string; background: string }> = {
  "Free":              { color: "rgba(110,231,183,0.92)", border: "rgba(110,231,183,0.22)", background: "rgba(110,231,183,0.06)" },
  "Open entry":        { color: "rgba(110,231,183,0.92)", border: "rgba(110,231,183,0.22)", background: "rgba(110,231,183,0.06)" },
  "Active":            { color: `${GOLD}E6`,               border: `${GOLD}35`,              background: `${GOLD}10` },
  "Paid":              { color: `${GOLD}CC`,               border: `${GOLD}30`,              background: `${GOLD}0D` },
  "Organisational":    { color: "rgba(147,197,253,0.90)", border: "rgba(147,197,253,0.22)", background: "rgba(147,197,253,0.06)" },
  "Evidence-gated":    { color: "rgba(216,180,254,0.90)", border: "rgba(216,180,254,0.22)", background: "rgba(216,180,254,0.06)" },
  "Review-gated":      { color: "rgba(148,163,184,0.90)", border: "rgba(148,163,184,0.22)", background: "rgba(148,163,184,0.06)" },
  "Gated":             { color: "rgba(252,165,165,0.65)", border: "rgba(252,165,165,0.14)", background: "rgba(252,165,165,0.04)" },
  "Selective access":  { color: "rgba(251,191,36,0.84)",  border: "rgba(251,191,36,0.22)",  background: "rgba(251,191,36,0.06)" },
  "Planned":           { color: "rgba(255,255,255,0.50)", border: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.018)" },
  "Sample":            { color: "rgba(255,255,255,0.58)", border: "rgba(255,255,255,0.10)", background: "rgba(255,255,255,0.025)" },
  "Separate line":     { color: "rgba(252,211,77,0.88)",  border: "rgba(252,211,77,0.20)",  background: "rgba(252,211,77,0.055)" },
  "Public instrument": { color: "rgba(147,197,253,0.90)", border: "rgba(147,197,253,0.22)", background: "rgba(147,197,253,0.06)" },
};

function catalogPath(code: keyof typeof CATALOG, fallback: string): string {
  return CATALOG[code]?.successPath || fallback;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const routePrinciples = [
  { title: "Homepage",     body: "Creates category demand and routes visitors into proof." },
  { title: "Products",     body: "Routes commercial intent. You are here." },
  { title: "Activation",   body: "Proves value quickly through instruments and diagnostics." },
  { title: "Paid Corridor", body: "Governs deeper decisions: team, enterprise, executive, boardroom, strategy, retainer." },
  { title: "Pricing",      body: "Handles payment, access, and qualification details." },
];

const intentCards: IntentCard[] = [
  {
    number: "01",
    title: "Test one serious decision",
    description: "Use this when you need a fast read on whether a decision is under evidence, authority, or execution pressure.",
    href: "/decision-pressure",
    cta: "Start free signal",
    status: "Free",
  },
  {
    number: "02",
    title: "Prepare a board-level decision",
    description: "Use this when one serious decision needs challenge, objections, evidence weaknesses, and decision paths.",
    href: "/boardroom-brief",
    cta: "Generate Boardroom Brief",
    status: "Open entry",
  },
  {
    number: "03",
    title: "Assess an organisation",
    description: "Use this when the issue is not one decision, but the organisation's authority, evidence, dependency, and execution structure.",
    href: "/enterprise",
    cta: "View enterprise pathway",
    status: "Organisational",
  },
  {
    number: "04",
    title: "Govern execution",
    description: "Use this when the decision has been made but ownership, blockers, checkpoints, or execution conditions still need governance.",
    href: "/strategy-room",
    cta: "View Strategy Room",
    status: "Evidence-gated",
  },
  {
    number: "05",
    title: "Use this with clients",
    description: "For advisors, consultants, operators, and professionals who need stronger decision evidence and client-facing challenge outputs.",
    href: "/professionals",
    cta: "Professional access",
    status: "Selective access",
  },
];

const corridorStages: CorridorStageData[] = [
  {
    id: "team-assessment",
    number: "01",
    name: "Team Assessment",
    status: "Active",
    price: "Paid",
    purpose: "Tests whether respondents are describing the same decision, owner, blocker, and evidence position.",
    href: "/diagnostics/team-assessment",
    cta: "Start Team Assessment",
  },
  {
    id: "enterprise-assessment",
    number: "02",
    name: "Enterprise Assessment",
    status: "Active",
    price: "Paid",
    purpose: "Tests organisational dependencies, exposure, authority, evidence, and scenario stress.",
    href: "/enterprise",
    cta: "Run organisational scan",
  },
  {
    id: "executive-reporting",
    number: "03",
    name: "Executive Reporting",
    status: "Active",
    price: "From £295",
    purpose: "Turns carried-forward evidence into board-grade judgement and recommendation.",
    href: "/diagnostics/executive-reporting",
    cta: "Proceed to Executive Reporting",
  },
  {
    id: "boardroom-mode",
    number: "04",
    name: "Boardroom Mode",
    status: "Evidence-gated",
    price: "Paid / evidence-gated",
    purpose: "Tests whether executive judgement survives adversarial boardroom scrutiny.",
    href: "/boardroom",
    cta: "View Boardroom Mode",
  },
  {
    id: "strategy-room",
    number: "05",
    name: "Strategy Room",
    status: "Evidence-gated",
    price: "Paid / governed execution",
    purpose: "Turns an approved decision into governed execution with ownership, checkpoints, blockers, and feedback.",
    href: catalogPath("strategy_room", "/strategy-room"),
    cta: "View Strategy Room",
  },
  {
    id: "retainer-review-queue",
    number: "06",
    name: "Retainer Review Queue",
    status: "Review-gated",
    price: "Review request",
    purpose: "Allows qualifying cases to request retained oversight review.",
    href: undefined,
    cta: "Request review where eligible",
  },
  {
    id: "retainer-oversight",
    number: "07",
    name: "Retainer Oversight",
    status: "Gated",
    price: "Custom / readiness-gated",
    purpose: "Only available after sufficient durable memory, recurrence, outcome history, and readiness threshold.",
    href: undefined,
    cta: undefined,
  },
];

const marketActivationItems: ProductItem[] = [
  {
    name: "Decision Pressure Signal",
    status: "Free",
    role: "Fast free pressure reading for a single consequential decision.",
    answers: "Is this decision under evidence, authority, or execution pressure?",
    produces: "Pressure band, missing evidence, authority risk, consequence signal, and next admissible move.",
    href: "/decision-pressure",
    cta: "Start free signal",
    accessNote: "Free, no account required.",
  },
  {
    name: "Boardroom Brief",
    status: "Open entry",
    role: "Public market activation for board-grade framing.",
    answers: "What should leadership understand before a board-level decision is prepared?",
    produces: "A structured board-facing brief from a serious decision record.",
    href: "/boardroom-brief",
    cta: "Generate a brief",
    accessNote: "Open entry. Recommended first paid step.",
    alternateHref: "/boardroom-brief?sample=true",
    alternateLabel: "View sample brief",
  },
  {
    name: "Scenario Stress Test",
    status: "Active",
    role: "Standalone scenario pressure test for decision quality under simulated pressure.",
    answers: "How does a decision behave under a defined pressure scenario?",
    produces: "Pressure finding, likely break point, weakness category, and strengthening recommendation.",
    href: "/scenario-stress-test",
    cta: "Run scenario test",
    accessNote: "Free public proof surface. Deeper governance available inside the paid corridor.",
    alternateHref: "/diagnostics/enterprise-assessment",
    alternateLabel: "Use Enterprise Assessment",
  },
  {
    name: "Quick Decision Health Check",
    status: "Active",
    role: "Fast public check for decision condition and next move.",
    answers: "Is this decision healthy enough to proceed?",
    produces: "Decision condition, key weakness, next admissible move, and recommended route.",
    href: "/quick-check",
    cta: "Start health check",
    accessNote: "Free, no account required. 2 minutes.",
    alternateHref: "/diagnostics/fast",
    alternateLabel: "Run Fast Diagnostic",
  },
];

const instrumentItems: InstrumentItem[] = [
  { name: "Decision Signal",                   status: "Open entry",    href: "/decision-instruments/signal" },
  { name: "Decision Exposure Instrument",      status: "Active",        href: catalogPath("decision_exposure_instrument", "/decision-instruments/decision-exposure-instrument/start") },
  { name: "Mandate Clarity Framework",         status: "Active",        href: catalogPath("mandate_clarity_framework", "/decision-instruments/mandate-clarity-framework/start") },
  { name: "Execution Risk Index",              status: "Active",        href: catalogPath("execution_risk_index", "/decision-instruments/execution-risk-index/run") },
  { name: "Escalation Readiness Scorecard",    status: "Active",        href: catalogPath("escalation_readiness_scorecard", "/decision-instruments/escalation-readiness-scorecard/run") },
  { name: "Structural Failure Diagnostic",     status: "Active",        href: catalogPath("structural_failure_diagnostic_canvas", "/decision-instruments/structural-failure-diagnostic-canvas/run") },
  { name: "Team Alignment Gap Map",            status: "Active",        href: catalogPath("team_alignment_gap_map", "/decision-instruments/team-alignment-gap-map/run") },
  { name: "Governance Drift Detector",         status: "Active",        href: catalogPath("governance_drift_detector", "/decision-instruments/governance-drift-detector/run") },
  { name: "Strategic Priority Stack Builder",  status: "Active",        href: catalogPath("strategic_priority_stack_builder", "/decision-instruments/strategic-priority-stack-builder/run") },
  { name: "Intervention Path Selector",        status: "Active",        href: catalogPath("intervention_path_selector", "/decision-instruments/intervention-path-selector/start") },
  { name: "Board Brief Builder",               status: "Active",        href: catalogPath("board_brief_builder", "/decision-instruments/board-brief-builder/run") },
  { name: "Operator Decision Pack",            status: "Active",        href: catalogPath("operator_decision_pack", "/decision-instruments/operator-decision-pack/start") },
  { name: "View all instruments",              status: "Active",        href: "/decision-instruments" },
];

const purposeAlignmentItems: InstrumentItem[] = [
  { name: "Purpose Alignment Diagnostic",  status: "Separate line", href: catalogPath("personal_decision_audit", "/diagnostics/purpose-alignment") },
  { name: "Pattern-Breaker Contract",      status: "Planned" },
  { name: "Commitment verification",       status: "Planned" },
  { name: "Behavioural evidence bridge",   status: "Planned" },
];

const knowledgeItems: InstrumentItem[] = [
  { name: "Published Briefs",  status: "Sample",           href: "/briefs" },
  { name: "Decision Centre",   status: "Selective access",  href: "/decision-centre" },
  { name: "Pricing",           status: "Sample",            href: "/pricing" },
  { name: "Frameworks",        status: "Active",            href: "/decision-instruments" },
];

const gmiItems: InstrumentItem[] = [
  { name: "Global Market Intelligence Report — Q1 2026", status: "Active", href: catalogPath("gmi_q1_2026", "/artifacts/global-market-intelligence-report-q1-2026") },
  { name: "Market Intelligence Archive",                  status: "Active", href: "/intelligence/market" },
];

const playbookItems: InstrumentItem[] = [
  { name: "Execution Integrity Protocol",        status: "Active", href: catalogPath("execution_integrity_protocol", "/playbooks/execution-integrity-protocol") },
  { name: "The Alignment Audit Playbook",        status: "Active", href: catalogPath("alignment_audit_playbook", "/playbooks/the-alignment-audit-playbook") },
  { name: "The Drift Detection Framework",       status: "Active", href: catalogPath("drift_detection_framework", "/playbooks/the-drift-detection-framework") },
];

// ─── Components ───────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}88` }}>
      {children}
    </p>
  );
}

function StatusBadge({ status }: { status: ProductStatus }) {
  const style = statusStyles[status];
  const Icon =
    status === "Gated" || status === "Review-gated" ? Lock
    : status === "Planned" ? FileText
    : status === "Free" || status === "Open entry" ? Radio
    : ShieldCheck;
  return (
    <span
      className="inline-flex items-center gap-1.5 border px-2.5 py-1"
      style={{ ...mono, color: style.color, borderColor: style.border, backgroundColor: style.background, fontSize: "7.5px", letterSpacing: "0.14em", textTransform: "uppercase" }}
    >
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

function PrimaryBtn({ href, children, large, onClick }: { href: string; children: React.ReactNode; large?: boolean; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group inline-flex items-center gap-2 border transition-all duration-150 hover:-translate-y-px"
      style={{ ...mono, borderColor: `${GOLD}50`, backgroundColor: `${GOLD}12`, color: "#F5F5F5", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", minHeight: large ? "52px" : "44px", padding: large ? "0 1.5rem" : "0 1.1rem" }}
    >
      {children}
      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function GhostBtn({ href, children, onClick }: { href: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="group inline-flex items-center gap-2 border border-white/[0.09] px-5 py-3 transition-all duration-150 hover:-translate-y-px hover:border-white/[0.16]"
      style={{ ...mono, color: "rgba(255,255,255,0.52)", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase", minHeight: "44px" }}
    >
      {children}
      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function ProductCard({ item }: { item: ProductItem }) {
  const isActionable = Boolean(item.href);
  return (
    <article className="flex min-h-[280px] flex-col border border-white/[0.075] bg-white/[0.016] p-5 transition-colors duration-150 hover:border-white/[0.13] hover:bg-white/[0.026]">
      <StatusBadge status={item.status} />
      <h3 className="mt-4" style={{ ...serif, color: "rgba(255,255,255,0.90)", fontSize: "1.35rem", lineHeight: 1.05, fontStyle: "italic" }}>
        {item.name}
      </h3>
      <p className="mt-3 text-[13px] leading-[1.7] text-white/[0.68]">{item.role}</p>
      <div className="mt-4 space-y-3">
        <div>
          <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>Produces</p>
          <p className="mt-1 text-[13px] leading-[1.65] text-white/[0.62]">{item.produces}</p>
        </div>
      </div>
      {item.accessNote && (
        <p className="mt-4 border-t border-white/[0.06] pt-4" style={{ ...mono, fontSize: "8px", letterSpacing: "0.12em", lineHeight: 1.65, color: "rgba(255,255,255,0.42)", textTransform: "uppercase" }}>
          {item.accessNote}
        </p>
      )}
      <div className="mt-auto flex flex-wrap gap-3 pt-5">
        {isActionable ? (
          <Link href={item.href as string}
            className="group inline-flex min-h-[42px] items-center gap-2 border px-4 py-2.5 transition-all duration-150 hover:-translate-y-px"
            style={{ ...mono, borderColor: `${GOLD}35`, backgroundColor: `${GOLD}0D`, color: "rgba(255,255,255,0.82)", fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase" }}>
            {item.cta || "Open"}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : null}
        {item.alternateHref ? (
          <Link href={item.alternateHref}
            className="group inline-flex min-h-[42px] max-w-full items-center gap-2 whitespace-normal border border-white/[0.08] px-4 py-2.5 text-left leading-[1.45] text-white/[0.42] transition-all duration-150 hover:border-white/[0.14] hover:text-white/[0.60]"
            style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase" }}>
            {item.alternateLabel || "Adjacent route"}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : !isActionable ? (
          <span className="inline-flex min-h-[42px] items-center border border-white/[0.07] px-4 py-2.5 text-white/[0.25]"
            style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase" }}>
            Not yet available
          </span>
        ) : null}
      </div>
    </article>
  );
}

function StickyActionBar() {
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const handler = () => setVisible(window.scrollY > 520);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${visible ? "translate-y-0" : "translate-y-full"}`}
      style={{ backgroundColor: "rgba(3,3,5,0.96)", borderTop: `1px solid ${GOLD}22` }}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3 lg:px-12">
        <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.50)" }}>
          Not sure where to start?
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/decision-pressure"
            className="group inline-flex items-center gap-2 border px-4 py-2 transition-all hover:-translate-y-px"
            style={{ ...mono, borderColor: `${GOLD}45`, backgroundColor: `${GOLD}10`, color: "#F5F5F5", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Start free pressure signal
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link href="/boardroom-brief"
            className="inline-flex items-center gap-2 border border-white/[0.10] px-4 py-2 text-white/[0.50] transition-all hover:-translate-y-px hover:border-white/[0.18] hover:text-white/[0.72]"
            style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            Generate Boardroom Brief
          </Link>
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="border-t border-white/[0.06]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-white/[0.012] lg:px-12"
      >
        <div>
          <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}90` }}>{title}</p>
          <p className="mt-1 text-[13px] text-white/[0.55]">{intro}</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-white/30" /> : <ChevronDown className="h-4 w-4 shrink-0 text-white/30" />}
      </button>
      {open && (
        <div className="px-6 pb-10 lg:px-12">
          {children}
        </div>
      )}
    </div>
  );
}

function InstrumentList({ items }: { items: InstrumentItem[] }) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div key={item.name} className="flex items-center justify-between gap-3 border border-white/[0.06] bg-white/[0.012] px-4 py-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <StatusBadge status={item.status} />
            {item.href ? (
              <Link href={item.href} className="truncate text-[13px] text-white/[0.78] transition-colors hover:text-white/[0.90]" style={{ ...mono, fontSize: "8px", letterSpacing: "0.08em" }}>
                {item.name}
              </Link>
            ) : (
              <span className="truncate text-[13px] text-white/[0.38]" style={{ ...mono, fontSize: "8px", letterSpacing: "0.08em" }}>{item.name}</span>
            )}
          </div>
          {item.href && <ArrowRight className="h-3 w-3 shrink-0 text-white/20" />}
        </div>
      ))}
    </div>
  );
}

function CollapsibleBriefPreview() {
  const [open, setOpen] = React.useState(false);
  const previewSections = [
    { label: "Likely objections",  sample: "The decision lacks an identified authority holder. No named party has confirmed they can approve this before the deadline." },
    { label: "Evidence weaknesses", sample: "Consequence of inaction is described but not quantified. The board will require a cost-of-delay figure before approval." },
    { label: "Trade-offs",          sample: "Acting now preserves optionality. Delaying past Q3 triggers contractual exposure and narrows available remedies." },
    { label: "Next admissible move", sample: "Identify the approval authority. Present the evidence basis to that party before the next committee date." },
  ];
  return (
    <div className="border border-white/[0.08] bg-white/[0.01]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-white/[0.015]"
      >
        <div>
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}80` }}>What the brief shows</p>
          <p className="mt-1 text-[11px] text-white/[0.35]">Sample structure using fictional demonstration data</p>
        </div>
        {open ? <ChevronUp className="h-4 w-4 text-white/30" /> : <ChevronDown className="h-4 w-4 text-white/30" />}
      </button>
      {open && (
        <div className="space-y-4 border-t border-white/[0.06] p-4">
          {previewSections.map((s) => (
            <div key={s.label}>
              <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: `${GOLD}70` }}>{s.label}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-white/[0.42]" style={{ ...serif, fontStyle: "italic" }}>{s.sample}</p>
            </div>
          ))}
          <p className="border-t border-white/[0.04] pt-3" style={{ ...mono, fontSize: "7px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)" }}>
            Sample structure. Fictional demonstration data only.
          </p>
        </div>
      )}
    </div>
  );
}

function CorridorStageRow({ stage, index, isLast }: { stage: CorridorStageData; index: number; isLast: boolean }) {
  const isGated = stage.status === "Gated";
  const dimmed = isGated;
  return (
    <div className="relative flex">
      {/* Number + vertical line */}
      <div className="flex w-12 shrink-0 flex-col items-center">
        <div
          className="relative z-10 flex h-8 w-8 items-center justify-center border"
          style={{ borderColor: dimmed ? "rgba(255,255,255,0.06)" : `${GOLD}28`, backgroundColor: dimmed ? "rgba(255,255,255,0.008)" : `${GOLD}08` }}
        >
          <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.08em", color: dimmed ? "rgba(255,255,255,0.35)" : `${GOLD}88` }}>{stage.number}</span>
        </div>
        {!isLast && <div className="w-px flex-1 bg-white/[0.06]" style={{ minHeight: "28px" }} />}
      </div>

      {/* Content */}
      <div className="flex-1 pb-6 pl-4 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={stage.status} />
          <span style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)" }}>{stage.price}</span>
        </div>
        <h3 className="mt-2" style={{ ...serif, fontSize: "1.35rem", lineHeight: 1.1, fontStyle: "italic", color: dimmed ? "rgba(255,255,255,0.50)" : "rgba(255,255,255,0.86)" }}>
          {stage.name}
        </h3>
        <p className="mt-1.5 max-w-[60ch] text-[13px] leading-relaxed" style={{ color: dimmed ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.62)" }}>
          {stage.purpose}
        </p>
        <div className="mt-3">
          {stage.cta && stage.href ? (
            <Link
              href={stage.href}
              className="group inline-flex items-center gap-2 border px-3 py-2 transition-all hover:-translate-y-px"
              style={{ ...mono, borderColor: `${GOLD}30`, backgroundColor: `${GOLD}08`, color: "rgba(255,255,255,0.72)", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase" }}
            >
              {stage.cta}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : stage.cta && !stage.href ? (
            <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.42)" }}>{stage.cta}</span>
          ) : (
            <span className="inline-flex items-center gap-2" style={{ ...mono, fontSize: "8px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)" }}>
              <Lock className="h-3 w-3" /> No public activation
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page sections ────────────────────────────────────────────────────────────

function SectionNav() {
  const links = [
    { href: "#start-here",      label: "Start here" },
    { href: "#boardroom-brief-feature", label: "Boardroom Brief" },
    { href: "#paid-corridor",   label: "Paid corridor" },
    { href: "#market-activation", label: "Market Activation" },
    { href: "#enterprise",      label: "Enterprise" },
    { href: "#intelligence",    label: "Market Intelligence" },
    { href: "#instruments",     label: "Instruments" },
    { href: "#playbooks",       label: "Playbooks" },
    { href: "#purpose",         label: "Purpose Alignment" },
    { href: "#knowledge",       label: "Knowledge" },
  ];
  return (
    <section className="border-y border-white/[0.06] px-6 py-4 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-wrap gap-2">
        {links.map((l) => (
          <a key={l.href} href={l.href}
            className="border border-white/[0.08] px-4 py-2 text-white/[0.55] transition-colors hover:border-white/[0.15] hover:text-white/[0.78]"
            style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase" }}>
            {l.label}
          </a>
        ))}
      </div>
    </section>
  );
}

function HeroSection() {
  return (
    <section className="px-6 pb-12 pt-[128px] lg:px-12 lg:pb-16 lg:pt-36">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 lg:grid-cols-[1fr_0.72fr] lg:items-start">
          <div>
            <Eyebrow>Product Directory</Eyebrow>
            <h1
              className="mt-6 max-w-[52rem] break-words"
              style={{ ...serif, color: "#F5F5F5", fontSize: "clamp(2.7rem, 8vw, 5.6rem)", lineHeight: 0.92, fontStyle: "italic" }}
            >
              Decision Infrastructure Products
            </h1>
            <p className="mt-7 max-w-[66ch] text-[16px] leading-[1.85] text-white/[0.58]">
              Start with one serious decision. The system will route you to the right level of scrutiny — from a free pressure signal to boardroom challenge, executive reporting, governed execution, and retained review.
            </p>
            <p className="mt-3 max-w-[60ch] text-[13px] text-white/[0.36]" style={{ ...mono, fontSize: "9px", letterSpacing: "0.08em", fontStyle: "italic" }}>
              Most users start with a pressure signal or Boardroom Brief before moving into the deeper decision corridor.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryBtn href="/decision-pressure" large>Start with a free pressure signal</PrimaryBtn>
              <GhostBtn href="/boardroom-brief">Generate Boardroom Brief</GhostBtn>
              <Link href="/pricing"
                className="inline-flex items-center gap-1.5"
                style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.50)" }}>
                View pricing and access
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          {/* Route strategy panel */}
          <div className="border border-white/[0.075] bg-white/[0.018] p-5 lg:p-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>Route strategy</p>
            </div>
            <div className="mt-5 grid gap-px bg-white/[0.05]">
              {routePrinciples.map((p) => (
                <div key={p.title} className="bg-[#030305] p-4">
                  <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}90` }}>{p.title}</p>
                  <p className="mt-2 text-[13px] leading-[1.7] text-white/[0.60]">{p.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PressureSignalBand() {
  return (
    <section id="pressure-signal" className="border-t border-white/[0.06] px-6 py-10 lg:px-12 lg:py-12">
      <div className="mx-auto max-w-7xl">
        <Eyebrow>Start with the decision under pressure.</Eyebrow>
        <div
          className="mt-6 bg-white/[0.022] p-6 lg:p-8"
          style={{ borderLeft: `2px solid ${GOLD}`, borderRight: "1px solid rgba(255,255,255,0.06)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status="Free" />
                <StatusBadge status="Open entry" />
              </div>
              <h2 className="mt-5" style={{ ...serif, fontSize: "2.2rem", lineHeight: 1.05, fontStyle: "italic", color: "rgba(255,255,255,0.92)" }}>
                Free Decision Pressure Signal
              </h2>
              <p className="mt-3 max-w-prose text-[14px] leading-[1.75] text-white/[0.60]">
                Paste the decision you are avoiding or delaying. The system will return a pressure band, missing evidence, and the next admissible move.
              </p>
              <p className="mt-2" style={{ ...mono, fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.45)" }}>
                Free, no account required. 30-second first read.
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {["Pressure band", "Missing evidence", "Authority or ownership risk", "Consequence signal", "Next admissible move"].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <span className="h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: `${GOLD}AA` }} />
                    <span className="text-[12px] text-white/[0.62]">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex min-w-[180px] flex-col gap-3">
              <PrimaryBtn href="/decision-pressure">Get pressure reading</PrimaryBtn>
              <GhostBtn href="/decision-pressure">See where this leads</GhostBtn>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StartHereSection() {
  return (
    <section id="start-here" className="border-t border-white/[0.06] px-6 py-14 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <Eyebrow>Start here</Eyebrow>
          <h2 className="mt-5" style={{ ...serif, color: "rgba(255,255,255,0.90)", fontSize: "clamp(1.9rem, 5vw, 3rem)", lineHeight: 1, fontStyle: "italic" }}>
            Start with the problem you need to solve.
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {intentCards.map((card) => {
            const body = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <span style={{ ...mono, fontSize: "18px", letterSpacing: "0.04em", color: `${GOLD}45`, lineHeight: 1 }}>{card.number}</span>
                  <StatusBadge status={card.status} />
                </div>
                <h3 className="mt-4" style={{ ...serif, color: "rgba(255,255,255,0.90)", fontSize: "1.2rem", lineHeight: 1.1, fontStyle: "italic" }}>
                  {card.title}
                </h3>
                <p className="mt-3 text-[13px] leading-[1.65] text-white/[0.65]">{card.description}</p>
                <div className="mt-auto pt-5">
                  <span
                    className="inline-flex min-h-[40px] items-center gap-2 border px-4 py-2"
                    style={{ ...mono, borderColor: card.href ? `${GOLD}35` : "rgba(255,255,255,0.07)", backgroundColor: card.href ? `${GOLD}0D` : "transparent", color: card.href ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.30)", fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase" }}
                  >
                    {card.cta}
                    {card.href && <ArrowRight className="h-3 w-3" />}
                  </span>
                </div>
              </>
            );
            const cls = "group flex min-h-[250px] flex-col border border-white/[0.075] bg-white/[0.016] p-5 transition-colors duration-150 hover:border-white/[0.13] hover:bg-white/[0.026]";
            return card.href ? (
              <Link key={card.number} href={card.href} className={cls}>{body}</Link>
            ) : (
              <article key={card.number} className={cls}>{body}</article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BoardroomBriefFeature() {
  const briefProduct = CATALOG.boardroom_brief;
  const displayPrice = briefProduct?.displayPrice ?? "From £49";
  return (
    <section id="boardroom-brief-feature" className="border-t border-white/[0.06] px-6 py-14 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <Eyebrow>First paid step</Eyebrow>
        <div className="mt-6 border p-6 lg:p-10" style={{ borderColor: `${GOLD}25`, backgroundColor: `${GOLD}05` }}>
          <div className="grid gap-10 lg:grid-cols-[1.4fr_1fr] lg:items-start">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <StatusBadge status="Open entry" />
                <span
                  className="inline-flex items-center border px-2.5 py-1"
                  style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.14em", textTransform: "uppercase", borderColor: `${GOLD}30`, color: `${GOLD}BB`, backgroundColor: `${GOLD}08` }}
                >
                  {displayPrice}
                </span>
                <span style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)", fontStyle: "italic" }}>
                  Recommended first paid step
                </span>
              </div>

              <h2 className="mt-5" style={{ ...serif, fontSize: "clamp(1.9rem, 4vw, 2.8rem)", lineHeight: 1.02, fontStyle: "italic", color: "rgba(255,255,255,0.92)" }}>
                Boardroom Brief
              </h2>
              <p className="mt-5 max-w-[56ch] text-[15px] leading-[1.8] text-white/[0.58]">
                Generate an early boardroom-readiness brief for one serious decision. The brief identifies likely objections, evidence weaknesses, trade-offs, decision paths, and the next admissible move.
              </p>

              <div className="mt-5">
                <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)" }}>Who it is for</p>
                <p className="mt-1.5 text-[13px] leading-relaxed text-white/[0.65]">
                  Leaders preparing a decision that may face board, investor, client, regulator, or internal challenge.
                </p>
              </div>

              <div className="mt-5">
                <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)" }}>Produces</p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {["Likely objections", "Evidence weaknesses", "Trade-offs", "Decision paths", "Boardroom-readiness status", "Next admissible move"].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-[13px] text-white/[0.62]">
                      <span className="h-1 w-1 shrink-0 rounded-full" style={{ backgroundColor: `${GOLD}70` }} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <p className="mt-5" style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.40)" }}>
                Time: 5–7 minutes
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <PrimaryBtn href="/boardroom-brief" large onClick={() => trackLaunch("products_to_boardroom", "/products")}>Generate a brief</PrimaryBtn>
                <GhostBtn href="/boardroom-brief?sample=true">View sample</GhostBtn>
                <Link href="/diagnostics/executive-reporting"
                  className="inline-flex items-center gap-1.5"
                  style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.50)" }}>
                  Proceed to Executive Reporting
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            <CollapsibleBriefPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

function SupportingLayerCard({
  label,
  copy,
  route,
  boundaryNote,
}: {
  label: string;
  copy: string;
  route: string;
  boundaryNote: string;
}) {
  return (
    <div className="border border-white/[0.06] bg-white/[0.012] p-4 transition-colors hover:border-white/[0.12] hover:bg-white/[0.02]">
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center border px-2 py-0.5"
          style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", borderColor: `${GOLD}30`, color: `${GOLD}AA`, backgroundColor: `${GOLD}08` }}
        >
          {label}
        </span>
      </div>
      <p className="mt-2.5 text-[13px] leading-[1.65] text-white/[0.58]">{copy}</p>
      <div className="mt-3 flex items-center gap-2">
        <Link
          href={route}
          className="group inline-flex items-center gap-1.5 transition-colors hover:text-white/[0.80]"
          style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.60)" }}
        >
          Open
          <ArrowRight className="h-2.5 w-2.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
      <p className="mt-2.5 border-t border-white/[0.04] pt-2.5 text-[11px] leading-[1.5] text-white/[0.35]" style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.10em", lineHeight: 1.5 }}>
        {boundaryNote}
      </p>
    </div>
  );
}

const supportingLayers = [
  {
    label: "Separate product line",
    copy: "Personal mandate, behavioural contradiction, and commitment enforcement.",
    route: "/diagnostics/purpose-alignment",
    boundaryNote: "Not a prerequisite for the corporate decision corridor.",
  },
  {
    label: "Authority lens",
    copy: "Tests authority, mandate, blocker, route, and repair conditions.",
    route: "/diagnostics/constitutional-diagnostic",
    boundaryNote: "Can strengthen Enterprise or Executive Reporting, but does not replace them.",
  },
  {
    label: "Public proof surface",
    copy: "Public tests for decision quality, market signal, and release risk.",
    route: "/foundry",
    boundaryNote: "Low-friction proof surface; deeper governance happens inside the corridor.",
  },
  {
    label: "Continuity console",
    copy: "Governed case console for memory, recommendations, outcomes, and return briefs.",
    route: "/decision-centre",
    boundaryNote: "Available where a case record exists.",
  },
  {
    label: "Evidence memory layer",
    copy: "Carries decisions, evidence, recommendations, and outcomes across eligible surfaces.",
    route: "/decision-pathway",
    boundaryNote: "Supports the estate; not a standalone public product unless explicitly productised.",
  },
];

function PaidCorridorSection() {
  return (
    <section id="paid-corridor" className="border-t border-white/[0.06] px-6 py-14 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <Layers3 className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
              <Eyebrow>Operational Decision Intelligence Corridor</Eyebrow>
            </div>
            <h2 className="mt-5 max-w-[30rem]" style={{ ...serif, color: "rgba(255,255,255,0.90)", fontSize: "clamp(1.9rem, 5vw, 3rem)", lineHeight: 1, fontStyle: "italic" }}>
              The deeper decision corridor
            </h2>
          </div>
          <p className="max-w-[70ch] text-[15px] leading-[1.85] text-white/[0.50] lg:justify-self-end">
            When the decision requires stronger evidence, governance, or execution control, the system moves into the paid corridor. Progression is earned by evidence, not by payment alone.
          </p>
        </div>

        {/* Two-column layout: left = corridor stages, right = supporting layers */}
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:items-start">
          {/* Left rail — paid ODI progression */}
          <div>
            <div className="space-y-0">
              {corridorStages.map((stage, i) => (
                <CorridorStageRow key={stage.id} stage={stage} index={i} isLast={i === corridorStages.length - 1} />
              ))}
            </div>

            <div className="mt-8 border border-white/[0.06] bg-white/[0.012] p-4">
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}65` }}>Boundary</p>
              <p className="mt-2 max-w-[80ch] text-[13px] leading-relaxed text-white/[0.45]">
                Retainer Review Queue is active. Retainer Oversight is not automatically activated and requires readiness review.
              </p>
            </div>
          </div>

          {/* Right rail — adjacent and supporting layers */}
          <div>
            <div className="border border-white/[0.06] bg-white/[0.012] p-4 lg:p-5">
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}80` }}>
                Adjacent and supporting layers
              </p>
              <p className="mt-2.5 text-[12px] leading-[1.7] text-white/[0.48]" style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.08em", lineHeight: 1.7 }}>
                Not every useful surface is a corridor stage. Some products sit beside the corridor. Others support entry, authority testing, evidence memory, or return to the right decision surface.
              </p>
              <div className="mt-5 space-y-3">
                {supportingLayers.map((layer) => (
                  <SupportingLayerCard key={layer.label} {...layer} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-only supporting layers heading */}
        <div className="mt-8 lg:hidden">
          <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}60` }}>
            Supporting layers
          </p>
        </div>
      </div>
    </section>
  );
}

function MarketActivationSection() {
  return (
    <section id="market-activation" className="border-t border-white/[0.06] px-6 py-14 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <Radio className="h-4 w-4" style={{ color: "rgba(147,197,253,0.85)" }} />
              <Eyebrow>Market Activation</Eyebrow>
            </div>
            <h2 className="mt-5 max-w-[30rem]" style={{ ...serif, color: "rgba(255,255,255,0.90)", fontSize: "clamp(1.9rem, 5vw, 3rem)", lineHeight: 1, fontStyle: "italic" }}>
              First-session proof and public activation surfaces.
            </h2>
          </div>
          <p className="max-w-[70ch] text-[15px] leading-[1.85] text-white/[0.52] lg:justify-self-end">
            Low-friction routes that let a buyer inspect the decision infrastructure before entering a paid or governed corridor.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {marketActivationItems.map((item) => (
            <ProductCard key={item.name} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function EnterpriseAndProfessionalSection() {
  return (
    <section id="enterprise" className="border-t border-white/[0.06] px-6 py-14 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Enterprise */}
          <div className="border border-white/[0.075] bg-white/[0.016] p-6">
            <Building2 className="h-5 w-5 mb-4" style={{ color: `${GOLD}AA` }} />
            <Eyebrow>For organisations</Eyebrow>
            <h3 className="mt-4" style={{ ...serif, fontSize: "1.8rem", lineHeight: 1.05, fontStyle: "italic", color: "rgba(255,255,255,0.90)" }}>
              Enterprise pathway
            </h3>
            <p className="mt-3 text-[14px] leading-[1.75] text-white/[0.68]">
              When serious decisions fail because authority, evidence, ownership, and execution are misaligned across the organisation.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <PrimaryBtn href="/enterprise">View Enterprise pathway</PrimaryBtn>
              <GhostBtn href="/enterprise-decision-scan" onClick={() => trackLaunch("enterprise_to_enterprise_scan", "/products")}>Run organisational scan</GhostBtn>
            </div>
          </div>

          {/* Professional */}
          <div className="border border-white/[0.075] bg-white/[0.016] p-6">
            <ClipboardCheck className="h-5 w-5 mb-4" style={{ color: "rgba(251,191,36,0.82)" }} />
            <Eyebrow>For professionals and advisors</Eyebrow>
            <div className="mt-4 flex items-center gap-3">
              <h3 style={{ ...serif, fontSize: "1.8rem", lineHeight: 1.05, fontStyle: "italic", color: "rgba(255,255,255,0.90)" }}>
                Professional access
              </h3>
              <StatusBadge status="Selective access" />
            </div>
            <p className="mt-3 text-[14px] leading-[1.75] text-white/[0.68]">
              Use Decision Infrastructure to challenge, evidence, and govern client decisions.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <PrimaryBtn href="/professionals">Professional access</PrimaryBtn>
              <GhostBtn href="/boardroom-brief">Generate Boardroom Brief</GhostBtn>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function PageEndingSection() {
  return (
    <section className="border-t border-white/[0.06] px-6 py-20 lg:px-12">
      <div className="mx-auto max-w-3xl text-center">
        <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.22em", textTransform: "uppercase", color: `${GOLD}65` }}>Not sure where to start?</p>
        <h2 className="mt-5" style={{ ...serif, fontSize: "clamp(1.9rem, 5vw, 3rem)", lineHeight: 1.05, fontStyle: "italic", color: "rgba(255,255,255,0.90)" }}>
          Start with one serious decision.
        </h2>
        <p className="mx-auto mt-5 max-w-[56ch] text-[15px] leading-[1.85] text-white/[0.52]">
          The system will route you to the right level of scrutiny — from a free pressure signal to boardroom challenge, executive reporting, and governed execution.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <PrimaryBtn href="/decision-pressure" large>Test your decision</PrimaryBtn>
          <GhostBtn href="/boardroom-brief">Generate Boardroom Brief</GhostBtn>
          <Link href="/pricing"
            className="inline-flex items-center gap-1.5"
            style={{ ...mono, fontSize: "8px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(255,255,255,0.50)" }}>
            View pricing and access
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
  return (
    <Layout
      title="Decision Infrastructure Products | Abraham of London"
      description="Explore the decision instruments, assessments, briefings, and governed execution surfaces available across Abraham of London decision infrastructure."
      canonicalUrl="/products"
      fullWidth
      headerTransparent
    >
      <div style={{ backgroundColor: VOID, minHeight: "100vh" }}>
        <StickyActionBar />
        <HeroSection />
        <SectionNav />
        <PressureSignalBand />
        <StartHereSection />
        <BoardroomBriefFeature />
        <PaidCorridorSection />
        <MarketActivationSection />
        <EnterpriseAndProfessionalSection />

        {/* Global Market Intelligence — standalone section */}
        <section id="intelligence" className="border-t border-white/[0.06] px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <div className="mb-8 grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
              <div>
                <div className="flex items-center gap-3">
                  <Gauge className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
                  <Eyebrow>Market Intelligence</Eyebrow>
                </div>
                <h2 className="mt-5 max-w-[30rem]" style={{ ...serif, color: "rgba(255,255,255,0.90)", fontSize: "clamp(1.9rem, 5vw, 3rem)", lineHeight: 1, fontStyle: "italic" }}>
                  Global Market Intelligence
                </h2>
              </div>
              <p className="max-w-[70ch] text-[15px] leading-[1.85] text-white/[0.65] lg:justify-self-end">
                Quarterly market intelligence that reviews prior material calls before issuing the next report.
              </p>
            </div>
            <div className="mb-5 border-l-2 pl-4" style={{ borderColor: `${GOLD}40` }}>
              <p className="text-[13px] leading-relaxed text-white/[0.58]">
                Each quarterly report reviews material calls from the previous quarter before issuing the next. Built for operators who need disciplined market judgement.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <PrimaryBtn href="/artifacts/global-market-outlook-q1-2026-public" onClick={() => trackLaunch("products_to_gmi_outlook", "/products")}>
                View intelligence line
              </PrimaryBtn>
              <GhostBtn href={catalogPath("gmi_q1_2026", "/artifacts/global-market-intelligence-report-q1-2026")} onClick={() => trackLaunch("gmi_outlook_to_full_report", "/products")}>
                View latest report
              </GhostBtn>
            </div>
            <div className="mt-6">
              <InstrumentList items={gmiItems} />
            </div>
          </div>
        </section>

        <div id="instruments">
          <CollapsibleSection title="Governed Decision Instruments" intro="All instruments are live and governed. Each writes to Decision Centre memory.">
            <InstrumentList items={instrumentItems} />
          </CollapsibleSection>
        </div>

        {/* Governed Playbooks — collapsible */}
        <div id="playbooks">
          <CollapsibleSection title="Governed Playbooks" intro="Controlled-release governed methodology runs for execution restoration, alignment audit, and drift detection.">
            <div className="mb-5 border-l-2 pl-4" style={{ borderColor: `${GOLD}40` }}>
              <p className="text-[13px] leading-relaxed text-white/[0.58]">
                Each playbook is a governed methodology run. Access is currently available by request while self-serve checkout is being enabled.
              </p>
            </div>
            <InstrumentList items={playbookItems} />
          </CollapsibleSection>
        </div>

        <div id="purpose">
          <CollapsibleSection title="Purpose Alignment" intro="A separate product line for personal mandate and behavioural enforcement.">
            <div className="mb-5 border-l-2 border-[#FCCD4D]/40 pl-4">
              <p className="text-[13px] leading-relaxed text-white/[0.58]">
                Purpose Alignment may contribute behavioural evidence, but it is not a prerequisite for Operational Decision Intelligence.
              </p>
            </div>
            <InstrumentList items={purposeAlignmentItems} />
          </CollapsibleSection>
        </div>

        <div id="knowledge">
          <CollapsibleSection title="Published Briefs and Knowledge" intro="Briefings, evidence standards, and proof surfaces.">
            <InstrumentList items={knowledgeItems} />
          </CollapsibleSection>
        </div>

        <PageEndingSection />

        {/* Commercial boundary note */}
        <section className="border-t border-white/[0.06] px-6 py-8 lg:px-12">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-5">
            <p className="max-w-[76ch] text-[13px] leading-[1.85] text-white/[0.36]">
              This page explains available, planned, and gated products. Pricing remains the payment and access page. Retainer Oversight is visible only as a gated future or contracted pathway and is not activated from this directory.
            </p>
            <PrimaryBtn href="/pricing">Payment and access</PrimaryBtn>
          </div>
        </section>
      </div>
    </Layout>
  );
}
