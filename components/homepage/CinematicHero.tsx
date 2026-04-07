"use client";

/* ============================================================================
   FILE: components/homepage/CinematicHero.tsx
   HOMEPAGE HERO — INSTITUTIONAL PRESENCE (HARDENED / CLICK-SAFE)
   Philosophy:
   - Calm authority, not noise
   - Decorative layers can never swallow clicks
   - Cleaner route hierarchy
   - Properly impressive without theatrical clutter
============================================================================ */

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Compass, Crown, ScrollText } from "lucide-react";

type HeroCounts = {
  shorts: number;
  canon: number;
  briefs: number;
  library: number;
};

type CinematicHeroProps = {
  counts: HeroCounts;
  onScroll?: () => void;
};

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function InstitutionalBadge() {
  return (
    <div className="inline-flex items-center gap-3 border border-white/10 bg-black/35 px-4 py-2 backdrop-blur-md">
      <span className="h-1.5 w-1.5 rounded-full bg-softGold" />
      <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/68">
        Strategic clarity for serious builders
      </span>
    </div>
  );
}

function HeroBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <Image
        src="/assets/images/abraham-of-london-banner@2560.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        quality={85}
        className="object-cover object-[28%_center] opacity-[0.92]"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/82 via-black/56 to-black/44" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_18%_20%,rgba(201,169,106,0.10),transparent_38%),radial-gradient(ellipse_at_82%_24%,rgba(255,255,255,0.06),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-0 aol-grain opacity-[0.045]" />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/70 to-transparent" />
    </div>
  );
}

function AbrahamMark() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-serif text-5xl font-light tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
          Abraham
        </span>
        <span className="font-serif text-4xl font-light italic text-white/40 sm:text-5xl lg:text-6xl xl:text-[4.7rem]">
          of
        </span>
        <span className="font-serif text-5xl font-light italic text-softGold sm:text-6xl lg:text-7xl xl:text-[5.5rem]">
          London
        </span>
      </div>

      <div className="h-px w-24 bg-softGold/35" />
    </div>
  );
}

function PositioningBlock() {
  return (
    <div className="space-y-5">
      <p className="max-w-2xl font-serif text-3xl font-light leading-[1.02] tracking-[-0.025em] text-white/94 sm:text-4xl lg:text-5xl">
        Doctrine, strategy, and execution
        <span className="block text-white/56">organised into one platform.</span>
      </p>

      <p className="max-w-xl text-base leading-relaxed text-white/62 sm:text-lg">
        Institutional thought, disciplined diagnostics, premium reporting,
        private strategy, and deployable intellectual property for serious operators.
      </p>
    </div>
  );
}

function PrimaryActions({ onScroll }: { onScroll?: () => void }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
      <button
        type="button"
        onClick={onScroll}
        className="group inline-flex items-center justify-center gap-3 border border-white/10 bg-white/[0.04] px-6 py-4 font-mono text-[10px] uppercase tracking-[0.28em] text-white/86 transition hover:border-white/20 hover:bg-white/[0.07]"
      >
        <Compass className="h-4 w-4 text-softGold/90" />
        <span>Access the canon</span>
        <ArrowRight className="h-4 w-4 text-white/55 transition-transform group-hover:translate-x-1" />
      </button>

      <Link
        href="/diagnostics/executive-reporting"
        className="group inline-flex items-center justify-center gap-3 border border-softGold/30 bg-softGold/10 px-6 py-4 font-mono text-[10px] uppercase tracking-[0.28em] text-softGold transition hover:bg-softGold/15"
      >
        <ScrollText className="h-4 w-4" />
        <span>Flagship product</span>
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Link>

      <Link
        href="/consulting/strategy-room"
        className="group inline-flex items-center justify-center gap-3 border border-white/10 px-6 py-4 font-mono text-[10px] uppercase tracking-[0.28em] text-white/72 transition hover:border-white/20 hover:bg-white/[0.05] hover:text-white"
      >
        <Crown className="h-4 w-4 text-softGold/80" />
        <span>Strategy Room</span>
      </Link>
    </div>
  );
}

function InstitutionalCounts({ counts }: { counts: HeroCounts }) {
  const items = [
    { value: counts.canon, label: "CANON ENTRIES", href: "/canon" },
    { value: counts.library, label: "LIBRARY WORKS", href: "/library" },
    { value: counts.briefs, label: "STRATEGIC BRIEFS", href: "/vault/briefs" },
    { value: counts.shorts, label: "SHORTS", href: "/shorts" },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="group block border border-white/[0.08] bg-black/20 px-4 py-4 transition hover:border-softGold/22 hover:bg-white/[0.03]"
        >
          <div className="font-mono text-2xl font-light text-white/84 transition-colors group-hover:text-white">
            {item.value}
          </div>
          <div className="mt-2 font-mono text-[8px] uppercase tracking-[0.22em] text-white/36 transition-colors group-hover:text-white/52">
            {item.label}
          </div>
        </Link>
      ))}
    </div>
  );
}

export default function CinematicHero({
  counts,
  onScroll,
}: CinematicHeroProps) {
  return (
    <section className="relative isolate min-h-[760px] w-full overflow-hidden bg-black lg:min-h-[880px]">
      <HeroBackdrop />

      <div className="relative z-10 flex min-h-[760px] items-center lg:min-h-[880px]">
        <div className="mx-auto w-full max-w-7xl px-8 pb-16 pt-28 lg:px-16 lg:pb-20 lg:pt-36">
          <div className="max-w-4xl">
            <div className="space-y-8">
              <InstitutionalBadge />
              <AbrahamMark />
              <PositioningBlock />
            </div>

            <div className="mt-10">
              <PrimaryActions onScroll={onScroll} />
            </div>

            <div className="mt-12">
              <InstitutionalCounts counts={counts} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}