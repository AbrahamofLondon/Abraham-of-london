// pages/content/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, ChevronRight, BookOpen, Download, Calendar,
  FileText, Crown, Layers, BookMarked, Gem, Scroll,
  Feather, Briefcase, Palette, Trophy, Zap, Globe,
  Star, Award, Sparkles, Target, Lightbulb, Users, Clock,
  PenTool, Archive, Box, Printer, FileCode, CheckCircle,
  ArrowRight, Eye, TrendingUp, Shield, Heart, Target as TargetIcon,
  Grid, List, Sparkle
} from "lucide-react";

import Layout from "@/components/Layout";
import {
  getPublishedDocumentsByType,
  getCardPropsForDocument,
  type ContentlayerCardProps,
  type DocKind,
} from "@/lib/contentlayer-helper";

type ContentPageProps = {
  cards: ContentlayerCardProps[];
  typeCounts: Record<DocKind | "all", number>;
};

type OverrideMap = Record<string, string>;

// -----------------------------
// Marketing-Driven Type Configuration
// -----------------------------

type ContentTypeConfig = {
  label: string;
  icon: React.ReactNode;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  gradient: string;
  badgeStyle: string;
  tagline: string;
  valueProp: string;
  ctaText: string;
  visualPriority: number;
};

const TYPE_CONFIG: Record<DocKind, ContentTypeConfig> = {
  post: {
    label: "Insights",
    icon: <Lightbulb className="h-5 w-5" />,
    primaryColor: "bg-gradient-to-br from-amber-500 to-orange-500",
    secondaryColor: "bg-amber-50",
    accentColor: "text-amber-700",
    gradient: "from-amber-50 to-orange-50",
    badgeStyle: "bg-gradient-to-r from-amber-500 to-orange-500 text-white",
    tagline: "Strategic Perspectives",
    valueProp: "Actionable intelligence",
    ctaText: "Read Insight",
    visualPriority: 1
  },
  canon: {
    label: "Canon",
    icon: <Crown className="h-5 w-5" />,
    primaryColor: "bg-gradient-to-br from-gold to-yellow-600",
    secondaryColor: "bg-yellow-50",
    accentColor: "text-yellow-700",
    gradient: "from-yellow-50 to-amber-50",
    badgeStyle: "bg-gradient-to-r from-gold to-yellow-600 text-black",
    tagline: "Foundational Wisdom",
    valueProp: "Timeless principles",
    ctaText: "Study Canon",
    visualPriority: 1
  },
  resource: {
    label: "Resources",
    icon: <Briefcase className="h-5 w-5" />,
    primaryColor: "bg-gradient-to-br from-emerald-500 to-green-600",
    secondaryColor: "bg-emerald-50",
    accentColor: "text-emerald-700",
    gradient: "from-emerald-50 to-green-50",
    badgeStyle: "bg-gradient-to-r from-emerald-500 to-green-600 text-white",
    tagline: "Practical Tools",
    valueProp: "Ready-to-use assets",
    ctaText: "Get Resource",
    visualPriority: 2
  },
  download: {
    label: "Downloads",
    icon: <Download className="h-5 w-5" />,
    primaryColor: "bg-gradient-to-br from-blue-500 to-indigo-600",
    secondaryColor: "bg-blue-50",
    accentColor: "text-blue-700",
    gradient: "from-blue-50 to-indigo-50",
    badgeStyle: "bg-gradient-to-r from-blue-500 to-indigo-600 text-white",
    tagline: "Digital Assets",
    valueProp: "Instant access",
    ctaText: "Download Now",
    visualPriority: 2
  },
  print: {
    label: "Prints",
    icon: <Printer className="h-5 w-5" />,
    primaryColor: "bg-gradient-to-br from-rose-500 to-pink-600",
    secondaryColor: "bg-rose-50",
    accentColor: "text-rose-700",
    gradient: "from-rose-50 to-pink-50",
    badgeStyle: "bg-gradient-to-r from-rose-500 to-pink-600 text-white",
    tagline: "Premium Physical",
    valueProp: "Tangible quality",
    ctaText: "View Prints",
    visualPriority: 3
  },
  book: {
    label: "Books",
    icon: <BookMarked className="h-5 w-5" />,
    primaryColor: "bg-gradient-to-br from-purple-500 to-violet-600",
    secondaryColor: "bg-purple-50",
    accentColor: "text-purple-700",
    gradient: "from-purple-50 to-violet-50",
    badgeStyle: "bg-gradient-to-r from-purple-500 to-violet-600 text-white",
    tagline: "Complete Volumes",
    valueProp: "Definitive works",
    ctaText: "Explore Book",
    visualPriority: 1
  },
  event: {
    label: "Events",
    icon: <Calendar className="h-5 w-5" />,
    primaryColor: "bg-gradient-to-br from-cyan-500 to-teal-600",
    secondaryColor: "bg-cyan-50",
    accentColor: "text-cyan-700",
    gradient: "from-cyan-50 to-teal-50",
    badgeStyle: "bg-gradient-to-r from-cyan-500 to-teal-600 text-white",
    tagline: "Live Experiences",
    valueProp: "Exclusive access",
    ctaText: "Join Event",
    visualPriority: 3
  },
  short: {
    label: "Shorts",
    icon: <Zap className="h-5 w-5" />,
    primaryColor: "bg-gradient-to-br from-orange-500 to-red-500",
    secondaryColor: "bg-orange-50",
    accentColor: "text-orange-700",
    gradient: "from-orange-50 to-red-50",
    badgeStyle: "bg-gradient-to-r from-orange-500 to-red-500 text-white",
    tagline: "Quick Insights",
    valueProp: "Time-efficient value",
    ctaText: "Read Short",
    visualPriority: 2
  },
  strategy: {
    label: "Strategy",
    icon: <Target className="h-5 w-5" />,
    primaryColor: "bg-gradient-to-br from-teal-500 to-emerald-600",
    secondaryColor: "bg-teal-50",
    accentColor: "text-teal-700",
    gradient: "from-teal-50 to-emerald-50",
    badgeStyle: "bg-gradient-to-r from-teal-500 to-emerald-600 text-white",
    tagline: "Action Plans",
    valueProp: "Proven frameworks",
    ctaText: "Implement Strategy",
    visualPriority: 1
  }
};

