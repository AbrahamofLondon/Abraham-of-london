// pages/brands.tsx
import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Layout from '../components/Layout';

const brands = [
  {
    name: 'Alomarada',
    description: 'Redefining development through ethical market exploration and human capital growth.',
    logo: '/assets/images/logo/alomarada.svg',
    url: 'https://alomarada.com',
  },
  {
    name: 'Endureluxe',
    description: 'High-performance luxury fitness equipment and interactive community.',
    logo: '/assets/images/logo/endureluxe.svg',
    url: 'https://endureluxe.com',
  },
];

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

export default function BrandsPage() {
  const siteUrl = 'https://abraham-of-london.netlify.app';

  return (
    <Layout>
      <Head>
        <title>Ventures & Brands | Abraham of London</title>
        <meta
          name="description"
          content="Explore ventures by Abraham of London, including Alomarada and Endureluxe. Rooted in legacy, innovation, and impact."
        />
        <meta property="og:title" content="Ventures & Brands | Abraham of London" />
        <meta property="og:description" content="Discover brands shaped by Abraham’s vision of legacy and leadership." />
        <meta property="og:image" content={`${siteUrl}/assets/images/social/og-image.jpg`} />
        <meta property="og:url" content={`${siteUrl}/brands`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* Remove the redundant header section that was causing the duplication */}
      {/* The `Layout` component handles the main header, so this is no longer needed. */}

      <div className="max-w-5xl mx-auto py-20 px-4">
        {/* Abraham of London Brand Section */}
        <motion.div
          className="bg-white p-8 md:p-12 rounded-2xl shadow-xl mb-20 flex flex-col md:flex-row items-center gap-8 md:gap-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          whileHover={{ scale: 1.02 }}
        >
          <div className="relative w-[250px] h-[125px] flex-shrink-0">
            <Image
              src="/assets/images/logo/abraham-of-london-logo.svg"
              alt="Abraham of London brand logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-800">Abraham of London</h2>
            <p className="text-lg text-gray-700 leading-relaxed max-w-prose">
              This is the core brand representing my personal work, vision, and philosophy. It serves as the foundation for my thought leadership, strategic advisory, and creative ventures. All other projects are branches of this central mission.
            </p>
          </div>
        </motion.div>

        {/* Sub-Ventures Section */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <motion.h2 className="text-4xl font-bold mb-10 text-center text-gray-800" variants={itemVariants}>
            Sub-Ventures
          </motion.h2>
          <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {brands.map((brand) => (
              <motion.div
                key={brand.name}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.05 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-8 rounded-2xl shadow-md text-center flex flex-col"
              >
                <div className="relative w-[150px] h-[150px] mx-auto mb-6">
                  <Image
                    src={brand.logo}
                    alt={`${brand.name} logo`}
                    fill
                    className="object-contain"
                    loading="lazy"
                  />
                </div>
                <h3 className="text-3xl font-semibold mb-2">{brand.name}</h3>
                <p className="text-gray-700 mb-6 leading-relaxed flex-1">{brand.description}</p>
                <Link
                  href={brand.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Visit ${brand.name} website`}
                  className="inline-flex items-center justify-center text-blue-600 hover:text-blue-800 transition-colors text-lg font-medium mt-auto"
                >
                  Learn More
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M12.293 2.293a1 1 0 011.414 0l5 5a1 1 0 01-1.414 1.414L14 5.414V17a1 1 0 11-2 0V5.414l-3.293 3.293a1 1 0 01-1.414-1.414l5-5z" />
                  </svg>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </Layout>
  );
}