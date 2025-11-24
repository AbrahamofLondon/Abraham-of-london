// pages/content.tsx
import type { GetStaticProps } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";

// Existing data helpers
import { getAllPostsMeta } from "@/lib/server/posts-data";
import { getAllDownloadsMeta } from "@/lib/server/downloads-data";
import { getAllBooksMeta } from "@/lib/server/books-data";
import { getAllContent } from "@/lib/mdx";

// ---------------------------------------------------------------------------
// Types
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
  tags?: string[];
  featured?: boolean;
  readTime?: string | number;
  _raw?: {
    flattenedPath?: string;
  };
  // Event-specific fields
  eventDate?: string;
  // Download-specific fields
  fileSize?: string;
  [key: string]: unknown;
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
// Icons / helpers
// ---------------------------------------------------------------------------

const ContentIcons: Record<ContentKind, string> = {
  blog: "Blog",
  book: "Book",
  download: "↓",
  event: "Event",
  print: "Print",
  resource: "Resource",
};

const ArrowIcon = () => (
  <svg
    className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M14 5l7 7m0 0l-7 7m7-7H3"
    />
  </svg>
);

const kindOrder: ContentKind[] = [
  "blog",
  "book",
  "download",
  "event",
  "print",
  "resource",
];

const kindLabels: Record<ContentKind, string> = {
  blog: "Blog Posts",
  book: "Books",
  download: "Downloads",
  event: "Events",
  print: "Printables",
  resource: "Resources",
};

const getKindColor = (kind: ContentKind): string => {
  const colors: Record<ContentKind, string> = {
    blog: "from-blue-500/20 to-blue-600/20 border-blue-400/40",
    book: "from-purple-500/20 to-purple-600/20 border-purple-400/40",
    download: "from-green-500/20 to-green-600/20 border-green-400/40",
    event: "from-yellow-500/20 to-yellow-600/20 border-yellow-400/40",
    print: "from-pink-500/20 to-pink-600/20 border-pink-400/40",
    resource: "from-cyan-500/20 to-cyan-600/20 border-cyan-400/40",
  };
  return colors[kind];
};

