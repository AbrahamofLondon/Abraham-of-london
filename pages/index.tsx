// pages/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";

import Layout from "@/components/Layout";
import StatsBar from "@/components/homepage/StatsBar";
import VenturesSection from "@/components/homepage/VenturesSection";
import CanonPrimaryCard from "@/components/Cards/CanonPrimaryCard";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";
import { LinkItemWithIcon, LinkItemWithBadge } from "@/components/Cards/partials";

import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Briefcase,
  Calendar,
  Compass,
  FileText,
  Gauge,
  Layers,
  Shield,
  Sparkles,
  Users,
  Wrench,
  Building2,
  Target,
  Workflow,
  Scale,
  LineChart,
  Map,
  ClipboardList,
  CheckCircle2,
} from "lucide-react";

import {
  getPublishedShorts,
  getRecentShorts,
  getDocHref,
  normalizeSlug,
} from "@/lib/contentlayer-helper";

/* -----------------------------------------------------------------------------
   BOOKS IN DEVELOPMENT
----------------------------------------------------------------------------- */

const BOOKS_IN_DEV = [
  {
    slug: "fathering-without-fear",
    title: "Fathering Without Fear",
    tag: "Fatherhood · Household",
    blurb:
      "Standards, rituals, and household architecture for men building families that outlast culture wars.",
    cover: "/assets/images/books/fathering-without-fear.jpg",
  },
  {
    slug: "the-fiction-adaptation",
    title: "The Fiction Adaptation",
    tag: "Fiction · Drama",
    blurb:
      "A covert retelling of a story too real for the courtroom — where truth hides in fiction and fiction cuts deeper than fact.",
    cover: "/assets/images/books/the-fiction-adaptation.jpg",
  },
] as const;

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
   SMALL HELPERS (KEEP HOMEPAGE STABLE)
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

