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
  getDocHref,
  normalizeSlug,
} from "@/lib/contentlayer-helper";

// -----------------------------------------------------------------------------
// BOOKS IN DEVELOPMENT
// -----------------------------------------------------------------------------

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
      "A covert retelling of a story too real for the courtroom - where truth hides in fiction and fiction cuts deeper than fact.",
    cover: "/assets/images/books/the-fiction-adaptation.jpg",
  },
] as const;

// -----------------------------------------------------------------------------
// TYPES
// -----------------------------------------------------------------------------

type LooseShort = {
  title?: string;
  excerpt?: string | null;
  description?: string | null;
  readTime?: string | null;
  url?: string;
  slug?: string;
  _type?: string;
  draft?: boolean;
  published?: boolean;
  _raw?: { sourceFileName?: string; flattenedPath?: string };
  date?: string | Date;
};

type HomePageProps = {
  featuredShorts: LooseShort[];
};

// -----------------------------------------------------------------------------
// COMPONENTS
// -----------------------------------------------------------------------------

const SectionDivider: React.FC = () => (
  <div className="relative h-16 overflow-hidden">
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-200/40 to-transparent dark:via-amber-500/30" />
      <div className="mx-6 flex items-center gap-2">
        <div className="h-2 w-2 rounded-full bg-gradient-to-br from-amber-400 to-amber-600" />
        <div className="h-1 w-1 rounded-full bg-amber-400/60" />
        <div className="h-2 w-2 rounded-full bg-gradient-to-br from-amber-400 to-amber-600" />
      </div>
      <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-200/40 to-transparent dark:via-amber-500/30" />
    </div>
  </div>
);

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

