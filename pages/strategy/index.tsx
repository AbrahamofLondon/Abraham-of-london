/* pages/strategy/index.tsx — STRATEGIC ARCHITECTURE (Engagements + Frameworks, Pages Router Safe) */
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Download,
  FileSpreadsheet,
  Hammer,
  Layers,
  Map,
  Presentation,
  ShieldCheck,
  Users,
  Mic2,
  Building2,
  Lock,
} from "lucide-react";

import Layout from "@/components/Layout";
import MandateStatement from "@/components/MandateStatement";

type TierTag = "public" | "inner-circle" | "private";

type Card = {
  title: string;
  description: string;
  href: string;
  status: TierTag;
  icon: React.ComponentType<any>;
  bullets?: string[];
  meta?: string;
};

const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

const StrategyPage: NextPage = () => {
  const engagements: Card[] = [
    {
      title: "Strategy Room",
      description: "Board-grade decision environment for irreversible calls. Intake-first. No theatre.",
      href: "/consulting/strategy-room",
      status: "inner-circle",
      icon: ShieldCheck,
      bullets: [
        "Authority + decision gravity filter",
        "Constraint-aware options + trade-offs",
        "Artifacts delivered: memo, matrix, cadence",
      ],
      meta: "Engagement",
    },
    {
      title: "Advisory & Strategy",
      description: "Private strategic counsel for founders, boards, and builders carrying consequence.",
      href: "/consulting",
      status: "private",
      icon: Building2,
      bullets: ["Governance + operating cadence", "Founder counsel under pressure", "Frontier-market execution"],
      meta: "Engagement",
    },
    {
      title: "Speaking",
      description: "Keynotes, closed-door sessions, and governance discourse — for leaders, not spectators.",
      href: "/speaking",
      status: "public",
      icon: Mic2,
      bullets: ["Institutional governance", "Markets + civilisation", "Principle + execution"],
      meta: "Engagement",
    },
  ];

  const coreFrameworks: Card[] = [
    {
      title: "Strategic Frameworks",
      description: "Curated operating library: board-level decision models, governance tools, execution logic.",
      href: "/resources/strategic-frameworks",
      status: "public",
      icon: Map,
      bullets: ["Decision matrices", "Prioritisation logic", "Governance templates", "Stakeholder mapping"],
      meta: "Resource",
    },
    {
      title: "The Builder’s Catechism",
      description: "Authoritative question-set for legitimacy, discipline, and execution integrity.",
      href: "/canon/builders-catechism",
      status: "inner-circle",
      icon: Hammer,
      bullets: ["Foundational questions", "Audit tools", "Governance checklists", "Implementation guide"],
      meta: "Canon",
    },
    {
      title: "The Architecture of Human Purpose",
      description: "The philosophical spine: purpose, governance, civilisation, destiny — not motivational fluff.",
      href: "/books/the-architecture-of-human-purpose",
      status: "public",
      icon: Layers,
      bullets: ["Purpose architecture", "Civilisational model", "Governance layers", "Alignment logic"],
      meta: "Book",
    },
  ];

  const implementationTools: Card[] = [
    {
      title: "Board Decision Log Template",
      description: "Decision hygiene: capture decisions, owners, rationale, and follow-through.",
      href: "/downloads/board-decision-log-template",
      status: "public",
      icon: FileSpreadsheet,
      bullets: ["Accountability matrix", "Decision history", "Owner + due date discipline"],
      meta: "Toolkit",
    },
    {
      title: "Operating Cadence Pack",
      description: "Meeting architecture + rhythm that survives personality and chaos.",
      href: "/downloads/operating-cadence-pack",
      status: "inner-circle",
      icon: Presentation,
      bullets: ["Board cadence design", "Operating rhythm", "Control points + review loops"],
      meta: "Toolkit",
    },
    {
      title: "Canon Council Table Agenda",
      description: "Structured agenda for high-trust, high-clarity strategic dialogue.",
      href: "/resources/canon-council-table-agenda",
      status: "inner-circle",
      icon: ClipboardCheck,
      bullets: ["Decision framing", "Trade-off mapping", "Governance escalation"],
      meta: "Toolkit",
    },
  ];

  const tagClass = (t: TierTag) => {
    if (t === "public") return "border-emerald-500/20 bg-emerald-500/10 text-emerald-200/80";
    if (t === "inner-circle") return "border-amber-500/25 bg-amber-500/10 text-amber-200/80";
    return "border-red-500/20 bg-red-500/10 text-red-200/80";
  };

  const tagLabel = (t: TierTag) => {
    if (t === "public") return "Public";
    if (t === "inner-circle") return "Inner Circle";
    return "Private";
  };

  const Section = ({ title, kicker, items }: { title: string; kicker: string; items: Card[] }) => (
    <section className="py-20 lg:py-28">
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-14">
          <div className="text-[10px] font-mono uppercase tracking-[0.4em] text-white/35">{kicker}</div>
          <h2 className="mt-4 font-serif text-3xl md:text-4xl font-semibold text-white">{title}</h2>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {items.map((it) => (
            <div
              key={it.href}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 hover:border-amber-500/25 transition-colors flex flex-col"
            >
              <div className="flex items-center justify-between mb-6">
                <it.icon className="h-8 w-8 text-amber-400" />
                <span
                  className={[
                    "inline-flex items-center gap-2 rounded-full px-3 py-1 border text-[10px] font-mono uppercase tracking-[0.25em]",
                    tagClass(it.status),
                  ].join(" ")}
                >
                  {it.status !== "public" ? <Lock className="h-3 w-3" /> : null}
                  {tagLabel(it.status)}
                </span>
              </div>

              <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">{it.meta}</div>
              <h3 className="mt-3 font-serif text-2xl text-white/90">{it.title}</h3>
              <p className="mt-4 text-sm text-white/50 leading-relaxed">{it.description}</p>

              {it.bullets?.length ? (
                <ul className="mt-6 space-y-2">
                  {it.bullets.map((b) => (
                    <li key={b} className="text-xs text-white/45 flex items-start gap-2">
                      <ArrowRight className="mt-0.5 h-3 w-3 text-amber-400/60" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <Link
                href={it.href}
                className="mt-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-300 hover:text-amber-200"
              >
                Open <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );

  return (
    <Layout
      title="Strategy"
      description="Engagements, governance systems, and board-grade frameworks — powered by the Canon."
      className="bg-black text-cream"
    >
      <Head>
        <link rel="canonical" href={`${SITE}/strategy`} />
      </Head>

      <main>
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-black via-zinc-950 to-black pt-24 pb-16 lg:pt-32 lg:pb-24">
          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-amber-400/80">
              Strategy · Governance · Execution
            </p>
            <h1 className="mt-6 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
              Strategy that survives <span className="italic text-amber-400">reality</span>.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/45">
              This is the operational spine: engagements, doctrine, and deployable tools. No vibes. No improv.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="#engagements"
                className="rounded-xl bg-amber-400 px-8 py-4 text-sm font-bold uppercase tracking-widest text-black hover:bg-amber-300 transition-all flex items-center justify-center"
              >
                Engagements <Users className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/resources/strategic-frameworks"
                className="rounded-xl border border-amber-400/30 bg-amber-400/10 px-8 py-4 text-sm font-bold uppercase tracking-widest text-amber-200 hover:bg-amber-400/15 transition-all flex items-center justify-center"
              >
                Strategic Frameworks <Download className="ml-2 h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* MANDATE */}
        <section className="bg-black py-12 lg:py-16">
          <div className="mx-auto max-w-6xl px-4">
            <MandateStatement />
          </div>
        </section>

        {/* ENGAGEMENTS (explicit) */}
        <div id="engagements" />
        <Section title="Engagements" kicker="Work" items={engagements} />

        {/* CORE FRAMEWORKS */}
        <Section title="Core Frameworks" kicker="Spine" items={coreFrameworks} />

        {/* TOOLKITS */}
        <Section title="Implementation Toolkits" kicker="Artifacts" items={implementationTools} />

        {/* CTA */}
        <section className="bg-zinc-950 py-20">
          <div className="mx-auto max-w-4xl px-4 text-center">
            <div className="rounded-3xl border border-amber-400/20 bg-amber-400/5 p-12">
              <h3 className="font-serif text-3xl text-white mb-6">Begin Strategic Architecture</h3>
              <p className="text-white/45 mb-8 max-w-xl mx-auto">
                Build institutions that outlast their founders: governance, cadence, accountability, and clarity.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/consulting/strategy-room"
                  className="bg-amber-400 px-8 py-4 rounded-xl text-black font-bold uppercase tracking-widest hover:bg-amber-300"
                >
                  Enter Strategy Room
                </Link>
                <Link
                  href="/resources/strategic-frameworks"
                  className="border border-amber-400/40 px-8 py-4 rounded-xl text-amber-200 font-bold uppercase tracking-widest hover:bg-amber-400/10"
                >
                  Download Frameworks
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default StrategyPage;