// components/BlogPostCard.tsx - FIXED WITH PROPER TYPES
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useMemo, useState, useCallback } from "react";
import { siteConfig } from "@/lib/imports";
import { 
  getSafeImageProps, 
  createFallbackSequence,
  type FallbackConfig 
} from "@/lib/image-utils";
import { safeString, isString } from "@/lib/utils";

// PostLike is exported HERE
export type PostLike = {
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  heroImage?: string | null;
  image?: string | null;
  date?: string | null;
  readTime?: string | number | null;
  tags?: string[] | null;
  category?: string | null;
  author?:
    | { name?: string | null; picture?: string | null }
    | string
    | null
    | undefined;
  status?: "published" | "draft" | "scheduled";
  featured?: boolean;
};

// BlogPostCardProps is NOT exported here (no export keyword)
interface BlogPostCardProps {
  post: PostLike;
  priority?: boolean;
  size?: "default" | "featured" | "compact";
  showCategory?: boolean;
  showAuthor?: boolean;
  showTags?: boolean;
  className?: string;
  onClick?: (slug: string) => void;
}

// FIXED: Use proper fallback avatar path
const FALLBACK_AVATAR = "/assets/images/profile-portrait.webp";

function formatDateISOToGB(iso?: string | null): string | null {
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

function normalizePostSlug(raw: string): string {
  return safeString(raw)?.replace(/^\/+|\/+$/g, "") || "";
}

function formatReadTime(readTime?: string | number | null): string | null {
  if (readTime === null || readTime === undefined) return null;
  
  if (typeof readTime === 'number') {
    return `${readTime} min read`;
  }
  
  if (typeof readTime === 'string') {
    const trimmed = readTime.trim();
    if (!trimmed) return null;
    
    const lower = trimmed.toLowerCase();
    if (lower.includes('min') || lower.includes('read')) {
      return trimmed;
    }
    
    const asNumber = Number(trimmed);
    if (!isNaN(asNumber)) {
      return `${asNumber} min read`;
    }
    
    return trimmed;
  }
  
  return null;
}

// Enhanced shimmer effect component with defined animation
const ImageShimmer = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
    <div 
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
      style={{
        animation: 'shimmer 2s infinite',
      }}
    />
  </div>
);

// Define shimmer animation in styles
const shimmerStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

// Get best image source from post
const getPostImage = (post: PostLike): string | null => {
  const sources = [post.coverImage, post.heroImage, post.image];
  for (const src of sources) {
    if (src && typeof src === 'string' && src.trim().length > 0) {
      return src.trim();
    }
  }
  return null;
};

// Get fallback configuration based on post data
const getPostFallbackConfig = (post: PostLike): FallbackConfig => {
  const type = "post";
  let theme: FallbackConfig['theme'] = "gradient";
  let category = "default";

  const safeCategory = safeString(post.category)?.toLowerCase() || "";
  
  if (safeCategory.includes('essay')) category = 'essay';
  else if (safeCategory.includes('article')) category = 'article';
  else if (safeCategory.includes('thought')) category = 'thought';
  else if (safeCategory) category = safeCategory;

  if (post.tags && post.tags.length > 0) {
    const firstTag = safeString(post.tags[0])?.toLowerCase() || "";
    if (firstTag.includes('philosophy') || firstTag.includes('deep')) {
      theme = 'dark';
    } else if (firstTag.includes('business') || firstTag.includes('strategy')) {
      theme = 'light';
    }
  }

  return { type, theme, category };
};