function safeTime(v: any): number {
  try {
    if (!v) return 0;
    const d = v instanceof Date ? v : new Date(String(v));
    const t = d.getTime();
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
}

function looksPublished(s: LooseShort): boolean {
  if (s.published === true) return true;
  if (s.published === false) return false;
  if (s.draft === true) return false;
  // default: if it has a title + some identity, treat as publishable
  if (s.title && (s.slug || s.url || s._raw?.flattenedPath || s._raw?.sourceFileName)) return true;
  return false;
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
              Mandates, controls, decision rights, and operating cadence — built to survive audit, scrutiny, and scale.
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
              No slide-deck theatre. Every engagement ends in deployable assets, measurable milestones, and ownership.
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
              Christian ethics, historical realism, and strategic discipline — because incentives change when pressure hits.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* -----------------------------------------------------------------------------
   FIRM INTRO (PROPER HOUSE LANGUAGE)
----------------------------------------------------------------------------- */

const FirmIntro: React.FC = () => (
  <section className="bg-white py-16 dark:bg-slate-950">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-7">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">
            Abraham of London · Advisory Platform
          </p>

          <h2 className="mt-3 font-serif text-3xl font-light tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            A builder’s platform for people tired of performance culture — and ready for structure.
          </h2>

          <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-700 dark:text-gray-300">
            <p>
              <strong>Abraham of London</strong> fuses <strong>Christian conviction</strong>,{" "}
              <strong>strategic discipline</strong>, and <strong>historical realism</strong> into systems that work —
              at home, in business, and in public life.
            </p>
            <p>
              The posture is simple: <strong>legacy doesn’t happen by accident</strong>. You architect it.
              We operate like a proper firm: diagnostics first, then design, then execution governance.
            </p>
            <p className="text-sm text-slate-500 dark:text-gray-400">
              If you want trend-chasing, you’re on the wrong site. If you want frameworks that survive pressure — welcome.
            </p>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/consulting"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-900/30 transition-all hover:scale-105 hover:shadow-xl"
            >
              <Briefcase className="h-4 w-4" />
              <span>Engage Advisory</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/canon"
              className="group inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-800 transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:hover:bg-slate-800"
            >
              <BookOpen className="h-4 w-4" />
              <span>Read the Canon</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              href="/downloads"
              className="group inline-flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/5 px-6 py-3 text-sm font-semibold text-amber-700 transition-all hover:bg-amber-500/10 dark:text-amber-200"
            >
              <Wrench className="h-4 w-4" />
              <span>Tools & Templates</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 dark:text-gray-300">
              Operating model
            </p>

            <div className="mt-5 space-y-4">
              <div className="flex gap-3">
                <div className="mt-0.5 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-500/15 text-amber-700 dark:text-amber-300">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    The Canon = Blueprint
                  </p>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-300">
                    First principles, governance logic, and long-term architecture.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-0.5 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  <Gauge className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Advisory = Pressure-test
                  </p>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-300">
                    Diagnostics, options, trade-offs, and decision-ready recommendations.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-0.5 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-500/15 text-blue-700 dark:text-blue-300">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Ventures = Deployment
                  </p>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-300">
                    In-house implementation proving what works outside of theory.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-0.5 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-500/15 text-slate-700 dark:text-gray-300">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    Tools = Institutionalization
                  </p>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-300">
                    Playbooks, templates, dashboards, and routines — embedded into operations.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link
                href="/inner-circle"
                className="inline-flex items-center justify-center rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 transition-all hover:bg-amber-500/15 dark:text-amber-200"
              >
                Inner Circle
              </Link>
              <Link
                href="/consulting"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-700 transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-gray-200 dark:hover:bg-slate-900"
              >
                Advisory Services
              </Link>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-500 dark:text-gray-400">
              Engagements are scoped, governed, and documented. Outputs are designed to be handed to teams, not admired.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* -----------------------------------------------------------------------------
   STRATEGIC FRAMEWORK STRIP (MERGE: FROM “NEW ONE”)
   This is the “capacity proof” layer you asked to keep.
----------------------------------------------------------------------------- */

const StrategicFrameworkStrip: React.FC = () => {
  const items = [
    { icon: <Target className="h-5 w-5" />, title: "Mandate", body: "Define the mission boundary and non-negotiables. No mandate = no strategy." },
    { icon: <Map className="h-5 w-5" />, title: "Terrain", body: "Market structure, constraints, and adversaries. Reality first — feelings later." },
    { icon: <Scale className="h-5 w-5" />, title: "Choices", body: "Trade-offs written down. If it isn’t documented, it isn’t real." },
    { icon: <Workflow className="h-5 w-5" />, title: "Operating System", body: "Decision rights, cadence, KPI tree, escalation paths. Strategy becomes routine." },
    { icon: <Gauge className="h-5 w-5" />, title: "Governance", body: "Controls + accountability that keep the machine honest when pressure hits." },
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
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">What you get</p>
            <p className="mt-2 text-sm text-gray-200">
              Decision memo. Choice architecture. Operating model blueprint. KPI tree. Risk register.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">What you don’t get</p>
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
   CAPABILITIES (BIG-FIRM FEEL)
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
      points: ["Org design & decision rights", "Operating cadence", "Delivery governance & KPIs"],
      tone: "blue",
    },
    {
      icon: <Scale className="h-6 w-6" />,
      title: "Governance & Risk Discipline",
      points: ["Controls & accountability", "Policy architecture", "Incentives under pressure"],
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
      icon: <Building2 className="h-6 w-6" />,
      title: "Venture Deployment",
      points: ["In-house pilots", "Scaled rollouts", "Field feedback loops into the Canon"],
      tone: "emerald",
    },
  ] as const;

  const toneStyles: Record<string, { ring: string; icon: string; hover: string }> = {
    amber: { ring: "hover:border-amber-400/40", icon: "bg-amber-500/20 text-amber-400", hover: "hover:shadow-amber-900/20" },
    blue: { ring: "hover:border-blue-400/40", icon: "bg-blue-500/20 text-blue-400", hover: "hover:shadow-blue-900/20" },
    emerald: { ring: "hover:border-emerald-400/40", icon: "bg-emerald-500/20 text-emerald-400", hover: "hover:shadow-emerald-900/20" },
  };

  return (
    <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
              Advisory capabilities
            </p>
            <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-white sm:text-4xl">
              Built like a firm — not a personality brand
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-300">
              Clear problem frames, disciplined analysis, and governance-grade deliverables. We don’t “inspire” teams — we equip them.
            </p>
          </div>

          <Link
            href="/consulting"
            className="inline-flex items-center justify-center rounded-full border border-amber-400/60 bg-amber-400/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200 transition-all hover:bg-amber-400/10 hover:border-amber-300"
          >
            View advisory services
          </Link>
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

                <ul className="mb-4 space-y-2 text-sm leading-relaxed text-gray-300">
                  {c.points.map((p) => (
                    <li key={p} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 text-gray-400" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>

                <p className="mt-auto text-xs font-medium uppercase tracking-[0.15em] text-gray-500">
                  Standards · Structure · Execution
                </p>
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
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">
            How we work
          </p>
          <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            A disciplined delivery model — designed for repeatability
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-700 dark:text-gray-300">
            The point isn’t “a strategy.” The point is an operating system your people can run without you.
          </p>
        </div>

        <Link
          href="/consulting"
          className="inline-flex items-center rounded-full border border-amber-500/60 bg-amber-500/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 transition-all hover:bg-amber-500/10 hover:border-amber-500 dark:text-amber-300"
        >
          Engagement options
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="grid gap-4">
            {[
              {
                step: "01",
                title: "Diagnostic & problem framing",
                desc: "Clarify the real constraint, map incentives, and define decision rights. No vague briefs.",
                icon: <ClipboardList className="h-5 w-5" />,
              },
              {
                step: "02",
                title: "Design & strategic options",
                desc: "Options, trade-offs, and a decision-ready recommendation — backed by assumptions and risk logic.",
                icon: <FileText className="h-5 w-5" />,
              },
              {
                step: "03",
                title: "Execution governance",
                desc: "Operating cadence, KPI tree, owners, and checkpoints. Strategy becomes an implementation plan.",
                icon: <Gauge className="h-5 w-5" />,
              },
              {
                step: "04",
                title: "Institutionalization",
                desc: "Playbooks, templates, routines, and handover — so capability remains when we exit.",
                icon: <Wrench className="h-5 w-5" />,
              },
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
                  <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-gray-300">{s.desc}</p>
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
                "Executive brief: decision memo (not a 70-slide deck)",
                "Market & competitor map + strategic choice architecture",
                "Operating model blueprint: org, governance, cadence",
                "KPI tree, dashboard spec, and performance rhythm",
                "Risk register + controls + escalation paths",
                "Playbooks & templates for repeatable execution",
              ].map((d) => (
                <li key={d} className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">Engagement formats</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-gray-300">
                Diagnostic sprints, advisory retainers, and embedded execution support — scoped, governed, and documented.
              </p>

              <Link
                href="/consulting"
                className="group mt-4 inline-flex items-center gap-2 text-sm font-semibold text-amber-700 transition-all hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
              >
                View formats
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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
  if (!shorts || shorts.length === 0) return null;

  return (
    <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
              Shorts · Field signals
            </p>
            <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-white sm:text-4xl">
              Quick hits for builders who don&apos;t scroll all day
            </h2>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-300">
              Concise field notes on work, livelihood, and building under pressure — designed to be read between meetings, not instead of them.
            </p>
          </div>

          <Link
            href="/shorts"
            className="inline-flex items-center rounded-full border border-amber-400/60 bg-amber-400/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200 transition-all hover:bg-amber-400/10 hover:border-amber-300"
          >
            View all shorts
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {shorts.map((short) => {
            const href = getDocHref(short as any);
            if (!href) return null;

            const title = String(short.title || "Short").trim();
            const readTime = String(short.readTime || "Quick read").trim();
            const excerpt = String(short.excerpt || short.description || "").trim();

            const key =
              href ||
              short.slug ||
              short._raw?.sourceFileName ||
              short._raw?.flattenedPath ||
              normalizeSlug(short as any) ||
              title;

            return (
              <Link
                key={key}
                href={href}
                className="group flex h-full flex-col rounded-2xl border border-white/10 bg-slate-800/60 p-6 shadow-lg backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-amber-400/50 hover:bg-slate-800/80 hover:shadow-2xl"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                    <Sparkles className="h-3 w-3" />
                    Short
                  </span>
                  <span className="text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
                    {readTime}
                  </span>
                </div>

                <h3 className="mb-3 line-clamp-2 font-serif text-xl font-semibold text-white">{title}</h3>

                {excerpt ? (
                  <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-300">{excerpt}</p>
                ) : null}

                <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-xs font-medium uppercase tracking-[0.15em] text-gray-400">
                    Field note
                  </span>
                  <span className="inline-flex items-center text-sm font-semibold text-amber-300 transition-all group-hover:text-amber-200">
                    Read <span className="ml-1 transition-transform group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <LinkItemWithIcon
            href="/inner-circle"
            icon={<Users className="h-5 w-5" />}
            title="Join Inner Circle"
            description="Access premium content and exclusive community"
            iconColor="amber"
          />
          <LinkItemWithBadge
            href="/canon"
            title="Explore The Canon"
            badge="Core"
            description="Foundational principles and long-term thinking"
            badgeColor="amber"
            badgeVariant="filled"
          />
          <LinkItemWithIcon
            href="/books"
            icon={<BookOpen className="h-5 w-5" />}
            title="Books & Manuscripts"
            description="Published long-form work and books in development"
            iconColor="blue"
          />
          <LinkItemWithBadge
            href="/downloads"
            title="Strategic Resources"
            badge="Deploy"
            description="Tools, frameworks, and downloadable assets"
            badgeColor="green"
            badgeVariant="outline"
          />
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   BOOKS IN DEVELOPMENT
----------------------------------------------------------------------------- */

const BooksInDevelopment: React.FC = () => (
  <section className="bg-white py-16 dark:bg-slate-950">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">
            Books & manuscripts
          </p>
          <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Long-form work that underwrites everything else
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-700 dark:text-gray-300">
            Published books, Canon preludes, and manuscripts in development — slow-cooked work built for longevity.
          </p>
        </div>

        <Link
          href="/books"
          className="inline-flex items-center rounded-full border border-amber-500/60 bg-amber-500/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 transition-all hover:bg-amber-500/10 hover:border-amber-500 dark:text-amber-300"
        >
          View all books
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {BOOKS_IN_DEV.map((book) => (
          <Link key={book.slug} href={`/books/${book.slug}`} className="group block">
            <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition-all hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900">
              <div className="grid gap-0 md:grid-cols-[auto,1fr]">
                <div className="relative aspect-[3/4] w-full max-w-[9rem] flex-shrink-0">
                  <Image
                    src={book.cover}
                    alt={book.title}
                    fill
                    sizes="(max-width: 768px) 35vw, 20vw"
                    className="object-cover"
                  />
                </div>

                <div className="flex flex-col justify-between p-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                      In development
                    </p>
                    <h3 className="mt-2 font-serif text-xl font-semibold text-slate-900 dark:text-white">
                      {book.title}
                    </h3>
                    <p className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-slate-600 dark:text-gray-400">
                      {book.tag}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-gray-300">
                      {book.blurb}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
                    <span className="text-xs font-medium uppercase tracking-[0.15em] text-slate-500 dark:text-gray-500">
                      Manuscript shelf
                    </span>
                    <span className="text-sm font-semibold text-amber-600 transition-transform group-hover:translate-x-1 dark:text-amber-400">
                      View project →
                    </span>
                  </div>
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
   STRATEGIC SESSIONS
----------------------------------------------------------------------------- */

const StrategicSessions: React.FC = () => (
  <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
            Consulting · Strategic sessions
          </p>
          <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-white sm:text-4xl">
            Advisory that produces deployable systems
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-gray-300">
            Proper engagement standards: clear scope, rigorous analysis, and execution governance — built for founders, boards, and household leaders carrying real responsibility.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/consulting"
            className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-black shadow-lg shadow-amber-900/30 transition-all hover:scale-105 hover:shadow-xl"
          >
            Book a conversation
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center justify-center rounded-full border border-amber-400/60 bg-amber-400/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200 transition-all hover:bg-amber-400/10 hover:border-amber-300"
          >
            Upcoming rooms
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-slate-800/60 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-amber-400/30 hover:bg-slate-800/80 hover:shadow-2xl">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">
            <Compass className="h-6 w-6" />
          </div>
          <h3 className="mb-3 font-serif text-lg font-semibold text-white">
            Strategy rooms for founders & boards
          </h3>
          <p className="mb-4 text-sm leading-relaxed text-gray-300">
            Mandate clarity, market logic, operating model, and execution rhythm — so your decisions stop fighting your design.
          </p>
          <p className="mt-auto text-xs font-medium uppercase tracking-[0.15em] text-gray-500">
            Decision memo · Operating model · KPI tree
          </p>
        </article>

        <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-slate-800/60 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-emerald-400/30 hover:bg-slate-800/80 hover:shadow-2xl">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
            <Users className="h-6 w-6" />
          </div>
          <h3 className="mb-3 font-serif text-lg font-semibold text-white">
            Household architecture & fatherhood
          </h3>
          <p className="mb-4 text-sm leading-relaxed text-gray-300">
            Standards, rituals, and systems that produce stability — and preserve continuity under modern pressure.
          </p>
          <p className="mt-auto text-xs font-medium uppercase tracking-[0.15em] text-gray-500">
            Household OS · Formation tools · Ritual design
          </p>
        </article>

        <article className="flex h-full flex-col rounded-2xl border border-white/10 bg-slate-800/60 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-blue-400/30 hover:bg-slate-800/80 hover:shadow-2xl">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
            <Calendar className="h-6 w-6" />
          </div>
          <h3 className="mb-3 font-serif text-lg font-semibold text-white">
            Leadership salons & Inner Circle work
          </h3>
          <p className="mb-4 text-sm leading-relaxed text-gray-300">
            High-trust rooms where Canon frameworks are tested against real lives and real P&amp;Ls — then refined into tools.
          </p>
          <p className="mt-auto text-xs font-medium uppercase tracking-[0.15em] text-gray-500">
            Framework lab · Closed rooms · Builder network
          </p>
        </article>
      </div>
    </div>
  </section>
);

/* -----------------------------------------------------------------------------
   HERO (MERGE: KEEP YOUR WRITING + KEEP “NEW ONE” TIGHTNESS)
----------------------------------------------------------------------------- */

const Hero: React.FC = () => (
  <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
    <div className="absolute inset-0">
      <div className="pointer-events-none absolute -top-40 right-0 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-emerald-500/8 blur-3xl" />
    </div>

    <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-7">
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <Pill>Blueprint</Pill>
            <Pill>Advisory</Pill>
            <Pill>Deployment</Pill>
            <Pill>Tools</Pill>
          </div>

          <h1 className="mb-5 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
            Abraham of London
            <span className="mt-4 block text-xl font-normal text-amber-100 sm:text-2xl lg:text-3xl">
              Legacy doesn’t happen by accident. You architect it.
            </span>
          </h1>

          <p className="mb-8 max-w-2xl text-base leading-relaxed text-gray-300 sm:text-lg">
            A builder’s platform for people tired of performance culture — and ready for structure.
            We fuse Christian conviction, strategic discipline, and historical realism into systems that work:
            at home, in business, and in public life.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/consulting"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-7 py-3.5 text-sm font-semibold text-black shadow-lg shadow-amber-900/30 transition-all hover:scale-105 hover:shadow-xl"
            >
              <Briefcase className="h-4 w-4" />
              <span>Engage Advisory</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>

            <Link
              href="/canon"
              className="group inline-flex items-center gap-2 rounded-xl border border-amber-400/60 bg-amber-400/5 px-7 py-3.5 text-sm font-semibold text-amber-100 transition-all hover:scale-105 hover:bg-amber-500/10"
            >
              <BookOpen className="h-4 w-4" />
              <span>Enter the Canon</span>
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>

          <p className="mt-6 text-xs uppercase tracking-[0.2em] text-gray-500">
            Canon · Consulting · Ventures · Tools · Books · Inner Circle
          </p>
        </div>

        <div className="relative lg:col-span-5">
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-sm">
            <div className="relative aspect-video w-full">
              <Image
                src="/assets/images/abraham-of-london-banner.webp"
                alt="Abraham of London - Blueprint, advisory, and field deployment"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            </div>

            <div className="border-t border-white/10 bg-slate-900/90 px-5 py-4 backdrop-blur-sm">
              <p className="text-sm font-medium leading-relaxed text-gray-200">
                The Canon provides the blueprint. Advisory pressure-tests the frameworks.
                Ventures deploy them in-house. Tools institutionalize them inside real operations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* -----------------------------------------------------------------------------
   CANON SHOWCASE (FIXED 404)
   IMPORTANT: The href MUST match your Contentlayer computed url for Volume I.
   You previously confirmed the correct slug is:
     /canon/volume-i-foundations-of-purpose
----------------------------------------------------------------------------- */

const CanonShowcase: React.FC = () => (
  <section className="bg-white py-16 dark:bg-slate-950">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">
            Canon · Core backbone
          </p>
          <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            The blueprint that underwrites the firm
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-700 dark:text-gray-300">
            Purpose, governance, civilisation, stewardship, and destiny — written to produce decision-ready frameworks,
            not internet content.
          </p>
        </div>

        <Link
          href="/canon"
          className="inline-flex items-center rounded-full border border-amber-500/60 bg-amber-500/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 transition-all hover:bg-amber-500/10 hover:border-amber-500 dark:text-amber-300"
        >
          Browse Canon entries
        </Link>
      </div>

      {/* ✅ 404-FIXED LINK */}
      <CanonPrimaryCard
        title="The Architecture of Human Purpose"
        href="/canon/volume-i-foundations-of-purpose"
        excerpt="The foundational volume: a framework for discerning and deploying purpose across a lifetime. How to build systems, structures, and legacies that outlast you."
        volumeNumber={1}
        image="/assets/images/canon/architecture-of-human-purpose-cover.jpg"
        className="mx-auto max-w-2xl"
      />

      <div className="mt-10 grid gap-4 md:grid-cols-2">
        <LinkItemWithBadge
          href="/canon"
          title="Canon Library"
          badge="Blueprint"
          description="Full index of long-form foundations and strategic frameworks."
          badgeColor="amber"
          badgeVariant="filled"
        />
        <LinkItemWithIcon
          href="/downloads"
          icon={<Wrench className="h-5 w-5" />}
          title="Implementation Kit"
          description="Templates, diagnostics, and playbooks aligned to Canon frameworks."
          iconColor="blue"
        />
      </div>
    </div>
  </section>
);

/* -----------------------------------------------------------------------------
   PAGE
----------------------------------------------------------------------------- */

const HomePage: NextPage<HomePageProps> = ({ featuredShorts }) => {
  const siteTitle = "Abraham of London";
  const siteTagline =
    "A builder’s advisory platform — Christian conviction, strategic discipline, and historical realism turned into systems that survive pressure.";

  return (
    <Layout
      title={siteTitle}
      description={siteTagline}
      structuredData={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteTitle,
        description: siteTagline,
        url: process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org",
        publisher: { "@type": "Person", name: "Abraham of London" },
      }}
    >
      <Hero />
      <TrustSignals />
      <FirmIntro />

      {/* StatsBar sometimes expects page-width container. Keep your original safe wrapper. */}
      <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <StatsBar />
        </div>
      </section>

      <SectionDivider />

      {/* ✅ MERGE WIN: keep “capacity proof” strip from the newer homepage */}
      <StrategicFrameworkStrip />

      <SectionDivider />
      <Capabilities />

      <SectionDivider />
      <DeliveryModel />

      <SectionDivider />
      <CanonShowcase />

      <SectionDivider />
      <StrategicFunnelStrip />

      <SectionDivider />
      {featuredShorts.length > 0 ? (
        <>
          <ShortsStrip shorts={featuredShorts} />
          <SectionDivider />
        </>
      ) : null}

      {/* Field proof */}
      <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16">
        <VenturesSection />
      </section>

      <SectionDivider />
      <BooksInDevelopment />

      <SectionDivider />
      <StrategicSessions />
    </Layout>
  );
};

export default HomePage;

/* -----------------------------------------------------------------------------
   BUILD-TIME DATA
   MERGE WIN:
   - tries getRecentShorts(3) first (fast, curated)
   - falls back to getPublishedShorts()
   - filters “draft” safely
   - sorts by date if present
----------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  const getFeaturedShortsSafely = (): LooseShort[] => {
    try {
      const recent = getRecentShorts?.(3) as unknown as LooseShort[];
      const cleanedRecent = Array.isArray(recent) ? recent : [];
      if (cleanedRecent.length > 0) return cleanedRecent;

      const all = getPublishedShorts?.() as unknown as LooseShort[];
      const cleanedAll = Array.isArray(all) ? all : [];
      return cleanedAll;
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[home] Error loading shorts:", err);
      return [];
    }
  };

  const featuredShorts = getFeaturedShortsSafely()
    .filter(Boolean)
    .filter(looksPublished)
    .sort((a, b) => safeTime(b.date) - safeTime(a.date))
    .slice(0, 3);

  return {
    props: { featuredShorts },
    revalidate: 3600,
  };
};
