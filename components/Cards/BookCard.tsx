// components/Cards/BookCard.tsx
import * as React from "react";
import Link from "next/link";
import Image from "next/image";

import {
  getCardImage,
  getCardImageAlt,
  truncateTags,
  formatTagText,
  formatShortDate,
  getCardAriaLabel,
  getCardFallbackConfig,
} from "./utils";

// =============================================================================
// TYPES
// =============================================================================

export interface BookCardProps {
  slug: string;
  title: string;
  subtitle?: string | null;
  author?: string | null;
  excerpt?: string | null;
  description?: string | null;
  coverImage?: string | null;
  publishDate?: string | null;
  isbn?: string | null;
  tags?: string[];
  featured?: boolean;
  rating?: number | null;
  className?: string;
  href?: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

const BookCard: React.FC<BookCardProps> = ({
  slug,
  title,
  subtitle,
  author,
  excerpt,
  description,
  coverImage,
  publishDate,
  isbn,
  tags = [],
  featured = false,
  rating,
  className = "",
  href,
}) => {
  const linkHref = href || `/books/${slug}`;
  const displayText = excerpt || description || subtitle || "";
  const displayTags = truncateTags(tags, 3);

  const fallback = getCardFallbackConfig().defaultBookImage;
  const imageSrc = getCardImage(coverImage, fallback);
  const altText = getCardImageAlt(title, "Book");
  const publishLabel = formatShortDate(publishDate ?? null);

  return (
    <Link
      href={linkHref}
      className={`group block rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm transition-all duration-300 hover:border-softGold/30 hover:shadow-[0_8px_30px_rgba(226,197,120,0.15)] ${className}`}
      aria-label={getCardAriaLabel(title, "Book")}
    >
      <article className="flex h-full flex-col overflow-hidden">
        {/* Cover Image – always rendered with fallback */}
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <Image
            src={imageSrc}
            alt={altText}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {featured && (
            <div className="absolute left-3 top-3 rounded-full bg-softGold/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-black backdrop-blur-sm">
              Featured
            </div>
          )}

          {typeof rating === "number" && !Number.isNaN(rating) && (
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-softGold/40 bg-black/60 px-2.5 py-1 text-xs font-semibold text-softGold backdrop-blur-sm">
              <svg className="h-3 w-3 fill-softGold" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {rating.toFixed(1)}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 p-5">
          {/* Tags */}
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {displayTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="rounded-full border border-softGold/20 bg-softGold/10 px-3 py-1 text-xs font-medium text-softGold/90"
                >
                  {formatTagText(tag)}
                </span>
              ))}
            </div>
          )}

          {/* Title & Author */}
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-semibold text-cream transition-colors group-hover:text-softGold">
              {title}
            </h3>
            {author && (
              <p className="text-sm font-medium text-gray-400">by {author}</p>
            )}
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>

          {/* Excerpt/Description */}
          {displayText && (
            <p className="line-clamp-3 text-sm leading-relaxed text-gray-300">
              {displayText}
            </p>
          )}

          {/* Footer: Date & ISBN */}
          <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/5 pt-3">
            {publishLabel && (
              <time className="text-xs text-gray-400">{publishLabel}</time>
            )}
            {isbn && (
              <span className="text-xs font-mono text-gray-500">
                ISBN: {isbn}
              </span>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
};

export default BookCard;