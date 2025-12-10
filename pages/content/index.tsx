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

// Enhanced type definitions with better categorization
const typeConfig: Record<SearchDocType, {
  label: string;
  description: string;
  accent: string;
  icon: string;
  category: 'insights' | 'frameworks' | 'resources' | 'archives';
}> = {
  post: {
    label: "Insight",
    description: "Thoughtful essays and perspectives",
    accent: "from-blue-500/20 to-blue-600/10 border-blue-500/40",
    icon: "📝",
    category: 'insights'
  },
  book: {
    label: "Book",
    description: "Comprehensive volumes and collections",
    accent: "from-amber-500/20 to-amber-600/10 border-amber-500/40",
    icon: "📚",
    category: 'frameworks'
  },
  download: {
    label: "Download",
    description: "Practical tools and templates",
    accent: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/40",
    icon: "📥",
    category: 'resources'
  },
  print: {
    label: "Print",
    description: "Curated prints and editions",
    accent: "from-purple-500/20 to-purple-600/10 border-purple-500/40",
    icon: "🖨️",
    category: 'archives'
  },
  resource: {
    label: "Resource",
    description: "Guides and reference materials",
    accent: "from-sky-500/20 to-sky-600/10 border-sky-500/40",
    icon: "📋",
    category: 'resources'
  },
  canon: {
    label: "Canon",
    description: "Foundational principles and systems",
    accent: "from-rose-500/20 to-rose-600/10 border-rose-500/40",
    icon: "⚖️",
    category: 'frameworks'
  },
};

