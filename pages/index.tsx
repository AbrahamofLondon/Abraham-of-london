// pages/index.tsx — INSTITUTIONAL HOME (EDELMAN / THINK-TANK / “DOUBLE-TAKE” EDITION)
// Refined: reduced scroll fatigue, single accent discipline, cleaner hierarchy

import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

import Layout from "@/components/Layout";
import EnhancedVenturesSection from "@/components/enhanced/VenturesSection";
import CanonPrimaryCard from "@/components/Cards/CanonPrimaryCard";
import AnimatedStatsBar from "@/components/enhanced/AnimatedStatsBar";
import ExecutiveIntelligenceStrip from "@/components/homepage/ExecutiveIntelligenceStrip";
import OperatorBriefing from "@/components/homepage/OperatorBriefing";
import VaultTeaserRail from "@/components/homepage/VaultTeaserRail";

import { safeArraySlice } from "@/lib/utils/safe";
import { getAllShorts } from "@/lib/contentlayer-helper";

import {
  ArrowRight,
  Award,
  BarChart3,
  BookOpen,
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  Compass,
  Cpu,
  Globe,
  Landmark,
  Library,
  LineChart,
  Lock,
  PenTool,
  Quote,
  Scale,
  ScrollText,
  Shield,
  Target,
  Vault,
  Workflow,
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
   ROUTES
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

  // Requested flagship links:
  vault: "/downloads/vault",
  strategicFrameworks: "/resources/strategic-frameworks",
  ultimatePurpose: "/blog/ultimate-purpose-of-man",
} as const;

/* -----------------------------------------------------------------------------
   UI HELPERS
----------------------------------------------------------------------------- */
const cx = (...parts: Array<string | false | null | undefined>) =>
  parts.filter(Boolean).join(" ");

const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-300/90">
    {children}
  </p>
);

const SectionHeader: React.FC<{
  eyebrow: string;
  title: string;
  body?: string;
  align?: "left" | "center";
}> = ({ eyebrow, title, body, align = "left" }) => (
  <div className={cx("mb-10", align === "center" ? "text-center" : "text-left")}>
    <Eyebrow>{eyebrow}</Eyebrow>
    <h2
      className={cx(
        "mt-5 font-serif font-light text-3xl sm:text-4xl text-amber-100",
        align === "center" ? "mx-auto" : ""
      )}
    >
      {title}
    </h2>
    {body ? (
      <p
        className={cx(
          "mt-4 text-sm sm:text-[15px] leading-relaxed font-light text-zinc-300/90",
          align === "center" ? "mx-auto max-w-2xl" : "max-w-3xl"
        )}
      >
        {body}
      </p>
    ) : null}
  </div>
);

const SectionDivider: React.FC<{ tight?: boolean }> = ({ tight = false }) => (
  <div className={cx("relative bg-black", tight ? "py-8" : "py-12")}>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  </div>
);

const Pill: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({
  children,
  icon,
}) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/20 bg-amber-500/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-200 backdrop-blur-sm">
    {icon}
    {children}
  </span>
);

