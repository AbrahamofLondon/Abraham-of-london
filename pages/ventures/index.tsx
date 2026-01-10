// pages/ventures/index.tsx
import * as React from "react";
import type { NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Building2,
  PackageCheck,
  Lightbulb,
  Target,
  TrendingUp,
  Users,
  Globe,
  ExternalLink,
  ChevronRight,
  Award,
  BarChart,
  Zap,
  Shield,
  Briefcase,
  Rocket,
  Heart,
  Star,
  CheckCircle,
  Clock,
  MapPin,
  Users2,
  Target as TargetIcon,
  TrendingUp as TrendingUpIcon,
  Layers,
  Cpu,
  Building,
  Factory,
  Store,
  BookOpen,
  Sparkles
} from "lucide-react";
import { motion } from "framer-motion";

import Layout from "@/components/Layout";

type VentureStatus = "Active" | "Emerging" | "In Development" | "Incubating";

interface Venture {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  longDescription?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  url: string;
  status: VentureStatus;
  focus: string[];
  industry: string[];
  founded?: string;
  teamSize?: string;
  keyMetrics?: string[];
  featured?: boolean;
  color: string;
  logo?: string;
  highlights?: string[];
  investmentStage?: string;
}

// Status badge colors
const statusColors: Record<VentureStatus, { bg: string; text: string; border: string }> = {
  "Active": { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" },
  "Emerging": { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" },
  "In Development": { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" },
  "Incubating": { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/30" },
};

// Animation variants
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
    y: -8,
    transition: { duration: 0.3 }
  }
};

const VenturesPage: NextPage = () => {
  const ventures: Venture[] = [
    {
      name: "Alomarada Ltd",
      slug: "alomarada",
      tagline: "Board-level advisory for serious institutions",
      description: "Strategic advisory and operating systems for founders, boards, and institutions taking Africa seriously.",
      longDescription: "Alomarada provides board-level advisory, market-entry strategy, and operating system design for institutions building lasting legacies in Africa and beyond. We specialize in turning complex challenges into executable strategies with clear ownership and accountability.",
      icon: Building2,
      url: "https://alomarada.com",
      status: "Active",
      focus: ["Strategic Advisory", "Market Systems", "Deal Architecture", "Governance"],
      industry: ["Consulting", "Financial Services", "Technology", "Infrastructure"],
      founded: "2020",
      teamSize: "Core team + partners",
      keyMetrics: ["15+ board engagements", "3 market entries", "100% client retention"],
      featured: true,
      color: "from-blue-500 to-cyan-500",
      highlights: ["Partner-led engagements", "Africa-focused strategy", "Audit-ready governance"],
      investmentStage: "Bootstrapped"
    },
    {
      name: "Endureluxe",
      slug: "endureluxe",
      tagline: "Performance gear for builders",
      description: "Community-driven fitness and performance gear designed to survive real life, not just product shoots.",
      longDescription: "Endureluxe creates durable performance gear and fosters a community of builders, athletes, and leaders committed to physical and mental resilience. Our products are tested in real-world conditions and built to last.",
      icon: PackageCheck,
      url: "https://endureluxe.com",
      status: "Active",
      focus: ["Fitness Community", "Performance Gear", "Durability", "Lifestyle"],
      industry: ["Apparel", "Fitness", "E-commerce", "Community"],
      founded: "2022",
      teamSize: "Founder-led + community",
      keyMetrics: ["1000+ community members", "4 product lines", "5-star durability rating"],
      featured: true,
      color: "from-amber-500 to-orange-500",
      highlights: ["Community-first approach", "Real-world tested", "Lifetime warranty"],
      investmentStage: "Revenue-generating"
    },
    {
      name: "InnovateHub",
      slug: "innovatehub",
      tagline: "Innovation engine for founders",
      description: "Strategy, playbooks, and hands-on support to help founders test ideas and build durable products.",
      longDescription: "InnovateHub serves as an innovation engine providing founders with the strategy, playbooks, and hands-on support needed to validate ideas, ship products, and establish sustainable operating rhythms.",
      icon: Lightbulb,
      url: "https://innovatehub.abrahamoflondon.org",
      status: "In Development",
      focus: ["Innovation Strategy", "Capability Building", "Venture Design", "Product Development"],
      industry: ["Technology", "Startups", "Consulting", "Education"],
      founded: "2024",
      teamSize: "Founding team forming",
      keyMetrics: ["Launching Q2 2024", "3 pilot programs", "Founder community"],
      color: "from-purple-500 to-pink-500",
      highlights: ["Founder-focused programs", "Practical playbooks", "Hands-on support"],
      investmentStage: "Pre-launch"
    }
  ];

  const featuredVentures = ventures.filter(v => v.featured);
  const otherVentures = ventures.filter(v => !v.featured);

  return (
    <Layout 
      title="Strategic Ventures | Abraham of London" 
      description="The venture portfolio connected to Abraham of London - built around truth, responsibility, and multi-generational legacy."
      className="bg-black min-h-screen"
    >
      <Head>
        <title>Strategic Ventures | Abraham of London</title>
        <meta name="description" content="The venture portfolio connected to Abraham of London - built around truth, responsibility, and multi-generational legacy." />
        <meta property="og:title" content="Strategic Ventures | Abraham of London" />
        <meta property="og:description" content="Strategic ventures carrying the Abraham of London spine into boardrooms, gyms, communities, and build rooms across markets." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://abrahamoflondon.com/ventures" />
        <meta property="og:image" content="/assets/images/ventures-og.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="canonical" href="https://abrahamoflondon.com/ventures" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.12),transparent_55%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/60 to-black" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2">
                  <Rocket className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
                    Abraham of London · Ventures
                  </span>
                </div>

                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
                  Ventures that move in the{" "}
                  <span className="bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">
                    same direction
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl">
                  The writing, fatherhood work, and strategy conversations live at the centre. 
                  These ventures carry that same spine into boardrooms, gyms, communities, 
                  and build rooms across markets.
                </p>

                <div className="flex flex-wrap gap-3 mb-8">
                  {["Strategic Advisory", "Performance Gear", "Innovation Engine", "Community Building"].map((tag) => (
                    <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link
                    href="#ventures-grid"
                    className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-sm font-bold text-black hover:from-amber-400 hover:to-amber-500 transition-all"
                  >
                    <Briefcase className="h-5 w-5" />
                    Explore Ventures
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-sm font-bold text-white hover:bg-white/10 transition-all"
                  >
                    <Users2 className="h-5 w-5" />
                    Strategic Partnership
                  </Link>
                </div>
              </div>

              <div className="relative">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-6">
                    <Building className="h-8 w-8 text-blue-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Institutional Depth</h3>
                    <p className="text-sm text-gray-400">Board-level strategy and governance</p>
                  </div>
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
                    <Heart className="h-8 w-8 text-amber-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Community Focus</h3>
                    <p className="text-sm text-gray-400">Built with people, not just for them</p>
                  </div>
                  <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6">
                    <Zap className="h-8 w-8 text-purple-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Execution Bias</h3>
                    <p className="text-sm text-gray-400">Designed to ship and scale</p>
                  </div>
                  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
                    <Shield className="h-8 w-8 text-emerald-400 mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Legacy Mindset</h3>
                    <p className="text-sm text-gray-400">Built to outlast founders</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Portfolio Stats */}
        <section className="border-b border-white/10 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">{ventures.length}</div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">Total Ventures</div>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-6 text-center">
                <div className="text-3xl font-bold text-amber-200 mb-2">
                  {ventures.filter(v => v.status === "Active").length}
                </div>
                <div className="text-sm text-amber-300/80 uppercase tracking-wider">Active</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">
                  {ventures.reduce((sum, v) => sum + (v.focus?.length || 0), 0)}
                </div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">Focus Areas</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-6 text-center">
                <div className="text-3xl font-bold text-white mb-2">3+</div>
                <div className="text-sm text-gray-400 uppercase tracking-wider">Years Operating</div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured Ventures */}
        {featuredVentures.length > 0 && (
          <section className="py-16 border-b border-white/10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="mb-12 text-center">
                <div className="inline-flex items-center gap-2 mb-6">
                  <Award className="h-6 w-6 text-amber-400" />
                  <span className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
                    Featured Ventures
                  </span>
                </div>
                <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
                  Flagship Initiatives
                </h2>
                <p className="text-gray-400 max-w-2xl mx-auto">
                  These ventures represent the core expression of the Abraham of London ethos in action.
                </p>
              </div>

              <motion.div 
                className="grid md:grid-cols-2 gap-8"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {featuredVentures.map((venture) => {
                  const statusStyle = statusColors[venture.status];
                  
                  return (
                    <motion.div
                      key={venture.slug}
                      variants={itemVariants}
                      whileHover="hover"
                      className="group"
                    >
                      <Link
                        href={venture.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block h-full"
                      >
                        <div className="h-full rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/0 p-8 transition-all duration-300 group-hover:border-amber-500/30 group-hover:bg-white/10">
                          <div className="flex items-start justify-between mb-6">
                            <div className={`inline-flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${venture.color} bg-opacity-10`}>
                              <venture.icon className={`h-7 w-7 ${venture.color.includes('blue') ? 'text-blue-400' : venture.color.includes('amber') ? 'text-amber-400' : 'text-purple-400'}`} />
                            </div>
                            <span className={`rounded-full border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                              {venture.status}
                            </span>
                          </div>

                          <h3 className="text-2xl font-bold text-white mb-2">
                            {venture.name}
                          </h3>
                          <p className="text-lg text-amber-300 mb-4">
                            {venture.tagline}
                          </p>
                          
                          <p className="text-gray-300 mb-6">
                            {venture.description}
                          </p>

                          <div className="mb-6">
                            <div className="flex flex-wrap gap-2 mb-4">
                              {venture.focus.slice(0, 3).map((area) => (
                                <span key={area} className="rounded-full bg-white/5 px-3 py-1 text-xs text-gray-300">
                                  {area}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-white/10 pt-6">
                            <div className="text-sm text-gray-400">
                              <span className="font-medium text-white">
                                {venture.founded ? `Founded ${venture.founded}` : "Launching Soon"}
                              </span>
                              {venture.teamSize && (
                                <span className="mx-2">•</span>
                              )}
                              {venture.teamSize && (
                                <span>{venture.teamSize}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-amber-400">
                              <span className="text-sm font-medium">Visit Site</span>
                              <ExternalLink className="h-4 w-4" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            </div>
          </section>
        )}

        {/* All Ventures Grid */}
        <section id="ventures-grid" className="py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
                Complete Portfolio
              </h2>
              <p className="text-gray-400">
                All ventures under the Abraham of London umbrella, organized by stage and focus.
              </p>
            </div>

            <motion.div 
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {ventures.map((venture) => {
                const statusStyle = statusColors[venture.status];
                
                return (
                  <motion.div
                    key={venture.slug}
                    variants={itemVariants}
                    whileHover="hover"
                    className="group"
                  >
                    <Link
                      href={venture.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-full"
                    >
                      <div className="h-full rounded-2xl border border-white/10 bg-white/5 p-6 transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/10">
                        <div className="flex items-start justify-between mb-4">
                          <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${venture.color} bg-opacity-10`}>
                            <venture.icon className={`h-6 w-6 ${venture.color.includes('blue') ? 'text-blue-400' : venture.color.includes('amber') ? 'text-amber-400' : 'text-purple-400'}`} />
                          </div>
                          <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                            {venture.status}
                          </span>
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2">
                          {venture.name}
                        </h3>
                        
                        <p className="text-sm text-gray-300 mb-4 line-clamp-2">
                          {venture.description}
                        </p>

                        <div className="mb-4">
                          <div className="flex flex-wrap gap-1.5">
                            {venture.focus.slice(0, 2).map((area) => (
                              <span key={area} className="rounded-full bg-white/5 px-2 py-0.5 text-xs text-gray-400">
                                {area}
                              </span>
                            ))}
                            {venture.focus.length > 2 && (
                              <span className="text-xs text-gray-500">
                                +{venture.focus.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/10 pt-4">
                          <span className="text-xs text-gray-400">
                            {venture.url.replace(/^https?:\/\//, '')}
                          </span>
                          <ChevronRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        </section>

        {/* Investment Philosophy */}
        <section className="py-16 border-t border-white/10 bg-gradient-to-br from-black to-gray-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 mb-6">
                <TargetIcon className="h-6 w-6 text-amber-400" />
                <span className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
                  Investment Philosophy
                </span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
                How we choose what deserves a logo
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                Not every good idea becomes a venture. There is a quiet filter in the 
                background that every initiative has to pass before it earns the Abraham of London mark.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10">
                  <CheckCircle className="h-6 w-6 text-amber-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Clear Assignment</h3>
                <p className="text-gray-300">
                  The work must serve a real person with a real problem, not just a vanity 
                  metric or a trend. If it doesn&apos;t serve, it doesn&apos;t ship.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                  <TrendingUpIcon className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Substance Over Spin</h3>
                <p className="text-gray-300">
                  The numbers matter, but not on their own. The venture has to make sense 
                  when an investor, a father, and a pastor all ask hard questions.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                  <Users2 className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">Built With People</h3>
                <p className="text-gray-300">
                  Community, brotherhood, and accountability sit in the design, not as 
                  decoration. We don&apos;t build things that require men to lose themselves to succeed.
                </p>
              </div>
            </div>

            <div className="mt-12 rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-transparent p-8 text-center">
              <h3 className="text-xl font-semibold text-white mb-4">Explore Strategic Partnership</h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                If you&apos;re exploring aligned capital, strategic partnership, or ecosystem 
                collaboration around these ventures, let&apos;s start a strategic conversation.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-3 rounded-xl bg-amber-500 px-8 py-3 text-sm font-bold text-black hover:bg-amber-400 transition-colors"
                >
                  <Briefcase className="h-5 w-5" />
                  Start Conversation
                </Link>
                <Link
                  href="/canon"
                  className="inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-8 py-3 text-sm font-bold text-white hover:bg-white/10 transition-colors"
                >
                  <BookOpen className="h-5 w-5" />
                  Read The Philosophy
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default VenturesPage;