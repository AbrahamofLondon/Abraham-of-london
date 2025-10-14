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
  statLabel?: string;
  backgroundSrc?: string;
  backgroundPriority?: boolean;
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
  secondaryCtaText = "Featured Insights",
  secondaryCtaLink = "/blog",
  className,
}: Props) {
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
      {/* Background */}
      <div className="absolute inset-0 -z-10">
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
        {/* Softer overlay + subtle vignette */}
        <div className="absolute inset-0 bg-black/50" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-black/10" />
      </div>

      {/* Foreground */}
      <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-4">
        <motion.div
          initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl text-white"
        >
          <p className="mb-3 inline-flex items-center rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs uppercase tracking-widest backdrop-blur">
            New • Chatham Rooms Available
          </p>

          <h1
            id={hId}
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight drop-shadow"
          >
            {title}
          </h1>

          <p className="mt-4 text-lg sm:text-xl md:text-2xl text-white/95 leading-relaxed">
            {subtitle} — join <strong className="font-semibold text-cream">{formattedCount}</strong>{" "}
            {statLabel}.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href={ctaLink}
              className="inline-flex items-center justify-center rounded-full bg-forest text-cream px-7 py-3 text-lg font-semibold shadow-lg hover:bg-[color:var(--color-primary)/0.9] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--color-primary)/0.7]"
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

          <p className="mt-3 text-xs tracking-wide text-white/80">Chatham Rooms — off the record</p>
        </motion.div>
      </div>
    </section>
  );
}
