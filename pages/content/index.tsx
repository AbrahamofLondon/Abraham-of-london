// pages/content/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import Layout from "@/components/Layout";
import { 
  Search, Filter, ChevronRight, BookOpen, Download, Calendar, 
  FileText, Star, Layers, BookMarked, Gem, Crown, Scroll, 
  Feather, Briefcase, Palette, Trophy, Zap, Globe, Lock 
} from "lucide-react";

import {
  getPublishedDocuments,
  getCardPropsForDocument,
  type ContentlayerCardProps,
} from "@/lib/contentlayer-helper";

// -----------------------------
// Types
// -----------------------------

type UiDocType =
  | "post"
  | "short"
  | "book"
  | "download"
  | "print"
  | "resource"
  | "canon"
  | "event"
  | "strategy";

type UiDoc = ContentlayerCardProps & {
  uiType: UiDocType;
};

// -----------------------------
// Premium Type Configuration
// -----------------------------

const TYPE_CONFIG: Record<UiDocType, {
  label: string;
  icon: React.ReactNode;
  iconLarge: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  gradient: string;
  cardGradient: string;
  badgeStyle: string;
  casing: "uppercase" | "lowercase" | "capitalize";
  accentElement: React.ReactNode;
  description: string;
}> = {
  post: {
    label: "Essays",
    icon: <Scroll className="h-4 w-4" />,
    iconLarge: <Scroll className="h-6 w-6" />,
    color: "text-amber-300",
    bgColor: "bg-amber-900/20",
    borderColor: "border-amber-800/40",
    gradient: "from-amber-900/30 via-amber-900/10 to-transparent",
    cardGradient: "linear-gradient(135deg, rgba(180, 83, 9, 0.1) 0%, rgba(120, 53, 15, 0.05) 100%)",
    badgeStyle: "bg-gradient-to-r from-amber-900/40 to-amber-800/30 border-amber-700/50",
    casing: "capitalize",
    accentElement: <div className="absolute -top-1 -right-1 h-8 w-8 rounded-full bg-amber-900/20 blur-sm" />,
    description: "Thoughtful long-form explorations"
  },
  short: {
    label: "Shorts",
    icon: <Feather className="h-4 w-4" />,
    iconLarge: <Feather className="h-6 w-6" />,
    color: "text-emerald-300",
    bgColor: "bg-emerald-900/20",
    borderColor: "border-emerald-800/40",
    gradient: "from-emerald-900/30 via-emerald-900/10 to-transparent",
    cardGradient: "linear-gradient(135deg, rgba(6, 78, 59, 0.1) 0%, rgba(4, 47, 46, 0.05) 100%)",
    badgeStyle: "bg-gradient-to-r from-emerald-900/40 to-emerald-800/30 border-emerald-700/50",
    casing: "uppercase",
    accentElement: <div className="absolute -top-2 -right-2 h-10 w-10 rounded-full bg-emerald-900/20 blur-lg" />,
    description: "Brevity with precision"
  },
  book: {
    label: "Books",
    icon: <BookMarked className="h-4 w-4" />,
    iconLarge: <BookMarked className="h-6 w-6" />,
    color: "text-violet-300",
    bgColor: "bg-violet-900/20",
    borderColor: "border-violet-800/40",
    gradient: "from-violet-900/30 via-violet-900/10 to-transparent",
    cardGradient: "linear-gradient(135deg, rgba(76, 29, 149, 0.1) 0%, rgba(46, 16, 101, 0.05) 100%)",
    badgeStyle: "bg-gradient-to-r from-violet-900/40 to-violet-800/30 border-violet-700/50",
    casing: "capitalize",
    accentElement: <div className="absolute top-2 left-2 h-6 w-6 rotate-45 bg-violet-900/30 blur-md" />,
    description: "Definitive collected works"
  },
  canon: {
    label: "Canon",
    icon: <Crown className="h-4 w-4" />,
    iconLarge: <Crown className="h-6 w-6" />,
    color: "text-gold",
    bgColor: "bg-gold/10",
    borderColor: "border-gold/40",
    gradient: "from-gold/20 via-gold/5 to-transparent",
    cardGradient: "linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(180, 140, 40, 0.05) 100%)",
    badgeStyle: "bg-gradient-to-r from-gold/20 to-gold/10 border-gold/30 text-gold",
    casing: "uppercase",
    accentElement: (
      <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-transparent" />
    ),
    description: "Foundational principles"
  },
  resource: {
    label: "Resources",
    icon: <Briefcase className="h-4 w-4" />,
    iconLarge: <Briefcase className="h-6 w-6" />,
    color: "text-cyan-300",
    bgColor: "bg-cyan-900/20",
    borderColor: "border-cyan-800/40",
    gradient: "from-cyan-900/30 via-cyan-900/10 to-transparent",
    cardGradient: "linear-gradient(135deg, rgba(14, 116, 144, 0.1) 0%, rgba(8, 51, 68, 0.05) 100%)",
    badgeStyle: "bg-gradient-to-r from-cyan-900/40 to-cyan-800/30 border-cyan-700/50",
    casing: "capitalize",
    accentElement: <div className="absolute -bottom-2 -left-2 h-12 w-12 rounded-full bg-cyan-900/10 blur-lg" />,
    description: "Practical tools & references"
  },
  download: {
    label: "Downloads",
    icon: <Download className="h-4 w-4" />,
    iconLarge: <Download className="h-6 w-6" />,
    color: "text-rose-300",
    bgColor: "bg-rose-900/20",
    borderColor: "border-rose-800/40",
    gradient: "from-rose-900/30 via-rose-900/10 to-transparent",
    cardGradient: "linear-gradient(135deg, rgba(190, 18, 60, 0.1) 0%, rgba(136, 19, 55, 0.05) 100%)",
    badgeStyle: "bg-gradient-to-r from-rose-900/40 to-rose-800/30 border-rose-700/50",
    casing: "uppercase",
    accentElement: <div className="absolute top-0 right-0 h-16 w-16 bg-rose-900/10 rounded-full blur-xl" />,
    description: "Digital assets & files"
  },
  print: {
    label: "Prints",
    icon: <Palette className="h-4 w-4" />,
    iconLarge: <Palette className="h-6 w-6" />,
    color: "text-orange-300",
    bgColor: "bg-orange-900/20",
    borderColor: "border-orange-800/40",
    gradient: "from-orange-900/30 via-orange-900/10 to-transparent",
    cardGradient: "linear-gradient(135deg, rgba(194, 65, 12, 0.1) 0%, rgba(154, 52, 18, 0.05) 100%)",
    badgeStyle: "bg-gradient-to-r from-orange-900/40 to-orange-800/30 border-orange-700/50",
    casing: "capitalize",
    accentElement: <div className="absolute -inset-4 bg-orange-900/5 rounded-full blur-2xl" />,
    description: "Tangible premium materials"
  },
  event: {
    label: "Events",
    icon: <Trophy className="h-4 w-4" />,
    iconLarge: <Trophy className="h-6 w-6" />,
    color: "text-blue-300",
    bgColor: "bg-blue-900/20",
    borderColor: "border-blue-800/40",
    gradient: "from-blue-900/30 via-blue-900/10 to-transparent",
    cardGradient: "linear-gradient(135deg, rgba(29, 78, 216, 0.1) 0%, rgba(30, 58, 138, 0.05) 100%)",
    badgeStyle: "bg-gradient-to-r from-blue-900/40 to-blue-800/30 border-blue-700/50",
    casing: "uppercase",
    accentElement: <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-20 w-20 bg-blue-900/5 rounded-full blur-2xl" />,
    description: "Exclusive experiences"
  },
  strategy: {
    label: "Strategy",
    icon: <Zap className="h-4 w-4" />,
    iconLarge: <Zap className="h-6 w-6" />,
    color: "text-purple-300",
    bgColor: "bg-purple-900/20",
    borderColor: "border-purple-800/40",
    gradient: "from-purple-900/30 via-purple-900/10 to-transparent",
    cardGradient: "linear-gradient(135deg, rgba(107, 33, 168, 0.1) 0%, rgba(88, 28, 135, 0.05) 100%)",
    badgeStyle: "bg-gradient-to-r from-purple-900/40 to-purple-800/30 border-purple-700/50",
    casing: "uppercase",
    accentElement: <div className="absolute bottom-0 left-0 h-8 w-8 bg-purple-900/20 rounded-tr-full blur-md" />,
    description: "Actionable frameworks"
  },
};

