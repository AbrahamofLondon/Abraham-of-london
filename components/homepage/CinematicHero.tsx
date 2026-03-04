/* components/homepage/CinematicHero.tsx
   HERO BANNER — Standout, non-overlapping, 12/10 institutional finish
*/

import * as React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ChevronDown } from "lucide-react";

type HeroCounts = { shorts: number; canon: number; briefs: number; library: number };

function Hairline({ soft = false }: { soft?: boolean }) {
  return (
    <div
      className={[
        "h-px w-full",
        soft
          ? "bg-gradient-to-r from-transparent via-white/10 to-transparent"
          : "bg-gradient-to-r from-transparent via-amber-500/30 to-transparent",
      ].join(" ")}
    />
  );
}

/* =============================================================================
   BACKDROP — controlled contrast + premium depth (predictable)
============================================================================= */
function CinematicBackdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 z-0">
        <Image
          src="/assets/images/abraham-of-london-banner@2560.webp"
          alt="Abraham of London"
          fill
          priority
          className="object-cover scale-[1.06]"
          sizes="100vw"
          quality={100}
        />
      </div>

      {/* Contrast foundation */}
      <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/20 via-black/40 to-black/75" />
      <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_52%_35%,rgba(0,0,0,0.10)_0%,rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.82)_100%)]" />

      {/* Premium light pools */}
      <div className="absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_18%_18%,rgba(245,158,11,0.18)_0%,transparent_55%)]" />
      <div className="absolute inset-0 z-[2] bg-[radial-gradient(ellipse_at_82%_30%,rgba(255,255,255,0.10)_0%,transparent_55%)]" />

      {/* Architectural beams */}
      <div className="absolute left-[12%] top-0 z-[2] h-full w-px bg-gradient-to-b from-transparent via-amber-500/25 to-transparent opacity-70" />
      <div className="absolute left-[38%] top-0 z-[2] h-full w-px bg-gradient-to-b from-transparent via-white/16 to-transparent opacity-55" />
      <div className="absolute left-[62%] top-0 z-[2] h-full w-px bg-gradient-to-b from-transparent via-amber-500/20 to-transparent opacity-60" />
      <div className="absolute left-[88%] top-0 z-[2] h-full w-px bg-gradient-to-b from-transparent via-white/12 to-transparent opacity-45" />

      {/* Particles */}
      <div className="absolute inset-0 z-[2]">
        {Array.from({ length: 18 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/40"
            style={{
              left: `${8 + i * 5.2}%`,
              top: `${16 + (i % 4) * 21}%`,
              width: `${1 + (i % 3)}px`,
              height: `${1 + (i % 3)}px`,
              animation: `cinematic-float ${11 + i * 0.55}s ease-in-out infinite`,
              animationDelay: `${i * 0.28}s`,
              opacity: 0.14 + (i % 3) * 0.08,
              filter: `blur(${i % 3 === 0 ? 0.5 : 0}px)`,
            }}
          />
        ))}
      </div>

      {/* Header fade + bottom fade */}
      <div className="absolute inset-x-0 top-0 z-[3] h-32 bg-gradient-to-b from-black/65 via-black/30 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-[3] h-44 bg-gradient-to-t from-black via-black/75 to-transparent" />
    </div>
  );
}

