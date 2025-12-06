// components/books/BookCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import type { Book } from "@/types/index";
import { safeString } from "@/lib/utils";
import { 
  getSafeImageProps, 
  getFallbackImage,
  type FallbackConfig 
} from "@/lib/image-utils";

// Instead of extending, create a new type that's compatible with both
interface BookCardBook {
  // Required fields from Book interface
  _id: string;
  slug: string;
  title: string;
  
  // Optional fields with explicit null/undefined handling
  excerpt?: string | null;
  description?: string | null;
  date?: string | null;
  coverImage?: string | null;
  
  // Extended properties
  status?: "published" | "draft" | "archived";
  format?: string | null;
  featured?: boolean;
  tags?: (string | null)[];
  readTime?: string | number | null;
  author?: string | null;
  
  // Allow any additional properties that might exist on Book
  [key: string]: unknown;
}

interface BookCardProps {
  book: BookCardBook;
  className?: string;
  priority?: boolean;
  size?: "default" | "featured";
}

const formatDateSafe = (dateString: string | null | undefined): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

const getReadTimeText = (readTime: string | number | null | undefined): string => {
  if (!readTime) return "";
  
  if (typeof readTime === "number") {
    return `${readTime} min read`;
  }
  
  if (typeof readTime === "string") {
    // Check if it's already formatted
    if (readTime.includes("min")) return readTime;
    // Try to parse as number
    const num = parseInt(readTime);
    if (!isNaN(num)) return `${num} min read`;
    return readTime;
  }
  
  return "";
};

