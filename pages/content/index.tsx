// pages/content/index.tsx
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
} from "lucide-react";

import Layout from "@/components/Layout";
import {
  getAllUnifiedContent,
  type UnifiedContent,
} from "@/lib/server/unified-content";

/* -------------------------------------------------------------------------- */
/* SILENT SIGNAL DESIGN SYSTEM                                                */
/* -------------------------------------------------------------------------- */

// Premium color palette - silent, deep, intentional
const colors = {
  // Base backgrounds - deep charcoal with subtle warmth
  background: {
    primary: "bg-[#0A0A0A]", // Pure black with slight warmth
    secondary: "bg-[#111111]", // Near black
    tertiary: "bg-[#1A1A1A]", // Dark charcoal
  },
  // Accent colors - aged metals and rare earth tones
  accent: {
    parchment: "text-[#F5F1E8]", // Aged paper
    goldLeaf: "text-[#D4AF37]", // 24k gold
    silverBloom: "text-[#C0C0C0]", // Sterling silver
    bronzeAge: "text-[#CD7F32]", // Patinated bronze
    ivory: "text-[#FFFFF0]", // Aged ivory
    lapis: "text-[#26619C]", // Lapis lazuli
  },
  // Border colors - extremely subtle variations
  border: {
    primary: "border-white/[0.04]",
    secondary: "border-white/[0.02]",
    accent: "border-[#D4AF37]/[0.15]",
  },
  // Gradient overlays - barely perceptible
  gradient: {
    subtle: "bg-gradient-to-b from-white/[0.02] to-transparent",
    warm: "bg-gradient-to-b from-[#D4AF37]/[0.03] to-transparent",
  }
};

/* -------------------------------------------------------------------------- */
/* PREMIUM COMPONENTS - SILENT SIGNALS                                        */
/* -------------------------------------------------------------------------- */

// Subtle texture overlay for premium feel
const TextureOverlay: React.FC = () => (
  <div 
    className="absolute inset-0 pointer-events-none opacity-5"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
    }}
  />
);

