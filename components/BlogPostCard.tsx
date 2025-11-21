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
};

interface BlogPostCardProps {
  post: PostLike;
  priority?: boolean;
  size?: "default" | "featured";
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
  const s = (raw || "").toString().trim().replace(/^\/+|\/+$/g, "");
  return s.replace(/^blog\//i, "");
}

export default function BlogPostCard({
  post,
  priority = false,
  size = "default",
}: BlogPostCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [coverIndex, setCoverIndex] = useState(0);

  const slug = normalisePostSlug(post.slug);
  const href = `/${encodeURIComponent(slug)}`;

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

  const authorPic =
    (typeof post.author !== "string" && post.author?.picture) ||
    FALLBACK_AVATAR;

  const dateText = formatDateISOToGB(post.date);

  const readText =
    typeof post.readTime === "number"
      ? `${post.readTime} min read`
      : typeof post.readTime === "string" && post.readTime.trim()
      ? post.readTime
      : null;

  // Size-based styling
  const sizeClasses = {
    default: {
      container: "rounded-3xl",
      title: "text-xl md:text-2xl",
      content: "p-6",
      image: "aspect-[16/9]",
    },
    featured: {
      container: "rounded-4xl",
      title: "text-2xl md:text-3xl",
      content: "p-8",
      image: "aspect-[16/10]",
    },
  } as const;

  const currentSize = sizeClasses[size];

  return (
    <article
      className={`group relative overflow-hidden bg-white/95 backdrop-blur-sm shadow-2xl shadow-black/10 border border-white/20 transition-all duration-700 hover:shadow-3xl hover:shadow-black/20 hover:-translate-y-2 ${currentSize.container}`}
    >
      {/* Premium background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/80 to-softGold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Animated border glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-softGold/0 via-softGold/10 to-forest/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${currentSize.container}`}
      />

      <Link href={href} className="block relative z-10" prefetch={false}>
        {/* Image container with premium overlay */}
        <div className={`relative w-full overflow-hidden ${currentSize.image}`}>
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-black/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* Loading shimmer */}
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200" />
          )}

          <Image
            src={cover}
            alt={post.title}
            fill
            className={`object-cover transition-all duration-700 ${
              imageLoaded ? "opacity-100 group-hover:scale-110" : "opacity-0"
            }`}
            sizes="(min-width: 1024px) 600px, 100vw"
            priority={priority}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              // Move to the next candidate if one exists
              setImageLoaded(false);
              setCoverIndex((prev) =>
                prev + 1 < coverCandidates.length ? prev + 1 : prev,
              );
            }}
          />

          {/* Category badge overlay */}
          {post.category && (
            <div className="absolute left-4 top-4 z-20">
              <div className="rounded-full border border-white/10 bg-black/60 px-3 py-1.5 backdrop-blur-sm">
                <span className="text-xs font-medium uppercase tracking-wider text-white">
                  {post.category}
                </span>
              </div>
            </div>
          )}

          {/* Hover overlay with read more */}
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 opacity-0 transition-all duration-500 group-hover:opacity-100">
            <div className="transform translate-y-4 transition-transform duration-500 group-hover:translate-y-0">
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
            </div>
          </div>
        </div>

        {/* Content container */}
        <div className={`relative ${currentSize.content}`}>
          {/* Title with gradient hover effect */}
          <h3
            className={`mb-3 line-clamp-2 font-serif font-light leading-tight text-deepCharcoal transition-colors duration-300 group-hover:text-forest ${currentSize.title}`}
          >
            {post.title}
          </h3>

          {/* Excerpt with improved typography */}
          {post.excerpt ? (
            <p className="mb-4 line-clamp-3 text-sm font-light leading-relaxed text-gray-600">
              {post.excerpt}
            </p>
          ) : null}

          {/* Author and metadata - premium layout */}
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
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-deepCharcoal">
                  {authorName}
                </span>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  {dateText && (
                    <time dateTime={post.date || undefined} className="font-light">
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

            {/* Premium arrow indicator */}
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

          {/* Tags - premium styling */}
          {post.tags && post.tags.length > 0 ? (
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

        {/* Premium bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 origin-left transform scale-x-0 bg-gradient-to-r from-softGold/0 via-softGold to-forest/0 transition-transform duration-500 group-hover:scale-x-100" />
      </Link>
    </article>
  );
}