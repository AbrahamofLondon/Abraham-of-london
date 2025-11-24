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
// Enhanced Types with Luxury Aesthetics
// ---------------------------------------------------------------------------

type ContentKind =
  | "blog"
  | "book"
  | "download"
  | "event"
  | "print"
  | "resource";

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
  _raw?: {
    flattenedPath?: string;
  };
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
// Luxury Icon System
// ---------------------------------------------------------------------------

const ElegantIcon: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = "h-5 w-5" 
}) => (
  <div className={`transform transition-all duration-300 ${className}`}>
    {children}
  </div>
);

const BlogIcon = ({ className }: { className?: string }) => (
  <ElegantIcon className={className}>
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="stroke-current">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9m0 0v12" />
    </svg>
  </ElegantIcon>
);

const BookIcon = ({ className }: { className?: string }) => (
  <ElegantIcon className={className}>
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="stroke-current">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  </ElegantIcon>
);

const DownloadIcon = ({ className }: { className?: string }) => (
  <ElegantIcon className={className}>
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="stroke-current">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  </ElegantIcon>
);

const EventIcon = ({ className }: { className?: string }) => (
  <ElegantIcon className={className}>
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="stroke-current">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </ElegantIcon>
);

const PrintIcon = ({ className }: { className?: string }) => (
  <ElegantIcon className={className}>
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="stroke-current">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
    </svg>
  </ElegantIcon>
);

const ResourceIcon = ({ className }: { className?: string }) => (
  <ElegantIcon className={className}>
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="stroke-current">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  </ElegantIcon>
);

const ArrowIcon = ({ className = "ml-3 h-4 w-4" }: { className?: string }) => (
  <svg
    className={`transform transition-transform duration-300 ${className}`}
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={1.5}
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
// Luxury Design System
// ---------------------------------------------------------------------------

const kindOrder: ContentKind[] = ["blog", "book", "download", "event", "print", "resource"];

const kindLabels: Record<ContentKind, string> = {
  blog: "Strategic Essays",
  book: "Curated Books",
  download: "Premium Tools",
  event: "Master Classes",
  print: "Artisan Prints",
  resource: "Wisdom Resources",
} as const;

const getKindGradient = (kind: ContentKind): string => {
  const gradients: Record<ContentKind, string> = {
    blog: "from-emerald-500/10 via-teal-500/5 to-cyan-500/10",
    book: "from-violet-500/10 via-purple-500/5 to-fuchsia-500/10",
    download: "from-amber-500/10 via-orange-500/5 to-red-500/10",
    event: "from-rose-500/10 via-pink-500/5 to-red-500/10",
    print: "from-indigo-500/10 via-blue-500/5 to-cyan-500/10",
    resource: "from-cyan-500/10 via-sky-500/5 to-blue-500/10",
  };
  return gradients[kind] ?? "from-gray-500/10 via-gray-400/5 to-gray-600/10";
};

const getKindAccent = (kind: ContentKind): string => {
  const accents: Record<ContentKind, string> = {
    blog: "text-emerald-300 border-emerald-400/30 bg-emerald-500/10",
    book: "text-violet-300 border-violet-400/30 bg-violet-500/10",
    download: "text-amber-300 border-amber-400/30 bg-amber-500/10",
    event: "text-rose-300 border-rose-400/30 bg-rose-500/10",
    print: "text-indigo-300 border-indigo-400/30 bg-indigo-500/10",
    resource: "text-cyan-300 border-cyan-400/30 bg-cyan-500/10",
  };
  return accents[kind] ?? "text-gray-300 border-gray-400/30 bg-gray-500/10";
};

const getKindGlow = (kind: ContentKind): string => {
  const glows: Record<ContentKind, string> = {
    blog: "hover:shadow-emerald-500/10",
    book: "hover:shadow-violet-500/10",
    download: "hover:shadow-amber-500/10",
    event: "hover:shadow-rose-500/10",
    print: "hover:shadow-indigo-500/10",
    resource: "hover:shadow-cyan-500/10",
  };
  return glows[kind] ?? "hover:shadow-gray-500/10";
};

// ---------------------------------------------------------------------------
// Safe Helper Functions
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
// Luxury Components
// ---------------------------------------------------------------------------

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className = "", hover = true }) => (
  <div className={`
    relative overflow-hidden rounded-3xl border border-white/10 
    bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-xl
    shadow-2xl shadow-black/20
    ${hover ? 'transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-black/30' : ''}
    ${className}
  `}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
    {children}
  </div>
);

