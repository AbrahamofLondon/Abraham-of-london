// pages/brands.tsx
import React, { useMemo } from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring, type Variants } from "framer-motion";
import Layout from "@/components/Layout";
import { siteConfig, absUrl } from "@/lib/siteConfig";
import { sanitizeSocialLinks } from "@/lib/social";
import ScrollProgress from "@/components/ScrollProgress";

// ---------- Brand data (logos are local /public paths) ----------
const BRANDS = [
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
    description: "High-performance luxury fitness equipment and interactive community.",
    logo: "/assets/images/logo/endureluxe.svg",
    url: "https://endureluxe.com",
    tags: ["Fitness", "Luxury", "Community"],
  },
] as const;

// ---------- Animations ----------
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.2 },
  },
};

const itemVariants: Variants = {
  hidden: { y: 30, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 100, damping: 15 },
  },
};
// Parallax (safe on SSR: framer hooks return inert values until client)
function useParallax() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  const yBg = useTransform(smooth, [0, 1], ["0%", "20%"]);
  return { yBg };
}

export default function BrandsPage() {
  const { yBg } = useParallax();

  // Build sameAs from siteConfig.socialLinks, sanitized and deduped
  const sameAs = useMemo(() => {
    const raw = sanitizeSocialLinks(siteConfig.socialLinks || []);
    const urls = raw.map((l) => l.href).filter((h) => /^https?:\/\//i.test(h));
    return Array.from(new Set(urls));
  }, []);

  // Structured Data
  const structuredData = useMemo(() => {
    const parentBrand = {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${siteConfig.siteUrl}/#organization`,
      name: siteConfig.title,
      url: siteConfig.siteUrl,
      logo: absUrl("/assets/images/logo/abraham-of-london-logo.svg"),
      description:
        "The core brand representing personal work, vision, and philosophy—foundation for thought leadership, strategic advisory, and creative ventures.",
      ...(sameAs.length ? { sameAs } : {}),
      brand: BRANDS.map((b) => ({
        "@type": "Brand",
        name: b.name,
        url: b.url,
        logo: absUrl(b.logo),
      })),
      owns: BRANDS.map((b) => ({
        "@type": "Organization",
        name: b.name,
        url: b.url,
        logo: absUrl(b.logo),
      })),
    };

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.siteUrl },
        { "@type": "ListItem", position: 2, name: "Brands", item: absUrl("/brands") },
      ],
    };

    return [parentBrand, breadcrumb];
  }, [sameAs]);

  const pageTitle = `Ventures & Brands | ${siteConfig.author}`;
  const pageDesc =
    "Explore the ventures shaped by Abraham of London — Alomarada and Endureluxe — built for legacy, innovation, and impact.";
  const canonical = absUrl("/brands");

  const ogImageAbs = siteConfig.ogImage?.startsWith("/")
    ? absUrl(siteConfig.ogImage)
    : siteConfig.ogImage;
  const twitterImageAbs = siteConfig.twitterImage?.startsWith("/")
    ? absUrl(siteConfig.twitterImage)
    : siteConfig.twitterImage;

  return (
    <Layout>
      <Head>
        <title>{pageTitle}</title>
        <meta name="author" content={siteConfig.author} />
        <meta name="description" content={pageDesc} />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href={canonical} />

        {/* Open Graph */}
        <meta property="og:site_name" content={siteConfig.title} />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDesc} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        {ogImageAbs ? (
          <>
            <meta property="og:image" content={ogImageAbs} />
            <meta property="og:image:alt" content="Abraham of London — ventures and brands" />
          </>
        ) : null}

        {/* Twitter / X */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDesc} />
        {twitterImageAbs ? <meta name="twitter:image" content={twitterImageAbs} /> : null}

        {/* JSON-LD */}
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
        <motion.div
          className="pointer-events-none fixed inset-0 z-0 bg-cream"
          style={{ y: yBg }}
          aria-hidden="true"
        />

        <div className="container relative z-10 mx-auto max-w-6xl px-4">
          {/* Parent brand card */}
          <motion.section
            id="abraham-of-london"
            className="relative mb-16 overflow-hidden rounded-3xl bg-white p-8 shadow-2xl md:p-12"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            whileHover={{
              scale: 1.01,
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
            }}
          >
            <div className="relative z-10 flex flex-col items-center gap-8 md:flex-row md:gap-12">
              <motion.div
                className="relative h-[125px] w-[250px] flex-shrink-0"
                initial={{ rotateY: -180, opacity: 0 }}
                animate={{ rotateY: 0, opacity: 1 }}
                transition={{ duration: 1, type: "spring", stiffness: 80, damping: 10 }}
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
                <h1 className="mb-3 text-4xl font-bold text-gray-800 md:text-5xl">Abraham of London</h1>
                <p className="max-w-prose text-lg leading-relaxed text-gray-700">
                  The core brand representing my personal work, vision, and philosophy. It serves as the foundation for
                  my thought leadership, strategic advisory, and creative ventures.
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
            <h2 className="mb-4 text-3xl font-bold text-gray-800">Our Guiding Philosophy</h2>
            <p className="mx-auto max-w-3xl text-lg text-gray-600">
              At the heart of every venture is a commitment to <strong>legacy, innovation, and impact</strong>. We build
              brands that don&apos;t just exist, but that resonate and drive meaningful change.
            </p>
          </motion.section>

          {/* Child Brands */}
          <section className="mb-16">
            <h2 className="mb-12 text-center text-4xl font-bold text-gray-800 md:text-5xl">Our Ventures</h2>
            <motion.div
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {BRANDS.map((brand) => (
                <motion.div
                  key={brand.name}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  className="relative transform rounded-3xl bg-white p-8 shadow-2xl transition-all duration-300"
                >
                  <a
                    href={brand.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                    aria-label={`Visit ${brand.name}`}
                  >
                    <div className="mb-6 flex h-24 items-center justify-center">
                      <Image
                        src={brand.logo}
                        alt={`${brand.name} logo`}
                        width={200}
                        height={100}
                        className="max-h-full object-contain"
                      />
                    </div>
                    <div className="text-center">
                      <h3 className="mb-2 text-2xl font-bold text-gray-800">{brand.name}</h3>
                      <p className="mb-4 text-gray-600">{brand.description}</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {brand.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-700"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </a>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* Call to action */}
          <motion.section
            className="rounded-3xl bg-gray-800 p-8 text-center text-white shadow-xl md:p-12"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="mb-4 text-3xl font-bold">Ready to build a legacy?</h2>
            <p className="mx-auto mb-6 max-w-2xl text-lg text-gray-300">
              If you&apos;re an entrepreneur or leader looking to create a brand with lasting impact, let&apos;s
              connect.
            </p>
            <Link
              href="/contact"
              className="inline-block rounded-full bg-forest px-8 py-3 font-bold text-cream shadow-lg transition-colors duration-300 hover:bg-[color:var(--color-primary)/0.9]"
              prefetch={false}
            >
              Get in Touch
            </Link>
          </motion.section>
        </div>
      </main>
    </Layout>
  );
}

// Optional ISR (daily). Remove if you prefer fully static.
export async function getStaticProps() {
  return { props: {}, revalidate: 86400 };
}
