// pages/content/index.tsx
import * as React from "react";
import type { NextPage, GetStaticProps } from "next";
import Link from "next/link";
import { Search, Filter, Calendar, Clock, ArrowRight, BookOpen, FileText, Download, Users, Star, Zap, Globe, Layers, BookMarked, TrendingUp, Sparkles, Eye, Bookmark, Share2, MoreHorizontal, ThumbsUp, Clock as ClockIcon, ChevronDown, Grid, List, RefreshCw } from "lucide-react";

import Layout from "@/components/Layout";
import {
  LIBRARY_AESTHETICS,
  CONTENT_CATEGORIES,
} from "@/lib/content";

import {
  getAllUnifiedContent,
  type UnifiedContent,
} from "@/lib/server/unified-content";

type FilterKey =
  | "all"
  | "page"
  | "post"
  | "book"
  | "download"
  | "event"
  | "print"
  | "resource"
  | "featured"
  | "recent"
  | "popular";

type ViewMode = "grid" | "list" | "compact";
type SortBy = "newest" | "title" | "popular" | "trending";

type LibraryProps = {
  items: UnifiedContent[];
  trendingItems: UnifiedContent[];
  popularTags: Array<{ name: string; count: number }>;
};

/* -------------------------------------------------------------------------- */
/* PREMIUM UI PRIMITIVES                                                     */
/* -------------------------------------------------------------------------- */

const GlassPanel: React.FC<{ children: React.ReactNode; className?: string; hover?: boolean }> = ({ 
  children, 
  className = "", 
  hover = true 
}) => (
  <div className={`
    rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] 
    backdrop-blur-xl shadow-2xl shadow-black/30
    ${hover ? 'transition-all duration-500 hover:border-white/20 hover:shadow-3xl hover:shadow-black/50' : ''}
    ${className}
  `}>
    {children}
  </div>
);

