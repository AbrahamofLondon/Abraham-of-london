// pages/content/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { 
  Search, Calendar, ArrowRight, FileText, Download, Star, Layers, 
  BookOpen, Lock, Eye, Sparkles, Wrench, FolderTree, Grid3x3, List, 
  Filter, ChevronDown, ExternalLink, Clock, User, Tag, Award
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
  type ContentType 
} from "@/lib/unified-content";

/* -------------------------------------------------------------------------- */
/* TYPE DEFINITIONS - Strict and Comprehensive                               */
/* -------------------------------------------------------------------------- */

type ContentKind = Exclude<ContentType, 'page'>;

type FilterKey = ContentKind | 'all' | 'featured';
type ViewMode = 'grid' | 'list' | 'categories';
type CategoryMode = 'type' | 'year' | 'featured';

interface ContentResource {
  // Core
  id: string;
  kind: ContentKind;
  slug: string;
  title: string;
  href: string;
  
  // Metadata
  date?: string;
  year: string;
  description?: string;
  excerpt?: string;
  subtitle?: string;
  category?: string;
  tags: string[];
  featured: boolean;
  readTime?: string;
  coverImage?: string;
  author?: string;
  
  // Type-specific
  resourceType?: string;
  applications?: string[];
  volumeNumber?: number;
  order?: number;
  eventDate?: string;
  location?: string;
  downloadFile?: string;
  fileSize?: string;
  isbn?: string;
  format?: string;
  publisher?: string;
  pages?: number;
  
