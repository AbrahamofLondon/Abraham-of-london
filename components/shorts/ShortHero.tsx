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
import { Clock, Calendar, Sparkles, Feather, TrendingUp, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface ShortHeroProps {
  title?: string | null;
  excerpt?: string | null;
  author?: string | null;
  date?: string | Date | null;
  readTime?: string | number | null;
  category?: (string | null | undefined)[];
  theme?: string | null;
  intensity?: 1 | 2 | 3 | 4 | 5;
  views?: number;
  lineage?: string;
}

// Theme configuration with expanded palette
const THEMES = {
  insight: {
    gradient: 'from-amber-500 to-orange-500',
    light: 'amber-50',
    dark: 'amber-950',
    text: 'text-amber-500',
    border: 'border-amber-500/20',
    bg: 'bg-amber-500/10',
    glow: 'rgba(245,158,11,0.15)',
    secondary: 'from-amber-400 to-amber-600',
  },
  reflection: {
    gradient: 'from-blue-500 to-purple-500',
    light: 'blue-50',
    dark: 'blue-950',
    text: 'text-blue-500',
    border: 'border-blue-500/20',
    bg: 'bg-blue-500/10',
    glow: 'rgba(59,130,246,0.15)',
    secondary: 'from-blue-400 to-purple-500',
  },
  wisdom: {
    gradient: 'from-emerald-500 to-teal-500',
    light: 'emerald-50',
    dark: 'emerald-950',
    text: 'text-emerald-500',
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/10',
    glow: 'rgba(16,185,129,0.15)',
    secondary: 'from-emerald-400 to-teal-500',
  },
  challenge: {
    gradient: 'from-rose-500 to-pink-500',
    light: 'rose-50',
    dark: 'rose-950',
    text: 'text-rose-500',
    border: 'border-rose-500/20',
    bg: 'bg-rose-500/10',
    glow: 'rgba(244,63,94,0.15)',
    secondary: 'from-rose-400 to-pink-500',
  },
} as const;

type ThemeKey = keyof typeof THEMES;

// Signal strength indicator component
const SignalStrength = ({ level = 3 }: { level?: 1 | 2 | 3 | 4 | 5 }) => {
  const bars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-[2px]">
      {bars.map((bar) => (
        <motion.div
          key={bar}
          initial={{ height: 0 }}
          animate={{ height: bar <= level ? 16 : 8 }}
          transition={{ duration: 0.5, delay: bar * 0.1 }}
          className={`w-[2px] rounded-full ${
            bar <= level ? 'bg-amber-500' : 'bg-white/10'
          }`}
        />
      ))}
    </div>
  );
};

// Helper to get string with fallback
function getString(value: unknown, fallback: string): string {
  const str = safeString(value, 1000);
  return isNonEmptyString(str) ? str : fallback;
}

// ✅ FIXED: Animation variants with proper easing
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0, 
    transition: { 
      duration: 0.6, 
      ease: [0.2, 0.8, 0.2, 1] as any // Type assertion for Framer Motion
    } 
  },
};

