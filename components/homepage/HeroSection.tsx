// components/homepage/HeroSection.tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

type Props = {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  communityCount: number;
  /** Background image to render (from /public). */
  backgroundSrc?: string;
};

export default function HeroSection({
  title,
  subtitle,
  ctaText,
  ctaLink,
  communityCount,
  backgroundSrc = "/assets/images/abraham-of-london-banner.webp",
}: Props) {
  return (
    <section
      className="relative w-full min-h-[72vh] sm:min-h-[82vh] overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* Background (only here — do NOT duplicate on the page) */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={backgroundSrc}
          alt="City skyline banner behind hero content"
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={95}
          className="object-cover object-center"
        />
        {/* Legibility scrim */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/40 to-black/30" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-3xl text-white"
        >
          <h1
            id="hero-title"
            className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]"
          >
            {title}
          </h1>

          <p className="mt-4 text-lg sm:text-xl text-white/90">
            {subtitle} Join{" "}
            <strong className="font-semibold">
              {communityCount.toLocaleString()}
            </strong>{" "}
            global leaders.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href={ctaLink}
              className="inline-flex items-center justify-center rounded-full bg-forest text-cream px-6 py-3 font-semibold hover:bg-forest/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-forest/60"
            >
              {ctaText}
            </Link>
            <Link
              href="/books"
              className="inline-flex items-center justify-center rounded-full border border-white/60 bg-white/10 text-white px-6 py-3 font-semibold backdrop-blur hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/60"
            >
              Shop Now
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
