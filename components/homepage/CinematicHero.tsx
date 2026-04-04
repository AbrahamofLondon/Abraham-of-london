/* ============================================================================
   FILE: components/homepage/CinematicHero.tsx
   HOMEPAGE HERO — CINEMATIC / QUIET LUXURY / FLAGSHIP-READY
============================================================================ */

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

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

function CountChip({
  value,
  label,
  href,
}: {
  value: number;
  label: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/35 px-4 py-2 backdrop-blur-md transition-all duration-500 hover:border-white/20 hover:bg-white/[0.06]"
    >
      <span className="font-mono text-[10px] font-semibold text-white/92">
        {value}
      </span>
      <span className="h-3 w-px bg-white/14" />
      <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/50 transition-all duration-500 group-hover:text-white/75">
        {label}
      </span>
    </Link>
  );
}

function Hairline() {
  return (
    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />
  );
}

function CinematicBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/assets/images/abraham-of-london-banner@2560.webp"
          alt="London skyline"
          fill
          priority
          sizes="100vw"
          quality={82}
          className="object-cover object-[28%_center]"
        />
      </div>

      <div className="absolute inset-0 bg-black/42" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.14)_0%,rgba(0,0,0,0.24)_24%,rgba(0,0,0,0.42)_50%,rgba(0,0,0,0.74)_76%,rgba(0,0,0,0.93)_100%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_22%_38%,rgba(214,178,106,0.13),transparent_42%)]" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/82 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/55 to-transparent" />
      <div className="absolute inset-0 aol-grain opacity-[0.06]" />
    </div>
  );
}

function HeroContent({
  counts,
  onScroll,
}: {
  counts: HeroCounts;
  onScroll?: () => void;
}) {
  return (
    <div className="relative z-20 flex h-full items-center">
      <div className="mx-auto flex h-full w-full max-w-7xl items-center px-6 sm:px-10 lg:px-20">
        <div className="relative w-full max-w-4xl pt-28 sm:pt-32 lg:pt-24">
          <div className="absolute -left-6 top-1/2 hidden h-[360px] w-[560px] -translate-y-1/2 xl:block">
            <div className="absolute inset-[5%] border border-white/[0.05]" />
            <div className="absolute left-[10%] right-[30%] top-[20%] h-px bg-gradient-to-r from-transparent via-white/[0.05] to-transparent" />
            <div className="absolute bottom-[18%] left-[14%] right-[34%] h-px bg-gradient-to-r from-transparent via-white/[0.03] to-transparent" />
          </div>

          <div className="relative text-center sm:text-left">
            <div className="inline-flex items-center gap-3 border border-white/10 bg-black/35 px-4 py-2 backdrop-blur-md">
              <span className="h-1.5 w-1.5 rounded-full bg-softGold" />
              <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-white/68">
                Strategic clarity for serious builders
              </span>
            </div>

            <h1
              className="mt-8 max-w-[8.8ch] font-serif tracking-[-0.05em] text-white"
              style={{
                fontSize: "clamp(3.25rem, 5.7vw, 6rem)",
                lineHeight: 0.9,
                textShadow: "0 18px 32px rgba(0,0,0,0.35)",
              }}
            >
              Abraham
              <br />
              <span className="font-light italic text-white/95">of </span>
              <span className="font-light italic text-softGold">London</span>
            </h1>

            <div className="mt-7 max-w-[40rem] space-y-4">
              <p
                className="text-white/92"
                style={{
                  fontSize: "clamp(1.04rem, 1.36vw, 1.22rem)",
                  lineHeight: 1.52,
                }}
              >
                Doctrine, strategy, and execution organised into one platform.
              </p>

              <p
                className="max-w-[35rem] text-white/62"
                style={{
                  fontSize: "clamp(0.96rem, 1.02vw, 1.03rem)",
                  lineHeight: 1.72,
                }}
              >
                A premium environment for founders, leaders, and institutions
                seeking clearer judgement, stronger architecture, and work that
                endures beyond the moment.
              </p>
            </div>

            <div className="mt-10 max-w-[46rem]">
              <Hairline />

              <div className="flex flex-wrap justify-center gap-3 py-6 sm:justify-start">
                <CountChip value={counts.shorts} label="SHORTS" href="/shorts" />
                <CountChip value={counts.canon} label="CANON" href="/canon" />
                <CountChip value={counts.briefs} label="BRIEFS" href="/vault/briefs" />
                <CountChip value={counts.library} label="VAULT" href="/vault" />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <button
                  type="button"
                  onClick={onScroll}
                  className="inline-flex items-center gap-2 rounded-full border border-softGold/30 bg-softGold/12 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-softGold transition-all duration-500 hover:bg-softGold/18"
                >
                  Enter the Platform
                </button>

                <Link
                  href="/dashboard/live"
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-5 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white/80 transition-all duration-500 hover:bg-white/[0.08] hover:text-white"
                >
                  OGR Terminal
                </Link>

                <Link
                  href="/consulting/strategy-room"
                  className="group inline-flex items-center gap-2 rounded-full border border-white/12 bg-transparent px-5 py-3 font-mono text-[10px] uppercase tracking-[0.3em] text-white/62 transition-all duration-500 hover:border-white/18 hover:bg-white/[0.04] hover:text-white"
                >
                  <span>Strategy Room</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>
              </div>

              <div className="mt-8 max-w-[34rem]">
                <p className="font-mono text-[8px] uppercase tracking-[0.26em] text-white/28">
                  Writing • diagnostics • advisory • institutional architecture
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CinematicHero({
  counts,
  onScroll,
}: CinematicHeroProps) {
  return (
    <section className="relative w-full overflow-hidden bg-[#050505]">
      <div className="relative h-[100svh] min-h-[620px] max-h-[1200px]">
        <CinematicBackdrop />
        <HeroContent counts={counts} onScroll={onScroll} />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30">
          <div className="h-28 bg-gradient-to-t from-black via-black/45 to-transparent" />
          <div className="h-px w-full bg-white/[0.08]" />
        </div>
      </div>
    </section>
  );
}