const categoryConfig = {
  insights: { label: "Insights & Essays", icon: "💭", color: "border-blue-500/30" },
  frameworks: { label: "Frameworks & Systems", icon: "⚙️", color: "border-amber-500/30" },
  resources: { label: "Tools & Resources", icon: "🛠️", color: "border-emerald-500/30" },
  archives: { label: "Archives & Prints", icon: "📦", color: "border-purple-500/30" },
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
  const [activeType, setActiveType] = React.useState<SearchDocType | "all">("all");
  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>({
    insights: true,
    frameworks: true,
    resources: true,
    archives: true,
  });

  // Organize docs by category
  const docsByCategory = React.useMemo(() => {
    const organized: Record<string, SearchDoc[]> = {
      insights: [],
      frameworks: [],
      resources: [],
      archives: [],
    };

    docs.forEach(doc => {
      const category = typeConfig[doc.type].category;
      organized[category].push(doc);
    });

    // Sort each category by date (newest first)
    Object.keys(organized).forEach(category => {
      organized[category].sort((a, b) => 
        new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
      );
    });

    return organized;
  }, [docs]);

  // Filter docs based on search and active type
  const filteredDocs = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    
    if (!q && activeType === "all") {
      return docsByCategory;
    }

    const filtered: Record<string, SearchDoc[]> = {
      insights: [],
      frameworks: [],
      resources: [],
      archives: [],
    };

    Object.entries(docsByCategory).forEach(([category, categoryDocs]) => {
      filtered[category] = categoryDocs.filter(doc => {
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
    });

    return filtered;
  }, [docsByCategory, query, activeType]);

  const title = "Content Library";
  const description = "A curated collection of insights, frameworks, and tools for systematic thinkers.";

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const getCategoryStats = (category: string) => {
    const categoryDocs = docsByCategory[category];
    const typeCounts = categoryDocs.reduce((acc, doc) => {
      acc[doc.type] = (acc[doc.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return { total: categoryDocs.length, typeCounts };
  };

  return (
    <Layout title={title} description={description}>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={description} />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-cream">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-amber-500/10 bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
          <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <header className="space-y-6 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-amber-300">
                <span>📚</span>
                <span>COLLECTION</span>
              </div>
              <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light leading-tight text-cream">
                Content Library
              </h1>
              <p className="mx-auto max-w-3xl text-base sm:text-lg text-gray-300 font-light leading-relaxed">
                A thoughtfully organized archive of insights, frameworks, and resources 
                for those who build with intention and depth.
              </p>
            </header>

            {/* Search Bar */}
            <div className="mx-auto mt-10 max-w-2xl">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-gray-500">
                  <span className="text-lg">🔍</span>
                </div>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search across the library..."
                  className="w-full rounded-xl border border-gray-700 bg-black/40 py-3.5 pl-12 pr-4 text-base text-cream placeholder:text-gray-500 backdrop-blur-sm transition-all focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/30"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Content Sections */}
        <section className="py-10 sm:py-12 lg:py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            {/* Type Filter */}
            <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
              <h2 className="font-serif text-xl text-cream">Browse by Type</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setActiveType("all")}
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                    activeType === "all"
                      ? "border-amber-500 bg-amber-500 text-black"
                      : "border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800/50"
                  }`}
                >
                  All Content
                </button>
                {(Object.keys(typeConfig) as SearchDocType[]).map((type) => {
                  const count = docs.filter(d => d.type === type).length;
                  if (!count) return null;
                  const config = typeConfig[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setActiveType(type)}
                      className={`group rounded-lg border px-4 py-2 text-sm font-medium transition-all ${
                        activeType === type
                          ? "border-amber-500 bg-amber-500 text-black"
                          : "border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800/50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span>{config.label}</span>
                        <span className="text-xs opacity-60">({count})</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Sections */}
            <div className="space-y-10">
              {Object.entries(categoryConfig).map(([categoryKey, category]) => {
                const categoryDocs = filteredDocs[categoryKey];
                const stats = getCategoryStats(categoryKey);
                
                if (categoryDocs.length === 0) return null;

                return (
                  <div 
                    key={categoryKey} 
                    className={`rounded-2xl border ${category.color} bg-gray-900/30 backdrop-blur-sm overflow-hidden`}
                  >
                    {/* Category Header */}
                    <div className="border-b border-gray-800 bg-gradient-to-r from-black/40 to-transparent p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{category.icon}</span>
                          <div>
                            <h3 className="font-serif text-xl text-cream">{category.label}</h3>
                            <p className="text-sm text-gray-400">
                              {stats.total} item{stats.total !== 1 ? 's' : ''} • 
                              {Object.entries(stats.typeCounts).map(([type, count]) => (
                                <span key={type} className="ml-2">
                                  {typeConfig[type as SearchDocType].icon} {count}
                                </span>
                              ))}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => toggleCategory(categoryKey)}
                          className="text-gray-400 hover:text-cream"
                        >
                          {expandedCategories[categoryKey] ? '▲' : '▼'}
                        </button>
                      </div>
                    </div>

                    {/* Category Content */}
                    {expandedCategories[categoryKey] && (
                      <div className="p-6">
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                          {categoryDocs.map((doc) => {
                            const config = typeConfig[doc.type];
                            return (
                              <Link key={`${doc.type}:${doc.slug}`} href={doc.href}>
                                <article className="group relative overflow-hidden rounded-xl border border-gray-800 bg-gradient-to-br from-gray-900 to-gray-950 p-5 transition-all duration-300 hover:scale-[1.02] hover:border-amber-400/30 hover:shadow-xl">
                                  {/* Background gradient */}
                                  <div className={`absolute inset-0 bg-gradient-to-br ${config.accent} opacity-0 group-hover:opacity-20 transition-opacity duration-300`} />
                                  
                                  <div className="relative space-y-4">
                                    {/* Type badge */}
                                    <div className="flex items-center justify-between">
                                      <span className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gray-300">
                                        <span>{config.icon}</span>
                                        <span>{config.label}</span>
                                      </span>
                                      {doc.date && (
                                        <span className="text-xs text-gray-500">
                                          {new Date(doc.date).toLocaleDateString("en-GB", {
                                            day: "2-digit",
                                            month: "short",
                                            year: "numeric",
                                          })}
                                        </span>
                                      )}
                                    </div>

                                    {/* Title */}
                                    <h4 className="font-serif text-lg font-light leading-snug text-cream group-hover:text-amber-100 transition-colors">
                                      {doc.title}
                                    </h4>

                                    {/* Excerpt */}
                                    {doc.excerpt && (
                                      <p className="line-clamp-2 text-sm text-gray-300 leading-relaxed">
                                        {doc.excerpt}
                                      </p>
                                    )}

                                    {/* Tags */}
                                    {doc.tags && doc.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 pt-2">
                                        {doc.tags.slice(0, 3).map((tag) => (
                                          <span
                                            key={tag}
                                            className="rounded-full bg-gray-800/50 px-2.5 py-1 text-[0.65rem] text-gray-300"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    {/* Hover indicator */}
                                    <div className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-amber-400/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </article>
                              </Link>
                            );
                          })}
                        </div>

                        {/* View More */}
                        {categoryDocs.length > 6 && (
                          <div className="mt-6 text-center">
                            <button className="text-sm text-amber-300 hover:text-amber-200">
                              View all {categoryDocs.length} items in {category.label} →
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {Object.values(filteredDocs).flat().length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/20 p-12 text-center">
                <div className="mb-4 text-4xl">🔍</div>
                <h3 className="mb-2 font-serif text-xl text-cream">No results found</h3>
                <p className="text-gray-400">
                  Try adjusting your search or filter to find what you're looking for.
                </p>
                <button
                  onClick={() => { setQuery(""); setActiveType("all"); }}
                  className="mt-4 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:border-gray-600 hover:bg-gray-800/50"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Stats Footer */}
        <section className="border-t border-gray-800 bg-black/30 py-8">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {Object.entries(categoryConfig).map(([categoryKey, category]) => {
                const count = docsByCategory[categoryKey].length;
                return (
                  <div key={categoryKey} className="text-center">
                    <div className="text-2xl font-light text-cream">{count}</div>
                    <div className="text-xs text-gray-400 uppercase tracking-wider">
                      {category.label}
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