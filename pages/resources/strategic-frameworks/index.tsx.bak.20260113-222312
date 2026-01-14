// pages/frameworks/index.tsx
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { 
  ArrowRight, 
  ChevronRight, 
  Shield, 
  ScrollText, 
  Briefcase, 
  Layers,
  Search,
  Filter,
  Target,
  BookOpen,
  Users,
  Building2,
  Award,
  Star,
  Zap,
  BarChart3,
  TrendingUp,
  Cpu,
  Clock,
  Calendar,
  Tag as TagIcon,
  Download,
  ExternalLink,
  Sparkles,
  CheckCircle
} from "lucide-react";

import Layout from "@/components/Layout";

// If getAllFrameworks doesn't exist, we'll create a local version
// Otherwise, import from the correct path

interface Framework {
  key: string;
  slug: string;
  title: string;
  oneLiner: string;
  description?: string;
  excerpt?: string;
  tag: string;
  tier: string[];
  accent: "gold" | "emerald" | "blue" | "rose" | "indigo" | "purple";
  coverImage?: string;
  readTime?: string;
  date?: string;
  category?: string;
  tags?: string[];
  featured?: boolean;
  downloadUrl?: string;
  complexity?: "basic" | "intermediate" | "advanced";
}

interface PageProps {
  frameworks: Framework[];
  categories: string[];
  tags: string[];
}

const LIBRARY_HREF = "/frameworks";

// Local data if getAllFrameworks doesn't exist
const LOCAL_FRAMEWORKS: Framework[] = [
  {
    key: "purpose-architecture",
    slug: "purpose-architecture",
    title: "Architecture of Purpose",
    oneLiner: "Framework for defining and executing purpose at institutional scale",
    description: "A comprehensive framework for defining, measuring, and executing purpose-driven strategy across organizations.",
    excerpt: "Transform vague mission statements into actionable strategic pillars with clear ownership and accountability.",
    tag: "Strategy",
    tier: ["Board", "Founder"],
    accent: "gold",
    coverImage: "/assets/images/frameworks/purpose-architecture.jpg",
    readTime: "25 min",
    date: "2024-01-15",
    category: "Strategy",
    tags: ["Purpose", "Leadership", "Governance"],
    featured: true,
    complexity: "advanced"
  },
  {
    key: "legacy-roadmap",
    slug: "legacy-roadmap",
    title: "Legacy Roadmap",
    oneLiner: "Multi-generational planning framework for family enterprises",
    description: "Structured approach to legacy planning, succession, and intergenerational wealth transfer.",
    excerpt: "Build sustainable legacies that outlive their founders and create lasting impact.",
    tag: "Family",
    tier: ["Founder", "Household"],
    accent: "emerald",
    coverImage: "/assets/images/frameworks/legacy-roadmap.jpg",
    readTime: "18 min",
    date: "2024-02-10",
    category: "Family",
    tags: ["Legacy", "Succession", "Family"],
    featured: true,
    complexity: "intermediate"
  },
  {
    key: "governance-operating-system",
    slug: "governance-operating-system",
    title: "Governance OS",
    oneLiner: "Board-grade governance framework for high-growth organizations",
    description: "Complete operating system for board governance, decision rights, and accountability.",
    excerpt: "Transform board meetings from reporting sessions to strategic decision-making engines.",
    tag: "Governance",
    tier: ["Board"],
    accent: "blue",
    coverImage: "/assets/images/frameworks/governance-os.jpg",
    readTime: "30 min",
    date: "2024-03-05",
    category: "Governance",
    tags: ["Governance", "Board", "Operations"],
    featured: false,
    complexity: "advanced"
  },
  {
    key: "family-covenant",
    slug: "family-covenant",
    title: "Family Covenant",
    oneLiner: "Framework for intentional family leadership and values transmission",
    description: "Create family constitutions, rituals, and leadership structures that preserve values across generations.",
    excerpt: "Move beyond passive parenting to intentional family leadership and legacy building.",
    tag: "Family",
    tier: ["Household"],
    accent: "purple",
    coverImage: "/assets/images/frameworks/family-covenant.jpg",
    readTime: "15 min",
    date: "2024-01-30",
    category: "Family",
    tags: ["Family", "Values", "Leadership"],
    featured: false,
    complexity: "basic"
  },
  {
    key: "innovation-portfolio",
    slug: "innovation-portfolio",
    title: "Innovation Portfolio",
    oneLiner: "Strategic framework for managing innovation across horizons",
    description: "Balance core business optimization with future growth through structured innovation management.",
    excerpt: "Allocate resources strategically across core, adjacent, and transformational innovation.",
    tag: "Innovation",
    tier: ["Founder", "Board"],
    accent: "rose",
    coverImage: "/assets/images/frameworks/innovation-portfolio.jpg",
    readTime: "22 min",
    date: "2024-02-25",
    category: "Innovation",
    tags: ["Innovation", "Strategy", "Growth"],
    featured: false,
    complexity: "intermediate"
  },
  {
    key: "leadership-cadence",
    slug: "leadership-cadence",
    title: "Leadership Cadence",
    oneLiner: "Rhythms and rituals for sustainable leadership execution",
    description: "Design leadership routines, meeting cadences, and decision loops that prevent burnout and ensure execution.",
    excerpt: "Replace ad-hoc leadership with disciplined rhythms that sustain performance.",
    tag: "Leadership",
    tier: ["Founder", "Board"],
    accent: "indigo",
    coverImage: "/assets/images/frameworks/leadership-cadence.jpg",
    readTime: "20 min",
    date: "2024-03-15",
    category: "Leadership",
    tags: ["Leadership", "Execution", "Rhythm"],
    featured: false,
    complexity: "intermediate"
  }
];

