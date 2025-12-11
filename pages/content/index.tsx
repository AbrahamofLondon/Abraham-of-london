// pages/content/index.tsx
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import BlogPostCard from "@/components/Cards/BlogPostCard";
import BookCard from "@/components/Cards/BookCard";
import CanonResourceCard from "@/components/Cards/CanonResourceCard";
import BaseCard from "@/components/Cards/BaseCard";
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
  cardComponent: 'blog' | 'book' | 'canon' | 'base';
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
    category: 'insights',
    cardComponent: 'blog'
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
    category: 'frameworks',
    cardComponent: 'book'
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
    category: 'tools',
    cardComponent: 'base'
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
    category: 'archives',
    cardComponent: 'base'
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
    category: 'tools',
    cardComponent: 'base'
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
    category: 'frameworks',
    cardComponent: 'canon'
  },
};

const categoryConfig: Record<string, {
  label: string;
  description: string;
  color: string;
  gradient: string;
  icon: string;
  bgGradient: string;
}> = {
  insights: {
    label: "Insights",
    description: "Essays and perspectives",
    color: "border-blue-500/30",
    gradient: "from-blue-900/10 to-blue-950/5",
    bgGradient: "bg-gradient-to-br from-blue-900/5 via-black to-blue-950/5",
    icon: "💭"
  },
  frameworks: {
    label: "Frameworks",
    description: "Systems and principles",
    color: "border-amber-500/30",
    gradient: "from-amber-900/10 to-amber-950/5",
    bgGradient: "bg-gradient-to-br from-amber-900/5 via-black to-amber-950/5",
    icon: "⚙️"
  },
  tools: {
    label: "Tools",
    description: "Resources and downloads",
    color: "border-emerald-500/30",
    gradient: "from-emerald-900/10 to-emerald-950/5",
    bgGradient: "bg-gradient-to-br from-emerald-900/5 via-black to-emerald-950/5",
    icon: "🛠️"
  },
  archives: {
    label: "Archives",
    description: "Prints and collections",
    color: "border-purple-500/30",
    gradient: "from-purple-900/10 to-purple-950/5",
    bgGradient: "bg-gradient-to-br from-purple-900/5 via-black to-purple-950/5",
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

// Helper function to get all properties from SearchDoc
const getDocProperties = (doc: SearchDoc) => {
  // Cast to any to access all properties, then filter out undefined
  const rawDoc = doc as any;
  return {
    // Core properties
    slug: doc.slug,
    title: doc.title,
    subtitle: rawDoc.subtitle || null,
    excerpt: doc.excerpt || null,
    description: rawDoc.description || null,
    coverImage: doc.coverImage || null,
    date: doc.date || null,
    tags: doc.tags || [],
    
    // Card-specific properties
    featured: rawDoc.featured || false,
    accessLevel: rawDoc.accessLevel || null,
    lockMessage: rawDoc.lockMessage || null,
    category: rawDoc.category || null,
    readingTime: rawDoc.readingTime || rawDoc.readTime || null,
    isNew: rawDoc.isNew || false,
    readTime: rawDoc.readTime || null,
    author: rawDoc.author || null,
    pages: rawDoc.pages || null,
    volumeNumber: rawDoc.volumeNumber || null,
    resourceType: rawDoc.resourceType || null,
    applications: rawDoc.applications || [],
    
    // Book-specific properties
    publishDate: rawDoc.publishDate || rawDoc.date || null,
    isbn: rawDoc.isbn || null,
    rating: rawDoc.rating || null,
    
    // Blog-specific properties (author could be object or string)
    authorName: typeof rawDoc.author === 'object' ? rawDoc.author?.name : rawDoc.author || null,
    authorPicture: typeof rawDoc.author === 'object' ? rawDoc.author?.picture : null,
  };
};

// Render the appropriate card component based on document type
const ContentCard: React.FC<{ doc: SearchDoc }> = ({ doc }) => {
  const config = typeConfig[doc.type];
  const props = getDocProperties(doc);
  
  // Common href logic
  const href = doc.href || `/${doc.type === 'post' ? 'blog' : doc.type}/${doc.slug}`;

  switch (config.cardComponent) {
    case 'blog':
      // Handle author as string or object
      const blogAuthor = props.authorName ? {
        name: props.authorName,
        picture: props.authorPicture || undefined
      } : null;

      return (
        <BlogPostCard
          slug={props.slug}
          title={props.title}
          subtitle={props.subtitle}
          excerpt={props.excerpt}
          description={props.description}
          coverImage={props.coverImage}
          date={props.date}
          author={blogAuthor}
          tags={props.tags}
          featured={props.featured}
          readTime={props.readTime}
          category={props.category}
          href={href}
        />
      );
    case 'book':
      return (
        <BookCard
          slug={props.slug}
          title={props.title}
          subtitle={props.subtitle}
          author={props.authorName}
          excerpt={props.excerpt}
          description={props.description}
          coverImage={props.coverImage}
          publishDate={props.publishDate}
          isbn={props.isbn}
          tags={props.tags}
          featured={props.featured}
          rating={props.rating}
          href={href}
        />
      );
    case 'canon':
      return (
        <CanonResourceCard
          canon={{
            slug: props.slug,
            title: props.title,
            subtitle: props.subtitle,
            excerpt: props.excerpt,
            description: props.description,
            coverImage: props.coverImage,
            volumeNumber: props.volumeNumber,
            date: props.date,
            tags: props.tags,
            featured: props.featured,
            accessLevel: props.accessLevel,
            lockMessage: props.lockMessage,
          }}
        />
      );
    case 'base':
    default:
      // Use the DocumentCard wrapper from BaseCard if available, otherwise use BaseCard directly
      return (
        <div className="h-full">
          <BaseCard
            slug={props.slug}
            title={props.title}
            subtitle={props.subtitle}
            excerpt={props.excerpt}
            description={props.description}
            coverImage={props.coverImage}
            date={props.date}
            tags={props.tags}
            featured={props.featured}
            accessLevel={props.accessLevel}
            lockMessage={props.lockMessage}
            category={props.category}
            readingTime={props.readingTime}
            isNew={props.isNew}
            href={href}
          />
        </div>
      );
  }
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
        <style>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.5s ease-out forwards;
          }
          .category-section {
            opacity: 0;
            animation: fadeInUp 0.5s ease-out forwards;
          }
          .stagger-delay-1 { animation-delay: 0.1s; }
          .stagger-delay-2 { animation-delay: 0.2s; }
          .stagger-delay-3 { animation-delay: 0.3s; }
          .stagger-delay-4 { animation-delay: 0.4s; }
        `}</style>
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-cream">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-gray-800">
          {/* Subtle background pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/5 via-transparent to-transparent" />
          <div className="absolute inset-0 opacity-5">
            <div className="h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>
          
          <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
            <div className="text-center animate-fade-in-up">
              <div className="inline-flex items-center gap-3 rounded-full border border-amber-500/20 bg-amber-500/5 px-5 py-2 mb-8 backdrop-blur-sm">
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
        <section className="sticky top-0 z-40 border-b border-gray-800 bg-black/80 backdrop-blur-xl supports-[backdrop-filter]:bg-black/60">
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
                  className="w-full rounded-xl border border-gray-700 bg-gray-900/50 py-3 pl-12 pr-4 text-cream placeholder:text-gray-500 backdrop-blur-sm transition-all duration-200 hover:border-gray-600 focus:border-amber-400/50 focus:outline-none focus:ring-1 focus:ring-amber-400/20"
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    activeCategory === "all"
                      ? "bg-amber-500 text-black shadow-lg shadow-amber-500/25"
                      : "border border-gray-700 text-gray-300 hover:border-gray-600 hover:bg-gray-800/50"
                  }`}
                >
                  All ({docs.length})
                </button>
                {Object.entries(categoryConfig).map(([key, category], index) => {
                  const count = getCategoryStats(key);
                  if (count === 0) return null;
                  const color = key === 'insights' ? 'blue' : key === 'frameworks' ? 'amber' : key === 'tools' ? 'emerald' : 'purple';
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveCategory(key)}
                      className={`rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 animate-fade-in-up stagger-delay-${index + 1} ${
                        activeCategory === key
                          ? `bg-gradient-to-r ${category.gradient} border-${color}-500/50 text-cream shadow-lg shadow-${color}-500/10`
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
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                  activeType === "all"
                    ? "bg-gray-700 text-cream"
                    : "text-gray-400 hover:text-gray-200 hover:bg-gray-800/30"
                }`}
              >
                All Types
              </button>
              {(Object.keys(typeConfig) as SearchDocType[]).map((type, index) => {
                const config = typeConfig[type];
                const count = docs.filter(d => d.type === type).length;
                if (count === 0) return null;
                return (
                  <button
                    key={type}
                    onClick={() => setActiveType(type)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-all duration-200 animate-fade-in-up stagger-delay-${index + 1} ${
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
              <div className="rounded-2xl border border-dashed border-gray-700 bg-gray-900/20 p-12 text-center animate-fade-in-up">
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
                  <div className={`mb-8 rounded-xl border ${categoryConfig[activeCategory].color} bg-gradient-to-r ${categoryConfig[activeCategory].gradient} p-6 animate-fade-in-up`}>
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

                {/* If showing all categories, display them separately */}
                {activeCategory === "all" ? (
                  <div className="space-y-12">
                    {Object.entries(categoryConfig).map(([key, category], catIndex) => {
                      const categoryDocs = docsByCategory[key];
                      const filteredCategoryDocs = filteredDocs.filter(doc => 
                        typeConfig[doc.type].category === key
                      );
                      
                      if (filteredCategoryDocs.length === 0) return null;

                      return (
                        <div 
                          key={key} 
                          className={`category-section ${category.bgGradient} rounded-2xl border ${category.color} p-6 stagger-delay-${catIndex + 1}`}
                          style={{ animationDelay: `${(catIndex + 1) * 0.1}s` }}
                        >
                          <div className="mb-6 flex items-center gap-3">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${category.gradient}`}>
                              <span className="text-xl">{category.icon}</span>
                            </div>
                            <div>
                              <h2 className="font-serif text-2xl text-cream">{category.label}</h2>
                              <p className="text-sm text-gray-300">{category.description}</p>
                            </div>
                            <span className="ml-auto rounded-full bg-black/40 px-3 py-1 text-sm text-gray-300">
                              {filteredCategoryDocs.length} items
                            </span>
                          </div>

                          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredCategoryDocs.map((doc, index) => (
                              <div 
                                key={`${doc.type}:${doc.slug}`}
                                className="animate-fade-in-up h-full"
                                style={{ animationDelay: `${(index * 0.05) + (catIndex * 0.1)}s` }}
                              >
                                <ContentCard doc={doc} />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Single category view */
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredDocs.map((doc, index) => (
                      <div 
                        key={`${doc.type}:${doc.slug}`}
                        className="animate-fade-in-up h-full"
                        style={{ animationDelay: `${index * 0.05}s` }}
                      >
                        <ContentCard doc={doc} />
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        {/* Stats Footer */}
        <section className="border-t border-gray-800 bg-black/30 py-10">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
              {Object.entries(categoryConfig).map(([key, category], index) => {
                const count = getCategoryStats(key);
                const color = key === 'insights' ? 'blue' : key === 'frameworks' ? 'amber' : key === 'tools' ? 'emerald' : 'purple';
                return (
                  <div 
                    key={key} 
                    className="text-center animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-${color}-500/20 to-${color}-600/10`}>
                      <span className="text-2xl">{category.icon}</span>
                    </div>
                    <div className="text-3xl font-light text-cream mb-1">{count}</div>
                    <div className="text-sm font-medium uppercase tracking-wider text-gray-300 mb-1">
                      {category.label}
                    </div>
                    <div className="text-xs text-gray-500">
                      {category.description}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-10 text-center">
              <p className="text-sm text-gray-500">
                Total collection: <span className="text-amber-300">{docs.length}</span> curated items
              </p>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export default ContentPage;