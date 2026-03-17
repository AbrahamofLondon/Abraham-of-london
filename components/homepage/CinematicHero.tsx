/* components/homepage/CinematicHero.tsx
   ABRAHAM OF LONDON: CINEMATIC HERO (FINAL / ADULT LANDING)
*/

import * as React from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

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
      className="group inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-black/[0.22] px-4 py-2 backdrop-blur-md transition-all duration-300 hover:border-white/[0.18] hover:bg-white/[0.04]"
    >
      <span className="font-mono text-[10px] font-semibold text-white/90">
        {value}
      </span>
      <span className="h-3 w-px bg-white/14" />
      <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/42 transition-colors duration-300 group-hover:text-white/66">
        {label}
      </span>
    </Link>
  );
}

function Hairline() {
  return (
    <div className="h-px w-full bg-gradient-to-r from-transparent via-white/[0.10] to-transparent" />
  );
}

function CinematicBackdrop() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 1000], ["0%", reduceMotion ? "0%" : "7%"]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden select-none">
      <motion.div style={{ y }} className="absolute inset-0 z-0">
        <Image
          src="/assets/images/abraham-of-london-banner@2560.webp"
          alt="Abraham of London Background"
          fill
          priority
          sizes="100vw"
          quality={100}
          className="object-cover object-[28%_center] sm:object-[24%_center] lg:object-[26%_center] brightness-[0.93] contrast-[1.08] saturate-[1.02]"
        />
      </motion.div>

      {/* tonal discipline */}
      <div className="absolute inset-0 z-[1] bg-black/20" />
      <div className="absolute inset-0 z-[2] bg-gradient-to-b from-black/18 via-black/10 to-black/82" />

      {/* header clearing */}
      <div className="absolute inset-x-0 top-0 z-[3] h-28 bg-gradient-to-b from-black/62 via-black/18 to-transparent sm:h-32" />

      {/* reading chamber */}
      <div className="absolute inset-0 z-[4] bg-[linear-gradient(90deg,rgba(0,0,0,0.00)_0%,rgba(0,0,0,0.03)_24%,rgba(0,0,0,0.09)_40%,rgba(0,0,0,0.22)_56%,rgba(0,0,0,0.52)_74%,rgba(0,0,0,0.84)_90%,rgba(0,0,0,0.94)_100%)]" />

      {/* image shaping */}
      <div className="absolute inset-0 z-[5] bg-[radial-gradient(ellipse_at_22%_34%,rgba(245,158,11,0.040),transparent_52%)]" />
      <div className="absolute inset-0 z-[6] bg-[radial-gradient(ellipse_at_34%_42%,transparent_0%,rgba(0,0,0,0.10)_58%,rgba(0,0,0,0.26)_100%)]" />

      {/* restrained bloom */}
      <div className="absolute inset-0 z-[7] opacity-[0.16]">
        <div className="absolute left-[10%] top-[14%] h-[24rem] w-[24rem] rounded-full bg-amber-400/[0.045] blur-[150px]" />
        <div className="absolute left-[34%] top-[12%] h-[22rem] w-[22rem] rounded-full bg-white/[0.018] blur-[140px]" />
      </div>

      {/* rails */}
      <div className="absolute inset-0 z-[8] hidden sm:block">
        <div className="absolute left-[11.5%] h-full w-px bg-gradient-to-b from-transparent via-white/[0.04] to-transparent" />
        <div className="absolute left-[38.5%] h-full w-px bg-gradient-to-b from-transparent via-white/[0.022] to-transparent" />
        <div className="absolute left-[68%] h-full w-px bg-gradient-to-b from-transparent via-white/[0.025] to-transparent" />
      </div>

      {/* floor */}
      <div className="absolute inset-x-0 bottom-0 z-[9] h-40 bg-gradient-to-t from-black/88 via-black/34 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 z-[10] h-52 bg-[linear-gradient(180deg,transparent_0%,rgba(0,0,0,0.10)_24%,rgba(0,0,0,0.30)_58%,rgba(0,0,0,0.90)_100%)]" />
    </div>
  );
}

function HeroStage({ counts }: { counts: HeroCounts }) {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative z-20 flex h-full items-center px-6 sm:px-10 lg:px-20">
      <div className="mx-auto w-full max-w-7xl">
        <div className="grid min-h-[620px] items-center pt-20 sm:min-h-[680px] sm:pt-24 lg:grid-cols-[0.92fr_1.08fr] lg:pt-20">
          <div className="relative">
            {/* guide frame */}
            <div className="absolute -left-6 top-1/2 hidden h-[410px] w-[670px] -translate-y-1/2 xl:block">
              <div className="absolute inset-[3%] border border-white/[0.065]" />
              <div className="absolute inset-x-[7%] inset-y-[10%] border border-white/[0.022]" />
              <div className="absolute left-[8%] right-[28%] top-[20%] h-px bg-gradient-to-r from-transparent via-white/[0.065] to-transparent" />
              <div className="absolute left-[12%] right-[32%] bottom-[18%] h-px bg-gradient-to-r from-transparent via-white/[0.038] to-transparent" />
            </div>

            <div className="relative max-w-[700px] text-center sm:text-left">
              <motion.h1
                initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-[9.2ch] font-serif font-extralight tracking-[-0.045em] text-white"
                style={{
                  fontSize: "clamp(2.9rem, 5.35vw, 5.15rem)",
                  lineHeight: 0.92,
                  textShadow: "0 10px 22px rgba(0,0,0,0.14)",
                }}
              >
                Abraham
                <br />
                <span className="text-white/96">of London</span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 1.05,
                  delay: 0.14,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="mt-7 max-w-[560px] space-y-3"
              >
                <p
                  className="text-white/88"
                  style={{
                    fontSize: "clamp(1.04rem, 1.45vw, 1.22rem)",
                    lineHeight: 1.52,
                  }}
                >
                  Strategic clarity for serious builders.
                </p>

                <p
                  className="font-serif italic text-white/56"
                  style={{
                    fontSize: "clamp(0.98rem, 1.14vw, 1.08rem)",
                    lineHeight: 1.55,
                  }}
                >
                  Robust systems. Disciplined decisions.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: reduceMotion ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 1.15,
                  delay: 0.24,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="mt-10 max-w-[620px]"
              >
                <Hairline />

                <div className="flex flex-wrap justify-center gap-3 py-6 sm:justify-start">
                  <CountChip value={counts.shorts} label="SHORTS" href="/shorts" />
                  <CountChip value={counts.canon} label="CANON" href="/canon" />
                  <CountChip value={counts.briefs} label="BRIEFS" href="/vault/briefs" />
                  <CountChip value={counts.library} label="VAULT" href="/vault" />
                </div>

                <div className="mx-auto h-px w-24 bg-gradient-to-r from-white/[0.16] to-transparent sm:mx-0 sm:w-32" />
              </motion.div>
            </div>
          </div>

          <div className="hidden lg:block" />
        </div>
      </div>
    </div>
  );
}

export default function CinematicHero({ counts }: CinematicHeroProps) {
  return (
    <section className="relative w-full overflow-hidden bg-[#050505]">
      <div
        className="relative"
        style={{ height: "100svh", minHeight: 620, maxHeight: 1200 }}
      >
        <CinematicBackdrop />
        <HeroStage counts={counts} />

        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30">
          <div className="h-28 bg-gradient-to-t from-black via-black/42 to-transparent" />
          <div className="h-px w-full bg-white/[0.08]" />
        </div>
      </div>
    </section>
  );
}