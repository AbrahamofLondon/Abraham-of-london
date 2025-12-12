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
// Premium Type Configuration
// -----------------------------

const TYPE_CONFIG: Record<DocKind, {
  label: string;
  icon: React.ReactNode;
  color: string;
  lightBg: string;
  casing: 'normal' | 'small-caps';
}> = {
  post: {
    label: "Essays",
    icon: <FileText className="h-4 w-4" />,
    color: "text-amber-700",
    lightBg: "bg-amber-50",
    casing: 'normal',
  },
  canon: {
    label: "Canon",
    icon: <Crown className="h-4 w-4" />,
    color: "text-gold",
    lightBg: "bg-gold/10",
    casing: 'small-caps',
  },
  resource: {
    label: "Resources",
    icon: <Layers className="h-4 w-4" />,
    color: "text-emerald-700",
    lightBg: "bg-emerald-50",
    casing: 'normal',
  },
  download: {
    label: "Downloads",
    icon: <Download className="h-4 w-4" />,
    color: "text-blue-700",
    lightBg: "bg-blue-50",
    casing: 'normal',
  },
  print: {
    label: "Prints",
    icon: <Palette className="h-4 w-4" />,
    color: "text-rose-700",
    lightBg: "bg-rose-50",
    casing: 'normal',
  },
  book: {
    label: "Books",
    icon: <BookMarked className="h-4 w-4" />,
    color: "text-violet-700",
    lightBg: "bg-violet-50",
    casing: 'normal',
  },
  event: {
    label: "Events",
    icon: <Calendar className="h-4 w-4" />,
    color: "text-cyan-700",
    lightBg: "bg-cyan-50",
    casing: 'normal',
  },
  short: {
    label: "Shorts",
    icon: <Zap className="h-4 w-4" />,
    color: "text-orange-700",
    lightBg: "bg-orange-50",
    casing: 'normal',
  },
  strategy: {
    label: "Strategy",
    icon: <Target className="h-4 w-4" />,
    color: "text-teal-700",
    lightBg: "bg-teal-50",
    casing: 'normal',
  },
};

// -----------------------------
// Page Component
// -----------------------------

