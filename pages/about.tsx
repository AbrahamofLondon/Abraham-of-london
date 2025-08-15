// pages/about.tsx
import React, { useMemo } from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import ScrollProgress from "@/components/ScrollProgress";
import { siteConfig } from "@/lib/siteConfig";

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

// ---------- Animations ----------
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1 },
};

export default function AboutPage() {
  const sameAs = useMemo(
    () =>
      (siteConfig.socialLinks || [])
        .filter((l) => l.external && /^https?:\/\//i.test(l.href))
        .map((l) => l.href),
    []
  );

  const structuredData = useMemo(() => {
    const person = {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: siteConfig.author,
      url: SITE_URL,
      image: abs("/assets/images/profile-portrait.webp"),
      sameAs,
      jobTitle: "Founder & Strategic Advisor",
      description:
        "Founder and strategic advisor from London focused on innovation, community, and legacy.",
    };

    const breadcrumb = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: "About",
          item: `${SITE_URL}/about`,
        },
      ],
    };

    return [person, breadcrumb];
  }, [sameAs]);

  return (
    <Layout>
      <Head>
        <title>About | {siteConfig.title}</title>
        <meta
          name="description"
          content="Learn about Abraham of London — a founder and strategic advisor focused on innovation, community, and legacy."
        />
        <meta name="author" content={siteConfig.author} />
        <meta property="og:title" content={`About | ${siteConfig.title}`} />
        <meta
          property="og:description"
          content="Abraham is a founder and strategic advisor from London."
        />
        <meta property="og:image" content={abs(siteConfig.ogImage || "/assets/images/social/og-image.jpg")} />
        <meta property="og:url" content={`${SITE_URL}/about`} />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href={`${SITE_URL}/about`} />
        {structuredData.map((schema, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
          />
        ))}
      </Head>

      <ScrollProgress />

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
            I’m a founder and strategic advisor from London with a passion for
            building, empowering, and leaving a lasting legacy.
          </motion.p>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto py-20 px-4">
        <motion.section
          className="bg-white p-8 md:p-12 rounded-2xl flex flex-col md:flex-row items-center mb-16 shadow-xl"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative w-full md:w-1/2 h-64 md:h-96 rounded-xl overflow-hidden mb-8 md:mb-0 md:mr-12">
            <Image
              src="/assets/images/profile-portrait.webp"
              alt="Portrait of Abraham Adaramola"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 500px"
              priority
            />
          </div>

          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">
              Storyteller, Strategist, Student of Life
            </h2>
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
              My journey has been shaped by a relentless pursuit of truth,
              legacy, and personal mastery. Through every venture, book, or
              conversation, I aim to craft not just businesses but enduring
              narratives that challenge, inspire, and provoke thoughtful action.
            </p>
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
              My work sits at the intersection of philosophy, creative
              expression, and human development. Whether through writing, brand
              building, or advisory, every project becomes a canvas to explore
              what it means to live meaningfully, lead courageously, and leave a
              legacy of substance.
            </p>
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
              I’m less interested in transient trends and more invested in
              timeless truths. Family, faith, character, and creativity are the
              compass points that guide my efforts. Every blog post, strategy
              session, or artistic project is a translation of those convictions
              into tangible impact.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              This isn’t just a brand — it’s an unfolding life project. From
              thought leadership to immersive storytelling, from business
              ventures to deeply personal writings like{" "}
              <Link
                href="/books/fathering-without-fear"
                className="text-forest underline decoration-forest/40 hover:decoration-forest"
              >
                Fathering Without Fear
              </Link>
              , it’s all connected — because I am the connection.
            </p>
          </div>
        </motion.section>

        <motion.section
          className="text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-4 text-gray-900">
            A Journey of Growth and Purpose
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            Explore some of the key areas of my work and experience, including
            public speaking and writing.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-2">Corporate Strategy</h3>
              <p className="text-gray-700">
                Growth, partnerships, and transformation across public and
                private sectors.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-2">Writing & Speaking</h3>
              <p className="text-gray-700">
                Insights on leadership, business, and legacy through articles
                and public engagements.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-2">
                Infrastructure & Digital
              </h3>
              <p className="text-gray-700">
                Specialising in cloud and digital strategies for resilient,
                sustainable infrastructure.
              </p>
            </div>
          </div>

          <div className="mt-12">
            <Link
              href="/contact"
              className="inline-block bg-forest text-cream font-semibold px-8 py-3 rounded-full shadow-lg hover:bg-forest/90"
            >
              Let’s Connect
            </Link>
          </div>
        </motion.section>
      </div>
    </Layout>
  );
}
