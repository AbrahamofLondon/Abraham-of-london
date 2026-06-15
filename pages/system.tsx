import * as React from "react";
import Link from "next/link";
import { ArrowRight, Radar, Layers3, AlertTriangle, Crosshair, GitBranch, Brain } from "lucide-react";

import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const VOID = "rgb(3 3 5)";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

type Stage = {
  n: string;
  title: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  body: string;
};

// The architecture, expressed as governed stages — not a feature list.
const STAGES: Stage[] = [
  {
    n: "01",
    title: "Signal Discovery",
    icon: Radar,
    body: "Decision pressure is detected before it hardens into a forced choice. A public signal can begin a case; nothing is assumed beyond what the evidence carries.",
  },
  {
    n: "02",
    title: "Structural Recognition",
    icon: Layers3,
    body: "The underlying structure of the decision is named — the contradiction, the ownership ambiguity, and where authority is actually held.",
  },
  {
    n: "03",
    title: "Consequence Realization",
    icon: AlertTriangle,
    body: "The cost of acting and not acting is made explicit, with claims carried at their real confidence posture rather than as certainty.",
  },
  {
    n: "04",
    title: "Intervention Readiness",
    icon: Crosshair,
    body: "Escalation readiness is assessed. The environment escalates only when evidence and consent justify it — not on demand.",
  },
  {
    n: "05",
    title: "Execution Governance",
    icon: GitBranch,
    body: "Where intervention is warranted, execution is governed: moves are recorded, contradictions tracked, and authority remains with the client throughout.",
  },
  {
    n: "06",
    title: "Institutional Intelligence",
    icon: Brain,
    body: "Context compounds across sessions and reports. The institution enters an intelligence relationship, not a one-off assessment.",
  },
];

type Surface = {
  title: string;
  href: string;
  stage: string;
  body: string;
  gated?: boolean;
};

// How the stages connect to real surfaces. Each href points to an existing route.
const SURFACES: Surface[] = [
  { title: "Decision Pressure Signal", href: "/diagnostics/fast", stage: "Signal Discovery", body: "A first read on where decision pressure is building." },
  { title: "Fast Diagnostic", href: "/diagnostics/fast", stage: "Structural Recognition", body: "Identify the decision fracture, the required move, and a checkpoint." },
  { title: "Enterprise Assessment", href: "/diagnostics/enterprise-assessment", stage: "Consequence Realization", body: "Expose evidence gaps, ownership ambiguity, and execution risk across stakeholders." },
  { title: "Decision Centre", href: "/decision-centre", stage: "Intervention Readiness", body: "Hold governed cases, durable memory, and escalation readiness in one place." },
  { title: "Strategy Room", href: "/strategy-room", stage: "Execution Governance", body: "Move serious work into a controlled execution sequence when the record earns it." },
  { title: "Professional Advisor Console", href: "/professionals", stage: "Execution Governance", body: "Advisor-mediated evidence and review-brief preparation, with authority delta = 0." },
  { title: "Global Market Intelligence", href: "/offers/global-market-intelligence-q2", stage: "Institutional Intelligence", body: "Quarterly macro-context that informs decisions without dictating them." },
  { title: "Retainer Oversight", href: "/oversight", stage: "Institutional Intelligence", body: "Contracted continuity — gated until durable memory and review approval justify it.", gated: true },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ ...mono, fontSize: "9px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}88` }}>
      {children}
    </p>
  );
}

