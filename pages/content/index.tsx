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
  Lightbulb, Coffee, Users, Clock, MapPin, Gift
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
// Premium Type Configuration System
// -----------------------------

type ContentTypeConfig = {
  label: string;
  icon: React.ReactNode;
  primaryColor: string;
  secondaryColor: string;
  gradient: string;
  texture: string;
  badgeVariant: "gold" | "silver" | "bronze" | "platinum" | "emerald" | "sapphire" | "ruby" | "amber" | "onyx";
  casing: "uppercase" | "titlecase" | "smallcaps";
  accentElement: React.ReactNode;
  description: string;
  status: "premier" | "exclusive" | "limited" | "archival" | "foundational";
};

const TYPE_CONFIG: Record<DocKind | "all", ContentTypeConfig> = {
  all: {
    label: "The Complete Archive",
    icon: <Castle className="h-5 w-5" />,
    primaryColor: "text-gold",
    secondaryColor: "text-gold/70",
    gradient: "from-gold/20 via-amber-900/10 to-transparent",
    texture: "bg-[url('/assets/textures/damask-pattern.svg')]",
    badgeVariant: "platinum",
    casing: "titlecase",
    accentElement: <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-gold/2" />,
    description: "The entire curated collection",
    status: "archival"
  },
  post: {
    label: "Insights",
    icon: <Lightbulb className="h-5 w-5" />,
    primaryColor: "text-amber-300",
    secondaryColor: "text-amber-200/70",
    gradient: "from-amber-900/30 via-amber-800/15 to-transparent",
    texture: "bg-[url('/assets/textures/parchment-texture.svg')]",
    badgeVariant: "amber",
    casing: "titlecase",
    accentElement: (
      <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-amber-600/10 to-transparent rounded-full blur-2xl" />
    ),
    description: "Illuminating essays and reflections",
    status: "premier"
  },
  canon: {
    label: "Canon",
    icon: <Crown className="h-5 w-5" />,
    primaryColor: "text-gold",
    secondaryColor: "text-gold/80",
    gradient: "from-gold/25 via-yellow-900/15 to-transparent",
    texture: "bg-[url('/assets/textures/gold-filigree.svg')]",
    badgeVariant: "gold",
    casing: "uppercase",
    accentElement: (
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 h-32 w-32 bg-gradient-to-br from-gold/5 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-24 w-24 bg-gradient-to-tr from-gold/10 to-transparent rounded-full blur-2xl" />
      </div>
    ),
    description: "Foundational principles and doctrine",
    status: "foundational"
  },
  resource: {
    label: "Resources",
    icon: <Briefcase className="h-5 w-5" />,
    primaryColor: "text-emerald-300",
    secondaryColor: "text-emerald-200/70",
    gradient: "from-emerald-900/25 via-emerald-800/10 to-transparent",
    texture: "bg-[url('/assets/textures/leather-texture.svg')]",
    badgeVariant: "emerald",
    casing: "titlecase",
    accentElement: <div className="absolute bottom-0 left-0 h-20 w-20 bg-gradient-to-tr from-emerald-700/10 to-transparent blur-xl" />,
    description: "Tools and practical materials",
    status: "exclusive"
  },
  download: {
    label: "Downloads",
    icon: <Download className="h-5 w-5" />,
    primaryColor: "text-cyan-300",
    secondaryColor: "text-cyan-200/70",
    gradient: "from-cyan-900/25 via-blue-800/10 to-transparent",
    texture: "bg-[url('/assets/textures/blueprint-texture.svg')]",
    badgeVariant: "sapphire",
    casing: "titlecase",
    accentElement: <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-40 w-40 bg-gradient-to-r from-cyan-600/5 to-blue-600/5 rounded-full blur-3xl" />,
    description: "Digital assets and files",
    status: "limited"
  },
  print: {
    label: "Prints",
    icon: <Palette className="h-5 w-5" />,
    primaryColor: "text-rose-300",
    secondaryColor: "text-rose-200/70",
    gradient: "from-rose-900/25 via-pink-800/10 to-transparent",
    texture: "bg-[url('/assets/textures/watercolor-texture.svg')]",
    badgeVariant: "ruby",
    casing: "titlecase",
    accentElement: <div className="absolute -right-4 top-4 h-32 w-32 bg-gradient-to-bl from-rose-600/10 to-pink-600/5 rounded-full blur-2xl" />,
    description: "Premium printed materials",
    status: "limited"
  },
  book: {
    label: "Books",
    icon: <BookMarked className="h-5 w-5" />,
    primaryColor: "text-violet-300",
    secondaryColor: "text-violet-200/70",
    gradient: "from-violet-900/25 via-purple-800/10 to-transparent",
    texture: "bg-[url('/assets/textures/velvet-texture.svg')]",
    badgeVariant: "amethyst",
    casing: "titlecase",
    accentElement: <div className="absolute top-0 left-4 h-20 w-20 bg-gradient-to-br from-violet-700/15 to-purple-600/10 blur-xl" />,
    description: "Definitive collected works",
    status: "premier"
  },
  event: {
    label: "Events",
    icon: <Calendar className="h-5 w-5" />,
    primaryColor: "text-blue-300",
    secondaryColor: "text-blue-200/70",
    gradient: "from-blue-900/25 via-indigo-800/10 to-transparent",
    texture: "bg-[url('/assets/textures/marble-texture.svg')]",
    badgeVariant: "sapphire",
    casing: "titlecase",
    accentElement: <div className="absolute bottom-4 right-4 h-24 w-24 bg-gradient-to-tr from-blue-600/15 to-indigo-600/10 rounded-full blur-2xl" />,
    description: "Exclusive gatherings and experiences",
    status: "exclusive"
  },
  short: {
    label: "Shorts",
    icon: <Zap className="h-5 w-5" />,
    primaryColor: "text-orange-300",
    secondaryColor: "text-orange-200/70",
    gradient: "from-orange-900/25 via-amber-800/10 to-transparent",
    texture: "bg-[url('/assets/textures/silk-texture.svg')]",
    badgeVariant: "amber",
    casing: "titlecase",
    accentElement: <div className="absolute -top-2 -left-2 h-16 w-16 bg-gradient-to-br from-orange-600/20 to-amber-500/10 rounded-full blur-xl" />,
    description: "Concise insights and thoughts",
    status: "premier"
  },
  strategy: {
    label: "Strategy",
    icon: <Target className="h-5 w-5" />,
    primaryColor: "text-teal-300",
    secondaryColor: "text-teal-200/70",
    gradient: "from-teal-900/25 via-emerald-800/10 to-transparent",
    texture: "bg-[url('/assets/textures/grid-texture.svg')]",
    badgeVariant: "emerald",
    casing: "titlecase",
    accentElement: <div className="absolute top-1/2 left-0 h-32 w-32 bg-gradient-to-r from-teal-600/10 to-emerald-600/5 blur-2xl" />,
    description: "Strategic frameworks and planning",
    status: "foundational"
  }
};

