// pages/content/index.tsx
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Link from "next/link";
import Image from "next/image";

import Layout from "@/components/Layout";
import {
  buildSearchIndex,
  type SearchDoc,
  type SearchDocType,
} from "@/lib/searchIndex";

type ContentPageProps = {
  docs: SearchDoc[];
};

// ---------- TYPE & CATEGORY CONFIG ----------

const typeConfig: Record<
  SearchDocType,
  {
    label: string;
    description: string;
    color: {
      bg: string;
      text: string;
      border: string;
      gradient: string;
      accent: string;
      subtle: string;
    };
    icon: string;
    category: "insights" | "frameworks" | "tools" | "archives";
  }
> = {
  post: {
    label: "Insight",
    description: "Thoughtful essays and perspectives",
    color: {
      bg: "bg-blue-500/10",
      text: "text-blue-300",
      border: "border-blue-500/30",
      gradient: "from-blue-500/30 via-blue-700/15 to-slate-900/80",
      accent: "bg-blue-500/30",
      subtle: "from-blue-900/40 via-slate-950/70 to-black",
    },
    icon: "💭",
    category: "insights",
  },
  book: {
    label: "Book",
    description: "Comprehensive volumes and collections",
    color: {
      bg: "bg-amber-500/10",
      text: "text-amber-300",
      border: "border-amber-500/35",
      gradient: "from-amber-500/35 via-amber-700/20 to-zinc-900/85",
      accent: "bg-amber-500/30",
      subtle: "from-amber-900/45 via-zinc-950/70 to-black",
    },
    icon: "📚",
    category: "frameworks",
  },
  download: {
    label: "Download",
    description: "Practical tools and templates",
    color: {
      bg: "bg-emerald-500/10",
      text: "text-emerald-300",
      border: "border-emerald-500/30",
      gradient: "from-emerald-500/30 via-emerald-700/20 to-slate-900/85",
      accent: "bg-emerald-500/30",
      subtle: "from-emerald-900/45 via-slate-950/70 to-black",
    },
    icon: "📥",
    category: "tools",
  },
  print: {
    label: "Print",
    description: "Curated prints and editions",
    color: {
      bg: "bg-purple-500/10",
      text: "text-purple-300",
      border: "border-purple-500/30",
      gradient: "from-purple-500/30 via-purple-700/20 to-zinc-900/85",
      accent: "bg-purple-500/30",
      subtle: "from-purple-900/45 via-zinc-950/70 to-black",
    },
    icon: "🖨️",
    category: "archives",
  },
  resource: {
    label: "Resource",
    description: "Guides and reference materials",
    color: {
      bg: "bg-sky-500/10",
      text: "text-sky-300",
      border: "border-sky-500/30",
      gradient: "from-sky-500/30 via-sky-700/20 to-slate-900/85",
      accent: "bg-sky-500/30",
      subtle: "from-sky-900/45 via-slate-950/70 to-black",
    },
    icon: "📋",
    category: "tools",
  },
  canon: {
    label: "Canon",
    description: "Foundational principles and systems",
    color: {
      bg: "bg-rose-500/10",
      text: "text-rose-300",
      border: "border-rose-500/35",
      gradient: "from-rose-500/35 via-rose-700/20 to-zinc-900/85",
      accent: "bg-rose-500/30",
      subtle: "from-rose-900/45 via-zinc-950/70 to-black",
    },
    icon: "⚖️",
    category: "frameworks",
  },
};

const categoryConfig: Record<
  string,
  {
    label: string;
    description: string;
    color: string;
    gradient: string;
    icon: string;
    bgGradient: string;
  }
> = {
  insights: {
    label: "Insights",
    description: "Essays and perspectives",
    color: "border-blue-500/40",
    gradient: "from-blue-900/50 via-slate-950/70 to-black",
    bgGradient:
      "bg-gradient-to-br from-blue-950/60 via-black/80 to-slate-900/40",
    icon: "💭",
  },
  frameworks: {
    label: "Frameworks",
    description: "Systems and principles",
    color: "border-amber-500/40",
    gradient: "from-amber-900/50 via-zinc-950/70 to-black",
    bgGradient:
      "bg-gradient-to-br from-amber-950/60 via-black/80 to-zinc-900/40",
    icon: "⚙️",
  },
  tools: {
    label: "Tools",
    description: "Resources and downloads",
    color: "border-emerald-500/40",
    gradient: "from-emerald-900/50 via-slate-950/70 to-black",
    bgGradient:
      "bg-gradient-to-br from-emerald-950/60 via-black/80 to-slate-900/40",
    icon: "🛠️",
  },
  archives: {
    label: "Archives",
    description: "Prints and collections",
    color: "border-purple-500/40",
    gradient: "from-purple-900/50 via-zinc-950/70 to-black",
    bgGradient:
      "bg-gradient-to-br from-purple-950/60 via-black/80 to-zinc-900/40",
    icon: "📦",
  },
};

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  const docs = buildSearchIndex();
  return {
    props: { docs },
    revalidate: 3600,
  };
};

