"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

type Props = {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  communityCount: number | string;
  /** Label for the stat (e.g., "global leaders"). Defaults to "global leaders". */
  statLabel?: string;
  /** Local /public path preferred. If remote, ensure the domain is whitelisted in next.config.js */
  backgroundSrc?: string;
  /** If true, Next/Image will prioritize loading (use for above-the-fold hero). */
  backgroundPriority?: boolean;
  /** Optional secondary CTA */
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
  className?: string;
};

export default function HeroSection({
  title,
  subtitle,
  ctaText,
  ctaLink,
  communityCount,
  statLabel = "global leaders",
  backgroundSrc = "/assets/images/abraham-of-london-banner.webp",
  backgroundPriority = true,
  secondaryCtaText = "Shop Now",
  secondaryCtaLink = "/books",
  className,
}: Props) {
  // Prefer Intl for robust, locale-aware formatting; fall back gracefully
  const formattedCount = React.useMemo(() => {
    const n =
      typeof communityCount === "string"
        ? Number(communityCount.replace(/[, ]/g, ""))
        : Number(communityCount);
    if (!isFinite(n)) return String(communityCount);
    try {
      return new Intl.NumberFormat(undefined).format(n);
    } catch {
      return n.toLocaleString();
    }
  }, [communityCount]);

  const reduceMotion = useReducedMotion();
  const hId = React.useId();

  return (
    <section
      className={`relative isolate w-full min-h-[75vh] sm:min-h-[90vh] overflow-hidden ${className ?? ""}`}
      aria-labelledby={hId}
    >
      {/* Decorative background image (empty alt + aria-hidden) */}
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundSrc}
          alt=""
          aria-hidden="true"
          fill
          priority={backgroundPriority}
          fetchPriority={backgroundPriority ? "high" : "auto"}
          quality={90}
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Overlay with responsive intensity */}
        <div className="absolute inset-0 bg-black/70 sm:bg-black/60 md:bg-black/50" />
      </div>

      {/* Foreground content */}
      <div className="relative z-10 container mx-auto px-6 h-full flex items-center">
        <motion.div
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.7, ease: "easeOut" }}
          className="max-w-2xl text-white"
        >
          <h1
            id={hId}
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight drop-shadow-lg"
          >
            {title}
          </h1>

          <p className="mt-4 text-lg sm:text-xl md:text-2xl text-white/95 leading-relaxed drop-shadow">
            {subtitle} <span aria-hidden>—</span>
            <span className="sr-only">— </span>
            join{" "}
            <strong className="font-semibold text-cream">{formattedCount}</strong>{" "}
            {statLabel}.
          </p>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href={ctaLink}
              className="inline-flex items-center justify-center rounded-full bg-forest text-cream px-7 py-3 text-lg font-semibold shadow-lg hover:bg-forest/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-forest/70"
              aria-label={ctaText}
            >
              {ctaText}
            </Link>

            {secondaryCtaLink && secondaryCtaText && (
              <Link
                href={secondaryCtaLink}
                className="inline-flex items-center justify-center rounded-full border border-white/70 bg-white/15 text-white px-7 py-3 text-lg font-semibold backdrop-blur-md shadow-md hover:bg-white/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/70"
                aria-label={secondaryCtaText}
              >
                {secondaryCtaText}
              </Link>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
