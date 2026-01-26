// pages/content/index.tsx — FIXED: VAULT-ONLY, LINK-INTEGRITY MODE
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Search,
  ArrowRight,
  Box,
  Terminal,
  X,
  Calendar,
  Clock,
  Filter,
  BookOpen,
  Layers,
} from "lucide-react";

import Layout from "@/components/Layout";
// ✅ FIXED: Import server-side functions from correct location
import {
  getPublishedDocuments,
} from "@/lib/content/server";

import {
import { safeFirstChar, safeSlice } from "@/lib/utils/safe";

  getDocKind,
  getDocHref,
  resolveDocCoverImage,
  sanitizeData,
} from "@/lib/content/shared";

type Item = {
  key: string;
  kind: string;
  title: string;
  href: string;
  excerpt?: string | null;
  date?: string | null;
  dateIso?: string | null;  // ✅ ISO date for reliable sorting
  image?: string | null;
  readTime?: string | null;
  tags?: string[];
  category?: string | null;
};

type Props = { items: Item[] };

export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    // ✅ Get published documents from server-side functions
    const docs = getPublishedDocuments();

    if (!docs || docs.length === 0) {
      console.warn("[Content Index] No documents found");
      return { props: { items: [] }, revalidate: 1800 };
    }

    // VAULT-ONLY: only include docs whose href begins with /content/
    const items: Item[] = docs
      .map((d: any) => {
        try {
          const kind = String(getDocKind(d) || "document");
          const href = String(getDocHref(d) || "");
          const title = String(d?.title || "Untitled");
          const slugish = String(d?.slug || d?._raw?.flattenedPath || href || title);
          const key = String(d?._id || `${kind}:${slugish}`);

          // ✅ Store both ISO date (for sorting) and display date
          const dateIso = d?.date ? new Date(d.date).toISOString() : null;
          const dateStr = d?.date ? String(d.date) : null;

          return {
            key,
            kind,
            title,
            href,
            excerpt: (d?.excerpt || d?.description || null) as string | null,
            date: dateStr,
            dateIso,
            image: (resolveDocCoverImage(d) || null) as string | null,
            readTime: d?.readTime || null,
            tags: Array.isArray(d?.tags) ? d.tags : [],
            category: d?.category || null,
          };
        } catch (error) {
          console.warn("[Content Index] Failed to transform document:", error);
          return null;
        }
      })
      .filter((x): x is Item => 
        x !== null && 
        Boolean(x.href) && 
        x.href.startsWith("/content/") && 
        Boolean(x.title)
      )
      .sort((a, b) => {
        // ✅ Sort by ISO date for reliability across platforms
        const aTime = a.dateIso ? Date.parse(a.dateIso) : 0;
        const bTime = b.dateIso ? Date.parse(b.dateIso) : 0;
        return bTime - aTime; // Newest first
      });

    return {
      props: sanitizeData({ items }),
      revalidate: 1800,
    };
  } catch (error) {
    console.error("[Content Index] Error in getStaticProps:", error);
    return { props: { items: [] }, revalidate: 1800 };
  }
};

