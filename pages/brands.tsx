// pages/brands.tsx
import React, { useMemo, useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Layout from '@/components/Layout';
import { siteConfig } from '@/lib/siteConfig';

// ---------- Config & Helpers ----------
const SITE_URL = (
Â  process.env.NEXT_PUBLIC_SITE_URL ||
Â  process.env.URL ||
Â  process.env.DEPLOY_PRIME_URL ||
Â  'https://abraham-of-london.netlify.app'
).replace(/\/$/, '');

const abs = (path: string): string => {
Â  if (!path) return '';
Â  if (/^https?:\/\//i.test(path)) return path;
Â  return SITE_URL ? new URL(path, SITE_URL).toString() : path;
};

// Data for the brands
const brands = [
Â  {
Â  Â  name: 'Alomarada',
Â  Â  description: 'Redefining development through ethical market exploration and human capital growth.',
Â  Â  logo: '/assets/images/logo/alomarada.svg',
Â  Â  url: 'https://alomarada.com',
Â  Â  tags: ['Consulting', 'Development', 'Strategy'],
Â  },
Â  {
Â  Â  name: 'Endureluxe',
Â  Â  description: 'High-performance luxury fitness equipment and interactive community.',
Â  Â  logo: '/assets/images/logo/endureluxe.svg',
Â  Â  url: 'https://endureluxe.com',
Â  Â  tags: ['Fitness', 'Luxury', 'Community'],
Â  },
Â  // Add more brands here as needed
];

// Animation Variants
const containerVariants = {
Â  hidden: { opacity: 0 },
Â  visible: {
Â  Â  opacity: 1,
Â  Â  transition: {
Â  Â  Â  staggerChildren: 0.12,
Â  Â  Â  delayChildren: 0.2
Â  Â  },
Â  },
};

const itemVariants = {
Â  hidden: { y: 30, opacity: 0, scale: 0.95 },
Â  visible: {
Â  Â  y: 0,
Â  Â  opacity: 1,
Â  Â  scale: 1,
Â  Â  transition: {
Â  Â  Â  type: "spring",
Â  Â  Â  stiffness: 100,
Â  Â  Â  damping: 15
Â  Â  }
Â  },
};

const parallaxVariants = {
Â  initial: { y: 0, opacity: 1 },
Â  animate: (i: number) => ({
Â  Â  y: [0, 10 * (i + 1), 0],
Â  Â  opacity: [1, 0.5, 1],
Â  Â  transition: {
Â  Â  Â  duration: 6 + i * 2,
Â  Â  Â  repeat: Infinity,
Â  Â  Â  ease: "easeInOut",
Â  Â  Â  delay: i * 0.5
Â  Â  },
Â  }),
};

// Enhanced parallax animation hook
const useParallax = () => {
Â  const { scrollYProgress } = useScroll();
Â  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
Â  const yBg = useTransform(smoothProgress, [0, 1], ['0%', '20%']);
Â  const yContent = useTransform(smoothProgress, [0, 1], ['0%', '40%']);
Â Â 
Â  return { yBg, yContent };
};

// ---------- Page Component ----------
export default function BrandsPage() {
Â  const [mounted, setMounted] = useState(false);
Â  const { yBg, yContent } = useParallax();

Â  useEffect(() => {
Â  Â  setMounted(true);
Â  }, []);

Â  // Comprehensive JSON-LD with enhanced SEO
Â  const structuredData = useMemo(() => {
Â  Â  const parentBrand = {
Â  Â  Â  '@context': 'https://schema.org',
Â  Â  Â  '@type': 'Organization',
Â  Â  Â  '@id': `${SITE_URL}/#organization`,
Â  Â  Â  name: 'Abraham of London',
Â  Â  Â  url: SITE_URL,
Â  Â  Â  logo: abs('/assets/images/logo/abraham-of-london-logo.svg'),
Â  Â  Â  description: "A portfolio of ventures and a foundation for thought leadership, strategic advisory, and creative projects by Abraham Adaramola.",
Â  Â  Â  sameAs: [
Â  Â  Â  Â  siteConfig.social.twitter,
Â  Â  Â  Â  siteConfig.social.linkedin,
Â  Â  Â  ],
Â  Â  Â  brand: brands.map(brand => ({
Â  Â  Â  Â  '@type': 'Brand',
Â  Â  Â  Â  name: brand.name,
Â  Â  Â  Â  url: brand.url,
Â  Â  Â  Â  logo: abs(brand.logo),
Â  Â  Â  })),
Â  Â  Â  owns: brands.map(brand => ({
Â  Â  Â  Â  '@type': 'Organization',
Â  Â  Â  Â  name: brand.name,
Â  Â  Â  Â  url: brand.url,
Â  Â  Â  Â  logo: abs(brand.logo),
Â  Â  Â  })),
Â  Â  };
Â  Â Â 
Â  Â  const breadcrumb = {
Â  Â  Â  '@context': 'https://schema.org',
Â  Â  Â  '@type': 'BreadcrumbList',
Â  Â  Â  itemListElement: [
Â  Â  Â  Â  {
Â  Â  Â  Â  Â  '@type': 'ListItem',
Â  Â  Â  Â  Â  position: 1,
Â  Â  Â  Â  Â  name: 'Home',
Â  Â  Â  Â  Â  item: SITE_URL,
Â  Â  Â  Â  },
Â  Â  Â  Â  {
Â  Â  Â  Â  Â  '@type': 'ListItem',
Â  Â  Â  Â  Â  position: 2,
Â  Â  Â  Â  Â  name: 'Brands',
Â  Â  Â  Â  Â  item: `${SITE_URL}/brands`,
Â  Â  Â  Â  },
Â  Â  Â  ],
Â  Â  };
Â  Â Â 
Â  Â  return [parentBrand, breadcrumb];
Â  }, []);

Â  if (!mounted) {
Â  Â  return <Layout><div className="min-h-screen" /></Layout>;
Â  }

Â  return (
Â  Â  <Layout>
Â  Â  Â  <Head>
Â  Â  Â  Â  {/* SEO Meta Tags */}
Â  Â  Â  Â  <title>Ventures & Brands | {siteConfig.author}</title>
Â  Â  Â  Â  <metaÂ 
Â  Â  Â  Â  Â  name="description"Â 
Â  Â  Â  Â  Â  content="Explore the innovative ventures and brands created by Abraham of London, including Alomarada and Endureluxe. Rooted in legacy, innovation, and impact."Â 
Â  Â  Â  Â  />
Â  Â  Â  Â  <meta name="robots" content="index, follow" />
Â  Â  Â  Â  <link rel="canonical" href={`${SITE_URL}/brands`} />
Â  Â  Â  Â  <meta property="og:title" content="Ventures & Brands | Abraham of London" />
Â  Â  Â  Â  <meta property="og:description" content="Discover a portfolio of brands shaped by Abrahamâ€™s vision of legacy and leadership." />
Â  Â  Â  Â  <meta property="og:url" content={`${SITE_URL}/brands`} />
Â  Â  Â  Â  <meta property="og:image" content={abs(siteConfig.ogImage)} />
Â  Â  Â  Â  <meta property="og:type" content="website" />
Â  Â  Â  Â  <meta name="twitter:card" content="summary_large_image" />
Â  Â  Â  Â  <meta name="twitter:image" content={abs(siteConfig.twitterImage)} />

Â  Â  Â  Â  {/* Structured Data */}
Â  Â  Â  Â  {structuredData.map((schema, index) => (
Â  Â  Â  Â  Â  <script
Â  Â  Â  Â  Â  Â  key={index}
Â  Â  Â  Â  Â  Â  type="application/ld+json"
Â  Â  Â  Â  Â  Â  dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
Â  Â  Â  Â  Â  />
Â  Â  Â  Â  ))}
Â  Â  Â  </Head>

Â  Â  Â  <main className="relative min-h-screen pt-20 pb-12 overflow-x-hidden">
Â  Â  Â  Â  {/* Parallax background */}
Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  className="fixed inset-0 z-0 bg-cream pattern-bg"
Â  Â  Â  Â  Â  style={{ y: yBg }}
Â  Â  Â  Â  />

Â  Â  Â  Â  <div className="container max-w-6xl mx-auto px-4 relative z-10">
Â  Â  Â  Â  Â  {/* Hero Section for the Parent Brand */}
Â  Â  Â  Â  Â  <motion.section
Â  Â  Â  Â  Â  Â  id="abraham-of-london"
Â  Â  Â  Â  Â  Â  className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl mb-16 relative overflow-hidden"
Â  Â  Â  Â  Â  Â  initial={{ opacity: 0, y: -20 }}
Â  Â  Â  Â  Â  Â  animate={{ opacity: 1, y: 0 }}
Â  Â  Â  Â  Â  Â  transition={{ duration: 0.8 }}
Â  Â  Â  Â  Â  Â  whileHover={{ scale: 1.01, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  <div className="absolute inset-0 z-0 opacity-10" />
Â  Â  Â  Â  Â  Â  <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
Â  Â  Â  Â  Â  Â  Â  <motion.divÂ 
Â  Â  Â  Â  Â  Â  Â  Â  className="relative w-[250px] h-[125px] flex-shrink-0"
Â  Â  Â  Â  Â  Â  Â  Â  initial={{ rotateY: -180, opacity: 0 }}
Â  Â  Â  Â  Â  Â  Â  Â  animate={{ rotateY: 0, opacity: 1 }}
Â  Â  Â  Â  Â  Â  Â  Â  transition={{ duration: 1, type: "spring", stiffness: 80, damping: 10 }}
Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  <Image
Â  Â  Â  Â  Â  Â  Â  Â  Â  src="/assets/images/logo/abraham-of-london-logo.svg"
Â  Â  Â  Â  Â  Â  Â  Â  Â  alt="Abraham of London brand logo"
Â  Â  Â  Â  Â  Â  Â  Â  Â  fill
Â  Â  Â  Â  Â  Â  Â  Â  Â  className="object-contain"
Â  Â  Â  Â  Â  Â  Â  Â  Â  priority
Â  Â  Â  Â  Â  Â  Â  Â  />
Â  Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  Â  Â  Â  className="text-center md:text-left"
Â  Â  Â  Â  Â  Â  Â  Â  initial={{ x: -30, opacity: 0 }}
Â  Â  Â  Â  Â  Â  Â  Â  animate={{ x: 0, opacity: 1 }}
Â  Â  Â  Â  Â  Â  Â  Â  transition={{ duration: 0.8, delay: 0.4 }}
Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  <h1 className="text-4xl md:text-5xl font-bold mb-3 text-gray-800">
Â  Â  Â  Â  Â  Â  Â  Â  Â  Abraham of London
Â  Â  Â  Â  Â  Â  Â  Â  </h1>
Â  Â  Â  Â  Â  Â  Â  Â  <p className="text-lg text-gray-700 leading-relaxed max-w-prose">
Â  Â  Â  Â  Â  Â  Â  Â  Â  The core brand representing my personal work, vision, and philosophy. It serves as the foundation for my thought leadership, strategic advisory, and creative ventures.
Â  Â  Â  Â  Â  Â  Â  Â  </p>
Â  Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  Â  </div>
Â  Â  Â  Â  Â  </motion.section>

Â  Â  Â  Â  Â  {/* Brand Philosophy Section */}
Â  Â  Â  Â  Â  <motion.section
Â  Â  Â  Â  Â  Â  className="mb-16 text-center"
Â  Â  Â  Â  Â  Â  initial={{ opacity: 0, y: 30 }}
Â  Â  Â  Â  Â  Â  whileInView={{ opacity: 1, y: 0 }}
Â  Â  Â  Â  Â  Â  viewport={{ once: true, amount: 0.4 }}
Â  Â  Â  Â  Â  Â  transition={{ duration: 0.8, delay: 0.3 }}
Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Guiding Philosophy</h2>
Â  Â  Â  Â  Â  Â  <p className="text-lg text-gray-600 max-w-3xl mx-auto">
Â  Â  Â  Â  Â  Â  Â  At the heart of every venture is a commitment to **legacy, innovation, and impact**. We build brands that don't just exist, but actively shape their industries and enrich the lives of their communities.
Â  Â  Â  Â  Â  Â  </p>
Â  Â  Â  Â  Â  </motion.section>

Â  Â  Â  Â  Â  {/* Sub-Brands Section */}
Â  Â  Â  Â  Â  <motion.section
Â  Â  Â  Â  Â  Â  id="sub-ventures"
Â  Â  Â  Â  Â  Â  initial="hidden"
Â  Â  Â  Â  Â  Â  whileInView="visible"
Â  Â  Â  Â  Â  Â  viewport={{ once: true, amount: 0.3 }}
Â  Â  Â  Â  Â  Â  variants={containerVariants}
Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  <motion.div className="text-center mb-10" variants={itemVariants}>
Â  Â  Â  Â  Â  Â  Â  <h2 className="text-4xl font-bold text-gray-800">
Â  Â  Â  Â  Â  Â  Â  Â  Ventures & Brands
Â  Â  Â  Â  Â  Â  Â  </h2>
Â  Â  Â  Â  Â  Â  Â  <p className="text-lg text-gray-600 max-w-xl mx-auto mt-4">
Â  Â  Â  Â  Â  Â  Â  Â  These are the ventures and projects that are an extension of the core Abraham of London brand.
Â  Â  Â  Â  Â  Â  Â  </p>
Â  Â  Â  Â  Â  Â  </motion.div>

Â  Â  Â  Â  Â  Â  <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-10">
Â  Â  Â  Â  Â  Â  Â  {brands.map((brand, index) => (
Â  Â  Â  Â  Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  Â  Â  Â  Â  key={brand.name}
Â  Â  Â  Â  Â  Â  Â  Â  Â  variants={itemVariants}
Â  Â  Â  Â  Â  Â  Â  Â  Â  whileHover={{
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  y: -8,
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  rotateY: index % 2 === 0 ? 3 : -3,
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  scale: 1.02,
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)'
Â  Â  Â  Â  Â  Â  Â  Â  Â  }}
Â  Â  Â  Â  Â  Â  Â  Â  Â  transition={{ type: "spring", stiffness: 300, damping: 20 }}
Â  Â  Â  Â  Â  Â  Â  Â  Â  style={{ perspective: "1000px" }}
Â  Â  Â  Â  Â  Â  Â  Â  Â  className="bg-white p-8 rounded-3xl shadow-md text-center flex flex-col transform-gpu"
Â  Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  Â  <motion.div
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  className="relative w-[150px] h-[150px] mx-auto mb-6 flex-shrink-0"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  variants={parallaxVariants}
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  custom={index}
Â  Â  Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  <Image
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  src={brand.logo}
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  alt={`${brand.name} logo`}
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  fill
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  className="object-contain"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  loading="lazy"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  />
Â  Â  Â  Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  Â  Â  Â  Â  <h3 className="text-3xl font-semibold mb-2 text-gray-800">{brand.name}</h3>
Â  Â  Â  Â  Â  Â  Â  Â  Â  <p className="text-gray-700 mb-6 leading-relaxed flex-1">{brand.description}</p>
Â  Â  Â  Â  Â  Â  Â  Â  Â  <div className="mt-auto">
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  <Link
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  href={brand.url}
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  target="_blank"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  rel="noopener noreferrer"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  className="group inline-flex items-center justify-center font-medium text-lg text-blue-600 hover:text-blue-800 transition-colors"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Learn More
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  <motion.span
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  className="ml-2"
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  initial={{ x: 0 }}
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  whileHover={{ x: 5 }}
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  transition={{ duration: 0.3 }}
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  >
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  â†’
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  </motion.span>
Â  Â  Â  Â  Â  Â  Â  Â  Â  Â  </Link>
Â  Â  Â  Â  Â  Â  Â  Â  Â  </div>
Â  Â  Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  Â  Â  ))}
Â  Â  Â  Â  Â  Â  </motion.div>
Â  Â  Â  Â  Â  </motion.section>

Â  Â  Â  Â  </div>
Â  Â  Â  </main>
Â  Â  </Layout>
Â  );
}

