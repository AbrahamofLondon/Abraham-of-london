// pages/index.tsx — INSTITUTIONAL HOME (EDELMAN / THINK-TANK GRADE)
// Tailwind-safe classes only (no decimals like h-4.5 / py-4.5)

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";

import Layout from "@/components/Layout";
import EnhancedVenturesSection from "@/components/enhanced/VenturesSection";
import CanonPrimaryCard from "@/components/Cards/CanonPrimaryCard";
import AnimatedStatsBar from "@/components/enhanced/AnimatedStatsBar";

import { safeArraySlice } from "@/lib/utils/safe";

// ✅ You currently use this on homepage — keep consistent with your codebase
import { getAllShorts } from "@/lib/contentlayer-helper";
import { getDocHref } from "@/lib/content/client-utils";

import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  Clock,
  Cpu,
  Globe,
  Landmark,
  Layers,
  LineChart,
  Map,
  Scale,
  Shield,
  Sparkles,
  Target,
  TrendingUp,
  Users2,
  Workflow,
  Quote,
} from "lucide-react";

/* -----------------------------------------------------------------------------
   TYPES
----------------------------------------------------------------------------- */
type LooseShort = {
  title?: string;
  excerpt?: string | null;
  description?: string | null;
  readTime?: string | null;
  url?: string | null;
  slug?: string | null;
  draft?: boolean;
  published?: boolean;
  date?: string | Date | null;
  _raw?: { sourceFileName?: string; flattenedPath?: string };
};

type HomePageProps = {
  featuredShorts: LooseShort[];
};

/* -----------------------------------------------------------------------------
   ROUTES (MUST MATCH REAL PAGES)
----------------------------------------------------------------------------- */
const ROUTES = {
  consulting: "/consulting",
  canon: "/canon",
  canonVolume1: "/canon/volume-i-foundations-of-purpose",
  shorts: "/shorts",
  books: "/books",
  ventures: "/ventures",
  strategy: "/strategy",
  resources: "/resources",
  downloads: "/downloads",
  contact: "/contact",
} as const;

/* -----------------------------------------------------------------------------
   UI ATOMS
----------------------------------------------------------------------------- */
const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const Pill: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({
  children,
  icon,
}) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200 backdrop-blur-sm">
    {icon}
    {children}
  </span>
);

const SectionDivider: React.FC<{ tight?: boolean }> = ({ tight = false }) => (
  <div className={cx("relative overflow-hidden bg-black", tight ? "h-16" : "h-24")}>
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="relative">
        <div className="h-px w-40 bg-gradient-to-r from-transparent via-amber-400/25 to-transparent" />
        <div className="mx-10 flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 opacity-90" />
          <div className="h-1.5 w-1.5 rounded-full bg-amber-300/70" />
          <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 opacity-90" />
        </div>
        <div className="h-px w-40 bg-gradient-to-r from-transparent via-amber-400/25 to-transparent" />
      </div>
    </div>
  </div>
);

const GlassCard: React.FC<{
  title: string;
  icon: React.ReactNode;
  body: string;
  meta?: string;
}> = ({ title, icon, body, meta }) => (
  <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/20 hover:bg-white/[0.05]">
    <div className="flex items-start justify-between gap-6">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
          {title}
        </p>
        <p className="mt-4 text-sm font-light leading-relaxed text-gray-200">
          {body}
        </p>
        {meta ? (
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200/80">
            {meta}
          </p>
        ) : null}
      </div>
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
        {icon}
      </div>
    </div>
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(245,158,11,0.06),transparent_55%)]" />
  </div>
);

