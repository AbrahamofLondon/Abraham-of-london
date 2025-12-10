// pages/content/index.tsx
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";

import Layout from "@/components/Layout";
import {
  buildSearchIndex,
  type SearchDoc,
  type SearchDocType,
} from "@/lib/searchIndex";

type ContentPageProps = {
  docs: SearchDoc[];
};

// Enhanced type configurations with distinct color palettes
const typeConfig: Record<SearchDocType, {
  label: string;
  description: string;
  color: {
    bg: string;
    text: string;
    border: string;
    gradient: string;
    accent: string;
  };
  icon: string;
  category: 'insights' | 'frameworks' | 'tools' | 'archives';
}> = {
  post: {
    label: "Insight",
    description: "Thoughtful essays and perspectives",
    color: {
      bg: "bg-blue-500/5",
      text: "text-blue-300",
      border: "border-blue-500/20",
      gradient: "from-blue-500/10 via-blue-600/5 to-transparent",
      accent: "bg-blue-500/20"
    },
    icon: "💭",
    category: 'insights'
  },
  book: {
    label: "Book",
    description: "Comprehensive volumes and collections",
    color: {
      bg: "bg-amber-500/5",
      text: "text-amber-300",
      border: "border-amber-500/20",
      gradient: "from-amber-500/10 via-amber-600/5 to-transparent",
      accent: "bg-amber-500/20"
    },
    icon: "📚",
    category: 'frameworks'
  },
  download: {
    label: "Download",
    description: "Practical tools and templates",
    color: {
      bg: "bg-emerald-500/5",
      text: "text-emerald-300",
      border: "border-emerald-500/20",
      gradient: "from-emerald-500/10 via-emerald-600/5 to-transparent",
      accent: "bg-emerald-500/20"
    },
    icon: "📥",
    category: 'tools'
  },
  print: {
    label: "Print",
    description: "Curated prints and editions",
    color: {
      bg: "bg-purple-500/5",
      text: "text-purple-300",
      border: "border-purple-500/20",
      gradient: "from-purple-500/10 via-purple-600/5 to-transparent",
      accent: "bg-purple-500/20"
    },
    icon: "🖨️",
    category: 'archives'
  },
  resource: {
    label: "Resource",
    description: "Guides and reference materials",
    color: {
      bg: "bg-sky-500/5",
      text: "text-sky-300",
      border: "border-sky-500/20",
      gradient: "from-sky-500/10 via-sky-600/5 to-transparent",
      accent: "bg-sky-500/20"
    },
    icon: "📋",
    category: 'tools'
  },
  canon: {
    label: "Canon",
    description: "Foundational principles and systems",
    color: {
      bg: "bg-rose-500/5",
      text: "text-rose-300",
      border: "border-rose-500/20",
      gradient: "from-rose-500/10 via-rose-600/5 to-transparent",
      accent: "bg-rose-500/20"
    },
    icon: "⚖️",
    category: 'frameworks'
  },
};

const categoryConfig: Record<string, {
  label: string;
  description: string;
  color: string;
  gradient: string;
  icon: string;
}> = {
  insights: {
    label: "Insights",
    description: "Essays and perspectives",
    color: "border-blue-500/30",
    gradient: "from-blue-900/10 to-blue-950/5",
    icon: "💭"
  },
  frameworks: {
    label: "Frameworks",
    description: "Systems and principles",
    color: "border-amber-500/30",
    gradient: "from-amber-900/10 to-amber-950/5",
    icon: "⚙️"
  },
  tools: {
    label: "Tools",
    description: "Resources and downloads",
    color: "border-emerald-500/30",
    gradient: "from-emerald-900/10 to-emerald-950/5",
    icon: "🛠️"
  },
  archives: {
    label: "Archives",
    description: "Prints and collections",
    color: "border-purple-500/30",
    gradient: "from-purple-900/10 to-purple-950/5",
    icon: "📦"
  },
};

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  const docs = buildSearchIndex();
  return {
    props: { docs },
    revalidate: 3600,
  };
};