const ContentIndexPage: NextPage<ContentPageProps> = ({ docsByType }) => {
  const [filter, setFilter] = React.useState<DocKind | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  // Flatten all documents for counting and 'all' filter
  const allDocs = React.useMemo(() => {
    return (Object.keys(docsByType) as DocKind[]).flatMap((k) => docsByType[k]);
  }, [docsByType]);

  // Get current filtered documents
  const filteredDocs = React.useMemo(() => {
    const source = filter === "all" ? allDocs : docsByType[filter];
    if (!searchQuery.trim()) return source;

    const query = searchQuery.toLowerCase();
    return source.filter((doc) =>
      doc.title.toLowerCase().includes(query) ||
      (doc.excerpt || "").toLowerCase().includes(query) ||
      (doc.tags || []).some(tag => tag.toLowerCase().includes(query))
    );
  }, [allDocs, docsByType, filter, searchQuery]);

  // Counts for UI
  const typeCounts = React.useMemo(() => {
    const counts: Record<DocKind | "all", number> = { all: allDocs.length };
    (Object.keys(docsByType) as DocKind[]).forEach((k) => {
      counts[k] = docsByType[k].length;
    });
    return counts;
  }, [docsByType, allDocs]);

  const allKinds: DocKind[] = ["post", "canon", "resource", "download", "print", "book", "event", "short", "strategy"];

  return (
    <Layout title="The Archive">
      <main className="min-h-screen bg-white">
        {/* Premium Hero Section */}
        <div className="relative overflow-hidden border-b border-neutral-100 bg-gradient-to-b from-white to-neutral-50/50">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(212,175,55,0.03)_0%,transparent_70%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1.5">
                <Sparkles className="h-3 w-3 text-gold" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-600">
                  Curated Library
                </span>
              </div>

              <h1 className="mb-4 font-serif text-5xl font-light text-neutral-900 sm:text-6xl">
                The Archive
              </h1>

              <p className="mb-8 text-lg text-neutral-600 leading-relaxed">
                A complete collection of essays, canon, resources, and exclusive materials.
                Designed for depth and clarity.
              </p>

              {/* Premium Search */}
              <div className="relative max-w-2xl">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Search className="h-5 w-5 text-neutral-400" />
                </div>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search across titles, excerpts, and tags..."
                  className="w-full rounded-xl border border-neutral-200 bg-white py-3.5 pl-12 pr-4 text-neutral-900 placeholder:text-neutral-400 outline-none transition-all focus:border-neutral-400 focus:shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
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
              <div className="flex-1 overflow-x-auto pb-2">
                <div className="flex gap-2 min-w-max">
                  {/* All Filter */}
                  <button
                    onClick={() => setFilter("all")}
                    className={`group relative rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${filter === "all"
                        ? "bg-neutral-900 text-white shadow-sm"
                        : "bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200"
                      }`}
                  >
                    All ({typeCounts.all})
                  </button>

                  {/* Type Filters */}
                  {allKinds.map((kind) => {
                    const config = TYPE_CONFIG[kind];
                    const active = filter === kind;
                    return (
                      <button
                        key={kind}
                        onClick={() => setFilter(kind)}
                        className={`group relative flex items-center gap-2.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${active
                            ? `${config.lightBg} ${config.color} border border-current/20`
                            : "bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200"
                          }`}
                      >
                        <div className={`flex h-6 w-6 items-center justify-center rounded-md ${active ? config.lightBg : "bg-neutral-100"}`}>
                          {React.cloneElement(config.icon as React.ReactElement, {
                            className: `h-3.5 w-3.5 ${active ? config.color : "text-neutral-500"}`
                          })}
                        </div>
                        <span className={config.casing === 'small-caps' ? "tracking-widest" : ""}>
                          {config.label} ({typeCounts[kind]})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Results Counter */}
              <div className="flex items-center gap-3 text-sm text-neutral-500">
                <span>Viewing</span>
                <span className="font-semibold text-neutral-900">{filteredDocs.length}</span>
                <span>of</span>
                <span className="font-semibold text-neutral-900">{typeCounts.all}</span>
                <span>items</span>
              </div>
            </div>
          </div>

          {/* Premium Content Grid */}
          <AnimatePresence mode="wait">
            {filteredDocs.length > 0 ? (
              <motion.div
                key={filter}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
              >
                {filteredDocs.map((doc) => {
                  const config = TYPE_CONFIG[doc.type as DocKind];
                  const dateObj = doc.date ? new Date(doc.date) : null;

                  return (
                    <motion.div
                      key={`${doc.type}:${doc.slug}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Link
                        href={doc.href}
                        className="group block overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:shadow-lg"
                      >
                        {/* Intelligent Image Container - Respects your covers */}
                        <div className="relative aspect-[16/11] w-full overflow-hidden bg-neutral-100">
                          <Image
                            src={doc.image || "/assets/images/writing-desk.webp"}
                            alt={doc.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                            sizes="(min-width: 1280px) 384px, (min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw"
                          />
                          {/* Minimal overlay for text legibility */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>

                        {/* Premium Card Content */}
                        <div className="p-5">
                          {/* Type indicator */}
                          <div className="mb-3 flex items-center justify-between">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${config.lightBg} ${config.color}`}>
                              <div className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
                              {config.label}
                            </span>
                            {dateObj && (
                              <time className="text-xs text-neutral-500">
                                {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </time>
                            )}
                          </div>

                          {/* Title with premium typography */}
                          <h3 className="mb-2 font-serif text-xl font-light text-neutral-900 leading-tight group-hover:text-neutral-700 transition-colors">
                            {doc.title}
                          </h3>

                          {/* Excerpt */}
                          {doc.excerpt && (
                            <p className="mb-4 text-sm text-neutral-600 leading-relaxed line-clamp-2">
                              {doc.excerpt}
                            </p>
                          )}

                          {/* Tags */}
                          {(doc.tags && doc.tags.length > 0) && (
                            <div className="mb-4 flex flex-wrap gap-1.5">
                              {doc.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-600"
                                >
                                  {tag}
                                </span>
                              ))}
                              {doc.tags.length > 3 && (
                                <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs text-neutral-400">
                                  +{doc.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Footer with subtle CTA */}
                          <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                            {doc.downloadUrl && (
                              <div className="flex items-center gap-1.5 text-xs text-blue-600">
                                <Download className="h-3.5 w-3.5" />
                                <span>Download available</span>
                              </div>
                            )}
                            <div className={`flex items-center gap-1 text-sm font-medium ${config.color}`}>
                              <span className="text-xs">View</span>
                              <ChevronRight className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </motion.div>
            ) : (
              // Premium Empty State
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded-2xl border border-neutral-200 bg-gradient-to-b from-white to-neutral-50/50 p-16 text-center"
              >
                <div className="mx-auto max-w-sm">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                    <Search className="h-8 w-8 text-neutral-400" />
                  </div>
                  <h3 className="mb-2 font-serif text-xl font-light text-neutral-900">
                    No matches found
                  </h3>
                  <p className="mb-6 text-neutral-600">
                    Try adjusting your search or filter terms.
                  </p>
                  {(searchQuery || filter !== "all") && (
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setFilter("all");
                      }}
                      className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      Clear filters
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
// Data Fetching - USING YOUR HELPER
// -----------------------------

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  // 1. Get ALL published documents, grouped by type (includes 'print')
  const publishedBuckets = getPublishedDocumentsByType();

  // 2. Convert each document to card props for the UI
  const docsByType: Record<DocKind, ContentlayerCardProps[]> = {
    post: [], canon: [], resource: [], download: [], print: [],
    book: [], event: [], short: [], strategy: [],
  };

  (Object.keys(publishedBuckets) as DocKind[]).forEach((kind) => {
    docsByType[kind] = publishedBuckets[kind].map(getCardPropsForDocument);
  });

  // DEBUG: Log to console to verify prints are being sourced
  console.log('[Content Index] Documents by type:', {
    posts: docsByType.post.length,
    canon: docsByType.canon.length,
    resources: docsByType.resource.length,
    downloads: docsByType.download.length,
    prints: docsByType.print.length, // <-- CHECK THIS
    books: docsByType.book.length,
    events: docsByType.event.length,
    shorts: docsByType.short.length,
    strategies: docsByType.strategy.length,
  });

  return {
    props: {
      docsByType,
    },
    revalidate: 60,
  };
};

export default ContentIndexPage;