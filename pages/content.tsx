import type { GetStaticProps } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";

// Use your existing data fetching functions
import { getAllPostsMeta } from "@/lib/server/posts-data";
import { getAllDownloadsMeta } from "@/lib/server/downloads-data";
import { getAllBooksMeta } from "@/lib/server/books-data";
// import { getAllPrintsMeta } from "@/lib/server/prints-data"; // Not needed, using getAllContent
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
// SSG
// ---------------------------------------------------------------------------

interface ContentPageProps {
  items: ContentResource[];
}

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  console.log("============================================");
  console.log("[content] getStaticProps STARTING");
  console.log("============================================");
  
  try {
    const items: ContentResource[] = [];

    // Fetch posts
    try {
      const posts = getAllPostsMeta?.() || [];
      console.log(`[content] Found ${posts.length} raw posts`);
      
      posts.forEach((p: any) => {
        // More lenient slug extraction
        const slug = p.slug || p._raw?.flattenedPath?.replace('blog/', '') || p.title?.toLowerCase().replace(/\s+/g, '-');
        
        if (p.title && slug) {
          console.log(`[content] Adding blog post: ${p.title} (slug: ${slug})`);
          items.push({
            kind: "blog",
            title: p.title,
            slug: slug,
            href: `/blog/${slug}`,
            date: p.date,
            excerpt: p.excerpt,
            description: p.description,
            category: p.category,
            tags: p.tags || [],
          });
        } else {
          console.log(`[content] Skipping post - missing title or slug:`, { title: p.title, slug });
        }
      });
    } catch (err) {
      console.error("[content] Error fetching posts:", err);
    }

    // Fetch books
    try {
      const books = getAllBooksMeta?.() || [];
      console.log(`[content] Found ${books.length} books`);
      books.forEach((b: any) => {
        const slug = b.slug || b._raw?.flattenedPath?.replace('books/', '') || b.title?.toLowerCase().replace(/\s+/g, '-');
        if (b.title && slug) {
          items.push({
            kind: "book",
            title: b.title,
            slug: slug,
            href: `/books/${slug}`,
            date: b.date,
            excerpt: b.excerpt,
            category: "Books",
            tags: b.tags || [],
          });
        }
      });
    } catch (err) {
      console.error("[content] Error fetching books:", err);
    }

    // Fetch downloads
    try {
      const downloads = getAllDownloadsMeta?.() || [];
      console.log(`[content] Found ${downloads.length} downloads`);
      downloads.forEach((d: any) => {
        const slug = d.slug || d._raw?.flattenedPath?.replace('downloads/', '') || d.title?.toLowerCase().replace(/\s+/g, '-');
        if (d.title && slug) {
          items.push({
            kind: "download",
            title: d.title,
            slug: slug,
            href: `/downloads/${slug}`,
            date: d.date,
            excerpt: d.excerpt,
            description: d.description,
            category: d.category || "Downloads",
            tags: d.tags || [],
          });
        }
      });
    } catch (err) {
      console.error("[content] Error fetching downloads:", err);
    }

    // Fetch events
    try {
      const events = getAllContent?.("events") || [];
      console.log(`[content] Found ${events.length} events`);
      events.forEach((e: any) => {
        const slug = e.slug || e._raw?.flattenedPath?.replace('events/', '') || e.title?.toLowerCase().replace(/\s+/g, '-');
        if (e.title && slug) {
          items.push({
            kind: "event",
            title: e.title,
            slug: slug,
            href: `/events/${slug}`,
            date: e.eventDate || e.date,
            excerpt: e.excerpt,
            description: e.description,
            category: "Events",
            tags: e.tags || [],
          });
        }
      });
    } catch (err) {
      console.error("[content] Error fetching events:", err);
    }

    // Fetch prints - use getAllContent like events since getAllPrintsMeta isn't being called
    try {
      const prints = getAllContent?.("prints") || [];
      console.log(`[content] Found ${prints.length} prints via getAllContent`);
      prints.forEach((p: any) => {
        const slug = p.slug || p._raw?.flattenedPath?.replace('prints/', '') || p.title?.toLowerCase().replace(/\s+/g, '-');
        if (p.title && slug) {
          console.log(`[content] Adding print: ${p.title} (slug: ${slug})`);
          items.push({
            kind: "print",
            title: p.title,
            slug: slug,
            href: `/prints/${slug}`,
            date: p.date,
            excerpt: p.excerpt,
            description: p.description,
            category: "Printables",
            tags: p.tags || [],
          });
        }
      });
    } catch (err) {
      console.error("[content] Error fetching prints:", err);
    }

    // Fetch resources
    try {
      const resources = getAllContent?.("resources") || [];
      console.log(`[content] Found ${resources.length} resources`);
      resources.forEach((r: any) => {
        const slug = r.slug || r._raw?.flattenedPath?.replace('resources/', '') || r.title?.toLowerCase().replace(/\s+/g, '-');
        if (r.title && slug) {
          items.push({
            kind: "resource",
            title: r.title,
            slug: slug,
            href: `/resources/${slug}`,
            date: r.date,
            excerpt: r.excerpt,
            description: r.description,
            category: "Resources",
            tags: r.tags || [],
          });
        }
      });
    } catch (err) {
      console.error("[content] Error fetching resources:", err);
    }

    console.log(`[content] ========================================`);
    console.log(`[content] Total items collected: ${items.length}`);
    console.log(`[content] Breakdown - Blog: ${items.filter(i => i.kind === 'blog').length}, Books: ${items.filter(i => i.kind === 'book').length}, Downloads: ${items.filter(i => i.kind === 'download').length}, Events: ${items.filter(i => i.kind === 'event').length}, Prints: ${items.filter(i => i.kind === 'print').length}, Resources: ${items.filter(i => i.kind === 'resource').length}`);
    console.log(`[content] ========================================`);

    // Sort newest first by date
    const sorted = items.slice().sort((a, b) => {
      if (!a.date && !b.date) return 0;
      if (!a.date) return 1;
      if (!b.date) return -1;
      return a.date < b.date ? 1 : -1;
    });

    // JSON-safe serialization
    const safeItems = JSON.parse(JSON.stringify(sorted));

    return {
      props: { items: safeItems },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("[content] Critical error in getStaticProps:", error);
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
                      ? "border-yellow-600/60 bg-yellow-600 text-gray-900 shadow-lg shadow-yellow-600/30"
                      : "border-white/10 bg-gray-900/80 text-gray-100 hover:border-yellow-600/40 hover:bg-gray-800"
                  }
                `}
              >
                {filter.label}
                <span
                  className={`
                    rounded-full px-2 py-0.5 text-xs
                    ${
                      activeFilter === filter.key
                        ? "bg-gray-900/20 text-gray-900"
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
              <p className="text-lg mb-2">No content found for this filter.</p>
              {total === 0 && (
                <p className="text-sm text-gray-500">
                  Check build logs for data fetching errors.
                </p>
              )}
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
                    className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-lg transition-all hover:-translate-y-1 hover:border-yellow-600/40 hover:shadow-2xl"
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

                      <h2 className="mb-3 font-serif text-xl font-light text-white group-hover:text-yellow-600">
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