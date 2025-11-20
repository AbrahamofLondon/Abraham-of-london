// pages/index.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  BookOpen,
  Building2,
  PackageCheck,
  Lightbulb,
  ArrowRight,
  ChevronRight,
  Star,
  Shield,
  Target,
  Crown,
  Users,
  Calendar,
  Download,
  Sparkles,
} from "lucide-react";
import Layout from "@/components/Layout";
import { HeroBanner } from "@/components/InteractiveElements";
import NewsletterForm from "@/components/NewsletterForm";
import { pickEnvUrl, ENV_KEYS } from "@/lib/utils";

const siteTitle = "Abraham of London";
const siteTagline = "Faith-rooted strategy for fathers, founders, and board-level leaders who refuse to outsource responsibility.";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://abrahamoflondon.org";

// ============================================================================
// PREMIUM CONTENT DATA
// ============================================================================

const featuredPosts = [
  {
    slug: "when-the-storm-finds-you",
    title: "When the Storm Finds You",
    excerpt: "Life's deepest storms don't wait for your consent. What you build before the rain determines if you'll still be standing after it passes.",
    tag: "Resilience",
    readTime: "8 min",
    image: "/assets/images/storm-finds-you-preview.jpg",
    featured: true,
  },
  {
    slug: "lessons-from-noah",
    title: "Lessons from Noah – Fathers Who Listen, Hear, and Build",
    excerpt: "Noah was a listener, a builder, and a father. Patterns for today's man who still believes in covenant and consequence.",
    tag: "Fatherhood",
    readTime: "12 min",
    image: "/assets/images/noah-lessons-preview.jpg",
    featured: true,
  },
  {
    slug: "the-brotherhood-code",
    title: "The Brotherhood Code",
    excerpt: "How to build circles of accountability that withstand pressure and produce legacy.",
    tag: "Brotherhood",
    readTime: "6 min",
    image: "/assets/images/brotherhood-code-preview.jpg",
  },
];

const featuredBooks = [
  {
    slug: "fathering-without-fear",
    title: "Fathering Without Fear",
    subtitle: "The Story They Thought They Knew",
    status: "In Development",
    blurb: "A real memoir before it becomes an ecosystem – a father navigating injustice, identity, legacy, and the system that hoped he'd disappear quietly.",
    coverImage: "/assets/images/book-fathering-without-fear.jpg",
    progress: 65,
  },
];

const featuredEvents = [
  {
    slug: "leadership-workshop",
    title: "Strategic Leadership Workshop",
    dateLabel: "12 Sep 2026 · London",
    location: "London, UK",
    blurb: "A masterclass on strategy for founders and leaders who want clarity, not clichés.",
    status: "Limited Spots",
    image: "/assets/images/event-leadership-workshop.jpg",
  },
  {
    slug: "fathers-and-futures",
    title: "Fathers & Futures Panel",
    dateLabel: "11 Nov 2026 · Online",
    location: "Online",
    blurb: "A live virtual conversation exploring fatherhood, system shocks, and building legacy in a culture fighting against both.",
    status: "Free Access",
    image: "/assets/images/event-fathers-futures.jpg",
  },
];

const featuredDownloads = [
  {
    slug: "entrepreneur-survival-checklist",
    title: "Entrepreneur Survival Checklist",
    tag: "Execution",
    blurb: "Stay grounded and effective when everything goes wrong at once. Principles over panic.",
    icon: Shield,
    format: "PDF",
    pages: 12,
  },
  {
    slug: "brotherhood-covenant",
    title: "Brotherhood Covenant",
    tag: "Brotherhood",
    blurb: "Turn a casual men's meetup into a circle of accountability that fights for each other's future.",
    icon: Users,
    format: "Template",
    pages: 8,
  },
  {
    slug: "principles-for-my-son",
    title: "Principles for My Son",
    tag: "Fatherhood",
    blurb: "A working set of principles for raising a boy who becomes a man of conviction in a confused age.",
    icon: Crown,
    format: "Guide",
    pages: 16,
  },
];

