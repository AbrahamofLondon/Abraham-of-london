// pages/content.tsx
import type { GetStaticProps, NextPage } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";

import Layout from "@/components/Layout";

// Existing data helpers
import { getAllPostsMeta } from "@/lib/server/posts-data";
import { getAllDownloadsMeta } from "@/lib/server/downloads-data";
import { getAllBooksMeta } from "@/lib/server/books-data";
import { getAllContent } from "@/lib/mdx";

// ---------------------------------------------------------------------------
// Design & Data Types (Refined)
// ---------------------------------------------------------------------------

type ContentKind = "blog" | "book" | "download" | "event" | "print" | "resource";

interface RawContentItem {
  slug?: string;
  title?: string;
  date?: string;
  excerpt?: string;
  description?: string;
  category?: string;
  tags?: string[];
  featured?: boolean;
  readTime?: string | number;
  _raw?: { flattenedPath?: string };
  eventDate?: string;
  fileSize?: string;
}

interface ContentResource {
  kind: ContentKind;
  title: string;
  slug: string;
  href: string;
  date?: string;
  excerpt?: string;
  description?: string;
  category?: string;
  tags: string[];
  featured?: boolean;
  readTime?: string | number;
}

interface ContentPageProps {
  items: ContentResource[];
  featuredItems: ContentResource[];
}

// ---------------------------------------------------------------------------
// Icon System with Subtle Motion
// ---------------------------------------------------------------------------

const StyledIcon: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = "h-6 w-6" 
}) => (
  // Soft, deliberate transition for quality feel
  <div className={`transform transition-all duration-700 ease-in-out ${className}`}>
    {children}
  </div>
);

// Standard icons with thinner strokeWidth for elegance
const BlogIcon = ({ className }: { className?: string }) => (
  <StyledIcon className={className}>
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="stroke-current">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9m0 0v12" />
    </svg>
  </StyledIcon>
);

const BookIcon = ({ className }: { className?: string }) => (
  <StyledIcon className={className}>
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="stroke-current">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  </StyledIcon>
);

const DownloadIcon = ({ className }: { className?: string }) => (
  <StyledIcon className={className}>
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="stroke-current">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  </StyledIcon>
);

const EventIcon = ({ className }: { className?: string }) => (
  <StyledIcon className={className}>
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="stroke-current">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </StyledIcon>
);

const PrintIcon = ({ className }: { className?: string }) => (
  <StyledIcon className={className}>
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="stroke-current">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  </StyledIcon>
);

const ResourceIcon = ({ className }: { className?: string }) => (
  <StyledIcon className={className}>
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="stroke-current">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  </StyledIcon>
);

