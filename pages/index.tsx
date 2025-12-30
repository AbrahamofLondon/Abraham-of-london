/* pages/index.tsx */
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

const BOOKS_IN_DEV = [
  {
    slug: "fathering-without-fear",
    title: "Fathering Without Fear",
    tag: "Fatherhood · Household",
    blurb: "Standards, rituals, and household architecture for men building families that outlast culture wars.",
    cover: "/assets/images/books/fathering-without-fear.jpg",
  },
  {
    slug: "the-fiction-adaptation",
    title: "The Fiction Adaptation",
    tag: "Fiction · Drama",
    blurb: "A covert retelling of a story too real for the courtroom - where truth hides in fiction and fiction cuts deeper than fact.",
    cover: "/assets/images/books/the-fiction-adaptation.jpg",
  },
] as const;

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
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Governance-grade thinking</p>
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
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Strategy → execution linkage</p>
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
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Conviction, not vibes</p>
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
            <p><strong>Abraham of London</strong> fuses <strong>Christian conviction</strong>, <strong>strategic discipline</strong>, and <strong>historical realism</strong> into systems that work.</p>
            <p>The posture is simple: <strong>legacy doesn&apos;t happen by accident</strong>. You architect it.</p>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/consulting" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-semibold text-black shadow-lg shadow-amber-900/30 transition-all hover:scale-105 hover:shadow-xl">
              <Briefcase className="h-4 w-4" />
              <span>Engage Advisory</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/canon" className="group inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-slate-50 px-6 py-3 text-sm font-semibold text-slate-800 transition-all hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-gray-200 dark:hover:bg-slate-800">
              <BookOpen className="h-4 w-4" />
              <span>Read the Canon</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-600 dark:text-gray-300">Operating model</p>
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
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

const HomePage: NextPage<HomePageProps> = ({ featuredShorts }) => {
  const siteTitle = "Abraham of London";
  const siteTagline = "A builder&apos;s advisory platform — Christian conviction, strategic discipline, and historical realism turned into systems that survive pressure.";

  return (
    <Layout title={siteTitle} description={siteTagline}>
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-5 lg:gap-16">
            <div className="max-w-xl lg:col-span-3 xl:col-span-2">
               <h1 className="mb-5 font-serif text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                  Abraham of London
                  <span className="mt-4 block text-xl font-normal text-amber-100 sm:text-2xl lg:text-3xl">Legacy doesn&apos;t happen by accident. You architect it.</span>
               </h1>
               <div className="flex flex-wrap gap-4">
                  <Link href="/consulting" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-7 py-3.5 text-sm font-semibold text-black shadow-lg shadow-amber-900/30 transition-all hover:scale-105 hover:shadow-xl">
                    <Briefcase className="h-4 w-4" />
                    <span>Engage Advisory</span>
                  </Link>
                  <Link href="/canon" className="group inline-flex items-center gap-2 rounded-xl border border-amber-400/60 bg-amber-400/5 px-7 py-3.5 text-sm font-semibold text-amber-100 transition-all hover:scale-105 hover:bg-amber-500/10">
                    <BookOpen className="h-4 w-4" />
                    <span>Enter the Canon</span>
                  </Link>
               </div>
            </div>
          </div>
        </div>
      </section>

      <FirmIntro />
      <StatsBar />

      <section className="bg-white py-16 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mt-2 font-serif text-3xl font-light tracking-tight text-slate-900 dark:text-white sm:text-4xl">The blueprint that underwrites the firm</h2>
          
          {/* UPDATED LINK: Matches the slug in your MDX file */}
          <CanonPrimaryCard
            title="Volume I - Foundations of Purpose"
            href="/canon/volume-i-foundations-of-purpose"
            excerpt="Opening volume of the Canon: the deep structures behind purpose, responsibility, and becoming a builder in an age allergic to foundations."
            volumeNumber={1}
            image="/assets/images/books/the-architecture-of-human-purpose.jpg"
            className="mx-auto max-w-2xl"
          />
        </div>
      </section>

      <StrategicFunnelStrip />
    </Layout>
  );
};

export default HomePage;

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  const featuredShorts = (getPublishedShorts() as unknown as LooseShort[]).slice(0, 3);
  return { props: { featuredShorts }, revalidate: 3600 };
};