import type { GetStaticProps, NextPage } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Calendar,
  Clock,
  ArrowRight,
  FileText,
  Download,
  Star,
  Layers,
  Filter,
  ChevronDown,
  Bookmark,
  BookOpen,
  CheckCircle,
  Lock,
  Eye,
  Sparkles,
  Cpu,
  Zap,
  Wrench,
  FolderTree,
  Grid3x3,
  List,
} from "lucide-react";

import Layout from "@/components/Layout";
import { BaseCard, getCardAriaLabel } from '@/components/Cards';
import SilentSurface from "@/components/ui/SilentSurface";
import {
  getAllUnifiedContent,
  type UnifiedContent,
} from "@/lib/server/unified-content";

/* -------------------------------------------------------------------------- */
/* Type Definitions                                                           */
/* -------------------------------------------------------------------------- */

type ContentKind =
  | "essay"
  | "book"
  | "download"
  | "event"
  | "print"
  | "resource"
  | "canon";

type FilterKey = ContentKind | "all" | "featured";
type ViewMode = "grid" | "list" | "categories";
type CategoryMode = "type" | "year" | "featured";

interface ContentResource {
  kind: ContentKind;
  title: string;
  slug: string;
  href: string;
  date?: string;
  description?: string;
  subtitle?: string;
  excerpt?: string;
  category?: string;
  tags: string[];
  featured?: boolean;
  readTime?: string;
  coverImage?: string;
  author?: string;
  resourceType?: string;
  applications?: string[];
  year?: string;
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
    featured: number;
  };
  categories: {
    type: Record<string, ContentResource[]>;
    year: Record<string, ContentResource[]>;
    featured: ContentResource[];
  };
}

/* -------------------------------------------------------------------------- */
/* Enhanced Content Mapping with Year Extraction                              */
/* -------------------------------------------------------------------------- */

const mapUnifiedToContent = (entry: UnifiedContent): ContentResource | null => {
  if (entry.type === "page") return null;

  let kind: ContentKind;
  switch (entry.type) {
    case "essay": kind = "essay"; break;
    case "book": kind = "book"; break;
    case "download": kind = "download"; break;
    case "event": kind = "event"; break;
    case "print": kind = "print"; break;
    case "resource": kind = "resource"; break;
    default: return null;
  }

  const year = entry.date 
    ? new Date(entry.date).getFullYear().toString() 
    : "Undated";

  return {
    kind,
    title: entry.title || "Untitled",
    slug: entry.slug,
    href: entry.url,
    date: entry.date || undefined,
    description: entry.description || undefined,
    excerpt: entry.excerpt || undefined,
    category: entry.category || undefined,
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    featured: entry.featured || false,
    readTime: entry.readTime || undefined,
    coverImage: entry.coverImage || undefined,
    author: entry.author || undefined,
    resourceType: entry.resourceType,
    applications: entry.applications,
    year,
  };
};

/* -------------------------------------------------------------------------- */
/* Category Organization Logic                                                */
/* -------------------------------------------------------------------------- */

const organizeByCategories = (items: ContentResource[]) => {
  // Organize by type
  const byType: Record<string, ContentResource[]> = {};
  items.forEach(item => {
    if (!byType[item.kind]) byType[item.kind] = [];
    byType[item.kind].push(item);
  });

  // Organize by year
  const byYear: Record<string, ContentResource[]> = {};
  items.forEach(item => {
    const year = item.year || "Undated";
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(item);
  });

  // Get featured items
  const featured = items.filter(item => item.featured);

  return { byType, byYear, featured };
};

/* -------------------------------------------------------------------------- */
/* Enhanced getStaticProps with Categories                                    */
/* -------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  const unified = await getAllUnifiedContent();
  
  const allItems = unified
    .map(mapUnifiedToContent)
    .filter((x): x is ContentResource => x !== null);

  // Calculate statistics
  const contentStats = {
    total: allItems.length,
    essay: allItems.filter((i) => i.kind === "essay").length,
    book: allItems.filter((i) => i.kind === "book").length,
    download: allItems.filter((i) => i.kind === "download").length,
    event: allItems.filter((i) => i.kind === "event").length,
    print: allItems.filter((i) => i.kind === "print").length,
    resource: allItems.filter((i) => i.kind === "resource").length,
    canon: allItems.filter((i) => i.kind === "canon").length,
    featured: allItems.filter((i) => i.featured).length,
  };

  // Organize into categories
  const categories = organizeByCategories(allItems);

  return {
    props: {
      items: JSON.parse(JSON.stringify(allItems)),
      contentStats,
      categories: {
        type: categories.byType,
        year: categories.byYear,
        featured: categories.featured,
      },
    },
    revalidate: 3600,
  };
};

/* -------------------------------------------------------------------------- */
/* StatItem Component                                                         */
/* -------------------------------------------------------------------------- */

const StatItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  description?: string;
}> = ({ icon, label, value, description }) => (
  <SilentSurface className="p-4">
    <div className="flex items-center gap-3">
      <div className="rounded-sm border border-white/[0.04] bg-white/[0.02] p-2">
        {icon}
      </div>
      <div>
        <div className="flex items-baseline gap-1">
          <span className="font-serif text-2xl font-normal text-[#F5F1E8]">
            {value}
          </span>
          <span className="text-xs uppercase tracking-[0.1em] text-white/[0.3]">
            {label}
          </span>
        </div>
        {description && (
          <p className="mt-1 text-xs text-white/[0.4]">{description}</p>
        )}
      </div>
    </div>
  </SilentSurface>
);

/* -------------------------------------------------------------------------- */
/* Enhanced ContentTypeBadge                                                  */
/* -------------------------------------------------------------------------- */

const ContentTypeBadge: React.FC<{ kind: ContentKind; resourceType?: string }> = ({ 
  kind, 
  resourceType = "Framework" 
}) => {
  const labels: Record<ContentKind, string> = {
    essay: "Essay",
    book: "Volume",
    download: "Tool",
    event: "Session",
    print: "Edition",
    resource: resourceType,
    canon: "Canon",
  };

  const icons: Record<ContentKind, React.ReactNode> = {
    essay: <FileText className="h-3 w-3" />,
    book: <BookOpen className="h-3 w-3" />,
    download: <Download className="h-3 w-3" />,
    event: <Calendar className="h-3 w-3" />,
    print: <Eye className="h-3 w-3" />,
    resource: <Wrench className="h-3 w-3" />,
    canon: <Lock className="h-3 w-3" />,
  };

  const colors: Record<ContentKind, string> = {
    essay: "bg-[#26619C]/[0.08] text-[#26619C] border-[#26619C]/[0.15]",
    book: "bg-[#D4AF37]/[0.08] text-[#D4AF37] border-[#D4AF37]/[0.15]",
    download: "bg-[#CD7F32]/[0.08] text-[#CD7F32] border-[#CD7F32]/[0.15]",
    event: "bg-[#C0C0C0]/[0.08] text-[#C0C0C0] border-[#C0C0C0]/[0.15]",
    print: "bg-[#FFFFF0]/[0.08] text-[#FFFFF0] border-[#FFFFF0]/[0.15]",
    resource: "bg-[#F5F1E8]/[0.08] text-[#F5F1E8] border-[#F5F1E8]/[0.15]",
    canon: "bg-gradient-to-r from-[#D4AF37]/[0.1] to-[#CD7F32]/[0.1] text-[#D4AF37] border-[#D4AF37]/[0.2]",
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 ${colors[kind]}`}>
      {icons[kind]}
      <span className="text-xs font-medium">
        {labels[kind]}
      </span>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* INTELLIGENT CONTENT CARD WITH BETTER IMAGE HANDLING                        */
/* -------------------------------------------------------------------------- */

const ContentCard: React.FC<{
  item: ContentResource;
  variant?: "grid" | "list" | "category";
}> = ({ item, variant = "grid" }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const showApplications = item.kind === 'resource' && item.applications && item.applications.length > 0;

  // List variant (most compact)
  if (variant === "list") {
    return (
      <Link href={item.href} className="group block">
        <SilentSurface className="p-3" hover>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <ContentTypeBadge kind={item.kind} resourceType={item.resourceType} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="truncate font-serif text-sm font-light text-[#F5F1E8]">
                  {item.title}
                </h4>
                {item.featured && (
                  <Sparkles className="h-3 w-3 flex-shrink-0 text-[#D4AF37]" />
                )}
              </div>
              {item.date && (
                <time className="text-xs text-white/[0.3]">
                  {new Date(item.date).toLocaleDateString("en-GB", {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
              )}
            </div>
            <ArrowRight className="h-3 w-3 flex-shrink-0 text-white/[0.2]" />
          </div>
        </SilentSurface>
      </Link>
    );
  }

  // Category variant (used in category view)
  if (variant === "category") {
    return (
      <Link href={item.href} className="group block">
        <SilentSurface className="h-full p-4" hover>
          {/* Intelligent Image Container */}
          {item.coverImage ? (
            <div className="relative mb-3 aspect-[16/9] overflow-hidden rounded-sm">
              <Image
                src={item.coverImage}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-102"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
            </div>
          ) : (
            <div className="mb-3 aspect-[16/9] flex items-center justify-center rounded-sm bg-gradient-to-br from-charcoal to-softBlack">
              <div className="text-center">
                <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05]">
                  <span className="text-lg text-white/[0.2]">
                    {item.kind === 'essay' ? '✍️' : 
                     item.kind === 'book' ? '📚' : 
                     item.kind === 'resource' ? '🔧' : '📄'}
                  </span>
                </div>
              </div>
            </div>
          )}

          <ContentTypeBadge kind={item.kind} resourceType={item.resourceType} />
          
          <h4 className="mt-2 mb-2 line-clamp-2 font-serif text-sm font-normal text-[#F5F1E8]">
            {item.title}
          </h4>

          {item.date && (
            <time className="text-xs text-white/[0.3]">
              {new Date(item.date).toLocaleDateString("en-GB", {
                month: 'short',
                day: 'numeric',
              })}
            </time>
          )}
        </SilentSurface>
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
      <SilentSurface className="h-full overflow-hidden" hover>
        {/* INTELLIGENT IMAGE HANDLING - covers any image size */}
        {item.coverImage ? (
          <div className="relative aspect-[3/2] overflow-hidden">
            <Image
              src={item.coverImage}
              alt={item.title}
              fill
              className="object-cover transition-all duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={item.featured}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            {item.featured && (
              <div className="absolute top-3 right-3">
                <div className="flex items-center gap-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-1">
                  <Sparkles className="h-3 w-3 text-[#D4AF37]" />
                  <span className="text-xs font-medium text-[#D4AF37]">Featured</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Fallback for items without cover images
          <div className="relative aspect-[3/2] overflow-hidden bg-gradient-to-br from-charcoal to-softBlack">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-white/[0.05]">
                  <span className="text-2xl text-white/[0.2]">
                    {item.kind === 'essay' ? '✍️' : 
                     item.kind === 'book' ? '📚' : 
                     item.kind === 'resource' ? '🔧' : '📄'}
                  </span>
                </div>
                <p className="text-xs text-white/[0.3]">No image</p>
              </div>
            </div>
          </div>
        )}

        <div className="p-4">
          <div className="mb-3">
            <div className="mb-2 flex items-center justify-between">
              <ContentTypeBadge kind={item.kind} resourceType={item.resourceType} />
              <div className="flex items-center gap-2 text-xs text-white/[0.3]">
                {item.date && (
                  <time>
                    {new Date(item.date).toLocaleDateString("en-GB", {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                )}
              </div>
            </div>

            <h3 className="mb-2 line-clamp-2 font-serif text-base font-normal text-[#F5F1E8]">
              {item.title}
            </h3>

            {(item.description || item.excerpt) && (
              <p className="line-clamp-2 text-sm text-white/[0.5]">
                {item.description || item.excerpt}
              </p>
            )}
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-white/[0.3]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-white/[0.04] pt-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-white/[0.3]">
                {item.kind === 'essay' ? 'Read essay' : 'View details'}
              </div>
              <ArrowRight
                className={`h-3 w-3 text-white/[0.3] transition-transform ${
                  isHovered ? 'translate-x-1' : ''
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
/* Category Section Component                                                 */
/* -------------------------------------------------------------------------- */

const CategorySection: React.FC<{
  title: string;
  items: ContentResource[];
  viewMode: ViewMode;
  defaultCollapsed?: boolean;
}> = ({ title, items, viewMode, defaultCollapsed = false }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  if (items.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="font-serif text-xl font-normal text-[#F5F1E8]">{title}</h3>
          <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-xs text-white/[0.4]">
            {items.length}
          </span>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="text-sm text-white/[0.4] hover:text-white/[0.6]"
        >
          {isCollapsed ? 'Show' : 'Hide'}
        </button>
      </div>

      {!isCollapsed && (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" 
          : "space-y-2"
        }>
          {items.map((item) => (
            <ContentCard 
              key={`${item.kind}-${item.slug}`} 
              item={item} 
              variant={viewMode === 'grid' ? 'category' : 'list'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Main Content Page Component                                                */
/* -------------------------------------------------------------------------- */

const ContentPage: NextPage<ContentPageProps> = ({ 
  items, 
  contentStats,
  categories 
}) => {
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [categoryMode, setCategoryMode] = React.useState<CategoryMode>('type');
  const [activeFilter, setActiveFilter] = React.useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter items based on active filter and search
  const filteredItems = React.useMemo(() => {
    let result = items;

    if (activeFilter !== 'all') {
      if (activeFilter === 'featured') {
        result = result.filter(item => item.featured);
      } else {
        result = result.filter(item => item.kind === activeFilter);
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.excerpt?.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [items, activeFilter, searchQuery]);

  // Sort years in descending order
  const sortedYears = React.useMemo(() => {
    const years = Object.keys(categories.year).filter(y => y !== "Undated");
    return years.sort((a, b) => parseInt(b) - parseInt(a));
  }, [categories.year]);

  const filterOptions = [
    { key: 'all' as FilterKey, label: 'All', count: contentStats.total, icon: <Layers className="h-4 w-4" /> },
    { key: 'featured' as FilterKey, label: 'Featured', count: contentStats.featured, icon: <Sparkles className="h-4 w-4" /> },
    { key: 'essay' as FilterKey, label: 'Essays', count: contentStats.essay, icon: <FileText className="h-4 w-4" /> },
    { key: 'book' as FilterKey, label: 'Volumes', count: contentStats.book, icon: <BookOpen className="h-4 w-4" /> },
    { key: 'resource' as FilterKey, label: 'Frameworks', count: contentStats.resource, icon: <Wrench className="h-4 w-4" /> },
    { key: 'download' as FilterKey, label: 'Tools', count: contentStats.download, icon: <Download className="h-4 w-4" /> },
    { key: 'event' as FilterKey, label: 'Sessions', count: contentStats.event, icon: <Calendar className="h-4 w-4" /> },
    { key: 'print' as FilterKey, label: 'Editions', count: contentStats.print, icon: <Eye className="h-4 w-4" /> },
  ];

  const categoryModeOptions = [
    { key: 'type' as CategoryMode, label: 'By Type', icon: <FolderTree className="h-4 w-4" /> },
    { key: 'year' as CategoryMode, label: 'By Year', icon: <Calendar className="h-4 w-4" /> },
    { key: 'featured' as CategoryMode, label: 'Featured', icon: <Star className="h-4 w-4" /> },
  ];

  return (
    <Layout>
      <Head>
        <title>Content Library | Abraham of London</title>
        <meta
          name="description"
          content="Organized library of essays, frameworks, tools, and volumes on strategy, systems, and execution."
        />
      </Head>

      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        <div className="container relative mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 font-serif text-4xl font-normal tracking-tight text-[#F5F1E8] sm:text-5xl">
              Content Library
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/[0.6]">
              A well-organized collection of strategic frameworks, essays, tools, and resources.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="border-y border-white/[0.04] bg-white/[0.01]">
        <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatItem
              icon={<FileText className="h-5 w-5 text-[#26619C]" />}
              label="Essays"
              value={contentStats.essay}
              description="Strategic thinking"
            />
            <StatItem
              icon={<Wrench className="h-5 w-5 text-[#F5F1E8]" />}
              label="Frameworks"
              value={contentStats.resource}
              description="Operational models"
            />
            <StatItem
              icon={<BookOpen className="h-5 w-5 text-[#D4AF37]" />}
              label="Volumes"
              value={contentStats.book}
              description="Deep-dive works"
            />
            <StatItem
              icon={<Download className="h-5 w-5 text-[#CD7F32]" />}
              label="Tools"
              value={contentStats.download}
              description="Practical guides"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {/* Controls */}
        <div className="mb-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.3]" />
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-sm border border-white/[0.08] bg-white/[0.03] py-2 pl-10 pr-4 text-sm text-[#F5F1E8] placeholder-white/[0.3] focus:border-white/[0.15] focus:outline-none"
              />
            </div>

            {/* View & Category Toggles */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1 rounded-sm border border-white/[0.08] bg-white/[0.02] p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded-sm px-2 py-1 text-xs ${
                    viewMode === 'grid'
                      ? 'bg-white/[0.06] text-[#F5F1E8]'
                      : 'text-white/[0.4] hover:text-white/[0.6]'
                  }`}
                >
                  <Grid3x3 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded-sm px-2 py-1 text-xs ${
                    viewMode === 'list'
                      ? 'bg-white/[0.06] text-[#F5F1E8]'
                      : 'text-white/[0.4] hover:text-white/[0.6]'
                  }`}
                >
                  <List className="h-3 w-3" />
                </button>
              </div>

              <div className="flex items-center gap-1 rounded-sm border border-white/[0.08] bg-white/[0.02] p-1">
                {categoryModeOptions.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setCategoryMode(option.key)}
                    className={`rounded-sm px-2 py-1 text-xs ${
                      categoryMode === option.key
                        ? 'bg-white/[0.06] text-[#F5F1E8]'
                        : 'text-white/[0.4] hover:text-white/[0.6]'
                    }`}
                  >
                    {option.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setActiveFilter(option.key)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs ${
                  activeFilter === option.key
                    ? 'border-white/[0.15] bg-white/[0.06] text-[#F5F1E8]'
                    : 'border-white/[0.08] text-white/[0.4] hover:border-white/[0.12]'
                }`}
              >
                {option.icon}
                <span>{option.label}</span>
                <span className="ml-1 rounded-full bg-white/[0.08] px-1.5 py-0.5">
                  {option.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Category Mode Selection */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            {categoryModeOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setCategoryMode(option.key)}
                className={`px-3 py-1.5 text-sm ${
                  categoryMode === option.key
                    ? 'text-[#F5F1E8] border-b-2 border-[#D4AF37]'
                    : 'text-white/[0.4] hover:text-white/[0.6]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Display */}
        {filteredItems.length === 0 ? (
          <div className="py-12 text-center">
            <Search className="mx-auto h-8 w-8 text-white/[0.2]" />
            <h3 className="mt-4 font-serif text-lg font-normal text-[#F5F1E8]">
              No content found
            </h3>
            <p className="mt-1 text-white/[0.4]">
              Try adjusting your search or filter.
            </p>
          </div>
        ) : categoryMode === 'type' ? (
          // Organized by Type
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-white/[0.4]">
                Organized by content type
              </p>
              <p className="text-sm text-white/[0.4]">
                {Object.keys(categories.type).length} categories
              </p>
            </div>

            {/* Essays */}
            {categories.type.essay && (
              <CategorySection
                title="Essays"
                items={categories.type.essay}
                viewMode={viewMode}
              />
            )}

            {/* Frameworks (Resources) */}
            {categories.type.resource && (
              <CategorySection
                title="Frameworks & Resources"
                items={categories.type.resource}
                viewMode={viewMode}
              />
            )}

            {/* Volumes (Books) */}
            {categories.type.book && (
              <CategorySection
                title="Volumes"
                items={categories.type.book}
                viewMode={viewMode}
              />
            )}

            {/* Tools (Downloads) */}
            {categories.type.download && (
              <CategorySection
                title="Tools & Downloads"
                items={categories.type.download}
                viewMode={viewMode}
              />
            )}

            {/* Other Categories */}
            {['event', 'print'].map(type => (
              categories.type[type] && (
                <CategorySection
                  key={type}
                  title={type === 'event' ? 'Sessions' : 'Editions'}
                  items={categories.type[type]}
                  viewMode={viewMode}
                  defaultCollapsed={true}
                />
              )
            ))}
          </div>
        ) : categoryMode === 'year' ? (
          // Organized by Year
          <div>
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm text-white/[0.4]">
                Organized by publication year
              </p>
              <p className="text-sm text-white/[0.4]">
                {sortedYears.length} years
              </p>
            </div>

            {/* Each Year */}
            {sortedYears.map(year => (
              <CategorySection
                key={year}
                title={year}
                items={categories.year[year]}
                viewMode={viewMode}
                defaultCollapsed={year !== sortedYears[0]}
              />
            ))}

            {/* Undated items */}
            {categories.year["Undated"] && (
              <CategorySection
                title="Undated"
                items={categories.year["Undated"]}
                viewMode={viewMode}
                defaultCollapsed={true}
              />
            )}
          </div>
        ) : (
          // Featured Items
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-serif text-2xl font-normal text-[#F5F1E8]">
                  Featured Content
                </h2>
                <p className="text-sm text-white/[0.4]">
                  Handpicked essays, frameworks, and tools
                </p>
              </div>
              <p className="text-sm text-white/[0.4]">
                {categories.featured.length} items
              </p>
            </div>

            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" 
              : "space-y-2"
            }>
              {categories.featured.map((item) => (
                <ContentCard 
                  key={`${item.kind}-${item.slug}`} 
                  item={item} 
                  variant={viewMode === 'grid' ? 'grid' : 'list'}
                />
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mt-8 border-t border-white/[0.04] pt-6">
          <p className="text-center text-sm text-white/[0.4]">
            Showing <span className="font-medium text-[#F5F1E8]">{filteredItems.length}</span> of{' '}
            <span className="font-medium text-[#F5F1E8]">{contentStats.total}</span> items
            {activeFilter !== 'all' && ` (filtered by ${activeFilter})`}
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default ContentPage;