function BlogPostCard({
  post,
  priority = false,
  size = "default",
  showCategory = true,
  showAuthor = true,
  showTags = true,
  className = "",
  onClick,
}: BlogPostCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [authorImageError, setAuthorImageError] = useState(false);

  const slug = useMemo(() => normalizePostSlug(post.slug), [post.slug]);
  const href = useMemo(() => `/${slug}`, [slug]);
  const fallbackConfig = useMemo(() => getPostFallbackConfig(post), [post]);

  // Create fallback sequence
  const fallbackSequence = useMemo(() => {
    const mainImage = getPostImage(post);
    const sequence: string[] = [];

    if (mainImage) {
      sequence.push(mainImage);
    }

    // Add fallback images based on configuration
    const additionalFallbacks = createFallbackSequence(
      post.slug + safeString(post.title),
      fallbackConfig
    );
    
    return [...sequence, ...additionalFallbacks];
  }, [post, fallbackConfig]);

  // Get current image URL
  const currentImage = useMemo(() => 
    fallbackSequence[Math.min(fallbackIndex, fallbackSequence.length - 1)],
    [fallbackSequence, fallbackIndex]
  );

  // Get safe image props using utility
  const imageProps = useMemo(() => 
    getSafeImageProps(currentImage, safeString(post.title) || "Blog post", {
      priority,
      fallbackConfig,
    }),
    [currentImage, post.title, priority, fallbackConfig]
  );

  const authorName = useMemo(() => {
    if (typeof post.author === "string") return post.author;
    return post.author?.name || siteConfig.title; // Use title instead of author
  }, [post.author]);

  const authorPic = useMemo(() => {
    if (authorImageError) return FALLBACK_AVATAR;
    if (typeof post.author !== "string" && post.author?.picture) {
      return post.author.picture;
    }
    return FALLBACK_AVATAR;
  }, [post.author, authorImageError]);

  const dateText = useMemo(() => formatDateISOToGB(post.date), [post.date]);
  const readText = useMemo(() => formatReadTime(post.readTime), [post.readTime]);

  // Enhanced size-based styling
  const sizeClasses = useMemo(() => ({
    compact: {
      container: "rounded-2xl",
      title: "text-lg md:text-xl",
      content: "p-4",
      image: "aspect-[16/9]",
      excerpt: "line-clamp-2 text-sm",
      meta: "text-xs",
    },
    default: {
      container: "rounded-3xl",
      title: "text-xl md:text-2xl",
      content: "p-6",
      image: "aspect-[16/9]",
      excerpt: "line-clamp-3",
      meta: "text-sm",
    },
    featured: {
      container: "rounded-4xl",
      title: "text-2xl md:text-3xl lg:text-4xl",
      content: "p-8",
      image: "aspect-[16/10]",
      excerpt: "line-clamp-4 text-base",
      meta: "text-base",
    },
  }), []);

  const currentSize = sizeClasses[size];

  // Status badge color mapping
  const statusColors = useMemo(() => ({
    draft: "bg-gray-100 text-gray-800 border-gray-200",
    scheduled: "bg-blue-100 text-blue-800 border-blue-200",
    published: "bg-green-100 text-green-800 border-green-200",
  }), []);

  // Handle image events
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
    if (fallbackIndex < fallbackSequence.length - 1) {
      setFallbackIndex(prev => prev + 1);
    }
  }, [fallbackIndex, fallbackSequence.length]);

  const handleAuthorImageError = useCallback(() => {
    setAuthorImageError(true);
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (onClick) {
      e.preventDefault();
      onClick(slug);
    }
  }, [onClick, slug]);

  const metaDisplay = useMemo(() => {
    const parts: string[] = [];
    if (dateText) parts.push(dateText);
    if (readText) parts.push(readText);
    return parts.join(' • ');
  }, [dateText, readText]);

  const safeTitle = safeString(post.title);
  const safeExcerpt = safeString(post.excerpt);
  const safeCategory = safeString(post.category);

  return (
    <>
      <style>{shimmerStyles}</style>
      <article
        className={`group relative overflow-hidden bg-white/95 backdrop-blur-sm shadow-2xl shadow-black/10 border border-white/20 transition-all duration-700 hover:shadow-3xl hover:shadow-black/20 hover:-translate-y-2 ${currentSize.container} ${className}`}
        role="article"
        aria-labelledby={`post-title-${slug}`}
      >
        {/* Enhanced background effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/80 to-softGold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden="true" />

        {/* Animated border glow */}
        <div
          className={`absolute inset-0 bg-gradient-to-r from-softGold/0 via-softGold/10 to-forest/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${currentSize.container}`}
          aria-hidden="true"
        />

        <Link 
          href={href} 
          className="block relative z-10" 
          prefetch={false}
          onClick={handleClick}
          aria-label={`Read article: ${safeTitle}`}
        >
          {/* Enhanced image container */}
          <div className={`relative w-full overflow-hidden ${currentSize.image}`}>
            {/* Gradient overlays */}
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60" aria-hidden="true" />
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />

            {/* Enhanced loading shimmer */}
            {!imageLoaded && !imageError && <ImageShimmer />}

            <Image
              src={imageProps.src}
              alt={imageProps.alt}
              fill
              className={`object-cover transition-all duration-700 ${
                imageLoaded ? "opacity-100 group-hover:scale-105" : "opacity-0"
              }`}
              sizes="(min-width: 1024px) 600px, (min-width: 768px) 400px, 100vw"
              priority={imageProps.priority}
              loading={imageProps.loading}
              onLoad={handleImageLoad}
              onError={handleImageError}
              aria-hidden="true"
            />

            {/* Enhanced badge overlay */}
            <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
              {showCategory && safeCategory && (
                <div 
                  className="rounded-full border border-white/20 bg-black/60 px-3 py-1.5 backdrop-blur-sm shadow-lg"
                  role="note"
                  aria-label={`Category: ${safeCategory}`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-white">
                    {safeCategory}
                  </span>
                </div>
              )}

              {post.featured && (
                <div 
                  className="rounded-full border border-white/20 bg-gradient-to-r from-softGold to-amber-500 px-3 py-1.5 backdrop-blur-sm shadow-lg"
                  role="note"
                  aria-label="Featured article"
                >
                  <span className="text-xs font-semibold uppercase tracking-wider text-white">
                    Featured
                  </span>
                </div>
              )}

              {post.status && post.status !== "published" && (
                <div
                  className={`rounded-full border px-3 py-1.5 backdrop-blur-sm shadow-lg ${statusColors[post.status]}`}
                  role="note"
                  aria-label={`Status: ${post.status}`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider">
                    {post.status}
                  </span>
                </div>
              )}
            </div>

            {/* Enhanced hover overlay */}
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 opacity-0 transition-all duration-500 group-hover:opacity-100">
              <div className="transform translate-y-4 transition-transform duration-500 group-hover:translate-y-0 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div 
                    className="flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm"
                    role="button"
                    aria-label="Read article"
                  >
                    <span>Read Insight</span>
                    <svg
                      className="h-4 w-4 transform transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </div>
                  {readText && (
                    <span className="text-xs text-white/80 font-light">
                      {readText}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced content container */}
          <div className={`relative ${currentSize.content}`}>
            {/* Title with enhanced typography */}
            <h3
              id={`post-title-${slug}`}
              className={`mb-3 line-clamp-2 font-serif font-light leading-tight text-deepCharcoal transition-colors duration-300 group-hover:text-forest ${currentSize.title}`}
            >
              {safeTitle}
            </h3>

            {/* Enhanced excerpt */}
            {safeExcerpt ? (
              <p
                className={`mb-4 font-light leading-relaxed text-gray-600 ${currentSize.excerpt}`}
              >
                {safeExcerpt}
              </p>
            ) : null}

            {/* Enhanced author and metadata */}
            {showAuthor && (
              <div className="flex items-center justify-between border-t border-gray-100/50 pt-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-softGold/20 transform transition-transform duration-300 group-hover:scale-110" aria-hidden="true" />
                    <Image
                      src={authorPic}
                      alt={`Author: ${authorName}`}
                      width={40}
                      height={40}
                      className="relative z-10 h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
                      onError={handleAuthorImageError}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-deepCharcoal">
                      {authorName}
                    </span>
                    {metaDisplay && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-light">{metaDisplay}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div 
                  className="transform translate-x-2 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                  aria-hidden="true"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-softGold/10 transition-colors group-hover:bg-softGold/20">
                    <svg
                      className="h-4 w-4 text-softGold"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
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
            )}

            {/* Enhanced tags */}
            {showTags && post.tags && post.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags
                  .filter((tag): tag is string => isString(tag) && tag.trim().length > 0)
                  .slice(0, 3)
                  .map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className="rounded-full border border-gray-200/50 bg-gray-100/80 px-3 py-1 text-xs font-light text-gray-600 backdrop-blur-sm transition-all duration-300 hover:border-softGold/20 hover:bg-softGold/10 hover:text-softGold"
                      role="note"
                      aria-label={`Tag: ${tag}`}
                    >
                      {tag}
                    </span>
                  ))}
                {post.tags.length > 3 && (
                  <span 
                    className="rounded-full border border-gray-200/50 bg-gray-100/80 px-3 py-1 text-xs font-light text-gray-500 backdrop-blur-sm"
                    aria-label={`${post.tags.length - 3} more tags`}
                  >
                    +{post.tags.length - 3}
                  </span>
                )}
              </div>
            ) : null}
          </div>

          {/* Enhanced bottom border animation */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-1 origin-left transform scale-x-0 bg-gradient-to-r from-softGold/0 via-softGold to-forest/0 transition-transform duration-500 group-hover:scale-x-100"
            aria-hidden="true"
          />
        </Link>
      </article>
    </>
  );
}

export { BlogPostCard };
export type { BlogPostCardProps };
export default BlogPostCard;
