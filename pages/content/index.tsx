// pages/content/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";
import { getAllContent } from "@/lib/content";

type CategoryKey =
  | "all"
  | "posts"
  | "books"
  | "downloads"
  | "events"
  | "prints"
  | "resources";

type ContentItem = any;

type Props = {
  items: ContentItem[];
  counts: Record<CategoryKey, number>;
};

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

function getPrimaryCategory(item: ContentItem): Exclude<CategoryKey, "all"> {
  const kind = (item as any)._kind as string | undefined;

  if (kind) {
    switch (kind) {
      case "post":
        return "posts";
      case "book":
        return "books";
      case "download":
        return "downloads";
      case "event":
        return "events";
      case "print":
        return "prints";
      case "resource":
        return "resources";
      default:
        return "posts";
    }
  }

  const t = (item as any)._type as string | undefined;

  switch (t) {
    case "Post":
      return "posts";
    case "Book":
      return "books";
    case "Download":
      return "downloads";
    case "Event":
      return "events";
    case "Print":
      return "prints";
    case "Resource":
      return "resources";
    default:
      return "posts";
  }
}

function getTypeLabel(item: ContentItem): string {
  const cat = getPrimaryCategory(item);
  switch (cat) {
    case "posts":
      return "Strategic Essay";
    case "books":
      return "Curated Volume";
    case "downloads":
      return "Execution Tool";
    case "events":
      return "Live Session";
    case "prints":
      return "Print Edition";
    case "resources":
      return "Core Resource";
    default:
      return "Strategic Essay";
  }
}

function buildHref(item: ContentItem): string {
  const kind = (item as any)._kind as string | undefined;
  const slug = (item as any).slug as string | undefined;
  if (!slug) return "#";

  if (kind) {
    switch (kind) {
      case "post":
        return `/${slug}`;
      case "book":
        return `/books/${slug}`;
      case "download":
        return `/downloads/${slug}`;
      case "event":
        return `/events/${slug}`;
      case "print":
        return `/prints/${slug}`;
      case "resource":
        return `/resources/${slug}`;
      default:
        break;
    }
  }

  const t = (item as any)._type as string | undefined;
  switch (t) {
    case "Post":
      return `/${slug}`;
    case "Book":
      return `/books/${slug}`;
    case "Download":
      return `/downloads/${slug}`;
    case "Event":
      return `/events/${slug}`;
    case "Print":
      return `/prints/${slug}`;
    case "Resource":
      return `/resources/${slug}`;
    default:
      return `/${slug}`;
  }
}

