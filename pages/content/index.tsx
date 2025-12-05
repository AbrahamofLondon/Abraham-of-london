// Update your pages/content/index.tsx
import type { GetStaticProps, NextPage } from "next";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
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
  Tool,
} from "lucide-react";

import Layout from "@/components/Layout";
import {
  getAllUnifiedContent,
  type UnifiedContent,
} from "@/lib/server/unified-content";
import { getAllResources, type ResourceMeta } from "@/lib/server/resources-data";
import SilentSurface from "@/components/ui/SilentSurface";

/* -------------------------------------------------------------------------- */
/* Type Definitions (Updated to include resources properly)                   */
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
type ViewMode = "grid" | "compact";

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
  // Resource-specific fields
  resourceType?: string;
  applications?: string[];
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
}

/* -------------------------------------------------------------------------- */
/* Map Resources to ContentResource                                           */
/* -------------------------------------------------------------------------- */

const mapResourceToContent = (resource: ResourceMeta): ContentResource => ({
  kind: "resource",
  title: resource.title,
  slug: resource.slug,
  href: `/resources/${resource.slug}`,
  date: resource.date,
  description: resource.description,
  excerpt: resource.excerpt,
  category: resource.category,
  tags: resource.tags || [],
  featured: (resource as any).featured || false,
  readTime: (resource as any).readTime,
  coverImage: (resource as any).coverImage,
  author: (resource as any).author,
  resourceType: (resource as any).resourceType || "Framework",
  applications: (resource as any).applications || ["Strategy", "Execution"],
});

const mapUnifiedToContent = (entry: UnifiedContent): ContentResource | null => {
  // Skip page types
  if (entry.type === "page") return null;

  // Map unified type → local ContentKind
  let kind: ContentKind;
  switch (entry.type) {
    case "essay":
      kind = "essay";
      break;
    case "book":
      kind = "book";
      break;
    case "download":
      kind = "download";
      break;
    case "event":
      kind = "event";
      break;
    case "print":
      kind = "print";
      break;
    case "resource":
      kind = "resource";
      break;
    default:
      return null;
  }

  return {
    kind,
    title: entry.title || "Untitled",
    slug: entry.slug,
    href: entry.url,
    date: entry.date || undefined,
    description: entry.description || undefined,
    subtitle: undefined,
    excerpt: entry.excerpt || undefined,
    category: entry.category || undefined,
    tags: Array.isArray(entry.tags) ? entry.tags : [],
    featured: entry.featured || false,
    readTime: entry.readTime || undefined,
    coverImage: entry.coverImage || undefined,
    author: entry.author || undefined,
    resourceType: (entry as any).resourceType,
    applications: (entry as any).applications,
  };
};