const corePillars = [
  {
    title: "Strategic Fatherhood",
    description: "Building legacy through intentional presence, not just provision.",
    icon: Crown,
    color: "from-amber-500 to-orange-500",
    stats: "15+ Frameworks",
  },
  {
    title: "Founder Discipline",
    description: "Board-level thinking for builders who refuse to fail quietly.",
    icon: Target,
    color: "from-blue-500 to-cyan-500",
    stats: "12+ Years Experience",
  },
  {
    title: "Faith-Rooted Leadership",
    description: "Strategy anchored in conviction, not convenience.",
    icon: Shield,
    color: "from-emerald-500 to-green-500",
    stats: "1000+ Leaders Served",
  },
];

// Venture URLs
const alomaradaUrl = pickEnvUrl([ENV_KEYS.ALOMARADA_URL], "https://alomarada.com/");
const endureluxeUrl = pickEnvUrl([ENV_KEYS.ENDURELUXE_URL], "https://alomarada.com/endureluxe");
const innovateHubUrl = pickEnvUrl([ENV_KEYS.INNOVATEHUB_URL, ENV_KEYS.INNOVATEHUB_ALT_URL], "https://alomarada.com/hub");

const ventures = [
  {
    name: "Alomarada Ltd",
    slug: "alomarada",
    description: "Board-level advisory, operating systems, and market-entry strategy for Africa-focused founders, boards, and institutions.",
    icon: Building2,
    href: alomaradaUrl,
    status: "Active",
    focus: "Strategic Advisory & Market Systems",
    externalLabel: "Visit Alomarada.com",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    name: "Endureluxe",
    slug: "endureluxe",
    description: "Durable luxury performance gear for people who build, train, and endure – without compromising on quality or aesthetics.",
    icon: PackageCheck,
    href: endureluxeUrl,
    status: "In Development",
    focus: "Performance & Durable Luxury",
    externalLabel: "Explore Endureluxe",
    gradient: "from-orange-500 to-red-500",
  },
  {
    name: "Innovative Hub",
    slug: "innovative-hub",
    description: "A practical innovation lab – content, cohorts, and tools for builders who want to test ideas, ship value, and stay accountable.",
    icon: Lightbulb,
    href: innovateHubUrl,
    status: "Emerging",
    focus: "Innovation & Capability Building",
    externalLabel: "Enter the Hub",
    gradient: "from-blue-500 to-cyan-500",
  },
];

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 60 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }
  }
};

