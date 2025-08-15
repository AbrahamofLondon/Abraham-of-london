// components/homepage/HeroSection.tsx
"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

type Props = {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  communityCount: number;
};

// inline SVG gradient used if the banner image 404s
const FALLBACK_HERO =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1200 800' preserveAspectRatio='none'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='0' y2='1'>
          <stop offset='0%' stop-color='#0b2e1f'/>
          <stop offset='55%' stop-color='#1d4d38'/>
          <stop offset='100%' stop-color='#f7f5ef'/>
        </linearGradient>
      </defs>
      <rect width='1200' height='800' fill='url(#g)'/>
    </svg>`
  );

export default function HeroSection({
  title,
  subtitle,
  ctaText,
  ctaLink,
  communityCount,
}: Props) {
  const [bgSrc, setBgSrc] = useState<string>(
    "/assets/images/abraham-of-london-banner.webp"
  );

  // Pre-probe the image on mount so we can swap to the gradient if it 404s
  useEffect(() => {
    if (typeof window === "undefined") return;
    const img = new window.Image();
    img.onload = () => {}; // ok
    img.onerror = () => setBgSrc(FALLBACK_HERO);
    img.src = "/assets/images/abraham-of-london-banner.webp";
  }, []);

  return (
    <section
      className="relative w-full min-h-[72vh] sm:min-h-[82vh] overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* Background image */}
      <div className="absolute inset-0 -z-10">
        <Image
          src={bgSrc}
          alt="Hero banner background"
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          quality={90}
          className="object-cover"
          onError={() => setBgSrc(FALLBACK_HERO)}
        />
        {/* Overlay scrim for legibility (fixes ‘shadowy font’ feedback) */}
        <div className="absolute inset-0 bg-black/55 sm:bg-black/45 md:bg-black/40 lg:bg-black/35" />
      </div>

      {/* Content */}
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