const easeSettle: [number, number, number, number] = [0.16, 1, 0.3, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: easeSettle } },
};

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.06 } },
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

const ACCENTS = {
  gold: {
    border: "border-amber-400/20 hover:border-amber-400/35",
    glow: "from-amber-500/18 via-amber-500/6 to-transparent",
    chip: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    link: "text-amber-200 hover:text-amber-100",
    bg: "bg-amber-500/10"
  },
  emerald: {
    border: "border-emerald-400/20 hover:border-emerald-400/35",
    glow: "from-emerald-500/16 via-emerald-500/6 to-transparent",
    chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
    link: "text-emerald-200 hover:text-emerald-100",
    bg: "bg-emerald-500/10"
  },
  blue: {
    border: "border-sky-400/20 hover:border-sky-400/35",
    glow: "from-sky-500/16 via-sky-500/6 to-transparent",
    chip: "border-sky-400/25 bg-sky-400/10 text-sky-200",
    link: "text-sky-200 hover:text-sky-100",
    bg: "bg-sky-500/10"
  },
  rose: {
    border: "border-rose-400/20 hover:border-rose-400/35",
    glow: "from-rose-500/16 via-rose-500/6 to-transparent",
    chip: "border-rose-400/25 bg-rose-400/10 text-rose-200",
    link: "text-rose-200 hover:text-rose-100",
    bg: "bg-rose-500/10"
  },
  indigo: {
    border: "border-indigo-400/20 hover:border-indigo-400/35",
    glow: "from-indigo-500/16 via-indigo-500/6 to-transparent",
    chip: "border-indigo-400/25 bg-indigo-400/10 text-indigo-200",
    link: "text-indigo-200 hover:text-indigo-100",
    bg: "bg-indigo-500/10"
  },
  purple: {
    border: "border-purple-400/20 hover:border-purple-400/35",
    glow: "from-purple-500/16 via-purple-500/6 to-transparent",
    chip: "border-purple-400/25 bg-purple-400/10 text-purple-200",
    link: "text-purple-200 hover:text-purple-100",
    bg: "bg-purple-500/10"
  }
} as const;

function TierBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/12 bg-white/7 px-2.5 py-1 text-[11px] font-semibold text-white/80">
      {label}
    </span>
  );
}

function tierLabels(f: Framework): string[] {
  const labels: string[] = [];
  if (f.tier.includes("Board")) labels.push("Board-grade");
  if (f.tier.includes("Founder")) labels.push("Founder execution");
  if (f.tier.includes("Household")) labels.push("Household formation");
  return labels;
}