const getKindBadgeColor = (kind: ContentKind): string => {
  const colors: Record<ContentKind, string> = {
    blog: "border-blue-400/40 text-blue-300 bg-blue-500/15",
    book: "border-purple-400/40 text-purple-300 bg-purple-500/15",
    download: "border-green-400/40 text-green-300 bg-green-500/15",
    event: "border-yellow-400/40 text-yellow-200 bg-yellow-500/15",
    print: "border-pink-400/40 text-pink-300 bg-pink-500/15",
    resource: "border-cyan-400/40 text-cyan-300 bg-cyan-500/15",
  };
  return colors[kind];
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

const getSlug = (item: RawContentItem): string | undefined => {
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
};

const getHref = (kind: ContentKind, slug: string): string => {
  if (kind === "blog") return `/${slug}`;
  return `/${kind}s/${slug}`;
};

const processContentItems = (
  items: RawContentItem[],
  kind: ContentKind,
  defaultCategory?: string,
): ContentResource[] => {
  const processed: ContentResource[] = [];

  items.forEach((item) => {
    const slug = getSlug(item);
    const title = item.title || "Untitled";

    if (!slug) return;

    processed.push({
      kind,
      title,
      slug,
      href: getHref(kind, slug),
      date: item.date || item.eventDate,
      excerpt: item.excerpt,
      description: item.description,
      category: item.category || defaultCategory,
      tags: item.tags || [],
      featured: item.featured || false,
      readTime: item.readTime,
    });
  });

  return processed;
};

// ---------------------------------------------------------------------------
// Card component
// ---------------------------------------------------------------------------

function ContentCard({ item }: { item: ContentResource }) {
  const description = item.description || item.excerpt || "";

  const ctaLabel =
    item.kind === "download"
      ? "View & Download"
      : item.kind === "event"
      ? "View Event"
      : item.kind === "book"
      ? "View Book"
      : "Read more";

  return (
    <article
      key={`${item.kind}-${item.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/12 bg-black/55 shadow-lg transition-all hover:-translate-y-2 hover:border-softGold/50 hover:shadow-2xl"
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${getKindColor(
          item.kind,
        )} opacity-0 transition-opacity group-hover:opacity-15`}
      />

      <div className="relative flex flex-1 flex-col p-6">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-lg">{ContentIcons[item.kind]}</div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${getKindBadgeColor(
                item.kind,
              )}`}
            >
              {item.kind}
            </span>
          </div>

          {item.date && (
            <time className="flex-shrink-0 text-xs text-gray-400">
              {new Date(item.date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </time>
          )}
        </div>

        {/* Content */}
        <h3 className="mb-3 line-clamp-2 font-serif text-xl font-light text-white group-hover:text-softGold">
          <Link href={item.href} className="hover:underline">
            {item.title}
          </Link>
        </h3>

        {description && (
          <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-gray-100">
            {description}
          </p>
        )}

        {/* Footer */}
        <div className="mt-auto pt-4">
          <div className="flex items-center justify-between">
            {item.category && (
              <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs text-gray-200">
                {item.category}
              </span>
            )}

            <Link
              href={item.href}
              className="inline-flex items-center text-sm font-semibold text-softGold transition-all hover:gap-2"
            >
              {ctaLabel}
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

// ---------------------------------------------------------------------------
// SSG
// ---------------------------------------------------------------------------

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  console.log("============================================");
  console.log("[content] getStaticProps STARTING");
  console.log("============================================");

  try {
    const allItems: ContentResource[] = [];

    // Blog posts
    try {
      const posts = getAllPostsMeta?.() || [];
      const processedPosts = processContentItems(
        posts as unknown as RawContentItem[],
        "blog",
        "Blog",
      );
      allItems.push(...processedPosts);
      console.log(`[content] Processed ${processedPosts.length} blog posts`);
    } catch (err) {
      console.error("[content] Error fetching posts:", err);
    }

    // Books
    try {
      const books = getAllBooksMeta?.() || [];
      const processedBooks = processContentItems(
        books as unknown as RawContentItem[],
        "book",
        "Books",
      );
      allItems.push(...processedBooks);
      console.log(`[content] Processed ${processedBooks.length} books`);
    } catch (err) {
      console.error("[content] Error fetching books:", err);
    }

    // Downloads
    try {
      const downloads = getAllDownloadsMeta?.() || [];
      const processedDownloads = processContentItems(
        downloads as unknown as RawContentItem[],
        "download",
        "Downloads",
      );
      allItems.push(...processedDownloads);
      console.log(
        `[content] Processed ${processedDownloads.length} downloads`,
      );
    } catch (err) {
      console.error("[content] Error fetching downloads:", err);
    }

    // Events
    try {
      const events = getAllContent?.("events") || [];
      const eventsAsRaw = events as unknown as RawContentItem[];
      const processedEvents = processContentItems(
        eventsAsRaw,
        "event",
        "Events",
      );
      allItems.push(...processedEvents);
      console.log(`[content] Processed ${processedEvents.length} events`);
    } catch (err) {
      console.error("[content] Error fetching events:", err);
    }

    // Prints
    try {
      const prints = getAllContent?.("prints") || [];
      const printsAsRaw = prints as unknown as RawContentItem[];
      const processedPrints = processContentItems(
        printsAsRaw,
        "print",
        "Printables",
      );
      allItems.push(...processedPrints);
      console.log(`[content] Processed ${processedPrints.length} prints`);
    } catch (err) {
      console.error("[content] Error fetching prints:", err);
    }

    // Resources
    try {
      const resources = getAllContent?.("resources") || [];
      const resourcesAsRaw = resources as unknown as RawContentItem[];
      const processedResources = processContentItems(
        resourcesAsRaw,
        "resource",
        "Resources",
      );
      allItems.push(...processedResources);
      console.log(
        `[content] Processed ${processedResources.length} resources`,
      );
    } catch (err) {
      console.error("[content] Error fetching resources:", err);
    }

    const sortedItems = allItems.sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const featuredItems = sortedItems.filter((i) => i.featured).slice(0, 3);

    console.log("[content] ========================================");
    console.log(`[content] Total items: ${sortedItems.length}`);
    console.log(`[content] Featured items: ${featuredItems.length}`);
    console.log("[content] ========================================");

    return {
      props: {
        items: JSON.parse(JSON.stringify(sortedItems)),
        featuredItems: JSON.parse(JSON.stringify(featuredItems)),
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("[content] Critical error in getStaticProps:", error);
    return {
      props: { items: [], featuredItems: [] },
      revalidate: 3600,
    };
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ContentPage: React.FC<ContentPageProps> = ({ items, featuredItems }) => {
  const [activeFilter, setActiveFilter] = React.useState<ContentKind | "all">(
    "all",
  );
  const [searchQuery, setSearchQuery] = React.useState("");

  const contentStats = {
    all: items.length,
    blog: items.filter((i) => i.kind === "blog").length,
    book: items.filter((i) => i.kind === "book").length,
    download: items.filter((i) => i.kind === "download").length,
    event: items.filter((i) => i.kind === "event").length,
    print: items.filter((i) => i.kind === "print").length,
    resource: items.filter((i) => i.kind === "resource").length,
  };

  const filters: Array<{
    key: ContentKind | "all";
    label: string;
    count: number;
  }> = [
    { key: "all", label: "All Content", count: contentStats.all },
    { key: "blog", label: "Blog Posts", count: contentStats.blog },
    { key: "book", label: "Books", count: contentStats.book },
    { key: "download", label: "Downloads", count: contentStats.download },
    { key: "event", label: "Events", count: contentStats.event },
    { key: "print", label: "Printables", count: contentStats.print },
    { key: "resource", label: "Resources", count: contentStats.resource },
  ];

  const filteredItems = items.filter((item) => {
    const matchesFilter = activeFilter === "all" || item.kind === activeFilter;
    if (!matchesFilter) return false;

    if (!searchQuery) return true;

    const q = searchQuery.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.excerpt?.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.tags.some((tag) => tag.toLowerCase().includes(q))
    );
  });

  const groupedByKind: Record<ContentKind, ContentResource[]> = {
    blog: [],
    book: [],
    download: [],
    event: [],
    print: [],
    resource: [],
  };

  for (const item of filteredItems) {
    groupedByKind[item.kind].push(item);
  }

  const handleKeyDown = (
    event: React.KeyboardEvent,
    filterKey: ContentKind | "all",
  ) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveFilter(filterKey);
    }
  };

  return (
    <Layout title="Strategic Insights & Resources">
      <Head>
        <title>Strategic Insights &amp; Resources | Abraham of London</title>
        <meta
          name="description"
          content="Master strategic thinking with essays, books, tools, and resources for fathers, founders, and leaders building enduring legacies."
        />
        <meta
          name="keywords"
          content="strategy, leadership, legacy building, fatherhood, entrepreneurship, resources"
        />
      </Head>

      <div className="min-h-screen bg-[#050608]">
        {/* Hero */}
        <section className="relative overflow-hidden px-4 py-20 lg:py-28">
          <div className="absolute inset-0 bg-gradient-to-r from-softGold/8 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 lg:gap-16">
              <div className="flex flex-col justify-center">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-softGold/40 bg-softGold/15 px-4 py-2 text-sm text-softGold">
                  <span>✨</span>
                  <span>Content Hub</span>
                </div>

                <h1 className="mb-6 font-serif text-4xl font-light text-white sm:text-5xl lg:text-6xl">
                  Build Your{" "}
                  <span className="bg-gradient-to-r from-softGold to-yellow-200 bg-clip-text text-transparent">
                    Legacy
                  </span>{" "}
                  With Strategic Wisdom
                </h1>

                <p className="mb-8 text-xl leading-relaxed text-gray-100">
                  Curated essays, tools, and resources for fathers, founders,
                  and leaders committed to building enduring impact across
                  generations.
                </p>

                <div className="flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("content-grid")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="group relative overflow-hidden rounded-lg bg-gradient-to-r from-softGold to-yellow-600 px-8 py-4 font-semibold text-black transition-all hover:shadow-2xl hover:shadow-yellow-500/25"
                  >
                    <span className="relative z-10">Explore Resources</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-softGold opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFilter("download")}
                    className="group rounded-lg border border-softGold/40 bg-black/60 px-8 py-4 font-semibold text-softGold transition-all hover:bg-softGold/15 hover:shadow-lg hover:shadow-yellow-500/10"
                  >
                    <span className="flex items-center gap-2">
                      Free Downloads
                      <ArrowIcon />
                    </span>
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="mt-12 lg:mt-0">
                <div className="grid grid-cols-2 gap-6">
                  {filters.slice(1).map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() =>
                        setActiveFilter(filter.key as ContentKind | "all")
                      }
                      onKeyDown={(e) =>
                        handleKeyDown(e, filter.key as ContentKind | "all")
                      }
                      className={`group rounded-2xl border bg-gradient-to-br ${getKindColor(
                        filter.key as ContentKind,
                      )} p-6 backdrop-blur-sm transition-all hover:scale-105 hover:shadow-2xl focus:outline-none focus:ring-2 focus:ring-softGold focus:ring-offset-2 focus:ring-offset-black`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {ContentIcons[filter.key as ContentKind]}
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-white">
                            {filter.count}
                          </div>
                          <div className="text-sm text-gray-200">
                            {filter.label}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Featured */}
        {featuredItems.length > 0 && (
          <section className="px-4 py-16">
            <div className="mx-auto max-w-7xl">
              <div className="mb-12 text-center">
                <h2 className="font-serif text-3xl font-light text-white sm:text-4xl">
                  Featured <span className="text-softGold">Essentials</span>
                </h2>
                <p className="mt-4 text-gray-200">
                  Handpicked resources to get you started
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-3">
                {featuredItems.map((item) => (
                  <div
                    key={item.slug}
                    className="group relative overflow-hidden rounded-2xl border border-white/12 bg-gradient-to-br from-white/8 to-white/0 p-8 backdrop-blur-sm transition-all hover:border-softGold/40 hover:shadow-2xl"
                  >
                    <div className="absolute top-6 right-6 text-2xl">
                      {ContentIcons[item.kind]}
                    </div>

                    <div className="mb-4">
                      <span
                        className={`inline-block rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wide ${getKindBadgeColor(
                          item.kind,
                        )} text-white`}
                      >
                        {item.kind}
                      </span>
                    </div>

                    <h3 className="mb-4 font-serif text-xl font-light text-white group-hover:text-softGold">
                      <Link href={item.href}>{item.title}</Link>
                    </h3>

                    {item.excerpt && (
                      <p className="mb-6 line-clamp-3 text-gray-100">
                        {item.excerpt}
                      </p>
                    )}

                    <Link
                      href={item.href}
                      className="inline-flex items-center text-sm font-semibold text-softGold transition-all hover:gap-3"
                    >
                      Explore Resource
                      <ArrowIcon />
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Main Content */}
        <section id="content-grid" className="px-4 py-16">
          <div className="mx-auto max-w-7xl">
            {/* Controls */}
            <div className="mb-12">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                {/* Search */}
                <div className="flex-1">
                  <div className="relative max-w-md">
                    <input
                      type="text"
                      placeholder="Search resources, tools, insights..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-2xl border border-white/12 bg-black/60 px-6 py-4 text-white placeholder-gray-400 backdrop-blur-sm transition-all focus:border-softGold/60 focus:outline-none focus:ring-2 focus:ring-softGold/25"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                      🔍
                    </div>
                  </div>
                </div>

                {/* Filter pills */}
                <div className="flex flex-wrap gap-3">
                  {filters.map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setActiveFilter(filter.key)}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-softGold focus:ring-offset-2 focus:ring-offset-black ${
                        activeFilter === filter.key
                          ? "border-softGold bg-softGold text-black shadow-lg shadow-yellow-500/30"
                          : "border-white/12 bg-black/55 text-gray-100 hover:border-softGold/50 hover:bg-gray-900"
                      }`}
                    >
                      <span className="text-xs">
                        {filter.key === "all"
                          ? "📁"
                          : ContentIcons[filter.key as ContentKind]}
                      </span>
                      {filter.label}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          activeFilter === filter.key
                            ? "bg-black/10 text-black"
                            : "bg-white/10 text-gray-300"
                        }`}
                      >
                        {filter.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Result summary */}
            <div className="mb-8 flex items-center justify-between text-sm text-gray-300">
              <div>
                Showing {filteredItems.length} of {items.length} resources
              </div>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-softGold hover:text-yellow-300 focus:outline-none focus:underline"
                >
                  Clear search
                </button>
              )}
            </div>

            {/* Grid / grouped content */}
            {filteredItems.length === 0 ? (
              <div className="rounded-2xl border border-white/12 bg-black/55 px-6 py-16 text-center">
                <div className="mb-4 text-6xl">🔍</div>
                <h3 className="mb-2 text-xl font-semibold text-white">
                  No resources found
                </h3>
                <p className="mb-6 text-gray-300">
                  {searchQuery
                    ? `No results for "${searchQuery}". Try different keywords.`
                    : `No ${
                        activeFilter !== "all" ? `${activeFilter} ` : ""
                      }resources available.`}
                </p>
                {(searchQuery || activeFilter !== "all") && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setActiveFilter("all");
                    }}
                    className="rounded-lg bg-softGold px-6 py-2 font-semibold text-black transition-all hover:shadow-lg hover:shadow-yellow-500/25 focus:outline-none focus:ring-2 focus:ring-softGold focus:ring-offset-2 focus:ring-offset-black"
                  >
                    Show all resources
                  </button>
                )}
              </div>
            ) : activeFilter === "all" ? (
              // Grouped view for "All"
              <div className="space-y-12">
                {kindOrder.map((kind) => {
                  const group = groupedByKind[kind];
                  if (!group.length) return null;

                  return (
                    <section key={kind}>
                      <header className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 font-serif text-2xl font-light text-white">
                          <span>{ContentIcons[kind]}</span>
                          <span>{kindLabels[kind]}</span>
                        </h2>
                        <span className="text-xs uppercase tracking-[0.2em] text-gray-400">
                          {group.length} item
                          {group.length !== 1 ? "s" : ""}
                        </span>
                      </header>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {group.map((item) => (
                          <ContentCard
                            key={`${item.kind}-${item.slug}`}
                            item={item}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
              </div>
            ) : (
              // Flat grid for a specific filter
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <ContentCard
                    key={`${item.kind}-${item.slug}`}
                    item={item}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <div className="rounded-2xl border border-softGold/25 bg-gradient-to-r from-softGold/10 to-yellow-600/10 px-8 py-12 backdrop-blur-sm">
              <h2 className="font-serif text-3xl font-light text-white sm:text-4xl">
                Ready to Build Your Legacy?
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-gray-100">
                Join founders, fathers, and leaders who are already transforming
                their approach to strategy and legacy building.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-4">
                <button
                  type="button"
                  className="rounded-lg bg-gradient-to-r from-softGold to-yellow-600 px-8 py-4 font-semibold text-black transition-all hover:shadow-2xl hover:shadow-yellow-500/25 focus:outline-none focus:ring-2 focus:ring-softGold focus:ring-offset-2 focus:ring-offset-black"
                >
                  Get Started Today
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-softGold/40 px-8 py-4 font-semibold text-softGold transition-all hover:bg-softGold/15 focus:outline-none focus:ring-2 focus:ring-softGold focus:ring-offset-2 focus:ring-offset-black"
                >
                  Book a Strategy Call
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default ContentPage;