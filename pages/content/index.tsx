// pages/content/index.tsx
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";
import {
  LIBRARY_AESTHETICS,
  CONTENT_CATEGORIES,
} from "@/lib/content";

import {
  getAllUnifiedContent,
  type UnifiedContent,
} from "@/lib/server/unified-content";

type FilterKey =
  | "all"
  | "page"
  | "post"
  | "book"
  | "download"
  | "event"
  | "print"
  | "resource";

type LibraryProps = {
  items: UnifiedContent[];
};

/* -------------------------------------------------------------------------- */
/* SMALL UI PRIMITIVES                                                        */
/* -------------------------------------------------------------------------- */

const FilterPill: React.FC<{
  label: string;
  value: FilterKey;
  active: boolean;
  count: number;
  onClick: () => void;
}> = ({ label, value, active, count, onClick }) => {
  const isDisabled = value !== "all" && count === 0;

  return (
    <button
      type="button"
      onClick={!isDisabled ? onClick : undefined}
      disabled={isDisabled}
      className={[
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium tracking-wider transition-all",
        active && !isDisabled ? "scale-105 shadow-sm" : "",
        isDisabled ? "opacity-35 cursor-not-allowed" : "opacity-80 hover:opacity-100",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        backgroundColor: active && !isDisabled
          ? LIBRARY_AESTHETICS.colors.primary.saffron
          : "rgba(15,23,42,0.8)",
        color: active && !isDisabled
          ? "#020617"
          : LIBRARY_AESTHETICS.colors.primary.parchment,
        border: `1px solid ${LIBRARY_AESTHETICS.colors.primary.saffron}40`,
      }}
    >
      <span>{label}</span>
      <span
        className="rounded-full px-1.5 py-0.5 text-[0.6rem] uppercase"
        style={{
          backgroundColor: active && !isDisabled
            ? "rgba(15,23,42,0.08)"
            : "rgba(15,23,42,0.6)",
        }}
      >
        {count}
      </span>
    </button>
  );
};

const TypeTag: React.FC<{ type: UnifiedContent["type"] }> = ({ type }) => {
  const map: Record<
    UnifiedContent["type"],
    { label: string; color: string; icon: string }
  > = {
    page: {
      label: "Page",
      color: CONTENT_CATEGORIES.CANON.color,
      icon: "📜",
    },
    post: {
      label: "Essay",
      color: CONTENT_CATEGORIES.POSTS.color,
      icon: "✒",
    },
    book: {
      label: "Book",
      color: CONTENT_CATEGORIES.BOOKS.color,
      icon: "📚",
    },
    download: {
      label: "Download",
      color: CONTENT_CATEGORIES.RESOURCES.color,
      icon: "⬇",
    },
    event: {
      label: "Event",
      color: CONTENT_CATEGORIES.EVENTS.color,
      icon: "🕯",
    },
    print: {
      label: "Print",
      color: CONTENT_CATEGORIES.PRINTS.color,
      icon: "🖼",
    },
    resource: {
      label: "Resource",
      color: CONTENT_CATEGORIES.RESOURCES.color,
      icon: "⚙",
    },
  };

  const cfg = map[type];

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{
        backgroundColor: `${cfg.color}15`,
        color: cfg.color,
        border: `1px solid ${cfg.color}40`,
      }}
    >
      <span>{cfg.icon}</span>
      <span>{cfg.label}</span>
    </span>
  );
};