function formatDate(date?: string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */

const ContentLibraryPage: NextPage<Props> = ({ items, counts }) => {
  const [activeFilter, setActiveFilter] = React.useState<CategoryKey>("all");
  const [query, setQuery] = React.useState("");

  const filteredItems = React.useMemo(() => {
    const q = query.trim().toLowerCase();

    return items.filter((item) => {
      const cat = getPrimaryCategory(item);

      if (activeFilter !== "all" && cat !== activeFilter) return false;

      if (!q) return true;

      const title = (item.title ?? "").toString().toLowerCase();
      const description = (item.description ?? item.excerpt ?? "")
        .toString()
        .toLowerCase();
      const tags = Array.isArray(item.tags)
        ? (item.tags as string[]).join(" ").toLowerCase()
        : "";
      const typeLabel = getTypeLabel(item).toLowerCase();

      return (
        title.includes(q) ||
        description.includes(q) ||
        tags.includes(q) ||
        typeLabel.includes(q)
      );
    });
  }, [items, activeFilter, query]);

  const activeLabel: string =
    activeFilter === "all"
      ? "All Content"
      : activeFilter === "posts"
      ? "Strategic Essays"
      : activeFilter === "books"
      ? "Curated Volumes"
      : activeFilter === "downloads"
      ? "Execution Tools"
      : activeFilter === "events"
      ? "Live Sessions"
      : activeFilter === "prints"
      ? "Print Editions"
      : "Core Resources";

  return (
    <Layout title="Content Library">
      <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-charcoal text-cream">
        {/* Header */}
        <section className="border-b border-softGold/20 bg-gradient-to-br from-black via-[#050608] to-[#101217]">
          <div className="mx-auto max-w-6xl px-4 pb-10 pt-16 sm:pt-20">
            <header className="space-y-5">
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-softGold/80">
                Abraham of London · Canon
              </p>
              <h1 className="font-serif text-3xl font-semibold sm:text-4xl md:text-5xl">
                Content Library
              </h1>
              <p className="max-w-3xl text-sm leading-relaxed text-softGold/80 sm:text-[0.95rem]">
                Essays, canon volumes, execution tools, live sessions, and core
                resources — organised for people who are serious about{" "}
                <span className="font-semibold text-softGold">
                  purpose, governance, and legacy.
                </span>
              </p>
              <p className="max-w-2xl text-[0.8rem] text-softGold/60">
                Think of this as a{" "}
                <span className="italic">
                  “Harrods back-room library” — curated shelves, not random
                  posts.
                </span>
              </p>

              <div className="mt-5">
                <div className="relative max-w-xl">
                  <div className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(circle_at_top,_rgba(234,200,125,0.18),_transparent_70%)] opacity-60" />
                  <div className="relative flex items-center gap-3 rounded-full border border-softGold/40 bg-black/70 px-4 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.85)] backdrop-blur">
                    <span className="text-sm text-softGold/80">🔍</span>
                    <input
                      type="search"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search essays, tools, sessions, and resources…"
                      className="h-8 w-full bg-transparent text-sm text-cream placeholder:text-softGold/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </header>
          </div>
        </section>

        {/* Filters + Shelf */}
        <section className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:pt-10">
          {/* Filter chips */}
          <div className="flex flex-wrap gap-3">
            {(
              [
                ["all", "All Content"] as const,
                ["posts", "Strategic Essays"] as const,
                ["books", "Curated Volumes"] as const,
                ["downloads", "Execution Tools"] as const,
                ["events", "Live Sessions"] as const,
                ["prints", "Print Editions"] as const,
                ["resources", "Core Resources"] as const,
              ] satisfies [CategoryKey, string][]
            ).map(([key, label]) => {
              const isActive = activeFilter === key;
              const count = counts[key] ?? 0;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveFilter(key)}
                  className={[
                    "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[0.78rem] font-semibold tracking-[0.12em] uppercase transition-all",
                    isActive
                      ? "border-softGold bg-softGold text-black shadow-[0_12px_30px_rgba(0,0,0,0.9)]"
                      : "border-softGold/30 bg-black/40 text-softGold/80 hover:border-softGold/60 hover:bg-black/70",
                  ].join(" ")}
                >
                  <span>{label}</span>
                  <span
                    className={
                      isActive
                        ? "rounded-full bg-black/15 px-2 py-0.5 text-[0.7rem]"
                        : "rounded-full bg-softGold/10 px-2 py-0.5 text-[0.7rem] text-softGold/80"
                    }
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Shelf label */}
          <div className="mt-8 flex items-end justify-between gap-4">
            <div>
              <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-softGold/70">
                {activeFilter === "all" ? "All Content" : activeLabel}
              </p>
              <h2 className="mt-1 font-serif text-2xl font-semibold text-cream">
                Shelf View
              </h2>
            </div>
            <p className="text-[0.75rem] text-softGold/60">
              {filteredItems.length} item
              {filteredItems.length === 1 ? "" : "s"}
            </p>
          </div>

          {/* Shelf list */}
          <div className="mt-6 space-y-4">
            {filteredItems.map((item) => {
              const href = buildHref(item);
              const typeLabel = getTypeLabel(item);
              const dateLabel = formatDate(item.date ?? null);
              const tags =
                Array.isArray(item.tags) && item.tags.length > 0
                  ? (item.tags as string[])
                  : [];
              const excerpt =
                (item.excerpt || item.description || "").toString();

              return (
                <article
                  key={`${item._id ?? item.slug ?? href}`}
                  className="group relative overflow-hidden rounded-3xl border border-softGold/35 bg-gradient-to-r from-black/80 via-[#050608] to-black/85 px-5 py-4 shadow-[0_18px_45px_rgba(0,0,0,0.95)] transition-all hover:border-softGold/70 hover:-translate-y-0.5"
                >
                  <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-softGold/10 via-transparent to-transparent opacity-60 group-hover:opacity-90" />

                  <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="flex-1 space-y-1.5">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-softGold/75">
                        {typeLabel}
                      </p>
                      <h3 className="font-serif text-lg font-semibold text-cream sm:text-xl">
                        {item.title}
                      </h3>
                      {excerpt && (
                        <p className="line-clamp-2 text-[0.85rem] text-gray-300">
                          {excerpt}
                        </p>
                      )}
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[0.75rem] text-softGold/70">
                        {dateLabel && <span>{dateLabel}</span>}
                        {tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-softGold/25 px-2 py-0.5 text-[0.7rem] uppercase tracking-[0.14em]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-end sm:mt-0 sm:w-32">
                      <Link
                        href={href}
                        className="inline-flex items-center gap-2 rounded-full bg-softGold px-4 py-1.5 text-[0.78rem] font-semibold uppercase tracking-[0.16em] text-black transition-all hover:bg-softGold/90"
                      >
                        <span>Open</span>
                        <span className="text-xs">↗</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="mt-8 rounded-3xl border border-softGold/30 bg-black/70 px-6 py-10 text-center text-sm text-softGold/80">
                Nothing on this shelf yet. Try switching category, or clearing
                the search.
              </div>
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default ContentLibraryPage;

/* -------------------------------------------------------------------------- */
/* Static props                                                                */
/* -------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<Props> = async () => {
  const rawItems = getAllContent();

  const counts: Record<CategoryKey, number> = {
    all: rawItems.length,
    posts: 0,
    books: 0,
    downloads: 0,
    events: 0,
    prints: 0,
    resources: 0,
  };

  for (const item of rawItems) {
    const cat = getPrimaryCategory(item);
    counts[cat] += 1;
  }

  return {
    props: {
      items: rawItems,
      counts,
    },
    revalidate: 60,
  };
};