interface ContentCaseProps {
  item: ContentResource;
  variant?: "elegant" | "featured" | "minimal";
}

const ContentCase: React.FC<ContentCaseProps> = ({ item, variant = "elegant" }) => {
  const description = item.description || item.excerpt || "";
  const [isHovered, setIsHovered] = React.useState(false);

  const ctaLabel = {
    download: "Download Resource",
    event: "Join Event",
    book: "Explore Book",
    blog: "Read Essay",
    print: "View Print",
    resource: "Access Resource"
  }[item.kind] || "Explore";

  if (variant === "minimal") {
    return (
      <GlassCard hover={false}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className={`p-2 rounded-xl border ${getKindAccent(item.kind)}`}>
              {ContentIcons[item.kind]}
            </div>
            <span className={`text-xs font-medium px-2 py-1 rounded-full border ${getKindAccent(item.kind)}`}>
              {item.kind}
            </span>
          </div>
          <h3 className="font-serif text-lg text-white mb-2 line-clamp-2">
            {item.title}
          </h3>
          {item.date && (
            <time className="text-xs text-gray-400">
              {new Date(item.date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </time>
          )}
        </div>
      </GlassCard>
    );
  }

  if (variant === "featured") {
    return (
      <GlassCard>
        <div 
          className="p-8 h-full flex flex-col"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex items-start justify-between mb-6">
            <div className={`p-3 rounded-2xl border ${getKindAccent(item.kind)}`}>
              {ContentIcons[item.kind]}
            </div>
            <div className="text-right">
              <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${getKindAccent(item.kind)}`}>
                {item.kind}
              </span>
              {item.date && (
                <time className="block text-xs text-gray-400 mt-2">
                  {new Date(item.date).toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                  })}
                </time>
              )}
            </div>
          </div>

          <h3 className="font-serif text-2xl text-white mb-4 leading-tight">
            {item.title}
          </h3>

          {description && (
            <p className="text-gray-300 mb-6 line-clamp-3 flex-grow">
              {description}
            </p>
          )}

          <Link
            href={item.href}
            className="group inline-flex items-center text-sm font-semibold text-softGold transition-all duration-300 hover:gap-4"
          >
            {ctaLabel}
            <ArrowIcon className={`transform ${isHovered ? 'translate-x-1' : ''}`} />
          </Link>
        </div>
      </GlassCard>
    );
  }

  // Elegant variant (default)
  return (
    <GlassCard>
      <div 
        className="p-6 h-full flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2 rounded-xl border ${getKindAccent(item.kind)}`}>
            {ContentIcons[item.kind]}
          </div>
          {item.date && (
            <time className="text-xs text-gray-400 flex-shrink-0">
              {new Date(item.date).toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
              })}
            </time>
          )}
        </div>

        <div className="mb-2">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getKindAccent(item.kind)}`}>
            {item.kind}
          </span>
        </div>

        <h3 className="font-serif text-xl text-white mb-3 line-clamp-2 leading-tight">
          {item.title}
        </h3>

        {description && (
          <p className="text-gray-300 text-sm mb-4 line-clamp-3 flex-grow">
            {description}
          </p>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          {item.readTime && (
            <span className="text-xs text-gray-400">
              {typeof item.readTime === 'number' ? `${item.readTime}min` : item.readTime}
            </span>
          )}
          <Link
            href={item.href}
            className="group inline-flex items-center text-xs font-semibold text-softGold transition-all duration-300 hover:gap-2"
          >
            {ctaLabel}
            <ArrowIcon className={`h-3 w-3 transform ${isHovered ? 'translate-x-1' : ''}`} />
          </Link>
        </div>
      </div>
    </GlassCard>
  );
};

// ---------------------------------------------------------------------------
// Animated Background Elements
// ---------------------------------------------------------------------------

const AnimatedBackground: React.FC = () => (
  <>
    <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#1A1A2E] to-[#16213E]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/5 via-transparent to-transparent" />
    </div>
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="absolute animate-float"
          style={{
            top: `${20 + i * 30}%`,
            left: `${10 + i * 40}%`,
            animationDelay: `${i * 2}s`,
            animationDuration: `${15 + i * 5}s`,
          }}
        >
          <div className="w-2 h-2 bg-softGold/30 rounded-full blur-sm" />
        </div>
      ))}
    </div>
  </>
);

// ---------------------------------------------------------------------------
// SSG with Enhanced Safety
// ---------------------------------------------------------------------------

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  console.log("🔄 [content] Building luxury content hub...");

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

    // Fetch all content types safely
    const contentPromises = [
      { kind: "blog" as ContentKind, data: safeGetData(getAllPostsMeta, "blog posts"), category: "Essays" },
      { kind: "book" as ContentKind, data: safeGetData(getAllBooksMeta, "books"), category: "Books" },
      { kind: "download" as ContentKind, data: safeGetData(getAllDownloadsMeta, "downloads"), category: "Tools" },
      { kind: "event" as ContentKind, data: safeGetData(() => getAllContent?.("events"), "events"), category: "Events" },
      { kind: "print" as ContentKind, data: safeGetData(() => getAllContent?.("prints"), "prints"), category: "Prints" },
      { kind: "resource" as ContentKind, data: safeGetData(() => getAllContent?.("resources"), "resources"), category: "Resources" },
    ];

    for (const { kind, data, category } of contentPromises) {
      try {
        const items = await data;
        const processed = processContentItems(
          items as unknown as RawContentItem[],
          kind,
          category
        );
        allItems.push(...processed);
        console.log(`✅ [content] Processed ${processed.length} ${kind} items`);
      } catch (error) {
        console.error(`❌ [content] Failed to process ${kind}:`, error);
      }
    }

    // Safe sorting
    const sortedItems = allItems.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      if (isNaN(dateA) && isNaN(dateB)) return 0;
      if (isNaN(dateA)) return 1;
      if (isNaN(dateB)) return -1;
      return dateB - dateA;
    });

    const featuredItems = sortedItems.filter((i) => i.featured).slice(0, 4);

    console.log("🎉 [content] Build completed:", {
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
    console.error("💥 [content] Critical build error:", error);
    return {
      props: { items: [], featuredItems: [] },
      revalidate: 3600,
    };
  }
};

// ---------------------------------------------------------------------------
// Masterpiece Component
// ---------------------------------------------------------------------------

const ContentPage: NextPage<ContentPageProps> = ({ items, featuredItems }) => {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = React.useState<ContentKind | "all">("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isScrolled, setIsScrolled] = React.useState(false);

  React.useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 100);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Safe statistics
  const contentStats = React.useMemo(() => ({
    all: items.length,
    blog: items.filter((i) => i.kind === "blog").length,
    book: items.filter((i) => i.kind === "book").length,
    download: items.filter((i) => i.kind === "download").length,
    event: items.filter((i) => i.kind === "event").length,
    print: items.filter((i) => i.kind === "print").length,
    resource: items.filter((i) => i.kind === "resource").length,
  }), [items]);

  const filters = [
    { key: "all" as const, label: "All Curated", count: contentStats.all, icon: "✨" },
    { key: "blog" as const, label: "Strategic Essays", count: contentStats.blog, icon: "📝" },
    { key: "book" as const, label: "Curated Books", count: contentStats.book, icon: "📚" },
    { key: "download" as const, label: "Premium Tools", count: contentStats.download, icon: "🛠️" },
    { key: "event" as const, label: "Master Classes", count: contentStats.event, icon: "🎓" },
    { key: "print" as const, label: "Artisan Prints", count: contentStats.print, icon: "🎨" },
    { key: "resource" as const, label: "Wisdom Resources", count: contentStats.resource, icon: "💎" },
  ];

  // Safe filtering
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

  return (
    <Layout title="Strategic Insights & Resources">
      <Head>
        <title>Atelier of Wisdom | Abraham of London</title>
        <meta name="description" content="Master strategic thinking with curated essays, premium tools, and wisdom resources for leaders building enduring legacies." />
        <meta name="keywords" content="strategy, leadership, legacy, wisdom, resources, tools, essays" />
      </Head>

      <div className="min-h-screen bg-black text-white overflow-hidden">
        {/* Animated Background */}
        <div className="fixed inset-0 -z-10">
          <AnimatedBackground />
        </div>

        {/* Luxury Hero Section */}
        <section className="relative min-h-screen flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black/60" />
          
          <div className="relative z-10 max-w-6xl mx-auto text-center">
            {/* Elegant Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-softGold/30 bg-softGold/10 px-6 py-3 mb-8 backdrop-blur-sm">
              <span className="text-softGold text-sm font-light tracking-widest">WISDOM ATELIER</span>
            </div>

            {/* Masterpiece Heading */}
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-light text-white mb-8 leading-tight">
              Craft Your
              <span className="block bg-gradient-to-r from-softGold via-yellow-200 to-amber-200 bg-clip-text text-transparent">
                Legacy
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Curated strategic wisdom, premium tools, and master resources for visionary leaders 
              building enduring impact across generations.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <button
                onClick={() => document.getElementById("content-gallery")?.scrollIntoView({ behavior: "smooth" })}
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-softGold to-amber-500 px-8 py-4 font-semibold text-black transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/25"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Explore the Collection
                  <ArrowIcon className="transform group-hover:translate-x-1" />
                </span>
              </button>

              <button
                onClick={() => setActiveFilter("download")}
                className="group rounded-full border border-softGold/40 bg-black/40 px-8 py-4 font-semibold text-softGold backdrop-blur-sm transition-all duration-500 hover:bg-softGold/10 hover:border-softGold/60"
              >
                Access Premium Tools
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto">
              {filters.slice(1, 5).map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setActiveFilter(filter.key)}
                  className="group text-left p-4 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-500 hover:scale-105 hover:bg-white/10"
                >
                  <div className="text-2xl mb-2 transform group-hover:scale-110 transition-transform">
                    {filter.icon}
                  </div>
                  <div className="text-lg font-semibold text-white">{filter.count}</div>
                  <div className="text-xs text-gray-400 font-light">{filter.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
            <div className="w-6 h-10 border-2 border-softGold/30 rounded-full flex justify-center">
              <div className="w-1 h-3 bg-softGold/50 rounded-full mt-2 animate-pulse" />
            </div>
          </div>
        </section>

        {/* Featured Masterpieces */}
        {featuredItems.length > 0 && (
          <section className="relative py-20 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="font-serif text-4xl md:text-5xl text-white mb-4">
                  Curated <span className="text-softGold">Masterpieces</span>
                </h2>
                <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                  Hand-selected strategic resources of exceptional quality and impact
                </p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {featuredItems.map((item, index) => (
                  <div
                    key={item.slug}
                    className="transform transition-all duration-700 hover:-translate-y-2"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <ContentCase item={item} variant="featured" />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Main Content Gallery */}
        <section id="content-gallery" className="relative py-20 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Gallery Header */}
            <div className={`sticky top-24 z-20 mb-12 transition-all duration-500 ${isScrolled ? 'bg-black/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl' : ''}`}>
              <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center justify-between">
                {/* Search */}
                <div className="flex-1 max-w-md">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search wisdom, tools, insights..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-6 py-4 text-white placeholder-gray-400 backdrop-blur-sm transition-all duration-300 focus:border-softGold/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-softGold/25"
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-3 justify-center lg:justify-end">
                  {filters.map((filter) => (
                    <button
                      key={filter.key}
                      onClick={() => setActiveFilter(filter.key)}
                      onKeyDown={(e) => handleKeyDown(e, filter.key)}
                      className={`flex items-center gap-3 rounded-full border px-4 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-softGold focus:ring-offset-2 focus:ring-offset-black ${
                        activeFilter === filter.key
                          ? "border-softGold bg-softGold text-black shadow-lg shadow-yellow-500/30"
                          : "border-white/10 bg-white/5 text-gray-300 hover:border-softGold/30 hover:bg-white/10"
                      }`}
                    >
                      <span>{filter.icon}</span>
                      {filter.label}
                      <span className={`rounded-full px-2 py-1 text-xs ${
                        activeFilter === filter.key ? "bg-black/20 text-black" : "bg-white/10 text-gray-400"
                      }`}>
                        {filter.count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Content Display */}
            {filteredItems.length === 0 ? (
              <GlassCard className="text-center p-12">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-2xl font-serif text-white mb-4">No Wisdom Found</h3>
                <p className="text-gray-400 mb-6">
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
                    className="rounded-full bg-softGold px-6 py-3 font-semibold text-black transition-all hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/25"
                  >
                    Show All Wisdom
                  </button>
                )}
              </GlassCard>
            ) : activeFilter === "all" ? (
              // Grouped by kind
              <div className="space-y-20">
                {kindOrder.map((kind) => {
                  const group = groupedByKind[kind];
                  if (!group.length) return null;

                  return (
                    <div key={kind} className="space-y-8">
                      <div className="flex items-center justify-between">
                        <h3 className="font-serif text-3xl text-white flex items-center gap-4">
                          {ContentIcons[kind]}
                          {kindLabels[kind]}
                        </h3>
                        <span className="text-sm text-gray-400 font-light">
                          {group.length} masterpiece{group.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {group.map((item) => (
                          <ContentCase key={item.slug} item={item} variant="elegant" />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Single kind view
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h3 className="font-serif text-3xl text-white flex items-center gap-4">
                    {ContentIcons[activeFilter]}
                    {kindLabels[activeFilter]}
                  </h3>
                  <span className="text-sm text-gray-400">
                    {filteredItems.length} items
                  </span>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredItems.map((item) => (
                    <ContentCase key={item.slug} item={item} variant="elegant" />
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Luxury CTA */}
        <section className="relative py-32 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <GlassCard className="p-12 md:p-16">
              <h2 className="font-serif text-4xl md:text-5xl text-white mb-6">
                Begin Your <span className="text-softGold">Legacy</span> Journey
              </h2>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Join visionary leaders and founders who are transforming their strategic approach 
                to build enduring impact that transcends generations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button className="group relative overflow-hidden rounded-full bg-gradient-to-r from-softGold to-amber-500 px-8 py-4 font-semibold text-black transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-yellow-500/25">
                  <span className="relative z-10">Start Building Today</span>
                </button>
                <button className="group rounded-full border border-softGold/40 bg-transparent px-8 py-4 font-semibold text-softGold transition-all duration-500 hover:bg-softGold/10">
                  <span className="flex items-center gap-2">
                    Book Strategy Session
                    <ArrowIcon />
                  </span>
                </button>
              </div>
            </GlassCard>
          </div>
        </section>
      </div>

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
      `}</style>
    </Layout>
  );
};

export default ContentPage;