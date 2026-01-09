/* pages/index.tsx - ENHANCED INSTITUTIONAL HOME */
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";

import Layout from "@/components/Layout";
import AnimatedStatsBar from "@/components/enhanced/AnimatedStatsBar";
import EnhancedVenturesSection from "@/components/enhanced/VenturesSection";
import CanonPrimaryCard from "@/components/Cards/CanonPrimaryCard";
import StrategicFunnelStrip from "@/components/homepage/StrategicFunnelStrip";
import { LinkItemWithIcon, LinkItemWithBadge } from "@/components/Cards/partials";

import {
  ArrowRight, BadgeCheck, BookOpen, Briefcase, Calendar, Compass, 
  FileText, Gauge, Layers, Shield, Sparkles, Users, Wrench, Building2, 
  Target, Workflow, Scale, LineChart, Map, ClipboardList, CheckCircle2,
  ChevronRight, Clock, TrendingUp, Award, Zap, BarChart3, Cpu, TargetIcon,
  Brain, Castle, Crown, Diamond, Gem, Globe, Landmark, Target as TargetIcon2,
  Trophy, Users2
} from "lucide-react";

// INSTITUTIONAL ENGINE IMPORTS
import { getAllShorts, getDocHref, normalizeSlug } from "@/lib/contentlayer-compat";

// Dynamically import enhanced components
const AnimatedGradientBackground = dynamic(
  () => import("@/components/enhanced/AnimatedGradientBackground"),
  { ssr: false }
);

const ParticleBackground = dynamic(
  () => import("@/components/enhanced/ParticleBackground"),
  { ssr: false }
);

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

const SectionDivider: React.FC<{ withOrnament?: boolean }> = ({ withOrnament = true }) => (
  <div className="relative h-24 overflow-hidden bg-white dark:bg-slate-950">
    {withOrnament && (
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-300/40 to-transparent dark:via-amber-500/30" />
          <div className="mx-8 flex items-center gap-3">
            <div className="h-3 w-3 animate-pulse rounded-full bg-gradient-to-br from-amber-400 to-amber-600" />
            <div className="h-2 w-2 animate-ping rounded-full bg-amber-400/60" />
            <div className="h-3 w-3 animate-pulse rounded-full bg-gradient-to-br from-amber-400 to-amber-600" />
          </div>
          <div className="h-px w-32 bg-gradient-to-r from-transparent via-amber-300/40 to-transparent dark:via-amber-500/30" />
        </div>
      </div>
    )}
  </div>
);

const Pill: React.FC<{ children: React.ReactNode; icon?: React.ReactNode }> = ({ children, icon }) => (
  <span className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full border border-amber-400/30 bg-gradient-to-r from-amber-500/10 to-amber-600/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-100 backdrop-blur-sm transition-all hover:border-amber-400/50 hover:from-amber-500/20 hover:to-amber-600/10">
    <span className="relative z-10 flex items-center gap-2">
      {icon}
      {children}
    </span>
    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
  </span>
);

/* -----------------------------------------------------------------------------
   HERO SECTION - ENHANCED
----------------------------------------------------------------------------- */

