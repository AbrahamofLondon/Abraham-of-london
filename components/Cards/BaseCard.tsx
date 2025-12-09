// components/Cards/BaseCard.tsx - UPDATED
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import type { BaseCardProps, DocumentCardProps } from "./types"; // Import from local types

// =============================================================================
// HELPER FUNCTION
// =============================================================================

function getCardPropsFromDocument(doc: any): BaseCardProps {
  return {
    slug: doc.slug || "",
    title: doc.title || "Untitled",
    subtitle: doc.subtitle || null,
    excerpt: doc.excerpt || null,
    description: doc.description || null,
    coverImage: doc.coverImage || null,
    date: doc.date || null,
    tags: doc.tags || [],
    featured: doc.featured || false,
    accessLevel: doc.accessLevel || null,
    lockMessage: doc.lockMessage || null,
    category: doc.category || null,
    readingTime: doc.readingTime || null,
    isNew: doc.isNew || false,
  };
}

// Local date formatter (kept here to avoid circular imports)
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

// =============================================================================
// COMPONENT - MAIN BASE CARD
// =============================================================================

const BaseCard: React.FC<BaseCardProps> = ({
  slug,
  title,
  subtitle,
  excerpt,
  description,
  coverImage,
  date,
  tags = [],
  featured = false,
  accessLevel,
  lockMessage,
  category,
  readingTime,
  isNew = false,
  className = "",
  href,
}) => {
  const isLocked = accessLevel === "inner-circle" || accessLevel === "premium";
  const linkHref = href || `/${slug}`;
  const displayText = excerpt || description || subtitle || "";
  const displayTags = tags.slice(0, 3);
  const formattedDate = date ? formatDate(date) : "";

  // On-brand fallback for missing cover images
  const cardImage =
    coverImage ||
    "/assets/images/writing-desk.webp"; // known existing fallback in your project

  return (
    <Link
      href={linkHref}
      className={`group block rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm transition-all duration-300 hover:border-softGold/30 hover:shadow-[0_8px_30px_rgba(226,197,120,0.15)] ${className}`}
      aria-label={title}
    >
      <article className="relative flex h-full flex-col overflow-hidden">
        {/* Cover Image */}
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src={cardImage}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Badges Container - Top Left */}
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {featured && (
              <div className="rounded-full bg-softGold/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-black backdrop-blur-sm">
                Featured
              </div>
            )}
            {isNew && (
              <div className="rounded-full bg-green-600/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                New
              </div>
            )}
          </div>

          {/* Badges Container - Top Right */}
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            {isLocked && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-700/40 bg-amber-900/30 px-2 py-1 text-[0.65rem] font-semibold text-amber-400/90 backdrop-blur-sm">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Inner Circle
              </div>
            )}
            {category && (
              <div className="rounded-full border border-blue-500/30 bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-300 backdrop-blur-sm">
                {category}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 p-5">
          {/* Tags & Category Row (for cases where we want the chip even without image emphasis) */}
          {(displayTags.length > 0 || category) && (
            <div className="flex flex-wrap items-center gap-2">
              {category && (
                <span className="rounded-full border border-blue-500/30 bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-300">
                  {category}
                </span>
              )}
              {displayTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="rounded-full border border-softGold/20 bg-softGold/10 px-3 py-1 text-xs font-medium text-softGold/90"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title & Subtitle */}
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-semibold text-cream transition-colors group-hover:text-softGold">
              {title}
            </h3>
            {subtitle && (
              <p className="text-sm font-medium text-gray-400">{subtitle}</p>
            )}
          </div>

          {/* Excerpt/Description */}
          {displayText && (
            <p className="line-clamp-3 text-sm leading-relaxed text-gray-300">
              {displayText}
            </p>
          )}

          {/* Footer: Date, Reading Time & Lock Message */}
          <div className="mt-auto flex items-center justify-between gap-3 pt-3">
            <div className="flex items-center gap-3">
              {date && formattedDate && (
                <time className="text-xs text-gray-400">{formattedDate}</time>
              )}
              {readingTime && (
                <span className="text-xs text-gray-500 before:mr-2 before:content-['•']">
                  {readingTime} read
                </span>
              )}
            </div>

            {isLocked && lockMessage && (
              <span className="text-xs italic text-amber-400/80">
                {lockMessage}
              </span>
            )}
          </div>
        </div>

        {/* New badge for "text-only" cards if you ever render without images via a wrapper */}
        {!coverImage && isNew && (
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-green-600/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            New
          </div>
        )}
      </article>
    </Link>
  );
};

// =============================================================================
// EXPORT BOTH COMPONENTS
// =============================================================================

// Export the main BaseCard
export default BaseCard;

// Export a document-specific wrapper
export function DocumentCard({
  document,
  className = "",
  href,
}: DocumentCardProps) {
  const cardProps = getCardPropsFromDocument(document);
  return <BaseCard {...cardProps} className={className} href={href} />;
}

// Export types from this file
export type { BaseCardProps, DocumentCardProps };