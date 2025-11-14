// pages/about.tsx
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";

// Reuse your existing variants
const containerVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
      when: "beforeChildren",
      staggerChildren: 0.15,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

interface Achievement {
  title: string;
  description: string;
  year: number;
  href: string;
}

const AboutPage: NextPage = () => {
  const achievements: Achievement[] = [
    {
      title: "Founded Fathering Without Fear Movement",
      description: "Launched a global initiative helping thousands of men embrace intentional fatherhood and legacy building",
      year: 2023,
      href: "/brands/fathering-without-fear"
    },
    {
      title: "Published Entrepreneur Operating System",
      description: "Developed comprehensive strategic frameworks used by 500+ founders and business leaders",
      year: 2023,
      href: "/downloads/entrepreneur-operating-pack"
    },
    {
      title: "Established Brotherhood Covenant Network",
      description: "Built accountability structures fostering authentic brotherhood among Christian men and leaders",
      year: 2022,
      href: "/downloads/brotherhood-covenant"
    },
    {
      title: "Created Family Altar Liturgy",
      description: "Developed practical tools for integrating faith into daily family rhythms, used by hundreds of households",
      year: 2022,
      href: "/downloads/family-altar-liturgy"
    },
    {
      title: "Launched Strategic Leadership Playbook",
      description: "Authored comprehensive leadership frameworks for executives and organizational leaders",
      year: 2021,
      href: "/downloads/leadership-playbook"
    }
  ];

  return (
    <Layout title="About">
      <Head>
        <title>About | Abraham of London</title>
        <meta 
          name="description" 
          content="Learn about Abraham of London's mission to equip men with faith-rooted strategy, fatherhood tools, and legacy-building frameworks." 
        />
        <meta property="og:title" content="About Abraham of London" />
        <meta 
          property="og:description" 
          content="Equipping serious men and builders with faith-rooted strategy, fatherhood tools, and legacy frameworks." 
        />
        <meta property="og:url" content="https://www.abrahamoflondon.org/about" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://www.abrahamoflondon.org/about" />
      </Head>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-black to-deepCharcoal text-white py-20">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            <motion.h1 
              variants={itemVariants}
              className="font-serif text-4xl md:text-5xl lg:text-6xl font-semibold mb-6"
            >
              Building Fathers, 
              <span className="block text-softGold">Founders & Faithful Leaders</span>
            </motion.h1>
            <motion.p 
              variants={itemVariants}
              className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
            >
              Equipping serious men with faith-rooted strategy, tools, and frameworks for 
              intentional fatherhood, disciplined leadership, and lasting legacy.
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* Bio & Portrait Section */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-6 text-deepCharcoal dark:text-white">
                Our Purpose
              </h2>
              <div className="space-y-4 text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>
                  Abraham of London exists to equip serious men and builders with faith-rooted 
                  strategy, tools, and frameworks for intentional fatherhood, disciplined leadership, 
                  and lasting legacy.
                </p>
                <p>
                  In a world that often encourages drift and compromise, we provide language, 
                  structure, and practical resources to help you build with clarity, courage, 
                  and conviction.
                </p>
                <p>
                  Every strategy, tool, and framework is built on conservative Christian conviction. 
                  We believe true leadership starts with submission to divine wisdom.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src="/assets/images/abraham-portrait.jpg"
                  alt="Abraham of London - Founder and Strategic Leader"
                  width={600}
                  height={800}
                  className="w-full h-auto"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-softGold text-deepCharcoal px-6 py-3 rounded-lg shadow-lg">
                <p className="font-semibold">Abraham of London</p>
                <p className="text-sm opacity-90">Founder & Strategic Leader</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Key Achievements */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800">
        <div className="max-w-6xl mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2 className="font-serif text-3xl md:text-4xl font-semibold mb-4 text-deepCharcoal dark:text-white">
              Key Milestones
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
              Building tools and communities that empower men to lead with conviction
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement, index) => (
              <motion.div
                key={achievement.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="bg-white dark:bg-slate-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="text-softGold text-sm font-semibold mb-2">
                  {achievement.year}
                </div>
                <h3 className="font-serif text-xl font-semibold mb-3 text-deepCharcoal dark:text-white">
                  {achievement.title}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-4">
                  {achievement.description}
                </p>
                <Link
                  href={achievement.href}
                  className="inline-flex items-center text-forest text-sm font-semibold hover:text-forest/80 transition-colors"
                >
                  Learn more →
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission & Values */}
      <section className="py-16 bg-white dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-serif text-3xl md:text-4xl font-semibold text-center mb-12 text-deepCharcoal dark:text-white"
          >
            Our Mission & Values
          </motion.h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 shadow-lg"
              >
                <h3 className="text-xl font-semibold mb-3 text-forest">Faith-Rooted Foundation</h3>
                <p className="text-slate-700 dark:text-slate-300">
                  Every strategy, tool, and framework is built on conservative Christian conviction. 
                  We believe true leadership starts with submission to divine wisdom.
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 shadow-lg"
              >
                <h3 className="text-xl font-semibold mb-3 text-forest">Practical Utility</h3>
                <p className="text-slate-700 dark:text-slate-300">
                  No theoretical fluff. Every resource is battle-tested and designed for immediate 
                  application in business, family, and community leadership.
                </p>
              </motion.div>
            </div>
            
            <div className="space-y-6">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 shadow-lg"
              >
                <h3 className="text-xl font-semibold mb-3 text-softGold">Legacy Focus</h3>
                <p className="text-slate-700 dark:text-slate-300">
                  We equip men to build beyond their lifetime—focusing on multi-generational impact 
                  rather than temporary success.
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-6 shadow-lg"
              >
                <h3 className="text-xl font-semibold mb-3 text-softGold">Brotherhood Commitment</h3>
                <p className="text-slate-700 dark:text-slate-300">
                  We believe no man should build alone. Our work fosters authentic community and 
                  accountability among like-minded builders.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-forest to-softGold py-16 text-center">
        <div className="max-w-2xl mx-auto px-4">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-serif font-semibold mb-6 text-white"
          >
            Ready to Build With Purpose?
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/90 mb-8"
          >
            Join hundreds of men already using these tools to lead with conviction and build lasting legacy.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-wrap justify-center gap-4"
          >
            <Link
              href="/downloads"
              className="inline-flex items-center px-8 py-4 bg-white text-deepCharcoal font-semibold rounded-lg hover:bg-slate-100 transition-colors shadow-lg focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-forest"
            >
              Explore Resources
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center px-8 py-4 border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-deepCharcoal transition-colors focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-forest"
            >
              Start a Conversation
            </Link>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default AboutPage;