const HeroSection: React.FC = () => {
  const [scrollProgress, setScrollProgress] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const progress = (window.scrollY / 500) * 100;
      setScrollProgress(Math.min(progress, 100));
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background Effects */}
      <div className="absolute inset-0">
        <AnimatedGradientBackground />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-900/80 to-slate-950/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.1),transparent_50%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 py-24 lg:py-32">
        {/* Header Badges */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Pill icon={<Crown className="h-3.5 w-3.5" />}>Blueprint</Pill>
          <Pill icon={<Brain className="h-3.5 w-3.5" />}>Advisory</Pill>
          <Pill icon={<Castle className="h-3.5 w-3.5" />}>Deployment</Pill>
          <Pill icon={<Gem className="h-3.5 w-3.5" />}>Tools</Pill>
        </div>

        {/* Main Headline with Animation */}
        <div className="relative">
          <h1 className="relative mb-6 font-serif text-5xl font-semibold leading-tight text-white sm:text-7xl lg:text-8xl">
            <span className="block bg-gradient-to-r from-amber-100 via-amber-300 to-amber-400 bg-clip-text text-transparent">
              Abraham of London
            </span>
            <span className="mt-6 block text-2xl font-normal text-amber-100/90 sm:text-4xl lg:text-5xl">
              Legacy doesn't happen by accident.<br className="hidden sm:block" />
              <span className="relative inline-block">
                <span className="relative z-10">You architect it.</span>
                <span className="absolute -bottom-1 left-0 h-1 w-full bg-gradient-to-r from-amber-500 to-transparent" />
              </span>
            </span>
          </h1>

          {/* Subtitle with Typewriter Effect */}
          <p className="mb-10 max-w-3xl text-xl text-gray-300 lg:text-2xl">
            A builder's platform for people tired of performance culture — and ready for structure.
          </p>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-wrap gap-4">
          <Link 
            href="/consulting" 
            className="group relative rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-8 py-4 text-base font-bold text-black shadow-2xl shadow-amber-900/40 transition-all hover:scale-105 hover:shadow-amber-900/60"
          >
            <span className="relative z-10 flex items-center gap-3">
              <Briefcase className="h-5 w-5" />
              Engage Advisory
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
            </span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>

          <Link 
            href="/canon" 
            className="group relative rounded-xl border-2 border-amber-400/40 bg-gradient-to-r from-amber-400/5 via-amber-500/5 to-amber-600/5 px-8 py-4 text-base font-bold text-amber-100 backdrop-blur-sm transition-all hover:scale-105 hover:border-amber-400/60 hover:bg-amber-500/10"
          >
            <span className="relative z-10 flex items-center gap-3">
              <BookOpen className="h-5 w-5" />
              Enter the Canon
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
            </span>
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-amber-400/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        </div>

        {/* Hero Image */}
        <div className="relative mt-16 lg:mt-24">
          <div className="relative overflow-hidden rounded-3xl border-2 border-white/10 bg-black/40 shadow-2xl backdrop-blur-xl">
            {/* Image Container with Parallax Effect */}
            <div className="relative aspect-video overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/40 z-10" />
              <Image 
                src="/assets/images/abraham-of-london-banner.webp" 
                alt="Abraham of London Institutional Platform"
                fill
                priority
                className="object-cover transition-transform duration-1000 hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 80vw"
              />
            </div>
            
            {/* Image Caption with Gradient */}
            <div className="relative bg-gradient-to-r from-slate-900/95 via-slate-800/95 to-slate-900/95 px-8 py-6 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 p-2.5">
                  <TargetIcon2 className="h-full w-full text-amber-400" />
                </div>
                <div>
                  <p className="text-lg font-medium text-white">The Canon provides the blueprint. Advisory tests the framework. Ventures deploy them.</p>
                  <p className="mt-2 text-sm text-gray-300">— Institutional Architecture Since 2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   TRUST SIGNALS - ENHANCED
----------------------------------------------------------------------------- */

const TrustSignals: React.FC = () => {
  const signals = [
    {
      icon: <Award className="h-6 w-6" />,
      title: "Governance-grade thinking",
      description: "Mandates, controls, decision rights, and operating cadence — built to survive audit, scrutiny, and scale.",
      color: "from-amber-500/20 to-amber-600/10",
      iconColor: "text-amber-400",
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Strategy → execution linkage",
      description: "No slide-deck theatre. Every engagement ends in deployable assets, measurable milestones, and ownership.",
      color: "from-emerald-500/20 to-emerald-600/10",
      iconColor: "text-emerald-400",
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Conviction, not vibes",
      description: "Christian ethics, historical realism, and strategic discipline — because incentives change when pressure hits.",
      color: "from-blue-500/20 to-blue-600/10",
      iconColor: "text-blue-400",
    },
  ];

  return (
    <section className="bg-white py-16 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">
            Institutional Assurance
          </p>
          <h2 className="mt-4 font-serif text-3xl font-light text-slate-900 dark:text-white sm:text-4xl">
            Built to survive pressure
          </h2>
        </div>
        
        <div className="grid gap-8 rounded-3xl border border-slate-200/50 bg-gradient-to-b from-slate-50 to-white p-8 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-950 md:grid-cols-3">
          {signals.map((signal, index) => (
            <div 
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-slate-200/50 bg-white/50 p-6 backdrop-blur-sm transition-all hover:-translate-y-1 hover:border-slate-300/50 hover:shadow-xl dark:border-slate-800/50 dark:bg-slate-900/50 dark:hover:border-slate-700/50"
            >
              <div className="relative z-10">
                {/* Icon Container */}
                <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${signal.color}`}>
                  <div className={signal.iconColor}>
                    {signal.icon}
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="mb-3 text-lg font-semibold text-slate-900 dark:text-white">
                  {signal.title}
                </h3>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-gray-300">
                  {signal.description}
                </p>
              </div>
              
              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   FIRM INTRO - ENHANCED
----------------------------------------------------------------------------- */

const FirmIntro: React.FC = () => (
  <section className="bg-white py-20 dark:bg-slate-950">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="grid gap-16 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-7">
          <div className="relative">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">
              Abraham of London · Advisory Platform
            </p>

            <h2 className="mt-6 font-serif text-4xl font-light tracking-tight text-slate-900 dark:text-white sm:text-5xl">
              A builder's platform for people tired of performance culture — and ready for structure.
            </h2>

            <div className="mt-8 space-y-6 text-lg leading-relaxed text-slate-700 dark:text-gray-300">
              <p className="relative pl-6 before:absolute before:left-0 before:top-3 before:h-1.5 before:w-1.5 before:rounded-full before:bg-amber-500">
                <strong className="font-semibold text-slate-900 dark:text-white">Abraham of London</strong> fuses{' '}
                <strong className="font-semibold text-amber-600 dark:text-amber-400">Christian conviction</strong>,{' '}
                <strong className="font-semibold text-amber-600 dark:text-amber-400">strategic discipline</strong>, and{' '}
                <strong className="font-semibold text-amber-600 dark:text-amber-400">historical realism</strong> into systems that work —
                at home, in business, and in public life.
              </p>
              
              <p className="relative pl-6 before:absolute before:left-0 before:top-3 before:h-1.5 before:w-1.5 before:rounded-full before:bg-amber-500">
                The posture is simple: <strong className="font-semibold text-slate-900 dark:text-white">legacy doesn't happen by accident</strong>. You architect it.
                We operate like a proper firm: diagnostics first, then design, then execution governance.
              </p>
            </div>

            <div className="mt-12 flex flex-wrap gap-4">
              <Link
                href="/consulting"
                className="group relative inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-base font-semibold text-black shadow-xl shadow-amber-900/30 transition-all hover:scale-105 hover:shadow-2xl"
              >
                <Briefcase className="h-5 w-5" />
                <span>Engage Advisory</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
              </Link>

              <Link
                href="/canon"
                className="group relative inline-flex items-center gap-3 rounded-xl border-2 border-slate-300 bg-gradient-to-r from-slate-50 to-white px-8 py-4 text-base font-semibold text-slate-800 transition-all hover:border-amber-400/50 hover:bg-gradient-to-r hover:from-amber-50/50 hover:to-white dark:border-slate-700 dark:from-slate-900 dark:to-slate-800 dark:text-gray-200 dark:hover:border-amber-500/30 dark:hover:from-amber-900/20 dark:hover:to-slate-800"
              >
                <BookOpen className="h-5 w-5" />
                <span>Read the Canon</span>
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-2" />
              </Link>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-24">
            <div className="relative overflow-hidden rounded-3xl border-2 border-slate-200/50 bg-gradient-to-b from-slate-50 to-white p-8 shadow-2xl dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-950">
              <div className="relative z-10">
                <div className="mb-8 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 p-2.5">
                    <Cpu className="h-full w-full text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400">
                      Operating model
                    </p>
                    <p className="text-sm text-slate-600 dark:text-gray-400">How we deliver institutional-grade results</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="group flex gap-4">
                    <div className="relative mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 transition-all group-hover:from-amber-500/30 group-hover:to-amber-600/20">
                      <Layers className="h-6 w-6 text-amber-500 dark:text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white">The Canon = Blueprint</h4>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-gray-300">
                        First principles, governance logic, and long-term architecture that survives political cycles and market noise.
                      </p>
                    </div>
                  </div>

                  <div className="group flex gap-4">
                    <div className="relative mt-1 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 transition-all group-hover:from-emerald-500/30 group-hover:to-emerald-600/20">
                      <Gauge className="h-6 w-6 text-emerald-500 dark:text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-slate-900 dark:text-white">Advisory = Pressure-test</h4>
                      <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-gray-300">
                        Diagnostics, options analysis, and decision-ready recommendations that translate theory into actionable cadence.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Background Pattern */}
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-amber-400/10 to-transparent blur-3xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

/* -----------------------------------------------------------------------------
   STRATEGIC FRAMEWORK STRIP - ENHANCED
----------------------------------------------------------------------------- */

const StrategicFrameworkStrip: React.FC = () => {
  const items = [
    { 
      icon: <Target className="h-6 w-6" />, 
      title: "Mandate", 
      body: "Define mission boundaries. No mandate = no strategy.",
      color: "from-red-500/20 to-red-600/10",
      iconColor: "text-red-400"
    },
    { 
      icon: <Map className="h-6 w-6" />, 
      title: "Terrain", 
      body: "Market structure and adversaries. Reality first.",
      color: "from-blue-500/20 to-blue-600/10",
      iconColor: "text-blue-400"
    },
    { 
      icon: <Scale className="h-6 w-6" />, 
      title: "Choices", 
      body: "Trade-offs documented. If not written, it isn't real.",
      color: "from-emerald-500/20 to-emerald-600/10",
      iconColor: "text-emerald-400"
    },
    { 
      icon: <Workflow className="h-6 w-6" />, 
      title: "OS", 
      body: "Decision rights and cadence. Strategy becomes routine.",
      color: "from-purple-500/20 to-purple-600/10",
      iconColor: "text-purple-400"
    },
    { 
      icon: <Gauge className="h-6 w-6" />, 
      title: "Governance", 
      body: "Accountability keeping the machine honest.",
      color: "from-amber-500/20 to-amber-600/10",
      iconColor: "text-amber-400"
    },
  ] as const;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-20">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[url('/assets/images/grid.svg')] bg-center [mask-image:radial-gradient(white,transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-950" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
              Strategic framework
            </p>
            <h2 className="mt-4 font-serif text-4xl font-light tracking-tight text-white sm:text-5xl">
              Capacity is proven by method.
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              Our five-layer framework ensures strategy survives first contact with reality.
            </p>
          </div>
          <Link 
            href="/resources/strategic-frameworks" 
            className="group inline-flex items-center justify-center gap-3 rounded-full border-2 border-amber-400/50 bg-gradient-to-r from-amber-400/5 to-amber-500/5 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-amber-200 transition-all hover:border-amber-400/80 hover:from-amber-400/10 hover:to-amber-500/10 hover:shadow-xl hover:shadow-amber-900/20"
          >
            <span>View frameworks</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
          </Link>
        </div>

        {/* Framework Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {items.map((it, index) => (
            <div 
              key={it.title}
              className="group relative overflow-hidden rounded-3xl border-2 border-white/10 bg-gradient-to-b from-slate-800/40 to-slate-900/40 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-amber-400/40 hover:shadow-amber-900/20"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Number Badge */}
              <div className="absolute -right-2 -top-2 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-900 text-xs font-bold text-white shadow-lg">
                {index + 1}
              </div>
              
              {/* Icon */}
              <div className={`mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${it.color} shadow-lg`}>
                <div className={it.iconColor}>
                  {it.icon}
                </div>
              </div>
              
              {/* Content */}
              <h3 className="mb-3 text-xl font-semibold text-white">{it.title}</h3>
              <p className="text-sm leading-relaxed text-gray-300">{it.body}</p>
              
              {/* Hover Line */}
              <div className="absolute bottom-0 left-0 h-1 w-0 bg-gradient-to-r from-amber-400 to-amber-600 transition-all duration-500 group-hover:w-full" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   SHORTS STRIP - ENHANCED
----------------------------------------------------------------------------- */

const ShortsStrip: React.FC<{ shorts: LooseShort[] }> = ({ shorts }) => {
  if (!shorts || shorts.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-20">
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(245,158,11,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(59,130,246,0.05),transparent_50%)]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
              Shorts · Field signals
            </p>
            <h2 className="mt-4 font-serif text-4xl font-light tracking-tight text-white sm:text-5xl">
              Quick hits for builders.
            </h2>
            <p className="mt-4 text-lg text-gray-300">
              Concise insights that cut through noise and deliver actionable intelligence.
            </p>
          </div>
          <Link 
            href="/shorts" 
            className="group inline-flex items-center justify-center gap-3 rounded-full border-2 border-amber-400/60 bg-gradient-to-r from-amber-400/5 to-amber-500/5 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-amber-200 transition-all hover:border-amber-400/80 hover:from-amber-400/10 hover:to-amber-500/10 hover:shadow-xl hover:shadow-amber-900/20"
          >
            <span>View all shorts</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
          </Link>
        </div>

        {/* Shorts Grid */}
        <div className="grid gap-8 md:grid-cols-3">
          {shorts.map((short, index) => {
            const href = getDocHref(short);
            return (
              <Link 
                key={short.slug ?? short._raw?.flattenedPath ?? short.title ?? href}
                href={href}
                className="group relative overflow-hidden rounded-3xl border-2 border-white/10 bg-gradient-to-b from-slate-800/40 to-slate-900/40 p-8 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-amber-400/40 hover:shadow-amber-900/20"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Badge */}
                <div className="mb-6 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" /> 
                    Field Note
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    {short.readTime}
                  </span>
                </div>
                
                {/* Content */}
                <h3 className="mb-4 line-clamp-2 font-serif text-2xl font-semibold text-white">
                  {short.title}
                </h3>
                <p className="mb-6 line-clamp-3 text-base leading-relaxed text-gray-300">
                  {short.excerpt || short.description}
                </p>
                
                {/* Footer */}
                <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-6">
                  <span className="text-sm font-medium text-gray-400">
                    Read analysis
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-400/30 bg-gradient-to-r from-amber-400/10 to-amber-500/5 transition-all group-hover:border-amber-400/60 group-hover:from-amber-400/20 group-hover:to-amber-500/10">
                    <ArrowRight className="h-5 w-5 text-amber-300 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
                
                {/* Hover Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber-400/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

/* -----------------------------------------------------------------------------
   ENHANCED COMPONENTS
----------------------------------------------------------------------------- */

const CanonShowcase: React.FC = () => (
  <section className="bg-white py-20 dark:bg-slate-950">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">
            Canon · Core backbone
          </p>
          <h2 className="mt-4 font-serif text-4xl font-light tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            The blueprint that underwrites the firm
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-gray-300">
            Foundational texts that define our methodology and philosophical bedrock.
          </p>
        </div>
        <Link 
          href="/canon" 
          className="group inline-flex items-center justify-center gap-3 rounded-full border-2 border-amber-500/60 bg-gradient-to-r from-amber-500/5 to-amber-600/5 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-amber-700 transition-all hover:border-amber-500/80 hover:from-amber-500/10 hover:to-amber-600/10 dark:text-amber-300"
        >
          <span>Browse Canon entries</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
        </Link>
      </div>
      
      <CanonPrimaryCard 
        title="The Architecture of Human Purpose" 
        href="/canon/volume-i-foundations-of-purpose" 
        volumeNumber={1} 
        image="/assets/images/canon/architecture-of-human-purpose-cover.jpg" 
        className="mx-auto max-w-4xl" 
        description="Foundational principles for building institutions that survive generational shifts."
      />
    </div>
  </section>
);

const BooksInDevelopment: React.FC = () => (
  <section className="bg-white py-20 dark:bg-slate-950">
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="mb-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-600 dark:text-amber-400">
            Books & manuscripts
          </p>
          <h2 className="mt-4 font-serif text-4xl font-light tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Long-form work for longevity
          </h2>
          <p className="mt-4 text-lg text-slate-600 dark:text-gray-300">
            Deep-dive explorations currently in development.
          </p>
        </div>
        <Link 
          href="/books" 
          className="group inline-flex items-center justify-center gap-3 rounded-full border-2 border-amber-500/60 bg-gradient-to-r from-amber-500/5 to-amber-600/5 px-8 py-4 text-sm font-semibold uppercase tracking-[0.15em] text-amber-700 transition-all hover:border-amber-500/80 hover:from-amber-500/10 hover:to-amber-600/10 dark:text-amber-300"
        >
          <span>View all books</span>
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
        </Link>
      </div>
      
      <div className="grid gap-8 md:grid-cols-2">
        {BOOKS_IN_DEV.map((book, index) => (
          <Link 
            key={book.slug} 
            href={`/books/${book.slug}`}
            className="group relative overflow-hidden rounded-3xl border-2 border-slate-200/50 bg-gradient-to-b from-white to-slate-50 shadow-2xl transition-all hover:-translate-y-2 hover:border-amber-400/50 hover:shadow-amber-900/20 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-950"
          >
            <article className="flex h-full">
              {/* Cover Image */}
              <div className="relative w-40 flex-shrink-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent z-10" />
                <Image 
                  src={book.cover} 
                  alt={book.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Progress Bar */}
                <div className="absolute bottom-4 left-4 right-4 z-20">
                  <div className="h-2 rounded-full bg-slate-800/80 backdrop-blur-sm">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-1000"
                      style={{ width: `${book.progress}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs font-medium text-white">{book.progress}% complete</p>
                </div>
              </div>
              
              {/* Content */}
              <div className="flex flex-1 flex-col p-8">
                <span className="mb-4 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/10 to-amber-600/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400">
                  {book.tag}
                </span>
                
                <h3 className="mb-4 font-serif text-2xl font-semibold text-slate-900 dark:text-white">
                  {book.title}
                </h3>
                
                <p className="mb-6 flex-1 text-base leading-relaxed text-slate-600 dark:text-gray-300">
                  {book.blurb}
                </p>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-amber-600 dark:text-amber-400">
                    In development
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-amber-500/30 bg-gradient-to-r from-amber-500/10 to-amber-600/5 transition-all group-hover:border-amber-500/60 group-hover:from-amber-500/20 group-hover:to-amber-600/10">
                    <ArrowRight className="h-5 w-5 text-amber-600 transition-transform group-hover:translate-x-1 dark:text-amber-400" />
                  </div>
                </div>
              </div>
            </article>
            
            {/* Hover Effect */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber-400/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </Link>
        ))}
      </div>
    </div>
  </section>
);

const StrategicSessions: React.FC = () => (
  <section className="relative overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-32">
    {/* Background Effects */}
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[url('/assets/images/grid-dark.svg')] bg-center opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-950" />
      <div className="absolute left-1/4 top-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-amber-500/10 to-transparent blur-3xl" />
      <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-gradient-to-br from-blue-500/10 to-transparent blur-3xl" />
    </div>
    
    <div className="relative mx-auto max-w-7xl px-4 text-center">
      <div className="mb-12">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber-400">
          Advisory engagement
        </p>
        <h2 className="mt-6 font-serif text-5xl font-light text-white sm:text-6xl">
          Advisory that produces<br />
          <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-amber-500 bg-clip-text text-transparent">
            deployable systems
          </span>
        </h2>
        <p className="mx-auto mt-6 max-w-2xl text-xl text-gray-300">
          Transform theoretical frameworks into executable architecture with institutional-grade governance.
        </p>
      </div>
      
      <Link 
        href="/consulting" 
        className="group relative inline-flex items-center justify-center gap-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 px-12 py-6 text-lg font-bold text-black shadow-2xl shadow-amber-900/40 transition-all hover:scale-105 hover:shadow-amber-900/60"
      >
        <Briefcase className="h-6 w-6" />
        <span>Book a Strategic Session</span>
        <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-2" />
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-600 opacity-0 transition-opacity group-hover:opacity-100" />
      </Link>
      
      <div className="mt-16 grid gap-8 sm:grid-cols-3">
        {[
          { icon: <Target className="h-6 w-6" />, text: "Diagnostic-first approach" },
          { icon: <Users2 className="h-6 w-6" />, text: "Direct partner access" },
          { icon: <TrendingUp className="h-6 w-6" />, text: "Accountability cadence" },
        ].map((item, index) => (
          <div key={index} className="flex items-center justify-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10">
              <div className="text-amber-300">{item.icon}</div>
            </div>
            <span className="text-lg font-medium text-white">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  </section>
);

/* -----------------------------------------------------------------------------
   PAGE COMPONENT
----------------------------------------------------------------------------- */

const HomePage: NextPage<HomePageProps> = ({ featuredShorts }) => {
  return (
    <Layout
      title="Abraham of London - Institutional Advisory Platform"
      description="A builder's platform combining Christian conviction, strategic discipline, and historical realism into systems that survive pressure and produce legacy."
      className="overflow-hidden"
    >
      {/* Particle Background for Hero */}
      <ParticleBackground />
      
      {/* Hero Section */}
      <HeroSection />
      
      {/* Trust Signals */}
      <TrustSignals />
      
      {/* Firm Introduction */}
      <FirmIntro />
      
      {/* Stats Bar */}
      <section className="border-y border-slate-200/50 bg-gradient-to-b from-white to-slate-50 dark:border-slate-800/50 dark:from-slate-900 dark:to-slate-950">
        <div className="mx-auto max-w-7xl px-4">
          <StatsBar />
        </div>
      </section>
      
      {/* Section Divider */}
      <SectionDivider />
      
      {/* Strategic Framework */}
      <StrategicFrameworkStrip />
      
      {/* Section Divider */}
      <SectionDivider withOrnament={false} />
      
      {/* Canon Showcase */}
      <CanonShowcase />
      
      {/* Section Divider */}
      <SectionDivider />
      
      {/* Shorts Strip */}
      {featuredShorts.length > 0 && <ShortsStrip shorts={featuredShorts} />}
      
      {/* Ventures Section */}
      <VenturesSection />
      
      {/* Books in Development */}
      <BooksInDevelopment />
      
      {/* Strategic Sessions CTA */}
      <StrategicSessions />
      
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 15s ease infinite;
        }
      `}</style>
    </Layout>
  );
};

export default HomePage;

/* -----------------------------------------------------------------------------
   BUILD-TIME DATA (RECONCILED)
----------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<HomePageProps> = async () => {
  try {
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
  } catch (error) {
    console.error("Error fetching shorts:", error);
    return {
      props: {
        featuredShorts: [],
      },
      revalidate: 3600,
    };
  }
};