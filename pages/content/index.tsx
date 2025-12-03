// pages/content/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import {
  getAllContent,
  type AnyContent,
  CONTENT_CATEGORIES,
  LIBRARY_AESTHETICS,
  SEASONAL_CURATIONS,
} from "@/lib/content";

/** ---- Types / mapping ---------------------------------------------- */

type ContentKind = keyof typeof CONTENT_CATEGORIES;

type ContentFilter = ContentKind | "all";

interface ContentItem {
  id: string;
  kind: ContentKind;
  title: string;
  subtitle?: string;
  description?: string;
  date?: string | null;
  tags?: string[];
  href: string;
  aesthetic: typeof CONTENT_CATEGORIES[ContentKind];
  metadata?: Record<string, any>;
}

type ContentPageProps = {
  items: ContentItem[];
  categoryStats: Record<ContentKind | "all", number>;
};

function mapDocToItem(doc: AnyContent & { aesthetic?: any }): ContentItem | null {
  // Use the aesthetic mapping from our enhanced content layer
  const aesthetic = doc.aesthetic || CONTENT_CATEGORIES.POSTS; // fallback
  
  const base: Omit<ContentItem, "kind" | "aesthetic"> = {
    id: doc._id,
    title: doc.title ?? "Untitled",
    subtitle: (doc as any).subtitle ?? undefined,
    description:
      (doc as any).excerpt ??
      (doc as any).description ??
      undefined,
    date: doc.date ?? null,
    tags: Array.isArray((doc as any).tags)
      ? ((doc as any).tags as string[])
      : [],
    href: "#",
    metadata: {
      readingTime: (doc as any).readingTime,
      featured: (doc as any).featured,
      status: (doc as any).status,
    }
  };

  // Map document types to our category system
  switch (doc.type) {
    case "Post":
      return {
        ...base,
        kind: "POSTS",
        aesthetic: aesthetic,
        href: `/${doc.slug}`,
      };

    case "Book":
      return {
        ...base,
        kind: "BOOKS",
        aesthetic: aesthetic,
        href: `/books/${doc.slug}`,
      };

    case "Download":
      return {
        ...base,
        kind: "DOWNLOADS",
        aesthetic: aesthetic,
        href: `/downloads/${doc.slug}`,
      };

    case "Event":
      return {
        ...base,
        kind: "EVENTS",
        aesthetic: aesthetic,
        href: `/events/${doc.slug}`,
      };

    case "Print":
      return {
        ...base,
        kind: "PRINTS",
        aesthetic: aesthetic,
        href: `/prints/${doc.slug}`,
      };

    case "Resource":
      return {
        ...base,
        kind: "RESOURCES",
        aesthetic: aesthetic,
        href: `/resources/${doc.slug}`,
      };

    default:
      // Skip unknown types
      return null;
  }
}

/** ---- Page component ------------------------------------------------ */

