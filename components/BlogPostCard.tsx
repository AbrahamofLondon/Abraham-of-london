// components/BlogPostCard.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useMemo, useState, useCallback } from "react";

import { siteConfig } from "@/lib/imports";
import { safeString, isString } from "@/lib/utils";
import {
  getSafeImageProps,
  createFallbackSequence,
  type FallbackConfig,
} from "@/lib/image-utils";

// ✅ Use the shared PostLike type (single source of truth)
import type { PostLike } from "@/components/Cards/types";

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

function normalizeSlug(raw: unknown): string {
  const s = safeString(raw);
  return s ? s.replace(/^\/+|\/+$/g, "") : "";
}

function normalizeReadTime(readTime?: unknown): string | null {
  if (readTime === null || readTime === undefined) return null;

  if (typeof readTime === "number") return `${readTime} min read`;

  if (typeof readTime === "string") {
    const trimmed = readTime.trim();
    if (!trimmed) return null;

    const lower = trimmed.toLowerCase();
    if (lower.includes("min") || lower.includes("read")) return trimmed;

    const n = Number(trimmed);
    if (!Number.isNaN(n)) return `${n} min read`;

    return trimmed;
  }

  return null;
}

const shimmerStyles = `
  @keyframes shimmer {
    0% { transform: translateX(-120%); }
    100% { transform: translateX(120%); }
  }
`;

const ImageShimmer = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
    <div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent"
      style={{ animation: "shimmer 2s infinite" }}
    />
  </div>
);

// Best image source from content
function getPostImage(post: PostLike): string | null {
  // Check each source explicitly and return first valid one
  const coverImage = safeString(post.coverImage);
  if (coverImage && coverImage.trim() !== "") return coverImage.trim();
  
  const heroImage = safeString((post as any).heroImage);
  if (heroImage && heroImage.trim() !== "") return heroImage.trim();
  
  const image = safeString((post as any).image);
  if (image && image.trim() !== "") return image.trim();
  
  return null;
}

function getPostFallbackConfig(post: PostLike): FallbackConfig {
  let theme: FallbackConfig["theme"] = "gradient";
  let category = "default";

  const safeCategory = safeString((post as any).category)?.toLowerCase() || "";

  if (safeCategory.includes("essay")) category = "essay";
  else if (safeCategory.includes("article")) category = "article";
  else if (safeCategory.includes("thought")) category = "thought";
  else if (safeCategory) category = safeCategory;

  const tags = Array.isArray(post.tags) ? post.tags : [];
  if (tags.length > 0) {
    const firstTag = safeString(tags[0])?.toLowerCase() || "";
    if (firstTag.includes("philosophy") || firstTag.includes("deep")) theme = "dark";
    if (firstTag.includes("business") || firstTag.includes("strategy")) theme = "light";
  }

  return { type: "post", theme, category };
}