/* -----------------------------------------------------------------------------
   HERO (Authority + Proof + Intent Routing)
----------------------------------------------------------------------------- */
const InstitutionalHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-black">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(245,158,11,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.05),transparent_60%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,1),rgba(0,0,0,1))]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24">
        {/* Pill rail */}
        <div className="mb-10 flex flex-wrap gap-3">
          <Pill icon={<Landmark className="h-4 w-4" />}>Institutional OS</Pill>
          <Pill icon={<Target className="h-4 w-4" />}>Mandate & Strategy</Pill>
          <Pill icon={<Scale className="h-4 w-4" />}>Governance</Pill>
          <Pill icon={<Workflow className="h-4 w-4" />}>Execution Cadence</Pill>
        </div>

        <div className="grid gap-14 lg:grid-cols-12 lg:items-start">
          {/* Left */}
          <div className="lg:col-span-7">
            <h1 className="mb-8 font-serif text-5xl font-semibold leading-tight text-amber-100 sm:text-7xl lg:text-8xl">
              Abraham of London
              <span className="mt-6 block text-2xl font-normal text-amber-100/90 sm:text-4xl lg:text-5xl">
                Less theatre.{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">More operating system.</span>
                  <span className="absolute -bottom-1 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-transparent opacity-80" />
                </span>
              </span>
            </h1>

            {/* Authority line */}
            <p className="mb-10 max-w-3xl text-lg font-light leading-relaxed text-gray-200 sm:text-xl lg:text-2xl">
              I build consulting-grade decision systems for founders, leadership teams,
              and institutions — so strategy survives pressure, scrutiny, and scale.
            </p>

            {/* Primary CTAs */}
            <div className="flex flex-wrap gap-4">
              <Link
                href={ROUTES.consulting}
                className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-8 py-4 text-base font-bold text-black shadow-lg shadow-amber-900/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-amber-900/40"
              >
                <Briefcase className="h-5 w-5" />
                Engage Advisory
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href={ROUTES.canon}
                className="inline-flex items-center gap-3 rounded-xl border border-amber-400/25 bg-white/5 px-8 py-4 text-base font-bold text-amber-100 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:border-amber-400/45 hover:bg-white/10"
              >
                <BookOpen className="h-5 w-5" />
                Read the Canon
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href={ROUTES.contact}
                className="inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-base font-bold text-gray-200 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-white/10"
              >
                <ChevronRight className="h-5 w-5" />
                Contact
              </Link>
            </div>

            {/* Credibility micro-proof */}
            <div className="mt-12 grid gap-6 sm:grid-cols-3">
              {[
                { k: "Mode", v: "Advisory + Assets" },
                { k: "Output", v: "Systems, not slogans" },
                { k: "Standard", v: "Audit-ready governance" },
              ].map((x) => (
                <div
                  key={x.k}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gray-500">
                    {x.k}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-amber-100">{x.v}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-7 text-sm font-light text-gray-300">
              <span className="inline-flex items-center gap-2.5">
                <Shield className="h-4 w-4 text-amber-300" />
                Conviction-led ethics
              </span>
              <span className="inline-flex items-center gap-2.5">
                <Scale className="h-4 w-4 text-amber-300" />
                Governance discipline
              </span>
              <span className="inline-flex items-center gap-2.5">
                <Workflow className="h-4 w-4 text-amber-300" />
                Deployment cadence
              </span>
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-5">
            <div className="grid gap-7">
              <GlassCard
                title="Delivery posture"
                icon={<Landmark className="h-6 w-6" />}
                body="Mandates, decision rights, controls, and cadence — not vibes."
                meta="Institutional operating model"
              />
              <GlassCard
                title="Outcome bias"
                icon={<LineChart className="h-6 w-6" />}
                body="Every engagement ends in deployable assets, named owners, and milestones."
                meta="Assets + ownership map"
              />
              <GlassCard
                title="Operating context"
                icon={<Globe className="h-6 w-6" />}
                body="UK ↔ Africa — grounded in constraints, incentives, and execution reality."
                meta="Field-tested realism"
              />
            </div>
          </div>
        </div>

        {/* Hero visual */}
        <div className="relative mt-16 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <div className="relative aspect-[16/9]">
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/0 via-black/30 to-black/70" />
            <Image
              src="/assets/images/abraham-of-london-banner.webp"
              alt="Abraham of London — Institutional Advisory Platform"
              fill
              priority
              quality={95}
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
            />
          </div>

          <div className="flex flex-col gap-6 px-7 py-7 sm:flex-row sm:items-start sm:justify-between sm:px-9">
            <div className="flex items-start gap-5">
              <div className="mt-1 h-12 w-12 rounded-xl bg-amber-500/10 p-2.5">
                <Cpu className="h-full w-full text-amber-300" />
              </div>
              <div>
                <p className="text-base font-medium text-amber-100 sm:text-lg">
                  Blueprint → pressure-test → deploy.
                </p>
                <p className="mt-2.5 text-sm font-light text-gray-300">
                  Strategy becomes routine. Routine becomes compounding.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-200">
                <CheckCircle2 className="h-4 w-4 text-amber-300" />
                Partner-led
              </span>
              <span className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-gray-200">
                <Shield className="h-4 w-4 text-amber-300" />
                Governance-grade
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   TRUST SIGNALS (Authority framing)
----------------------------------------------------------------------------- */
const TrustSignals: React.FC = () => {
  const signals = [
    {
      icon: <Award className="h-6 w-6 text-amber-300" />,
      title: "Governance-grade thinking",
      description:
        "Mandates, controls, decision rights, cadence — built to survive scrutiny and scale.",
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-emerald-300" />,
      title: "Strategy → execution linkage",
      description:
        "No deck theatre. Decisions become deployable assets, milestones, and ownership.",
    },
    {
      icon: <Shield className="h-6 w-6 text-blue-300" />,
      title: "Conviction, not vibes",
      description:
        "Christian ethics + historical realism + disciplined incentives — because systems reveal character under stress.",
    },
  ];

  return (
    <section className="bg-black py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
            Institutional assurance
          </p>
          <h2 className="mt-6 font-serif text-4xl font-light text-amber-100 sm:text-5xl">
            Built to survive pressure
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg font-light text-gray-300">
            Repeatable method that holds under cross-examination.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {signals.map((s) => (
            <div
              key={s.title}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/20 hover:bg-white/[0.05]"
            >
              <div className="mb-7 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                {s.icon}
              </div>
              <h3 className="text-xl font-semibold text-amber-100">{s.title}</h3>
              <p className="mt-3.5 text-sm font-light leading-relaxed text-gray-300">
                {s.description}
              </p>
            </div>
          ))}
        </div>

        {/* Proof rail (fast credibility) */}
        <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl">
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { k: "Deliverables", v: "Playbooks + Packs" },
              { k: "Cadence", v: "Weekly operating rhythm" },
              { k: "Governance", v: "Decision rights + controls" },
              { k: "Orientation", v: "UK ↔ Africa systems" },
            ].map((x) => (
              <div key={x.k} className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-gray-500">
                  {x.k}
                </p>
                <p className="mt-3 text-sm font-semibold text-amber-100">{x.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   SERVICE LINES (Intent routing)
----------------------------------------------------------------------------- */
const ServiceLines: React.FC = () => {
  const lines = [
    {
      href: `${ROUTES.consulting}#mandate`,
      icon: <Target className="h-6 w-6" />,
      title: "Strategy & Mandate",
      bullets: [
        "Mandate clarification & success definition",
        "Market structure & positioning choices",
        "Option set + trade-off documentation",
      ],
    },
    {
      href: `${ROUTES.consulting}#governance`,
      icon: <Workflow className="h-6 w-6" />,
      title: "Operating Model & Governance",
      bullets: [
        "Decision rights & meeting cadence",
        "Controls, KPIs, accountability loops",
        "Board/ExCo packs & governance artefacts",
      ],
    },
    {
      href: `${ROUTES.consulting}#deployment`,
      icon: <Building2 className="h-6 w-6" />,
      title: "Institution Build & Deployment",
      bullets: [
        "Execution roadmap & ownership map",
        "PMO-lite routines (light, not bureaucratic)",
        "SOPs, playbooks, operating standards",
      ],
    },
  ] as const;

  return (
    <section className="bg-black py-20">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-14 flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
              Service lines
            </p>
            <h2 className="mt-6 font-serif text-5xl font-light text-amber-100 sm:text-6xl">
              A proper consulting spine
            </h2>
            <p className="mt-5 text-xl font-light text-gray-300">
              We don’t “help.” We build the decision system that makes help unnecessary.
            </p>
          </div>

          <Link
            href={ROUTES.consulting}
            className="inline-flex items-center justify-center gap-3 rounded-full border border-amber-400/30 bg-white/5 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-amber-200 transition-all duration-300 hover:border-amber-400/50 hover:bg-white/10"
          >
            <span>See engagements</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {lines.map((l) => (
            <Link
              key={l.title}
              href={l.href}
              className="block rounded-3xl border border-white/10 bg-white/[0.03] p-9 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/30 hover:bg-white/[0.05] hover:shadow-xl hover:shadow-amber-500/5"
            >
              <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                {l.icon}
              </div>

              <h3 className="font-serif text-2xl font-semibold text-amber-100">
                {l.title}
              </h3>

              <ul className="mt-7 space-y-3.5 text-sm font-light text-gray-300">
                {l.bullets.map((b) => (
                  <li key={b} className="flex gap-3.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-7">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Output-driven
                </span>
                <span className="inline-flex items-center gap-2.5 text-sm font-semibold text-amber-200">
                  Learn more <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   CREDIBILITY QUOTES (lightweight, no external dependency)
----------------------------------------------------------------------------- */
const CredibilityQuotes: React.FC = () => {
  const quotes = [
    {
      byline: "Builders’ feedback",
      text:
        "This isn’t motivation — it’s a governance layer. The work makes decisions executable.",
    },
    {
      byline: "Operator’s takeaway",
      text:
        "The difference is cadence. Once the rhythm is installed, performance compounds.",
    },
    {
      byline: "Leadership reality",
      text:
        "Finally: trade-offs written down, owners named, and a system that survives pressure.",
    },
  ];

  return (
    <section className="bg-black py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
              Credibility
            </p>
            <h2 className="mt-6 font-serif text-5xl font-light text-amber-100 sm:text-6xl">
              Signal, not noise.
            </h2>
            <p className="mt-5 text-xl font-light text-gray-300">
              The work is engineered to hold up when people ask hard questions.
            </p>
          </div>

          <Link
            href={ROUTES.resources}
            className="inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-gray-200 transition-all duration-300 hover:border-white/20 hover:bg-white/10"
          >
            <span>View resources</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {quotes.map((q, idx) => (
            <div
              key={`${q.byline}-${idx}`}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-9 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/20 hover:bg-white/[0.05]"
            >
              <div className="mb-7 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                <Quote className="h-6 w-6" />
              </div>
              <p className="text-sm font-light leading-relaxed text-gray-200">
                “{q.text}”
              </p>
              <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.35em] text-gray-500">
                {q.byline}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   CANON
----------------------------------------------------------------------------- */
const CanonShowcase: React.FC = () => (
  <section className="bg-black py-20">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-14 flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
            Canon · Core backbone
          </p>
          <h2 className="mt-6 font-serif text-5xl font-light text-amber-100 sm:text-6xl">
            The blueprint that underwrites the firm
          </h2>
          <p className="mt-5 text-xl font-light text-gray-300">
            First principles and operating logic — written to outlast trends and cycles.
          </p>
        </div>

        <Link
          href={ROUTES.canon}
          className="inline-flex items-center justify-center gap-3 rounded-full border border-amber-400/30 bg-white/5 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-amber-200 transition-all duration-300 hover:border-amber-400/50 hover:bg-white/10"
        >
          <span>Browse Canon</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <CanonPrimaryCard
        title="The Architecture of Human Purpose"
        href={ROUTES.canonVolume1}
        volumeNumber={1}
        image="/assets/images/canon/architecture-of-human-purpose-cover.jpg"
        className="mx-auto max-w-4xl"
        description="Foundational principles for building institutions that survive generational shifts."
      />
    </div>
  </section>
);

/* -----------------------------------------------------------------------------
   SHORTS STRIP
----------------------------------------------------------------------------- */
const ShortsStrip: React.FC<{ shorts: LooseShort[] }> = ({ shorts }) => {
  if (!shorts || shorts.length === 0) return null;

  return (
    <section className="bg-black py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
              Field intelligence
            </p>
            <h2 className="mt-6 font-serif text-5xl font-light text-amber-100 sm:text-6xl">
              Executive notes for builders.
            </h2>
            <p className="mt-5 text-xl font-light text-gray-300">
              Short, sharp signals — designed to translate into action.
            </p>
          </div>

          <Link
            href={ROUTES.shorts}
            className="inline-flex items-center justify-center gap-3 rounded-full border border-amber-400/30 bg-white/5 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-amber-200 transition-all duration-300 hover:border-amber-400/50 hover:bg-white/10"
          >
            <span>View all</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {shorts.map((short) => {
            const href = getDocHref(short) || ROUTES.shorts;
            const key =
              short.slug ?? short._raw?.flattenedPath ?? short.title ?? href;

            return (
              <Link
                key={key}
                href={href}
                className="group rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/30 hover:bg-white/[0.05] hover:shadow-xl hover:shadow-amber-500/5"
              >
                <div className="mb-7 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2.5 rounded-full bg-amber-500/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                    <Sparkles className="h-4 w-4" />
                    Signal
                  </span>
                  <span className="flex items-center gap-2 text-xs font-medium text-gray-400">
                    <Clock className="h-4 w-4" />
                    {short.readTime ?? "3 min"}
                  </span>
                </div>

                <h3 className="mb-4 line-clamp-2 font-serif text-2xl font-semibold text-amber-100">
                  {short.title}
                </h3>
                <p className="line-clamp-3 text-sm font-light leading-relaxed text-gray-300">
                  {short.excerpt || short.description}
                </p>

                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-7">
                  <span className="text-sm font-medium text-gray-400">Read</span>
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-amber-400/25 bg-amber-500/5 transition-all duration-300 group-hover:border-amber-400/40 group-hover:bg-amber-500/10">
                    <ArrowRight className="h-5 w-5 text-amber-200 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   STRATEGIC CTA (single, dominant, uncluttered)
----------------------------------------------------------------------------- */
const StrategicSessions: React.FC = () => (
  <section className="relative overflow-hidden bg-black py-24">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.06),transparent_60%)]" />
    <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
        Advisory engagement
      </p>
      <h2 className="mt-8 font-serif text-5xl font-light text-amber-100 sm:text-6xl lg:text-7xl">
        Advisory that produces{" "}
        <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
          deployable systems
        </span>
      </h2>
      <p className="mx-auto mt-7 max-w-2xl text-xl font-light text-gray-300">
        Diagnose, decide, deploy — with governance and cadence that stick.
      </p>

      <div className="mt-14 flex flex-col items-center justify-center gap-5 sm:flex-row">
        <Link
          href={ROUTES.consulting}
          className="inline-flex items-center justify-center gap-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-12 py-6 text-lg font-bold text-black shadow-2xl shadow-amber-900/30 transition-all duration-300 hover:scale-[1.02] hover:shadow-amber-900/50"
        >
          <Briefcase className="h-6 w-6" />
          <span>Book a Strategic Session</span>
          <ArrowRight className="h-6 w-6" />
        </Link>

        <Link
          href={`${ROUTES.consulting}#offer`}
          className="inline-flex items-center justify-center gap-3.5 rounded-2xl border border-white/15 bg-white/5 px-10 py-5 text-sm font-semibold uppercase tracking-[0.15em] text-gray-200 transition-all duration-300 hover:border-white/25 hover:bg-white/10"
        >
          <span>View offer</span>
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      <div className="mt-20 grid gap-10 sm:grid-cols-3">
        {[
          { icon: <Target className="h-6 w-6" />, text: "Diagnostic-first" },
          { icon: <Users2 className="h-6 w-6" />, text: "Partner access" },
          { icon: <TrendingUp className="h-6 w-6" />, text: "Cadence installed" },
        ].map((item) => (
          <div key={item.text} className="flex items-center justify-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-500/10">
              <div className="text-amber-300">{item.icon}</div>
            </div>
            <span className="text-lg font-medium text-amber-100">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* -----------------------------------------------------------------------------
   PAGE
----------------------------------------------------------------------------- */
const HomePage: NextPage<HomePageProps> = ({ featuredShorts }) => {
  return (
    <Layout
      title="Abraham of London — Institutional Advisory"
      description="Consulting-grade diagnostics and governance: mandate clarity, operating models, execution cadence, and deployable systems that survive field pressure."
      fullWidth
      className="bg-black"
    >
      <div className="min-h-screen">
        <InstitutionalHero />
        <TrustSignals />

        {/* Stats bar = proof */
        /* Keep as your existing component but framed as credibility */}
        <section className="border-y border-white/10 bg-black">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <AnimatedStatsBar />
          </div>
        </section>

        <SectionDivider tight />
        <ServiceLines />

        <SectionDivider />
        <CanonShowcase />

        <SectionDivider tight />
        <CredibilityQuotes />

        {featuredShorts.length > 0 ? (
          <>
            <SectionDivider />
            <ShortsStrip shorts={featuredShorts} />
          </>
        ) : null}

        <SectionDivider />
        <EnhancedVenturesSection />

        <SectionDivider />
        <StrategicSessions />
      </div>
    </Layout>
  );
};

export default HomePage;

/* -----------------------------------------------------------------------------
   BUILD-TIME DATA
----------------------------------------------------------------------------- */
export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  try {
    const allShorts = getAllShorts();

    const featuredShorts = safeArraySlice(
      (allShorts as any[])
        .filter((s) => (s?.published ?? true) && !(s?.draft ?? false))
        .sort((a, b) => {
          const da = a?.date ? new Date(a.date).getTime() : 0;
          const db = b?.date ? new Date(b.date).getTime() : 0;
          return db - da;
        }),
      0,
      3
    );

    return { props: { featuredShorts }, revalidate: 3600 };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching shorts for homepage:", error);
    return { props: { featuredShorts: [] }, revalidate: 3600 };
  }
};