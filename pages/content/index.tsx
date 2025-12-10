// pages/content/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Calendar,
  ArrowRight,
  FileText,
  Download,
  Star,
  Layers,
  BookOpen,
  Lock,
  Eye,
  Sparkles,
  Wrench,
  FolderTree,
  Grid3x3,
  List,
  Award,
  Clock,
} from "lucide-react";

import Layout from "@/components/Layout";
import SilentSurface from "@/components/ui/SilentSurface";
import {
  getAllUnifiedContent,
  getContentStats,
  getContentUrl,
  formatReadTime,
  getYearFromDate,
  type UnifiedContent,
  type ContentType,
} from "@/lib/unified-content";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

type ContentKind = Exclude<ContentType, "page">;

type FilterKey = ContentKind | "all" | "featured";
type ViewMode = "grid" | "list";
type CategoryMode = "type" | "year" | "featured";

interface ContentResource {
  // Core
  id: string;
  kind: ContentKind;
  slug: string;
  title: string;
  href: string;

  // Metadata
  date: string | null;
  year: string;
  description: string | null;
  excerpt: string | null;
  subtitle: string | null;
  category: string | null;
  tags: string[];
  featured: boolean;
  readTime: string | null;
  coverImage: string | null;
  author: string | null;

  // Type-specific
  resourceType: string | null;
  applications: string[] | null;
  volumeNumber: number | null;
  order: number | null;
  eventDate: string | null;
  location: string | null;
  downloadFile: string | null;
  fileSize: string | null;
  isbn: string | null;
  format: string | null;
  publisher: string | null;
  pages: number | null;

  // Access
  accessLevel: "public" | "inner-circle" | "private" | null;
  lockMessage: string | null;
}

interface ContentPageProps {
  items: ContentResource[];
  contentStats: {
    total: number;
    essay: number;
    book: number;
    download: number;
    event: number;
    print: number;
    resource: number;
    canon: number;
    strategy: number;
    featured: number;
    withImages: number;
  };
  categories: {
    type: Record<ContentKind, ContentResource[]>;
    year: Record<string, ContentResource[]>;
    featured: ContentResource[];
  };
}

/* -------------------------------------------------------------------------- */
/* UTIL: MAP UNIFIED CONTENT TO RESOURCE                                     */
/* -------------------------------------------------------------------------- */

const mapUnifiedToResource = (
  entry: UnifiedContent
): ContentResource | null => {
  if (entry.type === "page") return null;

  const kind = entry.type as ContentKind;

  const href = getContentUrl(entry.type, entry.slug);
  const formattedReadTime = formatReadTime(entry.readTime);
  const year = getYearFromDate(entry.date);

  const authorName =
    typeof entry.author === "string"
      ? entry.author
      : entry.author && typeof entry.author === "object"
      ? ((entry.author as any).name as string)
      : null;

  return {
    id: entry.id || `${kind}-${entry.slug}`,
    kind,
    slug: entry.slug,
    title: entry.title,
    href,
    date: entry.date ?? null,
    year,
    description: entry.description ?? null,
    excerpt: entry.excerpt ?? null,
    subtitle: entry.subtitle ?? null,
    category: entry.category ?? null,
    tags: entry.tags ?? [],
    featured: Boolean(entry.featured),
    readTime: formattedReadTime ?? null,
    coverImage: entry.coverImage ?? null,
    author: authorName,
    resourceType: entry.resourceType ?? null,
    applications: entry.applications ?? null,
    volumeNumber:
      typeof entry.volumeNumber === "number" ? entry.volumeNumber : null,
    order: typeof entry.order === "number" ? entry.order : null,
    eventDate: entry.eventDate ?? null,
    location: entry.location ?? null,
    downloadFile: entry.downloadFile ?? null,
    fileSize: entry.fileSize ?? null,
    isbn: entry.isbn ?? null,
    format: entry.format ?? null,
    publisher: entry.publisher ?? null,
    pages: typeof entry.pages === "number" ? entry.pages : null,
    accessLevel: (entry.accessLevel as
      | "public"
      | "inner-circle"
      | "private"
      | null) ?? null,
    lockMessage: entry.lockMessage ?? null,
  };
};

/* -------------------------------------------------------------------------- */
/* UTIL: ORGANISE BY TYPE & YEAR                                             */
/* -------------------------------------------------------------------------- */

