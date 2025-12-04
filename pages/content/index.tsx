// pages/content/index.tsx
import type { GetStaticProps, NextPage } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";

import { getAllPostsMeta } from "@/lib/server/posts-data";
import { getAllDownloadsMeta } from "@/lib/server/downloads-data";
import { getAllBooksMeta } from "@/lib/server/books-data";
import { getAllContent } from "@/lib/mdx";

// ---------------------------------------------------------------------------
// Design & Data Types
// ---------------------------------------------------------------------------

type ContentKind =
  | "blog"
  | "book"
  | "download"
  | "event"
  | "print"
  | "resource";

interface RawContentItem {
  slug?: string;
  title?: string;
  date?: string;
  excerpt?: string;
  description?: string;
  category?: string;
  tags?: (string | number)[];
  featured?: boolean;
  readTime?: string | number;
  _raw?: { flattenedPath?: string };
  eventDate?: string;
  fileSize?: string;
}

interface ContentResource {
  kind: ContentKind;
  title: string;
  slug: string;
  href: string;
  date?: string;
  excerpt?: string;
  description?: string;
  category?: string;
  tags: string[];
  featured?: boolean;
  readTime?: string | number;
}

interface ContentPageProps {
  items: ContentResource[];
  featuredItems: ContentResource[];
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const ContentIcons: Record<ContentKind, React.ReactNode> = {
  blog: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9m0 0v12" />
    </svg>
  ),
  book: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  ),
  download: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
  event: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  print: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  ),
  resource: (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
};

const kindLabels: Record<ContentKind, string> = {
  blog: "Strategic Essays",
  book: "Canon Volumes",
  download: "Tools & Downloads",
  event: "Events & Gatherings",
  print: "Print Editions",
  resource: "Core Resources",
} as const;

const kindColors: Record<ContentKind, { bg: string; text: string; border: string }> = {
  blog: {
    bg: "bg-gradient-to-br from-emerald-500/10 to-emerald-600/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-200 dark:border-emerald-800",
  },
  book: {
    bg: "bg-gradient-to-br from-amber-500/10 to-amber-600/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
  },
  download: {
    bg: "bg-gradient-to-br from-blue-500/10 to-blue-600/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
  },
  event: {
    bg: "bg-gradient-to-br from-purple-500/10 to-purple-600/10",
    text: "text-purple-600 dark:text-purple-400",
    border: "border-purple-200 dark:border-purple-800",
  },
  print: {
    bg: "bg-gradient-to-br from-gray-500/10 to-gray-600/10",
    text: "text-gray-600 dark:text-gray-400",
    border: "border-gray-200 dark:border-gray-800",
  },
  resource: {
    bg: "bg-gradient-to-br from-cyan-500/10 to-cyan-600/10",
    text: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-200 dark:border-cyan-800",
  },
};

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

