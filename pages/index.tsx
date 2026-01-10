// pages/index.tsx — INSTITUTIONAL (CLEAN SHELL / NO SELF-SABOTAGE)
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";

import Layout from "@/components/Layout";
import AnimatedStatsBar from "@/components/enhanced/AnimatedStatsBar";
import EnhancedVenturesSection from "@/components/enhanced/VenturesSection";
import CanonPrimaryCard from "@/components/Cards/CanonPrimaryCard";

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
  Gauge,
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
} from "lucide-react";

// Content (server-safe wrapper)
import { getAllShorts, getDocHref } from "@/lib/contentlayer-compat";

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
  _type?: string;
  draft?: boolean;
  published?: boolean;
  date?: string | Date | null;
  _raw?: { sourceFileName?: string; flattenedPath?: string };
};

type HomePageProps = {
  featuredShorts: LooseShort[];
};

/* -----------------------------------------------------------------------------
   CONSTANTS (ROUTES YOU CONFIRMED EXIST)
----------------------------------------------------------------------------- */
const ROUTES = {
  consulting: "/consulting",
  canon: "/canon",
  canonVolume1: "/canon/volume-i-foundations-of-purpose",
  blog: "/blog",
  shorts: "/shorts",
  books: "/books",
  ventures: "/ventures",
  strategy: "/strategy",
  resources: "/resources",
  downloads: "/downloads",
  contact: "/contact",
} as const;

const BOOKS_IN_DEV = [
  {
    slug: "fathering-without-fear",
    title: "Fathering Without Fear",
    tag: "Fatherhood · Household",
    blurb:
      "Standards, rituals, and household architecture for men building families that outlast culture wars.",
    cover: "/assets/images/books/fathering-without-fear.jpg",
    status: "in-development",
    progress: 75,
  },
  {
    slug: "the-fiction-adaptation",
    title: "The Fiction Adaptation",
    tag: "Fiction · Drama",
    blurb:
      "A covert retelling of a story too real for the courtroom — where truth hides in fiction and fiction cuts deeper than fact.",
    cover: "/assets/images/books/the-fiction-adaptation.jpg",
    status: "in-development",
    progress: 40,
  },
] as const;

/* -----------------------------------------------------------------------------
   UI HELPERS
----------------------------------------------------------------------------- */
const SectionDivider: React.FC<{ withOrnament?: boolean }> = ({
  withOrnament = true,
}) => (
  <div className="relative h-20 overflow-hidden bg-black">
    {withOrnament ? (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="h-px w-28 bg-gradient-to-r from-transparent via-amber-400/35 to-transparent" />
          <div className="mx-8 flex items-center gap-3">
            <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 opacity-80" />
            <div className="h-1.5 w-1.5 rounded-full bg-amber-300/60" />
            <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-amber-300 to-amber-500 opacity-80" />
          </div>
          <div className="h-px w-28 bg-gradient-to-r from-transparent via-amber-400/35 to-transparent" />
        </div>
      </div>
    ) : null}
  </div>
);

const Pill: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({
  children,
  icon,
}) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-500/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200 backdrop-blur-sm">
    {icon}
    {children}
  </span>
);

const Card: React.FC<{
  title: string;
  icon: React.ReactNode;
  body: string;
}> = ({ title, icon, body }) => (
  <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl">
    <div className="flex items-start justify-between gap-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
          {title}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-gray-200">{body}</p>
      </div>
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
        {icon}
      </div>
    </div>
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(245,158,11,0.08),transparent_55%)]" />
  </div>
);