const organizeByCategories = (items: ContentResource[]) => {
  const allKinds: ContentKind[] = [
    "essay",
    "book",
    "download",
    "event",
    "print",
    "resource",
    "canon",
    "strategy",
  ];

  const byType: Record<ContentKind, ContentResource[]> =
    {} as Record<ContentKind, ContentResource[]>;
  const byYear: Record<string, ContentResource[]> = {};
  const featured: ContentResource[] = [];

  allKinds.forEach((kind) => {
    byType[kind] = [];
  });

  items.forEach((item) => {
    byType[item.kind].push(item);

    const year = item.year || "Undated";
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(item);

    if (item.featured) featured.push(item);
  });

  return { byType, byYear, featured };
};

/* -------------------------------------------------------------------------- */
/* getStaticProps                                                            */
/* -------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  try {
    const unifiedContent = await getAllUnifiedContent();

    let externalStats:
      | (ContentPageProps["contentStats"] & { total: number })
      | null = null;

    try {
      externalStats = (await getContentStats()) as any;
    } catch {
      externalStats = null;
    }

    const allItems = unifiedContent
      .map(mapUnifiedToResource)
      .filter((item): item is ContentResource => item !== null);

    const categories = organizeByCategories(allItems);

    const contentStats: ContentPageProps["contentStats"] = {
      total: externalStats?.total ?? allItems.length,
      essay: categories.byType.essay.length,
      book: categories.byType.book.length,
      download: categories.byType.download.length,
      event: categories.byType.event.length,
      print: categories.byType.print.length,
      resource: categories.byType.resource.length,
      canon: categories.byType.canon.length,
      strategy: categories.byType.strategy.length,
      featured: categories.featured.length,
      withImages: allItems.filter((i) => i.coverImage !== null).length,
    };

    return {
      props: {
        items: allItems,
        contentStats,
        categories: {
          type: categories.byType,
          year: categories.byYear,
          featured: categories.featured,
        },
      },
    };
  } catch (err) {
    console.error("Error in getStaticProps for /content:", err);

    const emptyByType: Record<ContentKind, ContentResource[]> = {
      essay: [],
      book: [],
      download: [],
      event: [],
      print: [],
      resource: [],
      canon: [],
      strategy: [],
    };

    return {
      props: {
        items: [],
        contentStats: {
          total: 0,
          essay: 0,
          book: 0,
          download: 0,
          event: 0,
          print: 0,
          resource: 0,
          canon: 0,
          strategy: 0,
          featured: 0,
          withImages: 0,
        },
        categories: {
          type: emptyByType,
          year: {},
          featured: [],
        },
      },
    };
  }
};

/* -------------------------------------------------------------------------- */
/* PRESENTATION COMPONENTS                                                   */
/* -------------------------------------------------------------------------- */

const StatItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  description?: string;
  color?: string;
}> = ({ icon, label, value, description, color = "#D4AF37" }) => (
  <SilentSurface className="p-4 transition-all duration-300 hover:scale-[1.02]">
    <div className="flex items-center gap-3">
      <div
        className="rounded-sm border border-white/10 bg-white/5 p-2"
        style={{ borderColor: `${color}33` }}
      >
        {icon}
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span
            className="font-serif text-2xl font-normal"
            style={{ color }}
          >
            {value.toLocaleString()}
          </span>
          <span className="text-xs uppercase tracking-[0.1em] text-white/40">
            {label}
          </span>
        </div>
        {description && (
          <p className="mt-1 text-xs text-white/50">{description}</p>
        )}
      </div>
    </div>
  </SilentSurface>
);

const ContentTypeBadge: React.FC<{
  kind: ContentKind;
  resourceType?: string | null;
  variant?: "default" | "compact";
}> = ({ kind, resourceType = "Framework", variant = "default" }) => {
  const config: Record<
    ContentKind,
    { label: string; icon: React.ReactNode; className: string }
  > = {
    essay: {
      label: "Essay",
      icon: <FileText className="h-3 w-3" />,
      className: "bg-[#26619C]/10 text-[#26619C] border-[#26619C]/30",
    },
    book: {
      label: "Volume",
      icon: <BookOpen className="h-3 w-3" />,
      className: "bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/30",
    },
    download: {
      label: "Tool",
      icon: <Download className="h-3 w-3" />,
      className: "bg-[#CD7F32]/10 text-[#CD7F32] border-[#CD7F32]/30",
    },
    event: {
      label: "Session",
      icon: <Calendar className="h-3 w-3" />,
      className: "bg-gray-400/10 text-gray-300 border-gray-400/30",
    },
    print: {
      label: "Edition",
      icon: <Eye className="h-3 w-3" />,
      className: "bg-[#FFFFF0]/10 text-[#FFFFF0] border-[#FFFFF0]/30",
    },
    resource: {
      label: resourceType || "Resource",
      icon: <Wrench className="h-3 w-3" />,
      className: "bg-[#F5F1E8]/10 text-[#F5F1E8] border-[#F5F1E8]/30",
    },
    canon: {
      label: "Canon",
      icon: <Lock className="h-3 w-3" />,
      className:
        "bg-gradient-to-r from-[#D4AF37]/20 to-[#CD7F32]/20 text-[#D4AF37] border-[#D4AF37]/40",
    },
    strategy: {
      label: "Strategy",
      icon: <Award className="h-3 w-3" />,
      className: "bg-[#2E8B57]/10 text-[#2E8B57] border-[#2E8B57]/30",
    },
  };

  const { label, icon, className } = config[kind];

  if (variant === "compact") {
    return (
      <div
        className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] ${className}`}
      >
        {icon}
      </div>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 text-[11px] ${className}`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </div>
  );
};

