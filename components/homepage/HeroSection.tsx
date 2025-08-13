// components/homepage/// components/homepage/HeroSection.tsx
import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { siteConfig } from '../../lib/siteConfig';

const heroVariants = {
  initial: { opacity: 0, y: 50 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      ease: "easeOut",
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
};

const textVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const ASSETS = {
  heroBanner: '/assets/images/abraham-of-london-banner.webp',
};

const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center text-center overflow-hidden p-4">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={ASSETS.heroBanner}
          alt="Abraham of London - Cityscape banner"
          priority
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-primary/70 backdrop-blur-sm" />
      </div>

      <motion.div
        className="relative z-10 max-w-4xl text-on-primary"
        variants={heroVariants}
        initial="initial"
        animate="animate"
      >
        <motion.h1
          className="font-serif text-5xl sm:text-7xl font-bold mb-4 tracking-brand"
          variants={textVariants}
        >
          {siteConfig.title}
        </motion.h1>
        <motion.p
          className="text-lg sm:text-xl font-light leading-relaxed max-w-prose mx-auto"
          variants={textVariants}
        >
          {siteConfig.description}
        </motion.p>
      </motion.div>
    </section>
  );
};

export default HeroSection;
import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { siteConfig } from '../../lib/siteConfig';

const heroVariants = {
  initial: { opacity: 0, y: 50 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 1,
      ease: "easeOut",
      staggerChildren: 0.2,
      delayChildren: 0.3
    }
  }
};

const textVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const ASSETS = {
  heroBanner: '/assets/images/abraham-of-london-banner.webp',
};

const HeroSection: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center text-center overflow-hidden p-4">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={ASSETS.heroBanner}
          alt="Abraham of London - Cityscape banner"
          priority
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-primary/70 backdrop-blur-sm" />
      </div>

      <motion.div
        className="relative z-10 max-w-4xl text-on-primary"
        variants={heroVariants}
        initial="initial"
        animate="animate"
      >
        <motion.h1
          className="font-serif text-5xl sm:text-7xl font-bold mb-4 tracking-brand"
          variants={textVariants}
        >
          {siteConfig.title}
        </motion.h1>
        <motion.p
          className="text-lg sm:text-xl font-light leading-relaxed max-w-prose mx-auto"
          variants={textVariants}
        >
          {siteConfig.description}
        </motion.p>
      </motion.div>
    </section>
  );
};

export default HeroSection;