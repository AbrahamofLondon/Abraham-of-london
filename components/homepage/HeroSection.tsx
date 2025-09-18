"use client";

import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";

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
  /** Optional background video sources */
  videoWebm?: string;
  videoMp4?: string;
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
  videoWebm,
  videoMp4,
  backgroundPriority = true,
  secondaryCtaText = "Shop Now",
  secondaryCtaLink = "/books",
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
      {/* Background media */}
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
        {(videoWebm || videoMp4) && (
          <video
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            playsInline
            muted
            loop
            poster={backgroundSrc}
            preload="metadata"
            aria-hidden="true"
          >
            {videoWebm ? <source src={videoWebm} type="video/webm" /> : null}
            {videoMp4 ? <source src={videoMp4} type="video/mp4" /> : null}
          </video>
        )}
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/60 sm:bg-black/55 md:bg-black/50" />
      </div>

      {/* Foreground */}
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

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap gap-4">
            <Button variant="primary" size="lg" href={ctaLink} aria-label={ctaText}>
              {ctaText}
            </Button>

            {secondaryCtaLink && secondaryCtaText && (
              <Button
                variant="secondary"
                size="lg"
                href={secondaryCtaLink}
                aria-label={secondaryCtaText}
                className="backdrop-blur-md border-white/70 text-white hover:bg-white/10 dark:border-white/70"
              >
                {secondaryCtaText}
              </Button>
            )}
          </div>

          {/* Sub-CTA note */}
          <p className="mt-3 text-xs tracking-wide text-white/75">
            Chatham Rooms available — off the record
          </p>
        </motion.div>
      </div>
    </section>
  );
}
