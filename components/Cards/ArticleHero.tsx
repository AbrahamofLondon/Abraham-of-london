// components/Cards/ArticleHero.tsx
import * as React from "react";
import Link from "next/link";
import Image from "next/image";

import {
  getCardImage,
  getCardImageAlt,
  getAuthorName,
  getAuthorPicture,
  formatCardDate,
  truncateTags,
  formatTagText,
  getDisplayText,
  truncateText,
  getCardAriaLabel,
} from "./utils";

export interface HeroCardProps {
  slug: string;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  description?: string | null;
  coverImage?: string | null;
  date?: string | null;
  author?: string | { name: string; picture?: string } | null;
  tags?: string[];
  featured?: boolean;
  category?: string | null;
  readTime?: string | number | null;
  className?: string;
  href?: string;
}

const ArticleHero: React.FC<HeroCardProps> = ({
  slug,
  title,
  subtitle,
  excerpt,
  description,
  coverImage,
  date,
  author,
  tags = [],
  featured = false,
  category,
  readTime,
  className = "",
  href,
}) => {
  const linkHref = href || `/${slug}`;

  const displayTextRaw = getDisplayText(excerpt, description, subtitle);
  const displayText = truncateText(displayTextRaw, 260);
  const displayTags = truncateTags(tags, 4);

  const authorName = getAuthorName(author ?? null);
  const authorPicture = getAuthorPicture(author ?? null);
  const dateLabel = formatCardDate(date ?? null);

  const readTimeText =
    typeof readTime === "number" ? `${readTime} min read` : readTime || null;

  const heroImage = getCardImage(coverImage);
  const heroAlt = getCardImageAlt(title, "Article");

  return (
    <Link
      href={linkHref}
      className={`group block rounded-3xl border border-white/10 bg-gradient-to-br from-black/60 via-[#020617]/80 to-black/60 backdrop-blur-md transition-all duration-500 hover:border-softGold/40 hover:shadow-[0_20px_60px_rgba(226,197,120,0.2)] ${className}`}
      aria-label={getCardAriaLabel(title, "Article")}
    >
      <article className="relative flex h-full flex-col overflow-hidden lg:flex-row">
        {/* HERO IMAGE (with fallback from utils) */}
        <div className="relative aspect-[21/9] w-full overflow-hidden lg:aspect-auto lg:w-1/2">
          <Image
            src={heroImage}
            alt={heroAlt}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent lg:bg-gradient-to-r" />

          {featured && (
            <div className="absolute left-4 top-4 rounded-full bg-softGold px-4 py-2 text-sm font-bold uppercase tracking-wider text-black shadow-lg">
              Featured Article
            </div>
          )}

          {category && (
            <div className="absolute right-4 top-4 rounded-full border border-softGold/40 bg-black/70 px-4 py-2 text-sm font-semibold text-softGold backdrop-blur-md">
              {category}
            </div>
          )}
        </div>

        {/* COPY SIDE */}
        <div className="flex flex-1 flex-col justify-center gap-6 p-8 lg:p-12">
          {/* TAGS */}
          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {displayTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="rounded-full border border-softGold/30 bg-softGold/15 px-4 py-1.5 text-sm font-medium text-softGold/95"
                >
                  {formatTagText(tag)}
                </span>
              ))}
            </div>
          )}

          {/* TITLE / SUBTITLE */}
          <div className="space-y-3">
            <h2 className="font-serif text-3xl font-bold text-cream transition-colors group-hover:text-softGold lg:text-4xl xl:text-5xl">
              {title}
            </h2>
            {subtitle && (
              <p className="text-lg font-medium text-gray-300 lg:text-xl">
                {subtitle}
              </p>
            )}
          </div>

          {/* BODY / EXCERPT */}
          {displayText && (
            <p className="line-clamp-4 text-base leading-relaxed text-gray-300 lg:text-lg">
              {displayText}
            </p>
          )}

          {/* META ROW */}
          <div className="flex flex-wrap items-center gap-4 border-t border-white/10 pt-6">
            {/* AUTHOR + DATE */}
            {(authorName || authorPicture || dateLabel) && (
              <div className="flex items-center gap-3">
                {authorPicture && (
                  <div className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-softGold/30">
                    <Image
                      src={authorPicture}
                      alt={authorName || "Author"}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  {authorName && (
                    <p className="text-sm font-semibold text-cream">
                      {authorName}
                    </p>
                  )}
                  {dateLabel && (
                    <time className="text-xs text-gray-400">{dateLabel}</time>
                  )}
                </div>
              </div>
            )}

            {readTimeText && (
              <span className="flex items-center gap-2 text-sm text-gray-400">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {readTimeText}
              </span>
            )}

            {/* CTA */}
            <div className="ml-auto flex items-center gap-2 text-base font-semibold text-softGold transition-all group-hover:gap-3">
              Read Article
              <svg
                className="h-5 w-5 transition-transform group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 8l4 4m0 0l-4 4m4-4H3"
                />
              </svg>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default ArticleHero;
