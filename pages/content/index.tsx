// pages/content/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Filter,
  ChevronRight,
  BookOpen,
  Download,
  Calendar,
  FileText,
  Crown,
  BookMarked,
  Sparkles,
  Palette,
  Target,
  Zap,
  Layers,
  X,
} from "lucide-react";

import Layout from "@/components/Layout";
import {
  getPublishedDocumentsByType,
  getCardPropsForDocument,
  type ContentlayerCardProps,
  type DocKind,
} from "@/lib/contentlayer-helper";

type ContentPageProps = {
  docsByType: Record<DocKind, ContentlayerCardProps[]>;
};

// -----------------------------
// Type Configuration - Refined Brand Identity
// -----------------------------

const TYPE_CONFIG: Record<DocKind, {
  label: string;
  icon: React.ReactNode;
  gradient: string;
  accent: string;
  bg: string;
  border: string;
}> = {
  post: {
    label: "Essays",
    icon: <FileText className="h-4 w-4" />,
    gradient: "from-amber-50 to-amber-100/50",
    accent: "text-amber-800",
    bg: "bg-amber-50/80",
    border: "border-amber-200/60",
  },
  canon: {
    label: "Canon",
    icon: <Crown className="h-4 w-4" />,
    gradient: "from-yellow-50 to-yellow-100/50",
    accent: "text-yellow-900",
    bg: "bg-yellow-50/80",
    border: "border-yellow-300/60",
  },
  resource: {
    label: "Resources",
    icon: <Layers className="h-4 w-4" />,
    gradient: "from-emerald-50 to-emerald-100/50",
    accent: "text-emerald-800",
    bg: "bg-emerald-50/80",
    border: "border-emerald-200/60",
  },
  download: {
    label: "Downloads",
    icon: <Download className="h-4 w-4" />,
    gradient: "from-blue-50 to-blue-100/50",
    accent: "text-blue-800",
    bg: "bg-blue-50/80",
    border: "border-blue-200/60",
  },
  print: {
    label: "Prints",
    icon: <Palette className="h-4 w-4" />,
    gradient: "from-rose-50 to-rose-100/50",
    accent: "text-rose-800",
    bg: "bg-rose-50/80",
    border: "border-rose-200/60",
  },
  book: {
    label: "Books",
    icon: <BookMarked className="h-4 w-4" />,
    gradient: "from-violet-50 to-violet-100/50",
    accent: "text-violet-800",
    bg: "bg-violet-50/80",
    border: "border-violet-200/60",
  },
  event: {
    label: "Events",
    icon: <Calendar className="h-4 w-4" />,
    gradient: "from-cyan-50 to-cyan-100/50",
    accent: "text-cyan-800",
    bg: "bg-cyan-50/80",
    border: "border-cyan-200/60",
  },
  short: {
    label: "Shorts",
    icon: <Zap className="h-4 w-4" />,
    gradient: "from-orange-50 to-orange-100/50",
    accent: "text-orange-800",
    bg: "bg-orange-50/80",
    border: "border-orange-200/60",
  },
  strategy: {
    label: "Strategy",
    icon: <Target className="h-4 w-4" />,
    gradient: "from-teal-50 to-teal-100/50",
    accent: "text-teal-800",
    bg: "bg-teal-50/80",
    border: "border-teal-200/60",
  },
};

// -----------------------------
// Intelligent Image Component
// -----------------------------

const AdaptiveImage: React.FC<{
  src: string;
  alt: string;
  aspectRatio?: string;
}> = ({ src, alt, aspectRatio = "16/10" }) => {
  const [imageError, setImageError] = React.useState(false);
  const [imageDimensions, setImageDimensions] = React.useState<{
    width: number;
    height: number;
  } | null>(null);

  React.useEffect(() => {
    if (imageError) return;
    
    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      setImageDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    };
    img.onerror = () => {
      setImageError(true);
    };
  }, [src, imageError]);

  const fallbackSrc = "/assets/images/writing-desk.webp";
  const displaySrc = imageError ? fallbackSrc : src;

  // Intelligent object-fit based on image dimensions
  const getObjectFit = () => {
    if (!imageDimensions) return "object-cover";
    
    const ratio = imageDimensions.width / imageDimensions.height;
    const targetRatio = aspectRatio === "16/10" ? 1.6 : 
                        aspectRatio === "1/1" ? 1 : 
                        aspectRatio === "4/3" ? 1.33 : 1.6;
    
    // If image is much wider or taller than container, contain it
    if (Math.abs(ratio - targetRatio) > 0.5) {
      return "object-contain";
    }
    
    return "object-cover";
  };

  return (
    <div className="relative w-full h-full bg-gradient-to-br from-neutral-50 to-neutral-100">
      <Image
        src={displaySrc}
        alt={alt}
        fill
        className={`${getObjectFit()} transition-all duration-700 group-hover:scale-[1.03]`}
        sizes="(min-width: 1280px) 400px, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
        onError={() => setImageError(true)}
        priority={false}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
};