export default function BookCard({
  book,
  className = "",
  priority = false,
  size = "default",
}: BookCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);

  // Safely extract all values with defaults
  const safeTitle = safeString(book.title, "Untitled Book");
  const safeExcerpt = safeString(book.excerpt, "");
  const safeDate = formatDateSafe(book.date);
  const safeSlug = safeString(book.slug);
  const safeAuthor = safeString(book.author);
  const safeFormat = safeString(book.format);
  const readTimeText = getReadTimeText(book.readTime);
  
  // Determine category for fallback images
  const category = useMemo(() => {
    if (book.tags && book.tags.length > 0) {
      const firstTag = safeString(book.tags[0]);
      if (firstTag.includes("philosophy")) return "philosophy";
      if (firstTag.includes("business")) return "business";
      if (firstTag.includes("fiction")) return "fiction";
      if (firstTag.includes("non-fiction") || firstTag.includes("nonfiction")) return "nonFiction";
    }
    return "default";
  }, [book.tags]);

  // Prepare fallback configuration
  const fallbackConfig: FallbackConfig = {
    type: "book",
    category,
    theme: "gradient",
  };

  // Get safe image props using our utility
  const imageProps = getSafeImageProps(book.coverImage, safeTitle, {
    priority,
    fallbackConfig,
  });

  // Handle image load
  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  // Handle image error
  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
    setFallbackIndex(prev => prev + 1);
  };

  // Size-based styling
  const sizeClasses = {
    default: {
      container: "rounded-3xl",
      title: "text-xl md:text-2xl",
      content: "p-6",
      image: "aspect-[3/4]",
      excerpt: "line-clamp-3",
    },
    featured: {
      container: "rounded-4xl",
      title: "text-2xl md:text-3xl",
      content: "p-8",
      image: "aspect-[3/4]",
      excerpt: "line-clamp-4",
    },
  } as const;

  const currentSize = sizeClasses[size];
  const href = safeSlug ? `/books/${safeSlug}` : "#";

  return (
    <article
      className={`group relative overflow-hidden bg-white/95 backdrop-blur-sm shadow-2xl shadow-black/10 border border-white/20 transition-all duration-700 hover:shadow-3xl hover:shadow-black/20 hover:-translate-y-2 ${currentSize.container} ${className}`}
    >
      {/* Premium background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/80 to-softGold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Animated border glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-softGold/0 via-softGold/10 to-forest/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${currentSize.container}`}
      />

      <Link href={href} className="block relative z-10 h-full" prefetch={false}>
        <div className="flex h-full flex-col">
          {/* Image container with premium overlay */}
          <div
            className={`relative w-full overflow-hidden ${currentSize.image}`}
          >
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

            {/* Loading shimmer */}
            {!imageLoaded && !imageError && (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
            )}

            {/* Image */}
            <Image
              src={imageProps.src}
              alt={imageProps.alt}
              fill
              className={`object-cover transition-all duration-700 ${
                imageLoaded ? "opacity-100 group-hover:scale-110" : "opacity-0"
              }`}
              sizes="(min-width: 1024px) 400px, (min-width: 768px) 300px, 100vw"
              priority={imageProps.priority}
              loading={imageProps.loading}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />

            {/* Featured badge overlay */}
            {book.featured && (
              <div className="absolute left-4 top-4 z-20">
                <div className="rounded-full border border-white/10 bg-gradient-to-r from-softGold to-amber-500 px-3 py-1.5 backdrop-blur-sm shadow-lg">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white">
                    Featured
                  </span>
                </div>
              </div>
            )}

            {/* Hover overlay with read more */}
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 transition-all duration-500 group-hover:opacity-100">
              <div className="transform translate-y-4 transition-transform duration-500 group-hover:translate-y-0">
                <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                  <span>View Details</span>
                  <svg
                    className="h-4 w-4 transform transition-transform group-hover:translate-x-1"
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

            {/* Book corner fold effect */}
            <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-black/20 to-transparent z-10" />
          </div>

          {/* Content container */}
          <div
            className={`relative flex flex-col flex-1 ${currentSize.content}`}
          >
            {/* Title with gradient hover effect */}
            <h3
              className={`mb-3 line-clamp-2 font-serif font-light leading-tight text-deepCharcoal transition-colors duration-300 group-hover:text-forest ${currentSize.title}`}
            >
              {safeTitle}
            </h3>

            {/* Author */}
            {safeAuthor && (
              <p className="mb-3 text-sm font-medium text-softGold">
                by {safeAuthor}
              </p>
            )}

            {/* Excerpt with improved typography */}
            {safeExcerpt && (
              <p
                className={`mb-4 flex-1 font-light leading-relaxed text-gray-600 ${currentSize.excerpt}`}
              >
                {safeExcerpt}
              </p>
            )}

            {/* Metadata and footer */}
            <div className="mt-auto space-y-4">
              {/* Status badges */}
              <div className="flex flex-wrap gap-2">
                {book.status && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      book.status === "published"
                        ? "bg-green-100 text-green-800 border border-green-200"
                        : book.status === "draft"
                        ? "bg-gray-100 text-gray-800 border border-gray-200"
                        : "bg-blue-100 text-blue-800 border border-blue-200"
                    }`}
                  >
                    {book.status.charAt(0).toUpperCase() + book.status.slice(1)}
                  </span>
                )}

                {safeFormat && (
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 border border-gray-200">
                    {safeFormat}
                  </span>
                )}
              </div>

              {/* Date and read time */}
              <div className="flex items-center justify-between border-t border-gray-100/50 pt-4">
                <div className="flex flex-col gap-1">
                  {safeDate && (
                    <time
                      dateTime={book.date || undefined}
                      className="text-xs font-light text-gray-500"
                    >
                      {safeDate}
                    </time>
                  )}
                  {readTimeText && (
                    <span className="text-xs font-light text-gray-500">
                      {readTimeText}
                    </span>
                  )}
                </div>

                <div className="transform translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-softGold/10 transition-colors group-hover:bg-softGold/20">
                    <svg
                      className="h-4 w-4 text-softGold"
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

              {/* Tags */}
              {book.tags && book.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {book.tags
                    .filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
                    .slice(0, 3)
                    .map((tag, index) => (
                      <span
                        key={`${tag}-${index}`}
                        className="rounded-full border border-gray-200/50 bg-gray-100/80 px-2 py-1 text-xs font-light text-gray-600 backdrop-blur-sm transition-all duration-300 hover:border-softGold/20 hover:bg-softGold/10 hover:text-softGold"
                      >
                        {tag}
                      </span>
                    ))}
                  {book.tags.length > 3 && (
                    <span className="rounded-full border border-gray-200/50 bg-gray-100/80 px-2 py-1 text-xs font-light text-gray-500 backdrop-blur-sm">
                      +{book.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Animated bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-1 origin-left transform scale-x-0 bg-gradient-to-r from-softGold/0 via-softGold to-forest/0 transition-transform duration-500 group-hover:scale-x-100" />
      </Link>
    </article>
  );
}