// Premium glass effect with micro-texture
const SilentSurface: React.FC<{
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  priority?: "primary" | "secondary";
}> = ({ children, className = "", hover = true, priority = "secondary" }) => {
  const bgColor = priority === "primary" ? colors.background.primary : colors.background.secondary;
  
  return (
    <div
      className={`
        relative overflow-hidden
        ${bgColor}
        ${colors.border.primary}
        backdrop-blur-xs
        transition-all duration-700
        ${hover ? "hover:border-white/[0.06] hover:shadow-[0_8px_32px_rgba(0,0,0,0.4)]" : ""}
        ${className}
      `}
      style={{
        boxShadow: '0 1px 3px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.02)',
      }}
    >
      {/* Micro-gradient edge */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#D4AF37]/[0.02] to-transparent" />
      </div>
      
      <TextureOverlay />
      <div className="relative z-10">{children}</div>
    </div>
  );
};

// Premium badge with aged metal effect
const ContentTypeBadge: React.FC<{ kind: ContentKind }> = ({ kind }) => {
  const labels: Record<ContentKind, string> = {
    essay: "Essay",
    book: "Volume",
    download: "Tool",
    event: "Session",
    print: "Edition",
    resource: "Framework",
    canon: "Canon",
  };

  const colorSchemes: Record<ContentKind, { bg: string; text: string; border: string }> = {
    essay: {
      bg: "bg-[#26619C]/[0.08]",
      text: colors.accent.lapis,
      border: "border-[#26619C]/[0.15]",
    },
    book: {
      bg: "bg-[#D4AF37]/[0.08]",
      text: colors.accent.goldLeaf,
      border: "border-[#D4AF37]/[0.15]",
    },
    download: {
      bg: "bg-[#CD7F32]/[0.08]",
      text: colors.accent.bronzeAge,
      border: "border-[#CD7F32]/[0.15]",
    },
    event: {
      bg: "bg-[#C0C0C0]/[0.08]",
      text: colors.accent.silverBloom,
      border: "border-[#C0C0C0]/[0.15]",
    },
    print: {
      bg: "bg-[#FFFFF0]/[0.08]",
      text: colors.accent.ivory,
      border: "border-[#FFFFF0]/[0.15]",
    },
    resource: {
      bg: "bg-[#F5F1E8]/[0.08]",
      text: colors.accent.parchment,
      border: "border-[#F5F1E8]/[0.15]",
    },
    canon: {
      bg: "bg-gradient-to-r from-[#D4AF37]/[0.1] to-[#CD7F32]/[0.1]",
      text: colors.accent.goldLeaf,
      border: "border-[#D4AF37]/[0.2]",
    },
  };

  const scheme = colorSchemes[kind];

  return (
    <div className={`inline-flex items-center gap-2`}>
      <span
        className={`
          rounded-sm border px-2.5 py-1 text-xs font-medium tracking-[0.1em]
          transition-all duration-500
          ${scheme.bg} ${scheme.text} ${scheme.border}
          hover:scale-105 hover:border-opacity-30
        `}
        style={{
          letterSpacing: '0.08em',
          fontWeight: 450,
        }}
      >
        {labels[kind]}
      </span>
      <div className={`h-3 w-px ${scheme.bg}`} />
    </div>
  );
};

// Premium content card with silent signals
const ContentCard: React.FC<{
  item: ContentResource;
  variant?: "grid" | "compact";
}> = ({ item, variant = "grid" }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  if (variant === "compact") {
    return (
      <Link href={item.href} className="group">
        <SilentSurface className="p-4" hover>
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <ContentTypeBadge kind={item.kind} />
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
              <ContentTypeBadge kind={item.kind} />
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
          </div>

          {/* Tags - extremely subtle */}
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

          {/* Footer - premium details */}
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

// Premium stat item
const StatItem: React.FC<{
  value: number;
  label: string;
  icon: React.ReactNode;
}> = ({ value, label, icon }) => (
  <div className="relative">
    {/* Subtle background effect */}
    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.01] to-transparent rounded-lg" />
    
    <div className="relative text-center">
      <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/[0.03] bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="text-white/[0.3]">{icon}</div>
      </div>
      <div className="mb-1 font-serif text-3xl font-light text-[#F5F1E8] tracking-tight">
        {value}
      </div>
      <div 
        className="text-xs uppercase tracking-[0.15em] text-white/[0.3]"
        style={{
          letterSpacing: '0.1em',
        }}
      >
        {label}
      </div>
    </div>
  </div>
);

// Premium search input
const PremiumSearch: React.FC<{
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}> = ({ value, onChange, placeholder = "Search the archive..." }) => (
  <div className="relative max-w-xl">
    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 transition-opacity duration-500 focus-within:opacity-100" />
    <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/[0.2] transition-colors duration-500 focus-within:text-[#D4AF37]/60" />
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="relative w-full rounded-lg border border-white/[0.04] bg-black/[0.3] px-12 py-3.5 text-[#F5F1E8] placeholder-white/[0.15] outline-none transition-all duration-500 focus:border-[#D4AF37]/[0.15] focus:bg-black/[0.4]"
      style={{
        backdropFilter: 'blur(10px)',
      }}
    />
  </div>
);

/* -------------------------------------------------------------------------- */
/* MAIN PAGE COMPONENT                                                        */
/* -------------------------------------------------------------------------- */

const ContentPage: NextPage<ContentPageProps> = ({ items, contentStats }) => {
  const [activeFilter, setActiveFilter] = React.useState<FilterKey>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [viewMode, setViewMode] = React.useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = React.useState(false);
  const [debouncedQuery, setDebouncedQuery] = React.useState("");

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400); // Slightly longer for premium feel
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter items
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
      const query = debouncedQuery.toLowerCase();
      result = result.filter((item) => {
        const inTags = item.tags.some((tag) =>
          tag.toLowerCase().includes(query),
        );
        return (
          item.title.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query) ||
          item.subtitle?.toLowerCase().includes(query) ||
          item.excerpt?.toLowerCase().includes(query) ||
          inTags
        );
      });
    }

    return result;
  }, [items, activeFilter, debouncedQuery]);

  // Sort with featured first, then by date
  const sortedItems = React.useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      // Featured items first
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      
      // Then by date (newest first)
      const dateA = new Date(a.date || 0).getTime();
      const dateB = new Date(b.date || 0).getTime();
      return dateB - dateA;
    });
  }, [filteredItems]);

  const filterOptions = [
    { key: "all" as FilterKey, label: "All Works", count: contentStats.total, icon: <Layers className="h-4 w-4" /> },
    { key: "featured" as FilterKey, label: "Featured", count: contentStats.featured, icon: <Star className="h-4 w-4" /> },
    { key: "essay" as FilterKey, label: "Essays", count: contentStats.essay, icon: <FileText className="h-4 w-4" /> },
    { key: "book" as FilterKey, label: "Volumes", count: contentStats.book, icon: <BookOpen className="h-4 w-4" /> },
    { key: "download" as FilterKey, label: "Tools", count: contentStats.download, icon: <Download className="h-4 w-4" /> },
    { key: "event" as FilterKey, label: "Sessions", count: contentStats.event, icon: <Calendar className="h-4 w-4" /> },
    { key: "print" as FilterKey, label: "Editions", count: contentStats.print, icon: <Eye className="h-4 w-4" /> },
    { key: "resource" as FilterKey, label: "Frameworks", count: contentStats.resource, icon: <CheckCircle className="h-4 w-4" /> },
    { key: "canon" as FilterKey, label: "Canon", count: contentStats.canon, icon: <Lock className="h-4 w-4" /> },
  ];

  return (
    <Layout 
      pageTitle="Archive | Abraham of London"
      className={colors.background.primary}
    >
      <Head>
        <meta name="description" content="A curated archive of applied wisdom for builders of enduring work. Essays, volumes, frameworks, and tools." />
        <meta property="og:title" content="The Archive | Abraham of London" />
        <meta property="og:description" content="A collection of works designed for application, not consumption." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.abrahamoflondon.org/archive" />
        <meta property="og:image" content="/assets/images/og-archive.jpg" />
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@300;400;500;600&display=swap');
          .font-serif {
            font-family: 'Crimson Pro', serif;
          }
          ::selection {
            background: rgba(212, 175, 55, 0.15);
          }
        `}</style>
      </Head>

      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-white/[0.04]">
          {/* Background texture */}
          <div className="absolute inset-0">
            <TextureOverlay />
            <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
          </div>

          <div className="relative z-10 mx-auto max-w-7xl px-6 py-32">
            <div className="mx-auto max-w-4xl text-center">
              {/* Elegant divider */}
              <div className="mb-12 flex items-center justify-center">
                <div className="h-px w-20 bg-gradient-to-r from-transparent to-white/[0.1]" />
                <div className="mx-6 text-xs uppercase tracking-[0.3em] text-white/[0.3]">
                  The Archive
                </div>
                <div className="h-px w-20 bg-gradient-to-l from-transparent to-white/[0.1]" />
              </div>

              <h1 className="mb-8 font-serif text-5xl font-light text-[#F5F1E8] tracking-tight">
                Applied Wisdom,<br />
                <span className="text-[#D4AF37]/70">Archived for Builders</span>
              </h1>

              <p className="mx-auto mb-16 max-w-2xl text-lg leading-relaxed text-white/[0.5]">
                A curated collection of works designed not for consumption, 
                but for application in contexts that demand precision, 
                durability, and depth.
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
                <StatItem
                  value={contentStats.total}
                  label="Total Works"
                  icon={<Layers className="h-6 w-6" />}
                />
                <StatItem
                  value={contentStats.featured}
                  label="Featured"
                  icon={<Star className="h-6 w-6" />}
                />
                <StatItem
                  value={contentStats.book}
                  label="Volumes"
                  icon={<BookOpen className="h-6 w-6" />}
                />
                <StatItem
                  value={contentStats.canon}
                  label="Canon"
                  icon={<Lock className="h-6 w-6" />}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Controls - Premium */}
        <section className="border-b border-white/[0.04] py-10">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
              {/* Search */}
              <PremiumSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search across the archive..."
              />

              {/* View Controls */}
              <div className="flex items-center gap-4">
                {/* Filter toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2.5 rounded-lg border border-white/[0.04] bg-black/[0.3] px-4 py-3 text-sm text-white/[0.5] transition-all duration-500 hover:border-[#D4AF37]/[0.15] hover:text-[#F5F1E8]"
                >
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                  <ChevronDown
                    className={`h-3 w-3 transition-transform duration-500 ${
                      showFilters ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* View toggle */}
                <div className="flex items-center gap-1 rounded-lg border border-white/[0.04] bg-black/[0.3] p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`rounded p-2 transition-all duration-500 ${
                      viewMode === "grid"
                        ? "bg-gradient-to-br from-white/[0.05] to-transparent text-[#D4AF37]/70"
                        : "text-white/[0.3] hover:text-white/[0.5]"
                    }`}
                  >
                    <div className="grid h-4 w-4 grid-cols-2 gap-0.5">
                      {[...Array(4)].map((_, i) => (
                        <div
                          key={i}
                          className="h-full w-full bg-current opacity-60"
                        />
                      ))}
                    </div>
                  </button>
                  <button
                    onClick={() => setViewMode("compact")}
                    className={`rounded p-2 transition-all duration-500 ${
                      viewMode === "compact"
                        ? "bg-gradient-to-br from-white/[0.05] to-transparent text-[#D4AF37]/70"
                        : "text-white/[0.3] hover:text-white/[0.5]"
                    }`}
                  >
                    <div className="flex flex-col gap-0.5">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="h-0.5 w-3 bg-current"
                        />
                      ))}
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Filter Options - Premium */}
            {showFilters && (
              <div className="mt-8 border-t border-white/[0.04] pt-8">
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
                  {filterOptions.map((option) => (
                    <button
                      key={option.key}
                      onClick={() => setActiveFilter(option.key)}
                      className={`
                        group flex items-center gap-3 rounded-lg border px-4 py-3.5
                        transition-all duration-500
                        ${activeFilter === option.key
                          ? 'border-[#D4AF37]/[0.2] bg-gradient-to-r from-[#D4AF37]/[0.08] to-transparent'
                          : 'border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.02]'
                        }
                      `}
                    >
                      <div className={`transition-colors duration-500 ${
                        activeFilter === option.key ? 'text-[#D4AF37]' : 'text-white/[0.3]'
                      }`}>
                        {option.icon}
                      </div>
                      <div className="flex-1 text-left">
                        <div className={`text-sm font-medium transition-colors duration-500 ${
                          activeFilter === option.key ? 'text-[#F5F1E8]' : 'text-white/[0.5]'
                        }`}>
                          {option.label}
                        </div>
                        <div className="text-xs text-white/[0.3]">
                          {option.count} {option.count === 1 ? 'work' : 'works'}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Content Grid - Premium */}
        <section className="py-20">
          <div className="mx-auto max-w-7xl px-6">
            {activeFilter === "all" ? (
              // Show by category
              <div className="space-y-24">
                {(Object.entries(groupedItems) as [ContentKind, ContentResource[]][])
                  .filter(([_, groupItems]) => groupItems.length > 0)
                  .map(([kind, groupItems]) => {
                    const sectionTitles: Record<ContentKind, string> = {
                      essay: "Essays",
                      book: "Volumes",
                      download: "Tools",
                      event: "Sessions",
                      print: "Editions",
                      resource: "Frameworks",
                      canon: "Canon",
                    };

                    return (
                      <div key={kind} className="space-y-8">
                        <div className="flex items-center justify-between">
                          <div>
                            <h2 className="font-serif text-2xl font-light text-[#F5F1E8]">
                              {sectionTitles[kind]}
                            </h2>
                            <p className="mt-2 text-sm text-white/[0.3]">
                              {groupItems.length} {groupItems.length === 1 ? 'work' : 'works'} in collection
                            </p>
                          </div>
                          <div className="text-xs uppercase tracking-[0.2em] text-white/[0.2]">
                            {kind.toUpperCase()}
                          </div>
                        </div>

                        <div
                          className={`
                            grid gap-6 transition-all duration-1000
                            ${viewMode === "grid"
                              ? "md:grid-cols-2 lg:grid-cols-3"
                              : "md:grid-cols-1"
                            }
                          `}
                        >
                          {groupItems
                            .slice(0, viewMode === "compact" ? 5 : undefined)
                            .map((item) => (
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
              // Show filtered view
              <div>
                <div className="mb-12">
                  <div className="flex items-center gap-4">
                    {filterOptions.find((f) => f.key === activeFilter)?.icon}
                    <div>
                      <h2 className="font-serif text-2xl font-light text-[#F5F1E8]">
                        {filterOptions.find((f) => f.key === activeFilter)?.label}
                      </h2>
                      <p className="mt-2 text-sm text-white/[0.3]">
                        {sortedItems.length} {sortedItems.length === 1 ? 'work' : 'works'} found
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  className={`
                    grid gap-6 transition-all duration-1000
                    ${viewMode === "grid"
                      ? "md:grid-cols-2 lg:grid-cols-3"
                      : "md:grid-cols-1"
                    }
                  `}
                >
                  {sortedItems.map((item) => (
                    <ContentCard
                      key={`${item.kind}-${item.slug}`}
                      item={item}
                      variant={viewMode}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {sortedItems.length === 0 && (
              <div className="py-32 text-center">
                <div className="mb-6">
                  <Search className="mx-auto h-12 w-12 text-white/[0.1]" />
                </div>
                <h3 className="mb-3 font-serif text-xl text-[#F5F1E8]">
                  Archive Empty
                </h3>
                <p className="mx-auto max-w-md text-white/[0.4]">
                  {searchQuery
                    ? `No works match "${searchQuery}". The archive awaits discovery elsewhere.`
                    : "This section of the archive is currently being prepared."}
                </p>
                {(searchQuery || activeFilter !== "all") && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setActiveFilter("all");
                    }}
                    className="mt-6 text-[#D4AF37] transition-colors duration-500 hover:text-[#D4AF37]/80"
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Premium CTA */}
        <section className="border-t border-white/[0.04] py-24">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-full border border-white/[0.04] bg-gradient-to-b from-white/[0.02] to-transparent">
              <Bookmark className="h-8 w-8 text-[#D4AF37]/70" />
            </div>
            <h3 className="mb-6 font-serif text-2xl font-light text-[#F5F1E8]">
              Depth Over Breadth
            </h3>
            <p className="mx-auto mb-10 max-w-2xl leading-relaxed text-white/[0.4]">
              Each work in this archive represents deliberate focus and 
              applied insight. They are preserved not for their novelty, 
              but for their enduring utility to those who build.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/about"
                className="rounded-lg border border-white/[0.04] bg-white/[0.01] px-8 py-3 text-[#F5F1E8] transition-all duration-500 hover:border-[#D4AF37]/[0.2] hover:bg-[#D4AF37]/[0.05]"
              >
                About the Collection
              </Link>
              <Link
                href="/contact"
                className="rounded-lg border border-[#D4AF37]/[0.2] bg-[#D4AF37]/[0.05] px-8 py-3 text-[#D4AF37] transition-all duration-500 hover:bg-[#D4AF37]/[0.08]"
              >
                Request Access
              </Link>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

/* -------------------------------------------------------------------------- */
/* DATA PROCESSING & TYPES (Keep as is)                                       */
/* -------------------------------------------------------------------------- */

type ContentKind = "essay" | "book" | "download" | "event" | "print" | "resource" | "canon";
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

const mapUnifiedToContent = (entry: UnifiedContent): ContentResource | null => {
  if (entry.type === "page") return null;

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
  };
};

export const getStaticProps: GetStaticProps<ContentPageProps> = async () => {
  const unified = await getAllUnifiedContent();

  const items: ContentResource[] = unified
    .map(mapUnifiedToContent)
    .filter((x): x is ContentResource => x !== null);

  const contentStats = {
    total: items.length,
    essay: items.filter((i) => i.kind === "essay").length,
    book: items.filter((i) => i.kind === "book").length,
    download: items.filter((i) => i.kind === "download").length,
    event: items.filter((i) => i.kind === "event").length,
    print: items.filter((i) => i.kind === "print").length,
    resource: items.filter((i) => i.kind === "resource").length,
    canon: items.filter((i) => i.kind === "canon").length,
    featured: items.filter((i) => i.featured).length,
  };

  return {
    props: {
      items: JSON.parse(JSON.stringify(items)),
      contentStats,
    },
    revalidate: 3600,
  };
};

export default ContentPage;