// -----------------------------
// Cover Overrides - EXPANDED FOR PRINTS
// -----------------------------

const COVER_OVERRIDES: OverrideMap = {
  // Blog
  "christianity-not-extremism": "/assets/images/blog/christianity-not-extremism.jpg",
  "leadership-begins-at-home": "/assets/images/blog/leadership-begins-at-home.jpg",
  "ultimate-purpose-of-man": "/assets/images/blog/purpose-cover.jpg",
  "out-of-context-truth": "/assets/images/blog/out-of-context-truth.jpg",
  "principles-for-my-son": "/assets/images/blog/principles-for-my-son.jpg",
  "reclaiming-the-narrative": "/assets/images/blog/reclaiming-the-narrative.jpg",
  "the-brotherhood-code": "/assets/images/blog/the-brotherhood-code.jpg",
  "when-gods-sovereignty-collides-with-our-pain": "/assets/images/blog/sovereignty-truth-fathers.jpg",
  "when-the-foundation-is-destroyed": "/assets/images/blog/when-the-foundation-is-destroyed.jpg",
  "when-the-storm-finds-you": "/assets/images/blog/when-the-storm-finds-you.jpg",
  "when-the-system-breaks-you": "/assets/images/blog/when-the-system-breaks-you.jpg",
  "in-my-fathers-house": "/assets/images/blog/in-my-fathers-house.jpg",
  "lessons-from-noah": "/assets/images/blog/lessons-from-noah-hero.jpg",
  "kingdom-strategies-for-a-loving-legacy": "/assets/images/blog/kingdom-strategies-for-a-loving-legacy.jpg",

  // Books
  "fathering-without-fear": "/assets/images/books/fathering-without-fear.jpg",
  "the-fiction-adaptation": "/assets/images/books/the-fiction-adaptation.jpg",
  "the-architecture-of-human-purpose": "/assets/images/books/the-architecture-of-human-purpose.jpg",
  "the-builders-catechism": "/assets/images/canon/builders-catechism-cover.jpg",

  // Canon
  "builders-catechism": "/assets/images/canon/builders-catechism-cover.jpg",
  "canon-campaign": "/assets/images/canon/canon-campaign-cover.jpg",
  "canon-introduction-letter": "/assets/images/canon/canon-intro-letter-cover.jpg",
  "canon-intro-letter": "/assets/images/canon/canon-intro-letter-cover.jpg",
  "canon-resources": "/assets/images/canon/canon-resources.jpg",
  "volume-i-foundations-of-purpose": "/assets/images/canon/vol-i-foundations-for-purpose.jpg",
  "volume-ii-governance-and-formation": "/assets/images/canon/vol-ii-governance-and-formation.jpg",
  "volume-i-teaching-edition": "/assets/images/canon/vol-i-teaching-edition.jpg",
  "volume-ii-teaching-edition": "/assets/images/canon/vol-ii-teaching-edition.jpg",
  "volume-iii-teaching-edition": "/assets/images/canon/vol-iii-teaching-edition.jpg",
  "volume-iv-teaching-edition": "/assets/images/canon/vol-iv-teaching-edition.jpg",
  "volume-x-filename": "/assets/images/canon/volume-x-cover.jpg",
  "volume-x-the-arc-of-future-civilisation": "/assets/images/canon/volume-x-cover.jpg",

  // Resources
  "canon-council-table-agenda": "/assets/images/canon/canon-resources.jpg",
  "canon-household-charter": "/assets/images/canon/canon-resources.jpg",
  "canon-reading-plan-year-one": "/assets/images/canon/canon-resources.jpg",
  "destiny-mapping-worksheet": "/assets/images/canon/canon-resources.jpg",
  "institutional-health-scorecard": "/assets/images/canon/canon-resources.jpg",
  "multi-generational-legacy-ledger": "/assets/images/canon/canon-resources.jpg",
  "purpose-alignment-checklist": "/assets/images/canon/canon-resources.jpg",

  // PRINTS - ESSENTIAL: Add your actual print documents here
  "canon-prints": "/assets/images/prints/canon-prints.jpg",
  "limited-edition-prints": "/assets/images/prints/limited-edition.jpg",
  "foundational-documents": "/assets/images/prints/foundational-docs.jpg",
  "executive-prints": "/assets/images/prints/executive-prints.jpg",
  "legacy-prints": "/assets/images/prints/legacy-prints.jpg",

  // Events
  "founders-salon": "/assets/images/events/founders-salon.jpg",
  "leadership-workshop": "/assets/images/events/leadership-workshop.jpg",
};

