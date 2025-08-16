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
  /** Optional: override banner path with fallback support */
  backgroundSrc?: string;
};

/**
 * Hero section component with animated content and background image.
 * @param {Props} props - Component props including title, subtitle, CTA, community count, and optional background image.
 */
export default function HeroSection({
  title,
  subtitle,
  ctaText,
  ctaLink,
  communityCount,
  backgroundSrc = "/assets/images/abraham-of-london-banner.webp", // Fallback for missing asset
}: Props) {
  // Fallback asset handling
  const safeBackgroundSrc = backgroundSrc || "/assets/images/default-banner.webp";

  return (
    <section
      className="relative isolate w-full min-h-[70vh] sm:min-h-[85vh] overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* Background with fallback and optimized rendering */}
      <div className="absolute inset-0 z-0">
        <Image
          src={safeBackgroundSrc}
          alt="Abraham of London — Empowering leadership and fatherhood background"
          fill
          priority
          fetchPriority="high"
          quality={95}
          sizes="(max-width: 768px) 100vw, 1200px"
          className="object-cover object-center transition-opacity duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/assets/images/default-banner.webp"; // Graceful fallback on load error
          }}
        />
        {/* Enhanced scrim with gradient for depth and legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 to-black/30" />
      </div>

      {/* Content with centered layout and improved accessibility */}
      <div className="relative z-10 container mx-auto px-4 h-full flex items-center justify-center sm:justify-start">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-3xl text-white text-center sm:text-left"
        >
          <h1
            id="hero-title"
            className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.05]"
          >
            {title}
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-white/90">
            {subtitle} Join{" "}
            <strong className="font-semibold" aria-label={`community of ${communityCount.toLocaleString()} leaders`}>
              {communityCount.toLocaleString()}
            </strong>{" "}
            global leaders.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
            <Link
              href={ctaLink}
              className="inline-flex items-center justify-center rounded-full bg-forest text-cream px-6 py-3 font-semibold hover:bg-forest/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-forest/60"
              aria-label={`Join the ${ctaText.toLowerCase()} movement`}
            >
              {ctaText}
            </Link>
            <Link
              href="/books"
              className="inline-flex items-center justify-center rounded-full border border-white/60 bg-white/10 text-white px-6 py-3 font-semibold backdrop-blur hover:bg-white/20 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white/60"
              aria-label="Shop Abraham of London's books now"
            >
              Shop Now
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}