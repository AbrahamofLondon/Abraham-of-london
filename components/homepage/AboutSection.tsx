// components/homepage/AboutSection.tsx
import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import SocialLinks from '../SocialLinks';
import { siteConfig } from '../../lib/siteConfig';

const sectionVariants = {
  initial: { opacity: 0, y: 50 },
  whileInView: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const ASSETS = {
  profilePortrait: '/assets/images/profile-portrait.webp',
};

const AboutSection: React.FC = () => {
  return (
    <motion.section
      id="about"
      className="container mx-auto px-4 py-20 relative"
      variants={sectionVariants}
      initial="initial"
      whileInView="whileInView"
      viewport={{ once: true, amount: 0.3 }}
    >
      <div className="flex flex-col md:flex-row items-center gap-12">
        {/* Profile Image with animated border */}
        <motion.div
          className="relative w-64 h-64 md:w-80 md:h-80 rounded-full overflow-hidden shadow-2xl"
          initial={{ scale: 0.8, rotate: -5 }}
          whileInView={{ scale: 1, rotate: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <Image
            src={ASSETS.profilePortrait}
            alt={`${siteConfig.author} - Professional portrait`}
            fill
            sizes="(max-width: 768px) 256px, 320px"
            className="object-cover"
          />
        </motion.div>
        
        {/* About Text Content */}
        <div className="flex-1 text-center md:text-left">
          <h2 className="font-serif text-4xl font-bold text-primary mb-4">
            About {siteConfig.author}
          </h2>
          <p className="text-secondary-text text-lg leading-relaxed max-w-prose">
            {siteConfig.author} is an author, strategist, and fatherhood advocate passionate about family, leadership, and legacy. Through his writing and speaking, he empowers men to embrace their roles with confidence and compassion.
          </p>
          <div className="mt-8">
            <h3 className="font-semibold text-primary mb-2">Connect with me:</h3>
            <SocialLinks links={siteConfig.socialLinks} />
          </div>
        </div>
      </div>
    </motion.section>
  );
};

export default AboutSection;