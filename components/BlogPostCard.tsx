// components/BlogPostCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { siteConfig } from "@/lib/siteConfig";

type PostLike = {
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

interface BlogPostCardProps {
  post: PostLike;
  priority?: boolean;
  size?: "default" | "featured" | "compact";
  showCategory?: boolean;
  showAuthor?: boolean;
  showTags?: boolean;
  className?: string;
}

const FALLBACK_AVATAR =
  siteConfig.authorImage ?? "/assets/images/profile-portrait.webp";

const FALLBACK_COVERS = [
  "/assets/images/blog/default.webp",
  "/assets/images/writing-desk.webp",
];

function formatDateISOToGB(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

function normalisePostSlug(raw: string): string {
  return (raw || "").toString().trim().replace(/^\/+|\/+$/g, "");
}

// Enhanced shimmer effect component
const ImageShimmer = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" />
  </div>
);

export default function BlogPostCard({
  post,
  priority = false,
  size = "default",
  showCategory = true,
  showAuthor = true,
  showTags = true,
  className = "",
}: BlogPostCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [coverIndex, setCoverIndex] = useState(0);
  const [authorImageError, setAuthorImageError] = useState(false);

  const slug = normalisePostSlug(post.slug);
  const href = `/${slug}`;

  // Build ordered list of possible cover images
  const coverCandidates = useMemo(() => {
    const candidates: string[] = [];

    const addCandidate = (value?: string | null) => {
      if (typeof value === "string" && value.trim().length > 0) {
        candidates.push(value.trim());
      }
    };

    addCandidate(post.coverImage);
    addCandidate(post.heroImage);
    addCandidate(post.image);

    // Ensure at least our known-good fallbacks are present
    for (const fb of FALLBACK_COVERS) {
      if (!candidates.includes(fb)) {
        candidates.push(fb);
      }
    }

    return candidates;
  }, [post.coverImage, post.heroImage, post.image]);

  const cover = coverCandidates[Math.min(coverIndex, coverCandidates.length - 1)];

  const authorName =
    typeof post.author === "string"
      ? post.author
      : post.author?.name || "Abraham of London";

  const authorPic = authorImageError 
    ? FALLBACK_AVATAR
    : (typeof post.author !== "string" && post.author?.picture) || FALLBACK_AVATAR;

  const dateText = formatDateISOToGB(post.date);

  const readText =
    typeof post.readTime === "number"
      ? `${post.readTime} min read`
      : typeof post.readTime === "string" && post.readTime.trim()
      ? post.readTime
      : null;

  // Enhanced size-based styling
  const sizeClasses = {
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
  } as const;

  const currentSize = sizeClasses[size];

  // Status badge color mapping
  const statusColors = {
    draft: "bg-gray-100 text-gray-800 border-gray-200",
    scheduled: "bg-blue-100 text-blue-800 border-blue-200",
    published: "bg-green-100 text-green-800 border-green-200",
  };

  return (
    <article
      className={`group relative overflow-hidden bg-white/95 backdrop-blur-sm shadow-2xl shadow-black/10 border border-white/20 transition-all duration-700 hover:shadow-3xl hover:shadow-black/20 hover:-translate-y-2 ${currentSize.container} ${className}`}
    >
      {/* Enhanced background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/80 to-softGold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Animated border glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-softGold/0 via-softGold/10 to-forest/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${currentSize.container}`}
      />

      <Link href={href} className="block relative z-10" prefetch={false}>
        {/* Enhanced image container */}
        <div className={`relative w-full overflow-hidden ${currentSize.image}`}>
          {/* Gradient overlays */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-60" />
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* Enhanced loading shimmer */}
          {!imageLoaded && <ImageShimmer />}

          <Image
            src={cover}
            alt={post.title}
            fill
            className={`object-cover transition-all duration-700 ${
              imageLoaded ? "opacity-100 group-hover:scale-105" : "opacity-0"
            }`}
            sizes="(min-width: 1024px) 600px, (min-width: 768px) 400px, 100vw"
            priority={priority}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              setImageLoaded(false);
              setCoverIndex((prev) =>
                prev + 1 < coverCandidates.length ? prev + 1 : prev,
              );
            }}
          />

          {/* Enhanced badge overlay */}
          <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
            {showCategory && post.category && (
              <div className="rounded-full border border-white/20 bg-black/60 px-3 py-1.5 backdrop-blur-sm shadow-lg">
                <span className="text-xs font-semibold uppercase tracking-wider text-white">
                  {post.category}
                </span>
              </div>
            )}
            
            {post.featured && (
              <div className="rounded-full border border-white/20 bg-gradient-to-r from-softGold to-amber-500 px-3 py-1.5 backdrop-blur-sm shadow-lg">
                <span className="text-xs font-semibold uppercase tracking-wider text-white">
                  Featured
                </span>
              </div>
            )}
            
            {post.status && post.status !== 'published' && (
              <div className={`rounded-full border px-3 py-1.5 backdrop-blur-sm shadow-lg ${statusColors[post.status]}`}>
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
                <div className="flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                  <span>Read Insight</span>
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
            className={`mb-3 line-clamp-2 font-serif font-light leading-tight text-deepCharcoal transition-colors duration-300 group-hover:text-forest ${currentSize.title}`}
          >
            {post.title}
          </h3>

          {/* Enhanced excerpt */}
          {post.excerpt ? (
            <p className={`mb-4 font-light leading-relaxed text-gray-600 ${currentSize.excerpt}`}>
              {post.excerpt}
            </p>
          ) : null}

          {/* Enhanced author and metadata */}
          {showAuthor && (
            <div className="flex items-center justify-between border-t border-gray-100/50 pt-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-softGold/20 transform transition-transform duration-300 group-hover:scale-110" />
                  <Image
                    src={authorPic}
                    alt={authorName}
                    width={40}
                    height={40}
                    className="relative z-10 h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
                    onError={() => setAuthorImageError(true)}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-deepCharcoal">
                    {authorName}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    {dateText && (
                      <time
                        dateTime={post.date || undefined}
                        className="font-light"
                      >
                        {dateText}
                      </time>
                    )}
                    {readText && dateText && (
                      <span className="text-softGold">•</span>
                    )}
                    {readText && <span className="font-light">{readText}</span>}
                  </div>
                </div>
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
          )}

          {/* Enhanced tags */}
          {showTags && post.tags && post.tags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((t, i) => (
                <span
                  key={`${String(t)}-${i}`}
                  className="rounded-full border border-gray-200/50 bg-gray-100/80 px-3 py-1 text-xs font-light text-gray-600 backdrop-blur-sm transition-all duration-300 hover:border-softGold/20 hover:bg-softGold/10 hover:text-softGold"
                >
                  {String(t)}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="rounded-full border border-gray-200/50 bg-gray-100/80 px-3 py-1 text-xs font-light text-gray-500 backdrop-blur-sm">
                  +{post.tags.length - 3}
                </span>
              )}
            </div>
          ) : null}
        </div>

        {/* Enhanced bottom border animation */}
        <div className="absolute bottom-0 left-0 right-0 h-1 origin-left transform scale-x-0 bg-gradient-to-r from-softGold/0 via-softGold to-forest/0 transition-transform duration-500 group-hover:scale-x-100" />
      </Link>
    </article>
  );
}