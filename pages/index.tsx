// pages/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

import Layout from "@/components/Layout";
import StatsBar from "@/components/homepage/StatsBar";
import VenturesSection from "@/components/homepage/VenturesSection";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";
import CanonPrimaryCard from "@/components/Cards/CanonPrimaryCard";

import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Shield,
  Layers,
  Gauge,
  Workflow,
  Target,
  Scale,
  LineChart,
  Map,
  ClipboardList,
  FileText,
  Wrench,
  CheckCircle2,
} from "lucide-react";

import { getPublishedShorts, getDocHref } from "@/lib/contentlayer-helper";

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
  _raw?: { sourceFileName?: string; flattenedPath?: string };
  date?: string | Date | null;
};

type HomePageProps = {
  featuredShorts: LooseShort[];
};

/* -----------------------------------------------------------------------------
   SMALL UI HELPERS
----------------------------------------------------------------------------- */

const SectionDivider: React.FC = () => (
  <div className="relative h-16 overflow-hidden bg-white dark:bg-slate-950">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-200/40 to-transparent dark:via-amber-500/25" />
      <div className="mx-6 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-gradient-to-br from-amber-400 to-amber-600" />
        <div className="h-1 w-1 rounded-full bg-amber-400/60" />
        <div className="h-2 w-2 rounded-full bg-gradient-to-br from-amber-400 to-amber-600" />
      </div>
      <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-200/40 to-transparent dark:via-amber-500/25" />
    </div>
  </div>
);

const Pill: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-100 backdrop-blur-sm">
    {children}
  </span>
);