const ContentIndexPage: NextPage<Props> = ({ items }) => {
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedKind, setSelectedKind] = React.useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [showFilters, setShowFilters] = React.useState(false);

  const allKinds = React.useMemo(() => {
    const kinds = new Set<string>();
    items.forEach((item) => kinds.add(item.kind));
    return Array.from(kinds).sort();
  }, [items]);

  const allCategories = React.useMemo(() => {
    const categories = new Set<string>();
    items.forEach((item) => {
      if (item.category) categories.add(item.category);
    });
    return Array.from(categories).sort();
  }, [items]);

  const filteredItems = React.useMemo(() => {
    let filtered = items;

    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(term) ||
          item.excerpt?.toLowerCase().includes(term) ||
          item.tags?.some((tag) => tag.toLowerCase().includes(term)) ||
          item.category?.toLowerCase().includes(term)
      );
    }

    if (selectedKind) filtered = filtered.filter((item) => item.kind === selectedKind);
    if (selectedCategory) filtered = filtered.filter((item) => item.category === selectedCategory);

    return filtered;
  }, [items, searchTerm, selectedKind, selectedCategory]);

  const groups = React.useMemo(() => {
    const map: Record<string, Item[]> = {};
    for (const it of filteredItems) {
      const groupName = it.kind || "document";
      if (!map[groupName]) map[groupName] = [];
      map[groupName].push(it);
    }
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredItems]);

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedKind(null);
    setSelectedCategory(null);
  };

  const getKindLabel = (kind: string) => {
    const labels: Record<string, string> = {
      post: "Essays",
      blog: "Blog Posts",
      canon: "Canon",
      download: "Downloads",
      event: "Events",
      book: "Books",
      short: "Shorts",
      print: "Prints",
      resource: "Resources",
      strategy: "Strategy",
      document: "Documents",
    };
    return labels[kind] || `${safeFirstChar(kind).toUpperCase()}${safeSlice(kind, 1)}s`;
  };

  const getKindIcon = (kind: string) => {
    const icons: Record<string, React.ReactNode> = {
      post: <BookOpen className="w-4 h-4" />,
      blog: <BookOpen className="w-4 h-4" />,
      canon: <Terminal className="w-4 h-4" />,
      download: <Layers className="w-4 h-4" />,
      event: <Calendar className="w-4 h-4" />,
      book: <BookOpen className="w-4 h-4" />,
      short: <Terminal className="w-4 h-4" />,
      print: <Layers className="w-4 h-4" />,
      resource: <Layers className="w-4 h-4" />,
      strategy: <Terminal className="w-4 h-4" />,
      document: <BookOpen className="w-4 h-4" />,
    };
    return icons[kind] || <BookOpen className="w-4 h-4" />;
  };

  const latestYear = React.useMemo(() => {
    const ms = Math.max(...items.map((i) => (i.dateIso ? Date.parse(i.dateIso) : 0)));
    const yr = ms > 0 ? new Date(ms).getFullYear() : new Date().getFullYear();
    return yr;
  }, [items]);

  return (
    <Layout
      title="The Kingdom Vault"
      description="Centralised strategic repository: vetted documents, manuscripts, and assets from Abraham of London."
      fullWidth
    >
      <main className="min-h-screen bg-gradient-to-b from-black via-zinc-900 to-black text-gray-300">
        <section className="relative overflow-hidden border-b border-white/5 pb-16 pt-24 lg:pt-32">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_#d4af37_1px,_transparent_1px)] bg-[length:32px_32px]" />
          <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2">
              <Terminal size={14} className="text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500">
                System: Central Vault
              </span>
            </div>

            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-6">
              Everything. <span className="italic text-amber-400">Organised.</span>
            </h1>

            <p className="text-lg text-gray-400 mb-12 max-w-3xl">
              This index only lists assets that live under <span className="font-mono text-gray-200">/content/</span>.
              If it's here, it resolves. No broken routes.
            </p>

            <div className="space-y-4 max-w-3xl">
              <div className="relative group">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-amber-500"
                  size={20}
                />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search collections, themes, or keywords..."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-10 text-base text-white placeholder:text-gray-500 focus:outline-none focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/10 transition-all"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-500 transition-colors p-1"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-amber-500/30 hover:text-amber-400 transition-colors"
                >
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filters</span>
                </button>

                {(selectedKind || selectedCategory) && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors text-sm"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {showFilters && (
                <div className="p-6 rounded-2xl border border-white/10 bg-black/50 backdrop-blur-sm space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-300 mb-2">Content Type</h3>
                      <div className="flex flex-wrap gap-2">
                        {allKinds.map((kind) => (
                          <button
                            key={kind}
                            onClick={() => setSelectedKind(selectedKind === kind ? null : kind)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              selectedKind === kind
                                ? "bg-amber-500 text-black"
                                : "bg-white/5 text-gray-400 hover:text-gray-300 hover:bg-white/10"
                            }`}
                          >
                            {getKindLabel(kind)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-300 mb-2">Categories</h3>
                      <div className="flex flex-wrap gap-2">
                        {allCategories.map((category) => (
                          <button
                            key={category}
                            onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                              selectedCategory === category
                                ? "bg-blue-500 text-white"
                                : "bg-white/5 text-gray-400 hover:text-gray-300 hover:bg-white/10"
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(searchTerm || selectedKind || selectedCategory) && (
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                  <span>
                    Showing {filteredItems.length} of {items.length} assets
                  </span>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          {groups.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-3xl border border-dashed border-white/10 py-24 text-center"
            >
              <Box className="mx-auto mb-4 text-gray-700" size={48} />
              <p className="font-serif text-xl italic text-gray-500 mb-6">
                No assets matching current filters.
              </p>
              <button
                onClick={clearFilters}
                className="px-6 py-3 bg-white/5 border border-white/10 text-gray-400 rounded-xl hover:bg-white/10 hover:text-white transition-colors"
              >
                Clear all filters
              </button>
            </motion.div>
          ) : (
            <div className="space-y-16">
              {groups.map(([kind, kindItems]) => (
                <div key={kind} className="space-y-8">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/5">{getKindIcon(kind)}</div>
                      <h2 className="font-serif text-2xl md:text-3xl font-bold text-white">
                        {getKindLabel(kind)}
                      </h2>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-amber-500/20 to-transparent" />
                    <span className="font-mono text-xs text-gray-500 uppercase tracking-widest">
                      {kindItems.length} Assets
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {kindItems.map((item) => (
                      <motion.div
                        key={item.key}
                        whileHover={{ y: -4 }}
                        className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-black/50 p-6 transition-all hover:border-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/10"
                      >
                        <Link href={item.href} className="flex h-full flex-col">
                          <h3 className="mb-3 font-serif text-xl font-semibold leading-tight text-white group-hover:text-amber-400 transition-colors line-clamp-2">
                            {item.title}
                          </h3>

                          {item.excerpt && (
                            <p className="mb-6 text-sm leading-relaxed text-gray-400 line-clamp-2">
                              {item.excerpt}
                            </p>
                          )}

                          <div className="mt-auto space-y-3 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-2">
                                {item.date && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      {new Date(item.date).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </span>
                                  </div>
                                )}
                                {item.readTime && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    <span>{item.readTime}</span>
                                  </div>
                                )}
                              </div>

                              {item.category && (
                                <span className="px-2 py-0.5 bg-white/5 rounded text-[10px]">
                                  {item.category}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="font-mono text-[10px] uppercase tracking-widest text-gray-600 group-hover:text-amber-500/50 transition-colors truncate max-w-[70%]">
                                {item.href.replace(/^\//, "").replace(/\//g, " · ")}
                              </span>
                              <ArrowRight
                                size={14}
                                className="text-amber-500 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0 flex-shrink-0"
                              />
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-16 pt-8 border-t border-white/10">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="text-2xl font-bold text-white mb-1">{items.length}</div>
                <div className="text-sm text-gray-400">Total Assets</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="text-2xl font-bold text-white mb-1">{allKinds.length}</div>
                <div className="text-sm text-gray-400">Content Types</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="text-2xl font-bold text-white mb-1">{latestYear}</div>
                <div className="text-sm text-gray-400">Latest Update</div>
              </div>
              <div className="text-center p-4 bg-white/5 rounded-xl">
                <div className="text-2xl font-bold text-white mb-1">{allCategories.length}</div>
                <div className="text-sm text-gray-400">Categories</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default ContentIndexPage;