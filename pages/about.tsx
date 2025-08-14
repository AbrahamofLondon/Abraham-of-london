// pages/about.tsx
import React from "react";
import Head from "next/head";
import Image from "next/image";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import Link from "next/link";
import ScrollProgress from "../components/ScrollProgress";

// Animation variants
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

export default function AboutPage() {
  const siteUrl = "https://abraham-of-london.netlify.app";

  return (
    <Layout>
      <Head>
        <title>About | Abraham of London</title>
        <meta
          name="description"
          content="Learn about AbrahamofLondon, a founder and strategic advisor from London, focusing on innovation, community, and legacy."
        />
        <meta property="og:title" content="About | Abraham of London" />
        <meta
          property="og:description"
          content="Abraham is a founder and strategic advisor from London."
        />
        <meta
          property="og:image"
          content={`${siteUrl}/assets/images/social/og-image.jpg`}
        />
        <meta property="og:url" content={`${siteUrl}/about`} />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <motion.div
        className="bg-gray-50 py-20 px-4"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-4xl mx-auto text-center">
          <motion.h1
            className="text-5xl md:text-6xl font-extrabold mb-4 text-gray-900"
            variants={itemVariants}
          >
            About Abraham
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto"
            variants={itemVariants}
          >
            I&apos;m a founder and strategic advisor from London with a passion
            for building, empowering, and leaving a lasting legacy.
          </motion.p>
        </div>
      </motion.div>

      <div className="max-w-4xl mx-auto py-20 px-4">
        <motion.section
          className="bg-white p-8 md:p-12 rounded-2xl flex flex-col md:flex-row items-center mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
        >
          <div className="relative w-full md:w-1/2 h-64 md:h-96 rounded-xl overflow-hidden mb-8 md:mb-0 md:mr-12">
            <Image
              src="/assets/images/profile-portrait.webp"
              alt="Abraham Adaramola Profile"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 500px"
              priority
            />
          </div>
          <div className="md:w-1/2">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">
              A Storyteller, Strategist, and Student of Life
            </h2>
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
              I am Abraham of LondonÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âa storyteller, strategist, and student of
              lifeÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢s deep currents. My journey has been shaped by a
              relentless pursuit of truth, legacy, and personal mastery. Through
              every venture, book, or conversation, I am crafting not just
              businesses, but enduring narratives that challenge, inspire, and
              provoke thoughtful action.
            </p>
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
              My work stands at the intersection of philosophy, creative
              expression, and human development. Whether through writing, brand
              building, or advisory, I see every project as a canvas ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â a
              medium to explore what it means to live meaningfully, lead
              courageously, and leave behind a legacy of substance.
            </p>
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
              IÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢m less interested in transient trends and more invested in
              timeless truths. Family, faith, character, and creativity are the
              compass points that steer my endeavours. Every blog post, strategy
              session, or artistic project is my way of translating these
              convictions into tangible impact.
            </p>
            <p className="text-lg text-gray-700 mb-4 leading-relaxed">
              This is not just a brand; itÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢s an unfolding life project. As
              seasons change, so do the mediums I employ ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â from thought
              leadership to immersive storytelling, from business ventures to
              deeply personal writings like{" "}
              <Link
                href="/books/fathering-without-fear"
                className="text-blue-600 hover:underline"
              >
                Fathering Without Fear
              </Link>
              . ItÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢s all connected, because I am the connection.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Welcome to my world ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â where ideas are sharpened, values are
              lived, and every expression is an invitation to grow, reflect, and
              build a life of consequence.
            </p>
          </div>
        </motion.section>

        <motion.section
          className="text-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold mb-4 text-gray-800">
            A Journey of Growth and Purpose
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            Explore some of the key areas of my work and experience, including
            my public speaking and writings.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-2">Corporate Strategy</h3>
              <p className="text-gray-700">
                Decades of experience in leading growth, partnerships, and
                transformation in public and private sectors.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-2">Writing & Speaking</h3>
              <p className="text-gray-700">
                Sharing insights on leadership, business, and legacy through
                various publications and public engagements.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="text-xl font-bold mb-2">
                Infrastructure & Digital
              </h3>
              <p className="text-gray-700">
                ongoing specialisation in digital and cloud-based business
                strategies to build sustainable infrastructure.
              </p>
            </div>
          </div>
        </motion.section>
      </div>
    </Layout>
  );
}





