// pages/content/index.tsx
// — VAULT-ONLY, LINK-INTEGRITY MODE

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

import { getPublishedDocuments } from "@/lib/content/server";
import { safeFirstChar, safeSlice } from "@/lib/utils/safe";
import { getDocKind, getDocHref, resolveDocCoverImage, sanitizeData } from "@/lib/content/shared";

type Item = {
  key: string;
  kind: string;
  title: string;
  href: string;
  excerpt?: string | null;
  date?: string | null;
  dateIso?: string | null; // ISO date for sorting
  image?: string | null;
  readTime?: string | null;
  tags?: string[];
  category?: string | null;
};

type Props = { items: Item[] };

export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    const docs = getPublishedDocuments();

    if (!docs || docs.length === 0) {
      return { props: { items: [] }, revalidate: 1800 };
    }

    const items: Item[] = (docs as any[])
      .map((d: any) => {
        try {
          const kind = String(getDocKind(d) || "document");
          const href = String(getDocHref(d) || "");
          const title = String(d?.title || "Untitled");
          const slugish = String(d?.slug || d?._raw?.flattenedPath || href || title);
          const key = String(d?._id || `${kind}:${slugish}`);

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
          } as Item;
        } catch {
          return null;
        }
      })
      .filter((x): x is Item => !!x && !!x.href && x.href.startsWith("/content/") && !!x.title)
      .sort((a, b) => {
        const aTime = a.dateIso ? Date.parse(a.dateIso) : 0;
        const bTime = b.dateIso ? Date.parse(b.dateIso) : 0;
        return bTime - aTime;
      });

    return { props: sanitizeData({ items }), revalidate: 1800 };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Content Index] getStaticProps error:", error);
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
      filtered = filtered.filter((item) => {
        const inTitle = item.title.toLowerCase().includes(term);
        const inExcerpt = (item.excerpt || "").toLowerCase().includes(term);
        const inTags = (item.tags || []).some((tag) => String(tag).toLowerCase().includes(term));
        const inCat = (item.category || "").toLowerCase().includes(term);
        return inTitle || inExcerpt || inTags || inCat;
      });
    }

    if (selectedKind) filtered = filtered.filter((item) => item.kind === selectedKind);
    if (selectedCategory) filtered = filtered.filter((item) => item.category === selectedCategory);

    return filtered;
  }, [items, searchTerm, selectedKind, selectedCategory]);

  const groups = React.useMemo(() => {
    const map: Record<string, Item[]> = {};
    for (const it of filteredItems) {
      const k = it.kind || "document";
      (map[k] ||= []).push(it);
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
      post: <BookOpen className="h-4 w-4" />,
      blog: <BookOpen className="h-4 w-4" />,
      canon: <Terminal className="h-4 w-4" />,
      download: <Layers className="h-4 w-4" />,
      event: <Calendar className="h-4 w-4" />,
      book: <BookOpen className="h-4 w-4" />,
      short: <Terminal className="h-4 w-4" />,
      print: <Layers className="h-4 w-4" />,
      resource: <Layers className="h-4 w-4" />,
      strategy: <Terminal className="h-4 w-4" />,
      document: <BookOpen className="h-4 w-4" />,
    };
    return icons[kind] || <BookOpen className="h-4 w-4" />;
  };

  const latestYear = React.useMemo(() => {
    const ms = Math.max(...items.map((i) => (i.dateIso ? Date.parse(i.dateIso) : 0)));
    return ms > 0 ? new Date(ms).getFullYear() : new Date().getFullYear();
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

            <h1 className="mb-6 font-serif text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
              Everything. <span className="italic text-amber-400">Organised.</span>
            </h1>

            <p className="mb-12 max-w-3xl text-lg text-gray-400">
              This index only lists assets under <span className="font-mono text-gray-200">/content/</span>. If it’s
              here, it resolves. No broken routes.
            </p>

            <div className="max-w-3xl space-y-4">
              <div className="group relative">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 transition-colors group-focus-within:text-amber-500"
                  size={20}
                />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search collections, themes, or keywords..."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-10 text-base text-white placeholder:text-gray-500 transition-all focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/10"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-gray-500 transition-colors hover:text-amber-500"
                    aria-label="Clear search"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 transition-colors hover:border-amber-500/30 hover:text-amber-400"
                >
                  <Filter className="h-4 w-4" />
                  <span className="text-sm font-medium">Filters</span>
                </button>

                {(selectedKind || selectedCategory) && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 rounded-xl bg-amber-500/10 px-4 py-2 text-sm text-amber-400 transition-colors hover:bg-amber-500/20"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {showFilters && (
                <div className="space-y-4 rounded-2xl border border-white/10 bg-black/50 p-6 backdrop-blur-sm">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-gray-300">Content Type</h3>
                      <div className="flex flex-wrap gap-2">
                        {allKinds.map((kind) => (
                          <button
                            key={kind}
                            onClick={() => setSelectedKind((v) => (v === kind ? null : kind))}
                            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                              selectedKind === kind
                                ? "bg-amber-500 text-black"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300"
                            }`}
                          >
                            {getKindLabel(kind)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h3 className="mb-2 text-sm font-semibold text-gray-300">Categories</h3>
                      <div className="flex flex-wrap gap-2">
                        {allCategories.map((category) => (
                          <button
                            key={category}
                            onClick={() => setSelectedCategory((v) => (v === category ? null : category))}
                            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
                              selectedCategory === category
                                ? "bg-blue-500 text-white"
                                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-300"
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

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-20 lg:px-8">
          {groups.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-3xl border border-dashed border-white/10 py-24 text-center"
            >
              <Box className="mx-auto mb-4 text-gray-700" size={48} />
              <p className="mb-6 font-serif text-xl italic text-gray-500">No assets matching current filters.</p>
              <button
                onClick={clearFilters}
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
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
                      <div className="rounded-lg bg-white/5 p-2">{getKindIcon(kind)}</div>
                      <h2 className="font-serif text-2xl font-bold text-white md:text-3xl">{getKindLabel(kind)}</h2>
                    </div>
                    <div className="h-px flex-1 bg-gradient-to-r from-amber-500/20 to-transparent" />
                    <span className="font-mono text-xs uppercase tracking-widest text-gray-500">
                      {kindItems.length} Assets
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {kindItems.map((item) => (
                      <motion.div
                        key={item.key}
                        whileHover={{ y: -4 }}
                        className="group relative flex flex-col justify-between rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 to-black/50 p-6 transition-all hover:border-amber-500/30 hover:shadow-2xl hover:shadow-amber-500/10"
                      >
                        <Link href={item.href} className="flex h-full flex-col">
                          <h3 className="mb-3 line-clamp-2 font-serif text-xl font-semibold leading-tight text-white transition-colors group-hover:text-amber-400">
                            {item.title}
                          </h3>

                          {item.excerpt ? (
                            <p className="mb-6 line-clamp-2 text-sm leading-relaxed text-gray-400">{item.excerpt}</p>
                          ) : null}

                          <div className="mt-auto space-y-3 border-t border-white/5 pt-4">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <div className="flex items-center gap-2">
                                {item.date ? (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    <span>
                                      {new Date(item.date).toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </span>
                                  </div>
                                ) : null}
                                {item.readTime ? (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>{item.readTime}</span>
                                  </div>
                                ) : null}
                              </div>

                              {item.category ? (
                                <span className="rounded bg-white/5 px-2 py-0.5 text-[10px]">{item.category}</span>
                              ) : null}
                            </div>

                            <div className="flex items-center justify-between">
                              <span className="max-w-[70%] truncate font-mono text-[10px] uppercase tracking-widest text-gray-600 transition-colors group-hover:text-amber-500/50">
                                {item.href.replace(/^\//, "").replace(/\//g, " · ")}
                              </span>
                              <ArrowRight
                                size={14}
                                className="flex-shrink-0 -translate-x-2 text-amber-500 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
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

          <div className="mt-16 border-t border-white/10 pt-8">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <div className="mb-1 text-2xl font-bold text-white">{items.length}</div>
                <div className="text-sm text-gray-400">Total Assets</div>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <div className="mb-1 text-2xl font-bold text-white">{allKinds.length}</div>
                <div className="text-sm text-gray-400">Content Types</div>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <div className="mb-1 text-2xl font-bold text-white">{latestYear}</div>
                <div className="text-sm text-gray-400">Latest Update</div>
              </div>
              <div className="rounded-xl bg-white/5 p-4 text-center">
                <div className="mb-1 text-2xl font-bold text-white">{allCategories.length}</div>
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