const FILTERS: Array<{ key: "all" | UiDocType; label: string; icon: React.ReactNode }> = [
  { key: "all", label: "All Collections", icon: <Globe className="h-4 w-4" /> },
  { key: "post", label: "Essays", icon: TYPE_CONFIG.post.icon },
  { key: "short", label: "Shorts", icon: TYPE_CONFIG.short.icon },
  { key: "book", label: "Books", icon: TYPE_CONFIG.book.icon },
  { key: "canon", label: "Canon", icon: TYPE_CONFIG.canon.icon },
  { key: "resource", label: "Resources", icon: TYPE_CONFIG.resource.icon },
  { key: "download", label: "Downloads", icon: TYPE_CONFIG.download.icon },
  { key: "print", label: "Prints", icon: TYPE_CONFIG.print.icon },
  { key: "event", label: "Events", icon: TYPE_CONFIG.event.icon },
  { key: "strategy", label: "Strategy", icon: TYPE_CONFIG.strategy.icon },
];

// -----------------------------
// Cover resolver (unchanged)
// -----------------------------

type CoverKey = `${UiDocType}:${string}`;

const COVER_OVERRIDES: Record<CoverKey, string> = {
  "event:founders-salon": "/assets/images/events/founders-salon.jpg",
  "event:leadership-workshop": "/assets/images/events/leadership-workshop.jpg",
  "resource:canon-master-index-preview": "/assets/images/canon/canon-resources.jpg",
  "resource:canon-campaign": "/assets/images/canon/canon-campaign-cover.jpg",
  "resource:canon-introduction-letter": "/assets/images/canon/canon-intro-letter-cover.jpg",
};