const UnifiedContentCard: React.FC<{
  item: ContentResource;
  variant?: "grid" | "list" | "category";
}> = ({ item, variant = "grid" }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);

  const showApplications =
    item.kind === "resource" &&
    item.applications &&
    item.applications.length > 0;

  if (variant === "list") {
    return (
      <Link
        href={item.href}
        className="group block"
        aria-label={`View ${item.title}`}
      >
        <SilentSurface className="p-3" hover>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <ContentTypeBadge
                kind={item.kind}
                resourceType={item.resourceType}
                variant="compact"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="truncate font-serif text-sm font-light text-[#F5F1E8]">
                  {item.title}
                </h4>
                {item.featured && (
                  <Sparkles className="h-3 w-3 flex-shrink-0 text-[#D4AF37]" />
                )}
                {item.accessLevel === "inner-circle" && (
                  <Lock className="h-3 w-3 flex-shrink-0 text-[#CD7F32]" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40">
                {item.date && (
                  <time>
                    {new Date(item.date).toLocaleDateString("en-GB", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                )}
                {item.readTime && (
                  <>
                    <span>•</span>
                    <span>{item.readTime}</span>
                  </>
                )}
              </div>
            </div>
            <ArrowRight className="h-3 w-3 flex-shrink-0 text-white/30 transition-transform group-hover:translate-x-1" />
          </div>
        </SilentSurface>
      </Link>
    );
  }

  if (variant === "category") {
    return (
      <Link
        href={item.href}
        className="group block h-full"
        aria-label={`View ${item.title}`}
      >
        <SilentSurface className="h-full p-4" hover>
          {item.coverImage && !imageError ? (
            <div className="relative mb-3 aspect-[16/9] overflow-hidden rounded-sm">
              <Image
                src={item.coverImage}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
                onError={() => setImageError(true)}
                priority={item.featured}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="mb-3 flex aspect-[16/9] items-center justify-center rounded-sm bg-gradient-to-br from-charcoal to-softBlack">
              <div className="text-center">
                <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/5">
                  <span className="text-lg text-white/30">
                    {item.kind === "essay"
                      ? "✍️"
                      : item.kind === "book"
                      ? "📚"
                      : item.kind === "resource"
                      ? "🔧"
                      : "📄"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <ContentTypeBadge
            kind={item.kind}
            resourceType={item.resourceType}
          />

          <h4 className="mt-2 mb-2 line-clamp-2 font-serif text-sm font-normal text-[#F5F1E8]">
            {item.title}
          </h4>

          <div className="flex items-center justify-between text-xs text-white/40">
            {item.date && (
              <time>
                {new Date(item.date).toLocaleDateString("en-GB", {
                  month: "short",
                  day: "numeric",
                })}
              </time>
            )}
            {item.accessLevel === "inner-circle" && (
              <span className="flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" />
                Inner Circle
              </span>
            )}
          </div>
        </SilentSurface>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className="group block h-full"
      aria-label={`View ${item.title}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SilentSurface className="h-full overflow-hidden" hover>
        {item.coverImage && !imageError ? (
          <div className="relative aspect-[3/2] overflow-hidden">
            <Image
              src={item.coverImage}
              alt={item.title}
              fill
              className="object-cover transition-all duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              onError={() => setImageError(true)}
              priority={item.featured}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
            {item.featured && (
              <div className="absolute top-3 right-3">
                <div className="flex items-center gap-1 rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/15 px-2 py-1 backdrop-blur-sm">
                  <Sparkles className="h-3 w-3 text-[#D4AF37]" />
                  <span className="text-xs font-medium text-[#D4AF37]">
                    Featured
                  </span>
                </div>
              </div>
            )}
            {item.accessLevel === "inner-circle" && (
              <div className="absolute top-3 left-3">
                <div className="flex items-center gap-1 rounded-full border border-[#CD7F32]/40 bg-[#CD7F32]/15 px-2 py-1 backdrop-blur-sm">
                  <Lock className="h-3 w-3 text-[#CD7F32]" />
                  <span className="text-xs font-medium text-[#CD7F32]">
                    Inner Circle
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="relative aspect-[3/2] overflow-hidden bg-gradient-to-br from-charcoal to-softBlack">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/5">
                  <span className="text-2xl text-white/30">
                    {item.kind === "essay"
                      ? "✍️"
                      : item.kind === "book"
                      ? "📚"
                      : item.kind === "resource"
                      ? "🔧"
                      : "📄"}
                  </span>
                </div>
                <p className="text-xs text-white/40">No image</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-4">
          <div className="mb-3">
            <div className="mb-2 flex items-center justify-between">
              <ContentTypeBadge
                kind={item.kind}
                resourceType={item.resourceType}
              />
              <div className="flex items-center gap-2 text-xs text-white/40">
                {item.date && (
                  <time>
                    {new Date(item.date).toLocaleDateString("en-GB", {
                      month: "short",
                      day: "numeric",
                    })}
                  </time>
                )}
                {item.readTime && (
                  <>
                    <Clock className="h-3 w-3" />
                    <span>{item.readTime}</span>
                  </>
                )}
              </div>
            </div>

            <h3 className="mb-2 line-clamp-2 font-serif text-base font-normal text-[#F5F1E8]">
              {item.title}
            </h3>

            {(item.description || item.excerpt) && (
              <p className="line-clamp-2 text-sm text-white/60">
                {item.description || item.excerpt}
              </p>
            )}

            {showApplications && item.applications && (
              <p className="mt-2 line-clamp-1 text-xs text-white/50">
                {item.applications.join(" · ")}
              </p>
            )}
          </div>

          {item.tags.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-xs text-white/40">
                    #{tag}
                  </span>
                ))}
                {item.tags.length > 2 && (
                  <span className="text-xs text-white/40">
                    +{item.tags.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="border-t border-white/10 pt-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-white/45">
                {item.kind === "essay" ? "Read essay" : "View details"}
              </div>
              <ArrowRight
                className={`h-3 w-3 text-white/40 transition-transform ${
                  isHovered ? "translate-x-1" : ""
                }`}
              />
            </div>
          </div>
        </div>
      </SilentSurface>
    </Link>
  );
};

/* -------------------------------------------------------------------------- */
/* PAGE COMPONENT                                                            */
/* -------------------------------------------------------------------------- */

const ContentPage: NextPage<ContentPageProps> = ({
  items,
  contentStats,
  categories,
}) => {
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [categoryMode, setCategoryMode] =
    React.useState<CategoryMode>("type");
  const [activeFilter, setActiveFilter] =
    React.useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredItems = React.useMemo(() => {
    let result = items;

    if (activeFilter !== "all") {
      if (activeFilter === "featured") {
        result = result.filter((item) => item.featured);
      } else {
        result = result.filter((item) => item.kind === activeFilter);
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((item) => {
        const searchable = [
          item.title,
          item.description ?? "",
          item.excerpt ?? "",
          item.subtitle ?? "",
          item.author ?? "",
          item.category ?? "",
          ...item.tags,
        ]
          .join(" ")
          .toLowerCase();
        return searchable.includes(q);
      });
    }

    return result;
  }, [items, activeFilter, searchQuery]);

  const sortedYears = React.useMemo(() => {
    const years = Object.keys(categories.year)
      .filter((y) => y !== "Undated")
      .sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
    return years;
  }, [categories.year]);

  const filterOptions: {
    key: FilterKey;
    label: string;
    count: number;
    icon: React.ReactNode;
  }[] = [
    {
      key: "all",
      label: "All",
      count: contentStats.total,
      icon: <Layers className="h-4 w-4" />,
    },
    {
      key: "featured",
      label: "Featured",
      count: contentStats.featured,
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      key: "essay",
      label: "Essays",
      count: contentStats.essay,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      key: "book",
      label: "Volumes",
      count: contentStats.book,
      icon: <BookOpen className="h-4 w-4" />,
    },
    {
      key: "resource",
      label: "Frameworks",
      count: contentStats.resource,
      icon: <Wrench className="h-4 w-4" />,
    },
    {
      key: "download",
      label: "Tools",
      count: contentStats.download,
      icon: <Download className="h-4 w-4" />,
    },
    {
      key: "canon",
      label: "Canon",
      count: contentStats.canon,
      icon: <Lock className="h-4 w-4" />,
    },
    {
      key: "strategy",
      label: "Strategies",
      count: contentStats.strategy,
      icon: <Award className="h-4 w-4" />,
    },
    {
      key: "event",
      label: "Sessions",
      count: contentStats.event,
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      key: "print",
      label: "Editions",
      count: contentStats.print,
      icon: <Eye className="h-4 w-4" />,
    },
  ];

  const categoryModeOptions: {
    key: CategoryMode;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: "type",
      label: "By Type",
      icon: <FolderTree className="h-4 w-4" />,
    },
    {
      key: "year",
      label: "By Year",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      key: "featured",
      label: "Featured",
      icon: <Star className="h-4 w-4" />,
    },
  ];

  const handleSearch = React.useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  return (
    <Layout
      title="Content Library"
      description="A premium collection of essays, frameworks, volumes, and tools for strategic thinkers and builders."
      className="bg-charcoal"
    >
      <Head>
        <title>Content Library | Abraham of London</title>
        <meta
          name="description"
          content="Organized library of essays, frameworks, tools, and volumes on strategy, systems, and execution."
        />
        <meta
          property="og:title"
          content="Content Library | Abraham of London"
        />
        <meta
          property="og:description"
          content="A premium collection of strategic content for builders and leaders."
        />
        <meta property="og:type" content="website" />
      </Head>

      {/* HERO */}
      <div className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-black via-[#050608] to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.08),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(205,127,50,0.06),_transparent_55%)]" />
        <div className="container relative mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 font-serif text-4xl font-normal tracking-tight text-[#F5F1E8] sm:text-5xl">
              Content Library
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/70">
              A well-organized collection of essays, frameworks, volumes, and
              tools for builders who think in systems, not slogans.
            </p>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="border-b border-white/10 bg-white/5">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatItem
              icon={<FileText className="h-5 w-5" />}
              label="Essays"
              value={contentStats.essay}
              description="Strategic thinking"
              color="#26619C"
            />
            <StatItem
              icon={<Wrench className="h-5 w-5" />}
              label="Frameworks"
              value={contentStats.resource}
              description="Operational models"
              color="#F5F1E8"
            />
            <StatItem
              icon={<BookOpen className="h-5 w-5" />}
              label="Volumes"
              value={contentStats.book}
              description="Deep-dive works"
              color="#D4AF37"
            />
            <StatItem
              icon={<Award className="h-5 w-5" />}
              label="Featured"
              value={contentStats.featured}
              description="Premium content"
              color="#CD7F32"
            />
          </div>
        </div>
      </div>

      {/* MAIN */}
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Controls */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full rounded-sm border border-white/15 bg-black/40 py-2 pl-10 pr-4 text-sm text-[#F5F1E8] placeholder-white/40 focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/30"
                aria-label="Search content"
              />
            </div>

            {/* View toggle */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1 rounded-sm border border-white/15 bg-black/40 p-1">
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={`rounded-sm p-1 ${
                    viewMode === "grid"
                      ? "bg-white/20 text-[#F5F1E8]"
                      : "text-white/50 hover:text-white/80"
                  }`}
                  aria-label="Grid view"
                >
                  <Grid3x3 className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={`rounded-sm p-1 ${
                    viewMode === "list"
                      ? "bg-white/20 text-[#F5F1E8]"
                      : "text-white/50 hover:text-white/80"
                  }`}
                  aria-label="List view"
                >
                  <List className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Filter pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setActiveFilter(option.key)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-all ${
                  activeFilter === option.key
                    ? "border-white/25 bg-white/15 text-[#F5F1E8]"
                    : "border-white/15 text-white/50 hover:border-white/30 hover:text-white/80"
                }`}
                aria-label={`Filter by ${option.label}`}
              >
                {option.icon}
                <span>{option.label}</span>
                <span className="ml-1 rounded-full bg-white/15 px-1.5 py-0.5">
                  {option.count}
                </span>
              </button>
            ))}
          </div>

          {/* Category mode tabs */}
          <div className="mt-6">
            <div className="flex items-center gap-2 border-b border-white/15">
              {categoryModeOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setCategoryMode(option.key)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    categoryMode === option.key
                      ? "border-b-2 border-[#D4AF37] text-[#F5F1E8]"
                      : "text-white/50 hover:text-white/80"
                  }`}
                  aria-label={`View ${option.label}`}
                >
                  <span className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content display */}
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center">
            <Search className="mx-auto h-8 w-8 text-white/25" />
            <h3 className="mt-4 font-serif text-lg font-normal text-[#F5F1E8]">
              No content found
            </h3>
            <p className="mt-1 text-sm text-white/50">
              {searchQuery
                ? `No results for "${searchQuery}". Try a different search term.`
                : "Try adjusting your filters."}
            </p>
          </div>
        ) : categoryMode === "type" ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/50">
                Organized by content type
              </p>
              <p className="text-sm text-white/50">
                {
                  Object.keys(categories.type).filter(
                    (k) =>
                      categories.type[k as ContentKind] &&
                      categories.type[k as ContentKind].length > 0
                  ).length
                }{" "}
                categories
              </p>
            </div>

            {(
              [
                "essay",
                "resource",
                "book",
                "canon",
                "download",
                "strategy",
                "event",
                "print",
              ] as ContentKind[]
            ).map((kind) => {
              const list = categories.type[kind];
              if (!list || list.length === 0) return null;

              const titles: Record<ContentKind, string> = {
                essay: "Essays",
                resource: "Frameworks & Resources",
                book: "Volumes",
                canon: "Canon Entries",
                download: "Tools & Downloads",
                strategy: "Strategies",
                event: "Sessions",
                print: "Editions",
              };

              return (
                <section key={kind}>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-serif text-xl font-normal text-[#F5F1E8]">
                      {titles[kind]}
                    </h2>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                      {list.length} items
                    </span>
                  </div>

                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                        : "space-y-2"
                    }
                  >
                    {list.map((item) => (
                      <UnifiedContentCard
                        key={`${item.kind}-${item.slug}`}
                        item={item}
                        variant={viewMode === "grid" ? "category" : "list"}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : categoryMode === "year" ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/50">
                Organized by publication year
              </p>
              <p className="text-sm text-white/50">
                {sortedYears.length} years
              </p>
            </div>

            {sortedYears.map((year) => {
              const list = categories.year[year];
              if (!list || list.length === 0) return null;

              return (
                <section key={year}>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-serif text-xl font-normal text-[#F5F1E8]">
                      {year}
                    </h2>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                      {list.length} items
                    </span>
                  </div>

                  <div
                    className={
                      viewMode === "grid"
                        ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                        : "space-y-2"
                    }
                  >
                    {list.map((item) => (
                      <UnifiedContentCard
                        key={`${item.kind}-${item.slug}`}
                        item={item}
                        variant={viewMode === "grid" ? "category" : "list"}
                      />
                    ))}
                  </div>
                </section>
              );
            })}

            {categories.year["Undated"] && (
              <section>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-serif text-xl font-normal text-[#F5F1E8]">
                    Undated
                  </h2>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">
                    {categories.year["Undated"].length} items
                  </span>
                </div>

                <div
                  className={
                    viewMode === "grid"
                      ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
                      : "space-y-2"
                  }
                >
                  {categories.year["Undated"].map((item) => (
                    <UnifiedContentCard
                      key={`${item.kind}-${item.slug}`}
                      item={item}
                      variant={viewMode === "grid" ? "category" : "list"}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-normal text-[#F5F1E8]">
                  Featured Content
                </h2>
                <p className="text-sm text-white/50">
                  Handpicked essays, frameworks, and tools
                </p>
              </div>
              <p className="text-sm text-white/50">
                {categories.featured.length} items
              </p>
            </div>

            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
                  : "space-y-2"
              }
            >
              {categories.featured.map((item) => (
                <UnifiedContentCard
                  key={`${item.kind}-${item.slug}`}
                  item={item}
                  variant={viewMode === "grid" ? "grid" : "list"}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer Stats */}
        <div className="mt-12 border-t border-white/15 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-white/50">
              Showing{" "}
              <span className="font-medium text-[#F5F1E8]">
                {filteredItems.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-[#F5F1E8]">
                {contentStats.total}
              </span>{" "}
              items
              {activeFilter !== "all" && ` (filtered by ${activeFilter})`}
            </p>

            <div className="flex items-center gap-4 text-sm text-white/50">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {contentStats.withImages} with images
              </span>
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {contentStats.featured} featured
              </span>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ContentPage;