function safeDateTime(v: any): number {
  try {
    if (!v) return 0;
    const d = v instanceof Date ? v : new Date(String(v));
    const t = d.getTime();
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}

/* -----------------------------------------------------------------------------
   TRUST SIGNALS
----------------------------------------------------------------------------- */

const TrustSignals: React.FC = () => (
  <section className="bg-white py-10 dark:bg-slate-950">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900 md:grid-cols-3">
        <div className="flex gap-3">
          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
            <BadgeCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Governance-grade thinking
            </p>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-300">
              Mandates, decision rights, controls, cadence — built to survive audit, scrutiny, and scale.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
            <Workflow className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Strategy → execution linkage
            </p>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-300">
              No slide-deck theatre. Outputs are deployable assets with ownership, milestones, and governance.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-300">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Conviction, not vibes
            </p>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-300">
              Christian ethics, historical realism, and strategic discipline — because incentives change under pressure.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* -----------------------------------------------------------------------------
   STRATEGIC FRAMEWORK STRIP (IN-PAGE, DOES NOT CHANGE YOUR DESIGN SYSTEM)
   This is the “credibility demonstration” layer you asked for.
----------------------------------------------------------------------------- */

const StrategicFrameworkStrip: React.FC = () => {
  const items = [
    {
      icon: <Target className="h-5 w-5" />,
      title: "Mandate",
      body: "Define the mission boundary and the non-negotiables. No mandate = no strategy.",
    },
    {
      icon: <Map className="h-5 w-5" />,
      title: "Terrain",
      body: "Market structure, constraints, and adversaries. Reality first — feelings later.",
    },
    {
      icon: <Scale className="h-5 w-5" />,
      title: "Choices",
      body: "Trade-offs on paper. If it isn’t written, it’s an illusion you’ll pay for later.",
    },
    {
      icon: <Workflow className="h-5 w-5" />,
      title: "Operating System",
      body: "Decision rights, cadence, KPI tree, escalation paths. Strategy becomes routine.",
    },
    {
      icon: <Gauge className="h-5 w-5" />,
      title: "Governance",
      body: "Controls + accountability that keep the machine honest when pressure hits.",
    },
  ] as const;

  return (
    <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
              Strategic framework
            </p>
            <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-white sm:text-4xl">
              Capacity is proven by method.
            </h2>
          </div>

          <Link
            href="/resources/strategic-frameworks"
            className="inline-flex items-center justify-center rounded-full border border-amber-400/50 bg-amber-400/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200 transition hover:bg-amber-400/10"
          >
            View frameworks
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {items.map((it) => (
            <div
              key={it.title}
              className="rounded-2xl border border-white/10 bg-slate-800/60 p-5 shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-amber-400/35"
            >
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                {it.icon}
              </div>
              <p className="text-sm font-semibold text-white">{it.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-300">{it.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-4 rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-sm md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
              What you get
            </p>
            <p className="mt-2 text-sm text-gray-200">
              Decision memo. Choice architecture. Operating model blueprint. KPI tree. Risk register.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
              What you don’t get
            </p>
            <p className="mt-2 text-sm text-gray-200">
              Therapy with business vocabulary. Brainstorming without authority. “Tell me what you think.”
            </p>
          </div>
          <div className="flex items-center md:justify-end">
            <Link
              href="/consulting"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-900/30 transition hover:scale-[1.02]"
            >
              <Briefcase className="h-4 w-4" />
              Engage Advisory
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   CAPABILITIES
----------------------------------------------------------------------------- */

const Capabilities: React.FC = () => {
  const items = [
    {
      icon: <Target className="h-6 w-6" />,
      title: "Corporate & Competitive Strategy",
      points: ["Mandate & positioning", "Market logic & segmentation", "Strategic choices & trade-offs"],
      tone: "amber",
    },
    {
      icon: <Workflow className="h-6 w-6" />,
      title: "Operating Model & Execution",
      points: ["Decision rights & accountability", "Operating cadence", "Delivery governance & KPI trees"],
      tone: "blue",
    },
    {
      icon: <Scale className="h-6 w-6" />,
      title: "Governance & Risk Discipline",
      points: ["Controls & escalation paths", "Policy architecture", "Incentives under pressure"],
      tone: "emerald",
    },
    {
      icon: <LineChart className="h-6 w-6" />,
      title: "Growth & Commercial Systems",
      points: ["Revenue engine design", "Partnership strategy", "Go-to-market operating system"],
      tone: "amber",
    },
    {
      icon: <Map className="h-6 w-6" />,
      title: "Institution Building",
      points: ["Culture as a system", "Leadership formation", "Institutional memory & continuity"],
      tone: "blue",
    },
    {
      icon: <Layers className="h-6 w-6" />,
      title: "Field Deployment",
      points: ["Pilot-to-scale loops", "Operating constraints mapping", "Frameworks refined by reality"],
      tone: "emerald",
    },
  ] as const;

  const toneStyles: Record<string, { ring: string; icon: string; hover: string }> = {
    amber: {
      ring: "hover:border-amber-400/40",
      icon: "bg-amber-500/20 text-amber-400",
      hover: "hover:shadow-amber-900/20",
    },
    blue: {
      ring: "hover:border-blue-400/40",
      icon: "bg-blue-500/20 text-blue-400",
      hover: "hover:shadow-blue-900/20",
    },
    emerald: {
      ring: "hover:border-emerald-400/40",
      icon: "bg-emerald-500/20 text-emerald-400",
      hover: "hover:shadow-emerald-900/20",
    },
  };

  return (
    <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
            Advisory capabilities
          </p>
          <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-white sm:text-4xl">
            Built like a firm — not a personality brand
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((c) => {
            const t = toneStyles[c.tone];
            return (
              <article
                key={c.title}
                className={[
                  "flex h-full flex-col rounded-2xl border border-white/10 bg-slate-800/60 p-6 backdrop-blur-sm transition-all",
                  "hover:-translate-y-1 hover:bg-slate-800/80 hover:shadow-2xl",
                  t.ring,
                  t.hover,
                ].join(" ")}
              >
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full ${t.icon}`}>
                  {c.icon}
                </div>
                <h3 className="mb-3 font-serif text-lg font-semibold text-white">{c.title}</h3>
                <ul className="mb-1 space-y-2 text-sm leading-relaxed text-gray-300">
                  {c.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-gray-400" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   DELIVERY MODEL
----------------------------------------------------------------------------- */

const DeliveryModel: React.FC = () => (
  <section className="bg-white py-16 dark:bg-slate-950">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">
          How we work
        </p>
        <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-slate-900 dark:text-white sm:text-4xl">
          A disciplined delivery model
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="grid gap-4">
            {[
              { step: "01", title: "Diagnostic & problem framing", icon: <ClipboardList className="h-5 w-5" /> },
              { step: "02", title: "Design & strategic options", icon: <FileText className="h-5 w-5" /> },
              { step: "03", title: "Execution governance", icon: <Gauge className="h-5 w-5" /> },
              { step: "04", title: "Institutionalization", icon: <Wrench className="h-5 w-5" /> },
            ].map((s) => (
              <div
                key={s.step}
                className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
                  {s.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">{s.title}</p>
                    <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
                      {s.step}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 dark:text-gray-300">
              Typical deliverables
            </p>
            <ul className="mt-5 space-y-3 text-sm leading-relaxed text-slate-700 dark:text-gray-300">
              {[
                "Executive brief: decision memo",
                "Choice architecture (trade-offs written down)",
                "Operating model blueprint",
                "KPI tree + operating cadence",
                "Risk register + controls",
              ].map((d) => (
                <li key={d} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500 dark:text-gray-400">
                Control point
              </p>
              <p className="mt-2 text-sm text-slate-700 dark:text-gray-200">
                If authority is unclear, the engagement pauses. A Strategy Room is not booked for anxiety.
              </p>
            </div>

            <div className="mt-6">
              <Link
                href="/resources/strategy-room-intake"
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100 dark:hover:bg-slate-800"
              >
                Strategy Room Intake
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* -----------------------------------------------------------------------------
   SHORTS STRIP
----------------------------------------------------------------------------- */

const ShortsStrip: React.FC<{ shorts: LooseShort[] }> = ({ shorts }) => {
  const items = Array.isArray(shorts) ? shorts : [];
  if (items.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
              Shorts · Field signals
            </p>
            <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-white sm:text-4xl">
              Quick hits for builders
            </h2>
          </div>

          <Link
            href="/shorts"
            className="inline-flex items-center rounded-full border border-amber-400/60 bg-amber-400/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200 transition-all hover:bg-amber-400/10"
          >
            View all shorts
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {items.map((short) => {
            const href = getDocHref(short as any);
            if (!href) return null;

            return (
              <Link
                key={href}
                href={href}
                className="group flex h-full flex-col rounded-2xl border border-white/10 bg-slate-800/60 p-6 shadow-lg backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-amber-400/50"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                    Short
                  </span>
                  <span className="text-xs font-medium text-gray-400">{short.readTime || "5 min"}</span>
                </div>
                <h3 className="mb-3 line-clamp-2 font-serif text-xl font-semibold text-white">
                  {short.title || "Untitled"}
                </h3>
                <p className="mb-4 line-clamp-3 flex-1 text-sm text-gray-300">
                  {short.excerpt || short.description || ""}
                </p>
                <div className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-amber-200">
                  Read
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
   CANON SPOTLIGHT (404-FIXED)
----------------------------------------------------------------------------- */

const CanonSpotlight: React.FC = () => (
  <section className="bg-white py-16 dark:bg-slate-950">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">
            Canon · Core backbone
          </p>
          <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            The blueprint
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-gray-300">
            Not content. A system. A library of first principles that builds governance, purpose, and institutional memory.
          </p>
        </div>

        <Link
          href="/canon"
          className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-slate-50 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-100 dark:hover:bg-slate-800"
        >
          Browse the Canon
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </div>

      {/* ✅ 404 FIX: href matches the slug in volume-i-foundations-of-purpose.mdx */}
      <CanonPrimaryCard
        title="The Architecture of Human Purpose"
        href="/canon/volume-i-foundations-of-purpose"
        excerpt="The foundational volume: a framework for discerning and deploying purpose across a lifetime. How to build systems, structures, and legacies that outlast you."
        volumeNumber={1}
        image="/assets/images/canon/architecture-of-human-purpose-cover.jpg"
        className="mx-auto max-w-2xl"
      />
    </div>
  </section>
);

/* -----------------------------------------------------------------------------
   HERO (ON-BRAND, BUT SIMPLE AND SAFE)
----------------------------------------------------------------------------- */

const Hero: React.FC = () => (
  <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
    {/* subtle backdrop */}
    <div className="pointer-events-none absolute inset-0 opacity-40">
      <div className="absolute -top-24 left-1/2 h-72 w-[42rem] -translate-x-1/2 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />
    </div>

    <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Pill>Advisory platform</Pill>
            <Pill>Canon library</Pill>
            <Pill>Shorts & essays</Pill>
          </div>

          <h1 className="font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            Abraham of London
            <span className="mt-4 block text-xl font-normal text-amber-100 sm:text-2xl lg:text-3xl italic">
              Legacy doesn&apos;t happen by accident. You architect it.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-relaxed text-gray-200">
            A builder&apos;s platform for people tired of performance culture — and ready for structure.
            Governance, strategy, and formation, anchored in conviction and executed with discipline.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/consulting"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-7 py-3.5 text-sm font-semibold text-black shadow-lg shadow-amber-900/30 transition hover:scale-[1.02]"
            >
              <Briefcase className="h-4 w-4" />
              Engage Advisory
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/canon"
              className="group inline-flex items-center gap-2 rounded-xl border border-amber-400/60 bg-amber-400/5 px-7 py-3.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-400/10"
            >
              <BookOpen className="h-4 w-4" />
              Enter the Canon
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-sm">
            <div className="relative aspect-video w-full">
              <Image
                src="/assets/images/abraham-of-london-banner.webp"
                alt="Abraham of London"
                fill
                className="object-cover"
                priority
              />
            </div>

            <div className="grid gap-3 p-6 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
                  Operating model
                </p>
                <p className="mt-2 text-sm font-semibold text-white">Blueprint → Pressure-test → Govern</p>
                <p className="mt-2 text-sm text-gray-300">
                  Canon frameworks, then advisory decisions, then execution cadence.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
                  Signal policy
                </p>
                <p className="mt-2 text-sm font-semibold text-white">No authority, no room.</p>
                <p className="mt-2 text-sm text-gray-300">
                  We don’t book sessions for panic. We book sessions for decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* -----------------------------------------------------------------------------
   PAGE
----------------------------------------------------------------------------- */

const HomePage: NextPage<HomePageProps> = ({ featuredShorts }) => {
  return (
    <Layout title="Abraham of London">
      <Head>
        <title>Abraham of London</title>
        <meta
          name="description"
          content="Governance-grade strategy, conviction, and institutional design — Canon library, shorts, and advisory."
        />
      </Head>

      <Hero />
      <TrustSignals />
      <StatsBar />

      <SectionDivider />
      <StrategicFrameworkStrip />

      <SectionDivider />
      <Capabilities />

      <SectionDivider />
      <DeliveryModel />

      <SectionDivider />
      <CanonSpotlight />

      <SectionDivider />
      <StrategicFunnelStrip />

      <SectionDivider />
      <ShortsStrip shorts={featuredShorts} />

      <SectionDivider />
      <VenturesSection />
    </Layout>
  );
};

export default HomePage;

/* -----------------------------------------------------------------------------
   DATA
----------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  try {
    const all = (getPublishedShorts() as unknown as LooseShort[]) || [];
    const featuredShorts = all
      .filter(Boolean)
      .filter((s) => !(s as any)?.draft)
      .sort((a, b) => safeDateTime(b?.date) - safeDateTime(a?.date))
      .slice(0, 3);

    return { props: { featuredShorts }, revalidate: 3600 };
  } catch {
    return { props: { featuredShorts: [] }, revalidate: 3600 };
  }
};