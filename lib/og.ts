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
  /** Optional custom hero image path under /public */
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
      {/* Base gradient so the hero still looks premium if image is missing */}
      <div className="absolute inset-0 -z-20 bg-gradient-to-b from-forest/35 via-forest/18 to-cream" />

      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={backgroundSrc}
          alt=""
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={90}
          className="object-cover object-center"
        />
        {/* Scrim for legibility (reduces need for heavy text-shadow) */}
        <div className="absolute inset-0 bg-black/55 sm:bg-black/45 md:bg-black/40 lg:bg-black/35" />
      </div>

      {/* Foreground content */}
      <div className="relative z-10 container mx-auto px-4 h-full flex items-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
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
              aria-label="Join the movement"
            >
              {ctaText}
            </Link>
            <Link
              href="/books"
              className="inline-flex items-center justify-center rounded-full border border-white/60 bg-white/10 text-white px-6 py-3 font-semibold backdrop-blur hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/60"
              aria-label="Shop the book collection"
            >
              Shop Now
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}