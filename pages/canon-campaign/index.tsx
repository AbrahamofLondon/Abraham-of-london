// pages/canon-campaign/index.tsx
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowRight, 
  BookOpen, 
  Calendar, 
  Crown,
  Sparkles,
  Users,
  Target,
  Clock,
  Shield,
  TrendingUp,
  CheckCircle,
  Zap,
  BarChart3,
  Award,
  ChevronRight,
  Heart,
  Star,
  Map,
  Layers,
  Bookmark,
  Download
} from "lucide-react";
import { motion } from "framer-motion";

import Layout from "@/components/Layout";

const CanonCampaignPage: NextPage = () => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.com";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    },
    hover: {
      y: -5,
      transition: { duration: 0.3 }
    }
  };

  const phases = [
    {
      title: "Foundation",
      description: "Core volumes establishing first principles",
      status: "Complete",
      icon: <Shield className="h-6 w-6" />,
      color: "from-blue-500/20 to-cyan-500/10",
      items: ["The Architecture of Human Purpose", "Foundations of Fatherhood", "Governance Principles"]
    },
    {
      title: "Expansion",
      description: "Practical frameworks and implementation guides",
      status: "In Progress",
      icon: <Layers className="h-6 w-6" />,
      color: "from-amber-500/20 to-orange-500/10",
      items: ["Family Covenant Framework", "Legacy Roadmap", "Strategic Decision Systems"]
    },
    {
      title: "Community",
      description: "Live workshops and cohort-based learning",
      status: "Planning",
      icon: <Users className="h-6 w-6" />,
      color: "from-emerald-500/20 to-green-500/10",
      items: ["Fatherhood Cohorts", "Leadership Workshops", "Strategy Salons"]
    }
  ];

  const upcomingReleases = [
    {
      title: "Fatherhood: The Unbroken Chain",
      description: "A comprehensive guide to intentional, multi-generational fatherhood",
      release: "Q3 2024",
      status: "In Draft",
      icon: <Heart className="h-5 w-5" />
    },
    {
      title: "Strategic Decision Making for Leaders",
      description: "Framework for high-stakes decision making under pressure",
      release: "Q4 2024",
      status: "In Research",
      icon: <Target className="h-5 w-5" />
    },
    {
      title: "The Legacy Builder's Playbook",
      description: "Practical tools for creating institutions that outlive their founders",
      release: "Q1 2025",
      status: "Planned",
      icon: <TrendingUp className="h-5 w-5" />
    }
  ];

  return (
    <Layout
      title="Canon Campaign | Abraham of London"
      description="A long-term project to build a Canon of applied wisdom for fathers, founders, and leaders. Join the journey of building lasting legacy through intentional work."
      className="bg-black min-h-screen"
    >
      <Head>
        <title>Canon Campaign | Abraham of London</title>
        <meta
          name="description"
          content="A long-term project to build a Canon of applied wisdom for fathers, founders, and leaders. Join the journey of building lasting legacy through intentional work."
        />
        <link rel="canonical" href={`${siteUrl}/canon-campaign`} />
        <meta property="og:title" content="Canon Campaign | Abraham of London" />
        <meta property="og:description" content="A long-term project to build a Canon of applied wisdom for fathers, founders, and leaders." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`${siteUrl}/canon-campaign`} />
        <meta property="og:image" content="/assets/images/canon-campaign-og.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0">
            <div className="absolute inset-x-0 -top-28 h-56 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_62%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/85" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(212,175,55,0.08),transparent_55%)]" />
          </div>

          <motion.div 
            className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2">
                <Crown className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-amber-400">
                  Canon · Long-Horizon Build
                </span>
              </div>

              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white max-w-4xl">
                The Canon Campaign
              </h1>

              <p className="max-w-3xl text-lg leading-relaxed text-gray-300">
                The Canon is a long-horizon build - not &quot;content&quot;, not dopamine, not noise. 
                It&apos;s an architecture of applied wisdom for men who carry responsibility over 
                time: fathers, founders, leaders.
              </p>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-amber-500/30 transition-colors">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-blue-500/10 p-2">
                      <BookOpen className="h-5 w-5 text-blue-400" />
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-300">
                      Volumes
                    </p>
                  </div>
                  <p className="text-sm text-gray-400">
                    Long-form arguments. Properly built. No shortcuts.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-amber-500/30 transition-colors">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-emerald-500/10 p-2">
                      <Calendar className="h-5 w-5 text-emerald-400" />
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-300">
                      Rooms
                    </p>
                  </div>
                  <p className="text-sm text-gray-400">
                    Workshops, salons, and private sessions for builders.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-amber-500/30 transition-colors">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-xl bg-purple-500/10 p-2">
                      <Crown className="h-5 w-5 text-purple-400" />
                    </div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gray-300">
                      Tools
                    </p>
                  </div>
                  <p className="text-sm text-gray-400">
                    Frameworks and assets designed for deployment.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Campaign Phases */}
        <section className="py-16 border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="text-center mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 mb-6">
                <Map className="h-6 w-6 text-amber-400" />
                <span className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
                  Campaign Roadmap
                </span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
                Building in Phases
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                The Canon is being built methodically, with each phase establishing 
                a foundation for the next. No shortcuts, just deliberate progress.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {phases.map((phase, index) => (
                <motion.div
                  key={phase.title}
                  className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-8"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${phase.color}`}>
                    <div className="text-white">
                      {phase.icon}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-white">{phase.title}</h3>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                      phase.status === "Complete" ? "bg-emerald-500/10 text-emerald-400" :
                      phase.status === "In Progress" ? "bg-amber-500/10 text-amber-400" :
                      "bg-blue-500/10 text-blue-400"
                    }`}>
                      {phase.status}
                    </span>
                  </div>
                  
                  <p className="text-gray-300 mb-6">{phase.description}</p>
                  
                  <div className="space-y-2">
                    {phase.items.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-sm text-gray-400">
                        <CheckCircle className="h-4 w-4 text-emerald-500/70" />
                        {item}
                      </div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Current Access Points */}
        <section className="py-16 border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="inline-flex items-center gap-2 mb-6">
                    <Sparkles className="h-6 w-6 text-amber-400" />
                    <span className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
                      Current Access Points
                    </span>
                  </div>
                  <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-6">
                    Where the Canon lives right now
                  </h2>

                  <p className="mb-8 text-lg leading-relaxed text-gray-300">
                    At this stage, the Canon is visible through a few public doors.
                    Everything else is being drafted, tested, and catalogued - slowly,
                    properly, without compromise.
                  </p>

                  <div className="space-y-4">
                    <Link
                      href="/books/the-architecture-of-human-purpose"
                      className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-amber-500/40 hover:bg-white/8 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-amber-500/10 p-3">
                          <BookOpen className="h-6 w-6 text-amber-400" />
                        </div>
                        <div>
                          <h3 className="font-serif text-xl font-semibold text-white group-hover:text-amber-400 transition-colors">
                            The Architecture of Human Purpose
                          </h3>
                          <p className="text-sm text-gray-400 mt-1">Volume Zero · Prelude Edition</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-amber-300" />
                    </Link>

                    <Link
                      href="/canon"
                      className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-amber-500/40 hover:bg-white/8 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-blue-500/10 p-3">
                          <BookOpen className="h-6 w-6 text-blue-400" />
                        </div>
                        <div>
                          <h3 className="font-serif text-xl font-semibold text-white group-hover:text-blue-400 transition-colors">
                            Canon Library
                          </h3>
                          <p className="text-sm text-gray-400 mt-1">Complete collection of volumes</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-blue-300" />
                    </Link>

                    <Link
                      href="/events"
                      className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-amber-500/40 hover:bg-white/8 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="rounded-xl bg-emerald-500/10 p-3">
                          <Calendar className="h-6 w-6 text-emerald-400" />
                        </div>
                        <div>
                          <h3 className="font-serif text-xl font-semibold text-white group-hover:text-emerald-400 transition-colors">
                            Live Rooms & Workshops
                          </h3>
                          <p className="text-sm text-gray-400 mt-1">Interactive sessions and cohorts</p>
                        </div>
                      </div>
                      <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-emerald-300" />
                    </Link>
                  </div>

                  <p className="mt-8 text-gray-400">
                    As the Canon expands, this page will track campaigns, releases, and
                    engagement paths - including fatherhood tracks and leadership cohorts.
                  </p>
                </motion.div>
              </div>

              {/* Sidebar */}
              <motion.aside 
                className="space-y-6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                {/* Inner Circle CTA */}
                <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-8">
                  <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
                    <Crown className="h-6 w-6 text-amber-400" />
                  </div>
                  <h3 className="font-serif text-2xl font-semibold text-white mb-3">
                    Inner Circle Access
                  </h3>
                  <p className="text-sm leading-relaxed text-gray-300 mb-6">
                    Some material won&apos;t be public. Not because it&apos;s &quot;exclusive&quot; -
                    because serious work needs a serious room.
                  </p>

                  <div className="space-y-3">
                    <Link
                      href="/inner-circle"
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 text-sm font-bold text-black hover:from-amber-400 hover:to-amber-500 transition-all w-full"
                    >
                      Join Inner Circle
                      <ArrowRight className="h-4 w-4" />
                    </Link>

                    <Link
                      href="/content"
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white hover:bg-white/10 transition-all w-full"
                    >
                      Browse the Vault
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                {/* Upcoming Releases */}
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <Zap className="h-5 w-5 text-amber-400" />
                    <h3 className="font-serif text-xl font-semibold text-white">Upcoming Releases</h3>
                  </div>
                  
                  <div className="space-y-4">
                    {upcomingReleases.map((release) => (
                      <div key={release.title} className="border-b border-white/10 pb-4 last:border-0 last:pb-0">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-white/5 p-2">
                            {release.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-white text-sm">{release.title}</h4>
                            <p className="text-xs text-gray-400 mt-1">{release.description}</p>
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-amber-400">{release.release}</span>
                              <span className="text-xs text-gray-500">{release.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.aside>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-transparent p-12 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                <Award className="h-8 w-8 text-amber-400" />
              </div>
              <h2 className="font-serif text-3xl font-bold text-white mb-4">
                Join the Build
              </h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto text-lg">
                The Canon is being written for and with builders. Share your insights, 
                test frameworks, and help shape the work that will outlast us all.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-sm font-bold text-black hover:from-amber-400 hover:to-amber-500 transition-all"
                >
                  <Users className="h-5 w-5" />
                  Share Your Insights
                </Link>
                <Link
                  href="/canon"
                  className="inline-flex items-center gap-3 rounded-xl border border-amber-400/40 bg-white/5 px-8 py-4 text-sm font-bold text-amber-100 hover:border-amber-400/60 hover:bg-white/10 transition-all"
                >
                  <BookOpen className="h-5 w-5" />
                  Start Reading
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default CanonCampaignPage;