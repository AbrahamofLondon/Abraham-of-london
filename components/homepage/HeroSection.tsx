// components/homepage/HeroSection.tsx
import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

type Props = {
  title: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  communityCount?: number;
};

export default function HeroSection({
  title,
  subtitle,
  ctaText = "Join the Movement",
  ctaLink = "/join",
  communityCount,
}: Props) {
  const prefersReduced = useReducedMotion();

  return (
    <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-24 text-center">
      {/* Logo chip (optional) */}
      <motion.div
        initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
        animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto mb-6 h-12 w-12 rounded-lg bg-white/90 ring-1 ring-black/10 grid place-items-center"
        aria-hidden="true"
      >
        <span className="block h-6 w-6 rounded-sm bg-forest" />
      </motion.div>

      {/* TITLE — no text-shadow, crisp, balanced wrapping */}
      <motion.h1
        initial={prefersReduced ? undefined : { opacity: 0, y: 10 }}
        animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.05 }}
        className="font-serif text-4xl leading-tight text-white sm:text-5xl md:text-6xl supports-[text-wrap:balance]:text-balance drop-shadow-none"
        style={{ textShadow: "none" }}
      >
        {title}
      </motion.h1>

      {/* SUBTITLE — high contrast without glow; subtle pill for legibility */}
      {subtitle && (
        <motion.p
          initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
          animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mx-auto mt-4 max-w-2xl text-base sm:text-lg"
        >
          <span className="inline-block rounded-full bg-black/35 px-4 py-2 text-white/95 backdrop-blur-sm ring-1 ring-white/10">
            {subtitle}
            {typeof communityCount === "number" && (
              <>{" "}Join {communityCount.toLocaleString()} global leaders.</>
            )}
          </span>
        </motion.p>
      )}

      {/* CTAs */}
      <motion.div
        initial={prefersReduced ? undefined : { opacity: 0, y: 8 }}
        animate={prefersReduced ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row"
      >
        <Link
          href={ctaLink}
          className="inline-flex items-center justify-center rounded-full bg-forest px-6 py-3 font-semibold text-cream shadow-lg shadow-black/20 ring-1 ring-black/10 hover:bg-forest/90 transition"
        >
          {ctaText}
        </Link>

        <Link
          href="/shop"
          className="inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-6 py-3 font-semibold text-white hover:bg-white/20 transition"
        >
          Shop Now
        </Link>
      </motion.div>
    </div>
  );
}
