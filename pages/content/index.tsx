// pages/content/index.tsx
import type { GetStaticProps, NextPage } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  Search,
  Filter,
  Calendar,
  Clock,
  ArrowRight,
  BookOpen,
  FileText,
  Download,
  Users,
  Star,
  Zap,
  Layers,
  Bookmark,
  TrendingUp,
  Grid,
  List,
  RefreshCw,
  ChevronDown,
} from "lucide-react";

import Layout from "@/components/Layout";

import { getAllPostsMeta } from "@/lib/server/posts-data";
import { getAllDownloadsMeta } from "@/lib/server/downloads-data";
import { getAllBooksMeta } from "@/lib/server/books-data";
import { getAllEvents } from "@/lib/server/events-data";
import { getAllPrintsMeta } from "@/lib/server/prints-data";
import { getAllResourcesMeta } from "@/lib/server/resources-data";

/* -------------------------------------------------------------------------- */
/* TYPE SAFETY & DATA MODELS                                                  */
/* -------------------------------------------------------------------------- */

type ContentKind = "blog" | "book" | "download" | "event" | "print" | "resource";
type FilterKey = ContentKind | "all" | "featured";
type ViewMode = "grid" | "list" | "compact";
type SortBy = "newest" | "title" | "popular" | "trending";

interface RawContentItem {
  slug?: string;
  title?: string;
  date?: string;
  excerpt?: string;
  description?: string;
  category?: string;
  tags?: (string | number)[];
  featured?: boolean;
  readTime?: string | number;
  _raw?: { flattenedPath?: string };
  eventDate?: string;
  fileSize?: string;
  coverImage?: string;
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
  coverImage?: string;
}

interface ContentPageProps {
  items: ContentResource[];
  featuredItems: ContentResource[];
  trendingItems: ContentResource[];
  popularTags: Array<{ name: string; count: number }>;
  contentStats: {
    total: number;
    blog: number;
    book: number;
    download: number;
    event: number;
    print: number;
    resource: number;
    featured: number;
  };
}

/* -------------------------------------------------------------------------- */
/* ICON SYSTEM                                                                */
/* -------------------------------------------------------------------------- */

const ContentIcons: Record<ContentKind, React.ReactElement> = {
  blog: <FileText className="h-4 w-4" />,
  book: <BookOpen className="h-4 w-4" />,
  download: <Download className="h-4 w-4" />,
  event: <Users className="h-4 w-4" />,
  print: <span className="text-xs">🖼</span>,
  resource: <Zap className="h-4 w-4" />,
};