const ContentPage: NextPage<ContentPageProps> = ({ items, categoryStats }) => {
  const [filter, setFilter] = React.useState<ContentFilter>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredItems = React.useMemo(
    () => {
      let result = filter === "all" 
        ? items 
        : items.filter((item) => item.kind === filter);
      
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        result = result.filter(item => 
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      return result;
    },
    [items, filter, searchQuery]
  );

  const canonicalUrl = "https://www.abrahamoflondon.org/content";

  // Sort categories by number of items
  const sortedCategories = Object.entries(CONTENT_CATEGORIES)
    .map(([key, config]) => ({
      key: key as ContentKind,
      config,
      count: categoryStats[key as ContentKind] || 0
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <Layout title="Content Library | Abraham of London" pageTitle="">
      <Head>
        <title>Content Library | Abraham of London</title>
        <meta
          name="description"
          content="A curated collection of strategic insights, volumes, tools, and gatherings — for those building legacies of substance and wisdom."
        />
        <meta name="theme-color" content={LIBRARY_AESTHETICS.colors.primary.lapis} />
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      <main 
        className="min-h-screen"
        style={{
          background: `linear-gradient(135deg, ${LIBRARY_AESTHETICS.colors.primary.parchment} 0%, ${LIBRARY_AESTHETICS.colors.primary.parchment}99 100%)`,
          fontFamily: 'Georgia, serif'
        }}
      >
        {/* HERO SECTION with Persian Library Atmosphere */}
        <section 
          className="relative border-b"
          style={{ 
            borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
            background: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23283B5C' fill-opacity='0.03' fill-rule='evenodd'/%3E%3C/svg%3E")`
          }}
        >
          {/* Subtle Persian pattern overlay */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23DAA520' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              backgroundSize: '60px 60px'
            }}
          />
          
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center">
              {/* Ancient Wisdom Symbol */}
              <div className="mb-6 text-4xl opacity-50"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}>
                𓆓
              </div>
              
              <h1 className="mb-6 font-serif text-5xl font-light tracking-tight sm:text-6xl md:text-7xl"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}>
                The Library of Applied Wisdom
              </h1>
              
              <p className="mx-auto max-w-3xl text-lg italic"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.terracotta }}>
                {SEASONAL_CURATIONS.invitation.text}
              </p>
              
              {/* Seasonal Notice */}
              <div className="mt-8 inline-block rounded-full px-4 py-2 text-sm"
                style={{
                  backgroundColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}15`,
                  color: LIBRARY_AESTHETICS.colors.primary.saffron,
                  border: `1px solid ${LIBRARY_AESTHETICS.colors.primary.saffron}30`
                }}>
                {SEASONAL_CURATIONS.wisdomTheme}
              </div>
            </div>
            
            {/* Search Bar */}
            <div className="mx-auto mt-12 max-w-2xl">
              <div className="relative">
                <input
                  type="search"
                  placeholder="Search manuscripts, volumes, and instruments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border py-3 pl-12 pr-4 text-lg shadow-sm transition-all focus:shadow-lg focus:outline-none"
                  style={{
                    borderColor: `${LIBRARY_AESTHETICS.colors.primary.lapis}30`,
                    backgroundColor: `${LIBRARY_AESTHETICS.colors.primary.parchment}`,
                    color: LIBRARY_AESTHETICS.colors.primary.lapis
                  }}
                />
                <div className="absolute left-4 top-3.5 text-xl opacity-60"
                  style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}>
                  🔍
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CATEGORY FILTER SECTION */}
        <section className="sticky top-0 z-10 border-b backdrop-blur-sm"
          style={{ 
            borderColor: `${LIBRARY_AESTHETICS.colors.primary.lapis}20`,
            backgroundColor: `${LIBRARY_AESTHETICS.colors.primary.parchment}dd`
          }}>
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* All Filter */}
              <FilterPill
                label="All Wisdom"
                icon="∞"
                count={categoryStats.all}
                active={filter === "all"}
                onClick={() => setFilter("all")}
                color={LIBRARY_AESTHETICS.colors.primary.lapis}
                isPrimary
              />
              
              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                {sortedCategories.map(({ key, config, count }) => (
                  <FilterPill
                    key={key}
                    label={config.title}
                    icon={config.icon}
                    count={count}
                    active={filter === key}
                    onClick={() => setFilter(key)}
                    color={config.color}
                  />
                ))}
              </div>
              
              {/* Results Count */}
              <div className="text-sm opacity-70"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}>
                {filteredItems.length} of {items.length} items
              </div>
            </div>
          </div>
        </section>

        {/* CONTENT DISPLAY SECTION */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          {filteredItems.length === 0 ? (
            <div className="rounded-xl border p-12 text-center"
              style={{
                borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}30`,
                backgroundColor: `${LIBRARY_AESTHETICS.colors.primary.parchment}`
              }}>
              <div className="text-5xl mb-4 opacity-30">𓃲</div>
              <h3 className="mb-2 text-xl font-medium"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}>
                This shelf awaits its manuscripts
              </h3>
              <p className="max-w-md mx-auto text-sm opacity-70"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}>
                {searchQuery 
                  ? "No wisdom found matching your search. Try another term."
                  : "The scribes are at work. Try another category, or return when the ink has dried."
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-2">
              {filteredItems.map((item) => (
                <ContentCard key={item.id} item={item} />
              ))}
            </div>
          )}
          
          {/* Library Footer Note */}
          <div className="mt-16 border-t pt-8 text-center text-sm opacity-60"
            style={{ 
              borderColor: `${LIBRARY_AESTHETICS.colors.primary.saffron}20`,
              color: LIBRARY_AESTHETICS.colors.primary.lapis
            }}>
            <p className="italic">A living library, continuously curated</p>
            <div className="mt-2 flex justify-center gap-6">
              {Object.entries(SEASONAL_CURATIONS.tactileSignals).map(([key, value]) => (
                <span key={key} className="text-xs">{value}</span>
              ))}
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

/** ---- UI subcomponents ---------------------------------------------- */

