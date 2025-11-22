import type { GetStaticProps } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";

// Use your existing data fetching functions instead of contentlayer/generated
import { getAllPostsMeta } from "@/lib/server/posts-data";
import { getAllDownloadsMeta } from "@/lib/server/downloads-data";
import { getAllBooksMeta } from "@/lib/server/books-data";
import { getAllContent } from "@/lib/mdx";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContentResource = {
  kind: "blog" | "book" | "download" | "event" | "print" | "resource";
  title: string;
  slug: string;
  href: string;
  date?: string;
  excerpt?: string;
  description?: string;
  category?: string;
  tags?: string[];
};

// ---------------------------------------------------------------------------
// Normalizers
// ---------------------------------------------------------------------------

function normalisePosts(posts: any[]): ContentResource[] {
  return posts.map((p) => ({
    kind: "blog" as const,
    title: p.title || "Untitled Post",
    slug: p.slug,
    href: `/blog/${p.slug}`,
    date: p.date,
    excerpt: p.excerpt,
    description: p.description,
    category: p.category,
    tags: p.tags || [],
  }));
}

function normaliseBooks(books: any[]): ContentResource[] {
  return books.map((b) => ({
    kind: "book" as const,
    title: b.title || "Untitled Book",
    slug: b.slug,
    href: `/books/${b.slug}`,
    date: b.date,
    excerpt: b.excerpt,
    category: "Books",
    tags: b.tags || [],
  }));
}

function normaliseDownloads(downloads: any[]): ContentResource[] {
  return downloads.map((d) => ({
    kind: "download" as const,
    title: d.title || "Untitled Download",
    slug: d.slug,
    href: `/downloads/${d.slug}`,
    date: d.date,
    excerpt: d.excerpt,
    description: d.description,
    category: d.category || "Downloads",
    tags: d.tags || [],
  }));
}

function normaliseEvents(events: any[]): ContentResource[] {
  return events.map((e) => ({
    kind: "event" as const,
    title: e.title || "Untitled Event",
    slug: e.slug,
    href: `/events/${e.slug}`,
    date: e.eventDate || e.date,
    excerpt: e.excerpt,
    description: e.description,
    category: "Events",
    tags: e.tags || [],
  }));
}

function normalisePrints(prints: any[]): ContentResource[] {
  return prints.map((p) => ({
    kind: "print" as const,
    title: p.title || "Untitled Print",
    slug: p.slug,
    href: `/prints/${p.slug}`,
    date: p.date,
    excerpt: p.excerpt,
    category: "Printables",
    tags: p.tags || [],
  }));
}

function normaliseResources(resources: any[]): ContentResource[] {
  return resources.map((r) => ({
    kind: "resource" as const,
    title: r.title || "Untitled Resource",
    slug: r.slug,
    href: `/resources/${r.slug}`,
    date: r.date,
    excerpt: r.excerpt,
    description: r.description,
    category: "Resources",
    tags: r.tags || [],
  }));
}

// ---------------------------------------------------------------------------
// SSG
// ---------------------------------------------------------------------------