/* -------------------------------------------------------------------------- */
/* Updated getStaticProps to include resources                                */
/* -------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  // Get unified content
  const unified = await getAllUnifiedContent();
  
  // Get resources separately (in case they're not in unified content)
  const resources = getAllResources();
  
  // Map all content to ContentResource
  const unifiedItems = unified
    .map(mapUnifiedToContent)
    .filter((x): x is ContentResource => x !== null);
  
  // Map resources to ContentResource
  const resourceItems = resources.map(mapResourceToContent);
  
  // Combine all items (avoid duplicates by slug)
  const allItems = [...unifiedItems];
  const resourceSlugs = new Set(resourceItems.map(r => r.slug));
  
  // Only add resources that aren't already in unified items
  resourceItems.forEach(resource => {
    if (!resourceSlugs.has(resource.slug)) {
      allItems.push(resource);
    }
  });

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

  return {
    props: {
      items: JSON.parse(JSON.stringify(allItems)),
      contentStats,
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
  <SilentSurface className="p-6">
    <div className="flex items-center gap-4">
      <div className="rounded-sm border border-white/[0.04] bg-white/[0.02] p-3">
        {icon}
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="font-serif text-3xl font-normal text-[#F5F1E8]">
            {value}
          </span>
          <span className="text-xs uppercase tracking-[0.2em] text-white/[0.3]">
            {label}
          </span>
        </div>
        {description && (
          <p className="mt-2 text-sm text-white/[0.4]">{description}</p>
        )}
      </div>
    </div>
  </SilentSurface>
);

/* -------------------------------------------------------------------------- */
/* Update ContentTypeBadge to include resource icon                           */
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
    essay: <FileText className="h-4 w-4" />,
    book: <BookOpen className="h-4 w-4" />,
    download: <Download className="h-4 w-4" />,
    event: <Calendar className="h-4 w-4" />,
    print: <Eye className="h-4 w-4" />,
    resource: <Tool className="h-4 w-4" />,
    canon: <Lock className="h-4 w-4" />,
  };

  const colors: Record<ContentKind, string> = {
    essay: "text-[#26619C]/[0.08] text-[#26619C] border-[#26619C]/[0.15]",
    book: "text-[#D4AF37]/[0.08] text-[#D4AF37] border-[#D4AF37]/[0.15]",
    download: "text-[#CD7F32]/[0.08] text-[#CD7F32] border-[#CD7F32]/[0.15]",
    event: "text-[#C0C0C0]/[0.08] text-[#C0C0C0] border-[#C0C0C0]/[0.15]",
    print: "text-[#FFFFF0]/[0.08] text-[#FFFFF0] border-[#FFFFF0]/[0.15]",
    resource: "text-[#F5F1E8]/[0.08] text-[#F5F1E8] border-[#F5F1E8]/[0.15]",
    canon: "bg-gradient-to-r from-[#D4AF37]/[0.1] to-[#CD7F32]/[0.1] text-[#D4AF37] border-[#D4AF37]/[0.2]",
  };

  const scheme = colors[kind];
  const [bg, text, border] = scheme.split(' ');

  return (
    <div className="inline-flex items-center gap-2">
      <div className={`rounded-sm border px-2.5 py-1 flex items-center gap-2 ${bg} ${text} ${border}`}>
        {icons[kind]}
        <span className="text-xs font-medium tracking-[0.1em]">
          {labels[kind]}
        </span>
      </div>
      {kind === 'resource' && resourceType && (
        <div className="h-3 w-px bg-white/[0.1]" />
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Update ContentCard to show resource-specific info                          */
/* -------------------------------------------------------------------------- */

const ContentCard: React.FC<{
  item: ContentResource;
  variant?: "grid" | "compact";
}> = ({ item, variant = "grid" }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  // Show applications for resources
  const showApplications = item.kind === 'resource' && item.applications && item.applications.length > 0;

  if (variant === "compact") {
    return (
      <Link href={item.href} className="group">
        <SilentSurface className="p-4" hover>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <ContentTypeBadge kind={item.kind} resourceType={item.resourceType} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3">
                <h4 className="truncate font-serif text-sm font-light text-[#F5F1E8] transition-all duration-500 group-hover:tracking-wide">
                  {item.title}
                </h4>
                {item.featured && (
                  <Sparkles className="h-3 w-3 text-[#D4AF37]/60" />
                )}
              </div>
              {item.date && (
                <div className="mt-1 flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-white/[0.1]" />
                  <time className="text-xs text-white/[0.3]">
                    {new Date(item.date).toLocaleDateString("en-GB", {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </time>
                </div>
              )}
              {showApplications && variant === 'compact' && (
                <div className="mt-2">
                  <div className="flex flex-wrap gap-1">
                    {item.applications?.slice(0, 2).map((app, i) => (
                      <span key={i} className="text-xs text-white/[0.2]">
                        {app}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-white/[0.2] transition-all duration-500 group-hover:translate-x-1 group-hover:text-[#D4AF37]/60" />
          </div>
        </SilentSurface>
      </Link>
    );
  }

  return (
    <Link
      href={item.href}
      className="group block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <SilentSurface className="overflow-hidden h-full" hover>
        {/* Cover Image with premium overlay */}
        {item.coverImage && (
          <div className="relative aspect-[3/2] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-black/[0.3] via-transparent to-black/[0.8] z-10" />
            <img
              src={item.coverImage}
              alt={item.title}
              className="h-full w-full object-cover transition-all duration-1000 group-hover:scale-105"
              style={{
                filter: isHovered ? 'brightness(1.05) contrast(1.02)' : 'brightness(1)',
              }}
            />
            {/* Micro-interaction indicator */}
            <div 
              className={`absolute top-4 right-4 h-2 w-2 rounded-full bg-[#D4AF37] transition-all duration-1000 ${
                isHovered ? 'opacity-100' : 'opacity-30'
              }`}
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <div className="mb-5">
            <div className="mb-4 flex items-center justify-between">
              <ContentTypeBadge kind={item.kind} resourceType={item.resourceType} />
              <div className="flex items-center gap-3 text-xs text-white/[0.3]">
                {item.date && (
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <time>
                      {new Date(item.date).toLocaleDateString("en-GB", {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </time>
                  </div>
                )}
                {item.readTime && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{item.readTime}</span>
                  </div>
                )}
              </div>
            </div>

            <h3 className="mb-3 line-clamp-2 font-serif text-lg font-normal text-[#F5F1E8] leading-relaxed transition-all duration-500 group-hover:tracking-tight">
              {item.title}
            </h3>

            {(item.description || item.excerpt) && (
              <p className="line-clamp-2 text-sm leading-relaxed text-white/[0.4] transition-colors duration-500 group-hover:text-white/[0.5]">
                {item.description || item.excerpt}
              </p>
            )}

            {/* Show applications for resources */}
            {showApplications && (
              <div className="mt-4">
                <div className="mb-2 text-xs uppercase tracking-[0.1em] text-white/[0.3]">
                  Applications
                </div>
                <div className="flex flex-wrap gap-2">
                  {item.applications?.map((app, i) => (
                    <span
                      key={i}
                      className="rounded-sm border border-white/[0.08] bg-white/[0.03] px-2 py-1 text-xs text-white/[0.4]"
                    >
                      {app}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="mb-5">
              <div className="flex flex-wrap gap-1.5">
                {item.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs text-white/[0.2] transition-all duration-300 hover:text-white/[0.3] hover:tracking-wide"
                    style={{
                      letterSpacing: '0.03em',
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="border-t border-white/[0.04] pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.author && (
                  <span className="text-xs text-white/[0.25]">
                    {item.author}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/[0.25] transition-all duration-500 group-hover:text-white/[0.3]">
                  {item.kind === 'essay' ? 'Read' : 'View'}
                </span>
                <ArrowRight
                  className={`h-4 w-4 text-white/[0.2] transition-all duration-700 ${
                    isHovered ? 'translate-x-1 text-[#D4AF37]/60' : ''
                  }`}
                />
              </div>
            </div>
          </div>
        </div>
      </SilentSurface>
    </Link>
  );
};

/* -------------------------------------------------------------------------- */
/* Main Content Page Component                                                */
/* -------------------------------------------------------------------------- */

const ContentPage: NextPage<ContentPageProps> = ({ items, contentStats }) => {
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [activeFilter, setActiveFilter] = React.useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Filter items based on active filter and search
  const filteredItems = React.useMemo(() => {
    let result = items;

    // Apply filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'featured') {
        result = result.filter(item => item.featured);
      } else {
        result = result.filter(item => item.kind === activeFilter);
      }
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        item.excerpt?.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query)) ||
        item.author?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [items, activeFilter, searchQuery]);

  // Group items by year for display (if needed)
  const groupedByYear = React.useMemo(() => {
    const groups: Record<string, ContentResource[]> = {};
    
    filteredItems.forEach(item => {
      if (!item.date) {
        if (!groups['Undated']) groups['Undated'] = [];
        groups['Undated'].push(item);
        return;
      }
      
      const year = new Date(item.date).getFullYear().toString();
      if (!groups[year]) groups[year] = [];
      groups[year].push(item);
    });

    // Sort years in descending order
    const sortedGroups: Record<string, ContentResource[]> = {};
    Object.keys(groups)
      .sort((a, b) => {
        if (a === 'Undated') return 1;
        if (b === 'Undated') return -1;
        return parseInt(b) - parseInt(a);
      })
      .forEach(key => {
        sortedGroups[key] = groups[key];
      });

    return sortedGroups;
  }, [filteredItems]);

  const filterOptions = [
    { key: 'all' as FilterKey, label: 'All', count: contentStats.total, icon: <Layers className="h-4 w-4" /> },
    { key: 'featured' as FilterKey, label: 'Featured', count: contentStats.featured, icon: <Sparkles className="h-4 w-4" /> },
    { key: 'essay' as FilterKey, label: 'Essays', count: contentStats.essay, icon: <FileText className="h-4 w-4" /> },
    { key: 'book' as FilterKey, label: 'Volumes', count: contentStats.book, icon: <BookOpen className="h-4 w-4" /> },
    { key: 'resource' as FilterKey, label: 'Frameworks', count: contentStats.resource, icon: <Tool className="h-4 w-4" /> },
    { key: 'download' as FilterKey, label: 'Tools', count: contentStats.download, icon: <Download className="h-4 w-4" /> },
    { key: 'event' as FilterKey, label: 'Sessions', count: contentStats.event, icon: <Calendar className="h-4 w-4" /> },
    { key: 'print' as FilterKey, label: 'Editions', count: contentStats.print, icon: <Eye className="h-4 w-4" /> },
  ];

  return (
    <Layout>
      <Head>
        <title>Archive | Content Library</title>
        <meta
          name="description"
          content="Browse essays, frameworks, tools, and volumes on strategy, systems, and execution."
        />
      </Head>

      {/* Hero Section */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
        <div className="container relative mx-auto px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 font-serif text-5xl font-normal tracking-tight text-[#F5F1E8] sm:text-6xl">
              Archive
            </h1>
            <p className="mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-white/[0.6]">
              A comprehensive library of strategic frameworks, essays, tools, and resources 
              designed for founders, operators, and strategic thinkers.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="border-y border-white/[0.04] bg-white/[0.01]">
        <div className="container mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <StatItem
              icon={<FileText className="h-6 w-6 text-[#26619C]" />}
              label="Essays"
              value={contentStats.essay}
              description="Strategic analysis & long-form thinking"
            />
            <StatItem
              icon={<Tool className="h-6 w-6 text-[#F5F1E8]" />}
              label="Frameworks"
              value={contentStats.resource}
              description="Operational models & mental models"
            />
            <StatItem
              icon={<BookOpen className="h-6 w-6 text-[#D4AF37]" />}
              label="Volumes"
              value={contentStats.book}
              description="Deep-dive collections & extended works"
            />
            <StatItem
              icon={<Download className="h-6 w-6 text-[#CD7F32]" />}
              label="Tools"
              value={contentStats.download}
              description="Templates, worksheets & practical guides"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {/* Controls */}
        <div className="mb-12">
          <div className="flex flex-col items-center justify-between gap-6 lg:flex-row">
            {/* Search */}
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.3]" />
              <input
                type="text"
                placeholder="Search by title, tag, or author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-sm border border-white/[0.08] bg-white/[0.03] py-3 pl-12 pr-4 font-sans text-sm text-[#F5F1E8] placeholder-white/[0.3] focus:border-white/[0.15] focus:outline-none focus:ring-1 focus:ring-white/[0.1]"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 rounded-sm border border-white/[0.08] bg-white/[0.02] p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded-sm px-3 py-2 text-xs transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white/[0.06] text-[#F5F1E8]'
                      : 'text-white/[0.4] hover:text-white/[0.6]'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('compact')}
                  className={`rounded-sm px-3 py-2 text-xs transition-colors ${
                    viewMode === 'compact'
                      ? 'bg-white/[0.06] text-[#F5F1E8]'
                      : 'text-white/[0.4] hover:text-white/[0.6]'
                  }`}
                >
                  List
                </button>
              </div>

              {/* Filter Dropdown */}
              <div className="relative">
                <select
                  value={activeFilter}
                  onChange={(e) => setActiveFilter(e.target.value as FilterKey)}
                  className="appearance-none rounded-sm border border-white/[0.08] bg-white/[0.03] py-3 pl-4 pr-10 font-sans text-sm text-[#F5F1E8] focus:border-white/[0.15] focus:outline-none focus:ring-1 focus:ring-white/[0.1]"
                >
                  {filterOptions.map((option) => (
                    <option key={option.key} value={option.key}>
                      {option.label} ({option.count})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 pointer-events-none text-white/[0.3]" />
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="mt-8 flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setActiveFilter(option.key)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs transition-all ${
                  activeFilter === option.key
                    ? 'border-white/[0.15] bg-white/[0.06] text-[#F5F1E8]'
                    : 'border-white/[0.08] text-white/[0.4] hover:border-white/[0.12] hover:bg-white/[0.02] hover:text-white/[0.6]'
                }`}
              >
                {option.icon}
                <span>{option.label}</span>
                <span className="ml-1 rounded-full bg-white/[0.08] px-2 py-0.5">
                  {option.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {filteredItems.length === 0 ? (
          <div className="py-20 text-center">
            <Search className="mx-auto h-12 w-12 text-white/[0.2]" />
            <h3 className="mt-6 font-serif text-xl font-normal text-[#F5F1E8]">
              No content found
            </h3>
            <p className="mt-2 text-white/[0.4]">
              Try adjusting your search or filter to find what you're looking for.
            </p>
          </div>
        ) : (
          <>
            {/* Summary */}
            <div className="mb-8 flex items-center justify-between">
              <p className="text-sm text-white/[0.4]">
                Showing <span className="font-medium text-[#F5F1E8]">{filteredItems.length}</span> of{' '}
                <span className="font-medium text-[#F5F1E8]">{contentStats.total}</span> items
              </p>
              <p className="text-sm text-white/[0.4]">
                {viewMode === 'grid' ? 'Grid view' : 'List view'}
              </p>
            </div>

            {/* Content Grid/List */}
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <ContentCard key={item.slug} item={item} variant="grid" />
                ))}
              </div>
            ) : (
              // Grouped list view by year
              <div className="space-y-12">
                {Object.entries(groupedByYear).map(([year, yearItems]) => (
                  <div key={year}>
                    <h3 className="mb-6 font-serif text-2xl font-normal text-[#F5F1E8]">
                      {year}
                    </h3>
                    <div className="space-y-1">
                      {yearItems.map((item) => (
                        <ContentCard key={item.slug} item={item} variant="compact" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
};

export default ContentPage;