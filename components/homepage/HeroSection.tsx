// components/homepage/HeroSection.tsx
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

const heroVariants = {
  initial: { opacity: 0, y: 50 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: "easeOut", staggerChildren: 0.15 },
  },
};

const textVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const logoVariants = {
  initial: { opacity: 0, rotate: -180 },
  animate: { opacity: 1, rotate: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const ASSETS = {
  heroBanner: "/assets/images/abraham-of-london-banner.webp",
  logo: "/assets/images/logo/abraham-of-london-logo.svg",
  heroVideo: "/assets/videos/hero-background.mp4",
};

interface HeroSectionProps {
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  communityCount: number;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  title,
  subtitle,
  ctaText,
  ctaLink,
  communityCount,
}) => {
  return (
    <section
      className="relative min-h-[70vh] sm:min-h-[85vh] flex items-center justify-center text-center overflow-hidden"
      role="banner"
      aria-label="Welcome to Abraham of London"
    >
      {/* Background video (falls back to poster) */}
      <div className="absolute inset-0 -z-10">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="object-cover w-full h-full"
          poster={ASSETS.heroBanner}
        >
          <source src={ASSETS.heroVideo} type="video/mp4" />
        </video>
        {/* Strong, neutral overlay for guaranteed contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/55 to-black/30" />
      </div>

      <motion.div
        className="relative z-10 max-w-5xl px-4 text-white"
        variants={heroVariants}
        initial="initial"
        animate="animate"
      >
        <motion.div className="mb-6" variants={logoVariants}>
          <Image
            src={ASSETS.logo}
            alt="Abraham of London logo"
            width={140}
            height={140}
            className="mx-auto"
            priority
          />
        </motion.div>

        <motion.h1
          className="font-serif text-4xl sm:text-6xl md:text-7xl font-extrabold mb-4 tracking-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]"
          variants={textVariants}
        >
          {title}
        </motion.h1>

        <motion.p
          className="text-lg sm:text-2xl font-light leading-relaxed max-w-3xl mx-auto mb-8 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
          variants={textVariants}
        >
          {subtitle}{" "}
          <span className="font-medium">
            Join {communityCount.toLocaleString()} global leaders.
          </span>
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          variants={textVariants}
        >
          {/* Primary CTA */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Link
              href={ctaLink}
              className="inline-flex px-8 py-4 rounded-full bg-forest text-cream font-semibold shadow-lg hover:bg-emerald-700 transition-colors"
              aria-label={`Join the ${title} movement`}
            >
              {ctaText}
            </Link>
          </motion.div>

          {/* Secondary CTA */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
            <Link
              href="/shop"
              className="inline-flex px-8 py-4 rounded-full border-2 border-white text-white font-semibold hover:bg-white/10 transition-colors"
              aria-label="Explore the shop"
            >
              Shop Now
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
