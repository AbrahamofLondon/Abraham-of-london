// pages/content/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Filter, ChevronRight, BookOpen, Download, Calendar,
  FileText, Crown, Layers, BookMarked, Gem, Scroll,
  Feather, Briefcase, Palette, Trophy, Zap, Globe, Lock,
  Star, Award, Sparkles, Castle, Compass, Shield, Target,
  Lightbulb, Coffee, Users, Clock, MapPin, Gift,
  PenTool, Archive, Box, FileBox, Printer, FileCode
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
};

type OverrideMap = Record<string, string>;

// -----------------------------
// Premium Type Configuration System - NO STATUS WORDS
// -----------------------------

type ContentTypeConfig = {
  label: string;
  icon: React.ReactNode;
  primaryColor: string;
  borderColor: string;
  gradientFrom: string;
  gradientTo: string;
  casing: "uppercase" | "titlecase" | "smallcaps";
  texture: React.ReactNode;
  frameStyle: string;
  indicatorElement: React.ReactNode;
};

const TYPE_CONFIG: Record<DocKind, ContentTypeConfig> = {
  post: {
    label: "Essays",
    icon: <PenTool className="h-4 w-4" />,
    primaryColor: "text-amber-300",
    borderColor: "border-amber-500/20",
    gradientFrom: "from-amber-900/20",
    gradientTo: "to-amber-800/5",
    casing: "titlecase",
    texture: (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,191,36,0.03)_0%,transparent_50%)]" />
    ),
    frameStyle: "before:absolute before:inset-0 before:border before:border-amber-500/10 before:rounded-3xl before:pointer-events-none",
    indicatorElement: (
      <div className="absolute -top-2 -right-2 h-16 w-16 bg-gradient-to-br from-amber-600/10 to-amber-400/5 rounded-full blur-xl" />
    )
  },
  canon: {
    label: "Canon",
    icon: <Crown className="h-4 w-4" />,
    primaryColor: "text-gold",
    borderColor: "border-gold/30",
    gradientFrom: "from-gold/15",
    gradientTo: "to-yellow-900/5",
    casing: "uppercase",
    texture: (
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.08)_0%,transparent_60%)]" />
    ),
    frameStyle: "before:absolute before:inset-0 before:border-2 before:border-gold/10 before:rounded-3xl before:pointer-events-none before:bg-gradient-to-br before:from-gold/5 before:via-transparent before:to-transparent",
    indicatorElement: (
      <>
        <div className="absolute top-1/4 left-1/4 h-20 w-20 bg-gradient-to-br from-gold/8 to-transparent rounded-full blur-2xl" />
        <div className="absolute bottom-1/4 right-1/4 h-16 w-16 bg-gradient-to-tl from-gold/6 to-transparent rounded-full blur-xl" />
      </>
    )
  },
  resource: {
    label: "Resources",
    icon: <Briefcase className="h-4 w-4" />,
    primaryColor: "text-emerald-300",
    borderColor: "border-emerald-500/20",
    gradientFrom: "from-emerald-900/20",
    gradientTo: "to-emerald-800/5",
    casing: "titlecase",
    texture: (
      <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_95%,rgba(16,185,129,0.02)_100%)]" />
    ),
    frameStyle: "before:absolute before:inset-0 before:border before:border-emerald-500/10 before:rounded-3xl before:pointer-events-none before:border-dashed",
    indicatorElement: (
      <div className="absolute -bottom-3 -left-3 h-24 w-24 bg-gradient-to-tr from-emerald-700/8 to-emerald-600/4 blur-2xl" />
    )
  },
  download: {
    label: "Downloads",
    icon: <Download className="h-4 w-4" />,
    primaryColor: "text-cyan-300",
    borderColor: "border-cyan-500/20",
    gradientFrom: "from-cyan-900/20",
    gradientTo: "to-blue-800/5",
    casing: "titlecase",
    texture: (
      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_70%,rgba(6,182,212,0.02)_100%)]" />
    ),
    frameStyle: "before:absolute before:inset-0 before:border before:border-cyan-500/10 before:rounded-3xl before:pointer-events-none before:border-double before:border-t-0 before:border-r-0",
    indicatorElement: (
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-32 w-32 bg-gradient-to-r from-cyan-600/6 to-blue-600/4 rounded-full blur-3xl" />
    )
  },
  print: {
    label: "Prints",
    icon: <Printer className="h-4 w-4" />,
    primaryColor: "text-rose-300",
    borderColor: "border-rose-500/20",
    gradientFrom: "from-rose-900/20",
    gradientTo: "to-pink-800/5",
    casing: "titlecase",
    texture: (
      <div className="absolute inset-0 bg-[linear-gradient(30deg,transparent_80%,rgba(244,63,94,0.02)_100%)]" />
    ),
    frameStyle: "before:absolute before:inset-0 before:border before:border-rose-500/10 before:rounded-3xl before:pointer-events-none before:border-t before:border-b before:border-r-0 before:border-l-0",
    indicatorElement: (
      <div className="absolute -right-4 top-4 h-28 w-28 bg-gradient-to-bl from-rose-600/8 to-pink-600/4 rounded-full blur-2xl" />
    )
  },
  book: {
    label: "Books",
    icon: <BookMarked className="h-4 w-4" />,
    primaryColor: "text-violet-300",
    borderColor: "border-violet-500/20",
    gradientFrom: "from-violet-900/20",
    gradientTo: "to-purple-800/5",
    casing: "titlecase",
    texture: (
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(139,92,246,0.03)_0%,transparent_60%)]" />
    ),
    frameStyle: "before:absolute before:inset-0 before:border before:border-violet-500/10 before:rounded-3xl before:pointer-events-none before:shadow-inner before:shadow-violet-500/5",
    indicatorElement: (
      <div className="absolute top-0 left-4 h-24 w-24 bg-gradient-to-br from-violet-700/10 to-purple-600/5 blur-2xl" />
    )
  },
  event: {
    label: "Events",
    icon: <Calendar className="h-4 w-4" />,
    primaryColor: "text-blue-300",
    borderColor: "border-blue-500/20",
    gradientFrom: "from-blue-900/20",
    gradientTo: "to-indigo-800/5",
    casing: "titlecase",
    texture: (
      <div className="absolute inset-0 bg-[linear-gradient(15deg,transparent_85%,rgba(59,130,246,0.02)_100%)]" />
    ),
    frameStyle: "before:absolute before:inset-0 before:border before:border-blue-500/10 before:rounded-3xl before:pointer-events-none before:border-dotted",
    indicatorElement: (
      <div className="absolute bottom-4 right-4 h-20 w-20 bg-gradient-to-tr from-blue-600/10 to-indigo-600/5 rounded-full blur-xl" />
    )
  },
  short: {
    label: "Shorts",
    icon: <Zap className="h-4 w-4" />,
    primaryColor: "text-orange-300",
    borderColor: "border-orange-500/20",
    gradientFrom: "from-orange-900/20",
    gradientTo: "to-amber-800/5",
    casing: "titlecase",
    texture: (
      <div className="absolute inset-0 bg-[linear-gradient(-15deg,transparent_75%,rgba(249,115,22,0.02)_100%)]" />
    ),
    frameStyle: "before:absolute before:inset-0 before:border before:border-orange-500/10 before:rounded-3xl before:pointer-events-none before:border-b-2 before:border-t-0",
    indicatorElement: (
      <div className="absolute -top-2 -left-2 h-20 w-20 bg-gradient-to-br from-orange-600/12 to-amber-500/6 rounded-full blur-xl" />
    )
  },
  strategy: {
    label: "Strategy",
    icon: <Target className="h-4 w-4" />,
    primaryColor: "text-teal-300",
    borderColor: "border-teal-500/20",
    gradientFrom: "from-teal-900/20",
    gradientTo: "to-emerald-800/5",
    casing: "titlecase",
    texture: (
      <div className="absolute inset-0 bg-[linear-gradient(60deg,transparent_90%,rgba(20,184,166,0.02)_100%)]" />
    ),
    frameStyle: "before:absolute before:inset-0 before:border before:border-teal-500/10 before:rounded-3xl before:pointer-events-none before:border-2 before:border-t-0 before:border-b-2",
    indicatorElement: (
      <div className="absolute top-1/2 left-0 h-28 w-28 bg-gradient-to-r from-teal-600/8 to-emerald-600/4 blur-2xl" />
    )
  }
};