const FirmIntro: React.FC = () => (
  <section className="bg-white py-16 dark:bg-slate-950">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-7">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">
            Abraham of London · Advisory Platform
          </p>

          <h2 className="mt-3 font-serif text-3xl font-light tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            A builder&apos;s platform for people tired of performance culture — and ready for structure.
          </h2>

          <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-700 dark:text-gray-300">
            <p>
              <strong>Abraham of London</strong> fuses <strong>Christian conviction</strong>,{" "}
              <strong>strategic discipline</strong>, and <strong>historical realism</strong> into systems that work —
              at home, in business, and in public life.
            </p>
            <p>
              The posture is simple: <strong>legacy doesn&apos;t happen by accident</strong>. You architect it.
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
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

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
  ] as const;

  return (
    <section className="bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">Advisory capabilities</p>
          <h2 className="mt-2 font-serif text-3xl font-light text-white sm:text-4xl">Built like a firm</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {items.map((c) => (
            <article key={c.title} className="rounded-2xl border border-white/10 bg-slate-800/60 p-6 backdrop-blur-sm">
              <div className="mb-4 text-amber-400">{c.icon}</div>
              <h3 className="mb-3 font-serif text-lg font-semibold text-white">{c.title}</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                {c.points.map((p) => <li key={p} className="flex gap-2"><CheckCircle2 className="h-4 w-4" />{p}</li>)}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

const DeliveryModel: React.FC = () => (
  <section className="bg-white py-16 dark:bg-slate-950">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 className="font-serif text-3xl text-slate-900 dark:text-white sm:text-4xl">Disciplined delivery model</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[
          { step: "01", title: "Diagnostic", icon: <ClipboardList className="h-5 w-5" /> },
          { step: "02", title: "Design", icon: <FileText className="h-5 w-5" /> },
          { step: "03", title: "Execution", icon: <Gauge className="h-5 w-5" /> },
          { step: "04", title: "Handover", icon: <Wrench className="h-5 w-5" /> },
        ].map((s) => (
          <div key={s.step} className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-black text-amber-500">{s.step}</span>
            <h3 className="mt-2 font-bold">{s.title}</h3>
          </div>
        ))}
      </div>
    </div>
  </section>
);

const ShortsStrip: React.FC<{ shorts: LooseShort[] }> = ({ shorts }) => {
  if (!shorts || shorts.length === 0) return null;
  return (
    <section className="bg-slate-950 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="font-serif text-3xl text-white">Shorts · Field signals</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {shorts.map((short) => (
            <Link key={short.slug} href={`/shorts/${short.slug}`} className="rounded-2xl border border-white/10 bg-slate-900 p-6 hover:border-amber-500/50 transition-all">
              <h3 className="text-xl font-serif text-white">{short.title}</h3>
              <p className="mt-4 text-sm text-gray-400 line-clamp-3">{short.excerpt}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const BooksInDevelopment: React.FC = () => (
  <section className="bg-white py-16 dark:bg-slate-950">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <h2 className="font-serif text-3xl text-slate-900 dark:text-white sm:text-4xl">Books & manuscripts</h2>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        {BOOKS_IN_DEV.map((book) => (
          <Link key={book.slug} href={`/books/${book.slug}`} className="group overflow-hidden rounded-2xl border border-slate-200 bg-white flex dark:border-slate-800 dark:bg-slate-900">
            <div className="relative aspect-[3/4] w-32 flex-shrink-0">
              <Image src={book.cover} alt={book.title} fill className="object-cover" />
            </div>
            <div className="p-6">
              <h3 className="font-serif text-xl font-bold">{book.title}</h3>
              <p className="mt-2 text-sm text-gray-500">{book.blurb}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </section>
);

const StrategicSessions: React.FC = () => (
  <section className="bg-slate-950 py-16">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
      <h2 className="font-serif text-3xl text-white sm:text-4xl">Ready for structure?</h2>
      <Link href="/consulting" className="mt-8 rounded-xl bg-amber-500 px-8 py-4 font-bold text-black hover:scale-105 transition-transform">
        Book a Strategic Session
      </Link>
    </div>
  </section>
);

// -----------------------------------------------------------------------------
// PAGE COMPONENT
// -----------------------------------------------------------------------------

const HomePage: NextPage<HomePageProps> = ({ featuredShorts }) => {
  return (
    <Layout title="Abraham of London">
      <section className="relative overflow-hidden bg-slate-950">
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:py-24">
          <div className="max-w-3xl">
            <h1 className="font-serif text-5xl font-bold text-white sm:text-7xl">
              Abraham of London
              <span className="mt-4 block text-xl font-normal text-amber-200 sm:text-3xl italic">
                Legacy doesn&apos;t happen by accident. You architect it.
              </span>
            </h1>
            <div className="mt-10 flex gap-4">
              <Link href="/consulting" className="rounded-xl bg-amber-500 px-8 py-4 font-bold text-black">Advisory</Link>
              <Link href="/canon" className="rounded-xl border border-white/20 px-8 py-4 font-bold text-white">Enter the Canon</Link>
            </div>
          </div>
        </div>
      </section>

      <TrustSignals />
      <FirmIntro />
      <StatsBar />
      <SectionDivider />
      <Capabilities />
      <SectionDivider />
      <DeliveryModel />
      <SectionDivider />

      <section className="bg-white py-16 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">Canon · Core backbone</p>
            <h2 className="mt-2 font-serif text-3xl text-slate-900 dark:text-white sm:text-4xl">The blueprint</h2>
          </div>
          {/* CRITICAL FIX: Slug matches the MDX volume-i-foundations-of-purpose */}
          <CanonPrimaryCard
            title="Volume I - Foundations of Purpose"
            href="/canon/volume-i-foundations-of-purpose"
            excerpt="The foundational volume: a framework for discerning and deploying purpose across a lifetime."
            volumeNumber={1}
            image="/assets/images/canon/architecture-of-human-purpose-cover.jpg"
            className="mx-auto max-w-2xl"
          />
        </div>
      </section>

      <SectionDivider />
      <StrategicFunnelStrip />
      <SectionDivider />
      <ShortsStrip shorts={featuredShorts} />
      <SectionDivider />
      <VenturesSection />
      <SectionDivider />
      <BooksInDevelopment />
      <SectionDivider />
      <StrategicSessions />
    </Layout>
  );
};

export default HomePage;

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  const allShorts = getPublishedShorts() as unknown as LooseShort[];
  const featuredShorts = allShorts
    .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
    .slice(0, 3);

  return { props: { featuredShorts }, revalidate: 3600 };
};