// ---------- CARD HELPERS: HREF, ASPECT, FIT ----------

const getHrefForDoc = (doc: SearchDoc): string => {
  if (doc.href) return doc.href;
  if (doc.type === "post") return `/blog/${doc.slug}`;
  return `/${doc.type}/${doc.slug}`;
};

const getAspectClassForDoc = (doc: SearchDoc): string => {
  const raw = doc as any;
  const explicitAspect = raw.coverAspect ?? raw.aspect;

  // If you ever set coverAspect in MDX (book | wide | square | portrait | landscape),
  // this will respect it first.
  switch (explicitAspect) {
    case "book":
    case "portrait":
      return "aspect-[3/4]";
    case "square":
      return "aspect-square";
    case "wide":
    case "landscape":
      return "aspect-[16/9] md:aspect-[3/2]";
    default:
      // Fallback by type
      if (doc.type === "book" || doc.type === "print") {
        return "aspect-[3/4]";
      }
      return "aspect-[16/9] md:aspect-[3/2]";
  }
};

const getObjectFitForDoc = (doc: SearchDoc): "object-cover" | "object-contain" => {
  const raw = doc as any;
  const fit = raw.coverFit ?? raw.fit;
  if (fit === "contain") return "object-contain";
  return "object-cover";
};

// ---------- SINGLE LUXURY CARD (ONE CARD TO RULE THEM ALL) ----------

const LuxContentCard: React.FC<{ doc: SearchDoc }> = ({ doc }) => {
  const config = typeConfig[doc.type];
  const href = getHrefForDoc(doc);
  const aspectClass = getAspectClassForDoc(doc);
  const fitClass = getObjectFitForDoc(doc);

  const safeTitle = doc.title;
  const safeExcerpt = doc.excerpt;

  return (
    <Link href={href} className="group block h-full">
      <article
        className={[
          "relative flex h-full flex-col overflow-hidden rounded-2xl",
          "border border-gray-800/80 bg-gradient-to-b from-[#050509]/95 via-black/96 to-[#020308]/98",
          "shadow-[0_24px_70px_rgba(0,0,0,0.85)] transition-transform duration-300",
          "group-hover:-translate-y-1 group-hover:shadow-[0_32px_90px_rgba(0,0,0,0.95)]",
          "group-hover:border-gray-700/80",
        ].join(" ")}
      >
        {/* Image frame */}
        <div
          className={[
            "relative w-full overflow-hidden",
            "bg-gradient-to-br",
            config.color.gradient,
            aspectClass,
          ].join(" ")}
        >
          {doc.coverImage ? (
            <>
              <Image
                src={doc.coverImage}
                alt={safeTitle}
                fill
                sizes="(min-width:1024px) 30vw, (min-width:640px) 45vw, 100vw"
                className={[
                  "transition-transform duration-[900ms]",
                  "group-hover:scale-[1.04]",
                  fitClass,
                ].join(" ")}
              />
              {/* Gradient mask to keep text readable if the image is busy */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/0" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <div
                className={[
                  "flex h-14 w-14 items-center justify-center rounded-xl",
                  "bg-black/60 border border-white/10 backdrop-blur-sm",
                ].join(" ")}
              >
                <span className="text-2xl">{config.icon}</span>
              </div>
            </div>
          )}

          {/* Type pill – colour-coded by type */}
          <div className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/18 bg-black/60 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-cream">
            <span>{config.icon}</span>
            <span>{config.label}</span>
          </div>

          {/* Subtle corner glint */}
          <div className="pointer-events-none absolute -right-4 -top-4 h-10 w-10 rounded-full bg-gradient-to-br from-amber-400/70 to-amber-700/40 opacity-0 blur-[3px] transition-opacity duration-300 group-hover:opacity-100" />
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col gap-3 p-5">
          <h3 className="line-clamp-2 font-serif text-lg font-semibold text-cream">
            {safeTitle}
          </h3>

          {safeExcerpt && (
            <p className="line-clamp-3 text-sm text-gray-300/90">
              {safeExcerpt}
            </p>
          )}

          {/* Meta */}
          <div className="mt-auto border-t border-gray-800/80 pt-3 text-xs">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {doc.tags?.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-black/70 px-2 py-0.5 text-[0.64rem] uppercase tracking-[0.14em] text-gray-400"
                >
                  {tag}
                </span>
              ))}
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-[0.64rem] uppercase tracking-[0.14em]",
                  "border border-white/10",
                  config.color.bg,
                  config.color.text,
                ].join(" ")}
              >
                {config.label}
              </span>
            </div>

            <div className="flex items-center justify-between text-[0.7rem] text-gray-400">
              <span className="line-clamp-1">
                {config.description}
              </span>
              <span className="inline-flex items-center gap-1 text-amber-300">
                <span className="tracking-[0.18em]">OPEN</span>
                <span aria-hidden="true">↗</span>
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