const IconBadge: React.FC<{
  icon: React.ReactNode;
  kind: ContentKind;
  className?: string;
}> = ({ icon, kind, className = "" }) => {
  const getKindGradient = (k: ContentKind): string => {
    const gradients: Record<ContentKind, string> = {
      blog: "from-emerald-500/30 to-emerald-600/30",
      book: "from-violet-500/30 to-violet-600/30",
      download: "from-amber-500/30 to-amber-600/30",
      event: "from-rose-500/30 to-rose-600/30",
      print: "from-cyan-500/30 to-cyan-600/30",
      resource: "from-indigo-500/30 to-indigo-600/30",
    };
    return gradients[k];
  };

  return (
    <div
      className={`rounded-xl bg-gradient-to-br ${getKindGradient(
        kind
      )} p-2.5 ${className}`}
    >
      {icon}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* AESTHETIC SYSTEM                                                           */
/* -------------------------------------------------------------------------- */

const kindOrder: ContentKind[] = [
  "blog",
  "book",
  "download",
  "event",
  "print",
  "resource",
];

const kindLabels: Record<ContentKind, string> = {
  blog: "Strategic Essays",
  book: "Curated Volumes",
  download: "Execution Tools",
  event: "Live Sessions",
  print: "Print Editions",
  resource: "Core Resources",
} as const;

const getKindHighlight = (kind: ContentKind): string => {
  const highlights: Record<ContentKind, string> = {
    blog: "text-emerald-300 border-emerald-400/30 bg-emerald-500/10",
    book: "text-violet-300 border-violet-400/30 bg-violet-500/10",
    download: "text-amber-300 border-amber-400/30 bg-amber-500/10",
    event: "text-rose-300 border-rose-400/30 bg-rose-500/10",
    print: "text-cyan-300 border-cyan-400/30 bg-cyan-500/10",
    resource: "text-indigo-300 border-indigo-400/30 bg-indigo-500/10",
  };
  return highlights[kind];
};

/* -------------------------------------------------------------------------- */
/* PREMIUM UI COMPONENTS                                                      */
/* -------------------------------------------------------------------------- */

const GlassPanel: React.FC<{
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}> = ({ children, className = "", hover = true, glow = false }) => (
  <div
    className={`
    relative overflow-hidden rounded-2xl 
    bg-white/[0.08] backdrop-blur-xl
    border border-white/10
    shadow-2xl shadow-black/40
    ${
      hover
        ? "transition-all duration-700 hover:scale-[1.02] hover:shadow-3xl hover:shadow-black/60 hover:border-white/20"
        : ""
    }
    ${
      glow
        ? "after:pointer-events-none after:absolute after:inset-0 after:bg-gradient-to-br after:from-amber-500/5 after:via-transparent after:to-amber-500/5"
        : ""
    }
    ${className}
  `}
  >
    <div className="relative z-10 h-full">{children}</div>
  </div>
);

const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({
  value,
  duration = 1500,
}) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    if (value <= 0) {
      setCount(0);
      return;
    }
    let start = 0;
    const end = value;
    const incrementTime = Math.max(10, duration / end);

    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span className="tabular-nums">{count}</span>;
};

const StatBadge: React.FC<{
  icon: React.ReactNode;
  value: number;
  label: string;
  trend?: number;
}> = ({ icon, value, label, trend }) => (
  <GlassPanel className="p-5">
    <div className="relative">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 p-2.5">
          <div className="text-xl text-amber-400">{icon}</div>
        </div>
        {typeof trend === "number" && (
          <div
            className={`rounded-full px-2 py-1 text-xs font-bold ${
              trend > 0
                ? "bg-emerald-500/20 text-emerald-400"
                : "bg-rose-500/20 text-rose-400"
            }`}
          >
            {trend > 0 ? "↗" : "↘"} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-white">
        <AnimatedCounter value={value} />
      </div>
      <div className="mt-1 text-sm font-medium text-gray-400">{label}</div>
    </div>
  </GlassPanel>
);

const FilterPill: React.FC<{
  label: string;
  value: FilterKey;
  active: boolean;
  count: number;
  icon?: React.ReactNode;
  onClick: () => void;
  badge?: string;
}> = ({ label, active, count, icon, onClick, badge }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group relative flex items-center gap-3 rounded-2xl px-5 py-3.5 transition-all duration-500
        ${
          active
            ? "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 shadow-2xl shadow-amber-500/40 text-white"
            : "bg-white/[0.08] text-gray-300 hover:bg-white/[0.12] hover:text-white"
        }
        border ${
          active
            ? "border-amber-500/50"
            : "border-white/10 hover:border-white/20"
        }
        transform-gpu hover:scale-[1.03] active:scale-95
      `}
    >
      <div className="relative flex items-center gap-3">
        {icon && (
          <div
            className={`transition-transform duration-300 ${
              active ? "scale-110" : "group-hover:scale-110"
            }`}
          >
            {icon}
          </div>
        )}
        <div className="flex flex-col items-start">
          <span className="text-sm font-semibold">{label}</span>
          {badge && (
            <span className="mt-1 rounded-full bg-gradient-to-r from-violet-500/30 to-violet-600/30 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-violet-300">
              {badge}
            </span>
          )}
        </div>
      </div>
      <div
        className={`
        ml-auto rounded-full px-3 py-1 text-sm font-bold min-w-[36px] text-center
        ${
          active
            ? "bg-white/30"
            : "bg-black/40 text-gray-400 group-hover:text-gray-300"
        }
      `}
      >
        {count}
      </div>
    </button>
  );
};

/* -------------------------------------------------------------------------- */
/* CONTENT CARDS                                                              */
/* -------------------------------------------------------------------------- */

const ContentCard: React.FC<{
  item: ContentResource;
  variant?: "featured" | "grid" | "list" | "compact";
}> = ({ item, variant = "grid" }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isBookmarked, setIsBookmarked] = React.useState(false);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays <= 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (variant === "featured") {
    return (
      <Link href={item.href} className="group block h-full">
        <GlassPanel glow className="h-full">
          <div className="flex h-full flex-col p-6">
            <div className="mb-6 flex items-start justify-between">
              <IconBadge icon={ContentIcons[item.kind]} kind={item.kind} />
              <div className="space-y-2 text-right">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm ${getKindHighlight(
                    item.kind
                  )}`}
                >
                  {kindLabels[item.kind]}
                </span>
                {item.date && (
                  <time className="block text-xs font-light text-gray-400">
                    {formatDate(item.date)}
                  </time>
                )}
              </div>
            </div>

            <h3 className="mb-4 font-serif text-2xl leading-tight text-white transition-colors duration-500 group-hover:text-amber-100">
              {item.title}
            </h3>

            {(item.description || item.excerpt) && (
              <p className="mb-6 flex-grow leading-relaxed text-gray-300 line-clamp-3">
                {item.description || item.excerpt}
              </p>
            )}

            <div className="mt-auto border-t border-white/10 pt-6">
              <div className="flex items-center justify-between text-sm font-semibold text-amber-400">
                <span>Explore {kindLabels[item.kind]}</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-2" />
              </div>
            </div>
          </div>
        </GlassPanel>
      </Link>
    );
  }

  if (variant === "list") {
    return (
      <Link href={item.href} className="group block">
        <GlassPanel className="p-6">
          <div className="flex items-start gap-6">
            <IconBadge icon={ContentIcons[item.kind]} kind={item.kind} />
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-3">
                <h4 className="text-lg font-semibold text-white transition-colors group-hover:text-amber-300">
                  {item.title}
                </h4>
                {item.featured && (
                  <span className="rounded-full bg-gradient-to-r from-amber-500/30 to-amber-600/30 px-2 py-0.5 text-xs font-bold text-amber-300">
                    Featured
                  </span>
                )}
              </div>

              {(item.description || item.excerpt) && (
                <p className="mb-4 line-clamp-2 text-sm text-gray-400">
                  {item.description || item.excerpt}
                </p>
              )}

              <div className="flex items-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(item.date)}</span>
                </div>
                {item.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    {item.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full bg-white/5 px-2 py-0.5 text-xs font-medium text-gray-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setIsBookmarked((prev) => !prev);
                }}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-white/5 hover:text-amber-400"
              >
                <Bookmark
                  className={`h-5 w-5 ${
                    isBookmarked ? "fill-amber-400 text-amber-400" : ""
                  }`}
                />
              </button>
              <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-amber-400" />
            </div>
          </div>
        </GlassPanel>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link href={item.href} className="group block">
        <GlassPanel className="p-4">
          <div className="flex items-center gap-4">
            <IconBadge
              icon={ContentIcons[item.kind]}
              kind={item.kind}
              className="p-2"
            />
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-semibold text-white transition-colors group-hover:text-amber-300">
                {item.title}
              </h4>
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                <span>{formatDate(item.date)}</span>
                {item.tags.length > 0 && (
                  <>
                    <span>•</span>
                    <span className="truncate">{item.tags[0]}</span>
                  </>
                )}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-amber-400" />
          </div>
        </GlassPanel>
      </Link>
    );
  }

  // Grid variant (default)
  return (
    <Link
      href={item.href}
      className="group block h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <GlassPanel className="h-full">
        <div className="flex h-full flex-col p-5">
          <div className="mb-4 flex items-start justify-between">
            <IconBadge icon={ContentIcons[item.kind]} kind={item.kind} />
            <div className="flex flex-col items-end gap-1">
              {item.featured && (
                <span className="rounded-full bg-gradient-to-r from-amber-500/30 to-amber-600/30 px-2 py-0.5 text-xs font-bold text-amber-300">
                  Featured
                </span>
              )}
              {item.date && (
                <time className="text-xs font-light text-gray-400">
                  {formatDate(item.date)}
                </time>
              )}
            </div>
          </div>

          <div className="mb-4 flex-1">
            <div className="mb-3">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-sm ${getKindHighlight(
                  item.kind
                )}`}
              >
                {kindLabels[item.kind]}
              </span>
            </div>

            <h3 className="mb-3 line-clamp-2 font-serif text-lg font-semibold leading-tight text-white transition-colors duration-500 group-hover:text-amber-100">
              {item.title}
            </h3>

            {(item.description || item.excerpt) && (
              <p className="text-sm leading-relaxed text-gray-300 line-clamp-3">
                {item.description || item.excerpt}
              </p>
            )}
          </div>

          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {item.readTime && (
                  <span className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Clock className="h-3.5 w-3.5" />
                    {typeof item.readTime === "number"
                      ? `${item.readTime} min`
                      : item.readTime}
                  </span>
                )}
                {item.tags.length > 0 && (
                  <span className="border-l border-white/20 pl-3 text-xs font-light text-gray-400">
                    {item.tags[0]}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-amber-400 transition-colors group-hover:text-amber-300">
                <span>Open</span>
                <ArrowRight
                  className={`h-4 w-4 transition-transform duration-300 ${
                    isHovered ? "translate-x-1" : ""
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </GlassPanel>
    </Link>
  );
};

/* -------------------------------------------------------------------------- */
/* BACKGROUND & HERO                                                          */
/* -------------------------------------------------------------------------- */

const CosmicBackground: React.FC = () => {
  return (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-[#050608] via-[#050814] to-[#020617]" />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-purple-500/8 blur-3xl" />
        <div className="absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-cyan-500/8 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 h-64 w-64 rounded-full bg-amber-500/8 blur-3xl" />
      </div>

      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]" />
    </>
  );
};

/* -------------------------------------------------------------------------- */
/* DATA HELPERS                                                               */
/* -------------------------------------------------------------------------- */

const safeGetData = async (
  dataFetcher:
    | (() => Promise<RawContentItem[] | undefined> | RawContentItem[] | undefined)
    | undefined,
  dataName: string
): Promise<RawContentItem[]> => {
  try {
    if (!dataFetcher || typeof dataFetcher !== "function") {
      // eslint-disable-next-line no-console
      console.warn(`[content] ${dataName} fetcher unavailable`);
      return [];
    }
    const result = await dataFetcher();
    if (Array.isArray(result)) return result as RawContentItem[];
    // eslint-disable-next-line no-console
    console.warn(`[content] ${dataName} returned non-array, skipping`);
    return [];
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[content] Error fetching ${dataName}:`, error);
    return [];
  }
};

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
    // eslint-disable-next-line no-console
    console.error("[getSlug] Error processing slug:", error);
    return undefined;
  }
};

const getHref = (kind: ContentKind, slug: string): string => {
  // essays live at /[slug]
  if (kind === "blog") return `/${slug}`;
  return `/${kind}s/${slug}`;
};

const processContentItems = (
  items: RawContentItem[],
  kind: ContentKind,
  defaultCategory?: string
): ContentResource[] => {
  const processed: ContentResource[] = [];

  items.forEach((item) => {
    try {
      const slug = getSlug(item);
      const title = item.title || "Untitled";

      if (!slug) {
        // eslint-disable-next-line no-console
        console.warn(
          `[processContentItems] Skipping item with no slug: ${title}`
        );
        return;
      }

      const tags = Array.isArray(item.tags)
        ? item.tags.map((tag) => String(tag))
        : [];

      processed.push({
        kind,
        title,
        slug,
        href: getHref(kind, slug),
        date: item.date || item.eventDate,
        excerpt: item.excerpt,
        description: item.description,
        category: item.category || defaultCategory,
        tags,
        featured: Boolean(item.featured),
        readTime: item.readTime,
        coverImage: item.coverImage,
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("[processContentItems] Error processing item:", error);
    }
  });

  return processed;
};

/* -------------------------------------------------------------------------- */
/* SPECIAL SECTIONS                                                           */
/* -------------------------------------------------------------------------- */

const FeaturedSpotlight: React.FC<{ items: ContentResource[] }> = ({
  items,
}) => {
  const featuredItems = items.filter((item) => item.featured).slice(0, 4);

  if (featuredItems.length === 0) return null;

  return (
    <section className="relative px-4 py-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-3 rounded-full border border-amber-200/30 bg-amber-500/10 px-4 py-2">
            <Star className="h-4 w-4 text-amber-300" fill="currentColor" />
            <span className="text-sm font-semibold text-amber-300">
              Editor&apos;s Selection
            </span>
          </div>
          <h2 className="mt-6 font-serif text-4xl font-bold text-white">
            Start Here
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-300">
            A curated selection of essential pieces worth starting with if
            you&apos;re new to the library.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-4">
          {featuredItems.map((item, index) => (
            <div
              key={item.slug}
              className="transform transition-all duration-1000 hover:-translate-y-2"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <ContentCard item={item} variant="featured" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TrendingCarousel: React.FC<{ items: ContentResource[] }> = ({
  items,
}) => {
  const trendingItems = items.slice(0, 5);
  if (trendingItems.length === 0) return null;

  return (
    <section className="px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 p-3">
              <TrendingUp className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h2 className="font-serif text-2xl font-bold text-white">
                Trending Now
              </h2>
              <p className="text-sm text-amber-200/80">
                What leaders are engaging with right now
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          {trendingItems.map((item) => (
            <div
              key={item.slug}
              className="transform transition-all duration-500 hover:-translate-y-2"
            >
              <ContentCard item={item} variant="compact" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const TagCloud: React.FC<{
  tags: Array<{ name: string; count: number }>;
  selectedTags: string[];
  onTagClick: (tag: string) => void;
}> = ({ tags, selectedTags, onTagClick }) => {
  if (!tags.length) return null;

  const maxCount = Math.max(...tags.map((t) => t.count));

  return (
    <GlassPanel className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-white">Popular Tags</h3>
        <button
          type="button"
          onClick={() => onTagClick("")}
          className="text-xs text-gray-400 transition-colors hover:text-white"
        >
          Clear all
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const size = Math.max(0.75, tag.count / maxCount);
          const isSelected = selectedTags.includes(tag.name);

          return (
            <button
              key={tag.name}
              type="button"
              onClick={() => onTagClick(tag.name)}
              className={`
                rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-300
                ${
                  isSelected
                    ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25"
                    : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white"
                }
                transform hover:scale-105
              `}
              style={{
                fontSize: `${0.875 + size * 0.25}rem`,
                opacity: isSelected ? 1 : 0.7 + size * 0.3,
              }}
            >
              {tag.name}{" "}
              <span className="text-xs opacity-70">({tag.count})</span>
            </button>
          );
        })}
      </div>
    </GlassPanel>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN PAGE COMPONENT                                                        */
/* -------------------------------------------------------------------------- */

const ContentPage: NextPage<ContentPageProps> = ({
  items,
  featuredItems,
  trendingItems,
  popularTags,
  contentStats,
}) => {
  const [activeFilter, setActiveFilter] = React.useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortBy>("newest");
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [debouncedQuery, setDebouncedQuery] = React.useState("");
  const [mounted, setMounted] = React.useState(false);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const filterOptions: Array<{
    key: FilterKey;
    label: string;
    icon: React.ReactNode;
    badge?: string;
    count: number;
  }> = [
    {
      key: "all",
      label: "All Content",
      icon: <Layers className="h-4 w-4" />,
      count: contentStats.total,
    },
    {
      key: "featured",
      label: "Featured",
      icon: <Star className="h-4 w-4" />,
      badge: "CURATED",
      count: contentStats.featured,
    },
    {
      key: "blog",
      label: kindLabels.blog,
      icon: ContentIcons.blog,
      count: contentStats.blog,
    },
    {
      key: "book",
      label: kindLabels.book,
      icon: ContentIcons.book,
      count: contentStats.book,
    },
    {
      key: "download",
      label: kindLabels.download,
      icon: ContentIcons.download,
      count: contentStats.download,
    },
    {
      key: "event",
      label: kindLabels.event,
      icon: ContentIcons.event,
      count: contentStats.event,
    },
    {
      key: "print",
      label: kindLabels.print,
      icon: ContentIcons.print,
      count: contentStats.print,
    },
    {
      key: "resource",
      label: kindLabels.resource,
      icon: ContentIcons.resource,
      count: contentStats.resource,
    },
  ];

  const filteredItems = React.useMemo(() => {
    let result = items;

    if (activeFilter !== "all") {
      if (activeFilter === "featured") {
        result = result.filter((item) => item.featured);
      } else {
        result = result.filter((item) => item.kind === activeFilter);
      }
    }

    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.excerpt?.toLowerCase().includes(q) ||
          item.description?.toLowerCase().includes(q) ||
          item.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    if (selectedTags.length > 0) {
      result = result.filter((item) =>
        selectedTags.some((tag) => item.tags.includes(tag))
      );
    }

    if (sortBy === "newest") {
      result = [...result].sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateB - dateA;
      });
    } else if (sortBy === "title") {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "popular") {
      result = [...result].sort((a, b) => {
        const aScore = (a.featured ? 100 : 0) + a.tags.length * 10;
        const bScore = (b.featured ? 100 : 0) + b.tags.length * 10;
        return bScore - aScore;
      });
    } else if (sortBy === "trending") {
      const trendingSlugs = trendingItems.map((item) => item.slug);
      result = [...result].filter((item) =>
        trendingSlugs.includes(item.slug)
      );
    }

    return result;
  }, [items, activeFilter, debouncedQuery, selectedTags, sortBy, trendingItems]);

  const groupedByKind = React.useMemo(() => {
    const initial: Record<ContentKind, ContentResource[]> = {
      blog: [],
      book: [],
      download: [],
      event: [],
      print: [],
      resource: [],
    };
    filteredItems.forEach((item) => initial[item.kind].push(item));
    return initial;
  }, [filteredItems]);

  const handleTagClick = (tag: string) => {
    if (!tag) {
      setSelectedTags([]);
      return;
    }
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const scrollToGallery = () => {
    if (typeof window === "undefined") return;
    const target = document.getElementById("gallery");
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const resetFilters = () => {
    setActiveFilter("all");
    setSearchQuery("");
    setSelectedTags([]);
    setSortBy("newest");
  };

  if (!mounted) {
    return (
      <Layout title="Content Library">
        <div className="flex min-h-screen items-center justify-center bg-black">
          <div className="text-lg text-amber-400">Loading library...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Content Library"
      description="A comprehensive library of essays, books, tools, and resources for builders of legacy."
      structuredData={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Abraham of London — Content Library",
        description:
          "Curated collection of writings, tools, and resources for builders of legacy",
        numberOfItems: contentStats.total,
      }}
    >
      <Head>
        <title>Content Library | Abraham of London</title>
        <meta
          name="description"
          content="A curated library of essays, volumes, tools, sessions, prints, and resources for leaders building enduring work and legacy."
        />
        <meta
          name="keywords"
          content="strategy, leadership, legacy, wisdom, resources, essays, tools, Abraham of London"
        />
      </Head>

      <div className="relative min-h-screen overflow-hidden bg-black text-white">
        <div className="fixed inset-0 -z-10">
          <CosmicBackground />
        </div>

        {/* Hero */}
        <section className="relative flex min-h-[70vh] items-center justify-center px-4 pt-20">
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-black/85" />

          <div className="relative z-10 mx-auto max-w-6xl text-center">
            <div className="mb-10 inline-flex items-center gap-3 rounded-full border border-amber-500/30 bg-amber-500/10 px-8 py-3 backdrop-blur-2xl">
              <Star className="h-4 w-4 text-amber-300" fill="currentColor" />
              <span className="text-sm font-medium tracking-[0.2em] text-amber-300">
                THE COMPLETE LIBRARY
              </span>
              <Star className="h-4 w-4 text-amber-300" fill="currentColor" />
            </div>

            <h1 className="mb-6 font-serif text-5xl font-light leading-tight text-white md:text-6xl lg:text-7xl">
              The Content Library
              <span className="block bg-gradient-to-r from-amber-300 via-amber-200 to-amber-100 bg-clip-text text-transparent">
                Every resource in one place
              </span>
            </h1>

            <p className="mx-auto mb-14 max-w-3xl text-lg font-light leading-relaxed text-gray-300 md:text-xl">
              Essays, frameworks, tools, and resources designed to help you
              think clearly, act decisively, and build work that endures across
              generations.
            </p>

            <div className="mx-auto mb-16 grid max-w-4xl grid-cols-2 gap-6 md:grid-cols-4">
              <StatBadge
                icon="📚"
                value={contentStats.total}
                label="Total Items"
                trend={12.5}
              />
              <StatBadge
                icon="⭐"
                value={contentStats.featured}
                label="Featured"
                trend={8.3}
              />
              <StatBadge
                icon="✒"
                value={contentStats.blog}
                label="Essays"
                trend={15.2}
              />
              <StatBadge
                icon="⚙"
                value={contentStats.download}
                label="Tools"
                trend={25.7}
              />
            </div>

            <div className="flex flex-col items-center justify-center gap-5 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={scrollToGallery}
                className="group relative overflow-hidden rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-12 py-4 text-base font-semibold text-white transition-all duration-700 hover:scale-[1.04] hover:shadow-2xl hover:shadow-amber-500/30"
              >
                <span className="relative z-10 flex items-center gap-3">
                  Browse Everything
                  <ArrowRight className="h-4 w-4 transform group-hover:translate-x-2 group-hover:scale-110" />
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveFilter("download");
                  scrollToGallery();
                }}
                className="group rounded-full border-2 border-amber-500/50 bg-black/40 px-12 py-4 text-base font-semibold text-amber-400 backdrop-blur-2xl transition-all duration-700 hover:bg-amber-500/10 hover:border-amber-500/80 hover:scale-[1.03]"
              >
                <span className="flex items-center gap-3">
                  Jump to Tools
                  <span className="text-sm text-amber-200">for execution</span>
                </span>
              </button>
            </div>
          </div>
        </section>

        <FeaturedSpotlight items={featuredItems} />
        <TrendingCarousel items={trendingItems} />

        {/* Main Gallery */}
        <section id="gallery" className="relative px-4 py-20">
          <div className="mx-auto max-w-7xl">
            <GlassPanel className="mb-10 p-8">
              {/* Search */}
              <div className="mb-8">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-5 top-1/2 z-10 h-6 w-6 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search across ${contentStats.total} resources, essays, and tools...`}
                    className="relative w-full rounded-2xl border border-white/20 bg-white/10 pl-14 pr-12 py-4 text-lg text-white placeholder:text-gray-400/70 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Controls */}
              <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1">
                    {(["grid", "list", "compact"] as ViewMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setViewMode(mode)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                          viewMode === mode
                            ? "bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300"
                            : "text-gray-400 hover:text-white"
                        }`}
                      >
                        {mode === "grid" ? (
                          <Grid className="h-4 w-4" />
                        ) : mode === "list" ? (
                          <List className="h-4 w-4" />
                        ) : (
                          "Compact"
                        )}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowAdvanced((prev) => !prev)}
                    className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:text-white"
                  >
                    <Filter className="h-4 w-4" />
                    Advanced
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        showAdvanced ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center gap-4">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortBy)}
                    className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white focus:border-amber-500/50 focus:outline-none"
                  >
                    <option value="newest">Newest First</option>
                    <option value="popular">Most Popular</option>
                    <option value="trending">Trending</option>
                    <option value="title">A to Z</option>
                  </select>

                  <div className="text-sm text-gray-400">
                    <span className="font-semibold text-white">
                      {filteredItems.length}
                    </span>{" "}
                    of{" "}
                    <span className="font-semibold text-white">
                      {contentStats.total}
                    </span>{" "}
                    items
                  </div>
                </div>
              </div>

              {/* Filter pills */}
              <div className="mb-6">
                <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Browse Categories
                </div>
                <div className="flex flex-wrap gap-3">
                  {filterOptions.map((option) => (
                    <FilterPill
                      key={option.key}
                      label={option.label}
                      value={option.key}
                      active={activeFilter === option.key}
                      count={option.count}
                      icon={option.icon}
                      badge={option.badge}
                      onClick={() => setActiveFilter(option.key)}
                    />
                  ))}
                </div>
              </div>

              {/* Advanced filters */}
              {showAdvanced && (
                <div className="mt-8 border-t border-white/10 pt-8">
                  <div className="grid gap-8 md:grid-cols-2">
                    <TagCloud
                      tags={popularTags}
                      selectedTags={selectedTags}
                      onTagClick={handleTagClick}
                    />
                    <div className="space-y-4">
                      <h3 className="font-semibold text-white">Date Range</h3>
                      <div className="space-y-2">
                        {[
                          "Last 7 days",
                          "Last 30 days",
                          "Last 90 days",
                          "Last year",
                        ].map((label) => (
                          <button
                            key={label}
                            type="button"
                            className="w-full rounded-lg bg-white/5 px-4 py-3 text-left text-sm text-gray-400 transition-colors hover:bg-white/10 hover:text-white"
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-6">
                <div className="text-sm text-gray-400">
                  {searchQuery && `Searching for: "${searchQuery}" • `}
                  {activeFilter !== "all" &&
                    `Filtered by: ${
                      filterOptions.find((o) => o.key === activeFilter)?.label
                    } • `}
                  {selectedTags.length > 0 &&
                    `Tags: ${selectedTags.join(", ")}`}
                </div>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-sm font-medium text-gray-400 transition-colors hover:text-amber-300"
                >
                  Clear all filters
                </button>
              </div>
            </GlassPanel>

            {/* Results */}
            {filteredItems.length === 0 ? (
              <GlassPanel className="p-16 text-center" hover={false}>
                <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20">
                  <Search className="h-10 w-10 text-amber-400" />
                </div>
                <h3 className="mb-4 font-serif text-2xl font-bold text-white">
                  No results found
                </h3>
                <p className="mx-auto mb-10 max-w-md text-gray-400">
                  {searchQuery
                    ? `Nothing matched "${searchQuery}". Try a different term or clear the search.`
                    : "There is no content in this category yet. Check back soon."}
                </p>
                {(searchQuery ||
                  activeFilter !== "all" ||
                  selectedTags.length > 0) && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-3 font-semibold text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/25"
                  >
                    Show all content
                  </button>
                )}
              </GlassPanel>
            ) : activeFilter === "all" ? (
              <div className="space-y-20">
                {kindOrder.map((kind) => {
                  const group = groupedByKind[kind];
                  if (!group.length) return null;

                  return (
                    <div key={kind} className="space-y-10">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="flex items-center gap-4 font-serif text-2xl font-bold text-white">
                          <IconBadge icon={ContentIcons[kind]} kind={kind} />
                          {kindLabels[kind]}
                        </h3>
                        <span className="text-sm text-gray-400">
                          {group.length} item
                          {group.length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                        {group.map((item) => (
                          <ContentCard
                            key={`${item.kind}-${item.slug}`}
                            item={item}
                            variant={viewMode}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <div className="mb-10 flex items-center justify-between gap-4">
                  <h3 className="flex items-center gap-4 font-serif text-2xl font-bold text-white">
                    <IconBadge
                      icon={ContentIcons[activeFilter as ContentKind]}
                      kind={activeFilter as ContentKind}
                    />
                    {kindLabels[activeFilter as ContentKind]}
                  </h3>
                  <span className="text-sm text-gray-400">
                    {filteredItems.length} item
                    {filteredItems.length !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                  {filteredItems.map((item) => (
                    <ContentCard
                      key={`${item.kind}-${item.slug}`}
                      item={item}
                      variant={viewMode}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredItems.length > 0 &&
              filteredItems.length < items.length && (
                <div className="mt-12 text-center">
                  <button
                    type="button"
                    className="group rounded-2xl border border-white/10 bg-white/[0.08] px-10 py-4 text-lg font-semibold text-white transition-all hover:border-white/20 hover:bg-white/[0.12]"
                  >
                    <span className="flex items-center gap-3">
                      Load More
                      <RefreshCw className="h-5 w-5 transition-transform group-hover:rotate-180" />
                    </span>
                  </button>
                </div>
              )}

            <GlassPanel className="mt-20 overflow-hidden" glow>
              <div className="p-12">
                <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
                  <div className="max-w-2xl">
                    <h3 className="mb-4 font-serif text-3xl font-bold text-white">
                      Need something specific?
                    </h3>
                    <p className="text-lg text-gray-400">
                      If you&apos;re looking for content on a particular topic
                      or need customized resources for your team or project,
                      let&apos;s discuss how we can help.
                    </p>
                  </div>
                  <Link
                    href="/contact"
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-4 text-lg font-semibold text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/25"
                  >
                    <span className="relative flex items-center gap-3">
                      Request custom resources
                      <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1.5" />
                    </span>
                  </Link>
                </div>
              </div>
            </GlassPanel>
          </div>
        </section>
      </div>
    </Layout>
  );
};

/* -------------------------------------------------------------------------- */
/* STATIC GENERATION                                                          */
/* -------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  // eslint-disable-next-line no-console
  console.log("🌌 [content] Building content library...");

  try {
    const contentFetchers = [
      {
        kind: "blog" as ContentKind,
        data: safeGetData(getAllPostsMeta, "blog posts"),
        category: "Essays",
      },
      {
        kind: "book" as ContentKind,
        data: safeGetData(getAllBooksMeta, "books"),
        category: "Volumes",
      },
      {
        kind: "download" as ContentKind,
        data: safeGetData(getAllDownloadsMeta, "downloads"),
        category: "Tools",
      },
      {
        kind: "event" as ContentKind,
        data: safeGetData(
          () => getAllEvents() as unknown as RawContentItem[],
          "events"
        ),
        category: "Sessions",
      },
      {
        kind: "print" as ContentKind,
        data: safeGetData(
          () => getAllPrintsMeta() as unknown as RawContentItem[],
          "prints"
        ),
        category: "Prints",
      },
      {
        kind: "resource" as ContentKind,
        data: safeGetData(
          () => getAllResourcesMeta() as unknown as RawContentItem[],
          "resources"
        ),
        category: "Resources",
      },
    ];

    const allItems: ContentResource[] = [];

    await Promise.all(
      contentFetchers.map(async ({ kind, data, category }) => {
        try {
          const items = await data;
          const processed = processContentItems(items, kind, category);
          allItems.push(...processed);
          // eslint-disable-next-line no-console
          console.log(`✨ [content] Processed ${processed.length} ${kind}`);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error(`💥 [content] Failed to process ${kind}:`, error);
        }
      })
    );

    const sortedItems = allItems.sort((a, b) => {
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });

    const contentStats = {
      total: sortedItems.length,
      blog: sortedItems.filter((i) => i.kind === "blog").length,
      book: sortedItems.filter((i) => i.kind === "book").length,
      download: sortedItems.filter((i) => i.kind === "download").length,
      event: sortedItems.filter((i) => i.kind === "event").length,
      print: sortedItems.filter((i) => i.kind === "print").length,
      resource: sortedItems.filter((i) => i.kind === "resource").length,
      featured: sortedItems.filter((i) => i.featured).length,
    };

    const featuredItems = sortedItems.filter((i) => i.featured).slice(0, 4);

    const trendingItems = sortedItems
      .filter((item) => item.featured || Math.random() > 0.7)
      .slice(0, 8);

    const tagCounts: Record<string, number> = {};
    sortedItems.forEach((item) => {
      item.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const popularTags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // eslint-disable-next-line no-console
    console.log("[content] Build completed:", {
      total: sortedItems.length,
      featured: featuredItems.length,
      trending: trendingItems.length,
      tags: popularTags.length,
    });

    return {
      props: {
        items: JSON.parse(JSON.stringify(sortedItems)),
        featuredItems: JSON.parse(JSON.stringify(featuredItems)),
        trendingItems: JSON.parse(JSON.stringify(trendingItems)),
        popularTags,
        contentStats,
      },
      revalidate: 3600,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("💢 [content] Critical build error:", error);
    return {
      props: {
        items: [],
        featuredItems: [],
        trendingItems: [],
        popularTags: [],
        contentStats: {
          total: 0,
          blog: 0,
          book: 0,
          download: 0,
          event: 0,
          print: 0,
          resource: 0,
          featured: 0,
        },
      },
      revalidate: 3600,
    };
  }
};

export default ContentPage;