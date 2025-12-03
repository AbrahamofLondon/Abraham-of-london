// pages/content/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";

import Layout from "@/components/Layout";
import { getAllContent } from "@/lib/content";

type ContentItem = ReturnType<typeof getAllContent>[number];

type CategoryKey =
  | "all"
  | "posts"
  | "books"
  | "downloads"
  | "events"
  | "prints"
  | "resources";

type ContentPageProps = {
  items: ContentItem[];
};

const CATEGORY_META: Record<
  Exclude<CategoryKey, "all">,
  { label: string; badge: string; singular: string; plural: string }
> = {
  posts: {
    label: "Strategic Essays",
    badge: "Strategic Essay",
    singular: "essay",
    plural: "essays",
  },
  books: {
    label: "Curated Volumes",
    badge: "Curated Volume",
    singular: "volume",
    plural: "volumes",
  },
  downloads: {
    label: "Execution Tools",
    badge: "Execution Tool",
    singular: "tool",
    plural: "tools",
  },
  events: {
    label: "Live Sessions",
    badge: "Live Session",
    singular: "session",
    plural: "sessions",
  },
  prints: {
    label: "Print Editions",
    badge: "Print Edition",
    singular: "print",
    plural: "prints",
  },
  resources: {
    label: "Core Resources",
    badge: "Core Resource",
    singular: "resource",
    plural: "resources",
  },
};

