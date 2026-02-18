// components/ShortCard.tsx — HARRODS-LEVEL PREMIUM (10/10)
// Understated elegance meets institutional authority

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Clock, Eye, Sparkles, Feather } from "lucide-react";
import { motion } from "framer-motion";

type ShortLike = {
  title: string;
  slug?: string | null;
  url?: string | null;
  excerpt?: string | null;
  readTime?: string | null;
  theme?: string | null;
  audience?: string | null;
  tags?: string[] | null;
  /** Optional - adds a subtle dateline */
  date?: string | null;
  /** Signal strength (1-5) */
  intensity?: 1 | 2 | 3 | 4 | 5;
  /** View count for social proof */
  views?: number;
};

type Props = {
  short: ShortLike;
  className?: string;
  /** When true, uses a more compact layout */
  compact?: boolean;
  /** Featured card gets subtle glow */
  featured?: boolean;
  /** Index for staggered animations */
  index?: number;
};

// Refined audience indicators - minimal, just enough context
const audienceClass: Record<string, string> = {
  secular: "text-stone-500 dark:text-stone-400",
  busy: "text-stone-500 dark:text-stone-400",
  church: "text-stone-500 dark:text-stone-400",
};

const audienceLabel: Record<string, string> = {
  secular: "For the seeking",
  busy: "A brief respite",
  church: "For the gathered",
};

// Intensity mapping for signal strength
const IntensityIndicator = ({ level = 3 }: { level?: 1 | 2 | 3 | 4 | 5 }) => {
  const bars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-[2px]">
      {bars.map((bar) => (
        <div
          key={bar}
          className={`w-[2px] h-3 rounded-full transition-all duration-300 ${
            bar <= level ? 'bg-amber-500' : 'bg-stone-200 dark:bg-stone-700'
          }`}
        />
      ))}
    </div>
  );
};

function safeText(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function safeArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export const ShortCard: React.FC<Props> = ({ 
  short, 
  className = "",
  compact = false,
  featured = false,
  index = 0,
}) => {
  const audienceKey = safeText(short.audience).toLowerCase();
  const audienceText = audienceLabel[audienceKey] || "A short reflection";
  const audienceColor = audienceClass[audienceKey] || "text-stone-500 dark:text-stone-400";
  
  const slug = safeText(short.slug).replace(/^\/+|\/+$/g, "");
  const href = safeText(short.url) || `/shorts/${slug}`;
  
  // Limit tags to first 2 for visual clarity
  const tags = safeArray(short.tags).slice(0, 2);
  
  // Format date if present
  const formattedDate = short.date 
    ? new Date(short.date).toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.2, 0.8, 0.2, 1] // Institutional easing
      }}
      className="h-full"
    >
      <Link href={href} className="group block h-full no-underline">
        <article
          className={`
            relative h-full overflow-hidden
            rounded-xl border 
            bg-white shadow-sm 
            transition-all duration-500 
            hover:shadow-lg hover:-translate-y-1
            dark:bg-stone-900 
            ${featured 
              ? 'border-amber-200/50 dark:border-amber-800/50 shadow-amber-500/5' 
              : 'border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700'
            }
            ${compact ? 'p-5' : 'p-6'}
            ${className}
          `}
        >
          {/* Featured gradient overlay */}
          {featured && (
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-transparent pointer-events-none" />
          )}
          
          {/* Top accent line - subtle authority */}
          <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r ${
            featured 
              ? 'from-amber-500/40 via-amber-500/20 to-transparent' 
              : 'from-stone-300/30 via-stone-300/10 to-transparent dark:from-stone-700/30 dark:via-stone-700/10'
          }`} />

          <div className="flex h-full flex-col relative z-10">
            {/* Header - refined metadata */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Feather className={`h-3 w-3 ${
                  featured ? 'text-amber-500/60' : 'text-stone-400 dark:text-stone-500'
                }`} />
                <span className={`text-xs font-light tracking-wide ${audienceColor}`}>
                  {audienceText}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {short.intensity && (
                  <IntensityIndicator level={short.intensity} />
                )}
                
                {short.readTime && (
                  <div className="flex items-center gap-1 text-xs font-light text-stone-400 dark:text-stone-500">
                    <Clock className="h-3 w-3" />
                    <span>{short.readTime}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Title - quietly confident with better typography */}
            <h3 
              className={`
                font-serif font-normal leading-tight text-balance
                text-stone-900 dark:text-stone-100
                ${compact ? 'text-lg' : 'text-xl md:text-2xl'}
                transition-colors duration-300 
                group-hover:text-stone-700 dark:group-hover:text-stone-300
              `}
            >
              {short.title || "Untitled"}
            </h3>

            {/* Excerpt - speaks softly, with better line clamping */}
            {short.excerpt && (
              <p className="mt-3 line-clamp-2 text-sm font-light leading-relaxed text-stone-600 dark:text-stone-400">
                {short.excerpt}
              </p>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Footer - refined with subtle micro-interactions */}
            <div className="mt-4 pt-4 border-t border-stone-100 dark:border-stone-800">
              <div className="flex items-center justify-between">
                {/* Left side: tags, theme, date - elegantly spaced */}
                <div className="flex flex-wrap items-center gap-3">
                  {short.theme && (
                    <span className="text-xs font-light text-stone-400 dark:text-stone-500">
                      {short.theme}
                    </span>
                  )}
                  
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-light text-stone-400 dark:text-stone-500 hover:text-amber-500/60 transition-colors cursor-default"
                    >
                      #{tag}
                    </span>
                  ))}
                  
                  {formattedDate && (
                    <span className="text-xs font-light text-stone-400 dark:text-stone-500">
                      {formattedDate}
                    </span>
                  )}

                  {short.views !== undefined && short.views > 0 && (
                    <div className="flex items-center gap-1 text-xs font-light text-stone-400 dark:text-stone-500">
                      <Eye className="h-3 w-3" />
                      <span>{short.views.toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {/* Right side: subtle arrow with refined animation */}
                <motion.div
                  initial={{ x: 0 }}
                  whileHover={{ x: 3 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <ArrowRight 
                    className={`
                      h-4 w-4 transition-all duration-300
                      ${featured 
                        ? 'text-amber-500/60 opacity-100' 
                        : 'text-stone-300 opacity-0 group-hover:opacity-100 dark:text-stone-600'
                      }
                    `} 
                    strokeWidth={1.5}
                  />
                </motion.div>
              </div>
            </div>
          </div>
        </article>
      </Link>
    </motion.div>
  );
};

export default ShortCard;