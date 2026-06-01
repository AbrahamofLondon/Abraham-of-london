import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Building2,
  ClipboardCheck,
  FileText,
  Gauge,
  Layers3,
  Lock,
  Radio,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import Layout from "@/components/Layout";
import { CATALOG } from "@/lib/commercial/catalog";

const GOLD = "#C9A96E";
const VOID = "rgb(3 3 5)";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

type ProductStatus =
  | "Open entry"
  | "Public sample"
  | "Public instrument"
  | "Paid corridor"
  | "Evidence-gated"
  | "Assisted access"
  | "Preview"
  | "Planned"
  | "Separate line"
  | "Gated";

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

type ProductFamily = {
  id: string;
  eyebrow: string;
  title: string;
  summary: string;
  icon: React.ElementType;
  accent: string;
  items: ProductItem[];
};

const statusStyles: Record<ProductStatus, { color: string; border: string; background: string }> = {
  "Open entry": {
    color: "rgba(110,231,183,0.92)",
    border: "rgba(110,231,183,0.22)",
    background: "rgba(110,231,183,0.06)",
  },
  "Public sample": {
    color: "rgba(255,255,255,0.68)",
    border: "rgba(255,255,255,0.12)",
    background: "rgba(255,255,255,0.035)",
  },
  "Public instrument": {
    color: "rgba(147,197,253,0.90)",
    border: "rgba(147,197,253,0.22)",
    background: "rgba(147,197,253,0.06)",
  },
  "Paid corridor": {
    color: `${GOLD}E6`,
    border: `${GOLD}35`,
    background: `${GOLD}10`,
  },
  "Evidence-gated": {
    color: "rgba(216,180,254,0.90)",
    border: "rgba(216,180,254,0.22)",
    background: "rgba(216,180,254,0.06)",
  },
  "Assisted access": {
    color: "rgba(251,191,36,0.84)",
    border: "rgba(251,191,36,0.22)",
    background: "rgba(251,191,36,0.06)",
  },
  Preview: {
    color: "rgba(255,255,255,0.58)",
    border: "rgba(255,255,255,0.10)",
    background: "rgba(255,255,255,0.025)",
  },
  Planned: {
    color: "rgba(255,255,255,0.35)",
    border: "rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.018)",
  },
  "Separate line": {
    color: "rgba(252,211,77,0.88)",
    border: "rgba(252,211,77,0.20)",
    background: "rgba(252,211,77,0.055)",
  },
  Gated: {
    color: "rgba(255,255,255,0.30)",
    border: "rgba(255,255,255,0.08)",
    background: "rgba(255,255,255,0.012)",
  },
};

function catalogPath(code: keyof typeof CATALOG, fallback: string): string {
  return CATALOG[code]?.successPath || fallback;
}