const staggerChildren = {
  visible: {
    transition: {
      staggerChildren: 0.2
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" }
  }
};

// Custom hook for scroll-based animations
function useScrollAnimation(threshold = 0.1) {
  const { scrollYProgress } = useScroll({
    threshold: [0, threshold],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [0.8, 1]);

  return { opacity, scale };
}

const HomePage: React.FC = () => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteTitle,
    url: siteUrl,
    description: siteTagline,
    founder: {
      "@type": "Person",
      name: "Abraham of London",
    },
    knowsAbout: [
      "Christian leadership",
      "Strategic planning",
      "Fatherhood",
      "Legacy building",
      "Business strategy",
      "Faith-based entrepreneurship",
    ],
  };

  const handleHeroCTAClick = () => {
    // Smooth scroll to downloads section
    const downloadsSection = document.getElementById('featured-downloads');
    downloadsSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <Layout title={siteTitle} transparentHeader={true}>
      <Head>
        <title>{siteTitle} | Faithful Strategy for Builders, Founders & Fathers</title>
        <meta name="description" content={siteTagline} />
        <meta property="og:image" content="/assets/images/og-homepage.jpg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      {/* PREMIUM HERO SECTION */}
      <div className="relative min-h-screen bg-gradient-to-br from-black via-deepCharcoal to-forest/20 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-softGold/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-forest/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        <HeroBanner
          title={
            <span>
              Strategy for{" "}
              <span className="bg-gradient-to-r from-softGold to-amber-200 bg-clip-text text-transparent">
                kings, fathers & builders
              </span>
            </span>
          }
          subtitle="A premium hub for board-level thinking, founder discipline, and unapologetic fatherhood – for men who still believe in duty, consequence, and legacy."
          backgroundImage="/assets/images/abraham-of-london-banner-premium.jpg"
          overlayOpacity={0.4}
          height="100vh"
          ctaText="Explore Strategic Resources"
          ctaOnClick={handleHeroCTAClick}
          textAlign="center"
          eyebrow={
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="h-4 w-4 text-softGold" />
              Abraham of London
              <Sparkles className="h-4 w-4 text-softGold" />
            </span>
          }
          additionalCTAs={[
            {
              text: "View Latest Writing",
              href: "/content",
              variant: "outline" as const,
            }
          ]}
        />

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 border-2 border-softGold/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-softGold/70 rounded-full mt-2"></div>
          </div>
        </motion.div>
      </div>

      {/* CORE PILLARS SECTION */}
      <section className="relative py-24 bg-gradient-to-b from-deepCharcoal to-black">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-softGold/5 via-transparent to-transparent"></div>
        
        <div className="relative mx-auto max-w-7xl px-4">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
          >
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-6">
              Three Pillars of{" "}
              <span className="bg-gradient-to-r from-softGold to-amber-200 bg-clip-text text-transparent">
                Legacy Leadership
              </span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Integrated frameworks for men building across family, enterprise, and faith
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {corePillars.map((pillar, index) => (
              <motion.div
                key={pillar.title}
                variants={fadeInUp}
                className="group relative"
              >
                <div className="relative bg-gradient-to-br from-white/5 to-white/10 rounded-3xl p-8 backdrop-blur-sm border border-white/10 hover:border-softGold/30 transition-all duration-500 hover:transform hover:-translate-y-2">
                  {/* Gradient orb */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${pillar.color} rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                  
                  <div className="relative z-10">
                    <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${pillar.color} rounded-2xl mb-6`}>
                      <pillar.icon className="h-8 w-8 text-white" />
                    </div>
                    
                    <h3 className="font-serif text-2xl font-bold text-white mb-4">
                      {pillar.title}
                    </h3>
                    
                    <p className="text-gray-300 mb-6 leading-relaxed">
                      {pillar.description}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-softGold">
                        {pillar.stats}
                      </span>
                      <div className="w-8 h-8 bg-softGold/10 rounded-full flex items-center justify-center group-hover:bg-softGold/20 transition-colors">
                        <ArrowRight className="h-4 w-4 text-softGold" />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* FEATURED WRITING SECTION */}
      <section className="py-24 bg-gradient-to-b from-black to-deepCharcoal">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div
            className="flex items-end justify-between mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
                Latest <span className="text-softGold">Writing</span>
              </h2>
              <p className="text-xl text-gray-300 max-w-2xl">
                Strategic insights on fatherhood, leadership, and building lasting legacy
              </p>
            </div>
            <Link
              href="/content"
              className="hidden md:flex items-center gap-2 px-6 py-3 bg-softGold/10 hover:bg-softGold/20 border border-softGold/30 rounded-full text-softGold font-semibold transition-all hover:gap-3 group"
            >
              View All Articles
              <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          <motion.div
            className="grid lg:grid-cols-2 gap-8 mb-12"
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {featuredPosts.slice(0, 2).map((post) => (
              <motion.article
                key={post.slug}
                variants={fadeInUp}
                className="group relative bg-gradient-to-br from-white/5 to-white/10 rounded-3xl overflow-hidden backdrop-blur-sm border border-white/10 hover:border-softGold/30 transition-all duration-500 hover:transform hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10"></div>
                <div className="relative h-80 overflow-hidden">
                  <Image
                    src={post.image}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  {post.featured && (
                    <div className="absolute top-4 left-4 z-20">
                      <span className="flex items-center gap-1 bg-softGold/90 text-black px-3 py-1 rounded-full text-xs font-bold">
                        <Star className="h-3 w-3" />
                        Featured
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="relative z-20 p-8">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="bg-softGold/10 text-softGold px-3 py-1 rounded-full text-xs font-semibold">
                      {post.tag}
                    </span>
                    <span className="text-gray-400 text-sm">{post.readTime}</span>
                  </div>
                  
                  <h3 className="font-serif text-2xl font-bold text-white mb-4 group-hover:text-softGold transition-colors">
                    {post.title}
                  </h3>
                  
                  <p className="text-gray-300 mb-6 line-clamp-2">
                    {post.excerpt}
                  </p>
                  
                  <Link
                    href={`/${post.slug}`}
                    className="inline-flex items-center gap-2 text-softGold font-semibold group/link"
                  >
                    Read Article
                    <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.article>
            ))}
          </motion.div>

          {/* Additional posts grid */}
          <motion.div
            className="grid md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            {featuredPosts.slice(2).map((post) => (
              <motion.article
                key={post.slug}
                variants={scaleIn}
                className="group bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/10 hover:border-softGold/30 transition-all duration-300 hover:transform hover:-translate-y-1"
              >
                <div className="flex items-center gap-3 mb-4">
                  <span className="bg-softGold/10 text-softGold px-2 py-1 rounded-full text-xs font-semibold">
                    {post.tag}
                  </span>
                  <span className="text-gray-400 text-xs">{post.readTime}</span>
                </div>
                
                <h4 className="font-serif text-lg font-bold text-white mb-3 group-hover:text-softGold transition-colors">
                  {post.title}
                </h4>
                
                <p className="text-gray-300 text-sm mb-4 line-clamp-2">
                  {post.excerpt}
                </p>
                
                <Link
                  href={`/${post.slug}`}
                  className="inline-flex items-center gap-1 text-softGold text-sm font-semibold group/link"
                >
                  Read More
                  <ArrowRight className="h-3 w-3 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </motion.article>
            ))}
          </motion.div>

          {/* Mobile CTA */}
          <div className="mt-12 md:hidden text-center">
            <Link
              href="/content"
              className="inline-flex items-center gap-2 px-6 py-3 bg-softGold/10 hover:bg-softGold/20 border border-softGold/30 rounded-full text-softGold font-semibold transition-all"
            >
              View All Articles
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED DOWNLOADS SECTION */}
      <section id="featured-downloads" className="py-24 bg-gradient-to-b from-deepCharcoal to-black">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
              Strategic <span className="text-softGold">Downloads</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Battle-tested frameworks, checklists, and tools for immediate application
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {featuredDownloads.map((download) => (
              <motion.div
                key={download.slug}
                variants={fadeInUp}
                className="group relative"
              >
                <div className="relative bg-gradient-to-br from-white/5 to-white/10 rounded-3xl p-8 backdrop-blur-sm border border-white/10 hover:border-softGold/30 transition-all duration-500 hover:transform hover:-translate-y-2 h-full flex flex-col">
                  {/* Icon with gradient */}
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-softGold to-amber-200 rounded-2xl mb-6">
                    <download.icon className="h-7 w-7 text-black" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <span className="bg-softGold/10 text-softGold px-3 py-1 rounded-full text-xs font-semibold">
                        {download.tag}
                      </span>
                      <span className="text-gray-400 text-xs">{download.format} • {download.pages} pages</span>
                    </div>
                    
                    <h3 className="font-serif text-xl font-bold text-white mb-4 group-hover:text-softGold transition-colors">
                      {download.title}
                    </h3>
                    
                    <p className="text-gray-300 mb-6 flex-1">
                      {download.blurb}
                    </p>
                  </div>
                  
                  <Link
                    href={`/downloads/${download.slug}`}
                    className="inline-flex items-center justify-center gap-2 w-full bg-softGold/10 hover:bg-softGold/20 border border-softGold/30 text-softGold font-semibold py-3 px-6 rounded-xl transition-all group/btn"
                  >
                    <Download className="h-4 w-4" />
                    Download Resource
                    <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>

          <motion.div
            className="text-center mt-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <Link
              href="/downloads"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-softGold to-amber-200 text-black font-bold rounded-full hover:shadow-lg hover:shadow-softGold/25 transition-all group"
            >
              Explore All Resources
              <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* BOOKS & EVENTS SECTION */}
      <section className="py-24 bg-gradient-to-b from-black to-deepCharcoal">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Books */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="flex items-center gap-3 mb-8">
                <BookOpen className="h-8 w-8 text-softGold" />
                <h2 className="font-serif text-3xl font-bold text-white">Books & Manuscripts</h2>
              </div>

              {featuredBooks.map((book) => (
                <motion.article
                  key={book.slug}
                  variants={scaleIn}
                  className="group bg-gradient-to-br from-white/5 to-white/10 rounded-3xl p-8 backdrop-blur-sm border border-white/10 hover:border-softGold/30 transition-all duration-500 hover:transform hover:-translate-y-1"
                >
                  <div className="flex gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-24 h-32 bg-gradient-to-br from-softGold/20 to-softGold/10 rounded-xl border border-softGold/30 flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-softGold" />
                      </div>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-serif text-xl font-bold text-white group-hover:text-softGold transition-colors">
                          {book.title}
                        </h3>
                        <span className="bg-amber-100/10 text-amber-200 px-3 py-1 rounded-full text-xs font-semibold">
                          {book.status}
                        </span>
                      </div>
                      
                      <p className="text-gray-300 text-sm mb-4">
                        {book.subtitle}
                      </p>
                      
                      <p className="text-gray-300 mb-6">
                        {book.blurb}
                      </p>
                      
                      {/* Progress bar */}
                      <div className="mb-6">
                        <div className="flex justify-between text-xs text-gray-400 mb-2">
                          <span>Writing Progress</span>
                          <span>{book.progress}%</span>
                        </div>
                        <div className="w-full bg-white/10 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-softGold to-amber-200 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${book.progress}%` }}
                          ></div>
                        </div>
                      </div>
                      
                      <Link
                        href={`/books/${book.slug}`}
                        className="inline-flex items-center gap-2 text-softGold font-semibold group/link"
                      >
                        View Book Details
                        <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </motion.div>

            {/* Events */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <div className="flex items-center gap-3 mb-8">
                <Calendar className="h-8 w-8 text-softGold" />
                <h2 className="font-serif text-3xl font-bold text-white">Events & Gatherings</h2>
              </div>

              <div className="space-y-6">
                {featuredEvents.map((event) => (
                  <motion.article
                    key={event.slug}
                    variants={scaleIn}
                    className="group bg-gradient-to-br from-white/5 to-white/10 rounded-2xl p-6 backdrop-blur-sm border border-white/10 hover:border-softGold/30 transition-all duration-300 hover:transform hover:-translate-y-1"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-serif text-lg font-bold text-white group-hover:text-softGold transition-colors mb-2">
                          {event.title}
                        </h3>
                        <p className="text-sm text-gray-300">{event.dateLabel}</p>
                      </div>
                      <span className="bg-green-100/10 text-green-300 px-3 py-1 rounded-full text-xs font-semibold">
                        {event.status}
                      </span>
                    </div>
                    
                    <p className="text-gray-300 text-sm mb-4">
                      {event.blurb}
                    </p>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        📍 {event.location}
                      </span>
                      <Link
                        href={`/events/${event.slug}`}
                        className="inline-flex items-center gap-1 text-softGold text-sm font-semibold group/link"
                      >
                        Event Details
                        <ArrowRight className="h-3 w-3 group-hover/link:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </motion.article>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STRATEGIC VENTURES SECTION */}
      <section className="py-24 bg-gradient-to-b from-deepCharcoal to-black">
        <div className="mx-auto max-w-7xl px-4">
          <motion.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">
              Strategic <span className="text-softGold">Ventures</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Disciplined, faith-rooted initiatives built to create lasting impact, not just headlines. Every venture is a conviction in action.
            </p>
          </motion.div>

          <motion.div
            className="grid md:grid-cols-3 gap-8"
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
          >
            {ventures.map((venture) => (
              <motion.div
                key={venture.slug}
                variants={fadeInUp}
                className="group relative"
              >
                <div className="relative bg-gradient-to-br from-white/5 to-white/10 rounded-3xl p-8 backdrop-blur-sm border border-white/10 hover:border-softGold/30 transition-all duration-500 hover:transform hover:-translate-y-2 h-full flex flex-col">
                  {/* Gradient background effect */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${venture.gradient} opacity-0 group-hover:opacity-5 rounded-3xl transition-opacity duration-500`}></div>
                  
                  <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                      <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${venture.gradient} rounded-2xl`}>
                        <venture.icon className="h-7 w-7 text-white" />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        venture.status === "Active" ? "bg-green-100 text-green-800" :
                        venture.status === "Emerging" ? "bg-blue-100 text-blue-800" :
                        "bg-amber-100 text-amber-800"
                      }`}>
                        {venture.status}
                      </span>
                    </div>

                    <h3 className="font-serif text-xl font-bold text-white mb-4 group-hover:text-softGold transition-colors">
                      {venture.name}
                    </h3>
                    
                    <p className="text-gray-300 mb-6 flex-1">
                      {venture.description}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <span className="text-sm font-semibold text-softGold">
                        {venture.focus}
                      </span>
                      <a
                        href={venture.href}
                        className="group/link inline-flex items-center text-sm font-semibold text-softGold hover:text-softGold/80"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {venture.externalLabel}
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover/link:translate-x-1" />
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* PREMIUM NEWSLETTER SECTION */}
      <section className="py-24 bg-gradient-to-b from-black to-deepCharcoal">
        <div className="mx-auto max-w-4xl px-4">
          <motion.div
            className="relative rounded-3xl overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            {/* Background with gradient and pattern */}
            <div className="absolute inset-0 bg-gradient-to-br from-softGold/10 via-deepCharcoal to-forest/20"></div>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-softGold/5 via-transparent to-transparent"></div>
            
            {/* Border gradient */}
            <div className="absolute inset-0 rounded-3xl p-px bg-gradient-to-r from-softGold/30 via-forest/30 to-softGold/30"></div>
            
            <div className="relative backdrop-blur-sm bg-white/5 rounded-3xl p-12 text-center">
              <motion.div
                variants={scaleIn}
                className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-softGold to-amber-200 rounded-2xl mb-8 mx-auto"
              >
                <BookOpen className="h-10 w-10 text-black" />
              </motion.div>
              
              <motion.h2
                variants={fadeInUp}
                className="font-serif text-3xl md:text-4xl font-bold text-white mb-4"
              >
                Join the <span className="text-softGold">Inner Circle</span>
              </motion.h2>
              
              <motion.p
                variants={fadeInUp}
                className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
              >
                Get exclusive access to new frameworks, private event invitations, and strategic insights before they're published publicly.
              </motion.p>

              <motion.div
                variants={fadeInUp}
                className="max-w-md mx-auto"
              >
                <NewsletterForm 
                  variant="premium"
                  placeholder="Enter your email address..."
                  buttonText="Join Inner Circle"
                />
              </motion.div>
              
              <motion.p
                variants={fadeInUp}
                className="text-sm text-gray-400 mt-6"
              >
                No spam. Unsubscribe anytime. Premium content only.
              </motion.p>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
};

export default HomePage;