export default function BlogPostCard({
  post,
  priority = false,
  size = "default",
  showCategory = true,
  showAuthor = true,
  showTags = true,
  className = "",
  onClick,
}: BlogPostCardProps) {
  // ────────────────────────────────────────────────────────────────────────────
  // STATE
  // ────────────────────────────────────────────────────────────────────────────
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [authorImageError, setAuthorImageError] = useState(false);

  // ────────────────────────────────────────────────────────────────────────────
  // CORE DERIVED VALUES
  // ────────────────────────────────────────────────────────────────────────────
  const slug = useMemo(() => normalizeSlug(post.slug), [post.slug]);
  const href = useMemo(() => `/blog/${slug}`, [slug]);

  const safeTitle = useMemo(() => safeString(post.title) || "Untitled", [post.title]);
  const safeExcerpt = useMemo(() => safeString(post.excerpt) || "", [post.excerpt]);
  const safeCategory = useMemo(() => safeString((post as any).category) || "", [post]);

  const dateText = useMemo(() => formatDateISOToGB(post.date ?? null), [post.date]);
  const readText = useMemo(() => normalizeReadTime((post as any).readTime ?? (post as any).readingTime), [post]);

  // ✅ canonical config fallbacks (works regardless of legacy fields)
  const siteAuthorFallback = useMemo(() => {
    return (
      safeString((siteConfig as any).title) ||
      safeString((siteConfig as any).siteName) ||
      "Abraham of London"
    );
  }, []);

  // ✅ Author name/pic are declared ONCE, always in scope
  const authorName = useMemo(() => {
    const a = (post as any).author;

    if (typeof a === "string") return a;

    if (a && typeof a === "object") {
      const n = safeString((a as any).name) || safeString((a as any).displayName);
      if (n) return n;
    }

    return siteAuthorFallback;
  }, [post, siteAuthorFallback]);

  const authorPic = useMemo(() => {
    if (authorImageError) return FALLBACK_AVATAR;

    const a = (post as any).author;
    if (a && typeof a === "object" && safeString((a as any).picture)) {
      return String((a as any).picture);
    }
    if (a && typeof a === "object" && safeString((a as any).image)) {
      return String((a as any).image);
    }

    // optional: allow top-level authorPicture if present on PostLike
    const top = safeString((post as any).authorPicture);
    if (top) return top;

    return FALLBACK_AVATAR;
  }, [post, authorImageError]);

  const fallbackConfig = useMemo(() => getPostFallbackConfig(post), [post]);

  const fallbackSequence = useMemo(() => {
    const mainImage = getPostImage(post);
    const sequence: string[] = [];

    if (mainImage) sequence.push(mainImage);

    const generated = createFallbackSequence(`${slug}:${safeTitle}`, fallbackConfig);
    return [...sequence, ...generated];
  }, [post, slug, safeTitle, fallbackConfig]);

  const currentImage = useMemo(() => {
    if (!fallbackSequence.length) return "/assets/images/writing-desk.webp";
    return fallbackSequence[Math.min(fallbackIndex, fallbackSequence.length - 1)];
  }, [fallbackSequence, fallbackIndex]);

  const imageProps = useMemo(
    () =>
      getSafeImageProps(currentImage, safeTitle, {
        priority,
        fallbackConfig,
      }),
    [currentImage, safeTitle, priority, fallbackConfig],
  );

  const metaDisplay = useMemo(() => {
    const parts: string[] = [];
    if (dateText) parts.push(dateText);
    if (readText) parts.push(readText);
    return parts.join(" • ");
  }, [dateText, readText]);

  const sizeClasses = useMemo(
    () => ({
      compact: {
        container: "rounded-2xl",
        title: "text-lg md:text-xl",
        content: "p-4",
        image: "aspect-[16/9]",
        excerpt: "line-clamp-2 text-sm",
      },
      default: {
        container: "rounded-3xl",
        title: "text-xl md:text-2xl",
        content: "p-6",
        image: "aspect-[16/9]",
        excerpt: "line-clamp-3",
      },
      featured: {
        container: "rounded-[2rem]",
        title: "text-2xl md:text-3xl lg:text-4xl",
        content: "p-8",
        image: "aspect-[16/10]",
        excerpt: "line-clamp-4 text-base",
      },
    }),
    [],
  );

  const currentSize = sizeClasses[size];

  // ────────────────────────────────────────────────────────────────────────────
  // HANDLERS
  // ────────────────────────────────────────────────────────────────────────────
  const handleImageLoad = useCallback(() => {
    setImageLoaded(true);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageError(true);
    setImageLoaded(false);
    if (fallbackIndex < fallbackSequence.length - 1) {
      setFallbackIndex((prev) => prev + 1);
    }
  }, [fallbackIndex, fallbackSequence.length]);

  const handleAuthorImageError = useCallback(() => {
    setAuthorImageError(true);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!onClick) return;
      e.preventDefault();
      onClick(slug);
    },
    [onClick, slug],
  );

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{shimmerStyles}</style>

      <article
        className={[
          "group relative overflow-hidden border border-white/20 bg-white/95 backdrop-blur-sm shadow-xl shadow-black/10 transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/20",
          currentSize.container,
          className,
        ].join(" ")}
        aria-labelledby={`post-title-${slug}`}
      >
        <div
          className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/80 to-softGold/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden="true"
        />

        <Link
          href={href}
          className="block relative z-10"
          prefetch={false}
          onClick={handleClick}
          aria-label={`Read article: ${safeTitle}`}
        >
          {/* IMAGE */}
          <div className={`relative w-full overflow-hidden ${currentSize.image}`}>
            <div
              className="absolute inset-0 z-10 bg-gradient-to-t from-black/55 via-black/20 to-transparent opacity-60"
              aria-hidden="true"
            />

            {!imageLoaded && !imageError ? <ImageShimmer /> : null}

            <Image
              src={imageProps.src}
              alt={imageProps.alt}
              fill
              className={`object-cover transition-all duration-700 ${
                imageLoaded ? "opacity-100 group-hover:scale-[1.03]" : "opacity-0"
              }`}
              sizes="(min-width: 1024px) 600px, (min-width: 768px) 400px, 100vw"
              priority={imageProps.priority}
              loading={imageProps.loading}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />

            {/* TOP BADGES */}
            <div className="absolute left-4 top-4 z-20 flex flex-wrap gap-2">
              {showCategory && safeCategory ? (
                <div className="rounded-full border border-white/20 bg-black/55 px-3 py-1.5 backdrop-blur-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white">
                    {safeCategory}
                  </span>
                </div>
              ) : null}

              {Boolean((post as any).featured) ? (
                <div className="rounded-full border border-white/20 bg-gradient-to-r from-softGold to-amber-500 px-3 py-1.5 backdrop-blur-sm">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white">
                    Featured
                  </span>
                </div>
              ) : null}
            </div>

            {/* HOVER CTA */}
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <div className="rounded-full border border-white/20 bg-black/55 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm">
                Read Insight{readText ? <span className="ml-2 text-white/70">• {readText}</span> : null}
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className={`relative ${currentSize.content}`}>
            <h3
              id={`post-title-${slug}`}
              className={[
                "mb-3 line-clamp-2 font-serif font-light leading-tight text-deepCharcoal transition-colors duration-300 group-hover:text-forest",
                currentSize.title,
              ].join(" ")}
            >
              {safeTitle}
            </h3>

            {safeExcerpt ? (
              <p className={`mb-4 font-light leading-relaxed text-gray-600 ${currentSize.excerpt}`}>
                {safeExcerpt}
              </p>
            ) : null}

            {showAuthor ? (
              <div className="flex items-center justify-between border-t border-gray-100/60 pt-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div
                      className="absolute inset-0 rounded-full bg-softGold/15 transition-transform duration-300 group-hover:scale-110"
                      aria-hidden="true"
                    />
                    <Image
                      src={authorPic} // ✅ now always defined, always in scope
                      alt={`Author: ${authorName}`}
                      width={40}
                      height={40}
                      className="relative z-10 h-10 w-10 rounded-full border-2 border-white object-cover shadow-sm"
                      onError={handleAuthorImageError}
                    />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-deepCharcoal">{authorName}</span>
                    {metaDisplay ? (
                      <span className="text-xs font-light text-gray-500">{metaDisplay}</span>
                    ) : null}
                  </div>
                </div>

                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-softGold/10 text-softGold transition-colors group-hover:bg-softGold/20">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            ) : null}

            {showTags && Array.isArray(post.tags) && post.tags.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {post.tags
                  .filter((t): t is string => isString(t) && t.trim().length > 0)
                  .slice(0, 3)
                  .map((tag, idx) => (
                    <span
                      key={`${tag}-${idx}`}
                      className="rounded-full border border-gray-200/60 bg-gray-100/80 px-3 py-1 text-xs font-light text-gray-600 backdrop-blur-sm transition-colors hover:border-softGold/20 hover:bg-softGold/10 hover:text-softGold"
                    >
                      {tag}
                    </span>
                  ))}

                {post.tags.length > 3 ? (
                  <span className="rounded-full border border-gray-200/60 bg-gray-100/80 px-3 py-1 text-xs font-light text-gray-500">
                    +{post.tags.length - 3}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* bottom accent */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-softGold/0 via-softGold to-forest/0 transition-transform duration-500 group-hover:scale-x-100"
            aria-hidden="true"
          />
        </Link>
      </article>
    </>
  );
}

export type { BlogPostCardProps };