const LibraryCard: React.FC<{ item: UnifiedContent }> = ({ item }) => {
  return (
    <Link href={item.url || "#"} className="group block h-full">
      <article
        className="flex h-full flex-col overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        style={{
          borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
          backgroundColor: "rgba(15,23,42,0.8)",
          backgroundImage:
            "linear-gradient(135deg, rgba(212,175,55,0.05) 0%, transparent 40%)",
        }}
      >
        {/* Header / strip */}
        <div className="relative h-28 w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900" />
          <div
            className="absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 0 0, rgba(212,175,55,0.25), transparent 60%)",
            }}
          />
          <div className="absolute left-4 top-3">
            <TypeTag type={item.type} />
          </div>
          {item.date && (
            <div className="absolute bottom-3 right-4 text-[0.65rem] uppercase tracking-wide text-slate-400">
              {new Date(item.date).toLocaleDateString("en-GB")}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-5">
          <h3
            className="mb-2 font-serif text-lg font-medium"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
          >
            {item.title || "Untitled"}
          </h3>
          {(item.description || item.excerpt) ? (
            <p
              className="mb-4 line-clamp-3 text-sm leading-relaxed opacity-80"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.parchment }}
            >
              {item.description || item.excerpt || ""}
            </p>
          ) : null}

          <div className="mt-auto flex items-center justify-between pt-2 text-xs">
            <div className="flex flex-wrap gap-2">
              {(item.tags || []).slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-black/20 px-2 py-0.5 text-[0.65rem] uppercase tracking-wide"
                  style={{
                    color: LIBRARY_AESTHETICS.colors.primary.parchment,
                    border: "1px solid rgba(148,163,184,0.3)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
            <span
              className="inline-flex items-center gap-1 text-[0.7rem] font-medium tracking-wide"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
            >
              Open
              <span className="transition-transform group-hover:translate-x-0.5">
                ↗
              </span>
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
};

/* -------------------------------------------------------------------------- */
/* PAGE                                                                       */
/* -------------------------------------------------------------------------- */

const ContentLibraryPage: NextPage<LibraryProps> = ({ items }) => {
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [query, setQuery] = React.useState("");

  // Counts per type for pills
  const counts = React.useMemo(() => {
    const base: Record<FilterKey, number> = {
      all: items.length,
      page: 0,
      post: 0,
      book: 0,
      download: 0,
      event: 0,
      print: 0,
      resource: 0,
    };
    for (const it of items) {
      // it.type is one of the non-"all" keys
      base[it.type as Exclude<FilterKey, "all">] += 1;
    }
    return base;
  }, [items]);

  const filtered = React.useMemo(() => {
    let base =
      filter === "all" ? items : items.filter((it) => it.type === filter);

    if (!query.trim()) return base;

    const q = query.toLowerCase();
    return base.filter(
      (it) =>
        (it.title || "").toLowerCase().includes(q) ||
        (it.description || "").toLowerCase().includes(q) ||
        (it.excerpt || "").toLowerCase().includes(q) ||
        (it.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }, [items, filter, query]);

  const activeLabel = React.useMemo(() => {
    const map: Record<FilterKey, string> = {
      all: "All content",
      page: "Pages",
      post: "Essays",
      book: "Books",
      download: "Downloads & tools",
      event: "Events & rooms",
      print: "Prints",
      resource: "Resources",
    };
    return map[filter];
  }, [filter]);

  return (
    <Layout
      title="The Library"
      description="Unified access to all pages, essays, books, downloads, prints, and events curated under Abraham of London."
      structuredData={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Abraham of London — Library",
      }}
    >
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* HERO / HEADER */}
        <section className="border-b border-amber-400/20 py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p
                  className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.28em]"
                  style={{ color: LIBRARY_AESTHETICS.colors.primary.saffron }}
                >
                  Canon · Essays · Books · Tools · Events
                </p>
                <h1 className="font-serif text-4xl font-light text-cream sm:text-5xl">
                  The Library
                </h1>
                <p className="mt-4 max-w-xl text-sm sm:text-base text-cream/75">
                  One doorway into the whole ecosystem: pages, essays, books,
                  downloads, prints, and events — unified, searchable, and
                  built for men who intend to do something with what they read.
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <div className="text-xs text-cream/40">
                  Showing{" "}
                  <span className="font-semibold text-cream/80">
                    {filtered.length}
                  </span>{" "}
                  of{" "}
                  <span className="font-semibold text-cream/70">
                    {items.length}
                  </span>{" "}
                  items
                  <span className="mx-1">•</span>
                  <span className="text-cream/60">{activeLabel}</span>
                  {query.trim() && (
                    <>
                      <span className="mx-1">•</span>
                      <span className="text-cream/60">
                        Search: “{query.trim()}”
                      </span>
                    </>
                  )}
                </div>
                <Link
                  href="/context"
                  className="text-xs font-medium underline-offset-4 hover:underline"
                  style={{
                    color: LIBRARY_AESTHETICS.colors.primary.parchment,
                  }}
                >
                  Read the philosophy behind the library →
                </Link>
              </div>
            </div>

            {/* Filters & Search */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: "all", label: "All" },
                    { key: "post", label: "Essays" },
                    { key: "book", label: "Books" },
                    { key: "download", label: "Downloads" },
                    { key: "event", label: "Events" },
                    { key: "print", label: "Prints" },
                    { key: "page", label: "Pages" },
                    { key: "resource", label: "Resources" },
                  ] as { key: FilterKey; label: string }[]
                ).map(({ key, label }) => (
                  <FilterPill
                    key={key}
                    label={label}
                    value={key}
                    active={filter === key}
                    count={counts[key]}
                    onClick={() => setFilter(key)}
                  />
                ))}
              </div>

              <div className="w-full sm:w-64">
                <div className="relative">
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full rounded-full border bg-slate-950/70 px-4 py-2 text-sm text-cream placeholder:text-slate-500 focus:outline-none focus:ring-2"
                    style={{
                      borderColor:
                        query.length > 0
                          ? `${LIBRARY_AESTHETICS.colors.primary.saffron}60`
                          : "rgba(148,163,184,0.4)",
                      boxShadow:
                        query.length > 0
                          ? `0 0 0 1px ${LIBRARY_AESTHETICS.colors.primary.saffron}40`
                          : "none",
                    }}
                    placeholder="Search titles, descriptions, tags…"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                    ⌕
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* GRID */}
        <section className="py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            {filtered.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950/60 p-10 text-center text-sm text-slate-300">
                Nothing matches that yet. Adjust the filter or search term, or{" "}
                <Link
                  href="/context"
                  className="underline underline-offset-4"
                >
                  read the context
                </Link>{" "}
                to see how the library is curated.
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((item) => (
                  <LibraryCard key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

/* -------------------------------------------------------------------------- */
/* DATA LOADING                                                               */
/* -------------------------------------------------------------------------- */

// Helper function to deeply sanitize undefined values
const sanitizeForSerialization = <T,>(data: T): T => {
  if (data === undefined || data === null) {
    return null as T;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeForSerialization) as T;
  }

  if (typeof data === "object") {
    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeForSerialization(value);
    }
    return sanitized as T;
  }

  return data;
};

export const getStaticProps: GetStaticProps<LibraryProps> = async () => {
  try {
    const items = await getAllUnifiedContent();

    const safeItems = Array.isArray(items) ? items : [];
    const sanitizedItems = sanitizeForSerialization(safeItems);

    const validatedItems = (sanitizedItems as UnifiedContent[]).map((item) => ({
      ...item,
      id: item.id || `unknown-${Date.now()}-${Math.random()}`,
      title: item.title || "Untitled",
      url: item.url || "/",
      description: item.description || null,
      excerpt: item.excerpt || null,
      tags: Array.isArray(item.tags) ? item.tags.filter(Boolean) : [],
    }));

    return {
      props: {
        items: validatedItems,
      },
      revalidate: 60 * 10,
    };
  } catch (error) {
    console.error("Error in getStaticProps for /content:", error);
    return {
      props: {
        items: [],
      },
      revalidate: 60 * 10,
    };
  }
};

export default ContentLibraryPage;