// -----------------------------
// Page Component
// -----------------------------

const ContentIndexPage: NextPage<ContentPageProps> = ({ docsByType }) => {
  const [filter, setFilter] = React.useState<DocKind | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const allDocs = React.useMemo(() => {
    return (Object.keys(docsByType) as DocKind[]).flatMap((k) => docsByType[k]);
  }, [docsByType]);

  const filteredDocs = React.useMemo(() => {
    const source = filter === "all" ? allDocs : docsByType[filter];
    if (!searchQuery.trim()) return source;

    const query = searchQuery.toLowerCase();
    return source.filter((doc) =>
      doc.title.toLowerCase().includes(query) ||
      (doc.excerpt || "").toLowerCase().includes(query) ||
      (doc.description || "").toLowerCase().includes(query) ||
      (doc.tags || []).some(tag => tag.toLowerCase().includes(query))
    );
  }, [allDocs, docsByType, filter, searchQuery]);

  const typeCounts = React.useMemo(() => {
    const counts: Record<DocKind | "all", number> = { all: allDocs.length };
    (Object.keys(docsByType) as DocKind[]).forEach((k) => {
      counts[k] = docsByType[k].length;
    });
    return counts;
  }, [docsByType, allDocs]);

  const allKinds: DocKind[] = [
    "post", "canon", "resource", "download", 
    "print", "book", "event", "short", "strategy"
  ];

  return (
    <Layout title="Archive">
      <main className="min-h-screen bg-white">
        {/* Refined Hero */}
        <div className="relative border-b border-neutral-200/80 bg-white">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.04)_0%,transparent_50%)]" />
          
          <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-neutral-200/60 bg-white/80 px-4 py-2 shadow-sm backdrop-blur-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-neutral-900 animate-pulse" />
                <span className="text-xs font-medium uppercase tracking-[0.15em] text-neutral-700">
                  Complete Archive
                </span>
              </div>

              <h1 className="mb-6 font-serif text-6xl font-light tracking-tight text-neutral-900 lg:text-7xl">
                The Archive
              </h1>

              <p className="mb-10 text-lg leading-relaxed text-neutral-600">
                A comprehensive collection of writings, resources, and materials. 
                Everything organized and accessible in one place.
              </p>

              {/* Refined Search */}
              <div className="relative">
                <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search titles, content, and tags..."
                  className="w-full rounded-2xl border border-neutral-300/80 bg-white py-4 pl-14 pr-14 text-base text-neutral-900 placeholder:text-neutral-400 shadow-sm outline-none transition-all focus:border-neutral-400 focus:shadow-md focus:ring-4 focus:ring-neutral-100/50"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-5 top-1/2 -translate-y-1/2 flex h-7 w-7 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition-colors hover:bg-neutral-200 hover:text-neutral-700"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
          {/* Filter System */}
          <div className="mb-12">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              {/* Filter Pills */}
              <div className="flex-1">
                <div className="flex flex-wrap gap-2.5">
                  {/* All */}
                  <button
                    onClick={() => setFilter("all")}
                    className={`group relative rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200 ${
                      filter === "all"
                        ? "bg-neutral-900 text-white shadow-lg shadow-neutral-900/20"
                        : "bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
                    }`}
                  >
                    <span className="relative z-10">All Content</span>
                    <span className={`ml-2 text-xs ${filter === "all" ? "text-neutral-300" : "text-neutral-400"}`}>
                      {typeCounts.all}
                    </span>
                  </button>

                  {/* Type Filters */}
                  {allKinds.map((kind) => {
                    const config = TYPE_CONFIG[kind];
                    const active = filter === kind;
                    const count = typeCounts[kind];
                    
                    if (count === 0) return null;

                    return (
                      <button
                        key={kind}
                        onClick={() => setFilter(kind)}
                        className={`group relative flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-medium transition-all duration-200 ${
                          active
                            ? `${config.bg} ${config.accent} ${config.border} border shadow-sm`
                            : "bg-white text-neutral-700 border border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
                        }`}
                      >
                        <div className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                          active ? config.bg : "bg-neutral-50 group-hover:bg-neutral-100"
                        }`}>
                          {React.cloneElement(config.icon as React.ReactElement, {
                            className: `h-4 w-4 ${active ? config.accent : "text-neutral-500"}`
                          })}
                        </div>
                        <span className="font-medium">{config.label}</span>
                        <span className={`text-xs ${active ? "opacity-70" : "text-neutral-400"}`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Results Summary */}
              <div className="flex items-center gap-2 text-sm text-neutral-500 border-l border-neutral-200 pl-6">
                <span className="font-semibold text-neutral-900">{filteredDocs.length}</span>
                <span>of</span>
                <span className="font-semibold text-neutral-900">{typeCounts.all}</span>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <AnimatePresence mode="wait">
            {filteredDocs.length > 0 ? (
              <motion.div
                key={filter}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filteredDocs.map((doc) => {
                  const config = TYPE_CONFIG[doc.type as DocKind];
                  const dateObj = doc.date ? new Date(doc.date) : null;

                  return (
                    <motion.div
                      key={`${doc.type}:${doc.slug}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, ease: "easeOut" }}
                    >
                      <Link
                        href={doc.href}
                        className="group block h-full"
                      >
                        <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-sm transition-all duration-300 hover:shadow-xl hover:border-neutral-300 hover:-translate-y-1">
                          {/* Adaptive Image Container */}
                          <div className="relative aspect-[16/10] w-full overflow-hidden">
                            <AdaptiveImage
                              src={doc.image || "/assets/images/writing-desk.webp"}
                              alt={doc.title}
                              aspectRatio="16/10"
                            />
                          </div>

                          {/* Card Content */}
                          <div className="flex flex-1 flex-col p-6">
                            {/* Meta Row */}
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <span className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium ${config.bg} ${config.accent} ${config.border} border`}>
                                <div className="h-1.5 w-1.5 rounded-full bg-current" />
                                {config.label}
                              </span>
                              {dateObj && (
                                <time className="text-xs font-medium text-neutral-500">
                                  {dateObj.toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                  })}
                                </time>
                              )}
                            </div>

                            {/* Title */}
                            <h3 className="mb-3 font-serif text-xl font-normal leading-snug text-neutral-900 group-hover:text-neutral-700 transition-colors">
                              {doc.title}
                            </h3>

                            {/* Excerpt */}
                            {(doc.excerpt || doc.description) && (
                              <p className="mb-4 flex-1 text-sm leading-relaxed text-neutral-600 line-clamp-3">
                                {doc.excerpt || doc.description}
                              </p>
                            )}

                            {/* Tags */}
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="mb-5 flex flex-wrap gap-2">
                                {doc.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-lg bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-600 border border-neutral-200/50"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {doc.tags.length > 3 && (
                                  <span className="rounded-lg bg-neutral-50 px-2.5 py-1 text-xs text-neutral-400 border border-neutral-200/50">
                                    +{doc.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Footer */}
                            <div className="flex items-center justify-between border-t border-neutral-100 pt-4 mt-auto">
                              {doc.downloadUrl ? (
                                <div className="flex items-center gap-2 text-xs font-medium text-blue-700">
                                  <Download className="h-3.5 w-3.5" />
                                  <span>Available</span>
                                </div>
                              ) : (
                                <div />
                              )}
                              
                              <div className={`flex items-center gap-1.5 text-sm font-medium ${config.accent} group-hover:gap-2 transition-all`}>
                                <span className="text-xs">View</span>
                                <ChevronRight className="h-4 w-4" />
                              </div>
                            </div>
                          </div>
                        </article>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              // Empty State
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex items-center justify-center rounded-2xl border-2 border-dashed border-neutral-200 bg-neutral-50/30 p-16"
              >
                <div className="max-w-md text-center">
                  <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white border border-neutral-200 shadow-sm">
                    <Search className="h-10 w-10 text-neutral-300" />
                  </div>
                  <h3 className="mb-3 font-serif text-2xl font-light text-neutral-900">
                    No results found
                  </h3>
                  <p className="mb-8 text-neutral-600">
                    Try adjusting your search terms or selected filter.
                  </p>
                  {(searchQuery || filter !== "all") && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setFilter("all");
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-neutral-300 bg-white px-6 py-3 text-sm font-medium text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 hover:shadow"
                    >
                      <X className="h-4 w-4" />
                      Clear all filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </Layout>
  );
};

// -----------------------------
// Data Fetching
// -----------------------------

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  const publishedBuckets = getPublishedDocumentsByType();

  const docsByType: Record<DocKind, ContentlayerCardProps[]> = {
    post: [], canon: [], resource: [], download: [], print: [],
    book: [], event: [], short: [], strategy: [],
  };

  (Object.keys(publishedBuckets) as DocKind[]).forEach((kind) => {
    docsByType[kind] = publishedBuckets[kind].map(getCardPropsForDocument);
  });

  // Production logging
  console.log('[Archive] Content summary:', {
    posts: docsByType.post.length,
    canon: docsByType.canon.length,
    resources: docsByType.resource.length,
    downloads: docsByType.download.length,
    prints: docsByType.print.length,
    books: docsByType.book.length,
    events: docsByType.event.length,
    shorts: docsByType.short.length,
    strategies: docsByType.strategy.length,
    total: Object.values(docsByType).flat().length,
  });

  return {
    props: { docsByType },
    revalidate: 60,
  };
};

export default ContentIndexPage;