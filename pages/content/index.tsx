// pages/content/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Image from "next/image";
import Link from "next/link";
import Layout from "@/components/Layout";
import { Search, Filter, ChevronRight, BookOpen, Download, Calendar, FileText, Star, Layers } from "lucide-react";

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
// Constants & Configuration
// -----------------------------

const TYPE_CONFIG: Record<UiDocType, {
  label: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  description: string;
}> = {
  post: {
    label: "Essays",
    icon: <FileText className="h-4 w-4" />,
    color: "text-amber-400",
    gradient: "from-amber-900/20 to-amber-900/5",
    description: "In-depth explorations and insights"
  },
  short: {
    label: "Shorts",
    icon: <FileText className="h-4 w-4" />,
    color: "text-emerald-400",
    gradient: "from-emerald-900/20 to-emerald-900/5",
    description: "Concise thoughts and observations"
  },
  book: {
    label: "Books",
    icon: <BookOpen className="h-4 w-4" />,
    color: "text-violet-400",
    gradient: "from-violet-900/20 to-violet-900/5",
    description: "Comprehensive works and volumes"
  },
  canon: {
    label: "Canon",
    icon: <Star className="h-4 w-4" />,
    color: "text-gold",
    gradient: "from-gold/10 to-gold/5",
    description: "Foundational principles and frameworks"
  },
  resource: {
    label: "Resources",
    icon: <Layers className="h-4 w-4" />,
    color: "text-cyan-400",
    gradient: "from-cyan-900/20 to-cyan-900/5",
    description: "Tools and reference materials"
  },
  download: {
    label: "Downloads",
    icon: <Download className="h-4 w-4" />,
    color: "text-rose-400",
    gradient: "from-rose-900/20 to-rose-900/5",
    description: "Digital assets and files"
  },
  print: {
    label: "Prints",
    icon: <FileText className="h-4 w-4" />,
    color: "text-orange-400",
    gradient: "from-orange-900/20 to-orange-900/5",
    description: "Physical and premium print materials"
  },
  event: {
    label: "Events",
    icon: <Calendar className="h-4 w-4" />,
    color: "text-blue-400",
    gradient: "from-blue-900/20 to-blue-900/5",
    description: "Experiences and gatherings"
  },
  strategy: {
    label: "Strategy",
    icon: <FileText className="h-4 w-4" />,
    color: "text-purple-400",
    gradient: "from-purple-900/20 to-purple-900/5",
    description: "Strategic frameworks and planning"
  },
};

