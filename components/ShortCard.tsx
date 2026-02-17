// components/ShortCard.tsx — REFINED (Understated Elegance)
import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

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
};

type Props = {
  short: ShortLike;
  className?: string;
  /** When true, uses a more compact layout */
  compact?: boolean;
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

function safeText(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function safeArray(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

export const ShortCard: React.FC<Props> = ({ 
  short, 
  className = "",
  compact = false 
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
    <Link href={href} className="group block h-full no-underline">
      <article
        className={`
          relative h-full rounded-lg border border-stone-200 
          bg-white p-6 
          transition-all duration-300 
          hover:border-stone-300 hover:shadow-sm
          dark:border-stone-800 dark:bg-stone-900 dark:hover:border-stone-700
          ${compact ? 'p-5' : 'p-6'}
          ${className}
        `}
      >
        <div className="flex h-full flex-col">
          {/* Header - minimal, just the essentials */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <span className={`text-xs font-light tracking-wide ${audienceColor}`}>
              {audienceText}
            </span>
            
            {short.readTime && (
              <span className="text-xs font-light text-stone-400 dark:text-stone-500">
                {short.readTime}
              </span>
            )}
          </div>

          {/* Title - quietly confident */}
          <h3 
            className={`
              font-serif font-normal leading-tight text-stone-900 dark:text-stone-100
              ${compact ? 'text-lg' : 'text-xl'}
              transition-colors duration-200 group-hover:text-stone-700 dark:group-hover:text-stone-300
            `}
          >
            {short.title || "Untitled"}
          </h3>

          {/* Excerpt - if present, speaks softly */}
          {short.excerpt && (
            <p className="mt-3 line-clamp-2 text-sm font-light leading-relaxed text-stone-600 dark:text-stone-400">
              {short.excerpt}
            </p>
          )}

          {/* Footer - recedes, doesn't compete */}
          <div className="mt-auto pt-4">
            <div className="flex items-center justify-between">
              {/* Left side: tags and theme - minimal */}
              <div className="flex flex-wrap items-center gap-3">
                {short.theme && (
                  <span className="text-xs font-light text-stone-400 dark:text-stone-500">
                    {short.theme}
                  </span>
                )}
                
                {tags.length > 0 && (
                  <div className="flex items-center gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs font-light text-stone-400 dark:text-stone-500"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {formattedDate && (
                  <span className="text-xs font-light text-stone-400 dark:text-stone-500">
                    {formattedDate}
                  </span>
                )}
              </div>

              {/* Right side: subtle arrow - almost invisible until hover */}
              <ArrowRight 
                className="h-3.5 w-3.5 text-stone-300 opacity-0 transition-all duration-200 group-hover:opacity-100 dark:text-stone-600" 
                strokeWidth={1.5}
              />
            </div>
          </div>

          {/* A single, clean line at the bottom - quiet authority */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-px bg-stone-200 dark:bg-stone-800" 
            aria-hidden="true" 
          />
        </div>
      </article>
    </Link>
  );
};

export default ShortCard;