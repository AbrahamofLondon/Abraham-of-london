// components/homepage/VenturesSection.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

interface Brand {
  name: string;
  description: string;
  logo: string;
  url: string;
  metric?: string;
}

const brands: Brand[] = [
  {
    name: 'Alomarada',
    description: 'Redefining development through ethical market exploration and human capital growth.',
    logo: '/assets/images/logo/alomarada.svg',
    url: 'https://alomarada.com',
    metric: '10K+ Jobs Created',
  },
  {
    name: 'Endureluxe',
    description: 'High-performance luxury fitness equipment and interactive community.',
    logo: '/assets/images/logo/endureluxe.svg',
    url: 'https://endureluxe.com',
    metric: '5M+ Users',
  },
  {
    name: 'InnovateHub',
    description: 'A platform for tech startups to scale with sustainable solutions.',
    logo: '/assets/images/logo/innovatehub.svg',
    url: 'https://innovatehub.com',
    metric: '20+ Startups Supported',
  },
];

interface VenturesProps {
  brandsData?: Brand[];
}

export default function VenturesSection({ brandsData = brands }: VenturesProps) {
  return (
    <section
      id="ventures"
      className="py-24 px-4 bg-gradient-to-br from-[var(--color-lightGrey)]/20 to-[var(--color-primary)]/20 rounded-lg shadow-inner text-[var(--color-on-primary)]"
      aria-label="Abraham of London Ventures"
    >
      <motion.div
        className="max-w-6xl mx-auto text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        variants={containerVariants}
      >
        <motion.h2
          className="text-4xl md:text-5xl font-extrabold mb-6 tracking-wide"
          variants={itemVariants}
        >
          My Ventures & Brands
        </motion.h2>
        <motion.p
          className="text-lg md:text-xl text-[var(--color-on-primary)]/80 max-w-2xl mx-auto mb-16"
          variants={itemVariants}
        >
          A portfolio of innovation, sustainability, and impact, all under the umbrella of Abraham of London.
        </motion.p>

        <motion.div
          className="bg-[var(--color-warmWhite)]/20 p-8 md:p-12 rounded-2xl shadow-xl mb-20 flex flex-col md:flex-row items-center gap-8 md:gap-12 backdrop-blur-sm border border-[var(--color-on-primary)]/10"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.02, boxShadow: '0 10px 20px rgba(0, 112, 244, 0.3)' }}
        >
          <div className="relative w-[250px] h-[125px] flex-shrink-0">
            <Image
              src="/assets/images/logo/abraham-of-london-logo.svg"
              alt="Abraham of London brand logo"
              fill
              className="object-contain transition-transform duration-300 hover:scale-105"
              priority
            />
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-4xl md:text-5xl font-bold mb-4 text-[var(--color-on-primary)]">Abraham of London</h3>
            <p className="text-lg text-[var(--color-on-primary)]/80 leading-relaxed max-w-prose">
              The cornerstone of my mission, driving thought leadership, strategic advisory, and creative ventures globally.
            </p>
          </div>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          {brandsData.map((brand) => (
            <motion.div
              key={brand.name}
              variants={itemVariants}
              whileHover={{ y: -5, scale: 1.05, boxShadow: '0 8px 16px rgba(0, 0, 0, 0.2)' }}
              transition={{ duration: 0.3 }}
              className="bg-[var(--color-warmWhite)]/10 p-6 rounded-2xl shadow-md text-center flex flex-col hover:bg-[var(--color-warmWhite)]/20 backdrop-blur-sm border border-[var(--color-on-primary)]/5"
            >
              <div className="relative w-[150px] h-[150px] mx-auto mb-6">
                <Image
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  fill
                  className="object-contain transition-transform duration-300 hover:scale-110"
                  loading="lazy"
                />
              </div>
              <h3 className="text-2xl font-semibold mb-2 text-[var(--color-on-primary)]">{brand.name}</h3>
              <p className="text-[var(--color-on-primary)]/80 mb-4 leading-relaxed flex-1">{brand.description}</p>
              {brand.metric && <p className="text-sm text-[var(--color-on-primary)]/70 mb-4">{brand.metric}</p>}
              <Link
                href={brand.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center text-[var(--color-on-primary)] hover:text-[var(--color-accent)] transition-colors text-base font-medium mt-auto"
                aria-label={`Visit ${brand.name} website`}
              >
                Learn More
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 ml-2 transition-transform duration-300 group-hover:translate-x-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.97 4.28a.75.75 0 011.06 0l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06l3.22-3.22H4a.75.75 0 010-1.5h12.22l-3.22-3.22a.75.75 0 010-1.06z"
                    clipRule="evenodd"
                  />
                </svg>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="mt-12 text-center" variants={itemVariants}>
          <Link
            href="/ventures"
            className="group inline-flex items-center px-6 py-3 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-full font-medium hover:bg-[var(--color-primary-hover)] hover:text-[var(--color-on-primary-hover)] transition-all duration-300 shadow-lg hover:shadow-xl"
            aria-label="View all ventures"
          >
            View All Ventures
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-2 transition-transform duration-300 group-hover:translate-x-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12.97 4.28a.75.75 0 011.06 0l4.5 4.5a.75.75 0 010 1.06l-4.5 4.5a.75.75 0 01-1.06-1.06l3.22-3.22H4a.75.75 0 010-1.5h12.22l-3.22-3.22a.75.75 0 010-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}