const ShortHero: React.FC<ShortHeroProps> = (props) => {
  // Use helper for string fallbacks
  const title = getString(props.title, 'Field Note');
  const excerpt = getString(props.excerpt, 'A brief insight for builders and thinkers.');
  const author = getString(props.author, 'Abraham of London');
  const readTime = getString(props.readTime?.toString(), '2 min read');
  const rawCategories = safeArray<string>(props.category);
  const themeInput = getString(props.theme, 'insight').toLowerCase() as ThemeKey;
  const intensity = props.intensity || 3;
  const views = props.views || 0;
  const lineage = props.lineage;
  
  // Validate theme against available options
  const themeKey = (themeInput in THEMES ? themeInput : 'insight') as ThemeKey;
  const theme = THEMES[themeKey];
  
  // Properly type and filter categories
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
    <motion.section 
      initial="hidden"
      animate="visible"
      variants={containerVariants}
      className="relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-black py-24 md:py-32"
      aria-labelledby="short-hero-title"
    >
      {/* Premium background layers */}
      <div className="absolute inset-0" aria-hidden="true">
        {/* Main gradient overlay */}
        <div className={classNames(
          "absolute inset-0 bg-gradient-to-br opacity-10",
          theme.gradient
        )} />
        
        {/* Geometric pattern - refined */}
        <div className="absolute inset-0 bg-[size:120px_120px] bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)]" />
        
        {/* Floating gradient orbs */}
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className={classNames(
            "absolute top-20 left-1/4 w-96 h-96 rounded-full blur-[120px]",
            `bg-${themeKey}-500/10`
          )}
        />
        <motion.div
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ 
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-20 right-1/4 w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[140px]"
        />
      </div>
      
      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          {/* Premium metadata strip */}
          <motion.div 
            variants={itemVariants}
            className="inline-flex items-center gap-4 px-4 py-2 bg-black/40 backdrop-blur-md border border-white/5 rounded-full mb-8"
          >
            {categories.length > 0 ? (
              <div className="flex items-center gap-2">
                <Feather className="h-3 w-3 text-amber-500/60" />
                <span className="font-mono text-[10px] tracking-[0.2em] text-white/40">
                  {categories[0]}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Shield className="h-3 w-3 text-amber-500/60" />
                <span className="font-mono text-[10px] tracking-[0.2em] text-white/40">
                  SECURE BRIEFING
                </span>
              </div>
            )}
            
            <div className="w-px h-3 bg-white/10" />
            
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3 text-white/30" />
              <span className="font-mono text-[10px] text-white/30">
                {readTime}
              </span>
            </div>
            
            {views > 0 && (
              <>
                <div className="w-px h-3 bg-white/10" />
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-3 w-3 text-white/30" />
                  <span className="font-mono text-[10px] text-white/30">
                    {views.toLocaleString()} views
                  </span>
                </div>
              </>
            )}
            
            <div className="w-px h-3 bg-white/10" />
            <SignalStrength level={intensity} />
          </motion.div>

          {/* Categories (if multiple) */}
          {categories.length > 1 && (
            <motion.nav 
              variants={itemVariants}
              className="flex flex-wrap justify-center gap-2 mb-8"
              aria-label="Content categories"
            >
              {categories.map((category, index) => (
                <span
                  key={`${category}-${index}`}
                  className={classNames(
                    "px-4 py-1.5 text-xs font-mono uppercase tracking-wider rounded-full",
                    "border backdrop-blur-sm transition-all duration-300",
                    theme.border,
                    "hover:border-opacity-40 hover:-translate-y-0.5"
                  )}
                >
                  <span className={classNames(
                    "bg-gradient-to-r bg-clip-text text-transparent",
                    theme.gradient
                  )}>
                    {category}
                  </span>
                </span>
              ))}
            </motion.nav>
          )}
          
          {/* Title with gradient - premium scale */}
          <motion.h1 
            variants={itemVariants}
            id="short-hero-title"
            className="mb-8 text-5xl md:text-6xl lg:text-7xl font-bold leading-tight tracking-tight text-balance"
          >
            <span className={classNames(
              "bg-gradient-to-r bg-clip-text text-transparent",
              theme.gradient
            )}>
              {title}
            </span>
          </motion.h1>
          
          {/* Excerpt with refined typography */}
          {excerpt && (
            <motion.p 
              variants={itemVariants}
              className="mb-12 text-xl md:text-2xl text-white/50 leading-relaxed max-w-3xl mx-auto font-light text-balance"
            >
              {excerpt}
            </motion.p>
          )}
          
          {/* Lineage indicator (if present) */}
          {lineage && (
            <motion.div 
              variants={itemVariants}
              className="mb-12"
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/5 border border-amber-500/10 rounded-full">
                <span className="font-mono text-[9px] tracking-[0.2em] text-amber-500/60 uppercase">
                  Canon lineage: {lineage}
                </span>
              </span>
            </motion.div>
          )}
          
          {/* Meta Information - premium grid */}
          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-8 pt-8 border-t border-white/5"
          >
            {/* Author with visual identifier */}
            <div className="group flex items-center gap-4">
              <div className="relative">
                <div className={classNames(
                  "h-14 w-14 rounded-full flex items-center justify-center text-white font-bold shadow-lg",
                  "bg-gradient-to-r",
                  theme.gradient
                )}>
                  {safeFirstChar(author) || 'A'}
                </div>
                
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-black bg-green-500"
                  title="Active contributor"
                  role="status"
                  aria-label="Active contributor"
                />
              </div>
              
              <div className="text-left">
                <p className="font-semibold text-white group-hover:text-gray-200 transition-colors">
                  {author}
                </p>
                <p className="text-sm text-white/40">Author</p>
              </div>
            </div>
            
            {/* Metadata grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-left">
              {/* Date */}
              <div className="group">
                <div className="flex items-center gap-2 text-white/40 group-hover:text-white/60 transition-colors mb-1">
                  <Calendar className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-mono tracking-wider">Published</span>
                </div>
                <time 
                  dateTime={safeDate(props.date)?.toISOString()}
                  className="font-medium text-white/80 group-hover:text-white transition-colors"
                >
                  {formattedDate}
                </time>
              </div>
              
              {/* Theme */}
              <div className="group">
                <div className="flex items-center gap-2 text-white/40 group-hover:text-white/60 transition-colors mb-1">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-mono tracking-wider">Theme</span>
                </div>
                <p className="font-medium text-white/80 group-hover:text-white transition-colors">
                  {safeCapitalize(themeKey)}
                </p>
              </div>
              
              {/* Signal */}
              <div className="group">
                <div className="flex items-center gap-2 text-white/40 group-hover:text-white/60 transition-colors mb-1">
                  <TrendingUp className="h-4 w-4" aria-hidden="true" />
                  <span className="text-sm font-mono tracking-wider">Signal</span>
                </div>
                <div className="flex items-center gap-2">
                  <SignalStrength level={intensity} />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Premium decorative elements */}
      <div className="absolute top-0 right-0 h-64 w-64 bg-gradient-to-bl from-amber-500/5 via-transparent to-purple-500/5 rounded-full -translate-y-32 translate-x-32 pointer-events-none" aria-hidden="true" />
      <div className="absolute bottom-0 left-0 h-96 w-96 bg-gradient-to-tr from-amber-500/3 via-transparent to-purple-500/10 rounded-full translate-y-48 -translate-x-48 pointer-events-none" aria-hidden="true" />
      
      {/* Refined scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        aria-hidden="true"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="font-mono text-[8px] tracking-[0.4em] text-white/20 uppercase">
            Continue
          </span>
          <motion.div 
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="h-12 w-px bg-gradient-to-b from-amber-500/50 via-transparent to-transparent"
          />
        </div>
      </motion.div>
    </motion.section>
  );
};

export default ShortHero;