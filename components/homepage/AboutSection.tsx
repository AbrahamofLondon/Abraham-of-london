import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import SocialLinks from '../SocialLinks';
import { siteConfig } from '../../lib/siteConfig';

interface AboutSectionProps {
  bio: string;
  achievements: { title: string; description: string; year: number }[];
}

const ASSETS = {
  profilePortrait: '/assets/images/profile-portrait.webp',
};

const AboutSection = ({ bio, achievements }: AboutSectionProps) => {
  const fadeInUp = {
    initial: { opacity: 0, y: 40 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const staggerContainer = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  return (
    <section className="bg-white text-gray-800 py-20 px-4" id="about">
      <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
        <motion.div
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, amount: 0.3 }}
          variants={staggerContainer}
        >
          <motion.h2
            className="font-serif text-4xl font-bold mb-4 text-deepCharcoal"
            variants={fadeInUp}
          >
            About {siteConfig.author}
          </motion.h2>
          <motion.p
            className="text-lg mb-6 leading-relaxed text-gray-700"
            variants={fadeInUp}
          >
            {bio}
          </motion.p>
          <motion.div variants={fadeInUp}>
            <SocialLinks links={siteConfig.socialLinks} variant="solid" />
          </motion.div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 0.8, ease: [0.6, -0.05, 0.01, 0.99] }}
          className="relative w-full h-96 rounded-lg overflow-hidden shadow-lg transform hover:scale-[1.02] transition-transform duration-300"
        >
          <Image
            src={ASSETS.profilePortrait}
            alt="Profile portrait of Abraham"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover object-top"
          />
        </motion.div>
      </div>
      <motion.div
        className="container mx-auto mt-16"
        initial="initial"
        whileInView="animate"
        viewport={{ once: true, amount: 0.3 }}
        variants={staggerContainer}
      >
        <h3 className="text-3xl font-bold mb-8 text-center text-deepCharcoal">
          Key Achievements & Milestones
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {achievements.map((achievement, index) => (
            <motion.div
              key={index}
              className="bg-gray-100 p-6 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300"
              variants={fadeInUp}
            >
              <h4 className="text-xl font-bold mb-2 text-deepCharcoal">{achievement.title}</h4>
              <p className="text-gray-600">{achievement.description}</p>
              <span className="text-sm text-gray-400 mt-2 block">{achievement.year}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default AboutSection;