const productFamilies: ProductFamily[] = [
  {
    id: "market-activation",
    eyebrow: "Market Activation",
    title: "First-session proof and public activation surfaces.",
    summary:
      "Low-friction routes that let a buyer inspect the decision infrastructure before entering a paid or governed corridor.",
    icon: Radio,
    accent: "rgba(147,197,253,0.85)",
    items: [
      {
        name: "Boardroom Brief",
        status: "Preview",
        role: "Public market activation for board-grade framing.",
        answers: "What would a serious decision brief look like before access is purchased?",
        produces: "A preview of structured board-facing decision evidence.",
        accessNote: "Preview surface; not Boardroom Mode activation.",
        alternateHref: "/briefs",
        alternateLabel: "Read brief library",
      },
      {
        name: "Sample Boardroom Dossier",
        status: "Planned",
        role: "Inspectable sample of board-grade output.",
        answers: "What does the dossier format prove and withhold?",
        produces: "A safe sample dossier when the route is available.",
        accessNote: "Planned route: /samples/boardroom-dossier.",
      },
      {
        name: "Scenario Stress Test",
        status: "Planned",
        role: "Standalone scenario pressure test.",
        answers: "How does a decision behave under a defined pressure scenario?",
        produces: "Stress findings when the standalone route is available.",
        accessNote: "Enterprise currently contains the production scenario hooks.",
        alternateHref: "/diagnostics/enterprise-assessment",
        alternateLabel: "Use Enterprise Assessment",
      },
      {
        name: "Quick Decision Health Check",
        status: "Planned",
        role: "Fast public check for decision condition and next move.",
        answers: "Is this decision healthy enough to proceed?",
        produces: "A short health signal and route recommendation.",
        accessNote: "Planned route: /quick-check.",
        alternateHref: "/diagnostics/fast",
        alternateLabel: "Run Fast Diagnostic",
      },
    ],
  },
  {
    id: "paid-corridor",
    eyebrow: "Operational Decision Intelligence Corridor",
    title: "Progressive paid depth for real organisational decisions.",
    summary:
      "The paid corridor moves from team perception divergence to organisational stress architecture to board-grade decision judgement.",
    icon: Layers3,
    accent: GOLD,
    items: [
      {
        name: "Team Assessment",
        status: "Paid corridor",
        role: "Detects whether people agree on the decision.",
        answers: "Do people agree on the decision, owner, blocker, evidence, and execution confidence?",
        produces: "Aggregate-only team divergence findings when at least two respondent records exist.",
        href: "/diagnostics/team-assessment",
        cta: "Start Team Assessment",
        accessNote: "Privacy-safe aggregate output; individual respondent text is not exposed.",
      },
      {
        name: "Enterprise Assessment",
        status: "Paid corridor",
        role: "Tests where the organisation breaks under pressure.",
        answers: "Where do dependencies, exposure, and scenario pressure create failure risk?",
        produces: "Dependency summary, exposure summary, stress findings, and escalation path.",
        href: "/diagnostics/enterprise-assessment",
        cta: "Start Enterprise Assessment",
        accessNote: "Does not issue the final board recommendation.",
      },
      {
        name: "Executive Reporting",
        status: "Paid corridor",
        role: "Converts carried evidence into leadership judgement.",
        answers: "What should leadership decide, on what evidence, with what risk?",
        produces: "Evidence carried forward, options, recommendation thresholding, risk and governance conditions.",
        href: "/diagnostics/executive-reporting",
        cta: "Open Executive Reporting",
        accessNote: "Paid access layer; payment and eligibility are handled on Pricing.",
      },
      {
        name: "Boardroom Mode",
        status: "Evidence-gated",
        role: "Board challenge and adversarial dossier posture.",
        answers: "Is the record strong enough for board-grade challenge?",
        produces: "Boardroom dossier material only when the mode is unlocked.",
        href: "/boardroom",
        cta: "View Boardroom entry",
        accessNote: "Not presented as open self-serve activation.",
      },
      {
        name: "Strategy Room",
        status: "Assisted access",
        role: "Governed execution room for intervention and sequencing.",
        answers: "What intervention sequence should operators run next?",
        produces: "A governed execution path with review posture.",
        href: catalogPath("strategy_room", "/strategy-room"),
        cta: "View Strategy Room",
        accessNote: "Controlled execution layer; not a generic diagnostic.",
      },
      {
        name: "Retainer Review Queue",
        status: "Gated",
        role: "Operator-reviewed readiness for continuing oversight.",
        answers: "Is there enough durable case history to review ongoing oversight?",
        produces: "Review posture only after qualifying evidence exists.",
        accessNote: "No self-serve activation from this page.",
      },
      {
        name: "Retainer Oversight",
        status: "Gated",
        role: "Retained oversight after durable history exists.",
        answers: "Should an account enter recurring governed oversight?",
        produces: "Nothing is activated here; oversight remains gated.",
        accessNote: "Requires durable recommendation and outcome history.",
      },
    ],
  },
  {
    id: "purpose-alignment",
    eyebrow: "Separate Product Line",
    title: "Purpose Alignment remains outside the operational paid corridor.",
    summary:
      "Purpose Alignment examines personal mandate, obligation conflict, behaviour, and integrity drift. It can inform later reporting without becoming a Team or Enterprise stage.",
    icon: Sparkles,
    accent: "rgba(252,211,77,0.88)",
    items: [
      {
        name: "Purpose Alignment",
        status: "Separate line",
        role: "Personal decision audit and mandate alignment reading.",
        answers: "Is the stated mandate aligned with behaviour, obligation, and consequence?",
        produces: "Mandate clarity, drift warning, personal constitution, and next admissible move.",
        href: catalogPath("personal_decision_audit", "/diagnostics/purpose-alignment"),
        cta: "Open Purpose Alignment",
        accessNote: "Separate product line; not an Operational Decision Intelligence corridor stage.",
      },
    ],
  },
  {
    id: "decision-instruments",
    eyebrow: "Decision Instruments",
    title: "Standalone tools for scoring, classifying, and preparing decisions.",
    summary:
      "Focused instruments create fast proof, write to decision memory where available, and can justify escalation into reporting or execution.",
    icon: Gauge,
    accent: "rgba(147,197,253,0.85)",
    items: [
      {
        name: "Decision Signal",
        status: "Open entry",
        role: "Free signal route for first decision classification.",
        answers: "What condition is showing up in this decision?",
        produces: "A lightweight decision signal and recommended next route.",
        href: "/decision-instruments/signal",
        cta: "Run Decision Signal",
      },
      {
        name: "Decision Exposure Instrument",
        status: "Public instrument",
        role: CATALOG.decision_exposure_instrument?.shortDescription || "Measures decision exposure.",
        answers: "What exposure sits behind delay, ambiguity, or wrong action?",
        produces: "Exposure score, risk pattern, and next admissible move.",
        href: catalogPath("decision_exposure_instrument", "/decision-instruments/decision-exposure-instrument/start"),
        cta: "Open instrument",
      },
      {
        name: "Mandate Clarity Framework",
        status: "Public instrument",
        role: CATALOG.mandate_clarity_framework?.shortDescription || "Classifies decision authority.",
        answers: "Who actually has authority, and where is mandate unclear?",
        produces: "Mandate clarity classification and authority implication.",
        href: catalogPath("mandate_clarity_framework", "/decision-instruments/mandate-clarity-framework/start"),
        cta: "Open instrument",
      },
      {
        name: "Execution Risk Index",
        status: "Public instrument",
        role: CATALOG.execution_risk_index?.shortDescription || "Measures execution survivability.",
        answers: "Can the decision survive execution reality?",
        produces: "Execution risk index, weak point, and escalation implication.",
        href: catalogPath("execution_risk_index", "/decision-instruments/execution-risk-index/run"),
        cta: "Open instrument",
      },
    ],
  },
  {
    id: "advisory-continuation",
    eyebrow: "Advisory Continuation",
    title: "Selective routes for cases that need human review or governed continuation.",
    summary:
      "These surfaces sit beyond first-session proof. They should be entered only when the evidence record supports escalation.",
    icon: ClipboardCheck,
    accent: "rgba(251,191,36,0.82)",
    items: [
      {
        name: "Operator Pilot",
        status: "Assisted access",
        role: "Selective governed review for live operator decisions.",
        answers: "Is this case appropriate for a structured pilot intervention?",
        produces: "Assisted review path and next engagement posture.",
        href: "/engagements/operator-pilot",
        cta: "Request review",
      },
      {
        name: "Professional",
        status: "Planned",
        role: "Continuity layer for professionals managing repeat decision work.",
        answers: "How should individual professional decision continuity be packaged?",
        produces: "Professional workspace access when route is available.",
        accessNote: "Planned route: /professionals.",
      },
      {
        name: "Free Trial",
        status: "Planned",
        role: "Controlled trial access to selected proof surfaces.",
        answers: "Can a buyer test enough infrastructure before payment?",
        produces: "Trial access when the commercial route is available.",
        accessNote: "Planned route: /free-trial.",
      },
      {
        name: "Enterprise",
        status: "Planned",
        role: "Organisation access, workspace, seats, and dedicated support.",
        answers: "How should a full organisation enter governed decision infrastructure?",
        produces: "Contracted enterprise access when the route is available.",
        accessNote: "Planned route: /enterprise. Current enterprise assessment remains at /diagnostics/enterprise-assessment.",
        alternateHref: "/enterprise/preview",
        alternateLabel: "View enterprise preview",
      },
    ],
  },
  {
    id: "knowledge-proof",
    eyebrow: "Knowledge And Proof Surfaces",
    title: "Briefings, doctrine, and proof routes that support commercial trust.",
    summary:
      "These routes build category understanding and let buyers inspect the evidence posture behind the products.",
    icon: BookOpen,
    accent: "rgba(255,255,255,0.62)",
    items: [
      {
        name: "Boardroom Brief Library",
        status: "Public sample",
        role: "Market-facing briefings and applied decision intelligence.",
        answers: "What does the system notice in markets and institutions?",
        produces: "Briefings and public evidence artifacts.",
        href: "/briefs",
        cta: "Read briefs",
      },
      {
        name: "Decision Centre",
        status: "Assisted access",
        role: "Case display and continuity surface for decision records.",
        answers: "What evidence and actions are attached to a case?",
        produces: "Case-level continuity where records exist.",
        href: "/decision-centre",
        cta: "Open Decision Centre",
      },
      {
        name: "Pricing",
        status: "Public sample",
        role: "Payment, access, and commercial eligibility page.",
        answers: "What can be bought, requested, or contracted?",
        produces: "Access route clarity, not product discovery.",
        href: "/pricing",
        cta: "View pricing",
      },
    ],
  },
];

