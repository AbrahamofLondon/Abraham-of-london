'use client';

import React from 'react';
import { 
  safeString, 
  safeFirstChar, 
  safeArray,
  safeDate,
  formatSafeDate,
  classNames,
  safeCapitalize,
  safeSlice,
  isNonEmptyString
} from '@/lib/utils/safe';
import { Clock, Calendar, Sparkles } from 'lucide-react';

interface ShortHeroProps {
  title?: string | null;
  excerpt?: string | null;
  author?: string | null;
  date?: string | Date | null;
  readTime?: string | number | null;
  category?: (string | null | undefined)[];
  theme?: string | null;
}

// Theme configuration for consistency
const THEMES = {
  insight: {
    gradient: 'from-amber-500 to-orange-500',
    light: 'amber-50',
    dark: 'amber-950',
    text: 'text-amber-500',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/10',
  },
  reflection: {
    gradient: 'from-blue-500 to-purple-500',
    light: 'blue-50',
    dark: 'blue-950',
    text: 'text-blue-500',
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/10',
  },
  wisdom: {
    gradient: 'from-emerald-500 to-teal-500',
    light: 'emerald-50',
    dark: 'emerald-950',
    text: 'text-emerald-500',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/10',
  },
  challenge: {
    gradient: 'from-rose-500 to-pink-500',
    light: 'rose-50',
    dark: 'rose-950',
    text: 'text-rose-500',
    border: 'border-rose-500/20',
    bg: 'bg-rose-500/10',
  },
} as const;

type ThemeKey = keyof typeof THEMES;

// Helper to get string with fallback (since safeString uses maxLength)
function getString(value: unknown, fallback: string): string {
  const str = safeString(value, 1000);
  return isNonEmptyString(str) ? str : fallback;
}

// Helper to safely get string from category
function getCategoryString(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return String(value);
}