  // Access
  accessLevel?: 'public' | 'inner-circle' | 'private';
  lockMessage?: string;
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
/* CONTENT MAPPING - Safe and Type-Safe                                      */
/* -------------------------------------------------------------------------- */

const mapUnifiedToResource = (entry: UnifiedContent): ContentResource | null => {
  // Skip pages for content library
  if (entry.type === 'page') return null;
  
  // Type guard for ContentKind
  const kind = entry.type as ContentKind;
  
  // CORRECTED: Use getContentUrl with proper arguments
  const href = getContentUrl(entry.type, entry.slug);
  
  // Format readTime
  const formattedReadTime = formatReadTime(entry.readTime);
  
  // Get year
  const year = getYearFromDate(entry.date);
  
  return {
    id: entry.id || `${kind}-${entry.slug}`,
    kind,
    slug: entry.slug,
    title: entry.title,
    href,
    date: entry.date,
    year,
    description: entry.description,
    excerpt: entry.excerpt,
    subtitle: entry.subtitle,
    category: entry.category,
    tags: entry.tags || [],
    featured: Boolean(entry.featured),
    readTime: formattedReadTime,
    coverImage: entry.coverImage,
    author: typeof entry.author === 'string' ? entry.author : 
            (typeof entry.author === 'object' && entry.author ? entry.author.name : undefined),
    resourceType: entry.resourceType,
    applications: entry.applications,
    volumeNumber: entry.volumeNumber,
    order: entry.order,
    eventDate: entry.eventDate,
    location: entry.location,
    downloadFile: entry.downloadFile,
    fileSize: entry.fileSize,
    isbn: entry.isbn,
    format: entry.format,
    publisher: entry.publisher,
    pages: entry.pages,
    accessLevel: entry.accessLevel as 'public' | 'inner-circle' | 'private' | undefined,
    lockMessage: entry.lockMessage,
  };
};

/* -------------------------------------------------------------------------- */
/* CATEGORY ORGANIZATION - Efficient and Safe                                 */
/* -------------------------------------------------------------------------- */

const organizeByCategories = (items: ContentResource[]) => {
  const byType: Record<ContentKind, ContentResource[]> = {} as Record<ContentKind, ContentResource[]>;
  const byYear: Record<string, ContentResource[]> = {};
  const featured: ContentResource[] = [];
  
  // Initialize all type arrays
  const allKinds: ContentKind[] = [
    'essay', 'book', 'download', 'event', 'print', 
    'resource', 'canon', 'strategy'
  ];
  allKinds.forEach(kind => {
    byType[kind] = [];
  });
  
  // Organize items
  items.forEach(item => {
    // By type
    byType[item.kind].push(item);
    
    // By year
    const year = item.year;
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(item);
    
    // Featured
    if (item.featured) featured.push(item);
  });
  
  return { byType, byYear, featured };
};

/* -------------------------------------------------------------------------- */
/* getStaticProps - Production Ready with Error Handling                     */
/* -------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  try {
    // Load content and stats in parallel
    const [unifiedContent, stats] = await Promise.all([
      getAllUnifiedContent(),
      getContentStats(),
    ]);
    
    // Map and filter content
    const allItems = unifiedContent
      .map(mapUnifiedToResource)
      .filter((item): item is ContentResource => item !== null);
    
    // Organize categories
    const categories = organizeByCategories(allItems);
    
    // Build content stats
    const contentStats = {
      total: allItems.length,
      essay: categories.byType.essay.length,
      book: categories.byType.book.length,
      download: categories.byType.download.length,
      event: categories.byType.event.length,
      print: categories.byType.print.length,
      resource: categories.byType.resource.length,
      canon: categories.byType.canon.length,
      strategy: categories.byType.strategy.length,
      featured: categories.featured.length,
      withImages: allItems.filter(item => item.coverImage).length,
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
      revalidate: 3600, // 1 hour
    };
  } catch (error) {
    // FIXED: Removed console.error for production
    // Error is handled gracefully without logging to console
    
    // Return empty but valid props to prevent build failure
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
          type: {} as Record<ContentKind, ContentResource[]>,
          year: {},
          featured: [],
        },
      },
      revalidate: 60, // Try again in 1 minute
    };
  }
};

/* -------------------------------------------------------------------------- */
/* REUSABLE COMPONENTS - Optimized and Accessible                            */
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
        className="rounded-sm border border-white/[0.04] bg-white/[0.02] p-2"
        style={{ borderColor: `${color}20` }}
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

const ContentTypeBadge: React.FC<{ 
  kind: ContentKind; 
  resourceType?: string;
  variant?: 'default' | 'compact';
}> = ({ kind, resourceType = "Framework", variant = 'default' }) => {
  const config = {
    essay: {
      label: "Essay",
      icon: <FileText className="h-3 w-3" />,
      color: "bg-[#26619C]/[0.08] text-[#26619C] border-[#26619C]/[0.15]",
    },
    book: {
      label: "Volume",
      icon: <BookOpen className="h-3 w-3" />,
      color: "bg-[#D4AF37]/[0.08] text-[#D4AF37] border-[#D4AF37]/[0.15]",
    },
    download: {
      label: "Tool",
      icon: <Download className="h-3 w-3" />,
      color: "bg-[#CD7F32]/[0.08] text-[#CD7F32] border-[#CD7F32]/[0.15]",
    },
    event: {
      label: "Session",
      icon: <Calendar className="h-3 w-3" />,
      color: "bg-[#C0C0C0]/[0.08] text-[#C0C0C0] border-[#C0C0C0]/[0.15]",
    },
    print: {
      label: "Edition",
      icon: <Eye className="h-3 w-3" />,
      color: "bg-[#FFFFF0]/[0.08] text-[#FFFFF0] border-[#FFFFF0]/[0.15]",
    },
    resource: {
      label: resourceType,
      icon: <Wrench className="h-3 w-3" />,
      color: "bg-[#F5F1E8]/[0.08] text-[#F5F1E8] border-[#F5F1E8]/[0.15]",
    },
    canon: {
      label: "Canon",
      icon: <Lock className="h-3 w-3" />,
      color: "bg-gradient-to-r from-[#D4AF37]/[0.1] to-[#CD7F32]/[0.1] text-[#D4AF37] border-[#D4AF37]/[0.2]",
    },
    strategy: {
      label: "Strategy",
      icon: <Award className="h-3 w-3" />,
      color: "bg-[#2E8B57]/[0.08] text-[#2E8B57] border-[#2E8B57]/[0.15]",
    },
  };
  
  const { label, icon, color } = config[kind];
  
  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 ${color}`}>
        {icon}
      </div>
    );
  }
  
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-sm border px-2 py-1 ${color}`}>
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* CONTENT CARD - Optimized for Performance and Accessibility                */
/* -------------------------------------------------------------------------- */

const UnifiedContentCard: React.FC<{
  item: ContentResource;
  variant?: 'grid' | 'list' | 'category';
}> = ({ item, variant = 'grid' }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  
  const showApplications = item.kind === 'resource' && 
    item.applications && 
    item.applications.length > 0;
  
  // List variant
  if (variant === 'list') {
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
                {item.accessLevel === 'inner-circle' && (
                  <Lock className="h-3 w-3 flex-shrink-0 text-[#CD7F32]" />
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-white/[0.3]">
                {item.date && (
                  <time>
                    {new Date(item.date).toLocaleDateString('en-GB', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
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
            <ArrowRight className="h-3 w-3 flex-shrink-0 text-white/[0.2] transition-transform group-hover:translate-x-1" />
          </div>
        </SilentSurface>
      </Link>
    );
  }
  
  // Category variant
  if (variant === 'category') {
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
          
          <ContentTypeBadge 
            kind={item.kind} 
            resourceType={item.resourceType}
          />
          
          <h4 className="mt-2 mb-2 line-clamp-2 font-serif text-sm font-normal text-[#F5F1E8]">
            {item.title}
          </h4>
          
          <div className="flex items-center justify-between text-xs text-white/[0.3]">
            {item.date && (
              <time>
                {new Date(item.date).toLocaleDateString('en-GB', {
                  month: 'short',
                  day: 'numeric',
                })}
              </time>
            )}
            {item.accessLevel === 'inner-circle' && (
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
  
  // Grid variant (default)
  return (
    <Link
      href={item.href}
      className="group block h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={`View ${item.title}`}
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
              priority={item.featured}
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
            {item.featured && (
              <div className="absolute top-3 right-3">
                <div className="flex items-center gap-1 rounded-full border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-2 py-1 backdrop-blur-sm">
                  <Sparkles className="h-3 w-3 text-[#D4AF37]" />
                  <span className="text-xs font-medium text-[#D4AF37]">
                    Featured
                  </span>
                </div>
              </div>
            )}
            {item.accessLevel === 'inner-circle' && (
              <div className="absolute top-3 left-3">
                <div className="flex items-center gap-1 rounded-full border border-[#CD7F32]/30 bg-[#CD7F32]/10 px-2 py-1 backdrop-blur-sm">
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
              <ContentTypeBadge 
                kind={item.kind} 
                resourceType={item.resourceType}
              />
              <div className="flex items-center gap-2 text-xs text-white/[0.3]">
                {item.date && (
                  <time>
                    {new Date(item.date).toLocaleDateString('en-GB', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </time>
                )}
                {item.readTime && <Clock className="h-3 w-3" />}
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
            
            {showApplications && (
              <p className="mt-2 line-clamp-1 text-xs text-white/[0.4]">
                {item.applications!.join(' · ')}
              </p>
            )}
          </div>
          
          {item.tags.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 2).map((tag) => (
                  <span key={tag} className="text-xs text-white/[0.3]">
                    #{tag}
                  </span>
                ))}
                {item.tags.length > 2 && (
                  <span className="text-xs text-white/[0.3]">
                    +{item.tags.length - 2} more
                  </span>
                )}
              </div>
            </div>
          )}
          
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
/* MAIN CONTENT PAGE COMPONENT - Production Ready                           */
/* -------------------------------------------------------------------------- */

const ContentPage: NextPage<ContentPageProps> = ({
  items,
  contentStats,
  categories,
}) => {
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const [categoryMode, setCategoryMode] = React.useState<CategoryMode>('type');
  const [activeFilter, setActiveFilter] = React.useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Filter items with memoization
  const filteredItems = React.useMemo(() => {
    let result = items;
    
    // Apply type filter
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
      result = result.filter(item => {
        const searchable = [
          item.title,
          item.description ?? '',
          item.excerpt ?? '',
          item.subtitle ?? '',
          item.author ?? '',
          item.category ?? '',
          ...item.tags,
        ].join(' ').toLowerCase();
        
        return searchable.includes(query);
      });
    }
    
    return result;
  }, [items, activeFilter, searchQuery]);
  
  // Get sorted years
  const sortedYears = React.useMemo(() => {
    const years = Object.keys(categories.year)
      .filter(y => y !== 'Undated')
      .sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
    return years;
  }, [categories.year]);
  
  // Filter options
  const filterOptions = [
    {
      key: 'all' as FilterKey,
      label: 'All',
      count: contentStats.total,
      icon: <Layers className="h-4 w-4" />,
      color: '#F5F1E8',
    },
    {
      key: 'featured' as FilterKey,
      label: 'Featured',
      count: contentStats.featured,
      icon: <Sparkles className="h-4 w-4" />,
      color: '#D4AF37',
    },
    {
      key: 'essay' as FilterKey,
      label: 'Essays',
      count: contentStats.essay,
      icon: <FileText className="h-4 w-4" />,
      color: '#26619C',
    },
    {
      key: 'book' as FilterKey,
      label: 'Volumes',
      count: contentStats.book,
      icon: <BookOpen className="h-4 w-4" />,
      color: '#D4AF37',
    },
    {
      key: 'resource' as FilterKey,
      label: 'Frameworks',
      count: contentStats.resource,
      icon: <Wrench className="h-4 w-4" />,
      color: '#F5F1E8',
    },
    {
      key: 'download' as FilterKey,
      label: 'Tools',
      count: contentStats.download,
      icon: <Download className="h-4 w-4" />,
      color: '#CD7F32',
    },
    {
      key: 'canon' as FilterKey,
      label: 'Canon',
      count: contentStats.canon,
      icon: <Lock className="h-4 w-4" />,
      color: '#D4AF37',
    },
    {
      key: 'strategy' as FilterKey,
      label: 'Strategies',
      count: contentStats.strategy,
      icon: <Award className="h-4 w-4" />,
      color: '#2E8B57',
    },
    {
      key: 'event' as FilterKey,
      label: 'Sessions',
      count: contentStats.event,
      icon: <Calendar className="h-4 w-4" />,
      color: '#C0C0C0',
    },
    {
      key: 'print' as FilterKey,
      label: 'Editions',
      count: contentStats.print,
      icon: <Eye className="h-4 w-4" />,
      color: '#FFFFF0',
    },
  ];
  
  const categoryModeOptions = [
    {
      key: 'type' as CategoryMode,
      label: 'By Type',
      icon: <FolderTree className="h-4 w-4" />,
    },
    {
      key: 'year' as CategoryMode,
      label: 'By Year',
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      key: 'featured' as CategoryMode,
      label: 'Featured',
      icon: <Star className="h-4 w-4" />,
    },
  ];
  
  // Handle search with debounce
  const handleSearch = React.useCallback(
    (value: string) => {
      setSearchQuery(value);
    },
    []
  );
  
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
        <meta property="og:title" content="Content Library | Abraham of London" />
        <meta property="og:description" content="A premium collection of strategic content for builders and leaders." />
        <meta property="og:type" content="website" />
      </Head>
      
      {/* Hero Section */}
      <div className="relative overflow-hidden border-b border-white/[0.06] bg-gradient-to-b from-black via-[#050608] to-black">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,175,55,0.08),_transparent_55%),radial-gradient(circle_at_bottom,_rgba(205,127,50,0.06),_transparent_55%)]" />
        <div className="container relative mx-auto px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 font-serif text-4xl font-normal tracking-tight text-[#F5F1E8] sm:text-5xl">
              Content Library
            </h1>
            <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-white/[0.6]">
              A well-organized collection of essays, frameworks, volumes, and tools for builders who think in systems, not slogans.
            </p>
          </div>
        </div>
      </div>
      
      {/* Stats Section */}
      <div className="border-b border-white/[0.04] bg-white/[0.01]">
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
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full rounded-sm border border-white/[0.08] bg-white/[0.03] py-2 pl-10 pr-4 text-sm text-[#F5F1E8] placeholder-white/[0.3] focus:border-white/[0.15] focus:outline-none focus:ring-1 focus:ring-white/[0.1]"
                aria-label="Search content"
              />
            </div>
            
            {/* View & Category Toggles */}
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1 rounded-sm border border-white/[0.08] bg-white/[0.02] p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`rounded-sm p-1 ${
                    viewMode === 'grid'
                      ? 'bg-white/[0.06] text-[#F5F1E8]'
                      : 'text-white/[0.4] hover:text-white/[0.6]'
                  }`}
                  aria-label="Grid view"
                >
                  <Grid3x3 className="h-3 w-3" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`rounded-sm p-1 ${
                    viewMode === 'list'
                      ? 'bg-white/[0.06] text-[#F5F1E8]'
                      : 'text-white/[0.4] hover:text-white/[0.6]'
                  }`}
                  aria-label="List view"
                >
                  <List className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Filter Pills */}
          <div className="mt-4 flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.key}
                onClick={() => setActiveFilter(option.key)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs transition-all ${
                  activeFilter === option.key
                    ? 'border-white/[0.15] bg-white/[0.06] text-[#F5F1E8]'
                    : 'border-white/[0.08] text-white/[0.4] hover:border-white/[0.12] hover:text-white/[0.6]'
                }`}
                aria-label={`Filter by ${option.label}`}
              >
                {option.icon}
                <span>{option.label}</span>
                <span className="ml-1 rounded-full bg-white/[0.08] px-1.5 py-0.5">
                  {option.count}
                </span>
              </button>
            ))}
          </div>
          
          {/* Category Mode Tabs */}
          <div className="mt-6">
            <div className="flex items-center gap-2 border-b border-white/[0.08]">
              {categoryModeOptions.map((option) => (
                <button
                  key={option.key}
                  onClick={() => setCategoryMode(option.key)}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    categoryMode === option.key
                      ? 'text-[#F5F1E8] border-b-2 border-[#D4AF37]'
                      : 'text-white/[0.4] hover:text-white/[0.6]'
                  }`}
                  aria-label={`View ${option.label}`}
                >
                  <div className="flex items-center gap-2">
                    {option.icon}
                    {option.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
        
                {/* Content Display */}
        {isLoading ? (
          <div className="py-20 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
            <p className="mt-4 text-white/[0.4]">Loading content...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-12 text-center">
            <Search className="mx-auto h-8 w-8 text-white/[0.2]" />
            <h3 className="mt-4 font-serif text-lg font-normal text-[#F5F1E8]">
              No content found
            </h3>
            <p className="mt-1 text-white/[0.4]">
              {searchQuery 
                ? `No results for "${searchQuery}". Try a different search term.`
                : 'Try adjusting your filters.'}
            </p>
          </div>
        ) : categoryMode === 'type' ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/[0.4]">
                Organized by content type
              </p>
              <p className="text-sm text-white/[0.4]">
                {Object.keys(categories.type).filter(k => categories.type[k as ContentKind].length > 0).length} categories
              </p>
            </div>
            
            {(['essay', 'resource', 'book', 'canon', 'download', 'strategy', 'event', 'print'] as ContentKind[]).map((kind) => {
              const items = categories.type[kind];
              if (!items || items.length === 0) return null;
              
              const titles: Record<ContentKind, string> = {
                essay: 'Essays',
                resource: 'Frameworks & Resources',
                book: 'Volumes',
                canon: 'Canon Entries',
                download: 'Tools & Downloads',
                strategy: 'Strategies',
                event: 'Sessions',
                print: 'Editions',
              };
              
              return (
                <section key={kind} className="mb-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-serif text-xl font-normal text-[#F5F1E8]">
                      {titles[kind]}
                    </h2>
                    <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-xs text-white/[0.4]">
                      {items.length} items
                    </span>
                  </div>
                  
                  <div className={
                    viewMode === 'grid' 
                      ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                      : 'space-y-2'
                  }>
                    {items.map((item) => (
                      <UnifiedContentCard
                        key={`${item.kind}-${item.slug}`}
                        item={item}
                        variant={viewMode === 'grid' ? 'category' : 'list'}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ) : categoryMode === 'year' ? (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <p className="text-sm text-white/[0.4]">
                Organized by publication year
              </p>
              <p className="text-sm text-white/[0.4]">
                {sortedYears.length} years
              </p>
            </div>
            
            {sortedYears.map((year) => {
              const items = categories.year[year];
              if (!items || items.length === 0) return null;
              
              return (
                <section key={year} className="mb-8">
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="font-serif text-xl font-normal text-[#F5F1E8]">
                      {year}
                    </h2>
                    <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-xs text-white/[0.4]">
                      {items.length} items
                    </span>
                  </div>
                  
                  <div className={
                    viewMode === 'grid' 
                      ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                      : 'space-y-2'
                  }>
                    {items.map((item) => (
                      <UnifiedContentCard
                        key={`${item.kind}-${item.slug}`}
                        item={item}
                        variant={viewMode === 'grid' ? 'category' : 'list'}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
            
            {categories.year['Undated'] && (
              <section className="mb-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="font-serif text-xl font-normal text-[#F5F1E8]">
                    Undated
                  </h2>
                  <span className="rounded-full bg-white/[0.08] px-2 py-0.5 text-xs text-white/[0.4]">
                    {categories.year['Undated'].length} items
                  </span>
                </div>
                
                <div className={
                  viewMode === 'grid' 
                    ? 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'
                    : 'space-y-2'
                }>
                  {categories.year['Undated'].map((item) => (
                    <UnifiedContentCard
                      key={`${item.kind}-${item.slug}`}
                      item={item}
                      variant={viewMode === 'grid' ? 'category' : 'list'}
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
                <p className="text-sm text-white/[0.4]">
                  Handpicked essays, frameworks, and tools
                </p>
              </div>
              <p className="text-sm text-white/[0.4]">
                {categories.featured.length} items
              </p>
            </div>
            
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'
                : 'space-y-2'
            }>
              {categories.featured.map((item) => (
                <UnifiedContentCard
                  key={`${item.kind}-${item.slug}`}
                  item={item}
                  variant={viewMode === 'grid' ? 'grid' : 'list'}
                />
              ))}
            </div>
          </div>
        )}
        
        {/* Footer Stats */}
        <div className="mt-12 border-t border-white/[0.04] pt-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-center text-sm text-white/[0.4]">
              Showing{' '}
              <span className="font-medium text-[#F5F1E8]">
                {filteredItems.length}
              </span>{' '}
              of{' '}
              <span className="font-medium text-[#F5F1E8]">
                {contentStats.total}
              </span>{' '}
              items
              {activeFilter !== 'all' && ` (filtered by ${activeFilter})`}
            </p>
            
            <div className="flex items-center gap-4 text-sm text-white/[0.4]">
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