function getPrimaryCategory(item: ContentItem): Exclude<CategoryKey, "all"> {
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

function buildHref(item: ContentItem): string {
  const t = (item as any)._type as string | undefined;
  const slug = (item as any).slug as string;

  if (!slug) return "#";

  switch (t) {
    case "Post":
      // Posts are routed with /[slug]
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

const ContentPage: NextPage<ContentPageProps> = ({ items }) => {
  const SITE_URL =
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.abrahamoflondon.org";
  const canonicalUrl = `${SITE_URL}/content`;

  const [activeCategory, setActiveCategory] = React.useState<CategoryKey>("all");
  const [query, setQuery] = React.useState("");

  const counts = React.useMemo(() => {
    const base = {
      posts: 0,
      books: 0,
      downloads: 0,
      events: 0,
      prints: 0,
      resources: 0,
    };

    for (const item of items) {
      const cat = getPrimaryCategory(item);
      // @ts-expect-error – cat is guaranteed to be a key
      base[cat] += 1;
    }

    const total =
      base.posts +
      base.books +
      base.downloads +
      base.events +
      base.prints +
      base.resources;

    return { total, ...base };
  }, [items]);

  const filtered = React.useMemo(() => {
    let working = items.slice().sort((a, b) => {
      const da = (a as any).date ? new Date((a as any).date).getTime() : 0;
      const db = (b as any).date ? new Date((b as any).date).getTime() : 0;
      return db - da;
    });

    if (activeCategory !== "all") {
      working = working.filter(
        (item) => getPrimaryCategory(item) === activeCategory
      );
    }

    if (query.trim()) {
      const q = query.trim().toLowerCase();
      working = working.filter((item) => {
        const title = String((item as any).title ?? "").toLowerCase();
        const excerpt = String((item as any).excerpt ?? "").toLowerCase();
        const description = String(
          (item as any).description ?? ""
        ).toLowerCase();
        const tags = Array.isArray((item as any).tags)
          ? ((item as any).tags as string[])
          : [];
        const tagText = tags.join(" ").toLowerCase();

        return (
          title.includes(q) ||
          excerpt.includes(q) ||
          description.includes(q) ||
          tagText.includes(q)
        );
      });
    }

    return working;
  }, [items, activeCategory, query]);

  const activeMeta =
    activeCategory === "all" ? null : CATEGORY_META[activeCategory as Exclude<CategoryKey, "all">];

  const activeCount =
    activeCategory === "all"
      ? counts.total
      : counts[activeCategory as Exclude<CategoryKey, "all">];

  return (
    <Layout title="Content Library">
      <Head>
        <title>Content Library | Abraham of London</title>
        <meta
          name="description"
          content="Essays, canon volumes, execution tools, live sessions, and core resources — organised for people who are serious about purpose, governance, and legacy."
        />
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-slate-950 to-charcoal text-cream">
        {/* HERO / HEADER */}
        <section className="relative border-b border-softGold/20">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 -top-40 h-72 bg-[radial-gradient(circle_at_top,_rgba(226,197,120,0.22),_transparent_70%)]" />
            <div className="absolute inset-y-0 left-[12%] w-px bg-gradient-to-b from-softGold/70 via-softGold/0 to-transparent" />
            <div className="absolute inset-y-0 right-[10%] w-px bg-gradient-to-t from-softGold/60 via-softGold/0 to-transparent" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-16 sm:pb-14 sm:pt-20">
            <p className="text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-softGold/80">
              Abraham of London · Canon
            </p>
            <h1 className="mt-1 font-serif text-3xl font-semibold text-cream sm:text-4xl md:text-5xl">
              Content Library
            </h1>
            <p className="mt-3 max-w-3xl text-sm text-gray-200 sm:text-[0.95rem]">
              Essays, canon volumes, execution tools, live sessions, and core
              resources — organised for people who are serious about **purpose,
              governance, and legacy**.
            </p>
            <p className="mt-1 max-w-2xl text-[0.8rem] text-softGold/80">
              Think of this as a **Harrods back-room library**: curated shelves,
              not random posts.
            </p>

            {/* SEARCH */}
            <div className="mt-6 max-w-xl">
              <div className="relative rounded-full border border-softGold/35 bg-black/70 px-4 py-2 shadow-[0_14px_40px_rgba(0,0,0,0.9)]">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs text-softGold/70">
                  🔍
                </span>
                <input
                  className="w-full bg-transparent pl-8 pr-2 text-sm text-cream placeholder:text-softGold/50 focus:outline-none"
                  placeholder="Search essays, tools, sessions, and resources…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        {/* FILTER BAR + LIST */}
        <section className="mx-auto max-w-6xl px-4 pb-20 pt-8 sm:pt-10">
          {/* FILTER CHIPS */}
          <div className="flex flex-wrap gap-3">
            <FilterChip
              label="All Content"
              count={counts.total}
              active={activeCategory === "all"}
              onClick={() => setActiveCategory("all")}
            />
            <FilterChip
              label="Strategic Essays"
              count={counts.posts}
              active={activeCategory === "posts"}
              onClick={() => setActiveCategory("posts")}
            />
            <FilterChip
              label="Curated Volumes"
              count={counts.books}
              active={activeCategory === "books"}
              onClick={() => setActiveCategory("books")}
            />
            <FilterChip
              label="Execution Tools"
              count={counts.downloads}
              active={activeCategory === "downloads"}
              onClick={() => setActiveCategory("downloads")}
            />
            <FilterChip
              label="Live Sessions"
              count={counts.events}
              active={activeCategory === "events"}
              onClick={() => setActiveCategory("events")}
            />
            <FilterChip
              label="Print Editions"
              count={counts.prints}
              active={activeCategory === "prints"}
              onClick={() => setActiveCategory("prints")}
            />
            <FilterChip
              label="Core Resources"
              count={counts.resources}
              active={activeCategory === "resources"}
              onClick={() => setActiveCategory("resources")}
            />
          </div>

          {/* SECTION HEADER */}
          <div className="mt-8 flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-softGold/80">
                {activeCategory === "all"
                  ? "All Content"
                  : activeMeta?.label ?? ""}
              </p>
              <h2 className="font-serif text-2xl font-semibold text-cream sm:text-3xl">
                {activeCategory === "all"
                  ? "Shelf View"
                  : activeMeta?.label ?? "Shelf View"}
              </h2>
            </div>
            <p className="text-xs text-gray-300">
              {activeCount}{" "}
              {activeCategory === "all"
                ? activeCount === 1
                  ? "item"
                  : "items"
                : activeCount === 1
                ? activeMeta?.singular
                : activeMeta?.plural}
            </p>
          </div>

          {/* LIST */}
          <div className="mt-5 space-y-4">
            {filtered.length === 0 ? (
              <div className="rounded-3xl border border-softGold/30 bg-black/70 p-8 text-center text-sm text-gray-200 shadow-[0_18px_50px_rgba(0,0,0,0.9)]">
                <p className="font-semibold text-cream">
                  No content matches this view.
                </p>
                <p className="mt-2 text-gray-300">
                  Try clearing the search or switching category. The shelves are
                  fuller than they look.
                </p>
              </div>
            ) : (
              filtered.map((item) => (
                <ContentRow key={(item as any)._id} item={item} />
              ))
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
};

type FilterChipProps = {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
};

const FilterChip: React.FC<FilterChipProps> = ({
  label,
  count,
  active,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition",
        active
          ? "border-softGold bg-softGold text-black shadow-[0_12px_32px_rgba(0,0,0,0.9)]"
          : "border-softGold/35 bg-black/70 text-softGold hover:border-softGold hover:bg-black",
      ].join(" ")}
    >
      <span>{label}</span>
      <span
        className={
          active
            ? "rounded-full bg-black/15 px-2 py-[2px] text-[0.7rem]"
            : "rounded-full bg-softGold/10 px-2 py-[2px] text-[0.7rem]"
        }
      >
        {count}
      </span>
    </button>
  );
};

type ContentRowProps = {
  item: ContentItem;
};

const ContentRow: React.FC<ContentRowProps> = ({ item }) => {
  const title = (item as any).title as string;
  const excerpt =
    ((item as any).excerpt ??
      (item as any).description ??
      "") as string;
  const date = (item as any).date as string | undefined;
  const tags = (Array.isArray((item as any).tags)
    ? (item as any).tags
    : []) as string[];

  const category = getPrimaryCategory(item);
  const meta = CATEGORY_META[category];
  const href = buildHref(item);

  const dateLabel =
    date && !Number.isNaN(new Date(date).getTime())
      ? new Date(date).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "2-digit",
        })
      : null;

  return (
    <a
      href={href}
      className="group relative block overflow-hidden rounded-3xl border border-softGold/35 bg-gradient-to-r from-charcoal/95 via-charcoal-light/95 to-charcoal/95 px-5 py-4 text-sm shadow-[0_18px_50px_rgba(0,0,0,0.9)] transition hover:-translate-y-0.5 hover:border-softGold/80"
    >
      <div className="pointer-events-none absolute inset-0 opacity-35">
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-softGold/80 via-softGold/35 to-transparent" />
        <div className="absolute inset-x-12 bottom-0 h-px bg-gradient-to-r from-softGold/30 via-softGold/5 to-transparent" />
      </div>

      <div className="relative flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Left: meta */}
        <div className="flex-1 space-y-1.5">
          <p className="inline-flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-softGold/80">
            <span>{meta.badge}</span>
          </p>
          <h2 className="font-serif text-lg font-semibold text-cream sm:text-xl">
            {title}
          </h2>
          {excerpt && (
            <p className="max-w-3xl text-[0.8rem] text-gray-200 group-hover:text-gray-100">
              {excerpt}
            </p>
          )}

          <div className="mt-1 flex flex-wrap items-center gap-3 text-[0.75rem] text-gray-400">
            {dateLabel && <span>{dateLabel}</span>}
            {tags.length > 0 && (
              <>
                <span className="h-3 w-px bg-white/20" />
                <span>{tags.slice(0, 3).join(" · ")}</span>
              </>
            )}
          </div>
        </div>

        {/* Right: CTA */}
        <div className="mt-1 flex items-center justify-between gap-6 sm:mt-0 sm:flex-col sm:items-end sm:justify-center sm:text-right">
          <span className="text-[0.75rem] font-semibold uppercase tracking-[0.18em] text-softGold group-hover:text-softGold/90">
            Open ↗
          </span>
        </div>
      </div>
    </a>
  );
};

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  const items = getAllContent();

  return {
    props: {
      items,
    },
    revalidate: 60, // 1 minute – keeps library fresh
  };
};

export default ContentPage;