const ShortHero: React.FC<ShortHeroProps> = (props) => {
  // Use helper for string fallbacks
  const title = getString(props.title, 'Field Note');
  const excerpt = getString(props.excerpt, 'A brief insight for builders and thinkers.');
  const author = getString(props.author, 'Abraham of London');
  const readTime = getString(props.readTime?.toString(), '2 min read');
  const rawCategories = safeArray<string>(props.category);
  const themeInput = getString(props.theme, 'insight').toLowerCase() as ThemeKey;
  
  // Validate theme against available options
  const themeKey = (themeInput in THEMES ? themeInput : 'insight') as ThemeKey;
  const theme = THEMES[themeKey];
  
  // ✅ FIXED: Properly type and filter categories
  const categories = React.useMemo(() => {
    return rawCategories
      .filter((cat): cat is string => typeof cat === 'string' && cat.trim().length > 0)
      .slice(0, 3);
  }, [rawCategories]);
  
  // Safely format date with fallback
  const formattedDate = React.useMemo(() => {
    if (!props.date) {
      return formatSafeDate(new Date());
    }
    
    try {
      return formatSafeDate(props.date);
    } catch {
      return formatSafeDate(new Date());
    }
  }, [props.date]);

  return (
    <section 
      className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-black py-20 md:py-28"
      aria-labelledby="short-hero-title"
    >
      {/* Animated background with reduced motion preference */}
      <div className="absolute inset-0" aria-hidden="true">
        <div className={classNames(
          "absolute inset-0 bg-gradient-to-br opacity-10 transition-opacity duration-700",
          theme.gradient
        )} />
        
        {/* Subtle geometric pattern */}
        <div className="absolute inset-0 bg-[size:100px_100px] bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)]" />
        
        {/* Floating particles - reduced motion respects user preference */}
        <div className="absolute top-1/4 left-1/4 h-2 w-2 rounded-full bg-amber-500/20 motion-safe:animate-pulse" />
        <div className="absolute top-1/3 right-1/4 h-1 w-1 rounded-full bg-blue-500/20 motion-safe:animate-pulse" />
        <div className="absolute bottom-1/4 left-1/3 h-1.5 w-1.5 rounded-full bg-purple-500/20 motion-safe:animate-pulse" />
      </div>
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Category Tags with improved semantics */}
          {categories.length > 0 && (
            <nav className="flex flex-wrap gap-2 mb-8" aria-label="Content categories">
              {categories.map((category, index) => (
                <span
                  key={`${category}-${index}`}
                  className={classNames(
                    "group relative overflow-hidden rounded-full px-4 py-1.5 text-xs font-bold tracking-wider uppercase backdrop-blur-sm border transition-all duration-300",
                    theme.border,
                    "hover:border-opacity-40"
                  )}
                >
                  <div className={classNames(
                    "absolute inset-0 bg-gradient-to-r opacity-10 transition-opacity duration-300 group-hover:opacity-20",
                    theme.gradient
                  )} />
                  <span className={classNames(
                    "relative bg-gradient-to-r bg-clip-text text-transparent",
                    theme.gradient
                  )}>
                    {category}
                  </span>
                </span>
              ))}
            </nav>
          )}
          
          {/* Title with gradient - main heading */}
          <h1 
            id="short-hero-title"
            className="mb-8 text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight"
          >
            <span className={classNames(
              "bg-gradient-to-r bg-clip-text text-transparent",
              theme.gradient
            )}>
              {title}
            </span>
          </h1>
          
          {/* Excerpt with refined typography */}
          {excerpt && (
            <p className="mb-12 text-xl md:text-2xl text-gray-300 leading-relaxed max-w-2xl font-light">
              {excerpt}
            </p>
          )}
          
          {/* Meta Information with improved layout */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 pt-8 border-t border-zinc-800/50">
            {/* Author with visual identifier */}
            <div className="group flex items-center gap-4">
              <div className="relative">
                <div className={classNames(
                  "h-12 w-12 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-transform duration-300 group-hover:scale-105",
                  "bg-gradient-to-r",
                  theme.gradient
                )}>
                  {safeFirstChar(author) || 'A'}
                </div>
                
                {/* Active indicator with tooltip */}
                <div 
                  className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-black bg-green-500"
                  title="Active contributor"
                  role="status"
                  aria-label="Active contributor"
                />
              </div>
              
              <div>
                <p className="font-semibold text-white group-hover:text-gray-200 transition-colors">
                  {author}
                </p>
                <p className="text-sm text-gray-400">Author</p>
              </div>
            </div>
            
            {/* Metadata grid with improved spacing */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full sm:w-auto">
              {/* Date */}
              <div className="group">
                <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-300 transition-colors mb-1">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm">Published</span>
                </div>
                <time 
                  dateTime={safeDate(props.date)?.toISOString()}
                  className="font-medium text-white group-hover:text-gray-200 transition-colors"
                >
                  {formattedDate}
                </time>
              </div>
              
              {/* Reading Time */}
              <div className="group">
                <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-300 transition-colors mb-1">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm">Reading Time</span>
                </div>
                <p className="font-medium text-white group-hover:text-gray-200 transition-colors">
                  {readTime}
                </p>
              </div>
              
              {/* Theme */}
              <div className="group">
                <div className="flex items-center gap-2 text-gray-400 group-hover:text-gray-300 transition-colors mb-1">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm">Theme</span>
                </div>
                <p className="font-medium text-white group-hover:text-gray-200 transition-colors">
                  {safeCapitalize(themeKey)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative corner accents - subtle depth */}
      <div className="absolute top-0 right-0 h-64 w-64 bg-gradient-to-bl from-amber-500/5 via-transparent to-purple-500/5 rounded-full -translate-y-32 translate-x-32 pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 h-96 w-96 bg-gradient-to-tr from-amber-500/3 via-transparent to-purple-500/10 rounded-full translate-y-48 -translate-x-48 pointer-events-none" aria-hidden="true" />
      
      {/* Scroll indicator - refined */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 motion-safe:animate-bounce" aria-hidden="true">
        <div className="h-8 w-px bg-gradient-to-b from-amber-500 via-transparent to-transparent" />
      </div>
    </section>
  );
};

export default ShortHero;