const FILTERS: Array<{ key: "all" | UiDocType; label: string; icon: React.ReactNode }> = [
  { key: "all", label: "All Content", icon: <Layers className="h-4 w-4" /> },
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
        {/* Hero Section */}
        <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-br from-black via-black to-gray-900/30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
                  Exclusive Library
                </span>
                <span className="h-1 w-1 rounded-full bg-gold/50" />
                <span className="text-xs text-gray-400">
                  {docs.length} curated pieces
                </span>
              </div>
              
              <h1 className="mb-4 font-serif text-5xl font-light tracking-tight text-cream sm:text-6xl">
                The Archive
              </h1>
              
              <p className="mb-8 text-lg text-gray-300 leading-relaxed">
                A meticulously curated collection of essays, frameworks, resources, 
                and exclusive materials—designed for those who demand excellence.
              </p>

              {/* Search Bar */}
              <div className="relative max-w-2xl">
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search titles, concepts, frameworks..."
                  className="w-full rounded-xl border border-white/10 bg-white/5 py-3.5 pl-12 pr-4 text-sm text-cream placeholder:text-gray-400 outline-none transition-all focus:border-gold/40 focus:bg-white/10 focus:shadow-[0_0_30px_rgba(212,175,55,0.1)]"
                />
                {q && (
                  <button
                    onClick={() => setQ("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Mobile Filter Toggle */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-200"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span>Filter by Type</span>
                {filter !== "all" && (
                  <span className="ml-2 rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-black">
                    {TYPE_CONFIG[filter].label}
                  </span>
                )}
              </div>
              <ChevronRight className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-90' : ''}`} />
            </button>
          </div>

          <div className="flex gap-8">
            {/* Desktop Sidebar */}
            <aside className={`hidden lg:block w-64 flex-shrink-0 ${isFilterOpen ? 'block' : 'hidden'} lg:block`}>
              <div className="sticky top-8 space-y-6">
                <div>
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
                    Content Types
                  </h3>
                  <div className="space-y-2">
                    {FILTERS.map((f) => {
                      const config = f.key === "all" ? { color: "text-gray-200", gradient: "from-gray-900/20 to-gray-900/5" } : TYPE_CONFIG[f.key];
                      const active = f.key === filter;
                      const count = f.key === "all" ? docs.length : typeCounts[f.key];
                      
                      return (
                        <button
                          key={f.key}
                          onClick={() => {
                            setFilter(f.key);
                            setIsFilterOpen(false);
                          }}
                          className={`group flex w-full items-center justify-between rounded-xl px-3 py-3 text-sm transition-all ${active ? 'bg-white/10 border border-white/20' : 'border border-transparent hover:border-white/10 hover:bg-white/5'}`}
                          type="button"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${active ? 'bg-white/20' : 'bg-white/5'} transition-colors`}>
                              {f.icon}
                            </div>
                            <span className={`font-medium ${active ? 'text-cream' : 'text-gray-300'}`}>
                              {f.label}
                            </span>
                          </div>
                          <span className={`text-xs ${active ? 'text-gold' : 'text-gray-500'}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Stats */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                  <h4 className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gray-400">
                    Collection Stats
                  </h4>
                  <div className="space-y-3">
                    <div className="text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span>Total Items</span>
                        <span className="font-semibold text-cream">{docs.length}</span>
                      </div>
                      <div className="mt-2 h-1 w-full rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-gold" style={{ width: '100%' }} />
                      </div>
                    </div>
                    <div className="text-sm text-gray-300">
                      <div className="flex justify-between">
                        <span>Currently Viewing</span>
                        <span className="font-semibold text-cream">{filteredDocs.length}</span>
                      </div>
                      <div className="mt-2 h-1 w-full rounded-full bg-white/10">
                        <div 
                          className="h-full rounded-full bg-cyan-500" 
                          style={{ width: `${(filteredDocs.length / docs.length) * 100}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content Grid */}
            <div className="flex-1">
              {filter !== "all" && (
                <div className="mb-8 rounded-2xl border border-white/10 bg-gradient-to-r from-white/5 to-white/2 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${TYPE_CONFIG[filter].gradient}`}>
                          {TYPE_CONFIG[filter].icon}
                        </div>
                        <div>
                          <h2 className="font-serif text-2xl font-light text-cream">
                            {TYPE_CONFIG[filter].label}
                          </h2>
                          <p className="text-sm text-gray-400">
                            {TYPE_CONFIG[filter].description} • {typeCounts[filter]} items
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => setFilter("all")}
                      className="rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                    >
                      View All
                    </button>
                  </div>
                </div>
              )}

              {filteredDocs.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                  {filteredDocs.map((doc) => {
                    const cover = resolveCover(doc);
                    const config = TYPE_CONFIG[doc.uiType];

                    return (
                      <Link
                        key={`${doc.uiType}:${doc.slug}`}
                        href={doc.url || `/content/${doc.slug}`}
                        className="group relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-white/2 transition-all duration-300 hover:border-gold/30 hover:shadow-[0_8px_40px_rgba(212,175,55,0.1)]"
                      >
                        {/* Premium accent */}
                        <div className="absolute right-4 top-4 z-10">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${config.gradient} backdrop-blur-sm border border-white/10`}>
                            {config.icon}
                          </div>
                        </div>

                        {/* Image Container */}
                        <div className="relative aspect-[16/10] w-full overflow-hidden">
                          <Image
                            src={cover}
                            alt={doc.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                            sizes="(min-width: 1280px) 384px, (min-width: 1024px) 320px, (min-width: 768px) 50vw, 100vw"
                            priority={false}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                          <div className="absolute bottom-4 left-4">
                            <span className="inline-flex items-center rounded-full bg-black/40 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-gold backdrop-blur-sm">
                              {doc.uiType}
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                          <h3 className="mb-2 line-clamp-2 font-serif text-lg font-light text-cream group-hover:text-gold transition-colors">
                            {doc.title}
                          </h3>

                          {(doc.excerpt || doc.description) && (
                            <p className="mb-4 line-clamp-2 text-sm text-gray-300 leading-relaxed">
                              {doc.excerpt || doc.description}
                            </p>
                          )}

                          {/* Tags */}
                          {(doc.tags && doc.tags.length > 0) && (
                            <div className="mb-4 flex flex-wrap gap-1.5">
                              {doc.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-gray-300"
                                >
                                  {tag}
                                </span>
                              ))}
                              {doc.tags.length > 3 && (
                                <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-gray-400">
                                  +{doc.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Footer */}
                          <div className="flex items-center justify-between border-t border-white/10 pt-4">
                            <span className="text-xs text-gray-400">
                              {doc.date ? new Date(doc.date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              }) : 'No date'}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-gold">
                              <span>Explore</span>
                              <ChevronRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-12 text-center">
                  <div className="mx-auto max-w-md">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="mb-2 font-serif text-xl font-light text-cream">
                      No matches found
                    </h3>
                    <p className="text-gray-400">
                      Try adjusting your filters or search terms to discover our curated content.
                    </p>
                    {(q || filter !== "all") && (
                      <button
                        onClick={() => {
                          setQ("");
                          setFilter("all");
                        }}
                        className="mt-4 rounded-lg border border-white/10 px-4 py-2 text-sm text-gray-300 hover:bg-white/5"
                      >
                        Clear all filters
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Empty State for Empty Category */}
              {filter !== "all" && typeCounts[filter] === 0 && (
                <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/5 to-transparent p-12 text-center">
                  <div className="mx-auto max-w-md">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                      {TYPE_CONFIG[filter].icon}
                    </div>
                    <h3 className="mb-2 font-serif text-xl font-light text-cream">
                      No {TYPE_CONFIG[filter].label.toLowerCase()} yet
                    </h3>
                    <p className="text-gray-400">
                      This category is being prepared with exclusive content. Check back soon.
                    </p>
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