const routePrinciples = [
  {
    title: "Homepage",
    body: "Creates category demand and routes visitors into proof.",
  },
  {
    title: "Products",
    body: "Explains what is available, planned, separate, or gated.",
  },
  {
    title: "Pricing",
    body: "Explains payment, access, and qualification.",
  },
  {
    title: "Activation",
    body: "Creates first-session proof through diagnostics and instruments.",
  },
];

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
  const Icon = status === "Gated" ? Lock : status === "Planned" ? FileText : ShieldCheck;
  return (
    <span
      className="inline-flex items-center gap-2 border px-2.5 py-1"
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

function ProductCard({ item }: { item: ProductItem }) {
  const isActionable = Boolean(item.href);
  return (
    <article className="flex min-h-[280px] flex-col border border-white/[0.075] bg-white/[0.016] p-5 transition-colors duration-150 hover:border-white/[0.13] hover:bg-white/[0.026]">
      <div className="flex items-start justify-between gap-4">
        <StatusBadge status={item.status} />
      </div>

      <h3
        className="mt-5"
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

      <p className="mt-3 text-[14px] leading-[1.7] text-white/[0.58]">{item.role}</p>

      <div className="mt-5 space-y-3">
        <div>
          <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
            Answers
          </p>
          <p className="mt-1 text-[13px] leading-[1.65] text-white/[0.48]">{item.answers}</p>
        </div>
        <div>
          <p style={{ ...mono, fontSize: "7.5px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)" }}>
            Produces
          </p>
          <p className="mt-1 text-[13px] leading-[1.65] text-white/[0.48]">{item.produces}</p>
        </div>
      </div>

      {item.accessNote ? (
        <p
          className="mt-5 border-t border-white/[0.06] pt-4"
          style={{
            ...mono,
            fontSize: "8px",
            letterSpacing: "0.12em",
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.30)",
            textTransform: "uppercase",
          }}
        >
          {item.accessNote}
        </p>
      ) : null}

      <div className="mt-auto pt-5">
        {isActionable ? (
          <Link
            href={item.href as string}
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
            {item.cta || "Open"}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : item.alternateHref ? (
          <Link
            href={item.alternateHref}
            className="group inline-flex min-h-[42px] max-w-full items-center gap-2 whitespace-normal border border-white/[0.08] px-4 py-2.5 text-left leading-[1.45] text-white/[0.42] transition-all duration-150 hover:border-white/[0.14] hover:text-white/[0.60]"
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            {item.alternateLabel || "Use adjacent route"}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        ) : (
          <span
            className="inline-flex min-h-[42px] max-w-full items-center whitespace-normal border border-white/[0.07] px-4 py-2.5 text-left leading-[1.45] text-white/[0.28]"
            style={{
              ...mono,
              fontSize: "8px",
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            Not yet available
          </span>
        )}
      </div>
    </article>
  );
}

function ProductFamilySection({ family }: { family: ProductFamily }) {
  const Icon = family.icon;
  return (
    <section id={family.id} className="border-t border-white/[0.06] px-6 py-14 lg:px-12 lg:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-6 lg:grid-cols-[0.78fr_1.22fr] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center border border-white/[0.09] bg-white/[0.02]">
                <Icon className="h-4 w-4" style={{ color: family.accent }} />
              </span>
              <Eyebrow>{family.eyebrow}</Eyebrow>
            </div>
            <h2
              className="mt-5 max-w-[30rem] break-words"
              style={{
                ...serif,
                color: "rgba(255,255,255,0.90)",
                fontSize: "clamp(1.9rem, 5vw, 3rem)",
                lineHeight: 1,
                fontStyle: "italic",
              }}
            >
              {family.title}
            </h2>
          </div>
          <p className="max-w-[70ch] text-[15px] leading-[1.85] text-white/[0.52] lg:justify-self-end">
            {family.summary}
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {family.items.map((item) => (
            <ProductCard key={`${family.id}-${item.name}`} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default function ProductsPage() {
  return (
    <Layout
      title="Decision Infrastructure Products | Abraham of London"
      description="Explore the decision tools, assessments, briefings, and governed execution surfaces available across Abraham of London decision infrastructure."
      canonicalUrl="/products"
      fullWidth
      headerTransparent
    >
      <div style={{ backgroundColor: VOID, minHeight: "100vh" }}>
        <section className="px-6 pb-12 pt-[128px] lg:px-12 lg:pb-16 lg:pt-36">
          <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1fr_0.8fr] lg:items-end">
            <div>
              <Eyebrow>Product Directory</Eyebrow>
              <h1
                className="mt-6 max-w-[52rem] break-words"
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
              <p className="mt-7 max-w-[66ch] text-[16px] leading-[1.85] text-white/[0.58]">
                Explore the decision tools, assessments, briefings, and governed execution surfaces available across the Abraham of London decision infrastructure.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/diagnostics"
                  className="group inline-flex min-h-[46px] items-center gap-2 border px-5 py-3 transition-all duration-150 hover:-translate-y-px"
                  style={{
                    ...mono,
                    borderColor: `${GOLD}50`,
                    backgroundColor: `${GOLD}12`,
                    color: "#F5F5F5",
                    fontSize: "9px",
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                  }}
                >
                  Start with diagnostics
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/pricing"
                  className="group inline-flex min-h-[46px] max-w-full items-center gap-2 whitespace-normal border border-white/[0.09] px-5 py-3 text-left leading-[1.45] text-white/[0.50] transition-all duration-150 hover:-translate-y-px hover:border-white/[0.16] hover:text-white/[0.70]"
                  style={{ ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase" }}
                >
                  View pricing
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a
                  href="#paid-corridor"
                  className="group inline-flex min-h-[46px] max-w-full items-center gap-2 whitespace-normal border border-white/[0.09] px-5 py-3 text-left leading-[1.45] text-white/[0.50] transition-all duration-150 hover:-translate-y-px hover:border-white/[0.16] hover:text-white/[0.70]"
                  style={{ ...mono, fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase" }}
                >
                  Explore paid corridor
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>

            <div className="border border-white/[0.075] bg-white/[0.018] p-5 lg:p-6">
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
                <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
                  Route strategy
                </p>
              </div>
              <div className="mt-5 grid gap-px bg-white/[0.05]">
                {routePrinciples.map((principle) => (
                  <div key={principle.title} className="bg-[#030305] p-4">
                    <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}90` }}>
                      {principle.title}
                    </p>
                    <p className="mt-2 text-[13px] leading-[1.7] text-white/[0.46]">{principle.body}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-white/[0.06] px-6 py-5 lg:px-12">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-3">
            {productFamilies.map((family) => (
              <a
                key={family.id}
                href={`#${family.id}`}
                className="border border-white/[0.08] px-4 py-2.5 text-white/[0.42] transition-colors hover:border-white/[0.15] hover:text-white/[0.64]"
                style={{ ...mono, fontSize: "8px", letterSpacing: "0.15em", textTransform: "uppercase" }}
              >
                {family.eyebrow}
              </a>
            ))}
          </div>
        </section>

        {productFamilies.map((family) => (
          <ProductFamilySection key={family.id} family={family} />
        ))}

        <section className="border-t border-white/[0.06] px-6 py-14 lg:px-12">
          <div className="mx-auto grid max-w-7xl gap-6 border border-white/[0.075] bg-white/[0.018] p-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.2em", textTransform: "uppercase", color: `${GOLD}90` }}>
                Commercial boundary
              </p>
              <p className="mt-3 max-w-[80ch] text-[14px] leading-[1.85] text-white/[0.50]">
                This page explains available, planned, and gated products. Pricing remains the payment and access page. Retainer Oversight is visible only as a gated future or contracted pathway and is not activated from this directory.
              </p>
            </div>
            <Link
              href="/pricing"
              className="group inline-flex min-h-[44px] items-center justify-center gap-2 border px-5 py-3 transition-all duration-150 hover:-translate-y-px"
              style={{
                ...mono,
                borderColor: `${GOLD}40`,
                backgroundColor: `${GOLD}0F`,
                color: "rgba(255,255,255,0.82)",
                fontSize: "8px",
                letterSpacing: "0.16em",
                textTransform: "uppercase",
              }}
            >
              Payment and access
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