// Badge Variant Styles
const BADGE_VARIANTS = {
  gold: "bg-gradient-to-br from-gold/20 to-gold/10 border-gold/30 text-gold",
  platinum: "bg-gradient-to-br from-gray-300/20 to-gray-400/10 border-gray-400/30 text-gray-300",
  emerald: "bg-gradient-to-br from-emerald-600/20 to-emerald-500/10 border-emerald-500/30 text-emerald-300",
  sapphire: "bg-gradient-to-br from-blue-600/20 to-blue-500/10 border-blue-500/30 text-blue-300",
  ruby: "bg-gradient-to-br from-rose-600/20 to-rose-500/10 border-rose-500/30 text-rose-300",
  amber: "bg-gradient-to-br from-amber-600/20 to-amber-500/10 border-amber-500/30 text-amber-300",
  amethyst: "bg-gradient-to-br from-purple-600/20 to-purple-500/10 border-purple-500/30 text-purple-300",
  onyx: "bg-gradient-to-br from-gray-800/20 to-gray-900/10 border-gray-700/30 text-gray-400"
};

// Status Badge Styles
const STATUS_BADGES = {
  premier: {
    label: "Premier",
    icon: <Crown className="h-3 w-3" />,
    style: "bg-gradient-to-br from-gold/20 to-amber-900/20 border-gold/40 text-gold"
  },
  exclusive: {
    label: "Exclusive",
    icon: <Lock className="h-3 w-3" />,
    style: "bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/40 text-cyan-300"
  },
  limited: {
    label: "Limited",
    icon: <Clock className="h-3 w-3" />,
    style: "bg-gradient-to-br from-rose-900/20 to-pink-900/20 border-rose-500/40 text-rose-300"
  },
  archival: {
    label: "Archival",
    icon: <Scroll className="h-3 w-3" />,
    style: "bg-gradient-to-br from-gray-800/20 to-gray-900/20 border-gray-600/40 text-gray-300"
  },
  foundational: {
    label: "Foundational",
    icon: <Shield className="h-3 w-3" />,
    style: "bg-gradient-to-br from-emerald-900/20 to-green-900/20 border-emerald-500/40 text-emerald-300"
  }
};

