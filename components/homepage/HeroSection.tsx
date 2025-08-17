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
      className="relative isolate w-full min-h-[75vh] sm:min-h-[90vh] overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* Background image + overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={backgroundSrc}
          alt="Abraham of London — Empowering leadership and fatherhood"
          fill
          priority
          fetchPriority="high"
          quality={95}
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Overlay stronger on small screens */}
        <div className="absolute inset-0 bg-black/70 sm:bg-black/60 md:bg-black/50" />
      </div>

      {/* Foreground content */}
      <div className="relative z-10 container mx-auto px-6 h-full flex items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="max-w-2xl text-white"
        >
          <h1
            id="hero-title"
            className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight drop-shadow-lg"
          >
            {title}
          </h1>

          <p className="mt-4 text-lg sm:text-xl md:text-2xl text-white/95 leading-relaxed drop-shadow">
            {subtitle}{" "}
            <span aria-hidden>—</span>
            <span className="sr-only">— </span>
            join{" "}
            <strong className="font-semibold text-cream">
              {communityCount.toLocaleString()}
            </strong>{" "}
            global leaders.
          </p>

          {/* CTA buttons */}
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href={ctaLink}
              className="inline-flex items-center justify-center rounded-full bg-forest text-cream px-7 py-3 text-lg font-semibold shadow-lg hover:bg-forest/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-forest/70"
            >
              {ctaText}
            </Link>
            <Link
              href="/books"
              className="inline-flex items-center justify-center rounded-full border border-white/70 bg-white/15 text-white px-7 py-3 text-lg font-semibold backdrop-blur-md shadow-md hover:bg-white/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/70"
            >
              Shop Now
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
