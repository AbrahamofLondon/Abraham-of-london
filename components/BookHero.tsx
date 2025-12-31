// components/BookHero.tsx
"use client";

import * as React from "react";
import clsx from "clsx";
import { CoverFrame, type CoverAspect } from "@/components/media/CoverFrame";
import { safeString } from "@/lib/utils";
import { getSafeImageProps, type FallbackConfig } from "@/lib/image-utils";
import Image from "next/image";

type BookHeroProps = {
  title?: string | null;
  subtitle?: string | null;
  author?: string | null;
  date?: string | null;
  readTime?: string | number | null;
  coverImage?: string | null;
  coverAspect?: CoverAspect;
  coverFit?: "cover" | "contain";
  publisher?: string | null;
  publishedDate?: string | null;
  pages?: number | null;
  format?: string | null;
  isbn?: string | null;
  tags?: string[] | null;
  category?: string | null;
};

function formatDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

// Get fallback configuration based on book data
const getBookFallbackConfig = (props: BookHeroProps): FallbackConfig => {
  const type = "book";
  let theme: FallbackConfig['theme'] = "gradient";
  let category = "default";

  if (props.category) {
    if (props.category.toLowerCase().includes('philosophy')) category = 'philosophy';
    else if (props.category.toLowerCase().includes('fiction')) category = 'fiction';
    else if (props.category.toLowerCase().includes('business')) category = 'business';
    else if (props.category.toLowerCase().includes('non-fiction') || props.category.includes('nonfiction')) category = 'nonFiction';
    else category = props.category.toLowerCase();
  }

  if (props.tags && props.tags.length > 0) {
    const firstTag = safeString(props.tags[0]).toLowerCase();
    if (firstTag.includes('classic') || firstTag.includes('literature')) {
      theme = 'dark';
    } else if (firstTag.includes('modern') || firstTag.includes('contemporary')) {
      theme = 'light';
    }
  }

  return { type, theme, category };
};

export default function BookHero(props: BookHeroProps): JSX.Element {
  const {
    title = "",
    subtitle,
    author,
    date,
    readTime,
    coverImage,
    coverAspect = "book",
    publisher,
    publishedDate,
    pages,
    format,
    isbn,
    tags,
    category,
  } = props;

  const dateLabel = formatDate(date);
  const readLabel =
    typeof readTime === "number"
      ? `${readTime} min read`
      : typeof readTime === "string" && readTime.trim()
      ? readTime
      : null;

  const metaBits = [dateLabel, readLabel].filter(Boolean).join(" • ");

  // Ensure title is always a string for the alt attribute
  const safeTitle = safeString(title, "Untitled Book");
  
  // Get fallback configuration
  const fallbackConfig = getBookFallbackConfig(props);
  
  // Get safe image props using utility
  const imageProps = getSafeImageProps(coverImage, safeTitle, {
    priority: true,
    fallbackConfig,
    loading: "eager",
  });

  return (
    <section
      className={clsx(
        "border-b border-gray-200 bg-gradient-to-br from-softGold/5 to-forest/5 dark:border-white/10 dark:bg-[#0a0b0d]"
      )}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16 md:flex-row md:items-start md:gap-16 md:py-20 lg:px-8">
        {/* LEFT: Content */}
        <div className="flex-1">
          {/* Book-specific metadata */}
          <div className="mb-6 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            {author && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-softGold">By</span>
                <span>{author}</span>
              </div>
            )}
            {publisher && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-softGold">Publisher:</span>
                <span>{publisher}</span>
              </div>
            )}
            {category && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-softGold">Category:</span>
                <span className="capitalize">{category}</span>
              </div>
            )}
          </div>

          <h1 className="mb-6 font-serif text-4xl font-bold leading-[1.2] text-gray-900 dark:text-white md:text-5xl">
            {safeTitle}
          </h1>

          {subtitle && (
            <p className="mb-8 text-lg leading-relaxed text-gray-700 dark:text-gray-100 md:text-xl">
              {subtitle}
            </p>
          )}

          {/* Book details */}
          <div className="mb-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            {publishedDate && (
              <div>
                <strong className="text-deepCharcoal dark:text-cream">
                  Published:
                </strong>{" "}
                {formatDate(publishedDate)}
              </div>
            )}
            {pages && (
              <div>
                <strong className="text-deepCharcoal dark:text-cream">
                  Pages:
                </strong>{" "}
                {pages}
              </div>
            )}
            {format && (
              <div>
                <strong className="text-deepCharcoal dark:text-cream">
                  Format:
                </strong>{" "}
                <span className="capitalize">{format}</span>
              </div>
            )}
            {isbn && (
              <div>
                <strong className="text-deepCharcoal dark:text-cream">
                  ISBN:
                </strong>{" "}
                {isbn}
              </div>
            )}
          </div>

          {/* Tags */}
          {tags && tags.length > 0 && (
            <div className="mb-6 flex flex-wrap gap-2">
              {tags
                .filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
                .slice(0, 5)
                .map((tag, index) => (
                  <span
                    key={`${tag}-${index}`}
                    className="rounded-full border border-gray-200/50 bg-gray-100/80 px-3 py-1 text-xs font-light text-gray-600 backdrop-blur-sm dark:border-white/20 dark:bg-white/10 dark:text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
            </div>
          )}

          {metaBits && (
            <p className="text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">
              {metaBits}
            </p>
          )}
        </div>

        {/* RIGHT: Book cover with enhanced styling */}
        {imageProps.src && (
          <div className="w-48 shrink-0 md:w-56 group">
            <div className="relative">
              {/* Decorative background */}
              <div className="absolute -right-2 -top-2 h-full w-full rounded-lg bg-softGold/20 transform rotate-2 transition-transform group-hover:rotate-1" />
              
              {/* Check if CoverFrame exists and use it, otherwise use Image directly */}
              {CoverFrame ? (
                <CoverFrame
                  src={imageProps.src}
                  alt={imageProps.alt}
                  aspect={coverAspect}
                  priority={imageProps.priority}
                  className="relative z-10 transform transition-transform group-hover:scale-105 shadow-2xl"
                />
              ) : (
                // Fallback to direct Image component if CoverFrame doesn't exist
                <div className="relative aspect-[3/4] overflow-hidden rounded-lg shadow-2xl">
                  <Image
                    src={imageProps.src}
                    alt={imageProps.alt}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    priority={imageProps.priority}
                    sizes="(min-width: 768px) 224px, 192px"
                  />
                </div>
              )}
              
              {/* Optional blur placeholder */}
              {imageProps.blurDataURL && (
                <div className="absolute inset-0 z-0 opacity-40 blur-lg">
                  <Image
                    src={imageProps.blurDataURL}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(min-width: 768px) 224px, 192px"
                  />
                </div>
              )}
            </div>

            {/* Book spine effect */}
            <div className="absolute -left-1 top-2 w-2 h-full bg-gradient-to-r from-gray-400/20 to-transparent rounded-l" />
          </div>
        )}
      </div>
    </section>
  );
}
