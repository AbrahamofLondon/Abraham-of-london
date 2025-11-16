"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import clsx from "clsx";
import { siteConfig } from "@/lib/siteConfig";
import SocialFollowStrip from "@/components/SocialFollowStrip";

type HerobannerProps = {
  className?: string;
};

const HERO_BG_SRC =
  "/assets/images/abraham-of-london-banner.webp" as const;

export default function Herobanner({
  className,
}: HerobannerProps): JSX.Element {
  const title = siteConfig?.title || "Abraham of London";
  const tagline =
    siteConfig?.tagline ||
    "Faithful strategy for fathers, founders, and board-level leaders.";

  const primaryCtaHref = "/strategy/sample-strategy";
  const secondaryCtaHref = "/books";

  return (
    <section
      className={clsx(
        "relative isolate overflow-hidden bg-deepCharcoal text-cream",
        "pt-24 pb-16 sm:pt-28 sm:pb-20 md:pt-32 md:pb-24",
        className,
      )}
      aria-labelledby="hero-heading"
    >
      {/* Background image + gradient overlay */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0">
          <Image
            src={HERO_BG_SRC}
            alt="Abraham of London – strategic reflection"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center opacity-65"
          />
        </div>

        {/* Dark vignette + brand tint */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/65 to-deepCharcoal/90" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/65 to-transparent" />
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 md:flex-row md:items-center md:gap-12 lg:px-8">
        {/* Left: Core message */}
        <div className="relative z-10 max-w-xl">
          {/* Sub-label */}
          <motion.div
            className="inline-flex items-center gap-2 rounded-full bg-white/8 px-3 py-1 text-xs font-medium tracking-wide text-cream/80 ring-1 ring-white/15 backdrop-blur"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-softGold" />
            <span>Legacy-first strategy · London & Africa</span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            id="hero-heading"
            className="mt-5 font-serif text-3xl font-semibold leading-tight text-cream sm:text-4xl md:text-5xl lg:text-5xl"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
          >
            Building strategy{" "}
            <span className="text-softGold">
              your grandchildren
            </span>{" "}
            will thank you for.
          </motion.h1>

          {/* Tagline / description */}
          <motion.p
            className="mt-4 max-w-xl text-sm leading-relaxed text-cream/80 sm:text-base"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12 }}
          >
            {tagline}  
            From boardroom decisions to the quiet work of fatherhood,
            the brief is the same: build in truth, protect what matters,
            and leave something worth inheriting.
          </motion.p>

          {/* CTAs */}
          <motion.div
            className="mt-7 flex flex-wrap items-center gap-4"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Link
              href={primaryCtaHref}
              prefetch={false}
              className="inline-flex items-center justify-center rounded-full bg-softGold px-6 py-2.5 text-sm font-semibold text-deepCharcoal shadow-sm transition hover:brightness-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-softGold/70"
            >
              Explore strategy thinking
            </Link>

            <Link
              href={secondaryCtaHref}
              prefetch={false}
              className="inline-flex items-center justify-center rounded-full border border-softGold/70 bg-black/10 px-5 py-2.5 text-sm font-semibold text-cream/90 backdrop-blur transition hover:bg-softGold/10"
            >
              Preview upcoming books
            </Link>
          </motion.div>

          {/* Micro-line */}
          <motion.p
            className="mt-3 text-xs text-cream/65"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.36 }}
          >
            Strategy, fatherhood, and marketplace leadership — one
            integrated conversation.
          </motion.p>
        </div>

        {/* Right: “Pillars” / quick links */}
        <motion.aside
          className="relative z-10 w-full max-w-md self-stretch rounded-3xl border border-white/12 bg-black/35 p-5 text-cream shadow-lg backdrop-blur-md sm:p-6 md:mt-4"
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.22 }}
        >
          <h2 className="font-serif text-lg font-semibold">
            Where to start
          </h2>
          <p className="mt-1 text-xs text-cream/75">
            Three lanes, one calling: build, protect, and steward
            multi-generational legacy.
          </p>

          <div className="mt-4 space-y-3 text-sm">
            <HeroPill
              href="/strategy"
              label="Strategy & advisory"
              description="Board-level thinking for founders, boards, and investors navigating complex markets."
            />
            <HeroPill
              href="/downloads"
              label="Legacy tools"
              description="Practical templates, covenants, and liturgies to anchor family and leadership life."
            />
            <HeroPill
              href="/resources/brotherhood-starter-kit"
              label="Brotherhood & fatherhood"
              description="Content and frameworks for men who refuse to outsource their responsibilities."
            />
          </div>

          {/* Optional quick contact line */}
          {siteConfig?.email && (
            <p className="mt-5 text-[11px] text-cream/70">
              Prefer a direct line?{" "}
              <a
                href={`mailto:${siteConfig.email}`}
                className="font-medium text-softGold hover:underline"
              >
                {siteConfig.email}
              </a>
            </p>
          )}
        </motion.aside>
      </div>

      {/* Social strip below hero */}
      <SocialFollowStrip
        variant="dark"
        className="mt-4 pb-2 sm:mt-6 sm:pb-0"
      />
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Helper: “hero pill” cards                                                  */
/* -------------------------------------------------------------------------- */

type HeroPillProps = {
  href: string;
  label: string;
  description: string;
};

function HeroPill({ href, label, description }: HeroPillProps) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="group block rounded-2xl border border-white/15 bg-white/3 px-4 py-3 transition hover:border-softGold/60 hover:bg-white/8"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-semibold text-cream">{label}</span>
        <span className="text-xs text-softGold group-hover:translate-x-0.5 transition-transform">
          View
        </span>
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-cream/80">
        {description}
      </p>
    </Link>
  );
}