const ContentPage: NextPage<ContentPageProps> = ({ docs }) => {
  const [query, setQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState<string>("all");
  const [activeType, setActiveType] = React.useState<SearchDocType | "all">("all");

  // Organize docs by category
  const docsByCategory = React.useMemo(() => {
    const organized: Record<string, SearchDoc[]> = {
      insights: [],
      frameworks: [],
      tools: [],
      archives: [],
      all: docs
    };

    docs.forEach(doc => {
      const category = typeConfig[doc.type].category;
      organized[category].push(doc);
    });

    return organized;
  }, [docs]);

  // Filter docs based on search and active filters
  const filteredDocs = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    
    const sourceDocs = activeCategory === "all" ? docs : docsByCategory[activeCategory];
    
    if (!q && activeType === "all") {
      return sourceDocs;
    }

    return sourceDocs.filter(doc => {
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

  // Get category statistics
  const getCategoryStats = (category: string) => {
    const categoryDocs = docsByCategory[category];
    return categoryDocs.length;
  };

  const title = "Content Library";
  const description = "A curated collection of insights, frameworks, and tools for systematic thinkers.";

  return (
    <Layout title={title} description={description}>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={description} />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-cream">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-gray-800">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
            <div className="text-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-amber-500/20 bg-amber-500/5 px-5 py-2 mb-8">
                <span className="text-sm font-medium uppercase tracking-[0.25em] text-amber-300">
                  Library
                </span>
              </div>
              <h1 className="mb-6 font-serif text-5xl font-light tracking-tight text-cream sm:text-6xl lg:text-7xl">
                Content Library
              </h1>
              <p className="mx-auto max-w-2xl text-lg font-light leading-relaxed text-gray-300">
                An organized collection of insights, frameworks, and resources for 
                those who build with depth and intention.
              </p>
            </div>
          </div>
        </section>

        {/* Controls Section */}
        <section className="sticky top-0 z-10 border-b border-gray-800 bg-black/80 backdrop-blur-lg">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Search */}
              <div className="relative flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                  <svg className="h-5 w-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search across the collection..."
                  className="w-full rounded-xl border border-gray-700 bg-gray-900/50 py-3 pl-12 pr-4 text-cream placeholder:text-gray-500 backdrop-blur-sm transition-all hover:border-gray-600 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/20"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    activeCategory === "all"
                      ? "bg-amber-500 text-black"
                      : "border border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800/50"
                  }`}
                >
                  All ({docs.length})
                </button>
                {Object.entries(categoryConfig).map(([key, category]) => {
                  const count = getCategoryStats(key);
                  if (count === 0) return null;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveCategory(key)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                        activeCategory === key
                          ? `bg-gradient-to-r ${category.gradient} border-${key === 'insights' ? 'blue' : key === 'frameworks' ? 'amber' : key === 'tools' ? 'emerald' : 'purple'}-500/50 text-cream`
                          : "border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800/50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{category.icon}</span>
                        <span>{category.label}</span>
                        <span className="text-xs opacity-60">({count})</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Type Filter */}
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => setActiveType("all")}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  activeType === "all"
                    ? "bg-gray-700 text-cream"
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                All Types
              </button>
              {(Object.keys(typeConfig) as SearchDocType[]).map((type) => {
                const config = typeConfig[type];
                const count = docs.filter(d => d.type === type).length;
                if (count === 0) return null;
                return (
                  <button
                    key={type}
                    onClick={() => setActiveType(type)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                      activeType === type
                        ? `${config.color.bg} ${config.color.border} ${config.color.text}`
                        : "border-gray-800 text-gray-400 hover:border-gray-700 hover:text-gray-200"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span>{config.icon}</span>
                      <span>{config.label}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Content Grid */}
        <section className="py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {filteredDocs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/20 p-12 text-center">
                <div className="mb-4 text-4xl">🔍</div>
                <h3 className="mb-2 font-serif text-xl text-cream">No content found</h3>
                <p className="text-gray-400">
                  Try adjusting your search or filter to discover available materials.
                </p>
              </div>
            ) : (
              <>
                {/* Active Category Header */}
                {activeCategory !== "all" && (
                  <div className={`mb-8 rounded-xl border ${categoryConfig[activeCategory].color} bg-gradient-to-r ${categoryConfig[activeCategory].gradient} p-6`}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{categoryConfig[activeCategory].icon}</span>
                      <div>
                        <h2 className="font-serif text-2xl text-cream">{categoryConfig[activeCategory].label}</h2>
                        <p className="text-gray-300">{categoryConfig[activeCategory].description}</p>
                      </div>
                      <span className="ml-auto rounded-full bg-black/30 px-3 py-1 text-sm text-gray-300">
                        {filteredDocs.length} {filteredDocs.length === 1 ? 'item' : 'items'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Grid Layout */}
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredDocs.map((doc) => {
                    const config = typeConfig[doc.type];
                    return (
                      <Link key={`${doc.type}:${doc.slug}`} href={doc.href}>
                        <article className="group relative h-full overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-b from-gray-900 to-gray-950 transition-all duration-300 hover:scale-[1.02] hover:border-gray-700 hover:shadow-2xl">
                          {/* Background accent */}
                          <div className={`absolute inset-0 bg-gradient-to-br ${config.color.gradient} opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
                          
                          {/* Image Container - Improved aspect ratio */}
                          {doc.coverImage && (
                            <div className="relative h-48 w-full overflow-hidden">
                              <Image
                                src={doc.coverImage}
                                alt={doc.title}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                priority={false}
                              />
                              {/* Gradient overlay for better text readability */}
                              <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/50 to-transparent" />
                            </div>
                          )}

                          <div className="relative p-5">
                            {/* Type badge */}
                            <div className="mb-3 flex items-center justify-between">
                              <span className={`inline-flex items-center gap-1.5 rounded-full ${config.color.bg} border ${config.color.border} px-3 py-1 text-xs font-medium ${config.color.text}`}>
                                <span>{config.icon}</span>
                                <span>{config.label}</span>
                              </span>
                              {doc.date && (
                                <span className="text-xs text-gray-500">
                                  {new Date(doc.date).toLocaleDateString("en-GB", {
                                    day: "2-digit",
                                    month: "short",
                                  })}
                                </span>
                              )}
                            </div>

                            {/* Title */}
                            <h3 className="mb-2 font-serif text-lg font-light leading-tight text-cream group-hover:text-amber-100 transition-colors">
                              {doc.title}
                            </h3>

                            {/* Description */}
                            {doc.excerpt && (
                              <p className="mb-4 line-clamp-2 text-sm text-gray-300 leading-relaxed">
                                {doc.excerpt}
                              </p>
                            )}

                            {/* Tags */}
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {doc.tags.slice(0, 3).map((tag) => (
                                  <span
                                    key={tag}
                                    className="rounded-full bg-gray-800/50 px-2.5 py-1 text-[0.7rem] text-gray-300"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {doc.tags.length > 3 && (
                                  <span className="rounded-full bg-gray-800/50 px-2.5 py-1 text-[0.7rem] text-gray-300">
                                    +{doc.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Hover indicator */}
                          <div className="absolute bottom-4 right-4 h-2 w-2 rounded-full bg-amber-400/30 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </article>
                      </Link>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>

        {/* Stats Footer */}
        <section className="border-t border-gray-800 bg-black/30 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {Object.entries(categoryConfig).map(([key, category]) => {
                const count = getCategoryStats(key);
                const color = key === 'insights' ? 'blue' : key === 'frameworks' ? 'amber' : key === 'tools' ? 'emerald' : 'purple';
                return (
                  <div key={key} className="text-center">
                    <div className={`mb-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-${color}-500/10`}>
                      <span className="text-xl">{category.icon}</span>
                    </div>
                    <div className="text-2xl font-light text-cream">{count}</div>
                    <div className="text-xs uppercase tracking-wider text-gray-400">
                      {category.label}
                    </div>
                    <div className="mt-1 text-xs text-gray-500">
                      {category.description}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default ContentPage;