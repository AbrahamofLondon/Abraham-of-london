import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { siteConfig } from '@/lib/siteConfig';

const heroVariants = {
  initial: { opacity: 0, y: 50 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      ease: "easeOut",
      staggerChildren: 0.2,
      delayChildren: 0.3,
    },
  },
};

const textVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const logoVariants = {
  initial: { opacity: 0, rotate: -180 },
  animate: { opacity: 1, rotate: 0, transition: { duration: 1, ease: "easeOut" } },
};

const ASSETS = {
  heroBanner: '/assets/images/abraham-of-london-banner.webp',
  logo: '/assets/images/abraham-of-london-logo.svg',
};

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  communityCount?: number;
}

const HeroSection: React.FC<HeroSectionProps> = ({ title = siteConfig.title, subtitle = siteConfig.description, ctaText = "Join the Movement", ctaLink = "/join", communityCount = 0 }) => {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center text-center overflow-hidden p-4"
      role="banner"
      aria-label="Welcome to Abraham of London"
    >
      {/* Video or Animated Background */}
      <div className="absolute inset-0 z-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="object-cover w-full h-full"
          poster={ASSETS.heroBanner}
        >
          <source src="/assets/videos/hero-background.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/70 to-transparent backdrop-blur-sm animate-pulse-slow" />
      </div>

      <motion.div
        className="relative z-10 max-w-5xl text-white"
        variants={heroVariants}
        initial="initial"
        animate="animate"
      >
        {/* Logo Animation */}
        <motion.div
          className="mb-6"
          variants={logoVariants}
        >
          <Image
            src={ASSETS.logo}
            alt={`${siteConfig.title} Logo`}
            width={150}
            height={150}
            className="mx-auto"
          />
        </motion.div>

        <motion.h1
          className="font-serif text-6xl sm:text-8xl font-extrabold mb-6 tracking-brand text-shadow-lg"
          variants={textVariants}
        >
          {title}
        </motion.h1>
        <motion.p
          className="text-xl sm:text-2xl font-light leading-relaxed max-w-3xl mx-auto mb-8"
          variants={textVariants}
        >
          {subtitle} <span className="font-medium">Join {communityCount.toLocaleString()} global leaders.</span>
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row gap-4 justify-center"
          variants={textVariants}
        >
          <motion.a
            href={ctaLink}
            className="px-8 py-4 bg-blue-600 text-white rounded-full font-semibold hover:bg-blue-700 transition-all duration-300 shadow-lg hover:shadow-xl"
            whileHover={{ scale: 1.05 }}
            aria-label={`Join the ${title} movement`}
          >
            {ctaText}
          </motion.a>
          <motion.a
            href="/shop"
            className="px-8 py-4 border-2 border-white text-white rounded-full font-semibold hover:bg-white/10 transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            aria-label="Explore Abraham of London shop"
          >
            Shop Now
          </motion.a>
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