const getSlug = (item: RawContentItem): string | undefined => {
  try {
    const stripCollectionPrefix = (value: string) =>
      value.replace(/^(blog|books|downloads|events|prints|resources)\//, "");

    if (item.slug && typeof item.slug === "string") {
      return stripCollectionPrefix(item.slug);
    }

    if (item._raw?.flattenedPath) {
      return stripCollectionPrefix(item._raw.flattenedPath);
    }

    if (item.title) {
      return item.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    return undefined;
  } catch (error) {
    console.error("[getSlug] Error processing slug:", error);
    return undefined;
  }
};

const getHref = (kind: ContentKind, slug: string): string => {
  if (kind === "blog") return `/${slug}`;
  return `/${kind}s/${slug}`;
};

const processContentItems = (
  items: RawContentItem[],
  kind: ContentKind,
  defaultCategory?: string
): ContentResource[] => {
  const processed: ContentResource[] = [];

  items.forEach((item) => {
    try {
      const slug = getSlug(item);
      const title = item.title || "Untitled";

      if (!slug) {
        console.warn(
          `[processContentItems] Skipping item with no slug: ${title}`
        );
        return;
      }

      const tags = Array.isArray(item.tags)
        ? item.tags.map((tag) => String(tag))
        : [];

      processed.push({
        kind,
        title,
        slug,
        href: getHref(kind, slug),
        date: item.date || item.eventDate,
        excerpt: item.excerpt,
        description: item.description,
        category: item.category || defaultCategory,
        tags,
        featured: Boolean(item.featured),
        readTime: item.readTime,
      });
    } catch (error) {
      console.error("[processContentItems] Error processing item:", error);
    }
  });

  return processed;
};

// ---------------------------------------------------------------------------
// Content Cards
// ---------------------------------------------------------------------------

const ContentCard: React.FC<{ item: ContentResource }> = ({ item }) => {
  const colors = kindColors[item.kind];
  const description = item.description || item.excerpt || "";

  return (
    <Link href={item.href} className="group block">
      <article className="relative h-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${colors.bg}`} />
        
        <div className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg ${colors.bg} p-2`}>
                <div className={colors.text}>
                  {ContentIcons[item.kind]}
                </div>
              </div>
              <span className={`text-xs font-semibold uppercase tracking-wider ${colors.text}`}>
                {kindLabels[item.kind]}
              </span>
            </div>
            {item.date && (
              <time className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(item.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                })}
              </time>
            )}
          </div>

          <h3 className="mb-3 font-serif text-lg font-bold text-gray-900 dark:text-white">
            {item.title}
          </h3>

          {description && (
            <p className="mb-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-3">
              {description}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between border-t border-gray-100 pt-3 text-sm dark:border-gray-800">
            <div className="flex items-center gap-2">
              {item.readTime && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {typeof item.readTime === "number"
                    ? `${item.readTime} min`
                    : item.readTime}
                </span>
              )}
            </div>
            <span className={`font-medium ${colors.text} transition-transform group-hover:translate-x-1`}>
              →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

const FeaturedCard: React.FC<{ item: ContentResource }> = ({ item }) => {
  const colors = kindColors[item.kind];
  const description = item.description || item.excerpt || "";

  return (
    <Link href={item.href} className="group block">
      <article className="relative h-full overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-gray-50/50 to-transparent dark:via-gray-800/50 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
        
        <div className="relative p-6">
          <div className="mb-6 flex items-start justify-between">
            <div className={`rounded-xl ${colors.bg} p-3`}>
              <div className={`text-xl ${colors.text}`}>
                {ContentIcons[item.kind]}
              </div>
            </div>
            <div className="text-right">
              <span className={`rounded-full border ${colors.border} ${colors.bg} px-3 py-1 text-xs font-semibold uppercase tracking-wider ${colors.text}`}>
                Featured
              </span>
            </div>
          </div>

          <h3 className="mb-4 font-serif text-2xl font-bold text-gray-900 dark:text-white">
            {item.title}
          </h3>

          {description && (
            <p className="mb-6 text-base leading-relaxed text-gray-600 dark:text-gray-300 line-clamp-4">
              {description}
            </p>
          )}

          <div className="mt-auto flex items-center justify-between border-t border-gray-200 pt-6 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <span className={`text-sm font-semibold ${colors.text}`}>
                {kindLabels[item.kind]}
              </span>
              {item.date && (
                <time className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(item.date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </time>
              )}
            </div>
            <span className={`text-lg font-medium ${colors.text} transition-transform group-hover:translate-x-2`}>
              →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

// ---------------------------------------------------------------------------
// SSG Data Fetching
// ---------------------------------------------------------------------------

const safeGetData = async (
  dataFetcher: (() => RawContentItem[] | undefined) | undefined,
  dataName: string
): Promise<RawContentItem[]> => {
  try {
    if (!dataFetcher || typeof dataFetcher !== "function") {
      console.warn(`[content] ${dataName} fetcher unavailable`);
      return [];
    }
    const data = dataFetcher();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(`[content] Error fetching ${dataName}:`, error);
    return [];
  }
};

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  console.log("📚 [content] Building content library...");

  try {
    const allItems: ContentResource[] = [];

    const contentFetchers: {
      kind: ContentKind;
      data: Promise<RawContentItem[]>;
      category: string;
    }[] = [
      {
        kind: "blog",
        data: safeGetData(getAllPostsMeta, "blog posts"),
        category: "Essays",
      },
      {
        kind: "book",
        data: safeGetData(getAllBooksMeta, "books"),
        category: "Volumes",
      },
      {
        kind: "download",
        data: safeGetData(getAllDownloadsMeta, "downloads"),
        category: "Tools",
      },
      {
        kind: "event",
        data: safeGetData(() => getAllContent?.("events") ?? [], "events"),
        category: "Sessions",
      },
      {
        kind: "print",
        data: safeGetData(() => getAllContent?.("prints") ?? [], "prints"),
        category: "Prints",
      },
      {
        kind: "resource",
        data: safeGetData(
          () => getAllContent?.("resources") ?? [],
          "resources"
        ),
        category: "Resources",
      },
    ];

    await Promise.all(
      contentFetchers.map(async ({ kind, data, category }) => {
        try {
          const items = await data;
          const processed = processContentItems(items, kind, category);
          allItems.push(...processed);
          console.log(`✨ [content] Processed ${processed.length} ${kind}`);
        } catch (error) {
          console.error(`💥 [content] Failed to process ${kind}:`, error);
        }
      })
    );

    const sortedItems = allItems.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      if (Number.isNaN(dateA) && Number.isNaN(dateB)) return 0;
      if (Number.isNaN(dateA)) return 1;
      if (Number.isNaN(dateB)) return -1;
      return dateB - dateA;
    });

    const featuredItems = sortedItems.filter((i) => i.featured).slice(0, 4);

    console.log("[content] Build completed:", {
      total: sortedItems.length,
      featured: featuredItems.length,
    });

    return {
      props: {
        items: JSON.parse(JSON.stringify(sortedItems)),
        featuredItems: JSON.parse(JSON.stringify(featuredItems)),
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("💢 [content] Critical build error:", error);
    return {
      props: { items: [], featuredItems: [] },
      revalidate: 3600,
    };
  }
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

const ContentPage: NextPage<ContentPageProps> = ({ items, featuredItems }) => {
  const [activeFilter, setActiveFilter] = React.useState<ContentKind | "all">(
    "all"
  );
  const [searchQuery, setSearchQuery] = React.useState("");

  const contentStats = React.useMemo(
    () => ({
      all: items.length,
      blog: items.filter((i) => i.kind === "blog").length,
      book: items.filter((i) => i.kind === "book").length,
      download: items.filter((i) => i.kind === "download").length,
      event: items.filter((i) => i.kind === "event").length,
      print: items.filter((i) => i.kind === "print").length,
      resource: items.filter((i) => i.kind === "resource").length,
    }),
    [items]
  );

  const filterOptions = [
    {
      key: "all" as const,
      label: "All Content",
      count: contentStats.all,
    },
    {
      key: "blog" as const,
      label: kindLabels.blog,
      count: contentStats.blog,
    },
    {
      key: "book" as const,
      label: kindLabels.book,
      count: contentStats.book,
    },
    {
      key: "download" as const,
      label: kindLabels.download,
      count: contentStats.download,
    },
    {
      key: "event" as const,
      label: kindLabels.event,
      count: contentStats.event,
    },
    {
      key: "resource" as const,
      label: kindLabels.resource,
      count: contentStats.resource,
    },
  ];

  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      const matchesFilter =
        activeFilter === "all" || item.kind === activeFilter;
      if (!matchesFilter) return false;
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();
      return (
        item.title.toLowerCase().includes(query) ||
        item.excerpt?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [items, activeFilter, searchQuery]);

  return (
    <Layout
      title="Content Library"
      description="A curated library of essays, volumes, tools, and resources for leaders building enduring work and legacy."
    >
      <Head>
        <title>Content Library | Abraham of London</title>
        <meta
          name="description"
          content="A curated library of essays, volumes, tools, sessions, prints, and resources for leaders building enduring work and legacy."
        />
      </Head>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white to-gray-50 py-20 dark:from-gray-950 dark:to-gray-900">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl dark:bg-amber-500/5" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl dark:bg-emerald-500/5" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-gray-400">
                Complete Library
              </span>
            </div>
            <h1 className="mt-6 font-serif text-4xl font-bold text-gray-900 dark:text-white sm:text-5xl">
              Content Library
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600 dark:text-gray-300">
              Every essay, volume, tool, and resource in one place — structured for discovery and designed for action.
            </p>
          </div>

          {/* Stats */}
          <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {filterOptions.slice(1, 5).map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className="rounded-xl border border-gray-200 bg-white p-4 text-center transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filter.count}
                </div>
                <div className="mt-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                  {filter.label}
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Section */}
      {featuredItems.length > 0 && (
        <section className="border-y border-gray-200 bg-white py-16 dark:border-gray-800 dark:bg-gray-900">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <h2 className="font-serif text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                Featured Works
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                A curated selection of essential readings and tools
              </p>
            </div>
            
            <div className="grid gap-6 md:grid-cols-2">
              {featuredItems.map((item) => (
                <FeaturedCard key={item.slug} item={item} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Main Content Section */}
      <section className="bg-gradient-to-b from-gray-50 to-white py-20 dark:from-gray-900 dark:to-gray-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Search & Filters */}
          <div className="mb-12 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search essays, tools, sessions, resources…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-3 text-gray-900 placeholder:text-gray-500 focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400 dark:focus:border-gray-600"
                    aria-label="Search content library"
                  />
                  <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {filterOptions.map((filter) => (
                  <button
                    key={filter.key}
                    type="button"
                    onClick={() => setActiveFilter(filter.key)}
                    className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all ${
                      activeFilter === filter.key
                        ? "border-gray-900 bg-gray-900 text-white dark:border-gray-700 dark:bg-gray-700"
                        : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">
                      {filter.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Results */}
          {filteredItems.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center dark:border-gray-800 dark:bg-gray-900">
              <h3 className="mb-4 font-serif text-2xl font-bold text-gray-900 dark:text-white">
                No results found
              </h3>
              <p className="mb-8 text-gray-600 dark:text-gray-400">
                {searchQuery
                  ? `Nothing matched "${searchQuery}". Try a different term or clear the filters.`
                  : `There is no content in this category yet.`}
              </p>
              {(searchQuery || activeFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setActiveFilter("all");
                  }}
                  className="rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition-all hover:shadow-lg dark:bg-gray-700"
                >
                  Reset filters
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="mb-8 flex items-center justify-between">
                <h3 className="font-serif text-2xl font-bold text-gray-900 dark:text-white">
                  {activeFilter === "all" ? "All Content" : kindLabels[activeFilter]}
                </h3>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <ContentCard key={item.slug} item={item} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-gray-900 to-black py-24">
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-amber-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h2 className="mb-6 font-serif text-4xl font-bold text-white sm:text-5xl">
            Need specific guidance?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-300">
            If you're looking for something specific or need customized resources for your team or project, let's discuss.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/consulting"
              className="inline-flex items-center gap-3 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-4 text-sm font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl hover:shadow-amber-500/30"
            >
              Book a consultation
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-900 px-10 py-4 text-sm font-semibold text-white transition-all hover:scale-105 hover:bg-gray-800 hover:shadow-lg"
            >
              Contact me directly
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default ContentPage;