interface ContentPageProps {
  items: ContentResource[];
}

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  try {
    // Fetch all content using existing helper functions
    const posts = getAllPostsMeta?.() || [];
    const books = getAllBooksMeta?.() || [];
    const downloads = getAllDownloadsMeta?.() || [];
    
    // Use getAllContent for other types
    const events = getAllContent?.("events") || [];
    const prints = getAllContent?.("prints") || [];
    const resources = getAllContent?.("resources") || [];

    const items: ContentResource[] = [
      ...normalisePosts(posts),
      ...normaliseBooks(books),
      ...normaliseDownloads(downloads),
      ...normaliseEvents(events),
      ...normalisePrints(prints),
      ...normaliseResources(resources),
    ];

    // Sort newest first by date
    const sorted = items.slice().sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date < b.date ? 1 : -1;
    });

    return {
      props: { items: sorted },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Error fetching content:", error);
    return {
      props: { items: [] },
      revalidate: 3600,
    };
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ContentPage({ items }: ContentPageProps) {
  const [activeFilter, setActiveFilter] = React.useState<string>("all");

  const total = items.length;
  const blogCount = items.filter((i) => i.kind === "blog").length;
  const bookCount = items.filter((i) => i.kind === "book").length;
  const downloadCount = items.filter((i) => i.kind === "download").length;
  const eventCount = items.filter((i) => i.kind === "event").length;
  const printCount = items.filter((i) => i.kind === "print").length;
  const resourceCount = items.filter((i) => i.kind === "resource").length;

  const filtered =
    activeFilter === "all"
      ? items
      : items.filter((i) => i.kind === activeFilter);

  const filters = [
    { key: "all", label: "All Content", count: total },
    { key: "blog", label: "Blog", count: blogCount },
    { key: "book", label: "Books", count: bookCount },
    { key: "download", label: "Downloads", count: downloadCount },
    { key: "event", label: "Events", count: eventCount },
    { key: "print", label: "Prints", count: printCount },
    { key: "resource", label: "Resources", count: resourceCount },
  ];

  return (
    <>
      <Head>
        <title>Strategic Insights & Resources | Abraham of London</title>
        <meta
          name="description"
          content="Explore essays, books, downloads, events, and resources for fathers, founders, and leaders building enduring legacies."
        />
      </Head>

      <main className="relative min-h-screen bg-gradient-to-br from-black via-deepCharcoal to-black px-4 py-16">
        <div className="relative z-10 mx-auto max-w-7xl">
          {/* Header */}
          <header className="mb-12 text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-softGold">
              Content Hub
            </p>
            <h1 className="mb-4 font-serif text-4xl font-light text-white sm:text-5xl lg:text-6xl">
              Strategic Insights &amp; Resources
            </h1>
            <p className="mx-auto max-w-2xl text-gray-300">
              Everything you need to build legacy: essays, downloads, events,
              and tools for fathers, founders, and leaders.
            </p>
          </header>

          {/* Filter Pills */}
          <div className="mb-12 flex flex-wrap justify-center gap-3">
            {filters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => setActiveFilter(filter.key)}
                className={`
                  inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all
                  ${
                    activeFilter === filter.key
                      ? "border-softGold/60 bg-softGold text-deepCharcoal shadow-lg shadow-softGold/30"
                      : "border-white/10 bg-charcoal/80 text-gray-100 hover:border-softGold/40 hover:bg-charcoal"
                  }
                `}
              >
                {filter.label}
                <span
                  className={`
                    rounded-full px-2 py-0.5 text-xs
                    ${
                      activeFilter === filter.key
                        ? "bg-deepCharcoal/20 text-deepCharcoal"
                        : "bg-white/10 text-gray-400"
                    }
                  `}
                >
                  {filter.count}
                </span>
              </button>
            ))}
          </div>

          {/* Content Grid */}
          {filtered.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-black/40 px-6 py-10 text-center text-gray-300">
              <p className="text-lg">No content found for this filter.</p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((item) => {
                const displayExcerpt = item.description || item.excerpt || "";
                const kindBadgeColors: Record<string, string> = {
                  blog: "bg-blue-500/10 text-blue-400 border-blue-500/30",
                  book: "bg-purple-500/10 text-purple-400 border-purple-500/30",
                  download: "bg-green-500/10 text-green-400 border-green-500/30",
                  event: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
                  print: "bg-pink-500/10 text-pink-400 border-pink-500/30",
                  resource: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30",
                };

                return (
                  <article
                    key={`${item.kind}-${item.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-lg transition-all hover:-translate-y-1 hover:border-softGold/40 hover:shadow-2xl"
                  >
                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-wider ${
                            kindBadgeColors[item.kind] ||
                            "bg-gray-500/10 text-gray-400 border-gray-500/30"
                          }`}
                        >
                          {item.kind}
                        </span>
                        {item.date && (
                          <time className="text-xs text-gray-500">
                            {new Date(item.date).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </time>
                        )}
                      </div>

                      <h2 className="mb-3 font-serif text-xl font-light text-white group-hover:text-softGold">
                        <Link href={item.href}>{item.title}</Link>
                      </h2>

                      {displayExcerpt && (
                        <p className="mb-4 line-clamp-3 text-sm text-gray-300">
                          {displayExcerpt}
                        </p>
                      )}

                      {item.category && (
                        <div className="mt-auto pt-2">
                          <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 text-xs text-gray-400">
                            {item.category}
                          </span>
                        </div>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}