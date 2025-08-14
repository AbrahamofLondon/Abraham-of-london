// pages/brands.tsx
import React, { useMemo, useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Layout from '@/components/Layout';
import { siteConfig } from '@/lib/siteConfig';
import ScrollProgress from '@/components/ScrollProgress';

// ---------- Config & Helpers ----------
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  'https://abraham-of-london.netlify.app'
).replace(/\/$/, '');

const abs = (path: string): string => {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return SITE_URL ? new URL(path, SITE_URL).toString() : path;
};

// Data for the brands
const brands = [
  {
    name: 'Alomarada',
    description: 'Redefining development through ethical market exploration and human capital growth.',
    logo: '/assets/images/logo/alomarada.svg',
    url: 'https://alomarada.com',
    tags: ['Consulting', 'Development', 'Strategy'],
  },
  {
    name: 'Endureluxe',
    description: 'High-performance luxury fitness equipment and interactive community.',
    logo: '/assets/images/logo/endureluxe.svg',
    url: 'https://endureluxe.com',
    tags: ['Fitness', 'Luxury', 'Community'],
  },
  // Add more brands here as needed
];

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2
    },
  },
};

const itemVariants = {
  hidden: { y: 30, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15
    }
  },
};

const parallaxVariants = {
  initial: { y: 0, opacity: 1 },
  animate: (i: number) => ({
    y: [0, 10 * (i + 1), 0],
    opacity: [1, 0.5, 1],
    transition: {
      duration: 6 + i * 2,
      repeat: Infinity,
      ease: "easeInOut",
      delay: i * 0.5
    },
  }),
};

// Enhanced parallax animation hook
const useParallax = () => {
  const { scrollYProgress } = useScroll();
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const yBg = useTransform(smoothProgress, [0, 1], ['0%', '20%']);
  const yContent = useTransform(smoothProgress, [0, 1], ['0%', '40%']);
  
  return { yBg, yContent };
};

// ---------- Page Component ----------
export default function BrandsPage() {
  const [mounted, setMounted] = useState(false);
  const { yBg, yContent } = useParallax();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Comprehensive JSON-LD with enhanced SEO
  const structuredData = useMemo(() => {
    const parentBrand = {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Abraham of London',
      url: SITE_URL,
      logo: abs('/assets/images/logo/abraham-of-london-logo.svg'),
      description: "A portfolio of ventures and a foundation for thought leadership, strategic advisory, and creative projects by Abraham Adaramola.",
      sameAs: [
        siteConfig.social.twitter,
        siteConfig.social.linkedin,
      ],
      brand: brands.map(brand => ({
        '@type': 'Brand',
        name: brand.name,
        url: brand.url,
        logo: abs(brand.logo),
      })),
      owns: brands.map(brand => ({
        '@type': 'Organization',
        name: brand.name,
        url: brand.url,
        logo: abs(brand.logo),
      })),
    };
    
    const breadcrumb = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Brands',
          item: `${SITE_URL}/brands`,
        },
      ],
    };
    
    return [parentBrand, breadcrumb];
  }, []);

  if (!mounted) {
    return <Layout><div className="min-h-screen" /></Layout>;
  }

  return (
    <Layout>
      <Head>
        {/* SEO Meta Tags */}
        <title>Ventures & Brands | {siteConfig.author}</title>
        <meta 
          name="description" 
          content="Explore the innovative ventures and brands created by Abraham of London, including Alomarada and Endureluxe. Rooted in legacy, innovation, and impact." 
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_URL}/brands`} />
        <meta property="og:title" content="Ventures & Brands | Abraham of London" />
        <meta property="og:description" content="Discover a portfolio of brands shaped by Abraham&apos;s vision of legacy and leadership." />
        <meta property="og:url" content={`${SITE_URL}/brands`} />
        <meta property="og:image" content={abs(siteConfig.ogImage)} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={abs(siteConfig.twitterImage)} />

        {/* Structured Data */}
        {structuredData.map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </Head>

      <main className="relative min-h-screen pt-20 pb-12 overflow-x-hidden">
        <ScrollProgress />
        {/* Parallax background */}
        <motion.div
          className="fixed inset-0 z-0 bg-cream pattern-bg"
          style={{ y: yBg }}
        />

        <div className="container max-w-6xl mx-auto px-4 relative z-10">
          {/* Hero Section for the Parent Brand */}
          <motion.section
            id="abraham-of-london"
            className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl mb-16 relative overflow-hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            whileHover={{ scale: 1.01, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}
          >
            <div className="absolute inset-0 z-0 opacity-10" />
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
              <motion.div 
                className="relative w-[250px] h-[125px] flex-shrink-0"
                initial={{ rotateY: -180, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ duration: 1, type: "spring", stiffness: 80, damping: 10 }}
              >
                <Image
                  src="/assets/images/logo/abraham-of-london-logo.svg"
                  alt="Abraham of London brand logo"
                  fill
                  className="object-contain"
                  priority
                />
              </motion.div>
              <motion.div
                className="text-center md:text-left"
                initial={{ x: -30, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <h1 className="text-4xl md:text-5xl font-bold mb-3 text-gray-800">
                  Abraham of London
                </h1>
                <p className="text-lg text-gray-700 leading-relaxed max-w-prose">
                  The core brand representing my personal work, vision, and philosophy. It serves as the foundation for my thought leadership, strategic advisory, and creative ventures.
                </p>
              </motion.div>
            </div>
          </motion.section>

          {/* Brand Philosophy Section */}
          <motion.section
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Our Guiding Philosophy</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              At the heart of every venture is a commitment to <strong>legacy, innovation, and impact</strong>. We build brands that don&apos;t just exist, but actively shape their industries and enrich the lives of their communities.
            </p>
          </motion.section>

          {/* Sub-Brands Section */}
          <motion.section
            id="sub-ventures"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={containerVariants}
          >
            <motion.div className="text-center mb-10" variants={itemVariants}>
              <h2 className="text-4xl font-bold text-gray-800">
                Ventures & Brands
              </h2>
              <p className="text-lg text-gray-600 max-w-xl mx-auto mt-4">
                These are the ventures and projects that are an extension of the core Abraham of London brand.
              </p>
            </motion.div>

            <motion.div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {brands.map((brand, index) => (
                <motion.div
                  key={brand.name}
                  variants={itemVariants}
                  whileHover={{
                    y: -8,
                    rotateY: index % 2 === 0 ? 3 : -3,
                    scale: 1.02,
                    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.15)'
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ perspective: "1000px" }}
                  className="bg-white p-8 rounded-3xl shadow-md text-center flex flex-col transform-gpu"
                >
                  <motion.div
                    className="relative w-[150px] h-[150px] mx-auto mb-6 flex-shrink-0"
                    variants={parallaxVariants}
                    custom={index}
                  >
                    <Image
                      src={brand.logo}
                      alt={`${brand.name} logo`}
                      fill
                      className="object-contain"
                      loading="lazy"
                    />
                  </motion.div>
                  <h3 className="text-3xl font-semibold mb-2 text-gray-800">{brand.name}</h3>
                  <p className="text-gray-700 mb-6 leading-relaxed flex-1">{brand.description}</p>
                  <div className="mt-auto">
                    <Link
                      href={brand.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center justify-center font-medium text-lg text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      Learn More
                      <motion.span
                        className="ml-2"
                        initial={{ x: 0 }}
                        whileHover={{ x: 5 }}
                        transition={{ duration: 0.3 }}
                      >
                        →
                      </motion.span>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.section>

        </div>
      </main>
    </Layout>
  );
}