const TYPE_FOLDER: Record<UiDocType, string> = {
  post: "/assets/images/blog",
  short: "/assets/images/blog",
  book: "/assets/images/books",
  download: "/assets/images/downloads",
  print: "/assets/images/prints",
  resource: "/assets/images/resources",
  canon: "/assets/images/canon",
  event: "/assets/images/events",
  strategy: "/assets/images/strategy",
};

const TYPE_DEFAULT_COVER: Record<UiDocType, string> = {
  post: "/assets/images/blog/default-blog-cover.jpg",
  short: "/assets/images/blog/default-blog-cover.jpg",
  book: "/assets/images/default-book.jpg",
  download: "/assets/images/downloads/downloadsgrid.jpg",
  print: "/assets/images/downloads/downloadsgrid.jpg",
  resource: "/assets/images/canon/canon-resources.jpg",
  canon: "/assets/images/canon/canon-resources.jpg",
  event: "/assets/images/blog/default-blog-cover.jpg",
  strategy: "/assets/images/blog/default-blog-cover.jpg",
};

function normalisePublicPath(input: string): string {
  let s = String(input || "").trim();
  if (!s) return s;
  if (s.startsWith("public/")) s = s.replace(/^public\//, "");
  if (!s.startsWith("/")) s = `/${s}`;
  return s;
}

function resolveCover(doc: UiDoc): string {
  const key = `${doc.uiType}:${doc.slug}` as CoverKey;
  const forced = COVER_OVERRIDES[key];
  if (forced) return normalisePublicPath(forced);

  const raw = doc.image ? normalisePublicPath(doc.image) : "";
  if (raw) return raw;

  const base = `${TYPE_FOLDER[doc.uiType]}/${doc.slug}`;
  const candidates = [`${base}.webp`, `${base}.jpg`, `${base}.png`];
  return candidates[0] || TYPE_DEFAULT_COVER[doc.uiType];
}

function toUiType(type: string): UiDocType {
  switch (type) {
    case "Post": return "post";
    case "Short": return "short";
    case "Book": return "book";
    case "Download": return "download";
    case "Print": return "print";
    case "Resource": return "resource";
    case "Canon": return "canon";
    case "Event": return "event";
    case "Strategy": return "strategy";
    default: return "post";
  }
}

// -----------------------------
// Page Component
// -----------------------------

type Props = {
  docs: UiDoc[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const docs = getPublishedDocuments()
    .map(getCardPropsForDocument)
    .map((d) => ({
      ...d,
      uiType: toUiType(d.type),
    }))
    .map((d) => ({
      ...d,
      url: d.url || `/content/${d.slug}`,
      image: d.image ? normalisePublicPath(d.image) : null,
    }));

  return {
    props: {
      docs: docs as UiDoc[],
    },
  };
};

const ContentIndexPage: NextPage<Props> = ({ docs }) => {
  const [q, setQ] = React.useState("");
  const [filter, setFilter] = React.useState<"all" | UiDocType>("all");
  const [isFilterOpen, setIsFilterOpen] = React.useState(false);

  const filteredDocs = React.useMemo(() => {
    const query = q.trim().toLowerCase();
    return docs
      .filter((d) => filter === "all" ? true : d.uiType === filter)
      .filter((d) => {
        if (!query) return true;
        const text = [
          d.title,
          d.subtitle,
          d.description,
          d.excerpt,
          (d.tags || []).join(" "),
          d.slug,
          d.type,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return text.includes(query);
      });
  }, [docs, q, filter]);

  const typeCounts = React.useMemo(() => {
    const counts: Record<UiDocType, number> = {
      post: 0, short: 0, book: 0, download: 0,
      print: 0, resource: 0, canon: 0, event: 0, strategy: 0
    };
    docs.forEach(doc => {
      counts[doc.uiType] = (counts[doc.uiType] || 0) + 1;
    });
    return counts;
  }, [docs]);

  return (
    <Layout title="Content Library">
      <main className="min-h-screen bg-black">
        {/* Premium Hero Section */}
        <div className="relative overflow-hidden border-b border-white/[0.08]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent" />
          <div className="absolute top-0 right-0 h-64 w-64 translate-x-32 -translate-y-32 rounded-full bg-gold/5 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              {/* Premium Badge */}
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/[0.12] bg-white/[0.03] px-4 py-2.5 backdrop-blur-sm">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-gold/20 to-gold/10">
                  <Lock className="h-3 w-3 text-gold" />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.3em] text-gold">
                    Curated Archive
                  </span>
                  <span className="mx-2 h-1 w-1 rounded-full bg-white/20" />
                  <span className="text-xs text-gray-400">
                    {docs.length} exclusive pieces
                  </span>
                </div>
              </div>
              
              {/* Main Title with Premium Details */}
              <div className="mb-8">
                <h1 className="mb-4 font-serif text-5xl font-light tracking-tight text-cream sm:text-6xl">
                  The Archive
                </h1>
                <div className="h-px w-24 bg-gradient-to-r from-gold/50 to-transparent mb-6" />
                <p className="max-w-2xl text-lg text-gray-300 leading-relaxed">
                  A meticulously organized collection where each content type has been 
                  <span className="text-gold font-medium"> distinctly crafted</span> with unique visual identity and purpose.
                </p>
              </div>

              {/* Premium Search */}
              <div className="relative max-w-2xl">
                <div className="absolute left-5 top-1/2 -translate-y-1/2">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search across all collections..."
                  className="w-full rounded-2xl border border-white/[0.12] bg-white/[0.03] py-4 pl-12 pr-4 text-sm text-cream placeholder:text-gray-400 outline-none backdrop-blur-sm transition-all focus:border-gold/50 focus:bg-white/[0.05] focus:shadow-[0_0_40px_rgba(212,175,55,0.15)]"
                />
                {q && (
                  <button
                    onClick={() => setQ("")}
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
          <div className="flex flex-col lg:flex-row gap-12">
            {/* Premium Sidebar Filter */}
            <aside className={`lg:w-80 lg:block ${isFilterOpen ? 'block' : 'hidden'}`}>
              <div className="sticky top-8 space-y-8">
                {/* Filter Header */}
                <div>
                  <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-400">
                      Collections
                    </h3>
                    <span className="rounded-full bg-white/[0.03] px-2.5 py-1 text-xs text-gray-400">
                      {filteredDocs.length}/{docs.length}
                    </span>
                  </div>
                  
                  {/* Premium Filter Buttons */}
                  <div className="space-y-2">
                    {FILTERS.map((f) => {
                      const config = f.key === "all" 
                        ? { 
                            color: "text-gray-300", 
                            bgColor: "bg-white/[0.03]",
                            borderColor: "border-white/[0.12]",
                            casing: "capitalize" as const
                          } 
                        : TYPE_CONFIG[f.key];
                      
                      const active = f.key === filter;
                      const count = f.key === "all" ? docs.length : typeCounts[f.key];
                      
                      return (
                        <button
                          key={f.key}
                          onClick={() => {
                            setFilter(f.key);
                            setIsFilterOpen(false);
                          }}
                          className={`group relative flex w-full items-center justify-between rounded-xl px-4 py-3.5 transition-all duration-300 ${
                            active 
                              ? `${config.bgColor} border ${config.borderColor} shadow-lg shadow-black/20` 
                              : 'border border-transparent hover:border-white/[0.08] hover:bg-white/[0.03]'
                          }`}
                          type="button"
                        >
                          {/* Accent glow for active */}
                          {active && (
                            <div className={`absolute inset-0 rounded-xl ${config.gradient} opacity-50`} />
                          )}
                          
                          <div className="relative z-10 flex items-center gap-4">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              active 
                                ? 'bg-white/10 backdrop-blur-sm' 
                                : 'bg-white/[0.05] group-hover:bg-white/10'
                            } transition-colors`}>
                              {React.cloneElement(f.icon as React.ReactElement, {
                                className: `h-4 w-4 ${active ? config.color : 'text-gray-400 group-hover:text-gray-300'}`
                              })}
                            </div>
                            <div className="text-left">
                              <div className={`text-sm font-medium ${
                                active ? config.color : 'text-gray-300'
                              } ${config.casing}`}>
                                {f.label}
                              </div>
                              <div className="text-xs text-gray-400">
                                {count} items
                              </div>
                            </div>
                          </div>
                          
                          <div className="relative z-10">
                            {active ? (
                              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-white/20 to-white/10">
                                <div className="h-1.5 w-1.5 rounded-full bg-white" />
                              </div>
                            ) : (
                              <ChevronRight className="h-4 w-4 text-gray-500 group-hover:text-gray-400" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Premium Stats Card */}
                <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.02] p-5 backdrop-blur-sm">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-gold/20 to-gold/10">
                      <Gem className="h-4 w-4 text-gold" />
                    </div>
                    <h4 className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
                      Collection Metrics
                    </h4>
                  </div>
                  
                  <div className="space-y-5">
                    <div>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-gray-300">Total Archive</span>
                        <span className="font-medium text-cream">{docs.length}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-gold/60 to-gold/40" 
                          style={{ width: '100%' }}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <div className="mb-2 flex justify-between text-sm">
                        <span className="text-gray-300">Selected View</span>
                        <span className="font-medium text-cream">{filteredDocs.length}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.05]">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500/60 to-blue-500/40" 
                          style={{ width: `${(filteredDocs.length / docs.length) * 100}%` }}
                        />
                      </div>
                    </div>
                    
                    {filter !== "all" && typeCounts[filter] > 0 && (
                      <div className="rounded-lg border border-white/[0.08] bg-white/[0.02] p-3">
                        <div className="text-xs text-gray-400 mb-1">Current Collection</div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`h-2 w-2 rounded-full ${TYPE_CONFIG[filter].color.replace('text-', 'bg-')}`} />
                            <span className={`text-sm font-medium ${TYPE_CONFIG[filter].color}`}>
                              {TYPE_CONFIG[filter].label}
                            </span>
                          </div>
                          <div className="text-sm text-gray-300">
                            {((typeCounts[filter] / docs.length) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content Grid */}
            <div className="flex-1">
              {/* Active Collection Header */}
              {filter !== "all" && (
                <div className={`mb-10 overflow-hidden rounded-2xl border ${TYPE_CONFIG[filter].borderColor} p-8 backdrop-blur-sm`}>
                  <div className={`absolute inset-0 ${TYPE_CONFIG[filter].gradient}`} />
                  <div className="relative z-10">
                    <div className="mb-6 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-16 w-16 items-center justify-center rounded-2xl ${TYPE_CONFIG[filter].bgColor} border ${TYPE_CONFIG[filter].borderColor}`}>
                          {TYPE_CONFIG[filter].iconLarge}
                        </div>
                        <div>
                          <h2 className={`font-serif text-3xl font-light ${TYPE_CONFIG[filter].color} mb-1 ${TYPE_CONFIG[filter].casing}`}>
                            {TYPE_CONFIG[filter].label}
                          </h2>
                          <p className="text-gray-300">{TYPE_CONFIG[filter].description}</p>
                        </div>
                      </div>
                      <div className={`rounded-full ${TYPE_CONFIG[filter].badgeStyle} border px-4 py-2 text-sm font-medium ${TYPE_CONFIG[filter].color}`}>
                        {typeCounts[filter]} items
                      </div>
                    </div>
                    <div className="h-px bg-gradient-to-r from-white/10 via-white/5 to-transparent" />
                  </div>
                </div>
              )}

              {/* Content Grid with Premium Cards */}
              {filteredDocs.length > 0 ? (
                <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredDocs.map((doc) => {
                    const cover = resolveCover(doc);
                    const config = TYPE_CONFIG[doc.uiType];

                    return (
                      <Link
                        key={`${doc.uiType}:${doc.slug}`}
                        href={doc.url || `/content/${doc.slug}`}
                        className="group relative overflow-hidden rounded-3xl border border-white/[0.08] transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl"
                        style={{ background: config.cardGradient }}
                      >
                        {/* Type-specific accent elements */}
                        {config.accentElement}
                        
                        {/* Premium Badge */}
                        <div className="absolute left-4 top-4 z-20">
                          <div className={`flex items-center gap-2 rounded-full ${config.badgeStyle} border px-3 py-1.5 backdrop-blur-sm`}>
                            <div className="h-2 w-2 rounded-full bg-current opacity-70" />
                            <span className={`text-xs font-semibold ${config.color} ${config.casing}`}>
                              {doc.uiType}
                            </span>
                          </div>
                        </div>

                        {/* Image Container with Premium Overlay */}
                        <div className="relative aspect-[16/9] w-full overflow-hidden">
                          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                          <Image
                            src={cover}
                            alt={doc.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                            sizes="(min-width: 1280px) 384px, (min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw"
                          />
                          {/* Shine effect */}
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10 p-6">
                          <h3 className={`mb-3 font-serif text-xl font-light leading-tight text-cream group-hover:${config.color} transition-colors`}>
                            {doc.title}
                          </h3>

                          {(doc.excerpt || doc.description) && (
                            <p className="mb-4 line-clamp-2 text-sm text-gray-300 leading-relaxed">
                              {doc.excerpt || doc.description}
                            </p>
                          )}

                          {/* Premium Tags */}
                          {(doc.tags && doc.tags.length > 0) && (
                            <div className="mb-5 flex flex-wrap gap-2">
                              {doc.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full border border-white/[0.1] bg-white/[0.05] px-2.5 py-1 text-xs text-gray-300 backdrop-blur-sm"
                                >
                                  {tag}
                                </span>
                              ))}
                              {doc.tags.length > 3 && (
                                <span className="rounded-full border border-white/[0.1] bg-white/[0.05] px-2.5 py-1 text-xs text-gray-400 backdrop-blur-sm">
                                  +{doc.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Premium Footer */}
                          <div className="flex items-center justify-between border-t border-white/[0.1] pt-4">
                            <div className="flex items-center gap-2">
                              <div className={`h-2 w-2 rounded-full ${config.color.replace('text-', 'bg-')}`} />
                              <span className="text-xs text-gray-400">
                                {doc.date ? new Date(doc.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                }) : 'Undated'}
                              </span>
                            </div>
                            <div className={`flex items-center gap-2 text-sm font-medium ${config.color}`}>
                              <span className="text-xs">Explore</span>
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-current/10">
                                <ChevronRight className="h-3 w-3" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.02] to-transparent p-16 text-center backdrop-blur-sm">
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
                    {(q || filter !== "all") && (
                      <button
                        onClick={() => {
                          setQ("");
                          setFilter("all");
                        }}
                        className="rounded-xl border border-white/[0.12] bg-white/[0.03] px-6 py-3 text-sm text-gray-300 hover:bg-white/[0.05]"
                      >
                        Reset all filters
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
};

export default ContentIndexPage;