// ---------- PAGE ----------

const ContentPage: NextPage<ContentPageProps> = ({ docs }) => {
  const [query, setQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [activeType, setActiveType] =
    React.useState<SearchDocType | "all">("all");

  // Organise docs by category
  const docsByCategory = React.useMemo(() => {
    const organized: Record<string, SearchDoc[]> = {
      insights: [],
      frameworks: [],
      tools: [],
      archives: [],
      all: docs,
    };

    docs.forEach((doc) => {
      const category = typeConfig[doc.type].category;
      organized[category].push(doc);
    });

    return organized;
  }, [docs]);

  // Filtering
  const filteredDocs = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const source =
      activeCategory === "all" ? docs : docsByCategory[activeCategory];

    if (!q && activeType === "all") return source;

    return source.filter((doc) => {
      if (activeType !== "all" && doc.type !== activeType) return false;
      if (!q) return true;

      const searchable = [
        doc.title,
        doc.excerpt,
        doc.tags?.join(" "),
        typeConfig[doc.type].label,
        typeConfig[doc.type].description,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchable.includes(q);
    });
  }, [docs, docsByCategory, query, activeCategory, activeType]);

  const getCategoryStats = (category: string) =>
    docsByCategory[category]?.length ?? 0;

  const title = "Content Library";
  const description =
    "A curated chamber of insights, frameworks, and tools for fathers, founders, and leaders who build with depth.";

  return (
    <Layout title={title} description={description} fullWidth>
      <div className="min-h-screen bg-gradient-to-b from-black via-[#050509] to-black text-cream">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-gray-800">
          {/* Subliminal backdrop */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/6 via-transparent to-emerald-500/6" />
            <div className="absolute inset-0 opacity-[0.14] mix-blend-soft-light bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.35),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(45,212,191,0.35),_transparent_58%)]" />
            <div className="absolute inset-0 opacity-[0.14] bg-[linear-gradient(to_right,rgba(148,163,184,0.28)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.28)_1px,transparent_1px)] bg-[size:120px_120px]" />
            <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-amber-500/65 to-transparent" />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
            <div className="text-center">
              <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-amber-500/35 bg-black/60 px-5 py-2 backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.9)]" />
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-200">
                  Curated Chamber
                </span>
              </div>

              <h1 className="mb-4 font-serif text-4xl font-light tracking-tight text-cream sm:text-5xl lg:text-6xl">
                Content Library
              </h1>

              <p className="mx-auto max-w-2xl text-sm font-light leading-relaxed text-gray-200 sm:text-base">
                One doorway into the whole house of Abraham of London – essays,
                canon volumes, tools, and artefacts arranged for slow,
                deliberate reading.
              </p>
            </div>
          </div>
        </section>

        {/* CONTROLS */}
        <section className="sticky top-0 z-40 border-b border-gray-800 bg-black/92 backdrop-blur-xl supports-[backdrop-filter]:bg-black/85">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                  <svg
                    className="h-5 w-5 text-gray-500"
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
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search across the library..."
                  className="w-full rounded-xl border border-gray-700 bg-gray-950/80 py-3 pl-12 pr-10 text-sm text-cream placeholder:text-gray-500 backdrop-blur-sm transition-all duration-200 hover:border-gray-600 focus:border-amber-400/70 focus:outline-none focus:ring-1 focus:ring-amber-400/40"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 transition-colors hover:text-gray-300"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveCategory("all")}
                  className={`rounded-lg px-4 py-2.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                    activeCategory === "all"
                      ? "bg-gradient-to-r from-amber-500 to-amber-600 text-black shadow-lg shadow-amber-500/30"
                      : "border border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-900/70"
                  }`}
                >
                  All ({docs.length})
                </button>
                {Object.entries(categoryConfig).map(([key, cat], idx) => {
                  const count = getCategoryStats(key);
                  if (!count) return null;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setActiveCategory(key)}
                      className={`rounded-lg border px-4 py-2.5 text-xs font-semibold tracking-wide transition-all duration-200 ${
                        activeCategory === key
                          ? `bg-gradient-to-r ${cat.gradient} ${cat.color} text-cream shadow-lg`
                          : "border-gray-700 text-gray-300 hover:border-gray-500 hover:bg-gray-900/70"
                      }`}
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <span className="flex items-center gap-2">
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                        <span className="text-[0.7rem] opacity-70">
                          ({count})
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Type filter */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveType("all")}
                className={`rounded-full px-3.5 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.14em] transition-all duration-200 ${
                  activeType === "all"
                    ? "bg-gray-700 text-cream"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-900/70"
                }`}
              >
                All Types
              </button>
              {(Object.keys(typeConfig) as SearchDocType[]).map((type, idx) => {
                const cfg = typeConfig[type];
                const count = docs.filter((d) => d.type === type).length;
                if (!count) return null;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setActiveType(type)}
                    className={`rounded-full border px-3.5 py-1.5 text-[0.7rem] font-medium uppercase tracking-[0.14em] transition-all duration-200 ${
                      activeType === type
                        ? `${cfg.color.bg} ${cfg.color.border} ${cfg.color.text}`
                        : "border-gray-800 text-gray-400 hover:border-gray-600 hover:text-gray-100"
                    }`}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{cfg.icon}</span>
                      <span>{cfg.label}</span>
                      <span className="text-[0.65rem] opacity-60">
                        ({count})
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* GRID */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {filteredDocs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-700 bg-gradient-to-b from-gray-950/70 to-black/70 p-12 text-center">
                <div className="mb-4 text-3xl">🔍</div>
                <h3 className="mb-2 font-serif text-xl text-cream">
                  Nothing surfaced… yet.
                </h3>
                <p className="text-sm text-gray-400">
                  Adjust your filters or clear the search to see the full
                  collection.
                </p>
              </div>
            ) : (
              <>
                {activeCategory !== "all" && (
                  <div
                    className={`mb-8 rounded-2xl border ${categoryConfig[activeCategory].color} ${categoryConfig[activeCategory].bgGradient} p-6`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${categoryConfig[activeCategory].gradient}`}
                      >
                        <span className="text-xl">
                          {categoryConfig[activeCategory].icon}
                        </span>
                      </div>
                      <div>
                        <h2 className="font-serif text-2xl text-cream">
                          {categoryConfig[activeCategory].label}
                        </h2>
                        <p className="text-sm text-gray-300">
                          {categoryConfig[activeCategory].description}
                        </p>
                      </div>
                      <span className="ml-auto rounded-full bg-black/40 px-3 py-1 text-xs text-gray-300">
                        {filteredDocs.length}{" "}
                        {filteredDocs.length === 1 ? "item" : "items"}
                      </span>
                    </div>
                  </div>
                )}

                {activeCategory === "all" ? (
                  <div className="space-y-12">
                    {Object.entries(categoryConfig).map(
                      ([key, cat], catIndex) => {
                        const filteredCategoryDocs = filteredDocs.filter(
                          (doc) => typeConfig[doc.type].category === key,
                        );
                        if (!filteredCategoryDocs.length) return null;

                        return (
                          <div
                            key={key}
                            className={`rounded-2xl border ${cat.color} ${cat.bgGradient} p-6`}
                            style={{
                              animationDelay: `${catIndex * 80}ms`,
                            }}
                          >
                            <div className="mb-6 flex items-center gap-3">
                              <div
                                className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${cat.gradient}`}
                              >
                                <span className="text-xl">{cat.icon}</span>
                              </div>
                              <div>
                                <h2 className="font-serif text-2xl text-cream">
                                  {cat.label}
                                </h2>
                                <p className="text-sm text-gray-300">
                                  {cat.description}
                                </p>
                              </div>
                              <span className="ml-auto rounded-full bg-black/40 px-3 py-1 text-xs text-gray-300">
                                {filteredCategoryDocs.length} items
                              </span>
                            </div>

                            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                              {filteredCategoryDocs.map((doc) => (
                                <LuxContentCard
                                  key={`${doc.type}:${doc.slug}`}
                                  doc={doc}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredDocs.map((doc) => (
                      <LuxContentCard
                        key={`${doc.type}:${doc.slug}`}
                        doc={doc}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* STATS FOOTER */}
        <section className="border-t border-gray-800 bg-gradient-to-b from-black/60 to-[#020308] py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {Object.entries(categoryConfig).map(([key, cat], index) => {
                const count = getCategoryStats(key);
                return (
                  <div
                    key={key}
                    className="text-center"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div
                      className={`mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br ${cat.gradient} ${cat.color}`}
                    >
                      <span className="text-2xl">{cat.icon}</span>
                    </div>
                    <div className="mb-1 text-3xl font-light text-cream">
                      {count}
                    </div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-gray-300">
                      {cat.label}
                    </div>
                    <div className="text-[0.7rem] text-gray-500">
                      {cat.description}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-10 text-center text-sm text-gray-400">
              Total collection:{" "}
              <span className="font-semibold text-amber-300">
                {docs.length}
              </span>{" "}
              curated items across all categories.
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default ContentPage;