/* =============================================================================
   TOP UTILITY BAR — pills never overlap (wrap + grid discipline)
============================================================================= */
function TopUtilityBar({ counts }: { counts: HeroCounts }) {
  return (
    <div className="absolute inset-x-0 top-0 z-30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 md:pt-24">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
          {/* Left pill */}
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/25 bg-black/65 backdrop-blur-xl shadow-lg shadow-black/30">
            <span className="text-[10px] font-mono tracking-[0.35em] uppercase text-amber-400/95 font-medium">
              Institutional Platform
            </span>
            <span className="h-1 w-1 rounded-full bg-white/40" />
            <span className="text-[10px] font-mono tracking-[0.25em] uppercase text-white/80 font-light">
              Doctrine • Strategy • Assets
            </span>
          </div>

          {/* Right pill (counts) */}
          <div className="inline-flex items-center gap-1 px-5 py-2.5 rounded-full border border-white/25 bg-black/75 backdrop-blur-xl shadow-lg shadow-black/30">
            <span className="text-[9px] font-mono tracking-[0.24em] text-white/80 uppercase font-medium">
              Registry
            </span>
            <span className="mx-2 text-white/45">•</span>

            <span className="text-[10px] font-mono text-white font-semibold">{counts.library}</span>
            <span className="text-[9px] font-mono tracking-wider text-white/70">assets</span>

            <span className="mx-2 text-white/45">•</span>
            <span className="text-[10px] font-mono text-white font-semibold">{counts.canon}</span>
            <span className="text-[9px] font-mono tracking-wider text-white/70">canon</span>

            <span className="mx-2 text-white/45">•</span>
            <span className="text-[10px] font-mono text-white font-semibold">{counts.shorts}</span>
            <span className="text-[9px] font-mono tracking-wider text-white/70">intel</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
   HERO STAGE — headline + subtitle + CTAs (with readability plate)
============================================================================= */
function HeroStage({ onScroll }: { onScroll: () => void }) {
  return (
    <div className="relative z-20 h-full flex items-center justify-center px-6">
      <div className="relative max-w-5xl mx-auto text-center">
        {/* Readability plate */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center">
          <div className="h-[440px] w-[min(980px,92vw)] rounded-[52px] bg-black/35 border border-white/10 backdrop-blur-[2px] shadow-[0_45px_140px_-85px_rgba(0,0,0,0.98)]" />
        </div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif font-light text-white mb-6"
          style={{
            fontSize: "clamp(2.7rem, 8.2vw, 6.8rem)",
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
            textShadow: "0 12px 72px rgba(0,0,0,0.88)",
          }}
        >
          Abraham of London
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.35, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="font-light tracking-wide max-w-3xl mx-auto"
          style={{
            fontSize: "clamp(1.05rem, 1.9vw, 1.4rem)",
            lineHeight: 1.65,
            color: "rgba(255,255,255,0.90)",
            textShadow: "0 10px 60px rgba(0,0,0,0.85)",
          }}
        >
          Strategic architecture for serious builders.
          <br />
          <span style={{ color: "rgba(255,255,255,0.76)" }}>
            Doctrine, systems, deployable infrastructure.
          </span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.55, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button
            type="button"
            onClick={onScroll}
            className="group inline-flex items-center gap-3 px-9 py-4 rounded-full border border-white/35 bg-black/60 hover:bg-black/80 hover:border-white/50 transition-all duration-700 backdrop-blur-xl shadow-lg hover:shadow-xl"
          >
            <span className="text-[10px] font-mono tracking-[0.32em] uppercase text-white/95 group-hover:text-white font-medium">
              Enter the Platform
            </span>
            <ChevronDown className="h-4 w-4 text-white/75 group-hover:text-white transition-colors" />
          </button>

          <Link
            href="/vault"
            className="group inline-flex items-center gap-3 px-9 py-4 rounded-full border border-amber-500/65 bg-amber-500/22 hover:bg-amber-500/32 hover:border-amber-500/80 transition-all duration-700 backdrop-blur-xl shadow-lg hover:shadow-xl"
          >
            <span className="text-[10px] font-mono tracking-[0.32em] uppercase text-amber-300 font-medium">
              Open Vault
            </span>
            <ArrowRight className="h-4 w-4 text-amber-300/85 group-hover:text-amber-200 transition-colors" />
          </Link>
        </motion.div>

        {/* Micro-proof line (optional but premium) */}
        <div className="mt-10 text-[10px] font-mono uppercase tracking-[0.34em] text-white/60">
          Built to survive scrutiny • Designed to ship
        </div>

        <div className="mt-10 mx-auto max-w-3xl">
          <Hairline soft />
        </div>
      </div>
    </div>
  );
}

/* =============================================================================
   COMPLETE HERO
============================================================================= */
export default function CinematicHero({
  counts,
  onScroll,
}: {
  counts: HeroCounts;
  onScroll: () => void;
}) {
  return (
    <section className="relative overflow-hidden bg-black border-b border-white/12">
      <div className="relative" style={{ height: "90vh", minHeight: 680, maxHeight: 1020 }}>
        <CinematicBackdrop />

        {/* Pills live in a dedicated top bar so they cannot collide */}
        <TopUtilityBar counts={counts} />

        {/* Main hero stage */}
        <HeroStage onScroll={onScroll} />

        {/* Bottom boundary hairline */}
        <div className="absolute inset-x-0 bottom-0 z-[40] h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      </div>

      {/* Keyframes (kept local) */}
      <style>{`
        @keyframes cinematic-float {
          0%, 100% { transform: translate(0,0) scale(1); opacity: 0.14; }
          50% { transform: translate(8px,-18px) scale(1.08); opacity: 0.30; }
        }
        @keyframes cinematic-breathe {
          0%, 100% { opacity: 0.45; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.15); }
        }
      `}</style>
    </section>
  );
}