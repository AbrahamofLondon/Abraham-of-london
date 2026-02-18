// components/homepage/HeroSection.tsx — FLAGSHIP (Institutional Authority)
// Goals: legitimacy in 5 seconds, clear mission, clean decision paths, zero fluff.
// No fake counts. No gimmicks. Strong hierarchy.

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BookOpen,
  Library as LibraryIcon,
  LineChart,
  Award,
  ShieldCheck,
  Globe,
  Users,
  ChevronRight,
  Target,
} from "lucide-react";

export type Counts = {
  shorts: number;
  canon: number;
  briefs: number;
  library: number; // PDF registry count (NOT contentlayer docs)
};

type Props = {
  counts: Counts; // required: no silent fallback
};

function formatCount(n: number): string {
  return new Intl.NumberFormat("en-GB").format(Math.max(0, Math.floor(Number(n || 0))));
}

export default function HeroSection({ counts }: Props): React.ReactElement {
  return (
    <section className="relative overflow-hidden bg-black">
      {/* Backdrop: quiet luxury + grid discipline */}
      <div aria-hidden className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_0%,rgba(245,158,11,0.16),transparent_72%)]" />
        <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:96px_96px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/92 to-black" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-14">
          {/* LEFT: Authority Copy */}
          <div className="z-10">
            {/* Institutional tag */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-[10px] font-black uppercase tracking-[0.28em] text-amber-200/75">
              <Award className="h-3.5 w-3.5 text-amber-400/80" />
              Abraham of London <span className="text-white/25">—</span> Institutional Platform
            </div>

            {/* Micro-positioning line (boardroom clarity) */}
            <p className="mt-6 max-w-prose text-[13px] sm:text-[14px] leading-relaxed text-white/55">
              Disciplined thinking, doctrine-led systems, and execution logic for builders—across ventures,
              leadership teams, and families—with a serious bias for stewardship, durability, and Africa-forward ambition.
            </p>

            {/* Primary headline */}
            <h1 className="mt-6 font-serif text-[clamp(2.25rem,4.2vw,3.75rem)] font-medium leading-[1.05] text-white [text-wrap:balance]">
              Strategy that survives scrutiny.
              <span className="block text-white/85">Systems that hold under pressure.</span>
            </h1>

            {/* Subhead: clean and decisive */}
            <p className="mt-6 max-w-prose text-[16px] sm:text-[18px] leading-relaxed text-zinc-400 font-light">
              Governance discipline, market clarity, and repeatable operating models—built from principle into practice,
              without noise.
            </p>

            {/* Capability pills */}
            <div className="mt-8 flex flex-wrap gap-2">
              <Pill icon={<Target className="h-3.5 w-3.5" />} label="Decision Systems" />
              <Pill icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Governance & Controls" />
              <Pill icon={<LineChart className="h-3.5 w-3.5" />} label="Market Positioning" />
              <Pill icon={<Globe className="h-3.5 w-3.5" />} label="Institutional Design" />
              <Pill icon={<Users className="h-3.5 w-3.5" />} label="Cohorts & Mentoring" />
              <Pill icon={<BookOpen className="h-3.5 w-3.5" />} label="Research-Led Doctrine" />
            </div>

            {/* Evidence: counts with meaning */}
            <div className="mt-10 grid grid-cols-2 gap-4 sm:max-w-[640px] sm:grid-cols-4">
              <MiniStat label="Canon" value={formatCount(counts.canon)} hint="Framework library" />
              <MiniStat label="Briefs" value={formatCount(counts.briefs)} hint="Operator memos" />
              <MiniStat label="Shorts" value={formatCount(counts.shorts)} hint="Micro-doctrine" />
              <MiniStat label="Library" value={formatCount(counts.library)} hint="PDF assets" />
            </div>

            {/* CTAs: tight decision path */}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="#prelude"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-amber-500 px-7 py-3 text-[11px] font-black uppercase tracking-[0.25em] text-black hover:bg-amber-400 transition-all duration-300 shadow-lg shadow-amber-500/10"
              >
                Start with the MiniBook <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                href="/consulting/strategy-room"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-transparent px-7 py-3 text-[11px] font-black uppercase tracking-[0.25em] text-white hover:bg-white/5 transition-all duration-300"
              >
                Strategy Room
                <ChevronRight className="h-4 w-4 text-white/25" />
              </Link>

              <Link
                href="/library"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-7 py-3 text-[11px] font-black uppercase tracking-[0.25em] text-white/80 hover:text-white hover:border-amber-500/25 transition-all duration-300"
              >
                Open Library <LibraryIcon className="h-4 w-4 text-amber-400/80" />
              </Link>
            </div>

            {/* Credo line */}
            <div className="mt-8 flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
              <span className="font-mono uppercase tracking-[0.28em]">Principled Strategy</span>
              <span className="text-amber-500/50">/</span>
              <span className="font-mono uppercase tracking-[0.28em]">Measurable Execution</span>
              <span className="text-amber-500/50">/</span>
              <span className="font-mono uppercase tracking-[0.28em]">Institutional Longevity</span>
            </div>
          </div>

          {/* RIGHT: Visual Proof (premium restraint) */}
          <div className="relative">
            <div aria-hidden className="pointer-events-none absolute -inset-10 rounded-full bg-amber-500/5 blur-[90px] opacity-45" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-900 shadow-2xl">
              {/* Top label bar */}
              <div className="absolute left-6 top-6 z-[2] inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/45 backdrop-blur-md px-3 py-1 text-[10px] font-black tracking-widest text-white/80">
                ABRAHAM OF LONDON <span className="h-1 w-1 rounded-full bg-amber-400" /> SELECTED WORKS
              </div>

              {/* Subtle bottom overlay for legibility */}
              <div className="pointer-events-none absolute inset-0 z-[1] bg-gradient-to-t from-black/45 via-black/10 to-transparent" />

              <Image
                src="/assets/images/abraham-of-london-banner.webp"
                alt="Abraham of London — Institutional Platform"
                width={1200}
                height={900}
                priority
                className="relative z-0 h-[340px] w-full object-cover grayscale-[0.22] hover:grayscale-0 transition-all duration-700 sm:h-[400px] md:h-[520px]"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            {/* Micro KPI strip */}
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <MicroKpi label="Clarity" value="Decision-grade" />
              <MicroKpi label="Method" value="Operator-first" />
              <MicroKpi label="Output" value="Runbooks & assets" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Pill({ icon, label }: { icon: React.ReactNode; label: string }): React.ReactElement {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/5 bg-white/[0.02] px-3 py-1 text-[11px] font-medium text-zinc-400">
      <span className="text-amber-500/70">{icon}</span>
      {label}
    </span>
  );
}

function MiniStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}): React.ReactElement {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.01] px-5 py-4 transition-colors hover:border-white/10">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">{label}</div>
        <div className="text-[9px] font-mono uppercase tracking-[0.25em] text-white/25">{hint || ""}</div>
      </div>
      <div className="mt-1 font-serif text-xl text-zinc-200">{value}</div>
    </div>
  );
}

function MicroKpi({ label, value }: { label: string; value: string }): React.ReactElement {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
      <div className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/35">{label}</div>
      <div className="mt-1 text-[11px] font-semibold text-white/70">{value}</div>
    </div>
  );
}