// -----------------------------
// Cover Overrides
// -----------------------------

const COVER_OVERRIDES: OverrideMap = {
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

  "fathering-without-fear": "/assets/images/books/fathering-without-fear.jpg",
  "the-fiction-adaptation": "/assets/images/books/the-fiction-adaptation.jpg",
  "the-architecture-of-human-purpose": "/assets/images/books/the-architecture-of-human-purpose.jpg",
  "the-builders-catechism": "/assets/images/canon/builders-catechism-cover.jpg",

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

  "canon-council-table-agenda": "/assets/images/canon/canon-resources.jpg",
  "canon-household-charter": "/assets/images/canon/canon-resources.jpg",
  "canon-reading-plan-year-one": "/assets/images/canon/canon-resources.jpg",
  "destiny-mapping-worksheet": "/assets/images/canon/canon-resources.jpg",
  "institutional-health-scorecard": "/assets/images/canon/canon-resources.jpg",
  "multi-generational-legacy-ledger": "/assets/images/canon/canon-resources.jpg",
  "purpose-alignment-checklist": "/assets/images/canon/canon-resources.jpg",

  "founders-salon": "/assets/images/writing-desk.webp",
  "leadership-workshop": "/assets/images/writing-desk.webp",
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
// Page Component
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

  const kinds: Array<{ key: DocKind | "all"; config: ContentTypeConfig }> = [
    { key: "all", config: TYPE_CONFIG.all },
    { key: "post", config: TYPE_CONFIG.post },
    { key: "canon", config: TYPE_CONFIG.canon },
    { key: "resource", config: TYPE_CONFIG.resource },
    { key: "download", config: TYPE_CONFIG.download },
    { key: "print", config: TYPE_CONFIG.print },
    { key: "book", config: TYPE_CONFIG.book },
    { key: "event", config: TYPE_CONFIG.event },
    { key: "short", config: TYPE_CONFIG.short },
    { key: "strategy", config: TYPE_CONFIG.strategy },
  ];

  const currentConfig = TYPE_CONFIG[filter];

  return (
    <Layout title="The Archive">
      <main className="min-h-screen bg-black">
        {/* Premium Hero Section */}
        <div className="relative overflow-hidden border-b border-white/[0.08]">
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900/20 to-black" />
          <div className={`absolute inset-0 ${currentConfig.texture} opacity-5`} />
          {currentConfig.accentElement}
          
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              {/* Premium Collection Indicator */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.03] px-4 py-2 backdrop-blur-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-white/10 to-transparent">
                  <Lock className="h-3 w-3 text-white/70" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
                    Curated Collection
                  </span>
                  <span className="h-1 w-1 rounded-full bg-white/20" />
                  <span className="text-xs text-gray-400">
                    {cards.length} exclusive pieces
                  </span>
                </div>
              </div>

              {/* Premium Title with Type Indicator */}
              <div className="mb-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${currentConfig.primaryColor.replace('text-', 'bg-')}/10 backdrop-blur-sm`}>
                    {currentConfig.icon}
                  </div>
                  <div>
                    <h1 className={`font-serif text-5xl font-light tracking-tight ${currentConfig.primaryColor} sm:text-6xl`}>
                      {currentConfig.label}
                    </h1>
                    <div className="mt-2 h-px w-24 bg-gradient-to-r from-current to-transparent opacity-50" />
                  </div>
                </div>
                <p className="max-w-2xl text-lg text-gray-300 leading-relaxed">
                  {currentConfig.description}
                </p>
              </div>

              {/* Premium Search */}
              <div className="relative max-w-2xl">
                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles, topics, tags..."
                  className="w-full rounded-2xl border border-white/[0.12] bg-white/[0.03] py-4 pl-12 pr-4 text-sm text-cream placeholder:text-gray-400 outline-none backdrop-blur-sm transition-all focus:border-gold/50 focus:bg-white/[0.05] focus:shadow-[0_0_40px_rgba(212,175,55,0.15)]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-gray-400 hover:bg-white/5 hover:text-gray-200"
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
          {/* Premium Filter Bar */}
          <div className="mb-10">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="flex flex-wrap gap-2">
                  {kinds.map(({ key, config }) => {
                    const active = filter === key;
                    const count = key === "all" 
                      ? cards.length 
                      : cards.filter(c => String(c.type || "").toLowerCase() === key).length;
                    
                    return (
                      <button
                        key={key}
                        onClick={() => setFilter(key)}
                        className={`group relative overflow-hidden rounded-xl border px-4 py-2.5 transition-all duration-300 ${
                          active 
                            ? `border-white/[0.2] ${config.primaryColor.replace('text-', 'bg-')}/10` 
                            : 'border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.03]'
                        }`}
                        type="button"
                      >
                        {/* Active glow */}
                        {active && (
                          <div className={`absolute inset-0 ${config.gradient} opacity-30`} />
                        )}
                        
                        <div className="relative z-10 flex items-center gap-3">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            active 
                              ? `${config.primaryColor.replace('text-', 'bg-')}/20 backdrop-blur-sm` 
                              : 'bg-white/[0.05]'
                          }`}>
                            {React.cloneElement(config.icon as React.ReactElement, {
                              className: `h-4 w-4 ${active ? config.primaryColor : 'text-gray-400 group-hover:text-gray-300'}`
                            })}
                          </div>
                          <div className="text-left">
                            <div className={`text-sm font-medium ${active ? config.primaryColor : 'text-gray-300'}`}>
                              {config.label}
                            </div>
                            <div className="text-xs text-gray-400">
                              {count} items
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Stats Indicator */}
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-3 backdrop-blur-sm">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-400">Viewing</div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-medium text-cream">{filtered.length}</span>
                    <span className="text-gray-500">/</span>
                    <span className="text-gray-400">{cards.length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Content Grid */}
          <AnimatePresence mode="wait">
            <motion.div
              key={filter}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {filtered.map((card) => {
                const config = TYPE_CONFIG[card.type as DocKind];
                const status = config?.status || "premier";
                const statusConfig = STATUS_BADGES[status];

                return (
                  <motion.div
                    key={`${card.type}:${card.slug}`}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Link
                      href={card.href}
                      className="group relative block overflow-hidden rounded-3xl border border-white/[0.08] transition-all duration-500 hover:scale-[1.02] hover:border-current/[0.3] hover:shadow-2xl"
                      style={{ 
                        background: `linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)`,
                        borderColor: config?.primaryColor.replace('text-', 'rgba(') + ', 0.1)'
                      }}
                    >
                      {/* Type-specific Background Glow */}
                      {config?.accentElement}
                      
                      {/* Status Badge */}
                      <div className="absolute left-4 top-4 z-20">
                        <div className={`flex items-center gap-2 rounded-full ${statusConfig.style} border px-3 py-1.5 backdrop-blur-sm`}>
                          {statusConfig.icon}
                          <span className="text-xs font-semibold tracking-wider">
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>

                      {/* Type Badge */}
                      <div className="absolute right-4 top-4 z-20">
                        <div className={`flex items-center gap-2 rounded-full ${BADGE_VARIANTS[config?.badgeVariant || 'onyx']} border px-3 py-1.5 backdrop-blur-sm`}>
                          <div className="h-2 w-2 rounded-full bg-current opacity-70" />
                          <span className={`text-xs font-semibold ${config?.casing === 'uppercase' ? 'uppercase tracking-[0.2em]' : ''}`}>
                            {config?.label}
                          </span>
                        </div>
                      </div>

                      {/* Image Container */}
                      <div className="relative aspect-[16/10] w-full overflow-hidden">
                        <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <Image
                          src={card.image || "/assets/images/writing-desk.webp"}
                          alt={card.title}
                          fill
                          className="object-cover transition-transform duration-700 group-hover:scale-105"
                          sizes="(min-width: 1280px) 384px, (min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw"
                        />
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                      </div>

                      {/* Content */}
                      <div className="relative z-10 p-6">
                        {/* Title with Type Color */}
                        <h2 className={`mb-3 font-serif text-xl font-light leading-tight ${config?.primaryColor} group-hover:opacity-90 transition-opacity`}>
                          {card.title}
                        </h2>

                        {/* Excerpt */}
                        {card.excerpt && (
                          <p className="mb-4 line-clamp-2 text-sm text-gray-300 leading-relaxed">
                            {card.excerpt}
                          </p>
                        )}

                        {/* Premium Tags */}
                        {(card.tags && card.tags.length > 0) && (
                          <div className="mb-5 flex flex-wrap gap-2">
                            {card.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-full border border-white/[0.1] bg-white/[0.05] px-2.5 py-1 text-xs text-gray-300 backdrop-blur-sm"
                              >
                                {tag}
                              </span>
                            ))}
                            {card.tags.length > 3 && (
                              <span className="rounded-full border border-white/[0.1] bg-white/[0.05] px-2.5 py-1 text-xs text-gray-400 backdrop-blur-sm">
                                +{card.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Footer with Date and CTA */}
                        <div className="flex items-center justify-between border-t border-white/[0.1] pt-4">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-400">
                              {card.date ? new Date(card.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              }) : 'Undated'}
                            </span>
                          </div>
                          <div className={`flex items-center gap-2 text-sm font-medium ${config?.primaryColor}`}>
                            <span className="text-xs">Explore</span>
                            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-current/10">
                              <ChevronRight className="h-3 w-3" />
                            </div>
                          </div>
                        </div>

                        {/* Download Indicator */}
                        {card.downloadUrl && (
                          <div className="mt-4 rounded-lg border border-white/[0.1] bg-white/[0.02] p-3">
                            <div className="flex items-center gap-2">
                              <Gift className="h-4 w-4 text-emerald-400" />
                              <span className="text-xs text-emerald-300">Includes Download</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Empty State */}
          {filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.02] to-transparent p-16 text-center backdrop-blur-sm"
            >
              <div className="mx-auto max-w-md">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-white/[0.05] to-transparent">
                  <Search className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="mb-3 font-serif text-2xl font-light text-cream">
                  No matches found
                </h3>
                <p className="mb-8 text-gray-400">
                  Your search didn't match any items in our curated collection.
                </p>
                {(searchQuery || filter !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setFilter("all");
                    }}
                    className="rounded-xl border border-white/[0.12] bg-white/[0.03] px-6 py-3 text-sm text-gray-300 hover:bg-white/[0.05]"
                  >
                    Reset all filters
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </main>
    </Layout>
  );
};

// -----------------------------
// Data Fetching
// -----------------------------

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  const buckets = getPublishedDocumentsByType();

  const orderedKinds: DocKind[] = [
    "post",
    "canon",
    "resource",
    "download",
    "print",
    "book",
    "event",
    "short",
    "strategy",
  ];

  const cards = orderedKinds
    .flatMap((k) => buckets[k])
    .map((doc) => getCardPropsForDocument(doc))
    .map((c) => ({
      ...c,
      type: String(c.type || "").toLowerCase() as any,
    }))
    .map(applyCoverOverrides);

  return {
    props: { cards },
    revalidate: 60,
  };
};

export default ContentIndexPage;