const ArrowIcon = ({ className = "ml-3 h-4 w-4" }: { className?: string }) => (
  <svg
    className={`transform transition-all duration-700 ease-out ${className}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5} // Slightly thicker for presence
      d="M14 5l7 7m0 0l-7 7m7-7H3"
    />
  </svg>
);

const ContentIcons: Record<ContentKind, React.ReactElement> = {
  blog: <BlogIcon />,
  book: <BookIcon />,
  download: <DownloadIcon />,
  event: <EventIcon />,
  print: <PrintIcon />,
  resource: <ResourceIcon />,
};

// ---------------------------------------------------------------------------
// Aesthetic System (Re-termed for Class)
// ---------------------------------------------------------------------------

const kindOrder: ContentKind[] = ["blog", "book", "download", "event", "print", "resource"];

const kindLabels: Record<ContentKind, string> = {
  blog: "Strategic Essays",
  book: "Curated Volumes", 
  download: "Essential Tools", // Gentler term
  event: "Master Classes",
  print: "Artisan Prints",
  resource: "Core Resources", // Gentler term
} as const;

// Renamed from getKindAura to getKindSubtleGradient
const getKindSubtleGradient = (kind: ContentKind): string => {
  const gradients: Record<ContentKind, string> = {
    blog: "bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/10",
    book: "bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-fuchsia-500/10",
    download: "bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-red-500/10", 
    event: "bg-gradient-to-br from-rose-500/10 via-pink-500/5 to-red-500/10",
    print: "bg-gradient-to-br from-indigo-500/10 via-blue-500/5 to-cyan-500/10",
    resource: "bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-blue-500/10",
  };
  return gradients[kind] ?? "bg-gradient-to-br from-gray-500/10 via-gray-400/5 to-gray-600/10";
};

// Renamed from getKindEssence to getKindHighlight
const getKindHighlight = (kind: ContentKind): string => {
  const highlights: Record<ContentKind, string> = {
    // Reduced opacity on backgrounds for a cleaner, softer look
    blog: "text-emerald-300 border-emerald-400/30 bg-emerald-500/10 shadow-emerald-500/15",
    book: "text-violet-300 border-violet-400/30 bg-violet-500/10 shadow-violet-500/15",
    download: "text-amber-300 border-amber-400/30 bg-amber-500/10 shadow-amber-500/15",
    event: "text-rose-300 border-rose-400/30 bg-rose-500/10 shadow-rose-500/15", 
    print: "text-indigo-300 border-indigo-400/30 bg-indigo-500/10 shadow-indigo-500/15",
    resource: "text-cyan-300 border-cyan-400/30 bg-cyan-500/10 shadow-cyan-500/15",
  };
  return highlights[kind] ?? "text-gray-300 border-gray-400/30 bg-gray-500/10 shadow-gray-500/15";
};

// ---------------------------------------------------------------------------
// Refined Glassmorphic Component
// ---------------------------------------------------------------------------

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  softGlow?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = "", 
  hoverEffect = true, // Renamed 'hover' to 'hoverEffect'
  softGlow = false // Renamed 'glow' to 'softGlow'
}) => (
  <div className={`
    relative overflow-hidden rounded-3xl 
    // Refined base glass/blur effect
    bg-white/[0.04] backdrop-blur-3xl
    border border-white/10
    shadow-2xl shadow-black/40
    // Gentle light-sweep animation on hover
    before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:translate-x-[-100%]
    hover:before:translate-x-[100%] hover:before:transition-transform hover:before:duration-1000
    ${hoverEffect ? 'transition-all duration-700 hover:scale-[1.02] hover:shadow-3xl hover:shadow-black/60' : ''} // Softer scale up
    ${softGlow ? 'after:absolute after:inset-0 after:bg-gradient-to-br after:from-softGold/10 after:via-transparent after:to-softGold/5 after:opacity-0 after:transition-opacity after:duration-700 hover:after:opacity-100' : ''}
    ${className}
  `}>
    {/* Inner transparent hover layer for depth */}
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
    <div className="relative z-10 h-full">
      {children}
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Animated Background Masterpiece (Kept as is for Stunning UX)
// ---------------------------------------------------------------------------

const CosmicBackground: React.FC = () => {
  return (
    <>
      {/* Base Cosmic Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#1A1A2E] to-[#16213E]" />
      
      {/* Animated Nebula */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-softGold/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>

      {/* Floating Particles */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-float"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            animationDelay: `${i * 2}s`,
            animationDuration: `${15 + Math.random() * 20}s`,
          }}
        >
          <div 
            className="w-1 h-1 bg-softGold/40 rounded-full blur-sm"
            style={{
              transform: `scale(${0.5 + Math.random() * 1.5})`,
            }}
          />
        </div>
      ))}

      {/* Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
    </>
  );
};

// ---------------------------------------------------------------------------
// Safe Helper Functions (Kept as is for Build Safety)
// ---------------------------------------------------------------------------

const getSlug = (item: RawContentItem): string | undefined => {
  try {
    const stripCollectionPrefix = (value: string) =>
      value.replace(/^(blog|books|downloads|events|prints|resources)\//, "");

    if (item.slug && typeof item.slug === "string") {
      return stripCollectionPrefix(item.slug);
    }

    if (item._raw?.flattenedPath) {
      return stripCollectionPrefix(item._raw.flattenedPath);
    }

    if (item.title) {
      return item.title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    return undefined;
  } catch (error) {
    console.error("[getSlug] Error processing slug:", error);
    return undefined;
  }
};

const getHref = (kind: ContentKind, slug: string): string => {
  if (kind === "blog") return `/${slug}`;
  return `/${kind}s/${slug}`;
};

const processContentItems = (
  items: RawContentItem[],
  kind: ContentKind,
  defaultCategory?: string,
): ContentResource[] => {
  const processed: ContentResource[] = [];

  items.forEach((item) => {
    try {
      const slug = getSlug(item);
      const title = item.title || "Untitled";

      if (!slug) {
        console.warn(`[processContentItems] Skipping item with no slug: ${title}`);
        return;
      }

      processed.push({
        kind,
        title,
        slug,
        href: getHref(kind, slug),
        date: item.date || item.eventDate,
        excerpt: item.excerpt,
        description: item.description,
        category: item.category || defaultCategory,
        tags: Array.isArray(item.tags) ? item.tags : [],
        featured: Boolean(item.featured),
        readTime: item.readTime,
      });
    } catch (error) {
      console.error("[processContentItems] Error processing item:", error);
    }
  });

  return processed;
};

// ---------------------------------------------------------------------------
// Signature Content Components
// ---------------------------------------------------------------------------

interface SignatureCardProps { // Renamed MasterpieceCard to SignatureCard
  item: ContentResource;
  variant?: "featured" | "elegant" | "minimal";
  index?: number;
}

const SignatureCard: React.FC<SignatureCardProps> = ({ 
  item, 
  variant = "elegant",
  index = 0
}) => {
  const [_isHovered, _setIsHovered] = React.useState(false);
  const description = item.description || item.excerpt || "";

  const ctaLabels = {
    download: "Acquire Resource",
    event: "Join Experience", 
    book: "Explore Volume",
    blog: "Read Discourse",
    print: "View Artistry",
    resource: "Access Wisdom"
  };

  const ctaLabel = ctaLabels[item.kind] || "Discover";

  if (variant === "featured") {
    return (
      <GlassCard softGlow hoverEffect>
        <div 
          className="p-8 h-full flex flex-col relative group"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Animated Background Aura */}
          <div className={`absolute inset-0 rounded-3xl ${getKindSubtleGradient(item.kind)} opacity-0 group-hover:opacity-100 transition-opacity duration-1000`} />
          
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex items-start justify-between mb-6">
              <div className={`p-3 rounded-2xl border backdrop-blur-sm ${getKindHighlight(item.kind)} transform group-hover:scale-110 transition-transform duration-500`}>
                {ContentIcons[item.kind]}
              </div>
              <div className="text-right space-y-2">
                <span className={`text-sm font-semibold px-3 py-1 rounded-full border backdrop-blur-sm ${getKindHighlight(item.kind)}`}>
                  {kindLabels[item.kind]} {/* Use the gentler label here */}
                </span>
                {item.date && (
                  <time className="block text-xs text-gray-400 font-light">
                    {new Date(item.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                      year: 'numeric'
                    })}
                  </time>
                )}
              </div>
            </div>

            <h3 className="font-serif text-2xl lg:text-3xl text-white mb-4 leading-tight group-hover:text-softGold transition-colors duration-500">
              {item.title}
            </h3>

            {description && (
              <p className="text-gray-300 mb-6 line-clamp-3 flex-grow leading-relaxed">
                {description}
              </p>
            )}

            <div className="mt-auto pt-6 border-t border-white/10">
              <Link
                href={item.href}
                className="group/link inline-flex items-center text-sm font-semibold text-softGold transition-all duration-700 hover:gap-4" // Increased transition for class
              >
                <span className="bg-gradient-to-r from-softGold to-amber-200 bg-clip-text text-transparent">
                  {ctaLabel}
                </span>
                <ArrowIcon className={`transform group-hover:translate-x-2 group-hover:scale-110`} />
              </Link>
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Elegant variant (default)
  return (
    <GlassCard hoverEffect>
      <div 
        className="p-6 h-full flex flex-col relative group"
      >
        {/* Interactive Background */}
        <div className={`absolute inset-0 rounded-3xl ${getKindSubtleGradient(item.kind)} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className={`p-2 rounded-xl border backdrop-blur-sm ${getKindHighlight(item.kind)} transform group-hover:scale-110 transition-transform duration-500`}>
              {ContentIcons[item.kind]}
            </div>
            {item.date && (
              <time className="text-xs text-gray-400 font-light flex-shrink-0 ml-2">
                {new Date(item.date).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                })}
              </time>
            )}
          </div>

          {/* Category */}
          <div className="mb-3">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full border backdrop-blur-sm ${getKindHighlight(item.kind)}`}>
              {kindLabels[item.kind]} {/* Use the gentler label here */}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-serif text-xl text-white mb-3 line-clamp-2 leading-tight group-hover:text-softGold transition-colors duration-500">
            {item.title}
          </h3>

          {/* Description */}
          {description && (
            <p className="text-gray-300 text-sm mb-4 line-clamp-3 flex-grow leading-relaxed">
              {description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10 mt-auto">
            <div className="flex items-center gap-3">
              {item.readTime && (
                <span className="text-xs text-gray-400 font-light">
                  {typeof item.readTime === 'number' ? `${item.readTime}min` : item.readTime}
                </span>
              )}
              {item.category && (
                <span className="text-xs text-gray-400 font-light border-l border-white/20 pl-3">
                  {item.category}
                </span>
              )}
            </div>
            <Link
              href={item.href}
              className="group/link inline-flex items-center text-xs font-semibold text-softGold transition-all duration-700 hover:gap-2"
            >
              {ctaLabel}
              <ArrowIcon className={`h-3 w-3 transform group-hover:translate-x-1`} />
            </Link>
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

// ---------------------------------------------------------------------------
// Ultimate SSG (Kept as is for Build Safety/Logic)
// ---------------------------------------------------------------------------

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  console.log("🌌 [content] Building ultimate experience...");

  try {
    const allItems: ContentResource[] = [];

    const safeGetData = async <T,>(
      dataFetcher: (() => T) | undefined,
      dataName: string
    ): Promise<T[]> => {
      try {
        if (!dataFetcher || typeof dataFetcher !== 'function') {
          console.warn(`[content] ${dataName} fetcher unavailable`);
          return [];
        }
        const data = dataFetcher();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.error(`[content] Error fetching ${dataName}:`, error);
        return [];
      }
    };

    // Parallel data fetching for performance
    const contentFetchers = [
      { kind: "blog" as ContentKind, data: safeGetData(getAllPostsMeta, "blog posts"), category: "Essays" },
      { kind: "book" as ContentKind, data: safeGetData(getAllBooksMeta, "books"), category: "Volumes" }, // Renamed
      { kind: "download" as ContentKind, data: safeGetData(getAllDownloadsMeta, "downloads"), category: "Tools" },
      { kind: "event" as ContentKind, data: safeGetData(() => getAllContent?.("events"), "events"), category: "Classes" }, // Renamed
      { kind: "print" as ContentKind, data: safeGetData(() => getAllContent?.("prints"), "prints"), category: "Artistry" }, // Renamed
      { kind: "resource" as ContentKind, data: safeGetData(() => getAllContent?.("resources"), "resources"), category: "Wisdom" }, // Renamed
    ];

    await Promise.all(
      contentFetchers.map(async ({ kind, data, category }) => {
        try {
          const items = await data;
          const processed = processContentItems(items as unknown as RawContentItem[], kind, category);
          allItems.push(...processed);
          console.log(`✨ [content] Processed ${processed.length} ${kind}`);
        } catch (error) {
          console.error(`💥 [content] Failed to process ${kind}:`, error);
        }
      })
    );

    // Premium sorting with validation
    const sortedItems = allItems.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      return dateB - dateA;
    });

    const featuredItems = sortedItems.filter((i) => i.featured).slice(0, 4);

    console.log("🎊 [content] Ultimate build completed:", {
      total: sortedItems.length,
      featured: featuredItems.length
    });

    return {
      props: {
        items: JSON.parse(JSON.stringify(sortedItems)),
        featuredItems: JSON.parse(JSON.stringify(featuredItems)),
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("💢 [content] Critical build error:", error);
    return {
      props: { items: [], featuredItems: [] },
      revalidate: 3600,
    };
  }
};

// ---------------------------------------------------------------------------
// The Signature Experience Component
// ---------------------------------------------------------------------------

const ContentPage: NextPage<ContentPageProps> = ({ items, featuredItems }) => {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = React.useState<ContentKind | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isScrolled, setIsScrolled] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Content statistics
  const contentStats = React.useMemo(() => ({
    all: items.length,
    blog: items.filter((i) => i.kind === "blog").length,
    book: items.filter((i) => i.kind === "book").length,
    download: items.filter((i) => i.kind === "download").length,
    event: items.filter((i) => i.kind === "event").length,
    print: items.filter((i) => i.kind === "print").length,
    resource: items.filter((i) => i.kind === "resource").length,
  }), [items]);

  // Filter labels now use the gentler 'kindLabels' for consistency and elegance
  const signatureFilters = [ // Renamed luxuryFilters to signatureFilters
    { key: "all" as const, label: "All Masterpieces", count: contentStats.all, icon: "🌌" },
    { key: "blog" as const, label: kindLabels.blog, count: contentStats.blog, icon: "📝" },
    { key: "book" as const, label: kindLabels.book, count: contentStats.book, icon: "📚" },
    { key: "download" as const, label: kindLabels.download, count: contentStats.download, icon: "🛠️" },
    { key: "event" as const, label: kindLabels.event, count: contentStats.event, icon: "🎓" },
    { key: "print" as const, label: kindLabels.print, count: contentStats.print, icon: "🎨" },
    { key: "resource" as const, label: kindLabels.resource, count: contentStats.resource, icon: "💎" },
  ];

  // Filtering logic kept as is for build safety
  const filteredItems = React.useMemo(() => {
    return items.filter((item) => {
      const matchesFilter = activeFilter === "all" || item.kind === activeFilter;
      if (!matchesFilter) return false;
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase().trim();
      return (
        item.title.toLowerCase().includes(query) ||
        item.excerpt?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    });
  }, [items, activeFilter, searchQuery]);

  const groupedByKind = React.useMemo(() => {
    const initial: Record<ContentKind, ContentResource[]> = {
      blog: [], book: [], download: [], event: [], print: [], resource: []
    };
    filteredItems.forEach(item => initial[item.kind].push(item));
    return initial;
  }, [filteredItems]);

  const handleKeyDown = (event: React.KeyboardEvent, filterKey: ContentKind | "all") => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setActiveFilter(filterKey);
    }
  };

  if (!mounted) {
    return (
      <Layout title="Strategic Insights & Resources">
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-softGold text-xl">Loading Masterpieces...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="The Wisdom Atelier">
      <Head>
        <title>The Wisdom Atelier | Abraham of London</title>
        <meta name="description" content="Experience curated strategic wisdom, essential tools, and core resources in an unparalleled digital sanctuary for visionary leaders." />
        <meta name="keywords" content="strategy, leadership, legacy, wisdom, resources, insights, mastery" /> {/* Updated keywords */}
      </Head>

      <div className="min-h-screen bg-black text-white overflow-hidden relative">
        {/* Cosmic Background */}
        <div className="fixed inset-0 -z-10">
          <CosmicBackground />
        </div>

        {/* Signature Hero Experience */}
        <section className="relative min-h-screen flex items-center justify-center px-4 pt-20">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black/80" />
          
          <div className="relative z-10 max-w-6xl mx-auto text-center">
            {/* Subtle Identifier */}
            <div className="inline-flex items-center gap-3 rounded-full border border-softGold/30 bg-softGold/10 px-8 py-4 mb-12 backdrop-blur-2xl">
              <div className="w-2 h-2 bg-softGold rounded-full animate-pulse" />
              <span className="text-softGold text-sm font-light tracking-widest uppercase">THE WISDOM ATELIER</span>
              <div className="w-2 h-2 bg-softGold rounded-full animate-pulse" />
            </div>

            {/* Masterpiece Heading */}
            <h1 className="font-serif text-6xl md:text-8xl lg:text-9xl font-light text-white mb-8 leading-none">
              Craft
              <span className="block bg-gradient-to-r from-softGold via-yellow-200 to-amber-200 bg-clip-text text-transparent">
                Legacy
              </span>
            </h1>

            {/* Poetic Subtitle */}
            <p className="text-2xl md:text-3xl text-gray-300 mb-16 max-w-4xl mx-auto leading-relaxed font-light">
              Where strategic wisdom meets artistic excellence. 
              <span className="block text-softGold/80">Curated masterpieces for visionary leaders.</span>
            </p>

            {/* Signature Action Cluster */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
              <button
                onClick={() => document.getElementById("gallery")?.scrollIntoView({ behavior: "smooth" })}
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-softGold to-amber-500 px-12 py-6 font-semibold text-black transition-all duration-700 hover:scale-[1.05] hover:shadow-3xl hover:shadow-yellow-500/30" // Softer scale
              >
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-softGold opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10 flex items-center gap-4 text-lg">
                  Enter the Atelier
                  <ArrowIcon className="transform group-hover:translate-x-2 group-hover:scale-110" />
                </span>
              </button>

              <button
                onClick={() => setActiveFilter("download")}
                className="group rounded-full border-2 border-softGold/50 bg-black/40 px-12 py-6 font-semibold text-softGold backdrop-blur-2xl transition-all duration-700 hover:bg-softGold/10 hover:border-softGold/80 hover:scale-105"
              >
                <span className="flex items-center gap-3 text-lg">
                  Access Essential Tools {/* Gentler term */}
                  <span className="text-amber-200">✨</span>
                </span>
              </button>
            </div>

            {/* Elegant Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              {signatureFilters.slice(1, 5).map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className="group text-left p-6 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl transition-all duration-700 hover:scale-110 hover:bg-white/10 hover:border-softGold/30"
                >
                  <div className="text-3xl mb-3 transform group-hover:scale-125 transition-transform duration-500">
                    {filter.icon}
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">{filter.count}</div>
                  <div className="text-sm text-gray-400 font-light leading-tight">{filter.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Subtle Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex flex-col items-center gap-2">
              <div className="text-softGold/60 text-sm font-light tracking-widest">EXPLORE</div>
              <div className="w-px h-16 bg-gradient-to-b from-softGold to-transparent" />
            </div>
          </div>
        </section>

        {/* Featured Masterpieces Gallery */}
        {featuredItems.length > 0 && (
          <section className="relative py-32 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-20">
                <h2 className="font-serif text-5xl md:text-6xl text-white mb-6">
                  Curated <span className="text-softGold">Excellence</span>
                </h2>
                <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                  Hand-selected strategic masterpieces of unparalleled quality and transformative impact
                </p>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-8">
                {featuredItems.map((item, index) => (
                  <div
                    key={item.slug}
                    className="transform transition-all duration-1000 hover:-translate-y-2" // Softer hover
                    style={{ animationDelay: `${index * 200}ms` }}
                  >
                    <SignatureCard item={item} variant="featured" index={index} />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Main Gallery Experience */}
        <section id="gallery" className="relative py-32 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Sticky Signature Header */}
            <div className={`sticky top-24 z-50 mb-16 transition-all duration-700 ${
              isScrolled 
                ? 'bg-black/90 backdrop-blur-3xl rounded-3xl p-8 shadow-3xl border border-white/10'  // Increased blur
                : ''
            }`}>
              <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
                {/* Elegant Search */}
                <div className="flex-1 max-w-lg">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search wisdom, tools, masterpieces..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-8 py-5 text-white placeholder-gray-400 backdrop-blur-2xl transition-all duration-500 focus:border-softGold/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-softGold/25 text-lg"
                    />
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Signature Filter Tabs */}
                <div className="flex flex-wrap gap-4 justify-center lg:justify-end">
                  {signatureFilters.map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setActiveFilter(filter.key)}
                      onKeyDown={(e) => handleKeyDown(e, filter.key)}
                      className={`flex items-center gap-4 rounded-full border-2 px-6 py-4 text-base font-medium transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-softGold focus:ring-offset-2 focus:ring-offset-black ${
                        activeFilter === filter.key
                          ? "border-softGold bg-softGold text-black shadow-2xl shadow-yellow-500/40 transform scale-105"
                          : "border-white/10 bg-white/5 text-gray-300 hover:border-softGold/40 hover:bg-white/10 hover:scale-[1.02]" // Softer scale
                      }`}
                    >
                      <span className="text-lg">{filter.icon}</span>
                      {filter.label}
                      <span className={`rounded-full px-3 py-1 text-sm ${
                        activeFilter === filter.key ? "bg-black/20 text-black" : "bg-white/10 text-gray-400"
                      }`}>
                        {filter.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Gallery Content */}
            {filteredItems.length === 0 ? (
              <GlassCard className="text-center p-16" hoverEffect={false}>
                <div className="text-7xl mb-6">🌌</div>
                <h3 className="font-serif text-3xl text-white mb-4">No Masterpieces Found</h3>
                <p className="text-gray-400 text-lg mb-8 max-w-md mx-auto">
                  {searchQuery 
                    ? `No results for "${searchQuery}". Refine your search.`
                    : `No ${activeFilter !== "all" ? kindLabels[activeFilter] : "content"} available.`
                  }
                </p>
                {(searchQuery || activeFilter !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveFilter("all");
                    }}
                    className="rounded-full bg-softGold px-8 py-4 font-semibold text-black transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/25 text-lg"
                  >
                    Show All Masterpieces
                  </button>
                )}
              </GlassCard>
            ) : activeFilter === "all" ? (
              // Grouped Gallery View
              <div className="space-y-24">
                {kindOrder.map((kind) => {
                  const group = groupedByKind[kind];
                  if (!group.length) return null;

                  return (
                    <div key={kind} className="space-y-12">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif text-4xl text-white flex items-center gap-6">
                          <div className={`p-3 rounded-2xl border backdrop-blur-sm ${getKindHighlight(kind)}`}>
                            {ContentIcons[kind]}
                          </div>
                          {kindLabels[kind]}
                        </h3>
                        <span className="text-lg text-gray-400 font-light">
                          {group.length} masterpiece{group.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                        {group.map((item) => (
                          <SignatureCard key={item.slug} item={item} variant="elegant" />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Single Category View
              <div>
                <div className="flex items-center justify-between mb-12">
                  <h3 className="font-serif text-4xl text-white flex items-center gap-6">
                    <div className={`p-3 rounded-2xl border backdrop-blur-sm ${getKindHighlight(activeFilter)}`}>
                      {ContentIcons[activeFilter]}
                    </div>
                    {kindLabels[activeFilter]}
                  </h3>
                  <span className="text-lg text-gray-400">
                    {filteredItems.length} masterpiece{filteredItems.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {filteredItems.map((item) => (
                    <SignatureCard key={item.slug} item={item} variant="elegant" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Signature CTA Experience */}
        <section className="relative py-40 px-4">
          <div className="max-w-5xl mx-auto text-center">
            <GlassCard className="p-16 md:p-20" softGlow hoverEffect={false}>
              <h2 className="font-serif text-5xl md:text-6xl text-white mb-8">
                Begin Your <span className="text-softGold">Legacy</span> Journey
              </h2>
              <p className="text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
                Join visionary leaders and founders in our exclusive atelier, 
                where strategic wisdom transforms into enduring legacy.
              </p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <button className="group relative overflow-hidden rounded-full bg-gradient-to-r from-softGold to-amber-500 px-14 py-6 font-semibold text-black transition-all duration-700 hover:scale-[1.05] hover:shadow-3xl hover:shadow-yellow-500/30 text-lg">
                  <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-softGold opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <span className="relative z-10">Commence Your Journey</span>
                </button>
                <button className="group rounded-full border-2 border-softGold/50 bg-transparent px-14 py-6 font-semibold text-softGold transition-all duration-700 hover:bg-softGold/10 hover:scale-105 text-lg">
                  <span className="flex items-center gap-4">
                    Book Private Session
                    <ArrowIcon className="transform group-hover:translate-x-1" />
                  </span>
                </button>
              </div>
            </GlassCard>
          </div>
        </section>
      </div>

      {/* Global Signature Animations and Styling */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) rotate(0deg) scale(1);
            opacity: 0.7;
          }
          33% { 
            transform: translateY(-30px) rotate(120deg) scale(1.1);
            opacity: 1;
          }
          66% { 
            transform: translateY(15px) rotate(240deg) scale(0.9);
            opacity: 0.5;
          }
        }
        
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }

        /* Custom scrollbar - using softGold palette */
        ::-webkit-scrollbar {
          width: 8px;
        }
        
        ::-webkit-scrollbar-track {
          background: #0A0A0A;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, var(--color-softGold), var(--color-softGold-light));
          border-radius: 4px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, var(--color-softGold-light), var(--color-softGold));
        }

        /* Selection styling - using softGold palette */
        ::selection {
          background: var(--color-softGold-selection);
          color: var(--color-softGold-light);
        }
      `}</style>
    </Layout>
  );
};

export default ContentPage;