const IconBox: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
    {children}
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
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-400">
          {title}
        </p>
        <p className="mt-4 text-sm font-light leading-relaxed text-zinc-200/90">
          {body}
        </p>
        {meta ? (
          <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.35em] text-amber-200/80">
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

const GoldButtonLink: React.FC<{
  href: string;
  children: React.ReactNode;
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}> = ({ href, children, iconLeft, iconRight }) => (
  <Link
    href={href}
    className="inline-flex items-center justify-center gap-3 rounded-2xl bg-amber-300 px-8 py-4 text-sm font-bold uppercase tracking-[0.12em] text-black shadow-2xl shadow-amber-900/25 transition-all duration-300 hover:bg-amber-200 hover:scale-[1.01]"
  >
    {iconLeft}
    {children}
    {iconRight}
  </Link>
);

const GhostButtonLink: React.FC<{
  href: string;
  children: React.ReactNode;
  tone?: "amber" | "neutral";
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
}> = ({ href, children, tone = "neutral", iconLeft, iconRight }) => (
  <Link
    href={href}
    className={cx(
      "inline-flex items-center justify-center gap-3 rounded-2xl border bg-white/[0.03] px-8 py-4 text-sm font-semibold uppercase tracking-[0.12em] backdrop-blur-sm transition-all duration-300 hover:scale-[1.01] hover:bg-white/[0.06]",
      tone === "amber"
        ? "border-amber-400/25 text-amber-100 hover:border-amber-400/45"
        : "border-white/10 text-zinc-200 hover:border-white/20"
    )}
  >
    {iconLeft}
    {children}
    {iconRight}
  </Link>
);

/* -----------------------------------------------------------------------------
   HERO — Authority + Proof + Routing
----------------------------------------------------------------------------- */
const InstitutionalHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-black">
      {/* Background: disciplined grid + warm signal only */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_15%,rgba(245,158,11,0.14),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-14 pt-10 sm:px-6 lg:px-8 lg:pb-18">
        {/* Authority pills */}
        <div className="mb-9 flex flex-wrap gap-3">
          <Pill icon={<Landmark className="h-4 w-4" />}>Institutional OS</Pill>
          <Pill icon={<Target className="h-4 w-4" />}>Mandate & Strategy</Pill>
          <Pill icon={<Scale className="h-4 w-4" />}>Governance</Pill>
          <Pill icon={<Workflow className="h-4 w-4" />}>Execution Cadence</Pill>
          <Pill icon={<Shield className="h-4 w-4" />}>Ethics</Pill>
        </div>

        <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
          {/* Left */}
          <div className="lg:col-span-7">
            <h1 className="mb-7 font-serif text-4xl font-semibold leading-tight text-amber-100 sm:text-6xl lg:text-7xl">
              Abraham of London
              <span className="mt-5 block text-xl font-normal text-amber-100/90 sm:text-3xl lg:text-4xl">
                Less theatre.{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">More operating system.</span>
                  <span className="absolute -bottom-1 left-0 h-1 w-full bg-gradient-to-r from-amber-400/80 to-transparent" />
                </span>
              </span>
            </h1>

            <p className="mb-9 max-w-3xl text-base font-light leading-relaxed text-zinc-200 sm:text-lg lg:text-xl">
              I build consulting-grade decision systems for founders, leadership teams, and institutions —
              so strategy survives pressure, scrutiny, and scale.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap gap-4">
              <GoldButtonLink
                href={ROUTES.consulting}
                iconLeft={<Briefcase className="h-5 w-5" />}
                iconRight={<ArrowRight className="h-5 w-5" />}
              >
                Engage Advisory
              </GoldButtonLink>

              <GhostButtonLink
                href={ROUTES.canon}
                tone="amber"
                iconLeft={<BookOpen className="h-5 w-5" />}
                iconRight={<ArrowRight className="h-5 w-5" />}
              >
                Read the Canon
              </GhostButtonLink>

              <GhostButtonLink
                href={ROUTES.vault}
                tone="neutral"
                iconLeft={<Vault className="h-5 w-5" />}
                iconRight={<Lock className="h-5 w-5" />}
              >
                Open the Vault
              </GhostButtonLink>
            </div>

            {/* Proof rail: compact (reduces scroll fatigue) */}
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { k: "Mode", v: "Advisory + Assets" },
                { k: "Output", v: "Systems, not slogans" },
                { k: "Standard", v: "Audit-ready governance" },
              ].map((x) => (
                <div
                  key={x.k}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl"
                >
                  <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-500">
                    {x.k}
                  </p>
                  <p className="mt-3 text-sm font-semibold text-amber-100">{x.v}</p>
                </div>
              ))}
            </div>

            {/* Values rail */}
            <div className="mt-8 flex flex-wrap items-center gap-7 text-sm font-light text-zinc-300">
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
                Cadence installed
              </span>
            </div>
          </div>

          {/* Right */}
          <div className="lg:col-span-5">
            <div className="grid gap-6">
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
        <div className="relative mt-14 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <div className="relative aspect-[16/9]">
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/0 via-black/25 to-black/75" />
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

          <div className="flex flex-col gap-5 px-7 py-7 sm:flex-row sm:items-start sm:justify-between sm:px-9">
            <div className="flex items-start gap-5">
              <div className="mt-1 h-12 w-12 rounded-xl bg-amber-500/10 p-2.5">
                <Cpu className="h-full w-full text-amber-300" />
              </div>
              <div>
                <p className="text-base font-medium text-amber-100 sm:text-lg">
                  Blueprint → pressure-test → deploy.
                </p>
                <p className="mt-2.5 text-sm font-light text-zinc-300">
                  Strategy becomes routine. Routine becomes compounding.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {[
                { icon: <CheckCircle2 className="h-4 w-4 text-amber-300" />, label: "Partner-led" },
                { icon: <Shield className="h-4 w-4 text-amber-300" />, label: "Governance-grade" },
                { icon: <Globe className="h-4 w-4 text-amber-300" />, label: "UK ↔ Africa" },
              ].map((x) => (
                <span
                  key={x.label}
                  className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-200"
                >
                  {x.icon}
                  {x.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Routes (kills scroll fatigue early) */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-zinc-400">
                Quick routes
              </p>
              <p className="mt-2 text-sm font-light text-zinc-300">
                Busy? Start with these three objects — they communicate seriousness fast.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={ROUTES.strategicFrameworks}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-200 hover:border-white/20 hover:bg-white/10 transition-colors"
              >
                <Compass className="h-4 w-4 text-amber-300" />
                Frameworks
              </Link>
              <Link
                href={ROUTES.ultimatePurpose}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-200 hover:border-white/20 hover:bg-white/10 transition-colors"
              >
                <ScrollText className="h-4 w-4 text-amber-300" />
                Purpose Thesis
              </Link>
              <Link
                href={ROUTES.vault}
                className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-amber-200 hover:border-amber-400/45 hover:bg-white/10 transition-colors"
              >
                <Vault className="h-4 w-4 text-amber-300" />
                Vault
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   FLAGSHIP ASSETS
----------------------------------------------------------------------------- */
const FlagshipAssets: React.FC = () => {
  const assets = [
    {
      title: "Strategic Frameworks",
      eyebrow: "Framework library",
      body: "Models, matrices, and decision tools that turn theory into an operating system.",
      href: ROUTES.strategicFrameworks,
      icon: <Compass className="h-6 w-6" />,
      meta: "Method • Options • Trade-offs",
    },
    {
      title: "Ultimate Purpose of Man",
      eyebrow: "Foundational thesis",
      body: "A first-principles anchor: meaning, morality, destiny — and why systems collapse without it.",
      href: ROUTES.ultimatePurpose,
      icon: <ScrollText className="h-6 w-6" />,
      meta: "Truth • Coherence • Consequence",
    },
    {
      title: "The Vault",
      eyebrow: "High-signal assets",
      body: "Templates, playbooks, and operator notes — built for builders who deploy.",
      href: ROUTES.vault,
      icon: <Vault className="h-6 w-6" />,
      meta: "Templates • Playbooks • Packs",
    },
  ] as const;

  return (
    <section className="relative bg-black py-16 sm:py-18">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_60%,rgba(245,158,11,0.06),transparent_55%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Flagship assets"
          title="Don’t browse. Deploy."
          body="These aren’t “posts.” They are institutional objects designed to be used."
          align="left"
        />

        <div className="grid gap-8 md:grid-cols-3">
          {assets.map((a) => (
            <Link
              key={a.title}
              href={a.href}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-9 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/30 hover:bg-white/[0.05] hover:shadow-xl hover:shadow-amber-500/5"
            >
              <div className="absolute right-6 top-6 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-300">
                {a.eyebrow}
              </div>

              <IconBox>
                <div className="text-amber-300">{a.icon}</div>
              </IconBox>

              <h3 className="mt-8 font-serif text-3xl font-semibold text-amber-100">
                {a.title}
              </h3>
              <p className="mt-4 text-sm font-light leading-relaxed text-zinc-300">
                {a.body}
              </p>

              <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-7">
                <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-500">
                  {a.meta}
                </span>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-200">
                  Open{" "}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>

              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.07),transparent_55%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Link>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href={ROUTES.resources}
            className="inline-flex items-center justify-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-7 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/10"
          >
            Resources <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href={ROUTES.downloads}
            className="inline-flex items-center justify-center gap-2.5 rounded-full border border-amber-400/30 bg-white/5 px-7 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-amber-200 transition-colors hover:border-amber-400/50 hover:bg-white/10"
          >
            Downloads <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   TRUST SIGNALS — disciplined palette (NO emerald/blue riot)
----------------------------------------------------------------------------- */
const TrustSignals: React.FC = () => {
  const signals = [
    {
      icon: <Award className="h-6 w-6 text-amber-300" />,
      title: "Governance-grade thinking",
      description:
        "Mandates, controls, decision rights, cadence — engineered to survive scrutiny and scale.",
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-amber-300" />,
      title: "Strategy → execution linkage",
      description:
        "No deck theatre. Decisions become deployable assets, milestones, and owners.",
    },
    {
      icon: <Shield className="h-6 w-6 text-amber-300" />,
      title: "Conviction, not vibes",
      description:
        "Christian ethics + historical realism + disciplined incentives — because systems reveal character under stress.",
    },
  ];

  return (
    <section className="bg-black py-16 sm:py-18">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Institutional assurance"
          title="Built to survive pressure"
          body="Repeatable method that holds under cross-examination."
          align="center"
        />

        <div className="grid gap-8 md:grid-cols-3">
          {signals.map((s) => (
            <div
              key={s.title}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/20 hover:bg-white/[0.05]"
            >
              <div className="mb-7 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
                {s.icon}
              </div>
              <h3 className="text-lg font-semibold text-amber-100">{s.title}</h3>
              <p className="mt-3.5 text-sm font-light leading-relaxed text-zinc-300">
                {s.description}
              </p>
            </div>
          ))}
        </div>

        {/* Proof rail */}
        <div className="mt-10 rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl">
          <div className="grid gap-6 md:grid-cols-4">
            {[
              { k: "Deliverables", v: "Packs + Playbooks" },
              { k: "Cadence", v: "Weekly operating rhythm" },
              { k: "Governance", v: "Decision rights + controls" },
              { k: "Orientation", v: "UK ↔ Africa systems" },
            ].map((x) => (
              <div key={x.k} className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-500">
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
   SERVICE LINES
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
    <section className="bg-black py-16 sm:py-18">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <Eyebrow>Service lines</Eyebrow>
            <h2 className="mt-5 font-serif text-3xl sm:text-4xl font-light text-amber-100">
              A proper consulting spine
            </h2>
            <p className="mt-4 text-sm sm:text-[15px] leading-relaxed font-light text-zinc-300/90">
              We don’t “help.” We build the decision system that makes help unnecessary.
            </p>
          </div>

          <Link
            href={ROUTES.consulting}
            className="inline-flex items-center justify-center gap-3 rounded-full border border-amber-400/30 bg-white/5 px-8 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-amber-200 transition-colors hover:border-amber-400/50 hover:bg-white/10"
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

              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-amber-100">
                {l.title}
              </h3>

              <ul className="mt-7 space-y-3.5 text-sm font-light text-zinc-300">
                {l.bullets.map((b) => (
                  <li key={b} className="flex gap-3.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex items-center justify-between border-t border-white/10 pt-7">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-400">
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
   CANON — hierarchy + access pathway
----------------------------------------------------------------------------- */
const CanonInstitutionalIntro: React.FC = () => {
  const tiers = [
    {
      title: "Public Library",
      icon: <Library className="h-6 w-6" />,
      body: "Read the thesis, principles, and essays. Enough to judge substance fast.",
      meta: "Open access",
      href: ROUTES.canon,
      cta: "Browse Canon",
    },
    {
      title: "Operator Notes",
      icon: <PenTool className="h-6 w-6" />,
      body: "Shorts and briefs engineered for execution: cadence, choices, constraints.",
      meta: "High signal",
      href: ROUTES.shorts,
      cta: "Read Shorts",
    },
    {
      title: "Vault Assets",
      icon: <Lock className="h-6 w-6" />,
      body: "Templates, packs, and institutional artefacts for builders who deploy.",
      meta: "Protected access",
      href: ROUTES.vault,
      cta: "Open Vault",
    },
  ] as const;

  return (
    <section className="relative bg-black py-16 sm:py-18">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(245,158,11,0.06),transparent_55%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl">
            <Eyebrow>Canon — institutional backbone</Eyebrow>
            <h2 className="mt-5 font-serif text-3xl sm:text-4xl font-light text-amber-100">
              Not content. A system.
            </h2>
            <p className="mt-4 text-sm sm:text-[15px] leading-relaxed font-light text-zinc-300/90">
              The Canon is the intellectual infrastructure behind the advisory work — designed for durability, not dopamine.
            </p>
          </div>

          <div className="flex flex-wrap gap-3.5">
            <Link
              href={ROUTES.canonVolume1}
              className="inline-flex items-center justify-center gap-3 rounded-full border border-amber-400/30 bg-white/5 px-8 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-amber-200 transition-colors hover:border-amber-400/50 hover:bg-white/10"
            >
              Start Volume I <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={ROUTES.vault}
              className="inline-flex items-center justify-center gap-3 rounded-full border border-white/10 bg-white/5 px-8 py-4 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/10"
            >
              Inner Circle Access <Lock className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {tiers.map((t) => (
            <Link
              key={t.title}
              href={t.href}
              className="group rounded-3xl border border-white/10 bg-white/[0.03] p-9 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/30 hover:bg-white/[0.05] hover:shadow-xl hover:shadow-amber-500/5"
            >
              <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                {t.icon}
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-amber-100">
                {t.title}
              </h3>
              <p className="mt-4 text-sm font-light leading-relaxed text-zinc-300">
                {t.body}
              </p>
              <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-7">
                <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-500">
                  {t.meta}
                </span>
                <span className="inline-flex items-center gap-2.5 text-sm font-semibold text-amber-200">
                  {t.cta}{" "}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-12">
          <CanonPrimaryCard
            title="The Architecture of Human Purpose"
            href={ROUTES.canonVolume1}
            volumeNumber={1}
            image="/assets/images/canon/architecture-of-human-purpose-cover.jpg"
            className="mx-auto max-w-5xl"
            description="Foundational principles for building institutions that survive generational shifts."
          />
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   CREDIBILITY QUOTES
----------------------------------------------------------------------------- */
const CredibilityQuotes: React.FC = () => {
  const quotes = [
    {
      byline: "Operator’s summary",
      text: "This isn’t motivation — it’s governance. Decisions become executable and owned.",
    },
    {
      byline: "Leadership takeaway",
      text: "The cadence is the hidden engine. Once installed, performance compounds.",
    },
    {
      byline: "Builder’s verdict",
      text: "Trade-offs written, owners named, standards set. It finally feels real.",
    },
  ];

  return (
    <section className="bg-black py-16 sm:py-18">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Credibility"
          title="Signal, not noise."
          body="The work is engineered to stand up when serious people ask serious questions."
          align="left"
        />

        <div className="grid gap-8 md:grid-cols-3">
          {quotes.map((q, idx) => (
            <div
              key={`${q.byline}-${idx}`}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-9 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/20 hover:bg-white/[0.05]"
            >
              <div className="mb-7 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                <Quote className="h-6 w-6" />
              </div>
              <p className="text-sm font-light leading-relaxed text-zinc-200">“{q.text}”</p>
              <p className="mt-7 text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-500">
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
   SHORTS — field intelligence
----------------------------------------------------------------------------- */
const ShortsStrip: React.FC<{ shorts: LooseShort[] }> = ({ shorts }) => {
  const items = safeArraySlice(shorts ?? [], 0, 6) as LooseShort[];
  if (!items.length) return null;

  const getHref = (s: LooseShort) => {
    if (s.url) return s.url;
    if (s.slug) return `/shorts/${String(s.slug).replace(/^\/+/, "")}`;
    const raw = s._raw?.flattenedPath || s._raw?.sourceFileName;
    if (raw) return `/shorts/${String(raw).replace(/\.mdx?$/, "")}`;
    return ROUTES.shorts;
  };

  return (
    <section className="bg-black py-16 sm:py-18">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader
          eyebrow="Field intelligence"
          title="Executive notes for builders."
          body="Short, sharp signals — designed to translate into action."
          align="left"
        />

        <div className="grid gap-8 md:grid-cols-3">
          {items.map((s, idx) => (
            <Link
              key={`${s.title ?? "short"}-${idx}`}
              href={getHref(s)}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-9 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/20 hover:bg-white/[0.05] hover:shadow-xl hover:shadow-amber-500/5"
            >
              <div className="absolute right-6 top-6 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-300">
                {(s.readTime || "SHORT").toString()}
              </div>

              <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                <PenTool className="h-6 w-6" />
              </div>

              <h3 className="font-serif text-xl sm:text-2xl font-semibold text-amber-100">
                {s.title || "Untitled"}
              </h3>

              <p className="mt-4 text-sm font-light leading-relaxed text-zinc-300">
                {(s.excerpt || s.description || "High-signal notes designed for execution.").toString()}
              </p>

              <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-7">
                <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-zinc-500">
                  Deployable signal
                </span>
                <span className="inline-flex items-center gap-2.5 text-sm font-semibold text-amber-200">
                  Open{" "}
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </div>

              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(245,158,11,0.06),transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   FINAL CTA
----------------------------------------------------------------------------- */
const InstitutionalClose: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-black py-20 sm:py-24">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 backdrop-blur-xl sm:p-12">
          <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <Eyebrow>Next step</Eyebrow>
              <h2 className="mt-5 font-serif text-3xl sm:text-4xl font-light text-amber-100">
                If you’re serious, don’t “follow.”
                <span className="block">Install the system.</span>
              </h2>
              <p className="mt-4 max-w-2xl text-sm sm:text-[15px] font-light leading-relaxed text-zinc-300/90">
                Advisory for leaders. Canon for thinkers. Vault assets for builders who deploy.
                No drama — just durable operating standards.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <GoldButtonLink
                  href={ROUTES.consulting}
                  iconLeft={<Briefcase className="h-5 w-5" />}
                  iconRight={<ArrowRight className="h-5 w-5" />}
                >
                  Engage Advisory
                </GoldButtonLink>

                <GhostButtonLink
                  href={ROUTES.vault}
                  tone="amber"
                  iconLeft={<Vault className="h-5 w-5" />}
                  iconRight={<Lock className="h-5 w-5" />}
                >
                  Access Vault Assets
                </GhostButtonLink>

                <GhostButtonLink
                  href={ROUTES.contact}
                  tone="neutral"
                  iconLeft={<Shield className="h-5 w-5" />}
                  iconRight={<ArrowRight className="h-5 w-5" />}
                >
                  Contact / Introductions
                </GhostButtonLink>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="grid gap-6">
                {[
                  {
                    icon: <CheckCircle2 className="h-5 w-5" />,
                    title: "Fast credibility check",
                    body: "Start with Strategic Frameworks and the Ultimate Purpose thesis.",
                  },
                  {
                    icon: <Workflow className="h-5 w-5" />,
                    title: "Execution pathway",
                    body: "Shorts → routines → assets → operating cadence.",
                  },
                  {
                    icon: <Landmark className="h-5 w-5" />,
                    title: "Institutional posture",
                    body: "Governance discipline that holds under scrutiny.",
                  },
                ].map((x) => (
                  <div
                    key={x.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur"
                  >
                    <div className="flex items-start gap-4">
                      <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-300">
                        {x.icon}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-amber-100">{x.title}</p>
                        <p className="mt-2 text-sm font-light leading-relaxed text-zinc-300">
                          {x.body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-3">
                <Link
                  href={ROUTES.strategicFrameworks}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/10"
                >
                  <Compass className="h-4 w-4 text-amber-300" />
                  Strategic Frameworks
                </Link>
                <Link
                  href={ROUTES.ultimatePurpose}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-zinc-200 transition-colors hover:border-white/20 hover:bg-white/10"
                >
                  <ScrollText className="h-4 w-4 text-amber-300" />
                  Ultimate Purpose
                </Link>
                <Link
                  href={ROUTES.vault}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-white/5 px-5 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-amber-200 transition-colors hover:border-amber-400/45 hover:bg-white/10"
                >
                  <Vault className="h-4 w-4 text-amber-300" />
                  Vault
                </Link>
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                Less talk. More deployment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   DATA UTILS
----------------------------------------------------------------------------- */
function toTime(input: LooseShort["date"]): number {
  if (!input) return 0;
  const d = input instanceof Date ? input : new Date(String(input));
  const t = d.getTime();
  return Number.isFinite(t) ? t : 0;
}

/* -----------------------------------------------------------------------------
   PAGE
----------------------------------------------------------------------------- */
const HomePage: NextPage<HomePageProps> = ({ featuredShorts }) => {
  return (
    <Layout
      title="Abraham of London — Institutional Advisory, Canon, and Vault Assets"
      description="Consulting-grade decision systems for founders, leadership teams, and institutions. Strategy that survives pressure — with deployable assets, governance discipline, and execution cadence."
      ogImage="/assets/images/social/og-image.jpg"
      canonicalUrl="/"
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Abraham of London",
        url: (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(
          /\/+$/,
          ""
        ),
        description:
          "Consulting-grade decision systems for founders, leadership teams, and institutions. Strategy that survives pressure — with deployable assets, governance discipline, and execution cadence.",
      }}
    >
      <main className="bg-black">
        <InstitutionalHero />

        {/* Credibility early */}
        <section className="bg-black">
          <AnimatedStatsBar />
        </section>

        <SectionDivider tight />

        <OperatorBriefing />

        <SectionDivider />

        <FlagshipAssets />

        <SectionDivider tight />

        <TrustSignals />

        <SectionDivider tight />

        <ServiceLines />

        <SectionDivider />

        <section className="bg-black">
          <EnhancedVenturesSection />
        </section>

        <SectionDivider tight />

        <VaultTeaserRail />

        <SectionDivider tight />

        <CanonInstitutionalIntro />

        <SectionDivider tight />

        <CredibilityQuotes />

        <SectionDivider tight />

        <ExecutiveIntelligenceStrip shorts={featuredShorts} />

        <SectionDivider />

        <InstitutionalClose />
      </main>
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
   SSG
----------------------------------------------------------------------------- */
export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  const all = (await getAllShorts()) as LooseShort[];

  const published = (all || [])
    .filter((s) => !s?.draft)
    .filter((s) => s?.published !== false)
    .sort((a, b) => toTime(b.date) - toTime(a.date));

  const featuredShorts = safeArraySlice(published, 0, 6) as LooseShort[];

  return {
    props: { featuredShorts },
    revalidate: 60 * 30, // 30 minutes
  };
};

export default HomePage;