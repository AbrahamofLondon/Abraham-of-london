import React, { useMemo, useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import Layout from "@/components/Layout";
import { siteConfig } from "@/lib/siteConfig";
import ScrollProgress from "@/components/ScrollProgress";

// ---------- Config & Helpers ----------
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  process.env.URL ||
  process.env.DEPLOY_PRIME_URL ||
  "https://abraham-of-london.netlify.app"
).replace(/\/$/, "");

const abs = (path: string): string => {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path, SITE_URL).toString();
};

// Corrected Brand data with fixed logo paths
const brands = [
  {
    name: "Alomarada",
    description:
      "Redefining development through ethical market exploration and human capital growth.",
    logo: "/assets/images/logo/alomarada.svg",
    url: "https://alomarada.com",
    tags: ["Consulting", "Development", "Strategy"],
  },
  {
    name: "Endureluxe",
    description:
      "High-performance luxury fitness equipment and interactive community.",
    logo: "/assets/images/logo/endureluxe.svg",
    url: "https://endureluxe.com",
    tags: ["Fitness", "Luxury", "Community"],
  },
];

// Animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { y: 30, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 100, damping: 15 },
  },
};

// Parallax hook
const useParallax = () => {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const yBg = useTransform(smooth, [0, 1], ["0%", "20%"]);
  return { yBg };
};

// ---------- Page ----------
export default function BrandsPage() {
  const [mounted, setMounted] = useState(false);
  const { yBg } = useParallax();

  useEffect(() => setMounted(true), []);

  // Build sameAs from siteConfig.socialLinks
  const sameAs = useMemo(
    () =>
      (siteConfig.socialLinks || [])
        .filter((l) => l.external && /^https?:\/\//i.test(l.href))
        .map((l) => l.href),
    [],
  );

  // JSON-LD
  const structuredData = useMemo(() => {
    const parentBrand = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Abraham of London",
      url: SITE_URL,
      logo: abs("/assets/images/logo/abraham-of-london-logo.svg"),
      description:
        "The core brand representing my personal work, vision, and philosophy. It serves as the foundation for my thought leadership, strategic advisory, and creative ventures.",
      sameAs,
      brand: brands.map((b) => ({
        "@type": "Brand",
        name: b.name,
        url: b.url,
        logo: abs(b.logo),
      })),
      owns: brands.map((b) => ({
        "@type": "Organization",
        name: b.name,
        url: b.url,
        logo: abs(b.logo),
      })),
    };

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "Brands",
          item: `${SITE_URL}/brands`,
        },
      ],
    };

    return [parentBrand, breadcrumb];
  }, [sameAs]);

  if (!mounted)
    return (
      <Layout>
        <div className="min-h-screen" />
      </Layout>
    );

  return (
    <Layout>
      <Head>
        <title>Ventures & Brands | {siteConfig.author}</title>
        <meta name="author" content={siteConfig.author} />
        <meta
          name="description"
          content="Explore the innovative ventures and brands created by Abraham of London, including Alomarada and Endureluxe. Rooted in legacy, innovation, and impact."
        />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={`${SITE_URL}/brands`} />

        {/* Open Graph */}
        <meta property="og:site_name" content={siteConfig.title} />
        <meta
          property="og:title"
          content="Ventures & Brands | Abraham of London"
        />
        <meta
          property="og:description"
          content="Discover a portfolio of brands shaped by Abraham&apos;s vision of legacy and leadership."
        />
        <meta property="og:url" content={`${SITE_URL}/brands`} />
        <meta
          property="og:image"
          content={abs(siteConfig.ogImage || "/assets/images/social/og-image.jpg")}
        />
        <meta property="og:type" content="website" />

        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:image"
          content={abs(siteConfig.twitterImage || "/assets/images/social/twitter-image.webp")}
        />

        {structuredData.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </Head>

      <main className="relative min-h-screen pt-20 pb-12 overflow-x-hidden">
        <ScrollProgress />

        {/* Parallax backdrop */}
        <motion.div className="fixed inset-0 z-0 bg-cream" style={{ y: yBg }} />

        <div className="container max-w-6xl mx-auto px-4 relative z-10">
          {/* Parent brand card */}
          <motion.section
            id="abraham-of-london"
            className="bg-white p-8 md:p-12 rounded-3xl shadow-2xl mb-16 relative overflow-hidden"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            whileHover={{
              scale: 1.01,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            }}
          >
            <div className="flex flex-col md:flex-row items-center gap-8 md:gap-12 relative z-10">
              <motion.div
                className="relative w-[250px] h-[125px] flex-shrink-0"
                initial={{ rotateY: -180, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{
                  duration: 1,
                  type: "spring",
                  stiffness: 80,
                  damping: 10,
                }}
              >
                <Image
                  src="/assets/images/logo/abraham-of-london-logo.svg"
                  alt="Abraham of London brand logo"
                  fill
                  sizes="(max-width: 768px) 250px, 250px"
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
                  The core brand representing my personal work, vision, and
                  philosophy. It serves as the foundation for my thought
                  leadership, strategic advisory, and creative ventures.
                </p>
              </motion.div>
            </div>
          </motion.section>

          {/* Philosophy */}
          <motion.section
            className="mb-16 text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8, delay: 0.3 }}
          >
            <h2 className="text-3xl font-bold text-gray-800 mb-4">
              Our Guiding Philosophy
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              At the heart of every venture is a commitment to{" "}
              <strong>legacy, innovation, and impact</strong>. We build brands
              that don&apos;t just exist, but that resonate and drive meaningful
              change.
            </p>
          </motion.section>

          {/* Child Brands */}
          <section className="mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 text-gray-800">
              Our Ventures
            </h2>
            <motion.div
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {brands.map((brand) => (
                <motion.div
                  key={brand.name}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  className="bg-white rounded-3xl shadow-2xl p-8 transform transition-all duration-300 relative overflow-hidden"
                >
                  <Link
                    href={brand.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                    aria-label={`Visit ${brand.name}`}
                  >
                    <div className="flex items-center justify-center h-24 mb-6">
                      <Image
                        src={brand.logo}
                        alt={`${brand.name} logo`}
                        width={200}
                        height={100}
                        className="object-contain max-h-full"
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-2 text-gray-800">
                        {brand.name}
                      </h3>
                      <p className="text-gray-600 mb-4">{brand.description}</p>
                      <div className="flex justify-center flex-wrap gap-2">
                        {brand.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1 rounded-full"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* Call to action */}
          <motion.section
            className="bg-gray-800 text-white p-8 md:p-12 rounded-3xl text-center shadow-xl"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl font-bold mb-4">
              Ready to build a legacy?
            </h2>
            <p className="text-lg text-gray-300 mb-6 max-w-2xl mx-auto">
              If you&apos;re an entrepreneur or leader looking to create a brand
              with lasting impact, let&apos;s connect.
            </p>
            <Link
              href="/contact"
              className="inline-block bg-forest text-cream font-bold py-3 px-8 rounded-full shadow-lg hover:bg-forest/90 transition-colors duration-300"
            >
              Get in Touch
            </Link>
          </motion.section>
        </div>
      </main>
    </Layout>
  );
}