function applyCoverOverrides(card: ContentlayerCardProps): ContentlayerCardProps {
  const slug = String(card.slug || "").toLowerCase();
  const override = COVER_OVERRIDES[slug];
  if (override) return { ...card, image: override };

  if (card.image === "/assets/images/canon-resources.jpg") {
    return { ...card, image: "/assets/images/canon/canon-resources.jpg" };
  }

  return card;
}

// -----------------------------
// Marketing-Optimized Page Component
// -----------------------------

const ContentIndexPage: NextPage<ContentPageProps> = ({ cards, typeCounts }) => {
  const [filter, setFilter] = React.useState<DocKind | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  const filtered = React.useMemo(() => {
    let result = cards;
    
    if (filter !== "all") {
      result = result.filter((c) => String(c.type || "").toLowerCase() === filter);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((c) =>
        c.title.toLowerCase().includes(query) ||
        (c.excerpt || "").toLowerCase().includes(query) ||
        (c.tags || []).some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return result;
  }, [cards, filter, searchQuery]);

  const kinds: DocKind[] = ["post", "canon", "resource", "download", "print", "book", "event", "short", "strategy"];
  const currentType = filter === "all" ? undefined : TYPE_CONFIG[filter];

  return (
    <Layout title="Content Library">
      <main className="min-h-screen bg-white">
        {/* Marketing Hero Section - CLEAR & CRISP */}
        <div className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50">
          <div className="absolute top-0 right-0 h-64 w-64 bg-gradient-to-bl from-blue-50/50 to-purple-50/50 rounded-full -translate-y-32 translate-x-32" />
          <div className="absolute bottom-0 left-0 h-64 w-64 bg-gradient-to-tr from-amber-50/50 to-orange-50/50 rounded-full translate-y-32 -translate-x-32" />
          
          <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              {/* Value Proposition Header */}
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 px-4 py-2 mb-6">
                <Sparkle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-700">
                  Curated Collection
                </span>
              </div>
              
              <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl lg:text-6xl mb-4">
                Discover Premium Content
              </h1>
              
              <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Access our complete library of insights, tools, and resources designed for exceptional results.
              </p>

              {/* Marketing Stats */}
              <div className="flex justify-center gap-8 mb-10">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{cards.length}</div>
                  <div className="text-sm text-gray-500">Total Resources</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{kinds.length}</div>
                  <div className="text-sm text-gray-500">Content Types</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">100%</div>
                  <div className="text-sm text-gray-500">Premium Quality</div>
                </div>
              </div>

              {/* Clean Search */}
              <div className="relative max-w-2xl mx-auto">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles, topics, or keywords..."
                  className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area - CRISP & ORGANIZED */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Marketing Filter Bar */}
          <div className="mb-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* View Toggle */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <Grid className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg ${viewMode === "list" ? "bg-blue-50 text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>

              {/* Clean Filter Buttons */}
              <div className="flex-1 overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                  <button
                    onClick={() => setFilter("all")}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      filter === "all" 
                        ? "bg-gray-900 text-white" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    All Content ({typeCounts.all})
                  </button>
                  
                  {kinds.map((kind) => {
                    const config = TYPE_CONFIG[kind];
                    const active = filter === kind;
                    
                    return (
                      <button
                        key={kind}
                        onClick={() => setFilter(kind)}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
                          active 
                            ? `${config.secondaryColor} ${config.accentColor} border-2 ${config.accentColor.replace('text-', 'border-')}` 
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {config.icon}
                        {config.label} ({typeCounts[kind]})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Results Counter */}
              <div className="text-sm text-gray-500">
                Showing <span className="font-semibold text-gray-900">{filtered.length}</span> of <span className="font-semibold text-gray-900">{cards.length}</span> items
              </div>
            </div>
          </div>

          {/* Active Category Banner - MARKETING FOCUS */}
          {currentType && (
            <div className={`mb-8 rounded-2xl ${currentType.secondaryColor} p-6`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${currentType.primaryColor} text-white`}>
                    {currentType.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">{currentType.label}</h2>
                    <p className="text-gray-600">{currentType.tagline} • {typeCounts[filter]} premium resources</p>
                  </div>
                </div>
                <button
                  onClick={() => setFilter("all")}
                  className="px-4 py-2 rounded-lg bg-white text-gray-700 font-medium hover:bg-gray-50"
                >
                  View All Types
                </button>
              </div>
            </div>
          )}

          {/* MARKETING-OPTIMIZED CONTENT CARDS */}
          <AnimatePresence mode="wait">
            {filtered.length > 0 ? (
              viewMode === "grid" ? (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
                >
                  {filtered.map((card) => {
                    const config = TYPE_CONFIG[card.type as DocKind];
                    const hasDownload = card.downloadUrl;
                    const isPopular = card.tags?.includes("popular") || card.tags?.includes("featured");
                    
                    return (
                      <motion.div
                        key={`${card.type}:${card.slug}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        whileHover={{ y: -4 }}
                        className="group"
                      >
                        <Link
                          href={card.href}
                          className="block bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
                        >
                          {/* Card Header with Marketing Badges */}
                          <div className="relative h-48 overflow-hidden">
                            <Image
                              src={card.image || "/assets/images/writing-desk.webp"}
                              alt={card.title}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="(min-width: 1280px) 384px, (min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw"
                            />
                            
                            {/* Marketing Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                            
                            {/* Top Badges */}
                            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                              <span className={`${config.badgeStyle} px-3 py-1 rounded-full text-xs font-semibold`}>
                                {config.label}
                              </span>
                              
                              {isPopular && (
                                <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  Popular
                                </span>
                              )}
                            </div>
                            
                            {/* Download Indicator */}
                            {hasDownload && (
                              <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
                                <Download className="h-4 w-4 text-blue-600" />
                              </div>
                            )}
                          </div>

                          {/* Card Content - MARKETING FOCUS */}
                          <div className="p-6">
                            {/* Title with Clear Hierarchy */}
                            <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {card.title}
                            </h3>
                            
                            {/* Excerpt with Value Focus */}
                            {card.excerpt && (
                              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                {card.excerpt}
                              </p>
                            )}
                            
                            {/* Benefit Tags */}
                            {(card.tags && card.tags.length > 0) && (
                              <div className="flex flex-wrap gap-2 mb-4">
                                {card.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md font-medium"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}
                            
                            {/* Action Footer */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className="text-sm text-gray-500">
                                  {card.date ? new Date(card.date).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  }) : 'Recently added'}
                                </span>
                              </div>
                              
                              <button className="flex items-center gap-2 text-blue-600 font-semibold text-sm group/btn">
                                {config.ctaText}
                                <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                              </button>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                // LIST VIEW - For power users
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {filtered.map((card) => {
                    const config = TYPE_CONFIG[card.type as DocKind];
                    
                    return (
                      <motion.div
                        key={`${card.type}:${card.slug}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        whileHover={{ x: 4 }}
                      >
                        <Link
                          href={card.href}
                          className="block bg-white rounded-xl shadow hover:shadow-md transition-all duration-300 border border-gray-100 p-6"
                        >
                          <div className="flex items-start gap-6">
                            {/* Type Indicator */}
                            <div className={`p-3 rounded-lg ${config.secondaryColor}`}>
                              <div className={`p-2 rounded ${config.primaryColor} text-white`}>
                                {config.icon}
                              </div>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                                    {card.title}
                                  </h3>
                                  <div className="flex items-center gap-3 mb-2">
                                    <span className={`text-xs font-semibold ${config.accentColor}`}>
                                      {config.label}
                                    </span>
                                    <span className="text-xs text-gray-500">•</span>
                                    <span className="text-sm text-gray-500">
                                      {config.valueProp}
                                    </span>
                                  </div>
                                </div>
                                
                                {card.downloadUrl && (
                                  <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-medium">
                                    <Download className="h-4 w-4" />
                                    Download
                                  </div>
                                )}
                              </div>
                              
                              {card.excerpt && (
                                <p className="text-gray-600 mb-3">
                                  {card.excerpt}
                                </p>
                              )}
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                  {(card.tags && card.tags.length > 0) && (
                                    <div className="flex gap-2">
                                      {card.tags.slice(0, 2).map((tag) => (
                                        <span
                                          key={tag}
                                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  
                                  {card.date && (
                                    <span className="text-sm text-gray-500">
                                      {new Date(card.date).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </span>
                                  )}
                                </div>
                                
                                <button className="text-blue-600 font-medium text-sm flex items-center gap-2">
                                  View Details
                                  <ChevronRight className="h-4 w-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )
            ) : (
              // MARKETING EMPTY STATE
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16 px-4"
              >
                <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-50 mb-6">
                  <Search className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No results found
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  Try adjusting your search or filters to find what you're looking for.
                </p>
                {(searchQuery || filter !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFilter("all");
                    }}
                    className="px-6 py-3 bg-gray-900 text-white font-medium rounded-lg hover:bg-gray-800"
                  >
                    Reset all filters
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* PRINT-SPECIFIC MESSAGE - If prints are empty */}
          {filter === "print" && typeCounts.print === 0 && (
            <div className="mt-12 text-center bg-gradient-to-r from-rose-50 to-pink-50 rounded-2xl p-8">
              <div className="inline-flex p-4 rounded-2xl bg-white shadow-lg mb-4">
                <Printer className="h-12 w-12 text-rose-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Prints Collection Coming Soon
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Our premium print collection is being prepared. Check back soon for exclusive physical materials.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setFilter("download")}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-medium rounded-lg hover:shadow-lg"
                >
                  Browse Digital Downloads
                </button>
                <button
                  onClick={() => setFilter("all")}
                  className="px-6 py-3 bg-white text-gray-700 font-medium rounded-lg border hover:bg-gray-50"
                >
                  View All Content
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
};

// -----------------------------
// Data Fetching - FIXED PRINTS HANDLING
// -----------------------------

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  const buckets = getPublishedDocumentsByType();

  console.log('DEBUG - Available documents by type:', Object.keys(buckets).map(k => ({
    type: k,
    count: buckets[k as DocKind]?.length || 0
  })));

  // ALL TYPES INCLUDED
  const orderedKinds: DocKind[] = [
    "post",
    "canon",
    "resource",
    "download",
    "print", // PRINTS ARE INCLUDED
    "book",
    "event",
    "short",
    "strategy",
  ];

  const cards = orderedKinds
    .flatMap((k) => {
      const docs = buckets[k] || [];
      console.log(`Processing ${k}: ${docs.length} documents`);
      return docs;
    })
    .map((doc) => getCardPropsForDocument(doc))
    .map((c) => ({
      ...c,
      type: String(c.type || "").toLowerCase() as DocKind,
    }))
    .map(applyCoverOverrides);

  // Calculate type counts for stats
  const typeCounts: Record<DocKind | "all", number> = { all: cards.length };
  orderedKinds.forEach(kind => {
    typeCounts[kind] = cards.filter(c => c.type === kind).length;
  });

  console.log('DEBUG - Final type counts:', typeCounts);

  return {
    props: { 
      cards,
      typeCounts 
    },
    revalidate: 60,
  };
};

export default ContentIndexPage;