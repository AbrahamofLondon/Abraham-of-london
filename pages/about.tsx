// pages/about.tsx
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import React, { useMemo } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { siteConfig } from "@/lib/siteConfig";

// --- build-time props (avoids client env usage) ---
type Props = { origin: string };

export const getStaticProps: GetStaticProps<Props> = async () => {
  const origin = (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "https://abraham-of-london.netlify.app"
  ).replace(/\/$/, "");

  return { props: { origin }, revalidate: 86400 };
};

// --- helpers ---
const abs = (origin: string) => (path: string) =>
  !path ? "" : /^https?:\/\//i.test(path) ? path : `${origin}${path.startsWith("/") ? "" : "/"}${path}`;

// --- animations ---
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function AboutPage({ origin }: InferGetStaticPropsType<typeof getStaticProps>) {
  const makeAbs = useMemo(() => abs(origin), [origin]);

  const sameAs = useMemo(
    () => (siteConfig.socialLinks || [])
      .filter((l) => l.external && /^https?:\/\//i.test(l.href))
      .map((l) => l.href),
    []
  );

  const structuredData = useMemo(() => {
    const person = {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": `${origin}/#person`,
      name: siteConfig.author,
      url: origin,
      image: makeAbs("/assets/images/profile-portrait.webp"),
      sameAs,
      jobTitle: "Founder & Strategic Advisor",
      description:
        "Founder and strategic advisor from London focused on leadership, innovation, and legacy.",
    };

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: origin },
        { "@type": "ListItem", position: 2, name: "About", item: `${origin}/about` },
      ],
    };

    return [person, breadcrumb];
  }, [origin, makeAbs, sameAs]);

  return (
    <Layout pageTitle="About">
      <Head>
        {/* keep meta, Layout provides the <title> */}
        <meta
          name="description"
          content="About Abraham of London — a founder and strategic advisor from London helping leaders build enduring brands, teams, and legacies."
        />
        <meta name="author" content={siteConfig.author} />
        <meta property="og:title" content={`About | ${siteConfig.title}`} />
        <meta
          property="og:description"
          content="Abraham of London is a founder and strategic advisor from London focused on leadership, innovation, and legacy."
        />
        <meta property="og:image" content={makeAbs(siteConfig.ogImage || "/assets/images/social/og-image.jpg")} />
        <meta property="og:url" content={`${origin}/about`} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={`${origin}/about`} />
        {structuredData.map((schema, i) => (
          <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        ))}
      </Head>

      {/* Hero */}
      <motion.div
        className="bg-gradient-to-b from-forest to-midGreen/20 py-20 px-4 text-center"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-4xl mx-auto">
          <motion.h1
            className="text-5xl md:text-6xl font-serif font-bold mb-4 text-cream drop-shadow"
            variants={itemVariants}
          >
            About Abraham
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-cream/90 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            I’m a founder and strategic advisor from London. I help leaders build
            enduring brands, resilient teams, and legacies that last.
          </motion.p>
        </div>
      </motion.div>

      {/* Intro section */}
      <div className="max-w-5xl mx-auto py-20 px-4">
        <motion.section
          className="bg-white p-8 md:p-12 rounded-2xl flex flex-col md:flex-row items-center mb-16 shadow-xl ring-1 ring-black/5"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative w-full md:w-1/2 h-64 md:h-96 rounded-xl overflow-hidden mb-8 md:mb-0 md:mr-12">
            <Image
              src="/assets/images/profile-portrait.webp"
              alt="Portrait of Abraham of London"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 500px"
              priority
            />
          </div>

          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Strategist, Writer, Builder</h2>
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
              My work sits at the intersection of leadership, brand strategy, and human development.
              Whether advising founders, writing, or building ventures, I focus on clarity, durability, and
              meaningful impact.
            </p>
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
              I care less about trends and more about timeless principles—family, character, stewardship,
              and creativity. Those values guide every plan, partnership, and page I publish.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              This isn’t just a brand—it’s an ongoing body of work. From thought leadership to personal
              writing like{" "}
              <Link
                href="/books/fathering-without-fear"
                className="text-forest underline decoration-forest/40 hover:decoration-forest"
              >
                Fathering Without Fear
              </Link>
              , each project serves the same aim: to help people build lives and legacies that matter.
            </p>
          </div>
        </motion.section>

        {/* Focus areas */}
        <motion.section
          className="text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-4 text-gray-900">Focus Areas</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            A selection of the domains where I spend most of my time and energy.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-white p-6 rounded-xl shadow-md ring-1 ring-black/5">
              <h3 className="text-xl font-bold mb-2">Corporate Strategy</h3>
              <p className="text-gray-700">
                Growth, partnerships, and transformation across public and private sectors.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md ring-1 ring-black/5">
              <h3 className="text-xl font-bold mb-2">Writing & Speaking</h3>
              <p className="text-gray-700">
                Insights on leadership, business, and legacy through essays and talks.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md ring-1 ring-black/5">
              <h3 className="text-xl font-bold mb-2">Infrastructure & Digital</h3>
              <p className="text-gray-700">
                Cloud and digital strategies for resilient, sustainable infrastructure.
              </p>
            </div>
          </div>

          <div className="mt-12">
            <Link
              href="/contact"
              aria-label="Contact Abraham of London"
              className="inline-block bg-forest text-cream font-semibold px-8 py-3 rounded-full shadow-lg hover:bg-forest/90 focus:outline-none focus:ring-2 focus:ring-forest focus:ring-offset-2"
            >
              Let’s Connect
            </Link>
          </div>
        </motion.section>
      </div>
    </Layout>
  );
}
