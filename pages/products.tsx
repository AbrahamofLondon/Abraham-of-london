/**
 * pages/products.tsx — Commercial product router for Abraham of London.
 *
 * Not a shop.
 * Not a SaaS catalogue.
 * A governed product map for sovereign decision infrastructure.
 *
 * Current State Alignment:
 * - Phase 7 Shared Capability Memory Bridge
 * - Professional Advisor Console Boundary
 * - Enterprise Decision Spine remains the central gravity well
 *
 * Rules:
 * - /pricing remains the payment/access page.
 * - Retainer Oversight remains gated; no public activation CTA.
 * - Executive Reporting remains review-gated until governance permits activation.
 * - Purpose Alignment remains separate from Operational Decision Intelligence.
 * - No admin/operator routes exposed.
 * - No autonomous-AI framing.
 * - No courtroom-grade or sovereign-finality claims.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  FileText,
  Layers3,
  Lock,
  Radio,
  ShieldCheck,
} from "lucide-react";

import Layout from "@/components/Layout";
import { CATALOG } from "@/lib/commercial/catalog";
// trackLaunch removed — using CustomEvent dispatch instead

// ─── Constants ────────────────────────────────────────────────────────────────

const GOLD = "#C9A96E";

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
  | "By enquiry"
  | "Organisational"
  | "Evidence-gated"
  | "Review-gated"
  | "Gated"
  | "Controlled access"
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function catalogPath(code: keyof typeof CATALOG, fallback: string): string {
  return CATALOG[code]?.successPath || fallback;
}

function trackProductClick(surface: string): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("aol:product-directory-click", {
      detail: {
        surface,
        timestamp: new Date().toISOString(),
      },
    }),
  );
}

// ─── Status styles ────────────────────────────────────────────────────────────

const statusStyles: Record<ProductStatus, { color: string; border: string; background: string }> = {
  Free: {
    color: "rgba(110,231,183,0.92)",
    border: "rgba(110,231,183,0.22)",
    background: "rgba(110,231,183,0.06)",
  },
  "Open entry": {
    color: "rgba(110,231,183,0.92)",
    border: "rgba(110,231,183,0.22)",
    background: "rgba(110,231,183,0.06)",
  },
  Active: {
    color: `${GOLD}E6`,
    border: `${GOLD}35`,
    background: `${GOLD}10`,
  },
  Paid: {
    color: `${GOLD}CC`,
    border: `${GOLD}30`,
    background: `${GOLD}0D`,
  },
  "By enquiry": {
    color: "rgba(251,191,36,0.84)",
    border: "rgba(251,191,36,0.22)",
    background: "rgba(251,191,36,0.06)",
  },
  Organisational: {
    color: "rgba(147,197,253,0.90)",
    border: "rgba(147,197,253,0.22)",
    background: "rgba(147,197,253,0.06)",
  },
  "Evidence-gated": {
    color: "rgba(216,180,254,0.90)",
    border: "rgba(216,180,254,0.22)",
    background: "rgba(216,180,254,0.06)",
  },
  "Review-gated": {
    color: "rgba(148,163,184,0.90)",
    border: "rgba(148,163,184,0.22)",
    background: "rgba(148,163,184,0.06)",
  },
  Gated: {
    color: "rgba(252,165,165,0.65)",
    border: "rgba(252,165,165,0.14)",
    background: "rgba(252,165,165,0.04)",
  },
  "Controlled access": {
    color: "rgba(251,191,36,0.84)",
    border: "rgba(251,191,36,0.22)",
    background: "rgba(251,191,36,0.06)",
  },
  "Selective access": {
    color: "rgba(251,191,36,0.84)",
    border: "rgba(251,191,36,0.22)",
    background: "rgba(251,191,36,0.06)",
  },
  Planned: {
    color: "rgba(255,255,255,0.50)",
    border: "rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.018)",
  },
  Sample: {
    color: "rgba(255,255,255,0.58)",
    border: "rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.025)",
  },
  "Separate line": {
    color: "rgba(252,211,77,0.88)",
    border: "rgba(252,211,77,0.20)",
    background: "rgba(252,211,77,0.055)",
  },
  "Public instrument": {
    color: "rgba(147,197,253,0.90)",
    border: "rgba(147,197,253,0.22)",
    background: "rgba(147,197,253,0.06)",
  },
};

// ─── Data ─────────────────────────────────────────────────────────────────────

const intentCards: IntentCard[] = [
  {
    number: "01",
    title: "I have a decision I am avoiding",
    description:
      "Start with a fast pressure signal. It identifies whether the issue is evidence, authority, execution, or consequence exposure.",
    href: "/decision-pressure",
    cta: "Start free signal",
    status: "Free",
  },
  {
    number: "02",
    title: "I advise clients on decisions",
    description:
      "For advisors, consultants, and fractional operators who need governed client reviews without taking authority over the client.",
    href: "/professionals",
    cta: "View professional access",
    status: "Controlled access",
  },
  {
    number: "03",
    title: "My organisation keeps failing strategically",
    description:
      "Use the enterprise pathway when the problem is structural: repeated drift, unclear ownership, blocked decisions, and weak evidence discipline.",
    href: "/enterprise",
    cta: "View enterprise pathway",
    status: "Organisational",
  },
];

const corridorStages: CorridorStageData[] = [
  {
    id: "team-assessment",
    number: "01",
    name: "Team Assessment",
    status: "Free",
    price: "Free controlled assessment",
    purpose:
      "Tests whether respondents are describing the same decision, owner, blocker, and evidence position.",
    href: "/diagnostics/team-assessment",
    cta: "Start Team Assessment",
  },
  {
    id: "enterprise-assessment",
    number: "02",
    name: "Enterprise Assessment",
    status: "Free",
    price: "Free organisational assessment",
    purpose:
      "Tests organisational dependencies, exposure, authority, evidence, and scenario stress.",
    href: "/diagnostics/enterprise-assessment",
    cta: "Start Enterprise Assessment",
  },
  {
    id: "executive-reporting",
    number: "03",
    name: "Executive Reporting",
    status: "Review-gated",
    price: "Review-gated",
    purpose:
      "Turns carried-forward evidence into board-facing judgement only when governance and evidence thresholds are satisfied.",
    href: undefined,
    cta: "Requires review eligibility",
  },
  {
    id: "boardroom-mode",
    number: "04",
    name: "Boardroom Mode",
    status: "Evidence-gated",
    price: "Paid / evidence-gated",
    purpose:
      "Tests whether executive judgement survives adversarial scrutiny without treating unsupported claims as trusted evidence.",
    href: "/boardroom-mode",
    cta: "View Boardroom Mode",
  },
  {
    id: "strategy-room",
    number: "05",
    name: "Strategy Room",
    status: "Evidence-gated",
    price: "Paid / governed execution",
    purpose:
      "Turns an approved decision into governed execution with ownership, checkpoints, blockers, and feedback.",
    href: catalogPath("strategy_room", "/strategy-room"),
    cta: "View Strategy Room",
  },
  {
    id: "retainer-review-queue",
    number: "06",
    name: "Retainer Review Queue",
    status: "Review-gated",
    price: "Review request",
    purpose:
      "Allows qualifying cases to request retained oversight review once enough durable memory and outcome history exists.",
    href: undefined,
    cta: "Unlocked only where eligible",
  },
  {
    id: "retainer-oversight",
    number: "07",
    name: "Retainer Oversight",
    status: "Gated",
    price: "Custom / readiness-gated",
    purpose:
      "Only available after sufficient durable memory, recurrence evidence, outcome history, and review approval.",
    href: undefined,
    cta: undefined,
  },
];

const marketActivationItems: ProductItem[] = [
  {
    name: "Decision Pressure Signal",
    status: "Free",
    role: "Fast free pressure reading for one consequential decision.",
    answers: "Is this decision under evidence, authority, execution, or consequence pressure?",
    produces:
      "Pressure band, missing evidence, authority risk, consequence signal, and next admissible move.",
    href: "/decision-pressure",
    cta: "Start free signal",
    accessNote: "Free, no account required.",
  },
  {
    name: "Quick Decision Health Check",
    status: "Active",
    role: "Fast public check for decision condition and next move.",
    answers: "Is this decision healthy enough to proceed?",
    produces:
      "Decision condition, key weakness, next admissible move, and recommended route.",
    href: "/quick-check",
    cta: "Start health check",
    accessNote: "Free, no account required. Approximately 2 minutes.",
    alternateHref: "/diagnostics/fast",
    alternateLabel: "Run Fast Diagnostic",
  },
  {
    name: "Scenario Stress Test",
    status: "Active",
    role: "Standalone pressure test for decision quality under a defined scenario.",
    answers: "How does a decision behave under pressure?",
    produces:
      "Pressure finding, likely break point, weakness category, and strengthening recommendation.",
    href: "/scenario-stress-test",
    cta: "Run scenario test",
    accessNote:
      "Free public proof surface. Deeper governance is available inside the paid corridor.",
    alternateHref: "/diagnostics/enterprise-assessment",
    alternateLabel: "Use Enterprise Assessment",
  },
];

const professionalConsoleItems: ProductItem[] = [
  {
    name: "Professional Advisor Console",
    status: "Controlled access",
    role:
      "Controlled workspace for advisors, consultants, and fractional operators working with client decision records.",
    answers:
      "How can a third-party advisor structure client evidence without taking control of the client organisation?",
    produces:
      "Engagement boundaries, advisor-mediated evidence records, review packets, and escalation requests.",
    href: "/professionals",
    cta: "View professional access",
    accessNote:
      "Requires verified access. Advisors can submit evidence and compile briefs, but cannot mutate enterprise ledgers.",
    alternateHref: "/pricing",
    alternateLabel: "View access plans",
  },
  {
    name: "Evidence Shield Intake",
    status: "Evidence-gated",
    role:
      "Containment layer for advisor-submitted or externally supplied decision material.",
    answers:
      "Can this material be safely reviewed, or should it remain quarantined?",
    produces:
      "Sanitized previews, provenance hashes, quarantine references, and review eligibility status.",
    href: undefined,
    cta: undefined,
    accessNote:
      "Runs behind governed evidence-bearing submissions. Not exposed as a standalone public tool.",
  },
  {
    name: "Enterprise Escalation Bridge",
    status: "Review-gated",
    role:
      "Review pathway for advisor-mediated cases that may qualify for enterprise assessment.",
    answers:
      "Is the case mature enough, consented enough, and clean enough to enter enterprise review?",
    produces:
      "Readiness decision, blocked reasons, consent requirement, and recommended next admissible move.",
    href: undefined,
    cta: undefined,
    accessNote:
      "Requires client organisation approval. Does not activate live connectors or create retainer access.",
  },
];

const instrumentItems: InstrumentItem[] = [
  { name: "Decision Signal", status: "Open entry", href: "/decision-instruments/signal" },
  {
    name: "Decision Exposure Instrument",
    status: "Active",
    href: catalogPath(
      "decision_exposure_instrument",
      "/decision-instruments/decision-exposure-instrument/start",
    ),
  },
  {
    name: "Mandate Clarity Framework",
    status: "Active",
    href: catalogPath(
      "mandate_clarity_framework",
      "/decision-instruments/mandate-clarity-framework/start",
    ),
  },
  {
    name: "Execution Risk Index",
    status: "Active",
    href: catalogPath("execution_risk_index", "/decision-instruments/execution-risk-index/run"),
  },
  {
    name: "Escalation Readiness Scorecard",
    status: "Active",
    href: catalogPath(
      "escalation_readiness_scorecard",
      "/decision-instruments/escalation-readiness-scorecard/run",
    ),
  },
  {
    name: "Structural Failure Diagnostic",
    status: "Active",
    href: catalogPath(
      "structural_failure_diagnostic_canvas",
      "/decision-instruments/structural-failure-diagnostic-canvas/run",
    ),
  },
  {
    name: "Team Alignment Gap Map",
    status: "Active",
    href: catalogPath("team_alignment_gap_map", "/decision-instruments/team-alignment-gap-map/run"),
  },
  {
    name: "Governance Drift Detector",
    status: "Active",
    href: catalogPath(
      "governance_drift_detector",
      "/decision-instruments/governance-drift-detector/run",
    ),
  },
  {
    name: "Strategic Priority Stack Builder",
    status: "Active",
    href: catalogPath(
      "strategic_priority_stack_builder",
      "/decision-instruments/strategic-priority-stack-builder/run",
    ),
  },
  {
    name: "Intervention Path Selector",
    status: "Active",
    href: catalogPath(
      "intervention_path_selector",
      "/decision-instruments/intervention-path-selector/start",
    ),
  },
  {
    name: "Board Brief Builder",
    status: "Active",
    href: catalogPath("board_brief_builder", "/decision-instruments/board-brief-builder/run"),
  },
  {
    name: "Operator Decision Pack",
    status: "Active",
    href: catalogPath(
      "operator_decision_pack",
      "/decision-instruments/operator-decision-pack/start",
    ),
  },
  { name: "View all instruments", status: "Active", href: "/decision-instruments" },
];

const purposeAlignmentItems: InstrumentItem[] = [
  {
    name: "Purpose Alignment Diagnostic",
    status: "Separate line",
    href: catalogPath("personal_decision_audit", "/diagnostics/purpose-alignment"),
  },
  { name: "Pattern-Breaker Contract", status: "Planned" },
  { name: "Commitment Verification", status: "Planned" },
  { name: "Behavioural Evidence Bridge", status: "Planned" },
];

const knowledgeItems: InstrumentItem[] = [
  { name: "Published Briefs", status: "Sample", href: "/briefs" },
  { name: "Decision Centre", status: "Selective access", href: "/decision-centre" },
  { name: "Pricing", status: "Sample", href: "/pricing" },
  { name: "Frameworks", status: "Active", href: "/decision-instruments" },
];

const gmiItems: InstrumentItem[] = [
  {
    name: "Global Market Intelligence Report — Q2 2026",
    status: "Active",
    href: catalogPath("gmi_q2_2026", "/artifacts/global-market-intelligence-report-q2-2026"),
  },
  {
    name: "Global Market Intelligence Report — Q1 2026 Archive",
    status: "Sample",
    href: catalogPath("gmi_q1_2026", "/artifacts/global-market-intelligence-report-q1-2026"),
  },
  { name: "Market Intelligence Archive", status: "Active", href: "/intelligence/market" },
];

const playbookItems: InstrumentItem[] = [
  {
    name: "Execution Integrity Protocol",
    status: "Active",
    href: catalogPath("execution_integrity_protocol", "/playbooks/execution-integrity-protocol"),
  },
  {
    name: "The Alignment Audit Playbook",
    status: "Active",
    href: catalogPath("alignment_audit_playbook", "/playbooks/the-alignment-audit-playbook"),
  },
  {
    name: "The Drift Detection Framework",
    status: "Active",
    href: catalogPath("drift_detection_framework", "/playbooks/the-drift-detection-framework"),
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        ...mono,
        fontSize: "9px",
        letterSpacing: "0.24em",
        textTransform: "uppercase",
        color: `${GOLD}88`,
      }}
    >
      {children}
    </p>
  );
}

function StatusBadge({ status }: { status: ProductStatus }) {
  const style = statusStyles[status];

  const Icon =
    status === "Gated" || status === "Review-gated"
      ? Lock
      : status === "Planned"
        ? FileText
        : status === "Free" || status === "Open entry"
          ? Radio
          : ShieldCheck;

  return (
    <span
      className="inline-flex items-center gap-1.5 border px-2.5 py-1"
      style={{
        ...mono,
        color: style.color,
        borderColor: style.border,
        backgroundColor: style.background,
        fontSize: "7.5px",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
      }}
    >
      <Icon className="h-3 w-3" />
      {status}
    </span>
  );
}

function PrimaryBtn({
  href,
  children,
  large,
  surface,
}: {
  href: string;
  children: React.ReactNode;
  large?: boolean;
  surface: string;
}) {
  return (
    <Link
      href={href}
      onClick={() => trackProductClick(surface)}
      className="group inline-flex items-center gap-2 border transition-all duration-150 hover:-translate-y-px"
      style={{
        ...mono,
        borderColor: `${GOLD}50`,
        backgroundColor: `${GOLD}12`,
        color: "#F5F5F5",
        fontSize: "9px",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        minHeight: large ? "52px" : "44px",
        padding: large ? "0 1.5rem" : "0 1.1rem",
      }}
    >
      {children}
      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function GhostBtn({
  href,
  children,
  surface,
}: {
  href: string;
  children: React.ReactNode;
  surface: string;
}) {
  return (
    <Link
      href={href}
      onClick={() => trackProductClick(surface)}
      className="group inline-flex items-center gap-2 border border-white/[0.09] px-5 py-3 transition-all duration-150 hover:-translate-y-px hover:border-white/[0.16]"
      style={{
        ...mono,
        color: "rgba(255,255,255,0.52)",
        fontSize: "9px",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        minHeight: "44px",
      }}
    >
      {children}
      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

function ProductCard({ item }: { item: ProductItem }) {
  const isActionable = Boolean(item.href);

  return (
    <article className="flex min-h-[320px] flex-col border border-white/[0.075] bg-white/[0.016] p-5 transition-colors duration-150 hover:border-white/[0.13] hover:bg-white/[0.026]">
      <StatusBadge status={item.status} />

      <h3
        className="mt-4"
        style={{
          ...serif,
          color: "rgba(255,255,255,0.90)",
          fontSize: "1.35rem",
          lineHeight: 1.05,
          fontStyle: "italic",
        }}
      >
        {item.name}
      </h3>

      <p className="mt-3 text-[13px] leading-[1.7] text-white/[0.68]">{item.role}</p>

      <div className="mt-4 space-y-3">
        <div>
          <p
            style={{
              ...mono,
              fontSize: "7.5px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.38)",
            }}
          >
            Target Context
          </p>
          <p className="mt-1 text-[13px] leading-[1.65] text-white/[0.55]">
            {item.answers}
          </p>
        </div>

        <div>
          <p
            style={{
              ...mono,
              fontSize: "7.5px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.38)",
            }}
          >
            Produces
          </p>
          <p className="mt-1 text-[13px] leading-[1.65] text-white/[0.62]">
            {item.produces}
          </p>
        </div>
      </div>

      {item.accessNote && (
        <p
          className="mt-4 border-t border-white/[0.06] pt-4"
          style={{
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.12em",
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.42)",
            textTransform: "uppercase",
          }}
        >
          {item.accessNote}
        </p>
      )}

      <div className="mt-auto flex flex-wrap gap-3 pt-5">
        {isActionable ? (
          <Link
            href={item.href as string}
            onClick={() => trackProductClick(item.name)}
            className="group inline-flex min-h-[42px] items-center gap-2 border px-4 py-2.5 transition-all duration-150 hover:-translate-y-px"
            style={{
              ...mono,
              borderColor: `${GOLD}35`,
              backgroundColor: `${GOLD}0D`,
              color: "rgba(255,255,255,0.82)",
              fontSize: "8px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            {item.cta || "Open surface"}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <span
            className="inline-flex min-h-[42px] items-center border border-white/[0.07] px-4 py-2.5 text-white/[0.25]"
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Gated by readiness
          </span>
        )}

        {item.alternateHref && (
          <Link
            href={item.alternateHref}
            onClick={() => trackProductClick(`${item.name}: alternate`)}
            className="group inline-flex min-h-[42px] max-w-full items-center gap-2 whitespace-normal border border-white/[0.08] px-4 py-2.5 text-left leading-[1.45] text-white/[0.42] transition-all duration-150 hover:border-white/[0.14] hover:text-white/[0.60]"
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            {item.alternateLabel || "Adjacent route"}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>
    </article>
  );
}

function StickyActionBar() {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setVisible(window.scrollY > 520);
    window.addEventListener("scroll", handler, { passive: true });
    handler();

    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{
        backgroundColor: "rgba(3,3,5,0.96)",
        borderTop: `1px solid ${GOLD}22`,
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3 lg:px-12">
        <p
          style={{
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.50)",
          }}
        >
          Decision pressure requires a route.
        </p>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/decision-pressure"
            onClick={() => trackProductClick("sticky_decision_pressure")}
            className="group inline-flex items-center gap-2 border px-4 py-2 transition-all hover:-translate-y-px"
            style={{
              ...mono,
              borderColor: `${GOLD}45`,
              backgroundColor: `${GOLD}10`,
              color: "#F5F5F5",
              fontSize: "8px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Start free pressure signal
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>

          <Link
            href="/professionals"
            onClick={() => trackProductClick("sticky_professionals")}
            className="inline-flex items-center gap-2 border border-white/[0.10] px-4 py-2 text-white/[0.50] transition-all hover:-translate-y-px hover:border-white/[0.18] hover:text-white/[0.72]"
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            Professional access
          </Link>
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="border-t border-white/[0.06]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-5 text-left transition-colors hover:bg-white/[0.012] lg:px-12"
      >
        <div>
          <p
            style={{
              ...mono,
              fontSize: "9px",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: `${GOLD}90`,
            }}
          >
            {title}
          </p>
          <p className="mt-1 text-[13px] text-white/[0.55]">{intro}</p>
        </div>

        {open ? (
          <ChevronUp className="h-4 w-4 shrink-0 text-white/30" />
        ) : (
          <ChevronDown className="h-4 w-4 shrink-0 text-white/30" />
        )}
      </button>

      {open && <div className="px-6 pb-10 lg:px-12">{children}</div>}
    </div>
  );
}

function InstrumentList({ items }: { items: InstrumentItem[] }) {
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.name}
          className="flex items-center justify-between gap-3 border border-white/[0.06] bg-white/[0.012] px-4 py-3"
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <StatusBadge status={item.status} />

            {item.href ? (
              <Link
                href={item.href}
                onClick={() => trackProductClick(item.name)}
                className="truncate text-white/[0.78] transition-colors hover:text-white/[0.90]"
                style={{ ...mono, fontSize: "8px", letterSpacing: "0.08em" }}
              >
                {item.name}
              </Link>
            ) : (
              <span
                className="truncate text-white/[0.38]"
                style={{ ...mono, fontSize: "8px", letterSpacing: "0.08em" }}
              >
                {item.name}
              </span>
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
    {
      label: "Likely objections",
      sample:
        "The decision lacks an identified authority holder. No named party has confirmed approval capacity before the deadline.",
    },
    {
      label: "Evidence weaknesses",
      sample:
        "Consequence of inaction is described but not quantified. Leadership will require a cost-of-delay estimate before approving escalation.",
    },
    {
      label: "Trade-offs",
      sample:
        "Acting now preserves optionality. Delaying past the next review window may narrow available remedies.",
    },
    {
      label: "Next admissible move",
      sample:
        "Identify the approval authority and present the evidence basis before the next committee date.",
    },
  ];

  return (
    <div className="border border-white/[0.08] bg-white/[0.01]">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-white/[0.015]"
      >
        <div>
          <p
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: `${GOLD}80`,
            }}
          >
            What a board-facing brief shows
          </p>
          <p className="mt-1 text-[11px] text-white/[0.35]">
            Sample structure using fictional demonstration data.
          </p>
        </div>

        {open ? (
          <ChevronUp className="h-4 w-4 text-white/30" />
        ) : (
          <ChevronDown className="h-4 w-4 text-white/30" />
        )}
      </button>

      {open && (
        <div className="space-y-4 border-t border-white/[0.06] p-4">
          {previewSections.map((section) => (
            <div key={section.label}>
              <p
                style={{
                  ...mono,
                  fontSize: "7.5px",
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                  color: `${GOLD}70`,
                }}
              >
                {section.label}
              </p>

              <p
                className="mt-1 text-[12px] leading-relaxed text-white/[0.42]"
                style={{ ...serif, fontStyle: "italic" }}
              >
                {section.sample}
              </p>
            </div>
          ))}

          <p
            className="border-t border-white/[0.04] pt-3"
            style={{
              ...mono,
              fontSize: "7px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.32)",
            }}
          >
            Demonstration structure only. Not legal advice. Not a guarantee of outcome.
          </p>
        </div>
      )}
    </div>
  );
}

function CorridorStageRow({
  stage,
  isLast,
}: {
  stage: CorridorStageData;
  index: number;
  isLast: boolean;
}) {
  const isGated = stage.status === "Gated" || stage.status === "Review-gated";
  const dimmed = stage.status === "Gated";

  return (
    <div className="relative flex">
      <div className="flex w-12 shrink-0 flex-col items-center">
        <div
          className="relative z-10 flex h-8 w-8 items-center justify-center border"
          style={{
            borderColor: dimmed ? "rgba(255,255,255,0.06)" : `${GOLD}28`,
            backgroundColor: dimmed ? "rgba(255,255,255,0.008)" : `${GOLD}08`,
          }}
        >
          <span
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.08em",
              color: dimmed ? "rgba(255,255,255,0.35)" : `${GOLD}88`,
            }}
          >
            {stage.number}
          </span>
        </div>

        {!isLast && <div className="w-px flex-1 bg-white/[0.06]" style={{ minHeight: "28px" }} />}
      </div>

      <div className="flex-1 pb-6 pl-4 pt-1">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge status={stage.status} />
          <span
            style={{
              ...mono,
              fontSize: "7.5px",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.40)",
            }}
          >
            {stage.price}
          </span>
        </div>

        <h3
          className="mt-2"
          style={{
            ...serif,
            fontSize: "1.35rem",
            lineHeight: 1.1,
            fontStyle: "italic",
            color: dimmed ? "rgba(255,255,255,0.50)" : "rgba(255,255,255,0.86)",
          }}
        >
          {stage.name}
        </h3>

        <p
          className="mt-1.5 max-w-[60ch] text-[13px] leading-relaxed"
          style={{
            color: dimmed ? "rgba(255,255,255,0.38)" : "rgba(255,255,255,0.62)",
          }}
        >
          {stage.purpose}
        </p>

        <div className="mt-3">
          {stage.cta && stage.href ? (
            <Link
              href={stage.href}
              onClick={() => trackProductClick(stage.name)}
              className="group inline-flex items-center gap-2 border px-3 py-2 transition-all hover:-translate-y-px"
              style={{
                ...mono,
                borderColor: `${GOLD}30`,
                backgroundColor: `${GOLD}08`,
                color: "rgba(255,255,255,0.72)",
                fontSize: "8px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
              }}
            >
              {stage.cta}
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          ) : stage.cta ? (
            <span
              className="inline-flex items-center gap-2"
              style={{
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: isGated ? "rgba(255,255,255,0.34)" : "rgba(255,255,255,0.42)",
              }}
            >
              <Lock className="h-3 w-3" />
              {stage.cta}
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-2"
              style={{
                ...mono,
                fontSize: "8px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.32)",
              }}
            >
              <Lock className="h-3 w-3" />
              Locked readiness boundary
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page Sections ────────────────────────────────────────────────────────────

function SectionNav() {
  const links = [
    { href: "#routing", label: "Find your route" },
    { href: "#start-here", label: "Start here" },
    { href: "#board-brief", label: "Board brief" },
    { href: "#paid-corridor", label: "Enterprise corridor" },
    { href: "#professionals", label: "Advisor Console" },
    { href: "#market-activation", label: "Public signals" },
    { href: "#enterprise", label: "Enterprise" },
    { href: "#intelligence", label: "Market intelligence" },
    { href: "#instruments", label: "Instruments" },
    { href: "#playbooks", label: "Playbooks" },
    { href: "#purpose", label: "Purpose alignment" },
    { href: "#knowledge", label: "Knowledge" },
  ];

  return (
    <section className="border-y border-white/[0.06] px-6 py-4 lg:px-12">
      <div className="mx-auto flex max-w-7xl flex-wrap gap-2">
        {links.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="border border-white/[0.08] px-4 py-2 text-white/[0.55] transition-colors hover:border-white/[0.15] hover:text-white/[0.78]"
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.14em",
              textTransform: "uppercase",
            }}
          >
            {link.label}
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
              className="mt-6 max-w-[54rem] break-words"
              style={{
                ...serif,
                color: "#F5F5F5",
                fontSize: "clamp(2.7rem, 8vw, 5.6rem)",
                lineHeight: 0.92,
                fontStyle: "italic",
              }}
            >
              Decision Infrastructure Products
            </h1>

            <p className="mt-7 max-w-[68ch] text-[16px] leading-[1.85] text-white/[0.58]">
              Start with the pressure you can name. Abraham of London routes the decision into the right
              layer of scrutiny: public signal, professional review, enterprise assessment, governed
              execution, or gated retainer oversight.
            </p>

            <p
              className="mt-3 max-w-[62ch]"
              style={{
                ...mono,
                fontSize: "9px",
                letterSpacing: "0.08em",
                color: "rgba(255,255,255,0.36)",
              }}
            >
              The estate is organised around one principle: every surface may begin a case; only
              evidence-governed progression may deepen one.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <PrimaryBtn href="/decision-pressure" large surface="hero_decision_pressure">
                Start free pressure signal
              </PrimaryBtn>

              <GhostBtn href="/professionals" surface="hero_professionals">
                I advise clients
              </GhostBtn>

              <Link
                href="/enterprise"
                onClick={() => trackProductClick("hero_enterprise")}
                className="inline-flex items-center gap-1.5 px-4 text-white/[0.45] transition-colors hover:text-white/[0.80]"
                style={{
                  ...mono,
                  fontSize: "8px",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                View Enterprise Pathway
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="border border-white/[0.06] bg-white/[0.01] p-6 lg:mt-6">
            <h2
              style={{
                ...mono,
                fontSize: "9px",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: "#F5F5F5",
              }}
            >
              Platform constraints
            </h2>

            <ul className="mt-4 space-y-3.5 text-[13px] text-white/[0.52]">
              <li className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400/70" />
                <span>
                  <strong>Authority remains with the client.</strong> Advisor and system flows preserve{" "}
                  <code style={mono}>ΔAuthority = 0</code>.
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400/70" />
                <span>
                  <strong>Durable memory requires consent.</strong> Public signals do not become permanent
                  case memory by default.
                </span>
              </li>

              <li className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-400/70" />
                <span>
                  <strong>Evidence can be quarantined.</strong> Unsafe material is isolated behind safe
                  previews, hashes, and review boundaries.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function RoutingSection() {
  return (
    <section id="routing" className="border-t border-white/[0.06] px-6 py-16 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <Eyebrow>Three entry paths</Eyebrow>

        <h2
          className="mt-4 max-w-2xl"
          style={{
            ...serif,
            color: "rgba(255,255,255,0.90)",
            fontSize: "2.2rem",
            lineHeight: 1.05,
          }}
        >
          Choose the route that matches the pressure you are carrying.
        </h2>

        <div className="mt-12 grid gap-4 lg:grid-cols-3">
          {intentCards.map((card) => (
            <div
              key={card.number}
              className="flex min-h-[260px] flex-col border border-white/[0.06] bg-white/[0.01] p-6 transition-colors hover:border-white/[0.12]"
            >
              <div className="flex items-center justify-between">
                <span style={{ ...mono, fontSize: "11px", color: `${GOLD}66` }}>
                  {card.number}
                </span>
                <StatusBadge status={card.status} />
              </div>

              <h3
                className="mt-6"
                style={{
                  ...serif,
                  color: "#F5F5F5",
                  fontSize: "1.55rem",
                  fontStyle: "italic",
                  lineHeight: 1.05,
                }}
              >
                {card.title}
              </h3>

              <p className="mt-3 text-[13px] leading-relaxed text-white/[0.52]">
                {card.description}
              </p>

              <div className="mt-auto pt-8">
                {card.href ? (
                  <Link
                    href={card.href}
                    onClick={() => trackProductClick(card.title)}
                    className="group inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[#F5F5F5]"
                    style={mono}
                  >
                    {card.cta}
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ) : (
                  <span className="text-[10px] uppercase tracking-wider text-white/[0.25]" style={mono}>
                    {card.cta}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StartHereSection() {
  const primaryItem = marketActivationItems.find(
    (item) => item.name === "Decision Pressure Signal",
  );

  if (!primaryItem) {
    return null;
  }

  return (
    <section
      id="start-here"
      className="border-t border-white/[0.06] bg-white/[0.005] px-6 py-16 lg:px-12 lg:py-24"
    >
      <div className="mx-auto max-w-4xl">
        <div className="text-center">
          <StatusBadge status={primaryItem.status} />

          <h2
            className="mt-4"
            style={{
              ...serif,
              color: "#F5F5F5",
              fontSize: "3rem",
              fontStyle: "italic",
            }}
          >
            {primaryItem.name}
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-white/[0.60]">
            {primaryItem.role} {primaryItem.answers}
          </p>

          <div className="mx-auto mt-6 max-w-md border border-white/[0.05] bg-white/[0.01] p-4 text-left">
            <p
              style={{
                ...mono,
                fontSize: "7.5px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: `${GOLD}80`,
              }}
            >
              Produces
            </p>
            <p className="mt-1 text-[13px] text-white/[0.50]">{primaryItem.produces}</p>
          </div>

          <div className="mt-8">
            <PrimaryBtn href={primaryItem.href || "#"} large surface="start_here_decision_pressure">
              {primaryItem.cta}
            </PrimaryBtn>
          </div>

          <p className="mt-3 text-[11px] text-white/[0.30]" style={mono}>
            {primaryItem.accessNote}
          </p>
        </div>
      </div>
    </section>
  );
}

function BoardBriefSection() {
  return (
    <section id="board-brief" className="border-t border-white/[0.06] px-6 py-16 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <StatusBadge status="Evidence-gated" />

            <h2
              className="mt-4"
              style={{
                ...serif,
                color: "#F5F5F5",
                fontSize: "2.8rem",
                lineHeight: 1.05,
                fontStyle: "italic",
              }}
            >
              Board-facing decision preparation
            </h2>

            <p className="mt-6 text-[15px] leading-relaxed text-white/[0.62]">
              Use this when a serious decision needs objections, evidence weaknesses, trade-offs, and
              next admissible moves before it is presented to leadership.
            </p>

            <p className="mt-4 text-[13px] leading-relaxed text-white/[0.45]">
              This is not a guarantee of approval and not legal advice. It is a structured preparation
              layer for leadership scrutiny.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <PrimaryBtn
                href={catalogPath("board_brief_builder", "/decision-instruments/board-brief-builder/run")}
                surface="board_brief_builder"
              >
                Use Board Brief Builder
              </PrimaryBtn>

              <GhostBtn href="/decision-pressure" surface="board_brief_pressure_signal">
                Start with pressure signal
              </GhostBtn>
            </div>
          </div>

          <div>
            <CollapsibleBriefPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

function PaidCorridorSection() {
  return (
    <section
      id="paid-corridor"
      className="border-t border-white/[0.06] bg-white/[0.005] px-6 py-16 lg:px-12 lg:py-24"
    >
      <div className="mx-auto max-w-5xl">
        <div className="text-center">
          <Eyebrow>Enterprise Decision Spine</Eyebrow>

          <h2
            className="mt-3"
            style={{
              ...serif,
              color: "#F5F5F5",
              fontSize: "2.5rem",
            }}
          >
            The governed corridor from signal to oversight.
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-[14px] text-white/[0.50]">
            As evidence hardens, a decision can move through progressive governance spaces. Unsupported,
            unsafe, or unconsented records cannot enter retained oversight.
          </p>
        </div>

        <div className="mt-12 space-y-1">
          {corridorStages.map((stage, index) => (
            <CorridorStageRow
              key={stage.id}
              stage={stage}
              index={index}
              isLast={index === corridorStages.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ProfessionalConsoleSection() {
  return (
    <section id="professionals" className="border-t border-white/[0.06] px-6 py-16 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <div className="border border-white/[0.08] bg-white/[0.01] p-6 lg:p-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Eyebrow>Phase 7 Controlled Access Foundation</Eyebrow>

              <h2
                className="mt-2"
                style={{
                  ...serif,
                  color: "#F5F5F5",
                  fontSize: "2.2rem",
                  fontStyle: "italic",
                }}
              >
                Professional Advisor Console
              </h2>

              <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/[0.55]">
                For professional advisors who need to work with client decision evidence while preserving
                client authority, client consent, cross-client isolation, and review boundaries.
              </p>
            </div>

            <StatusBadge status="Controlled access" />
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {professionalConsoleItems.map((item) => (
              <ProductCard key={item.name} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function MarketActivationSection() {
  const items = marketActivationItems.slice(1);

  return (
    <section id="market-activation" className="border-t border-white/[0.06] px-6 py-16 lg:px-12 lg:py-24">
      <div className="mx-auto max-w-7xl">
        <Eyebrow>Public proof surfaces</Eyebrow>

        <h2
          className="mt-3"
          style={{
            ...serif,
            color: "#F5F5F5",
            fontSize: "2rem",
          }}
        >
          Start small before entering a governed workspace.
        </h2>

        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-white/[0.45]">
          These public surfaces help users understand the pressure around a decision without forcing
          premature commitment into a deeper workspace.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {items.map((item) => (
            <ProductCard key={item.name} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

function EnterpriseSection() {
  return (
    <section
      id="enterprise"
      className="border-t border-white/[0.06] bg-white/[0.005] px-6 py-16 lg:px-12 lg:py-24"
    >
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
          <div>
            <StatusBadge status="Organisational" />

            <h2
              className="mt-4"
              style={{
                ...serif,
                color: "#F5F5F5",
                fontSize: "2.6rem",
              }}
            >
              Enterprise diagnostic infrastructure
            </h2>

            <p className="mt-4 text-[15px] leading-relaxed text-white/[0.55]">
              For organisations where the issue is no longer one decision, but recurring drift, weak
              authority, unclear evidence, or repeated execution breakdown.
            </p>

            <div className="mt-6 space-y-2 text-[13px] text-white/[0.48]">
              <p>• Maps multi-respondent inputs into governed review structures.</p>
              <p>• Identifies authority gaps, evidence weaknesses, and strategic drift before capital is committed.</p>
              <p>• Creates a route toward retained oversight only where durable memory and review thresholds exist.</p>
            </div>

            <div className="mt-8">
              <PrimaryBtn href="/enterprise" surface="enterprise_protocol">
                View Enterprise Pathway
              </PrimaryBtn>
            </div>
          </div>

          <div className="border border-white/[0.06] bg-white/[0.01] p-6">
            <span
              style={{
                ...mono,
                fontSize: "8px",
                color: `${GOLD}77`,
              }}
              className="uppercase tracking-wider"
            >
              Enterprise includes
            </span>

            <ul className="mt-4 space-y-3 text-[13px] text-white/[0.60]" style={mono}>
              <li className="flex items-center gap-2 text-[11px]">
                <Layers3 className="h-3.5 w-3.5 text-white/40" />
                Cross-tenant isolation rules
              </li>

              <li className="flex items-center gap-2 text-[11px]">
                <Building2 className="h-3.5 w-3.5 text-white/40" />
                Multi-stakeholder decision mapping
              </li>

              <li className="flex items-center gap-2 text-[11px]">
                <ClipboardCheck className="h-3.5 w-3.5 text-white/40" />
                Evidence-bounded reporting
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function CollapsibleCatalogues() {
  return (
    <section className="border-t border-white/[0.06] bg-black">
      <div id="intelligence">
        <CollapsibleSection
          title="Market Intelligence"
          intro="Quarterly market intelligence and falsification-aware reporting frameworks."
        >
          <InstrumentList items={gmiItems} />
        </CollapsibleSection>
      </div>

      <div id="instruments">
        <CollapsibleSection
          title="Decision Instruments"
          intro="Focused frameworks for pressure, exposure, mandate, execution, and drift."
        >
          <InstrumentList items={instrumentItems} />
        </CollapsibleSection>
      </div>

      <div id="playbooks">
        <CollapsibleSection
          title="Execution Playbooks"
          intro="Structured playbooks for decision discipline, alignment, drift detection, and execution repair."
        >
          <InstrumentList items={playbookItems} />
        </CollapsibleSection>
      </div>

      <div id="purpose">
        <CollapsibleSection
          title="Purpose Alignment"
          intro="A separate personal alignment track. It does not share the same logic as enterprise decision governance."
        >
          <InstrumentList items={purposeAlignmentItems} />
        </CollapsibleSection>
      </div>

      <div id="knowledge">
        <CollapsibleSection
          title="Knowledge & Framework Directory"
          intro="Public definitions, frameworks, methodology notes, and access routes."
        >
          <InstrumentList items={knowledgeItems} />
        </CollapsibleSection>
      </div>
    </section>
  );
}

// ─── Master Page Component ───────────────────────────────────────────────────

export default function ProductsPage() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;

    window.dispatchEvent(
      new CustomEvent("aol:product-directory-view", {
        detail: {
          timestamp: new Date().toISOString(),
        },
      }),
    );
  }, []);

  return (
    <Layout>
      <Head>
        <title>Decision Infrastructure Products | Abraham of London</title>
        <meta
          name="description"
          content="Explore Abraham of London decision infrastructure products: public pressure signals, professional advisor access, enterprise assessment, market intelligence, instruments, playbooks, and gated oversight pathways."
        />
      </Head>

      <div className="min-h-screen bg-[#030305] text-white antialiased selection:bg-[#C9A96E]/30 selection:text-white">
        <HeroSection />
        <SectionNav />
        <RoutingSection />
        <StartHereSection />
        <BoardBriefSection />
        <PaidCorridorSection />
        <ProfessionalConsoleSection />
        <MarketActivationSection />
        <EnterpriseSection />
        <CollapsibleCatalogues />
        <StickyActionBar />
      </div>
    </Layout>
  );
}