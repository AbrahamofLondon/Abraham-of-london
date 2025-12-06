import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';

// =============================================================================
// TYPES
// =============================================================================

export interface BaseCardProps {
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  description?: string | null;
  coverImage?: string | null;
  date?: string | null;
  tags?: string[];
  featured?: boolean;
  accessLevel?: string | null;
  lockMessage?: string | null;
  className?: string;
  href?: string;
}

// Document interface for future Contentlayer integration
export interface DocumentCardProps {
  document: any; // Changed from ContentlayerDocument to any for now
  className?: string;
  href?: string;
}

// =============================================================================
// HELPER FUNCTION
// =============================================================================

function getCardPropsFromDocument(doc: any): BaseCardProps {
  return {
    slug: doc.slug || '',
    title: doc.title || 'Untitled',
    subtitle: doc.subtitle || null,
    excerpt: doc.excerpt || null,
    description: doc.description || null,
    coverImage: doc.coverImage || null,
    date: doc.date || null,
    tags: doc.tags || [],
    featured: doc.featured || false,
    accessLevel: doc.accessLevel || null,
    lockMessage: doc.lockMessage || null,
  };
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
  className = '',
  href,
}) => {
  const isLocked = accessLevel === 'inner-circle' || accessLevel === 'premium';
  const linkHref = href || `/${slug}`;
  const displayText = excerpt || description || subtitle || '';
  const displayTags = tags.slice(0, 3);

  return (
    <Link
      href={linkHref}
      className={`group block rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm transition-all duration-300 hover:border-softGold/30 hover:shadow-[0_8px_30px_rgba(226,197,120,0.15)] ${className}`}
    >
      <article className="flex h-full flex-col overflow-hidden">
        {/* Cover Image */}
        {coverImage && (
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            <Image
              src={coverImage}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {featured && (
              <div className="absolute left-3 top-3 rounded-full bg-softGold/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-black backdrop-blur-sm">
                Featured
              </div>
            )}
            {isLocked && (
              <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-amber-700/40 bg-amber-900/30 px-2 py-1 text-[0.65rem] font-semibold text-amber-400/90 backdrop-blur-sm">
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
          </div>
        )}

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
            <p className="text-sm leading-relaxed text-gray-300 line-clamp-3">
              {displayText}
            </p>
          )}

          {/* Footer: Date & Lock Message */}
          <div className="mt-auto flex items-center justify-between gap-3 pt-3">
            {date && (
              <time className="text-xs text-gray-400">
                {(() => {
                  try {
                    return new Date(date).toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    });
                  } catch {
                    return '';
                  }
                })()}
              </time>
            )}
            {isLocked && lockMessage && (
              <span className="text-xs italic text-amber-400/80">
                {lockMessage}
              </span>
            )}
          </div>
        </div>
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
export function DocumentCard({ document, className = '', href }: DocumentCardProps) {
  const cardProps = getCardPropsFromDocument(document);
  return <BaseCard {...cardProps} className={className} href={href} />;
}