interface FilterPillProps {
  label: string;
  icon?: string;
  count: number;
  active: boolean;
  onClick: () => void;
  color: string;
  isPrimary?: boolean;
}

const FilterPill: React.FC<FilterPillProps> = ({
  label,
  icon,
  count,
  active,
  onClick,
  color,
  isPrimary = false,
}) => {
  const baseClasses = "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200";
  
  const activeClasses = "shadow-lg";
  const inactiveClasses = "opacity-80 hover:opacity-100 hover:shadow-md";
  
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClasses} ${active ? activeClasses : inactiveClasses}`}
      style={{
        backgroundColor: active 
          ? isPrimary ? color : `${color}15`
          : 'transparent',
        borderColor: active ? color : `${color}40`,
        color: active 
          ? isPrimary 
            ? LIBRARY_AESTHETICS.colors.primary.parchment 
            : color
          : color,
        transform: active ? 'translateY(-1px)' : 'none'
      }}
    >
      {icon && <span className="text-lg">{icon}</span>}
      <span>{label}</span>
      <span className={`rounded-full px-2 py-0.5 text-xs ${
        isPrimary && active 
          ? 'bg-white/20' 
          : active 
            ? 'bg-current/20' 
            : 'bg-current/10'
      }`}>
        {count}
      </span>
    </button>
  );
};

interface ContentCardProps {
  item: ContentItem;
}

const ContentCard: React.FC<ContentCardProps> = ({ item }) => {
  const dateLabel =
    item.date && !Number.isNaN(new Date(item.date).getTime())
      ? new Date(item.date).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
        })
      : null;

  return (
    <Link
      href={item.href}
      className="group relative block overflow-hidden rounded-xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
      style={{
        borderColor: `${item.aesthetic.color}30`,
        backgroundColor: `${item.aesthetic.color}08`,
        borderLeft: `4px solid ${item.aesthetic.color}`
      }}
    >
      {/* Hover effect background */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative p-6">
        <div className="mb-4 flex items-start justify-between">
          <div>
            {/* Category Badge */}
            <div className="mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: `${item.aesthetic.color}15`,
                color: item.aesthetic.color
              }}>
              <span className="text-sm">{item.aesthetic.icon}</span>
              <span>{item.aesthetic.title}</span>
            </div>
            
            {/* Title */}
            <h2 className="mb-2 font-serif text-xl font-semibold group-hover:underline"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}>
              {item.title}
            </h2>
            
            {/* Subtitle */}
            {item.subtitle && (
              <p className="mb-3 text-sm italic"
                style={{ color: LIBRARY_AESTHETICS.colors.primary.terracotta }}>
                {item.subtitle}
              </p>
            )}
          </div>
          
          {/* Date */}
          {dateLabel && (
            <div className="text-xs opacity-60"
              style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}>
              {dateLabel}
            </div>
          )}
        </div>
        
        {/* Description */}
        {item.description && (
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed"
            style={{ color: LIBRARY_AESTHETICS.colors.primary.lapis }}>
            {item.description}
          </p>
        )}
        
        {/* Tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {item.tags.slice(0, 3).map((tag) => (
              <span 
                key={tag}
                className="rounded-full px-2 py-0.5 text-xs"
                style={{
                  backgroundColor: `${item.aesthetic.color}10`,
                  color: item.aesthetic.color
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Footer with subtle signal */}
        <div className="flex items-center justify-between border-t pt-4"
          style={{ borderColor: `${item.aesthetic.color}15` }}>
          <div className="text-xs italic opacity-60"
            style={{ color: item.aesthetic.color }}>
            {item.aesthetic.signal.subtle}
          </div>
          <div className="flex items-center gap-1 text-sm font-medium"
            style={{ color: item.aesthetic.color }}>
            <span>Enter</span>
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

/** ---- SSG ----------------------------------------------------------- */

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  const docs = getAllContent();

  // Map documents to items
  const items = docs
    .map(mapDocToItem)
    .filter((item): item is ContentItem => item !== null);

  // Calculate category statistics
  const categoryStats: Record<ContentKind | "all", number> = {
    all: items.length,
    POSTS: 0,
    BOOKS: 0,
    EVENTS: 0,
    DOWNLOADS: 0,
    PRINTS: 0,
    RESOURCES: 0,
    CANON: 0,
  };

  items.forEach(item => {
    categoryStats[item.kind] = (categoryStats[item.kind] || 0) + 1;
  });

  return {
    props: {
      items,
      categoryStats,
    },
    revalidate: 60,
  };
};

export default ContentPage;