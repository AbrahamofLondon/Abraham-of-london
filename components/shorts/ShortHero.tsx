// components/shorts/ShortHero.tsx
"use client";

import React from "react";
import { motion } from "framer-motion";

interface ShortHeroProps {
  title: string;
  excerpt?: string;
  coverImage?: string;
  className?: string;
}

export default function ShortHero({
  title,
  excerpt,
  coverImage,
  className = "",
}: ShortHeroProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={`relative isolate overflow-hidden ${className}`}
    >
      {/* Base backdrop */}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#030303_0%,#060606_35%,#0b0b0d_100%)]" />

      {/* Cover image layer */}
      {coverImage ? (
        <>
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.24] scale-[1.03]"
            style={{ backgroundImage: `url(${coverImage})` }}
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.78)_0%,rgba(0,0,0,0.62)_38%,rgba(0,0,0,0.88)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(201,169,106,0.16),transparent_42%)]" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(201,169,106,0.12),transparent_34%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.06),transparent_28%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(255,255,255,0.04),transparent_24%)]" />
        </>
      )}

      {/* Soft veil */}
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.24)_0%,rgba(0,0,0,0.06)_22%,rgba(0,0,0,0.06)_78%,rgba(0,0,0,0.24)_100%)]" />

      {/* Grain */}
      <div className="absolute inset-0 aol-grain opacity-[0.05]" />

      {/* Decorative top glow */}
      <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(ellipse_at_top,rgba(201,169,106,0.10),transparent_65%)]" />

      {/* Framing lines */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-amber-500/25 to-transparent" />

      {/* Side vignette */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/35 to-transparent" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/35 to-transparent" />

      {/* Content */}
      <div className="relative mx-auto max-w-5xl px-6 py-20 md:px-8 md:py-24 lg:py-28">
        <div className="max-w-3xl">
          {/* Kicker row */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45 }}
            className="mb-6 flex items-center gap-3"
          >
            <span className="inline-flex items-center rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.28em] text-amber-300/90 backdrop-blur-sm">
              Short
            </span>
            <span className="h-px w-10 bg-gradient-to-r from-amber-500/50 to-transparent" />
            <span className="text-[10px] font-mono uppercase tracking-[0.28em] text-white/38">
              Editorial Dispatch
            </span>
          </motion.div>

          {/* Title block with subtle glow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14, duration: 0.5 }}
            className="relative"
          >
            <div className="absolute -inset-x-4 -inset-y-6 rounded-[2rem] bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.05),transparent_58%)] blur-2xl" />
            <h1 className="relative font-serif text-4xl font-medium leading-[1.02] tracking-[-0.03em] text-white md:text-5xl lg:text-6xl xl:text-[4.25rem]">
              {title}
            </h1>
          </motion.div>

          {/* Excerpt */}
          {excerpt ? (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.52 }}
              className="mt-6 max-w-2xl text-[1.02rem] leading-8 text-white/68 md:text-lg"
            >
              {excerpt}
            </motion.p>
          ) : null}

          {/* Bottom signature line */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.45 }}
            className="mt-10 flex items-center gap-4"
          >
            <div className="h-px w-14 bg-gradient-to-r from-amber-400/70 to-amber-400/10" />
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40">
              Abraham of London
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom atmospheric fade */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/35 to-transparent" />
    </motion.section>
  );
}