const StrategicFrameworksLibraryPage: NextPage<PageProps> = ({ frameworks, categories, tags }) => {
  const reduceMotion = useReducedMotion();
  const canonical = `https://www.abrahamoflondon.com${LIBRARY_HREF}`;
  const motionProps = reduceMotion ? ({ initial: false } as const) : ({ initial: "hidden" as const } as const);

  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<string>("all");
  const [selectedTier, setSelectedTier] = React.useState<string>("all");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");

  const filteredFrameworks = React.useMemo(() => {
    const q = searchQuery.toLowerCase();
    return frameworks.filter((f) => {
      const matchesSearch =
        !searchQuery ||
        f.title.toLowerCase().includes(q) ||
        f.oneLiner.toLowerCase().includes(q) ||
        f.description?.toLowerCase().includes(q) ||
        f.tags?.some((tag) => tag.toLowerCase().includes(q));

      const matchesCategory = selectedCategory === "all" || f.category === selectedCategory;
      const matchesTier = selectedTier === "all" || f.tier.includes(selectedTier);

      return matchesSearch && matchesCategory && matchesTier;
    });
  }, [frameworks, searchQuery, selectedCategory, selectedTier]);

  const featuredFrameworks = React.useMemo(() => 
    frameworks.filter(f => f.featured).slice(0, 2),
    [frameworks]
  );

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setSelectedTier("all");
  };

  const hasActiveFilters = searchQuery || selectedCategory !== "all" || selectedTier !== "all";

  return (
    <Layout title="Strategic Frameworks" className="bg-black min-h-screen">
      <Head>
        <title>Strategic Frameworks | Abraham of London</title>
        <meta name="description" content="Board-grade strategic tools derived from Ancient Canon. Operational tools for Boards, Founders, and Households." />
        <link rel="canonical" href={canonical} />
        <meta property="og:title" content="Strategic Frameworks | Abraham of London" />
        <meta property="og:description" content="Board-grade strategic tools derived from Ancient Canon. Operational tools for Boards, Founders, and Households." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={canonical} />
        <meta property="og:image" content="/assets/images/frameworks-og.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* Hero Section */}
      <section className="relative isolate overflow-hidden border-b border-white/8">
        <div className="absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-[#06060b]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12),transparent_55%)]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <motion.div variants={stagger} {...motionProps} animate="visible">
            <motion.div variants={fadeUp} className="flex flex-wrap items-center justify-between gap-3 mb-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2">
                <ScrollText className="h-4 w-4 text-amber-200" aria-hidden="true" />
                <span className="text-xs font-black uppercase tracking-[0.22em] text-amber-200">
                  Canon-derived dossiers
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link 
                  href="/canon" 
                  className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/7 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Enter the Canon <ChevronRight className="h-4 w-4" />
                </Link>
                <Link 
                  href="/downloads" 
                  className="inline-flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/15"
                >
                  Download Resources <Download className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>

            <motion.h1 variants={fadeUp} className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6">
              Strategic Frameworks
            </motion.h1>

            <motion.p variants={fadeUp} className="text-lg text-white/80 mb-10 max-w-3xl">
              Operational tools for Boards, Founders, and Households. 
              Transform principles into executable systems with clear ownership and accountability.
            </motion.p>

            {/* Stats */}
            <motion.div 
              variants={fadeUp}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-xl mb-12"
            >
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white mb-1">{frameworks.length}</div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Frameworks</div>
              </div>
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-amber-200 mb-1">
                  {frameworks.filter(f => f.featured).length}
                </div>
                <div className="text-xs font-medium text-amber-300/80 uppercase tracking-wider">Featured</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white mb-1">{categories.length}</div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Categories</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white mb-1">{tags.length}</div>
                <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">Topics</div>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-4">
              <Link
                href="#frameworks-grid"
                className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-sm font-bold text-black hover:from-amber-400 hover:to-amber-500 transition-all"
              >
                <BookOpen className="h-5 w-5" />
                Explore Frameworks
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/inner-circle"
                className="inline-flex items-center gap-3 rounded-xl border border-amber-400/40 bg-white/5 px-8 py-4 text-sm font-bold text-amber-100 hover:border-amber-400/60 hover:bg-white/10 transition-all"
              >
                <Users className="h-5 w-5" />
                Inner Circle Access
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="sticky top-0 z-40 border-b border-white/10 bg-black/80 backdrop-blur-xl py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search frameworks by title, description, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg ${viewMode === "grid" ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <div className="grid grid-cols-2 gap-1 w-5 h-5">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="w-full h-full bg-current rounded-sm" />
                    ))}
                  </div>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg ${viewMode === "list" ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <div className="flex flex-col gap-1 w-5 h-5">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="w-full h-1 bg-current rounded-full" />
                    ))}
                  </div>
                </button>
              </div>

              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="appearance-none bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>

              <div className="relative">
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="appearance-none bg-white/5 border border-white/10 rounded-xl py-3 pl-4 pr-10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                >
                  <option value="all">All Tiers</option>
                  <option value="Board">Board-grade</option>
                  <option value="Founder">Founder</option>
                  <option value="Household">Household</option>
                </select>
                <Target className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm text-gray-400">
                  Showing {filteredFrameworks.length} of {frameworks.length} frameworks
                </span>
                {searchQuery && (
                  <span className="px-3 py-1 bg-amber-500/10 text-amber-300 rounded-full text-sm">
                    Search: "{searchQuery}"
                  </span>
                )}
                {selectedCategory !== "all" && (
                  <span className="px-3 py-1 bg-white/5 text-white rounded-full text-sm">
                    Category: {selectedCategory}
                  </span>
                )}
                {selectedTier !== "all" && (
                  <span className="px-3 py-1 bg-white/5 text-white rounded-full text-sm">
                    Tier: {selectedTier}
                  </span>
                )}
              </div>
              <button
                onClick={clearFilters}
                className="text-sm text-gray-400 hover:text-white"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Featured Frameworks */}
      {featuredFrameworks.length > 0 && (
        <section className="py-16 border-b border-white/10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12 text-center">
              <div className="inline-flex items-center gap-2 mb-6">
                <Award className="h-6 w-6 text-amber-400" />
                <span className="text-sm font-bold uppercase tracking-[0.2em] text-amber-300">
                  Featured Frameworks
                </span>
              </div>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-white mb-4">
                Flagship Methodologies
              </h2>
              <p className="text-gray-400 max-w-2xl mx-auto">
                These frameworks represent the most comprehensive and battle-tested methodologies 
                in our library.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {featuredFrameworks.map((framework) => {
                const A = ACCENTS[framework.accent];
                const labels = tierLabels(framework);
                
                return (
                  <Link 
                    key={framework.key} 
                    href={`${LIBRARY_HREF}/${framework.slug}`}
                    className="group block"
                  >
                    <div className={`rounded-2xl border ${A.border} bg-gradient-to-br from-white/5 to-white/0 p-8 transition-all duration-300 hover:bg-white/10`}>
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-xl p-3 ${A.bg}`}>
                            <Target className="h-6 w-6 text-current" />
                          </div>
                          <div>
                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.22em] ${A.chip}`}>
                              {framework.tag}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {labels.map((x) => <TierBadge key={`${framework.slug}-${x}`} label={x} />)}
                          <Sparkles className="h-5 w-5 text-amber-400" />
                        </div>
                      </div>

                      <h3 className="font-serif text-2xl font-semibold text-white mb-3">
                        {framework.title}
                      </h3>
                      <p className="text-lg text-amber-300 mb-4">
                        {framework.oneLiner}
                      </p>
                      <p className="text-gray-300 mb-6">
                        {framework.excerpt || framework.description}
                      </p>

                      <div className="flex items-center justify-between border-t border-white/10 pt-6">
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          {framework.readTime && (
                            <span className="flex items-center gap-1.5">
                              <Clock className="h-4 w-4" />
                              {framework.readTime}
                            </span>
                          )}
                          {framework.complexity && (
                            <span className="px-2 py-1 rounded-full bg-white/5 text-xs">
                              {framework.complexity}
                            </span>
                          )}
                        </div>
                        <div className={`flex items-center gap-2 text-sm font-semibold ${A.link}`}>
                          Open framework <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Main Frameworks Grid */}
      <section id="frameworks-grid" className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filteredFrameworks.length > 0 ? (
            <>
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">All Frameworks</h2>
                  <p className="text-gray-400">
                    {filteredFrameworks.length} framework{filteredFrameworks.length !== 1 ? 's' : ''} matching your criteria
                  </p>
                </div>
                <div className="text-sm text-gray-400">
                  Sorted by relevance
                </div>
              </div>

              <div className={viewMode === "grid" 
                ? "grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                : "space-y-6"
              }>
                {filteredFrameworks.map((framework) => {
                  const A = ACCENTS[framework.accent];
                  const labels = tierLabels(framework);
                  
                  return (
                    <Link 
                      key={framework.key} 
                      href={`${LIBRARY_HREF}/${framework.slug}`}
                      className={`group block ${viewMode === "list" ? 'flex gap-6' : ''}`}
                    >
                      <div className={`rounded-2xl border ${A.border} bg-gradient-to-br from-white/5 to-white/0 p-6 transition-all duration-300 hover:bg-white/10 ${viewMode === "list" ? 'flex-1 flex items-start gap-6' : ''}`}>
                        {viewMode === "list" && (
                          <div className={`rounded-xl p-4 ${A.bg} flex-shrink-0`}>
                            <Target className="h-6 w-6 text-current" />
                          </div>
                        )}
                        
                        <div className={viewMode === "list" ? 'flex-1' : ''}>
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.22em] ${A.chip}`}>
                                {framework.tag}
                              </span>
                            </div>
                            <div className="flex flex-wrap justify-end gap-1">
                              {labels.slice(0, 1).map((x) => <TierBadge key={`${framework.slug}-${x}`} label={x} />)}
                            </div>
                          </div>

                          <h3 className="font-serif text-xl font-semibold text-white mb-2">
                            {framework.title}
                          </h3>
                          <p className="text-sm leading-relaxed text-white/72 mb-4">
                            {framework.oneLiner}
                          </p>

                          {framework.tags && framework.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {framework.tags.slice(0, 2).map((tag) => (
                                <span key={tag} className="text-xs text-gray-400">
                                  #{tag}
                                </span>
                              ))}
                            </div>
                          )}

                          <div className={`inline-flex items-center gap-2 text-sm font-semibold ${A.link}`}>
                            Open framework <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-20">
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">No frameworks found</h3>
              <p className="text-gray-400 mb-8">
                {searchQuery 
                  ? `No frameworks match "${searchQuery}". Try a different search term.`
                  : "No frameworks available with the current filters."
                }
              </p>
              <button
                onClick={clearFilters}
                className="rounded-xl bg-white/10 px-6 py-3 text-white hover:bg-white/15 transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-white/10">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-transparent p-12">
            <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10">
              <Sparkles className="h-7 w-7 text-amber-400" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">Access Premium Frameworks</h3>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Join the Inner Circle for exclusive frameworks, templates, worksheets, 
              and community discussions to help you implement these methodologies effectively.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/inner-circle"
                className="inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 py-4 text-sm font-bold text-black hover:from-amber-400 hover:to-amber-500 transition-all"
              >
                <Users className="h-5 w-5" />
                Explore Inner Circle
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-3 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-sm font-bold text-white hover:bg-white/10 transition-all"
              >
                <Briefcase className="h-5 w-5" />
                Strategic Consultation
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps<PageProps> = async () => {
  try {
    // If getAllFrameworks exists, use it. Otherwise, use local data.
    let frameworks: Framework[] = [];
    
    // Try to import the function dynamically
    try {
      const module = await import('@/lib/resources/strategic-frameworks');
      if (module.getAllFrameworks) {
        frameworks = module.getAllFrameworks();
      } else {
        frameworks = LOCAL_FRAMEWORKS;
      }
    } catch {
      frameworks = LOCAL_FRAMEWORKS;
    }

    // Extract categories and tags
    const categories = [...new Set(frameworks.map(f => f.category).filter(Boolean))] as string[];
    const allTags = frameworks.flatMap(f => f.tags || []);
    const tags = [...new Set(allTags)].slice(0, 20);

    return {
      props: { 
        frameworks,
        categories,
        tags
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Error generating frameworks page:", error);
    
    return {
      props: { 
        frameworks: LOCAL_FRAMEWORKS,
        categories: [],
        tags: []
      },
      revalidate: 3600,
    };
  }
};

export default StrategicFrameworksLibraryPage;