/* -----------------------------------------------------------------------------
   HERO — CLEAN (NO WASHED OVERLAYS, NO CLIENT-SIDE DEPENDENCY)
----------------------------------------------------------------------------- */
const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-black">
      {/* Decorative background kept subtle (no muddy wash) */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.12),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.08),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-black" />
      </div>

      {/* IMPORTANT: top padding so fixed header never eats the hero */}
      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-24 sm:px-6 lg:px-8 lg:pb-24 lg:pt-28">
        <div className="mb-8 flex flex-wrap gap-3">
          <Pill icon={<Landmark className="h-3.5 w-3.5" />}>Institutional OS</Pill>
          <Pill icon={<Target className="h-3.5 w-3.5" />}>Strategy</Pill>
          <Pill icon={<Scale className="h-3.5 w-3.5" />}>Governance</Pill>
          <Pill icon={<Workflow className="h-3.5 w-3.5" />}>Execution</Pill>
        </div>

        <div className="grid gap-12 lg:grid-cols-12 lg:items-start">
          <div className="lg:col-span-7">
            <h1 className="mb-6 font-serif text-5xl font-semibold leading-tight text-amber-100 sm:text-7xl lg:text-8xl">
              Abraham of London
              <span className="mt-5 block text-2xl font-normal text-amber-100/85 sm:text-4xl lg:text-5xl">
                Less theatre.{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">More operating system.</span>
                  <span className="absolute -bottom-1 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-transparent opacity-80" />
                </span>
              </span>
            </h1>

            <p className="mb-10 max-w-3xl text-lg leading-relaxed text-gray-200 sm:text-xl lg:text-2xl">
              Consulting-grade diagnostics and governance — built for founders,
              leadership teams, and institutions that must survive pressure,
              scrutiny, and scale.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link
                href={ROUTES.consulting}
                className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-7 py-4 text-base font-bold text-black shadow-lg shadow-amber-900/25 transition-transform hover:scale-[1.02]"
              >
                <Briefcase className="h-5 w-5" />
                Engage Advisory
                <ArrowRight className="h-5 w-5" />
              </Link>

              <Link
                href={ROUTES.canon}
                className="inline-flex items-center gap-3 rounded-xl border border-amber-400/35 bg-white/5 px-7 py-4 text-base font-bold text-amber-100 backdrop-blur-sm transition-transform hover:scale-[1.02] hover:border-amber-400/55"
              >
                <BookOpen className="h-5 w-5" />
                Read the Canon
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-gray-300">
              <span className="inline-flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-300" />
                Conviction-led ethics
              </span>
              <span className="inline-flex items-center gap-2">
                <Scale className="h-4 w-4 text-amber-300" />
                Audit-ready governance
              </span>
              <span className="inline-flex items-center gap-2">
                <Workflow className="h-4 w-4 text-amber-300" />
                Deployment cadence
              </span>
            </div>
          </div>

          <div className="lg:col-span-5">
            <div className="grid gap-6">
              <Card
                title="Delivery posture"
                icon={<Landmark className="h-6 w-6" />}
                body="Decision rights, controls, and cadence — not vibes."
              />
              <Card
                title="Outcome bias"
                icon={<LineChart className="h-6 w-6" />}
                body="Every engagement ends in assets + owners + milestones."
              />
              <Card
                title="Operating context"
                icon={<Globe className="h-6 w-6" />}
                body="UK ↔ Africa — grounded in real constraints, not idealised models."
              />
            </div>
          </div>
        </div>

        {/* Image block — crisp, controlled overlays, high quality */}
        <div className="relative mt-14 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl">
          <div className="relative aspect-[16/9]">
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/0 via-black/20 to-black/55" />
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

          <div className="flex items-start gap-4 px-6 py-6 sm:px-8">
            <div className="mt-1 h-12 w-12 rounded-xl bg-amber-500/10 p-2.5">
              <Cpu className="h-full w-full text-amber-300" />
            </div>
            <div className="flex-1">
              <p className="text-base font-medium text-amber-100 sm:text-lg">
                Blueprint → pressure-test → deploy. Convert strategy into routine.
              </p>
              <p className="mt-2 text-sm text-gray-300">
                Institutional architecture since 2024.
              </p>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-gray-200 md:flex">
              <CheckCircle2 className="h-4 w-4 text-amber-300" />
              Partner-led
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   TRUST SIGNALS
----------------------------------------------------------------------------- */
const TrustSignals: React.FC = () => {
  const signals = [
    {
      icon: <Award className="h-6 w-6 text-amber-300" />,
      title: "Governance-grade thinking",
      description:
        "Mandates, controls, decision rights, cadence — built to survive audit, scrutiny, and scale.",
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-emerald-300" />,
      title: "Strategy → execution linkage",
      description:
        "No deck theatre. Decisions become deployable assets, measurable milestones, and named ownership.",
    },
    {
      icon: <Shield className="h-6 w-6 text-blue-300" />,
      title: "Conviction, not vibes",
      description:
        "Christian ethics + historical realism + disciplined incentives — because systems reveal character under stress.",
    },
  ];

  return (
    <section className="bg-black py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
            Institutional assurance
          </p>
          <h2 className="mt-4 font-serif text-3xl font-light text-amber-100 sm:text-4xl">
            Built to survive pressure
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-300">
            Repeatable method that holds under cross-examination.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {signals.map((s) => (
            <div
              key={s.title}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-xl"
            >
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5">
                {s.icon}
              </div>
              <h3 className="text-lg font-semibold text-amber-100">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-300">
                {s.description}
              </p>
            </div>
          ))}
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
      icon: <Target className="h-6 w-6" />,
      title: "Strategy & Mandate",
      bullets: [
        "Mandate clarification & success definition",
        "Market structure & positioning choices",
        "Option set + trade-off documentation",
      ],
    },
    {
      icon: <Workflow className="h-6 w-6" />,
      title: "Operating Model & Governance",
      bullets: [
        "Decision rights & meeting cadence",
        "Controls, KPIs, accountability loops",
        "Board/ExCo packs & governance artefacts",
      ],
    },
    {
      icon: <Building2 className="h-6 w-6" />,
      title: "Institution Build & Deployment",
      bullets: [
        "Execution roadmap & ownership map",
        "PMO-lite routines (light, not bureaucratic)",
        "SOPs, playbooks, and operating standards",
      ],
    },
  ] as const;

  return (
    <section className="bg-black py-18">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
              Service lines
            </p>
            <h2 className="mt-4 font-serif text-4xl font-light text-amber-100 sm:text-5xl">
              A proper consulting spine
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              We don’t “help.” We build the decision system that makes help unnecessary.
            </p>
          </div>

          <Link
            href={ROUTES.consulting}
            className="inline-flex items-center justify-center gap-3 rounded-full border border-amber-400/40 bg-white/5 px-7 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-amber-200 hover:border-amber-400/60"
          >
            <span>See engagements</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {lines.map((l) => (
            <div
              key={l.title}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl"
            >
              <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                {l.icon}
              </div>

              <h3 className="font-serif text-2xl font-semibold text-amber-100">
                {l.title}
              </h3>

              <ul className="mt-5 space-y-3 text-sm text-gray-300">
                {l.bullets.map((b) => (
                  <li key={b} className="flex gap-3">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-300" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Output-driven
                </span>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-200">
                  Learn more <ChevronRight className="h-4 w-4" />
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   DELIVERY MODEL
----------------------------------------------------------------------------- */
const DeliveryModel: React.FC = () => {
  const steps = [
    {
      icon: <Map className="h-6 w-6" />,
      title: "Diagnose",
      body: "Reality audit: incentives, constraints, and the actual decision system (not the org chart).",
    },
    {
      icon: <Layers className="h-6 w-6" />,
      title: "Design",
      body: "Operating model, governance artefacts, and an option set with explicit trade-offs.",
    },
    {
      icon: <Gauge className="h-6 w-6" />,
      title: "Deploy",
      body: "Cadence, owners, KPIs. Strategy becomes routine. Routine becomes compounding.",
    },
  ] as const;

  return (
    <section className="relative bg-black py-16">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_60%,rgba(245,158,11,0.10),transparent_55%)]" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
              Delivery model
            </p>
            <h2 className="mt-4 font-serif text-4xl font-light text-amber-100 sm:text-5xl">
              Method beats motivation.
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              Your organisation needs cadence that doesn’t collapse when the room gets hot.
            </p>
          </div>

          <Link
            href={ROUTES.consulting}
            className="inline-flex items-center justify-center gap-3 rounded-full border border-amber-400/40 bg-white/5 px-7 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-amber-200 hover:border-amber-400/60"
          >
            <span>Engagement formats</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((s, idx) => (
            <div
              key={s.title}
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur-xl"
            >
              <div className="absolute -right-2 -top-2 flex h-11 w-11 items-center justify-center rounded-full bg-white/5 text-xs font-bold text-amber-100">
                {idx + 1}
              </div>
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                {s.icon}
              </div>
              <h3 className="text-2xl font-semibold text-amber-100">{s.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-300">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   STRATEGIC FRAMEWORK STRIP — use EXISTING /strategy route + /resources
----------------------------------------------------------------------------- */
const StrategicFrameworkStrip: React.FC = () => {
  const items = [
    { icon: <Target className="h-6 w-6" />, title: "Mandate", body: "Define the mission boundary. No mandate = no strategy." },
    { icon: <Map className="h-6 w-6" />, title: "Terrain", body: "Market structure, rivals, constraints. Reality first." },
    { icon: <Scale className="h-6 w-6" />, title: "Choices", body: "Trade-offs written. If it’s not written, it isn’t real." },
    { icon: <Workflow className="h-6 w-6" />, title: "OS", body: "Decision rights + cadence. Strategy becomes routine." },
    { icon: <Gauge className="h-6 w-6" />, title: "Governance", body: "Accountability that keeps the machine honest." },
  ] as const;

  return (
    <section className="bg-black py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
              Strategic framework
            </p>
            <h2 className="mt-4 font-serif text-4xl font-light text-amber-100 sm:text-5xl">
              Capacity is proven by method.
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              Five layers that prevent strategy from collapsing at first contact with reality.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href={ROUTES.strategy}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-amber-400/40 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-amber-200"
            >
              Strategy <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={ROUTES.resources}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-gray-200"
            >
              Resources <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {items.map((it) => (
            <div
              key={it.title}
              className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl"
            >
              <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-300">
                {it.icon}
              </div>
              <h3 className="text-xl font-semibold text-amber-100">{it.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-300">{it.body}</p>
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
  <section className="bg-black py-16">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
            Canon · Core backbone
          </p>
          <h2 className="mt-4 font-serif text-4xl font-light text-amber-100 sm:text-5xl">
            The blueprint that underwrites the firm
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            First principles and operating logic — written to last longer than a trend cycle.
          </p>
        </div>

        <Link
          href={ROUTES.canon}
          className="inline-flex items-center justify-center gap-3 rounded-full border border-amber-400/40 bg-white/5 px-7 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-amber-200"
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
    <section className="bg-black py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
              Shorts · Field signals
            </p>
            <h2 className="mt-4 font-serif text-4xl font-light text-amber-100 sm:text-5xl">
              Executive notes for builders.
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              Concise insights that cut through noise and translate into action.
            </p>
          </div>

          <Link
            href={ROUTES.shorts}
            className="inline-flex items-center justify-center gap-3 rounded-full border border-amber-400/40 bg-white/5 px-7 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-amber-200"
          >
            <span>View all shorts</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {shorts.map((short) => {
            const href = getDocHref(short);
            return (
              <Link
                key={short.slug ?? short._raw?.flattenedPath ?? short.title ?? href}
                href={href}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 backdrop-blur-xl hover:border-amber-400/35"
              >
                <div className="mb-5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                    <Sparkles className="h-3.5 w-3.5" />
                    Field note
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    {short.readTime ?? "3 min"}
                  </span>
                </div>

                <h3 className="mb-3 line-clamp-2 font-serif text-2xl font-semibold text-amber-100">
                  {short.title}
                </h3>
                <p className="line-clamp-3 text-sm leading-relaxed text-gray-300">
                  {short.excerpt || short.description}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-5">
                  <span className="text-sm font-medium text-gray-400">Read analysis</span>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/25 bg-amber-500/5">
                    <ArrowRight className="h-5 w-5 text-amber-200" />
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
   BOOKS IN DEVELOPMENT
----------------------------------------------------------------------------- */
const BooksInDevelopment: React.FC = () => (
  <section className="bg-black py-16">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
            Books & manuscripts
          </p>
          <h2 className="mt-4 font-serif text-4xl font-light text-amber-100 sm:text-5xl">
            Long-form work for longevity
          </h2>
          <p className="mt-4 text-lg text-gray-300">
            Deep-dive explorations currently in development.
          </p>
        </div>

        <Link
          href={ROUTES.books}
          className="inline-flex items-center justify-center gap-3 rounded-full border border-amber-400/40 bg-white/5 px-7 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-amber-200"
        >
          <span>View all books</span>
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {BOOKS_IN_DEV.map((book) => (
          <Link
            key={book.slug}
            href={`${ROUTES.books}/${book.slug}`}
            className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl hover:border-amber-400/35"
          >
            <article className="flex h-full">
              <div className="relative w-40 flex-shrink-0 overflow-hidden">
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-r from-black/25 to-transparent" />
                <Image
                  src={book.cover}
                  alt={book.title}
                  fill
                  quality={90}
                  className="object-cover"
                />
                <div className="absolute bottom-4 left-4 right-4 z-20">
                  <div className="h-2 rounded-full bg-black/60 backdrop-blur-sm">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600"
                      style={{ width: `${book.progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs font-medium text-white">
                    {book.progress}% complete
                  </p>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-7">
                <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-200">
                  {book.tag}
                </span>

                <h3 className="mb-3 font-serif text-2xl font-semibold text-amber-100">
                  {book.title}
                </h3>

                <p className="mb-6 flex-1 text-sm leading-relaxed text-gray-300">
                  {book.blurb}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-amber-200">
                    In development
                  </span>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-400/25 bg-amber-500/5">
                    <ArrowRight className="h-5 w-5 text-amber-200" />
                  </span>
                </div>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

/* -----------------------------------------------------------------------------
   STRATEGIC SESSIONS CTA
----------------------------------------------------------------------------- */
const StrategicSessions: React.FC = () => (
  <section className="relative overflow-hidden bg-black py-20">
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.10),transparent_60%)]" />
    <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-300">
        Advisory engagement
      </p>
      <h2 className="mt-6 font-serif text-5xl font-light text-amber-100 sm:text-6xl">
        Advisory that produces{" "}
        <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
          deployable systems
        </span>
      </h2>
      <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-300">
        Diagnose, decide, deploy — with governance and cadence that stick.
      </p>

      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <Link
          href={ROUTES.consulting}
          className="inline-flex items-center justify-center gap-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-10 py-5 text-lg font-bold text-black"
        >
          <Briefcase className="h-6 w-6" />
          <span>Book a Strategic Session</span>
          <ArrowRight className="h-6 w-6" />
        </Link>

        <Link
          href={`${ROUTES.consulting}#offer`}
          className="inline-flex items-center justify-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-9 py-5 text-sm font-semibold uppercase tracking-[0.15em] text-gray-200"
        >
          <span>View offer</span>
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      <div className="mt-14 grid gap-8 sm:grid-cols-3">
        {[
          { icon: <Target className="h-6 w-6" />, text: "Diagnostic-first approach" },
          { icon: <Users2 className="h-6 w-6" />, text: "Direct partner access" },
          { icon: <TrendingUp className="h-6 w-6" />, text: "Accountability cadence" },
        ].map((item) => (
          <div key={item.text} className="flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
              <div className="text-amber-300">{item.icon}</div>
            </div>
            <span className="text-base font-medium text-amber-100">{item.text}</span>
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
      title="Abraham of London — Consulting-Grade Advisory"
      description="Consulting-grade diagnostics and governance: mandate clarity, operating models, execution cadence, and deployable systems that survive pressure."
      fullWidth
      className="bg-black"
    >
      {/* IMPORTANT: Layout wraps <main>. We keep sections responsible for width. */}
      <HeroSection />

      <TrustSignals />

      <ServiceLines />

      <section className="border-y border-white/10 bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <AnimatedStatsBar />
        </div>
      </section>

      <SectionDivider />

      <DeliveryModel />

      <SectionDivider withOrnament={false} />

      <StrategicFrameworkStrip />

      <SectionDivider />

      <CanonShowcase />

      <SectionDivider withOrnament={false} />

      {featuredShorts.length > 0 ? <ShortsStrip shorts={featuredShorts} /> : null}

      <EnhancedVenturesSection />

      <BooksInDevelopment />

      <StrategicSessions />
    </Layout>
  );
};

export default HomePage;

/* -----------------------------------------------------------------------------
   BUILD-TIME DATA
----------------------------------------------------------------------------- */
export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  try {
    const allShorts = await getAllShorts();

    const featuredShorts = (allShorts as any[])
      .filter((s) => s && (s.published ?? true) && !(s.draft ?? false))
      .sort((a, b) => {
        const da = a?.date ? new Date(a.date).getTime() : 0;
        const db = b?.date ? new Date(b.date).getTime() : 0;
        return db - da;
      })
      .slice(0, 3);

    return { props: { featuredShorts }, revalidate: 3600 };
  } catch (error) {
    // Don’t crash the homepage because “shorts” had a bad day.
    console.error("Error fetching shorts:", error);
    return { props: { featuredShorts: [] }, revalidate: 3600 };
  }
};