export default function SystemPage() {
  return (
    <Layout
      title="The System | Abraham of London"
      description="Governed decision infrastructure for governing under uncertainty — a governed intelligence environment, not a chatbot or SaaS dashboard."
      canonicalUrl="/system"
      fullWidth
      headerTransparent
    >
      <div style={{ backgroundColor: VOID, minHeight: "100vh" }}>
        {/* Hero */}
        <section className="px-6 pb-14 pt-[128px] lg:px-12 lg:pb-16 lg:pt-36">
          <div className="mx-auto max-w-7xl">
            <Eyebrow>The system</Eyebrow>
            <h1
              className="mt-6 max-w-[60rem]"
              style={{ ...serif, color: "#F5F5F5", fontSize: "clamp(2.4rem, 7vw, 5rem)", lineHeight: 0.96, fontStyle: "italic" }}
            >
              Decision infrastructure for governing under uncertainty.
            </h1>
            <p className="mt-7 max-w-[70ch] text-[16px] leading-[1.85] text-white/[0.60]">
              A governed intelligence environment — not a chatbot or SaaS dashboard. Every surface may
              begin a case; only evidence-governed progression may deepen one. Authority remains with the
              client: the system compounds context, not authority.
            </p>
          </div>
        </section>

        {/* Stages */}
        <section className="border-y border-white/[0.06] px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <Eyebrow>Architecture</Eyebrow>
            <h2
              className="mt-5 mb-9 max-w-[40rem]"
              style={{ ...serif, color: "rgba(255,255,255,0.90)", fontSize: "clamp(1.9rem, 5vw, 3rem)", lineHeight: 1, fontStyle: "italic" }}
            >
              Six governed stages, not a feature list.
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {STAGES.map((s) => {
                const Icon = s.icon;
                return (
                  <article key={s.n} className="flex min-h-[220px] flex-col border border-white/[0.075] bg-white/[0.016] p-5">
                    <div className="flex items-center justify-between">
                      <span style={{ ...mono, fontSize: "8px", letterSpacing: "0.18em", color: `${GOLD}90` }}>{s.n}</span>
                      <Icon className="h-4 w-4" style={{ color: `${GOLD}AA` }} />
                    </div>
                    <h3 className="mt-5" style={{ ...serif, color: "rgba(255,255,255,0.88)", fontSize: "1.3rem", lineHeight: 1.1, fontStyle: "italic" }}>
                      {s.title}
                    </h3>
                    <p className="mt-3 text-[13px] leading-[1.72] text-white/[0.52]">{s.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Surfaces */}
        <section className="px-6 py-14 lg:px-12 lg:py-16">
          <div className="mx-auto max-w-7xl">
            <Eyebrow>How the stages connect</Eyebrow>
            <h2
              className="mt-5 mb-9 max-w-[40rem]"
              style={{ ...serif, color: "rgba(255,255,255,0.90)", fontSize: "clamp(1.9rem, 5vw, 3rem)", lineHeight: 1, fontStyle: "italic" }}
            >
              The surfaces of the environment.
            </h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {SURFACES.map((surface) => (
                <Link
                  key={surface.title}
                  href={surface.href}
                  className="group flex min-h-[200px] flex-col border border-white/[0.075] bg-white/[0.016] p-5 transition-colors hover:border-white/[0.16]"
                >
                  <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.14em", textTransform: "uppercase", color: `${GOLD}80` }}>
                    {surface.stage}
                  </span>
                  <h3 className="mt-4 flex items-center gap-2" style={{ ...serif, color: "rgba(255,255,255,0.88)", fontSize: "1.18rem", lineHeight: 1.1, fontStyle: "italic" }}>
                    {surface.title}
                  </h3>
                  {surface.gated && (
                    <span className="mt-2 w-fit border border-white/[0.1] px-2 py-0.5" style={{ ...mono, fontSize: "6.5px", letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(253,186,116,0.7)" }}>
                      Gated · contracted
                    </span>
                  )}
                  <p className="mt-3 text-[12.5px] leading-[1.7] text-white/[0.50]">{surface.body}</p>
                  <span className="mt-auto inline-flex items-center gap-2 pt-4 text-white/[0.42] transition-colors group-hover:text-white/[0.72]" style={{ ...mono, fontSize: "8px", letterSpacing: "0.16em", textTransform: "uppercase" }}>
                    View
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Method link */}
        <section className="border-t border-white/[0.06] px-6 py-12 lg:px-12">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
            <p className="max-w-[60ch] text-[14px] leading-[1.8] text-white/[0.52]">
              The architecture is held together by an evidence discipline — how claims are carried,
              tested, and remembered.
            </p>
            <Link
              href="/method"
              className="group inline-flex min-h-[48px] items-center gap-2 border px-5 py-3"
              style={{ ...mono, borderColor: `${GOLD}50`, backgroundColor: `${GOLD}12`, color: "#F5F5F5", fontSize: "9px", letterSpacing: "0.16em", textTransform: "uppercase" }}
            >
              See the method
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  );
}
