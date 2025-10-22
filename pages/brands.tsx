// pages/brands.tsx

import React, { useMemo } from "react";
// Removed Next/Head as we'll use the custom SEOHead component
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useSpring, type Variants } from "framer-motion";
import Layout from "@/components/Layout";
// ✅ Using SEOHead for cleaner metadata management
import SEOHead from "@/components/SEOHead"; 
import { siteConfig, absUrl } from "@/lib/siteConfig";
import { sanitizeSocialLinks } from "@/lib/social";
import ScrollProgress from "@/components/ScrollProgress";

// ---------- Brand data (logos are local /public paths) ----------
const BRANDS = [
  {
    name: "InnovateHub", // ✅ ADDED NEW BRAND
    description: "Ventures studio dedicated to R&D, rapid prototyping, and market validation.",
    logo: "/assets/images/logo/innovatehub.svg",
    url: "/ventures?brand=innovatehub", // Assuming internal link for the studio
    tags: ["Innovation", "R&D", "Prototyping"],
    featured: true,
  },
  {
    name: "Alomarada",
    description:
      "Redefining development through ethical market exploration and human capital growth.",
    logo: "/assets/images/logo/alomarada.svg",
    url: "https://alomarada.com",
    tags: ["Consulting", "Development", "Strategy"],
    featured: false,
  },
  {
    name: "Endureluxe",
    description: "High-performance luxury fitness equipment and interactive community.",
    logo: "/assets/images/logo/endureluxe.svg",
    url: "https://endureluxe.com",
    tags: ["Fitness", "Luxury", "Community"],
    featured: false,
  },
] as const;

// ---------- Animations ----------
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }, // Slightly longer stagger
  },
};

const itemVariants: Variants = {
  hidden: { y: 40, opacity: 0, scale: 0.95 },
  visible: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 120, damping: 18 }, // Tighter spring
  },
};

// Parallax (safe on SSR: framer hooks return inert values until client)
function useParallax() {
  const { scrollYProgress } = useScroll();
  const smooth = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });
  // Increased effect: 0% to 35% movement
  const yBg = useTransform(smooth, [0, 1], ["0%", "35%"]); 
  return { yBg };
}

// --- Main Component ---

