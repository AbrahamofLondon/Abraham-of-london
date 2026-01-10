import * as React from "react";
import clsx from "clsx";
import { CoverFrame, type CoverAspect } from "@/components/media/CoverFrame";
import { safeString } from "@/lib/utils";

type ArticleHeroProps = {
  // Required props
  title?: string | null;
  
  // Optional props
  subtitle?: string | null;
  category?: string | null;
  date?: string | null;
  readTime?: string | number | null;
  coverImage?: string | null;
  coverAspect?: CoverAspect;
  coverFit?: "cover" | "contain";
  
  // Layout options
  centered?: boolean;
  compact?: boolean;
  className?: string;
  
  // Additional props for extensibility
  [key: string]: any; // Kept for backward compatibility
};

/**
 * Safely formats a date string
 */
function formatDate(iso?: string | null): string | null {
  if (!iso) return null;
  
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return null;
    
    return new Intl.DateTimeFormat("en-GB", {
      year: "numeric",
      month: "short",
      day: "2-digit",
    }).format(d);
  } catch {
    return null;
  }
}

/**
 * Formats read time consistently
 */
function formatReadTime(readTime?: string | number | null): string | null {
  if (readTime === null || readTime === undefined) return null;
  
  if (typeof readTime === 'number') {
    return `${readTime} min read`;
  }
  
  if (typeof readTime === 'string') {
    const trimmed = readTime.trim();
    if (!trimmed) return null;
    
    // If it already contains "min" or "read", return as is
    const lower = trimmed.toLowerCase();
    if (lower.includes('min') || lower.includes('read')) {
      return trimmed;
    }
    
    // If it's just a number as string, add "min read"
    const asNumber = Number(trimmed);
    if (!isNaN(asNumber)) {
      return `${asNumber} min read`;
    }
    
    return trimmed;
  }
  
  return null;
}

/**
 * Gets the first valid cover image from various formats
 */
function getCoverImage(image?: string | null | { src?: string }): string | null {
  if (!image) return null;
  
  if (typeof image === 'string') {
    return image.trim() || null;
  }
  
  // Handle object format
  if (typeof image === 'object' && image !== null) {
    const src = (image as any).src;
    if (typeof src === 'string' && src.trim()) {
      return src.trim();
    }
  }
  
  return null;
}

export default function ArticleHero(props: ArticleHeroProps): JSX.Element {
  const {
    title = "",
    subtitle,
    category,
    date,
    readTime,
    coverImage,
    coverAspect = "book",
    centered = false,
    compact = false,
    className = "",
    ...restProps
  } = props;

  // Safely handle all inputs
  const safeTitle = safeString(title);
  const safeSubtitle = safeString(subtitle);
  const safeCategory = safeString(category);
  
  // Process dates and read time
  const dateLabel = formatDate(date);
  const readLabel = formatReadTime(readTime);
  
  // Build meta bits
  const metaBits = [dateLabel, readLabel].filter(Boolean);
  const metaDisplay = metaBits.join(' • ');
  
  // Process cover image
  const processedCoverImage = getCoverImage(coverImage);
  
  // Determine if we should show cover image
  const showCover = processedCoverImage && safeTitle;

  // Container classes
  const containerClasses = clsx(
    "border-b border-gray-200 bg-white dark:border-white/10 dark:bg-[#0a0b0d]",
    compact ? "py-10 md:py-12" : "py-16 md:py-20",
    className
  );

  // Content container classes
  const contentClasses = clsx(
    "mx-auto flex max-w-5xl flex-col gap-10 px-6 lg:px-8",
    centered ? "items-center text-center" : "items-start",
    showCover ? "md:flex-row md:gap-16" : "md:flex-col md:gap-12"
  );

  // Title classes
  const titleClasses = clsx(
    "font-serif font-bold leading-[1.2] text-gray-900 dark:text-white",
    compact ? "text-3xl md:text-4xl" : "text-4xl md:text-5xl",
    centered ? "text-center" : "text-left"
  );

  // Subtitle classes
  const subtitleClasses = clsx(
    "leading-relaxed text-gray-700 dark:text-gray-100",
    compact ? "text-base md:text-lg" : "text-lg md:text-xl",
    centered ? "text-center" : "text-left"
  );

  // Category classes
  const categoryClasses = clsx(
    "text-xs font-bold uppercase tracking-[0.2em] text-[#D6B26A]",
    centered ? "text-center" : "text-left"
  );

  // Meta classes
  const metaClasses = clsx(
    "text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300",
    centered ? "text-center" : "text-left"
  );

  return (
    <section className={containerClasses} {...restProps}>
      <div className={contentClasses}>
        {/* Content */}
        <div className={clsx("flex-1", showCover && centered ? "md:order-2" : "")}>
          {safeCategory && (
            <div className="mb-5">
              <p className={categoryClasses}>
                {safeCategory}
              </p>
            </div>
          )}
          
          {safeTitle && (
            <h1 className={clsx("mb-8", titleClasses)}>
              {safeTitle}
            </h1>
          )}
          
          {safeSubtitle && (
            <p className={clsx("mb-8", subtitleClasses)}>
              {safeSubtitle}
            </p>
          )}
          
          {metaDisplay && (
            <div className="mt-4">
              <p className={metaClasses}>
                {metaDisplay}
              </p>
            </div>
          )}
        </div>

        {/* Cover Image */}
        {showCover && (
          <div className={clsx(
            "shrink-0",
            compact ? "w-40 md:w-48" : "w-48 md:w-56",
            centered ? "md:order-1" : ""
          )}>
            <CoverFrame
              src={processedCoverImage}
              alt={safeTitle || "Article cover"}
              aspect={coverAspect}
              priority={true}
              className="shadow-lg"
            />
          </div>
        )}
      </div>
    </section>
  );
}

// Optional: Export helper functions for reuse
export { formatDate, formatReadTime, getCoverImage };

