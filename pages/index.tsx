/* pages/index.tsx - HYDRATED INSTITUTIONAL HOME */
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
  ArrowRight, BadgeCheck, BookOpen, Briefcase, Calendar, Compass, FileText, Gauge, Layers, Shield, Sparkles, Users, Wrench, Building2, Target, Workflow, Scale, LineChart, Map, ClipboardList, CheckCircle2, } from "lucide-react";

// INSTITUTIONAL ENGINE IMPORTS
import { getAllShorts, getDocHref, normalizeSlug } from "@/lib/contentlayer-compat";

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
   UI HELPERS
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
   FIRM INTRO
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
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">The Canon = Blueprint</p>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-300">First principles, governance logic, and long-term architecture.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="mt-0.5 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                  <Gauge className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">Advisory = Pressure-test</p>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-300">Diagnostics, options, and decision-ready recommendations.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* -----------------------------------------------------------------------------
   STRATEGIC FRAMEWORK STRIP
----------------------------------------------------------------------------- */

const StrategicFrameworkStrip: React.FC = () => {
  const items = [
    { icon: <Target className="h-5 w-5" />, title: "Mandate", body: "Define mission boundaries. No mandate = no strategy." },
    { icon: <Map className="h-5 w-5" />, title: "Terrain", body: "Market structure and adversaries. Reality first." },
    { icon: <Scale className="h-5 w-5" />, title: "Choices", body: "Trade-offs documented. If not written, it isn’t real." },
    { icon: <Workflow className="h-5 w-5" />, title: "OS", body: "Decision rights and cadence. Strategy becomes routine." },
    { icon: <Gauge className="h-5 w-5" />, title: "Governance", body: "Accountability keeping the machine honest." },
  ] as const;

  return (
    <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">Strategic framework</p>
            <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-white sm:text-4xl">Capacity is proven by method.</h2>
          </div>
          <Link href="/resources/strategic-frameworks" className="inline-flex items-center justify-center rounded-full border border-amber-400/50 bg-amber-400/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200 transition hover:bg-amber-400/10">
            View frameworks <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {items.map((it) => (
            <div key={it.title} className="rounded-2xl border border-white/10 bg-slate-800/60 p-5 shadow-lg backdrop-blur-sm transition hover:-translate-y-0.5 hover:border-amber-400/35">
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">{it.icon}</div>
              <p className="text-sm font-semibold text-white">{it.title}</p>
              <p className="mt-2 text-sm leading-relaxed text-gray-300">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

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
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">Shorts · Field signals</p>
            <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-white sm:text-4xl">Quick hits for builders.</h2>
          </div>
          <Link href="/shorts" className="inline-flex items-center rounded-full border border-amber-400/60 bg-amber-400/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-200 transition-all hover:bg-amber-400/10">
            View all shorts
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {shorts.map((short) => {
            const href = getDocHref(short);
            return (
              <Link key={short.slug ?? short._raw?.flattenedPath ?? short.title ?? href} href={href} className="group flex h-full flex-col rounded-2xl border border-white/10 bg-slate-800/60 p-6 shadow-lg backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-amber-400/50 hover:bg-slate-800/80">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                    <Sparkles className="h-3 w-3" /> Short
                  </span>
                  <span className="text-xs font-medium uppercase text-gray-400">{short.readTime}</span>
                </div>
                <h3 className="mb-3 line-clamp-2 font-serif text-xl font-semibold text-white">{short.title}</h3>
                <p className="mb-4 line-clamp-3 flex-1 text-sm leading-relaxed text-gray-300">{short.excerpt || short.description}</p>
                <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4">
                  <span className="text-xs text-gray-400 uppercase">Field note</span>
                  <span className="text-sm font-semibold text-amber-300">Read →</span>
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
   PAGE COMPONENT
----------------------------------------------------------------------------- */

const HomePage: NextPage<HomePageProps> = ({ featuredShorts }) => {
  return (
    <Layout
      title="Abraham of London"
      description="A builder’s advisory platform — Christian conviction, strategic discipline, and historical realism turned into systems that survive pressure."
    >
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="relative mx-auto max-w-7xl px-4 py-16 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="mb-6 flex flex-wrap gap-3">
                <Pill>Blueprint</Pill><Pill>Advisory</Pill><Pill>Deployment</Pill><Pill>Tools</Pill>
              </div>
              <h1 className="mb-5 font-serif text-4xl font-semibold text-white sm:text-6xl">
                Abraham of London
                <span className="mt-4 block text-xl font-normal text-amber-100 sm:text-3xl">Legacy doesn’t happen by accident. You architect it.</span>
              </h1>
              <p className="mb-8 max-w-2xl text-lg text-gray-300">A builder’s platform for people tired of performance culture — and ready for structure.</p>
              <div className="flex flex-wrap gap-4">
                <Link href="/consulting" className="rounded-xl bg-amber-500 px-7 py-3.5 text-sm font-bold text-black shadow-lg transition-all hover:scale-105">Engage Advisory →</Link>
                <Link href="/canon" className="rounded-xl border border-amber-400/60 bg-amber-400/5 px-7 py-3.5 text-sm font-bold text-amber-100 transition-all hover:bg-amber-500/10">Enter the Canon →</Link>
              </div>
            </div>
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-sm">
                <div className="relative aspect-video">
                  <Image src="/assets/images/abraham-of-london-banner.webp" alt="Abraham of London" fill priority className="object-cover" />
                </div>
                <div className="bg-slate-900/90 px-5 py-4"><p className="text-sm text-gray-200">The Canon provides the blueprint. Advisory tests the framework. Ventures deploy them.</p></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrustSignals />
      <FirmIntro />
      <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"><div className="mx-auto max-w-7xl px-4"><StatsBar /></div></section>
      <SectionDivider />
      <StrategicFrameworkStrip />
      <SectionDivider />
      <CanonShowcase />
      <SectionDivider />
      {featuredShorts.length > 0 && <ShortsStrip shorts={featuredShorts} />}
      <VenturesSection />
      <BooksInDevelopment />
      <StrategicSessions />
    </Layout>
  );
};

export default HomePage;

/* -----------------------------------------------------------------------------
   BUILD-TIME DATA (RECONCILED)
----------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  // Use the hardened async server layer
  const allShorts = await getAllShorts();

  const featuredShorts = allShorts
    .sort((a: any, b: any) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    })
    .slice(0, 3);

  return {
    props: {
      featuredShorts,
    },
    revalidate: 3600,
  };
};

/* -----------------------------------------------------------------------------
   PLACEHOLDER COMPONENTS FOR COMPLETE RENDER
----------------------------------------------------------------------------- */
const CanonShowcase: React.FC = () => (
  <section className="bg-white py-16 dark:bg-slate-950">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">Canon · Core backbone</p>
          <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-slate-900 dark:text-white sm:text-4xl">The blueprint that underwrites the firm</h2>
        </div>
        <Link href="/canon" className="inline-flex items-center rounded-full border border-amber-500/60 bg-amber-500/5 px-6 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 transition-all hover:bg-amber-500/10">Browse Canon entries</Link>
      </div>
      <CanonPrimaryCard title="The Architecture of Human Purpose" href="/canon/volume-i-foundations-of-purpose" volumeNumber={1} image="/assets/images/canon/architecture-of-human-purpose-cover.jpg" className="mx-auto max-w-2xl" />
    </div>
  </section>
);

const BooksInDevelopment: React.FC = () => (
  <section className="bg-white py-16 dark:bg-slate-950">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">Books & manuscripts</p>
          <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-slate-900 dark:text-white sm:text-4xl">Long-form work for longevity</h2>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {BOOKS_IN_DEV.map((book) => (
          <Link key={book.slug} href={`/books/${book.slug}`} className="group block">
            <article className="flex h-full overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="relative aspect-[3/4] w-32 flex-shrink-0"><Image src={book.cover} alt={book.title} fill className="object-cover" /></div>
              <div className="p-6">
                <p className="text-xs uppercase text-amber-600">In development</p>
                <h3 className="font-serif text-xl text-slate-900 dark:text-white">{book.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{book.blurb}</p>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

const StrategicSessions: React.FC = () => (
  <section className="bg-slate-950 py-16">
    <div className="mx-auto max-w-7xl px-6 text-center">
      <h2 className="font-serif text-3xl text-white">Advisory that produces deployable systems</h2>
      <Link href="/consulting" className="mt-8 inline-flex rounded-xl bg-amber-500 px-8 py-4 font-bold text-black">Book a Conversation</Link>
    </div>
  </section>
);