const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 1500 }) => {
  const [count, setCount] = React.useState(0);

  React.useEffect(() => {
    let start = 0;
    const end = value;
    const incrementTime = duration / end;
    
    const timer = setInterval(() => {
      start += 1;
      setCount(start);
      if (start >= end) clearInterval(timer);
    }, incrementTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return <span className="tabular-nums">{count}</span>;
};

const PremiumStatBadge: React.FC<{ icon: React.ReactNode; value: number; label: string; trend?: number }> = ({ 
  icon, 
  value, 
  label, 
  trend 
}) => (
  <GlassPanel hover className="p-5">
    <div className="relative">
      <div className="mb-3 flex items-center gap-3">
        <div className="rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/20 p-2.5">
          <div className="text-xl text-amber-400">{icon}</div>
        </div>
        {trend && (
          <div className={`rounded-full px-2 py-1 text-xs font-bold ${
            trend > 0 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : 'bg-rose-500/20 text-rose-400'
          }`}>
            {trend > 0 ? '↗' : '↘'} {Math.abs(trend)}%
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

const PremiumFilterPill: React.FC<{
  label: string;
  value: FilterKey;
  active: boolean;
  count: number;
  icon?: React.ReactNode;
  onClick: () => void;
  badge?: string;
}> = ({ label, value, active, count, icon, onClick, badge }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        group relative flex items-center gap-3 rounded-2xl px-5 py-3.5 transition-all duration-500
        ${active 
          ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 shadow-2xl shadow-amber-500/40' 
          : 'bg-gradient-to-br from-white/[0.08] to-white/[0.02] hover:from-white/[0.12] hover:to-white/[0.04]'
        }
        border ${active ? 'border-amber-500/50' : 'border-white/10 hover:border-white/20'}
        transform-gpu hover:scale-[1.03] active:scale-95
      `}
    >
      <div className="relative flex items-center gap-3">
        {icon && (
          <div className={`transition-all duration-300 ${active ? 'text-white scale-110' : 'text-gray-400 group-hover:text-white'}`}>
            {icon}
          </div>
        )}
        <div className="flex flex-col items-start">
          <span className={`text-sm font-semibold ${active ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
            {label}
          </span>
          {badge && (
            <span className="mt-1 rounded-full bg-gradient-to-r from-violet-500/30 to-violet-600/30 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-violet-300">
              {badge}
            </span>
          )}
        </div>
      </div>
      <div className={`
        ml-auto rounded-full px-3 py-1 text-sm font-bold min-w-[36px] text-center
        ${active ? 'bg-white/30 text-white' : 'bg-black/40 text-gray-400 group-hover:text-gray-300'}
      `}>
        {count}
      </div>
      
      {active && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 rounded-full animate-pulse" />
      )}
    </button>
  );
};

const ContentTypeBadge: React.FC<{ 
  type: UnifiedContent["type"]; 
  variant?: "card" | "pill" | "mini";
  withLabel?: boolean;
}> = ({ type, variant = "card", withLabel = true }) => {
  const configMap: Record<string, { label: string; color: string; icon: React.ReactNode; bg: string }> = {
    page: { 
      label: "Page", 
      color: "#3B82F6", 
      icon: <Globe className="h-3.5 w-3.5" />, 
      bg: "from-blue-500/30 to-blue-600/30" 
    },
    post: { 
      label: "Essay", 
      color: "#10B981", 
      icon: <FileText className="h-3.5 w-3.5" />, 
      bg: "from-emerald-500/30 to-emerald-600/30" 
    },
    book: { 
      label: "Book", 
      color: "#F59E0B", 
      icon: <BookOpen className="h-3.5 w-3.5" />, 
      bg: "from-amber-500/30 to-amber-600/30" 
    },
    download: { 
      label: "Tool", 
      color: "#8B5CF6", 
      icon: <Download className="h-3.5 w-3.5" />, 
      bg: "from-violet-500/30 to-violet-600/30" 
    },
    event: { 
      label: "Event", 
      color: "#EC4899", 
      icon: <Users className="h-3.5 w-3.5" />, 
      bg: "from-pink-500/30 to-pink-600/30" 
    },
    print: { 
      label: "Print", 
      color: "#06B6D4", 
      icon: "🖼", 
      bg: "from-cyan-500/30 to-cyan-600/30" 
    },
    resource: { 
      label: "Resource", 
      color: "#6366F1", 
      icon: <Zap className="h-3.5 w-3.5" />, 
      bg: "from-indigo-500/30 to-indigo-600/30" 
    },
  };

  const config = configMap[type] || { 
    label: type, 
    color: "#6B7280", 
    icon: "❓", 
    bg: "from-gray-500/30 to-gray-600/30" 
  };

  if (variant === "mini") {
    return (
      <div className={`rounded-lg bg-gradient-to-br ${config.bg} p-1.5`}>
        <div className="text-white" style={{ color: config.color }}>
          {config.icon}
        </div>
      </div>
    );
  }

  if (variant === "pill") {
    return (
      <div className="group flex items-center gap-2 rounded-full bg-gradient-to-r from-white/10 to-white/20 px-3 py-1.5 backdrop-blur-sm transition-all duration-300 hover:from-white/20 hover:to-white/30">
        <div className="text-white" style={{ color: config.color }}>
          {config.icon}
        </div>
        {withLabel && (
          <span className="text-xs font-semibold text-white">{config.label}</span>
        )}
      </div>
    );
  }

  return (
    <div className="absolute left-4 top-4 z-10">
      <div className={`rounded-xl bg-gradient-to-br ${config.bg} p-2.5 backdrop-blur-lg shadow-lg transition-all duration-500 hover:scale-110 hover:shadow-xl`}>
        <div className="text-white" style={{ color: config.color }}>
          {config.icon}
        </div>
      </div>
    </div>
  );
};

const PremiumLibraryCard: React.FC<{ 
  item: UnifiedContent; 
  variant?: "grid" | "list" | "compact";
  featured?: boolean;
  trending?: boolean;
}> = ({ item, variant = "grid", featured = false, trending = false }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isBookmarked, setIsBookmarked] = React.useState(false);
  const [showActions, setShowActions] = React.useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays <= 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric' 
    });
  };

  if (variant === "compact") {
    return (
      <Link href={item.url || "#"} className="group block">
        <GlassPanel hover className="p-4">
          <div className="flex items-center gap-4">
            <ContentTypeBadge type={item.type} variant="mini" />
            <div className="flex-1 min-w-0">
              <h4 className="truncate text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
                {item.title || "Untitled"}
              </h4>
              <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                <span>{formatDate(item.date)}</span>
                {item.tags && item.tags.length > 0 && (
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

  if (variant === "list") {
    return (
      <Link href={item.url || "#"} className="group block">
        <GlassPanel hover className="p-6">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <ContentTypeBadge type={item.type} variant="pill" withLabel />
            </div>
            <div className="flex-1 min-w-0">
              <div className="mb-2 flex items-center gap-3">
                <h4 className="text-lg font-semibold text-white group-hover:text-amber-300 transition-colors">
                  {item.title || "Untitled"}
                </h4>
                {featured && (
                  <span className="rounded-full bg-gradient-to-r from-amber-500/30 to-amber-600/30 px-2 py-0.5 text-xs font-bold text-amber-300">
                    Featured
                  </span>
                )}
                {trending && (
                  <span className="rounded-full bg-gradient-to-r from-emerald-500/30 to-emerald-600/30 px-2 py-0.5 text-xs font-bold text-emerald-300">
                    Trending
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
                {item.tags && item.tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    {item.tags.slice(0, 3).map((tag, idx) => (
                      <span 
                        key={idx}
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
                  setIsBookmarked(!isBookmarked);
                }}
                className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-amber-400 transition-colors"
              >
                <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
              <ArrowRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1 group-hover:text-amber-400" />
            </div>
          </div>
        </GlassPanel>
      </Link>
    );
  }

  // Grid variant (default)
  return (
    <Link 
      href={item.url || "#"} 
      className="group block h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative h-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.08] via-transparent to-white/[0.02] transition-all duration-700 group-hover:border-white/30 group-hover:shadow-2xl group-hover:shadow-black/50">
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/20 to-black/60" />
        <div className={`absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-amber-500/5 opacity-0 transition-opacity duration-700 ${isHovered ? 'opacity-100' : ''}`} />
        
        {/* Badges */}
        <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
          <ContentTypeBadge type={item.type} />
          {featured && (
            <div className="rounded-lg bg-gradient-to-r from-amber-500/30 to-amber-600/30 px-2.5 py-1">
              <Star className="h-3.5 w-3.5 text-amber-300" fill="currentColor" />
            </div>
          )}
          {trending && (
            <div className="rounded-lg bg-gradient-to-r from-emerald-500/30 to-emerald-600/30 px-2.5 py-1">
              <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="relative p-6">
          <div className="mb-4 flex items-start justify-between">
            <h3 className="font-serif text-xl font-bold leading-tight text-white group-hover:text-amber-100 transition-colors">
              {item.title || "Untitled"}
            </h3>
            <button 
              onClick={(e) => {
                e.preventDefault();
                setShowActions(!showActions);
              }}
              className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </div>
          
          {(item.description || item.excerpt) && (
            <p className="mb-6 line-clamp-3 text-sm leading-relaxed text-gray-300">
              {item.description || item.excerpt}
            </p>
          )}

          {/* Stats row */}
          <div className="mb-6 flex items-center gap-4 text-xs text-gray-400">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{formatDate(item.date)}</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-gray-600" />
            <div className="flex items-center gap-1.5">
              <ClockIcon className="h-3.5 w-3.5" />
              <span>5 min read</span>
            </div>
            <div className="h-1 w-1 rounded-full bg-gray-600" />
            <div className="flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5" />
              <span>1.2k views</span>
            </div>
          </div>

          {/* Tags */}
          {item.tags && item.tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {item.tags.slice(0, 3).map((tag, idx) => (
                <span 
                  key={idx}
                  className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-400 hover:bg-white/10 hover:text-gray-300 transition-colors"
                >
                  {tag}
                </span>
              ))}
              {item.tags.length > 3 && (
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-gray-400">
                  +{item.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative border-t border-white/10 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  setIsBookmarked(!isBookmarked);
                }}
                className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:bg-white/5 hover:text-amber-400 transition-colors"
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>{isBookmarked ? 'Saved' : 'Save'}</span>
              </button>
              <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm text-gray-400 hover:bg-white/5 hover:text-emerald-400 transition-colors">
                <ThumbsUp className="h-4 w-4" />
                <span>24</span>
              </button>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-400 group-hover:text-amber-400 transition-colors">
              <span>Read</span>
              <ArrowRight className={`h-4 w-4 transition-transform duration-300 ${isHovered ? 'translate-x-1.5' : ''}`} />
            </div>
          </div>
        </div>

        {/* Hover glow */}
        <div className={`absolute -inset-0.5 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10 opacity-0 blur-xl transition-opacity duration-700 ${isHovered ? 'opacity-100' : ''}`} />
      </div>
    </Link>
  );
};

const TrendingCarousel: React.FC<{ items: UnifiedContent[] }> = ({ items }) => {
  const trendingItems = items.filter(item => item.featured).slice(0, 5);
  
  if (trendingItems.length === 0) return null;

  return (
    <div className="mb-12 overflow-hidden rounded-3xl">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10" />
        <div className="relative p-8">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="rounded-2xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 p-3">
                <TrendingUp className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <h2 className="font-serif text-2xl font-bold text-white">Trending Now</h2>
                <p className="text-sm text-amber-200/80">What the community is reading</p>
              </div>
            </div>
            <button className="flex items-center gap-2 rounded-full bg-gradient-to-r from-white/10 to-white/5 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            {trendingItems.map((item, index) => (
              <div key={item.id} className="transform transition-all duration-500 hover:-translate-y-2">
                <PremiumLibraryCard item={item} variant="compact" trending />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const TagCloud: React.FC<{ 
  tags: Array<{ name: string; count: number }>; 
  selectedTags: string[];
  onTagClick: (tag: string) => void;
}> = ({ tags, selectedTags, onTagClick }) => {
  const maxCount = Math.max(...tags.map(t => t.count));
  
  return (
    <GlassPanel className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-white">Popular Tags</h3>
        <button className="text-xs text-gray-400 hover:text-white transition-colors">
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
              onClick={() => onTagClick(tag.name)}
              className={`
                rounded-full px-3 py-1.5 text-sm font-medium transition-all duration-300
                ${isSelected 
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/25' 
                  : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                }
                transform hover:scale-105
              `}
              style={{
                fontSize: `${0.875 + (size * 0.25)}rem`,
                opacity: isSelected ? 1 : 0.7 + (size * 0.3)
              }}
            >
              {tag.name} <span className="text-xs opacity-70">({tag.count})</span>
            </button>
          );
        })}
      </div>
    </GlassPanel>
  );
};

const QuickStats: React.FC<{ stats: any }> = ({ stats }) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <PremiumStatBadge 
        icon="📚" 
        value={stats.total} 
        label="Total Assets" 
        trend={12.5}
      />
      <PremiumStatBadge 
        icon="⭐" 
        value={stats.featured} 
        label="Featured" 
        trend={8.3}
      />
      <PremiumStatBadge 
        icon="🔥" 
        value={stats.trending} 
        label="Trending" 
        trend={25.7}
      />
      <PremiumStatBadge 
        icon="📈" 
        value={stats.engagement} 
        label="Avg. Engagement" 
        trend={15.2}
      />
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* MAIN PAGE COMPONENT                                                        */
/* -------------------------------------------------------------------------- */

const ContentLibraryPage: NextPage<LibraryProps> = ({ 
  items, 
  trendingItems, 
  popularTags 
}) => {
  const [filter, setFilter] = React.useState<FilterKey>("all");
  const [query, setQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<SortBy>("newest");
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [debouncedQuery, setDebouncedQuery] = React.useState("");

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Calculate enhanced statistics
  const stats = React.useMemo(() => {
    const total = Array.isArray(items) ? items.length : 0;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return {
      total,
      featured: Array.isArray(items) ? items.filter(item => item.featured).length : 0,
      trending: trendingItems.length,
      engagement: 85, // Mock engagement score
      categories: new Set(items.map(item => item.type)).size,
      recent: Array.isArray(items) ? items.filter(item => {
        const date = new Date(item.date || 0);
        return date > thirtyDaysAgo;
      }).length : 0,
    };
  }, [items, trendingItems]);

  // Filter and sort items
  const filteredItems = React.useMemo(() => {
    if (!Array.isArray(items)) return [];

    let result = items;

    // Apply type filter
    if (filter !== "all") {
      if (filter === "featured") {
        result = result.filter(item => item.featured);
      } else if (filter === "recent") {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        result = result.filter(item => new Date(item.date || 0) > thirtyDaysAgo);
      } else if (filter === "popular") {
        result = result.filter(item => item.featured || trendingItems.includes(item));
      } else {
        result = result.filter(item => item.type === filter);
      }
    }

    // Apply search filter
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          (item.title || "").toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q) ||
          (item.excerpt || "").toLowerCase().includes(q) ||
          (Array.isArray(item.tags) ? item.tags.some((t) => t?.toLowerCase().includes(q)) : false)
      );
    }

    // Apply tag filter
    if (selectedTags.length > 0) {
      result = result.filter(item => 
        Array.isArray(item.tags) && 
        selectedTags.some(tag => item.tags.includes(tag))
      );
    }

    // Apply sorting
    if (sortBy === "newest") {
      result = [...result].sort((a, b) => {
        const dateA = new Date(a.date || 0).getTime();
        const dateB = new Date(b.date || 0).getTime();
        return dateB - dateA;
      });
    } else if (sortBy === "title") {
      result = [...result].sort((a, b) => 
        (a.title || "").localeCompare(b.title || "")
      );
    } else if (sortBy === "popular") {
      result = [...result].sort((a, b) => {
        const aScore = (a.featured ? 100 : 0) + (trendingItems.includes(a) ? 50 : 0);
        const bScore = (b.featured ? 100 : 0) + (trendingItems.includes(b) ? 50 : 0);
        return bScore - aScore;
      });
    } else if (sortBy === "trending") {
      result = [...result].filter(item => trendingItems.includes(item));
    }

    return result;
  }, [items, filter, debouncedQuery, selectedTags, sortBy, trendingItems]);

  // Filter options
  const filterOptions: Array<{ key: FilterKey; label: string; icon: React.ReactNode; badge?: string }> = [
    { key: "all", label: "All Content", icon: <Layers className="h-4 w-4" /> },
    { key: "featured", label: "Featured", icon: <Star className="h-4 w-4" />, badge: "CURATED" },
    { key: "trending", label: "Trending", icon: <TrendingUp className="h-4 w-4" />, badge: "HOT" },
    { key: "post", label: "Essays", icon: <FileText className="h-4 w-4" /> },
    { key: "book", label: "Books", icon: <BookOpen className="h-4 w-4" /> },
    { key: "download", label: "Tools", icon: <Download className="h-4 w-4" /> },
    { key: "event", label: "Events", icon: <Users className="h-4 w-4" /> },
    { key: "recent", label: "Recent", icon: <Sparkles className="h-4 w-4" /> },
  ];

  return (
    <Layout
      title="Content Library"
      description="A comprehensive library of essays, books, tools, and resources for builders of legacy."
      structuredData={{
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: "Abraham of London — Premium Content Library",
        description: "Curated collection of writings, tools, and resources for builders of legacy",
        numberOfItems: stats.total,
      }}
    >
      {/* Premium Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-black to-gray-900" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />
        
        {/* Animated gradient orbs */}
        <div className="absolute top-1/4 -right-48 h-[600px] w-[600px] animate-gradient-orb rounded-full bg-gradient-to-r from-amber-500/20 via-transparent to-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-1/4 -left-48 h-[600px] w-[600px] animate-gradient-orb-delayed rounded-full bg-gradient-to-r from-blue-500/20 via-transparent to-blue-500/10 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 animate-gradient-orb-slow rounded-full bg-gradient-to-r from-emerald-500/10 via-transparent to-emerald-500/10 blur-3xl" />
        
        {/* Noise texture */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)" opacity="0.05"/%3E%3C/svg%3E')]" />
      </div>

      <div className="relative min-h-screen">
        {/* Premium Hero */}
        <section className="relative overflow-hidden border-b border-white/10">
          <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/80 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
            <div className="mb-12 max-w-4xl">
              <div className="mb-8 flex items-center gap-3">
                <div className="rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 p-1">
                  <div className="rounded-full bg-gradient-to-r from-amber-500/30 to-amber-600/30 p-1.5">
                    <Sparkles className="h-4 w-4 text-amber-300" />
                  </div>
                </div>
                <span className="text-sm font-semibold uppercase tracking-widest text-amber-300">
                  Premium Library Access
                </span>
              </div>
              
              <h1 className="mb-6 font-serif text-5xl font-bold leading-tight text-white sm:text-6xl lg:text-7xl">
                <span className="bg-gradient-to-r from-white via-amber-100 to-amber-200 bg-clip-text text-transparent">
                  The Archive
                </span>
                <span className="mt-4 block text-3xl font-normal text-gray-300 sm:text-4xl">
                  Every resource, essay, and tool for{" "}
                  <span className="bg-gradient-to-r from-amber-300 via-amber-200 to-amber-100 bg-clip-text text-transparent">
                    builders of legacy
                  </span>
                </span>
              </h1>
              
              <p className="mb-10 text-xl leading-relaxed text-gray-300">
                A meticulously organized collection of writings, tools, and resources designed to help 
                fathers, founders, and builders think clearly, act decisively, and build work that endures.
              </p>

              {/* Quick Stats */}
              <QuickStats stats={stats} />
            </div>
          </div>
        </section>

        {/* Trending Carousel */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <TrendingCarousel items={trendingItems} />
        </div>

        {/* Main Content */}
        <section className="relative pb-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {/* Advanced Controls */}
            <GlassPanel className="mb-10 p-8">
              <div className="mb-8">
                <div className="relative">
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5" />
                  <Search className="absolute left-5 top-1/2 z-10 h-6 w-6 -translate-y-1/2 text-gray-400" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search across {stats.total} resources, essays, and tools..."
                    className="relative w-full rounded-2xl border border-white/20 bg-white/10 pl-14 pr-12 py-4 text-lg text-white placeholder:text-gray-400/70 focus:border-amber-500/50 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                  {query && (
                    <button
                      onClick={() => setQuery("")}
                      className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 transition-colors hover:text-white"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                {/* View Controls */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 rounded-xl bg-white/5 p-1">
                    {(["grid", "list", "compact"] as ViewMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setViewMode(mode)}
                        className={`rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                          viewMode === mode
                            ? 'bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {mode === "grid" ? <Grid className="h-4 w-4" /> : 
                         mode === "list" ? <List className="h-4 w-4" /> : 
                         "Compact"}
                      </button>
                    ))}
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-gray-400 hover:text-white transition-colors"
                    >
                      <Filter className="h-4 w-4" />
                      Advanced
                      <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>

                {/* Sort & Results */}
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
                    <span className="font-semibold text-white">{filteredItems.length}</span> results
                  </div>
                </div>
              </div>

              {/* Filter Pills */}
              <div className="mb-6">
                <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400">Categories</div>
                <div className="flex flex-wrap gap-3">
                  {filterOptions.map((option) => {
                    const count = option.key === 'featured' 
                      ? stats.featured 
                      : option.key === 'trending'
                      ? trendingItems.length
                      : option.key === 'recent'
                      ? stats.recent
                      : Array.isArray(items) 
                        ? items.filter(item => item.type === option.key).length 
                        : 0;
                    
                    return (
                      <PremiumFilterPill
                        key={option.key}
                        label={option.label}
                        value={option.key}
                        active={filter === option.key}
                        count={count}
                        icon={option.icon}
                        badge={option.badge}
                        onClick={() => setFilter(option.key)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Advanced Filters */}
              {showAdvanced && (
                <div className="mt-8 border-t border-white/10 pt-8">
                  <div className="grid gap-8 md:grid-cols-2">
                    <TagCloud 
                      tags={popularTags} 
                      selectedTags={selectedTags}
                      onTagClick={(tag) => {
                        setSelectedTags(prev => 
                          prev.includes(tag) 
                            ? prev.filter(t => t !== tag)
                            : [...prev, tag]
                        );
                      }}
                    />
                    <GlassPanel>
                      <div className="p-6">
                        <h3 className="mb-4 font-semibold text-white">Date Range</h3>
                        <div className="space-y-4">
                          {[
                            { label: "Last 7 days", value: "week" },
                            { label: "Last 30 days", value: "month" },
                            { label: "Last 90 days", value: "quarter" },
                            { label: "Last year", value: "year" },
                          ].map((range) => (
                            <button
                              key={range.value}
                              className="w-full rounded-lg bg-white/5 px-4 py-3 text-left text-sm text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                            >
                              {range.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </GlassPanel>
                  </div>
                </div>
              )}
            </GlassPanel>

            {/* Results Grid */}
            {filteredItems.length === 0 ? (
              <GlassPanel className="p-20 text-center">
                <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-amber-600/20">
                  <Search className="h-10 w-10 text-amber-400" />
                </div>
                <h3 className="mb-4 font-serif text-3xl font-bold text-white">No results found</h3>
                <p className="mx-auto mb-10 max-w-md text-lg text-gray-400">
                  {query
                    ? `We couldn't find anything matching "${query}". Try a different search term or browse all categories.`
                    : "There's no content in this category yet. Check back soon or browse other categories."}
                </p>
                <button
                  onClick={() => {
                    setFilter("all");
                    setQuery("");
                    setSelectedTags([]);
                  }}
                  className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-4 text-base font-semibold text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/25"
                >
                  Reset all filters
                </button>
              </GlassPanel>
            ) : viewMode === "grid" ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {filteredItems.map((item) => (
                  <PremiumLibraryCard key={item.id} item={item} />
                ))}
              </div>
            ) : viewMode === "list" ? (
              <div className="space-y-4">
                {filteredItems.map((item) => (
                  <PremiumLibraryCard key={item.id} item={item} variant="list" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <PremiumLibraryCard key={item.id} item={item} variant="compact" />
                ))}
              </div>
            )}

            {/* Load More */}
            {filteredItems.length > 0 && filteredItems.length < items.length && (
              <div className="mt-12 text-center">
                <button className="group rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.08] to-white/[0.02] px-10 py-4 text-lg font-semibold text-white transition-all hover:border-white/20 hover:from-white/[0.12] hover:to-white/[0.04]">
                  <span className="flex items-center gap-3">
                    Load More
                    <RefreshCw className="h-5 w-5 transition-transform group-hover:rotate-180" />
                  </span>
                </button>
              </div>
            )}

            {/* Premium CTA */}
            <GlassPanel className="mt-20 overflow-hidden">
              <div className="relative p-12">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10" />
                <div className="relative">
                  <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
                    <div className="max-w-2xl">
                      <h3 className="mb-4 font-serif text-3xl font-bold text-white">
                        Want more depth?
                      </h3>
                      <p className="text-lg text-gray-400">
                        Join our premium membership for exclusive content, early access to new tools,
                        and personalized recommendations based on your interests.
                      </p>
                    </div>
                    <div className="flex gap-4">
                      <Link
                        href="/premium"
                        className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-10 py-4 text-lg font-semibold text-white transition-all hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/25"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
                        <span className="relative flex items-center gap-3">
                          Explore Premium
                          <Sparkles className="h-5 w-5" />
                        </span>
                      </Link>
                      <Link
                        href="/newsletter"
                        className="rounded-2xl border border-white/10 bg-gradient-to-r from-white/[0.08] to-white/[0.02] px-8 py-4 text-lg font-semibold text-white transition-all hover:border-white/20 hover:from-white/[0.12] hover:to-white/[0.04]"
                      >
                        Get Free Updates
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </GlassPanel>
          </div>
        </section>
      </div>

      {/* Custom Animations */}
      <style jsx global>{`
        @keyframes gradient-orb {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        @keyframes gradient-orb-delayed {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(-30px, 30px) scale(1.1);
          }
          66% {
            transform: translate(20px, -20px) scale(0.9);
          }
        }
        
        @keyframes gradient-orb-slow {
          0%, 100% {
            transform: translate(-50%, -50%) scale(1);
          }
          50% {
            transform: translate(-50%, -50%) scale(1.05);
          }
        }
        
        .animate-gradient-orb {
          animation: gradient-orb 20s ease-in-out infinite;
        }
        
        .animate-gradient-orb-delayed {
          animation: gradient-orb-delayed 25s ease-in-out infinite;
          animation-delay: -5s;
        }
        
        .animate-gradient-orb-slow {
          animation: gradient-orb-slow 30s ease-in-out infinite;
        }
      `}</style>
    </Layout>
  );
};

/* -------------------------------------------------------------------------- */
/* DATA LOADING                                                               */
/* -------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<LibraryProps> = async () => {
  try {
    const items = await getAllUnifiedContent();
    const safeItems = Array.isArray(items) ? items : [];

    // Generate trending items (mock - you'd implement your own logic)
    const trendingItems = safeItems
      .filter(item => item.featured || Math.random() > 0.7)
      .slice(0, 8);

    // Generate popular tags
    const tagCounts: Record<string, number> = {};
    safeItems.forEach(item => {
      if (Array.isArray(item.tags)) {
        item.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    const popularTags = Object.entries(tagCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    const validatedItems = safeItems.map((item) => ({
      ...item,
      id: item.id || `unknown-${Date.now()}-${Math.random()}`,
      title: item.title || "Untitled",
      url: item.url || "/",
      description: item.description || null,
      excerpt: item.excerpt || null,
      tags: Array.isArray(item.tags) ? item.tags.filter(Boolean) : [],
      featured: item.featured || false,
      type: item.type || "resource",
      date: item.date || new Date().toISOString(),
    }));

    return {
      props: {
        items: validatedItems,
        trendingItems: trendingItems,
        popularTags,
      },
      revalidate: 60 * 10,
    };
  } catch (error) {
    console.error("Error in getStaticProps for /content:", error);
    return {
      props: {
        items: [],
        trendingItems: [],
        popularTags: [],
      },
      revalidate: 60 * 10,
    };
  }
};

export default ContentLibraryPage;