"use client";

/* ============================================================================
   FILE: components/homepage/CinematicHero.tsx
   HOMEPAGE HERO — INSTITUTIONAL PRESENCE
   
   Copy principle: Authority through demonstration, not declaration.
   The name. The wordmark. A factual orienting line.
   No strapline. No badge. No announcement of what kind of thing this is.
   The statistics are the evidence.
============================================================================ */

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Compass, Crown, ScrollText } from "lucide-react";

const GOLD = "#C9A96E";

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
        quality={90}
        className="object-cover object-[28%_center]"
      />

      {/* Cinematic depth overlays */}
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to right, rgba(3,3,5,0.90) 0%, rgba(3,3,5,0.65) 42%, rgba(3,3,5,0.50) 100%)" }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgb(3 3 5) 0%, transparent 30%, rgba(3,3,5,0.35) 100%)" }} />
      <div className="pointer-events-none absolute inset-0" style={{ background: `radial-gradient(ellipse 55% 70% at 15% 30%, ${GOLD}07 0%, transparent 60%)` }} />

      {/* Grain */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.040]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px 180px",
        }}
      />

      {/* Gold thread — top */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD}22, transparent)` }} />
      {/* Fade to base at bottom */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40" style={{ background: "linear-gradient(to top, rgb(6 6 9), transparent)" }} />
    </div>
  );
}

function AbrahamMark() {
  return (
    <div className="space-y-5">
      <div
        className="font-['Cormorant_Garamond',Georgia,serif] font-light leading-[0.86] tracking-[-0.045em]"
        style={{ fontFeatureSettings: '"liga" 1, "kern" 1' }}
      >
        <div className="flex flex-wrap items-baseline" style={{ gap: "0 1.2rem" }}>
          <span className="text-white" style={{ fontSize: "clamp(4rem, 10vw, 9.5rem)" }}>
            Abraham
          </span>
          <span className="italic text-white/28" style={{ fontSize: "clamp(3.2rem, 8vw, 7.8rem)" }}>
            of
          </span>
        </div>
        <div className="italic" style={{ fontSize: "clamp(4rem, 10vw, 9.5rem)", color: GOLD }}>
          London
        </div>
      </div>

      <div className="h-px w-24" style={{ background: `${GOLD}50` }} />
    </div>
  );
}

function PrimaryActions({ onScroll }: { onScroll?: () => void }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
      <Link
        href="/diagnostics/executive-reporting"
        className="group inline-flex items-center justify-center gap-3 border px-7 py-4 font-['JetBrains_Mono',ui-monospace,monospace] text-[9px] uppercase tracking-[0.32em] backdrop-blur-sm transition"
        style={{ borderColor: `${GOLD}44`, backgroundColor: `${GOLD}11`, color: GOLD }}
        onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}66`; el.style.backgroundColor = `${GOLD}1A`; }}
        onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.borderColor = `${GOLD}44`; el.style.backgroundColor = `${GOLD}11`; }}
      >
        <ScrollText className="h-3.5 w-3.5" />
        <span>Executive Reporting</span>
        <ArrowRight className="h-3.5 w-3.5 opacity-60 transition-transform group-hover:translate-x-0.5" />
      </Link>

      <button
        type="button"
        onClick={onScroll}
        className="group inline-flex items-center justify-center gap-3 border border-white/[0.08] bg-white/[0.03] px-7 py-4 font-['JetBrains_Mono',ui-monospace,monospace] text-[9px] uppercase tracking-[0.32em] text-white/55 backdrop-blur-sm transition hover:border-white/[0.15] hover:bg-white/[0.06] hover:text-white"
      >
        <Compass className="h-3.5 w-3.5" style={{ color: `${GOLD}CC` }} />
        <span>The platform</span>
        <ArrowRight className="h-3.5 w-3.5 opacity-45 transition-transform group-hover:translate-x-0.5 group-hover:opacity-80" />
      </button>

      <Link
        href="/consulting/strategy-room"
        className="group inline-flex items-center justify-center gap-3 border border-white/[0.06] px-7 py-4 font-['JetBrains_Mono',ui-monospace,monospace] text-[9px] uppercase tracking-[0.32em] text-white/32 backdrop-blur-sm transition hover:border-white/[0.12] hover:bg-white/[0.03] hover:text-white/55"
      >
        <Crown className="h-3.5 w-3.5" style={{ color: `${GOLD}90` }} />
        <span>Strategy Room</span>
      </Link>
    </div>
  );
}

function InstitutionalCounts({ counts }: { counts: HeroCounts }) {
  const items = [
    { value: counts.canon,   label: "Canon entries",    href: "/canon" },
    { value: counts.library, label: "Library works",    href: "/library" },
    { value: counts.briefs,  label: "Strategic briefs", href: "/vault/briefs" },
    { value: counts.shorts,  label: "Dispatches",       href: "/shorts" },
  ];

  return (
    <div className="border-t border-white/[0.055] bg-black/72 backdrop-blur-md">
      <div className="grid grid-cols-2 divide-x divide-white/[0.055] lg:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group px-6 py-5 transition hover:bg-white/[0.022]"
          >
            <div className="font-['Cormorant_Garamond',Georgia,serif] text-[2rem] font-light text-white/72 transition-colors group-hover:text-white">
              {item.value}
            </div>
            <div className="mt-1 font-['JetBrains_Mono',ui-monospace,monospace] text-[7px] uppercase tracking-[0.30em] text-white/24 transition-colors group-hover:text-white/42">
              {item.label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function CinematicHero({ counts, onScroll }: CinematicHeroProps) {
  return (
    <section
      className="relative isolate h-screen max-h-[1120px] min-h-[760px] w-full overflow-hidden"
      style={{ backgroundColor: "rgb(3 3 5)" }}
    >
      <HeroBackdrop />

      {/* Main content */}
      <div className="relative z-10 flex h-full flex-col justify-between">
        <div className="flex flex-1 items-center">
          <div className="mx-auto w-full max-w-7xl px-8 pb-8 pt-36 lg:px-16 lg:pt-44">
            <div className="max-w-[56rem] space-y-10">

              {/* Wordmark — the name speaks, no badge above it */}
              <AbrahamMark />

              {/* Single orienting line — factual, not promotional */}
              <p
                className="font-['Cormorant_Garamond',Georgia,serif] font-light leading-relaxed text-white/42"
                style={{ fontSize: "clamp(1.05rem, 2vw, 1.35rem)", maxWidth: "48ch" }}
              >
                Doctrine, diagnostics, executive intelligence, and selective advisory
                <span className="block text-white/22">organised into one governed platform.</span>
              </p>

              <PrimaryActions onScroll={onScroll} />
            </div>
          </div>
        </div>

        {/* Stats strip — bottom of hero */}
        <InstitutionalCounts counts={counts} />
      </div>
    </section>
  );
}