// -----------------------------
// Cover Overrides - INCLUDING PRINTS
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

  // Prints (CRITICAL - Ensure prints have covers)
  "sample-print-1": "/assets/images/prints/print-sample-1.jpg",
  "sample-print-2": "/assets/images/prints/print-sample-2.jpg",
  "sample-print-3": "/assets/images/prints/print-sample-3.jpg",
  "canon-prints-collection": "/assets/images/prints/canon-prints.jpg",
  "exclusive-prints": "/assets/images/prints/exclusive-prints.jpg",

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
// Page Component - EXQUISITE DESIGN FOCUS
// -----------------------------

const ContentIndexPage: NextPage<ContentPageProps> = ({ cards }) => {
  const [filter, setFilter] = React.useState<DocKind | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");

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
  
  // Count items per type
  const typeCounts = React.useMemo(() => {
    const counts: Record<DocKind | "all", number> = { all: cards.length };
    kinds.forEach(kind => {
      counts[kind] = cards.filter(c => String(c.type || "").toLowerCase() === kind).length;
    });
    return counts;
  }, [cards]);

  const currentType = filter === "all" ? undefined : TYPE_CONFIG[filter];

  return (
    <Layout title="The Archive">
      <main className="min-h-screen bg-black">
        {/* Exquisite Hero Section */}
        <div className="relative overflow-hidden">
          {/* Background Architecture */}
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/10 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.03)_0%,transparent_70%)]" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          {currentType && currentType.indicatorElement}
          
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              {/* Exquisite Collection Indicator */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.02] px-4 py-2 backdrop-blur-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-white/5 to-transparent">
                  <Archive className="h-3 w-3 text-white/70" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-medium uppercase tracking-[0.3em] text-gold/80">
                    Curated Collection
                  </span>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <span className="text-xs text-gray-400">
                    {cards.length} pieces
                  </span>
                </div>
              </div>

              {/* Title Architecture */}
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-3">
                  {currentType && (
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${currentType.gradientFrom} ${currentType.gradientTo} backdrop-blur-sm`}>
                      {currentType.icon}
                    </div>
                  )}
                  <div>
                    <h1 className={`font-serif text-5xl font-light tracking-tight ${currentType?.primaryColor || 'text-cream'} sm:text-6xl`}>
                      {currentType?.label || 'The Archive'}
                    </h1>
                    <div className="mt-3 h-px w-32 bg-gradient-to-r from-current to-transparent opacity-40" />
                  </div>
                </div>
              </div>

              {/* Exquisite Search */}
              <div className="relative max-w-2xl">
                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search the collection..."
                  className="w-full rounded-xl border border-white/[0.08] bg-white/[0.02] py-3 pl-12 pr-4 text-sm text-cream placeholder:text-gray-400 outline-none backdrop-blur-sm transition-all focus:border-white/20 focus:bg-white/[0.03]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-gray-200"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Exquisite Filter Bar */}
          <div className="mb-12">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1 overflow-x-auto pb-2">
                <div className="flex gap-2 min-w-max">
                  {/* All Filter */}
                  <button
                    onClick={() => setFilter("all")}
                    className={`group relative flex items-center gap-3 rounded-xl border px-4 py-2.5 transition-all duration-300 ${
                      filter === "all" 
                        ? "border-white/30 bg-white/10" 
                        : "border-white/[0.08] hover:border-white/20 hover:bg-white/[0.03]"
                    }`}
                    type="button"
                  >
                    {filter === "all" && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-30 rounded-xl" />
                    )}
                    <div className="relative z-10 flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        filter === "all" ? "bg-white/20" : "bg-white/[0.05]"
                      }`}>
                        <Globe className="h-4 w-4 text-gray-300" />
                      </div>
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-200">All</div>
                        <div className="text-xs text-gray-400">{typeCounts.all} items</div>
                      </div>
                    </div>
                  </button>

                  {/* Type Filters */}
                  {kinds.map((kind) => {
                    const config = TYPE_CONFIG[kind];
                    const active = filter === kind;
                    
                    return (
                      <button
                        key={kind}
                        onClick={() => setFilter(kind)}
                        className={`group relative flex items-center gap-3 rounded-xl border px-4 py-2.5 transition-all duration-300 ${active ? config.borderColor : 'border-white/[0.08] hover:border-white/20'} ${
                          active ? 'bg-white/5' : 'hover:bg-white/[0.03]'
                        }`}
                        type="button"
                      >
                        {active && (
                          <div className={`absolute inset-0 bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} opacity-20 rounded-xl`} />
                        )}
                        
                        <div className="relative z-10 flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            active 
                              ? `${config.primaryColor.replace('text-', 'bg-')}/20` 
                              : 'bg-white/[0.05]'
                          } backdrop-blur-sm`}>
                            {React.cloneElement(config.icon as React.ReactElement, {
                              className: `h-4 w-4 ${active ? config.primaryColor : 'text-gray-400 group-hover:text-gray-300'}`
                            })}
                          </div>
                          <div className="text-left">
                            <div className={`text-sm font-medium ${active ? config.primaryColor : 'text-gray-300'}`}>
                              {config.label}
                            </div>
                            <div className="text-xs text-gray-400">
                              {typeCounts[kind]} items
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Visual Counter */}
              <div className="flex items-center gap-4">
                <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                <div className="flex items-center gap-3">
                  <div className="text-sm text-gray-400">Viewing</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-light text-cream">{filtered.length}</span>
                    <span className="text-gray-500">/</span>
                    <span className="text-gray-400">{cards.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Exquisite Content Grid - DESIGN SPEAKS LOUDEST */}
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((card) => {
                const config = TYPE_CONFIG[card.type as DocKind];
                const hasDownload = card.downloadUrl;
                
                return (
                  <motion.div
                    key={`${card.type}:${card.slug}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="group"
                  >
                    <Link
                      href={card.href}
                      className={`relative block overflow-hidden rounded-3xl ${config.borderColor} transition-all duration-500 hover:scale-[1.02]`}
                    >
                      {/* Card Architecture - Multiple Visual Layers */}
                      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/20 to-black" />
                      {config.texture}
                      <div className={`absolute inset-0 ${config.gradientFrom} ${config.gradientTo} opacity-10`} />
                      {config.indicatorElement}
                      <div className={config.frameStyle} />
                      
                      {/* Type Indicator Corner */}
                      <div className={`absolute top-0 left-0 z-20 ${config.primaryColor.replace('text-', 'bg-')}/10 backdrop-blur-sm rounded-br-3xl rounded-tl-3xl px-3 py-2`}>
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-current" />
                          <span className={`text-xs font-medium ${config.casing === 'uppercase' ? 'tracking-[0.2em]' : ''}`}>
                            {config.label}
                          </span>
                        </div>
                      </div>
                      
                      {/* Download Indicator (Visual Only) */}
                      {hasDownload && (
                        <div className="absolute top-0 right-0 z-20 bg-gradient-to-bl from-emerald-500/10 to-emerald-600/5 backdrop-blur-sm rounded-bl-3xl rounded-tr-3xl px-3 py-2">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-400" />
                            <Download className="h-3 w-3 text-emerald-400" />
                          </div>
                        </div>
                      )}

                      {/* Image Container - EXQUISITE DETAILS */}
                      <div className="relative aspect-[16/11] w-full overflow-hidden">
                        {/* Image Frame */}
                        <div className="absolute inset-4 z-10 rounded-2xl border border-white/[0.1] bg-black/20" />
                        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                        
                        {/* Image with Layers */}
                        <div className="absolute inset-0 z-0">
                          <Image
                            src={card.image || "/assets/images/writing-desk.webp"}
                            alt={card.title}
                            fill
                            className="object-cover transition-all duration-700 group-hover:scale-110"
                            sizes="(min-width: 1280px) 384px, (min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw"
                          />
                        </div>
                        
                        {/* Animated Shimmer */}
                        <div className="absolute inset-0 z-30 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" style={{
                          backgroundSize: '200% 100%',
                          animation: 'shimmer 2s infinite'
                        }} />
                        
                        {/* Corner Accents */}
                        <div className="absolute top-0 left-0 h-8 w-8 border-t border-l border-white/10 rounded-tl-3xl" />
                        <div className="absolute top-0 right-0 h-8 w-8 border-t border-r border-white/10 rounded-tr-3xl" />
                      </div>

                      {/* Content Area - ARCHITECTURAL DETAILING */}
                      <div className="relative z-10 p-6">
                        {/* Title with Type Color */}
                        <div className="mb-4">
                          <h2 className={`font-serif text-xl font-light leading-tight ${config.primaryColor} mb-2`}>
                            {card.title}
                          </h2>
                          <div className={`h-0.5 w-12 ${config.primaryColor.replace('text-', 'bg-')}/30 rounded-full`} />
                        </div>

                        {/* Excerpt with Careful Typography */}
                        {card.excerpt && (
                          <div className="mb-5">
                            <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">
                              {card.excerpt}
                            </p>
                          </div>
                        )}

                        {/* Tags - Visual Indicators Only */}
                        {(card.tags && card.tags.length > 0) && (
                          <div className="mb-5 flex flex-wrap gap-2">
                            {card.tags.slice(0, 3).map((tag, index) => (
                              <span
                                key={tag}
                                className={`rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-gray-300 backdrop-blur-sm transition-colors ${
                                  index === 0 ? config.primaryColor.replace('text-', 'text-') + '/80' : ''
                                }`}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer - Pure Visual Communication */}
                        <div className="flex items-center justify-between border-t border-white/[0.08] pt-4">
                          <div className="flex items-center gap-2">
                            <div className={`h-1.5 w-1.5 rounded-full ${config.primaryColor.replace('text-', 'bg-')}`} />
                            {card.date && (
                              <span className="text-xs text-gray-400">
                                {new Date(card.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </span>
                            )}
                          </div>
                          
                          {/* Visual CTA - No Words */}
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${config.primaryColor.replace('text-', 'bg-')}/10 transition-transform duration-300 group-hover:scale-110 group-hover:${config.primaryColor.replace('text-', 'bg-')}/20`}>
                            <ChevronRight className={`h-3 w-3 ${config.primaryColor}`} />
                          </div>
                        </div>
                      </div>
                      
                      {/* Bottom Border Accent */}
                      <div className={`absolute bottom-0 left-0 right-0 h-0.5 ${config.primaryColor.replace('text-', 'bg-')}/20 rounded-b-3xl transition-all duration-500 group-hover:${config.primaryColor.replace('text-', 'bg-')}/40`} />
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Exquisite Empty State */}
          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.02] to-transparent p-20 text-center"
            >
              <div className="mx-auto max-w-md">
                {/* Visual Empty State - No Explanatory Text */}
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-white/[0.03] to-transparent">
                  <div className="relative">
                    <Search className="h-12 w-12 text-white/10" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-6 w-6 rounded-full border-2 border-white/20" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 w-48 mx-auto bg-gradient-to-r from-transparent via-white/10 to-transparent rounded-full" />
                  <div className="h-3 w-32 mx-auto bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-full" />
                </div>
                {(searchQuery || filter !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFilter("all");
                    }}
                    className="mt-8 rounded-xl border border-white/[0.08] bg-white/[0.02] px-6 py-3 text-sm text-gray-300 transition-colors hover:bg-white/[0.05]"
                  >
                    Clear
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
        
        {/* CSS for shimmer animation */}
        <style jsx global>{`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}</style>
      </main>
    </Layout>
  );
};

// -----------------------------
// Data Fetching - INCLUDING PRINTS
// -----------------------------

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  const buckets = getPublishedDocumentsByType();

  // CRITICAL: Include 'print' in the ordered kinds
  const orderedKinds: DocKind[] = [
    "post",
    "canon",
    "resource",
    "download",
    "print", // PRINT IS INCLUDED
    "book",
    "event",
    "short",
    "strategy",
  ];

  // DEBUG: Log available documents per type
  console.log('Available document types:', {
    post: buckets.post?.length || 0,
    canon: buckets.canon?.length || 0,
    resource: buckets.resource?.length || 0,
    download: buckets.download?.length || 0,
    print: buckets.print?.length || 0, // CHECK PRINT COUNT
    book: buckets.book?.length || 0,
    event: buckets.event?.length || 0,
    short: buckets.short?.length || 0,
    strategy: buckets.strategy?.length || 0,
  });

  const cards = orderedKinds
    .flatMap((k) => buckets[k] || []) // Handle missing types gracefully
    .map((doc) => getCardPropsForDocument(doc))
    .map((c) => ({
      ...c,
      type: String(c.type || "").toLowerCase() as DocKind,
    }))
    .map(applyCoverOverrides);

  return {
    props: { cards },
    revalidate: 60,
  };
};

export default ContentIndexPage;