export default function BrandsPage() {
  const { yBg } = useParallax();

  // Filter main ventures to display, putting featured one first
  const ventures = useMemo(() => {
      const featured = BRANDS.filter(b => b.featured);
      const standard = BRANDS.filter(b => !b.featured);
      return [...featured, ...standard];
  }, []);

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
      // Assuming asset name for core logo
      logo: absUrl("/assets/images/logo/abraham-of-london-logo.svg"), 
      description:
        "The core brand representing personal work, vision, and philosophy—foundation for thought leadership, strategic advisory, and creative ventures.",
      ...(sameAs.length ? { sameAs } : {}),
      // Use 'brand' only for consumer facing sub-brands
      brand: BRANDS.filter(b => !b.featured).map((b) => ({ 
        "@type": "Brand",
        name: b.name,
        url: b.url,
        logo: absUrl(b.logo),
      })),
      // Use 'owns' for all owned entities (including the studio)
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
        { "@type": "ListItem", position: 2, name: "Ventures", item: absUrl("/brands") },
      ],
    };

    return [parentBrand, breadcrumb];
  }, [sameAs]);

  const pageTitle = `Ventures & Brands | ${siteConfig.author}`;
  const pageDesc =
    "Explore the ventures shaped by Abraham of London — Alomarada, Endureluxe, and InnovateHub — built for legacy, innovation, and impact.";
  const canonical = absUrl("/brands");

  return (
    <Layout>
      {/* ✅ UPGRADE: Using SEOHead component */}
      <SEOHead
        title={pageTitle}
        description={pageDesc}
        slug="/brands"
        type="website"
        structuredData={structuredData}
      />

      <main className="relative min-h-screen pt-20 pb-12 overflow-x-hidden">
        <ScrollProgress />

        {/* Parallax backdrop: bg-cream is assumed to be defined in global styles */}
        <motion.div
          className="pointer-events-none fixed inset-0 z-0 bg-cream"
          style={{ y: yBg }}
          aria-hidden="true"
        />

        <div className="container relative z-10 mx-auto max-w-6xl px-4">
          {/* Parent brand card (AOL) */}
          <motion.section
            id="abraham-of-london"
            // ✅ UPGRADE: Using theme colors: text-deepCharcoal, bg-white, shadow-xl
            className="relative mb-16 overflow-hidden rounded-3xl bg-white p-8 shadow-xl md:p-12" 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            whileHover={{ scale: 1.01, boxShadow: "0 20px 40px -10px rgba(13, 71, 30, 0.15)" }}
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
                <h1 className="mb-3 text-4xl font-serif font-bold text-deepCharcoal md:text-5xl">Abraham of London</h1>
                <p className="max-w-prose text-lg leading-relaxed text-[color:var(--color-on-secondary)]">
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
            <h2 className="mb-4 text-3xl font-serif font-bold text-deepCharcoal">Our Guiding Philosophy</h2>
            <p className="mx-auto max-w-3xl text-lg text-[color:var(--color-on-secondary)]/[0.8]">
              At the heart of every venture is a commitment to **legacy, innovation, and impact**. We build
              brands that don&apos;t just exist, but that resonate and drive meaningful change.
            </p>
          </motion.section>

          {/* Child Brands */}
          <section className="mb-16">
            <h2 className="mb-12 text-center text-4xl font-serif font-bold text-deepCharcoal md:text-5xl">Our Ventures</h2>
            <motion.div
              className="grid gap-8 md:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              {ventures.map((brand) => (
                <motion.div
                  key={brand.name}
                  variants={itemVariants}
                  whileHover={{ scale: 1.03 }} // Reduced hover scale slightly for less distraction
                  // ✅ UPGRADE: Using theme colors and border for a polished look
                  className="relative transform rounded-3xl border border-lightGrey bg-white p-8 shadow-card transition-all duration-300 hover:shadow-cardHover" 
                >
                  <a
                    href={brand.url}
                    // Use target=_blank only if not an internal link
                    target={brand.url.startsWith("/") ? "_self" : "_blank"} 
                    rel={brand.url.startsWith("/") ? undefined : "noopener noreferrer"}
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
                      <h3 className="mb-2 text-2xl font-bold text-deepCharcoal">{brand.name}</h3>
                      {/* ❌ FIX: Explicitly wrap the opacity value in square brackets to pass Tailwind checks. */}
                      <p className="mb-4 text-[color:var(--color-on-secondary)]/[0.9]">{brand.description}</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        {brand.tags.map((tag) => (
                          <span
                            key={tag}
                            // ✅ UPGRADE: Using theme colors for tags
                            // ❌ FIX: Explicitly wrap the opacity value in square brackets to pass Tailwind checks.
                            className="rounded-full bg-warmWhite px-3 py-1 text-sm font-medium text-[color:var(--color-on-secondary)]/[0.8]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <span className="mt-4 inline-block text-sm font-medium text-forest hover:underline">
                          {brand.url.startsWith("/") ? "View Details →" : "Visit Site →"}
                      </span>
                    </div>
                  </a>
                </motion.div>
              ))}
            </motion.div>
          </section>

          {/* Call to action */}
          <motion.section
            // ✅ UPGRADE: Using theme colors (bg-forest, text-cream)
            className="rounded-3xl bg-forest p-8 text-center text-cream shadow-xl md:p-12" 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="mb-4 text-3xl font-serif font-bold">Ready to build a legacy?</h2>
            <p className="mx-auto mb-6 max-w-2xl text-lg text-[color:var(--color-on-primary)/0.8]">
              If you&apos;re an entrepreneur or leader looking to create a brand with lasting impact, let&apos;s
              connect.
            </p>
            <Link
              href="/contact"
              // ✅ UPGRADE: Using theme colors for reverse button (bg-cream, text-forest)
              className="aol-btn aol-btn-secondary inline-block rounded-full bg-cream px-8 py-3 font-bold text-forest shadow-lg transition-colors duration-300 hover:bg-lightGrey" 
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