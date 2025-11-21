// pages/content/index.tsx
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import Link from "next/link";
import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import type { UnifiedContent } from "@/lib/server/unified-content";
import { getAllUnifiedContent } from "@/lib/server/unified-content";

type ContentListItem = Omit<UnifiedContent, "updatedAt" | "content"> & {
  updatedAt: string | null;
};

interface ContentIndexProps {
  items: ContentListItem[];
}

type ContentType =
  | "all"
  | "blog"
  | "book"
  | "download"
  | "event"
  | "print"
  | "resource";

export const getStaticProps: GetStaticProps<ContentIndexProps> = async () => {
  const all = await getAllUnifiedContent();

  const itemsRaw: ContentListItem[] = all.map((item) => {
    // Strip out the ReactNode so Next.js doesn't try to serialize it
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { content, ...rest } = item;

    const normalised: ContentListItem = {
      ...rest,
      updatedAt:
        typeof item.updatedAt === "string" && item.updatedAt.trim().length > 0
          ? item.updatedAt
          : null,
    };

    return normalised;
  });

  // Final safety net: ensure everything is JSON-serializable
  const items = JSON.parse(JSON.stringify(itemsRaw)) as ContentListItem[];

  return {
    props: { items },
    revalidate: 3600,
  };
};

export default function ContentIndexPage({
  items,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const [activeFilter, setActiveFilter] = useState<ContentType>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Precompute type counts with safe typing
  const typeCounts = useMemo(() => {
    const base: Record<ContentType | "all", number> = {
      all: items.length,
      blog: 0,
      book: 0,
      download: 0,
      event: 0,
      print: 0,
      resource: 0,
    };

    items.forEach((item) => {
      const t = item.type as ContentType;
      if (t in base) {
        base[t] = (base[t] ?? 0) + 1;
      }
    });

    return base;
  }, [items]);

  // Filter and search logic
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return items.filter((item) => {
      const matchesFilter =
        activeFilter === "all" || item.type === activeFilter;

      if (!q) return matchesFilter;

      const inTitle = item.title.toLowerCase().includes(q);
      const inDescription =
        item.description &&
        item.description.toLowerCase().includes(q);
      const inTags =
        item.tags &&
        item.tags.some((tag) => String(tag).toLowerCase().includes(q));

      const matchesSearch = inTitle || inDescription || inTags;

      return matchesFilter && matchesSearch;
    });
  }, [items, activeFilter, searchQuery]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return null;

    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      blog: "📝",
      book: "📚",
      download: "📥",
      event: "📅",
      print: "🖨️",
      resource: "💎",
    };
    return icons[type] || "📄";
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      blog: "from-blue-500/10 to-cyan-500/10 border-blue-200/50",
      book: "from-purple-500/10 to-pink-500/10 border-purple-200/50",
      download: "from-green-500/10 to-emerald-500/10 border-green-200/50",
      event: "from-orange-500/10 to-red-500/10 border-orange-200/50",
      print: "from-amber-500/10 to-yellow-500/10 border-amber-200/50",
      resource: "from-softGold/10 to-forest/10 border-softGold/50",
    };
    return (
      colors[type] ||
      "from-gray-500/10 to-gray-600/10 border-gray-200/50"
    );
  };

  return (
    <Layout title="Strategic Insights & Resources">
      {/* Premium Background */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-black via-deepCharcoal to-black" />

      {/* Animated background elements */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/2 h-1/2 w-1/2 animate-pulse rounded-full bg-softGold/5 blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 animate-pulse rounded-full bg-forest/5 blur-3xl delay-1000" />
      </div>

      <main className="relative z-10 min-h-screen">
        {/* Hero Header */}
        <section className="relative px-4 pb-16 pt-20 text-center">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-softGold/30 bg-softGold/10 px-4 py-2 backdrop-blur-sm">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-softGold" />
              <span className="text-sm font-medium uppercase tracking-wider text-softGold">
                Complete Library
              </span>
            </div>

            <h1 className="mb-6 font-serif text-4xl font-light text-white md:text-6xl">
              Strategic Insights &amp;
              <br />
              Resources
            </h1>

            <p className="mx-auto mb-8 max-w-2xl text-xl leading-relaxed text-gray-300">
              A curated collection of field-tested strategies, tools, and
              wisdom for fathers, founders, and leaders building enduring
              legacies.
            </p>

            {/* Search Bar */}
            <div className="mx-auto mb-8 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search insights, tools, resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-white/20 bg-white/10 px-6 py-4 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-softGold"
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 transform text-gray-400">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="mb-12 flex flex-wrap justify-center gap-3">
              {(
                [
                  "all",
                  "blog",
                  "book",
                  "download",
                  "event",
                  "print",
                  "resource",
                ] as ContentType[]
              ).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActiveFilter(type)}
                  className={`group relative rounded-full border px-6 py-3 backdrop-blur-sm transition-all duration-300 ${
                    activeFilter === type
                      ? "bg-softGold text-deepCharcoal shadow-lg shadow-softGold/20 border-softGold"
                      : "bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/30"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-medium capitalize">
                    {type === "all" ? "🌐" : getTypeIcon(type)}
                    {type}
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        activeFilter === type
                          ? "bg-deepCharcoal/20"
                          : "bg-white/10"
                      }`}
                    >
                      {typeCounts[type] || 0}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <section className="relative px-4 pb-20">
          <div className="mx-auto max-w-7xl">
            {filteredItems.length === 0 ? (
              <div className="py-20 text-center">
                <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-3xl bg-white/10">
                  <svg
                    className="h-10 w-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="mb-4 font-serif text-2xl font-light text-white">
                  No content found
                </h3>
                <p className="mx-auto max-w-md text-gray-400">
                  {searchQuery
                    ? `No results for "${searchQuery}". Try adjusting your search or filters.`
                    : "No content items match the selected filters."}
                </p>
              </div>
            ) : (
              <>
                {/* Results Count */}
                <div className="mb-12 text-center">
                  <p className="text-gray-400">
                    Showing{" "}
                    <span className="font-semibold text-softGold">
                      {filteredItems.length}
                    </span>{" "}
                    of{" "}
                    <span className="text-white">
                      {items.length}
                    </span>{" "}
                    resources
                  </p>
                </div>

                {/* Content Grid */}
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {filteredItems.map((item, index) => (
                    <article
                      key={item.slug}
                      className="group relative overflow-hidden rounded-3xl border border-white/20 bg-white/95 shadow-2xl shadow-black/20 backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-3xl hover:shadow-black/30"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      {/* Type Indicator */}
                      <div
                        className={`absolute right-4 top-4 z-20 rounded-full border px-3 py-1.5 backdrop-blur-sm ${getTypeColor(
                          item.type,
                        )}`}
                      >
                        <span className="flex items-center gap-1 text-xs font-medium capitalize text-deepCharcoal">
                          {getTypeIcon(item.type)}
                          {item.type}
                        </span>
                      </div>

                      <Link href={`/${item.slug}`} className="block">
                        <div className="p-6">
                          {/* Title */}
                          <h3 className="mb-3 line-clamp-2 font-serif text-xl font-light leading-tight text-deepCharcoal transition-colors duration-300 group-hover:text-forest">
                            {item.title}
                          </h3>

                          {/* Description */}
                          {item.description && (
                            <p className="mb-4 line-clamp-3 font-light leading-relaxed text-gray-600">
                              {item.description}
                            </p>
                          )}

                          {/* Metadata */}
                          <div className="flex items-center justify-between border-t border-gray-100/50 pt-4">
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              {item.updatedAt && (
                                <time
                                  dateTime={item.updatedAt}
                                  className="font-light"
                                >
                                  {formatDate(item.updatedAt)}
                                </time>
                              )}
                            </div>

                            {/* Arrow indicator */}
                            <div className="transform translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-softGold/10">
                                <svg
                                  className="h-4 w-4 text-softGold"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                                  />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Tags */}
                          {item.tags && item.tags.length > 0 && (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {item.tags.slice(0, 3).map((tag, i) => (
                                <span
                                  key={i}
                                  className="rounded-full border border-gray-200/50 bg-gray-100/80 px-3 py-1 text-xs font-light text-gray-600 backdrop-blur-sm"
                                >
                                  {String(tag)}
                                </span>
                              ))}
                              {item.tags.length > 3 && (
                                <span className="rounded-full border border-gray-200/50 bg-gray-100/80 px-3 py-1 text-xs font-light text-gray-500 backdrop-blur-sm">
                                  +{item.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Bottom accent */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 origin-left scale-x-0 transform bg-gradient-to-r from-softGold/0 via-softGold to-forest/0 transition-transform duration-500 group-hover:scale-x-100" />
                      </Link>
                    </article>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative px-4 pb-20">
          <div className="mx-auto max-w-4xl">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-deepCharcoal via-black to-forest/90 p-12 text-center text-white">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
                    backgroundSize: "40px 40px",
                  }}
                />
              </div>

              <div className="relative z-10">
                <h2 className="mb-6 font-serif text-3xl font-light md:text-4xl">
                  Ready to Go Deeper?
                </h2>
                <p className="mx-auto mb-8 max-w-2xl text-xl leading-relaxed text-gray-300">
                  Strategic insights are meant to be applied. Let&apos;s
                  discuss how these resources can serve your specific context
                  and challenges.
                </p>
                <div className="flex flex-wrap justify-center gap-4">
                  <Link
                    href="/contact"
                    className="group inline-flex items-center gap-3 rounded-full bg-softGold px-8 py-4 font-medium text-deepCharcoal transition-all hover:scale-105 hover:shadow-2xl hover:shadow-softGold/30"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                      />
                    </svg>
                    Start a Conversation
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}