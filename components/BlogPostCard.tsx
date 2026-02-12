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

// Import the safe utilities
import { safeSlice } from "@/lib/utils/safe";

// ✅ Use the shared PostLike type (single source of truth)
import type { PostLike } from "@/components/Cards/types";

interface BlogPostCardProps {
  post: PostLike;
  priority?: boolean;
  size?: "default" | "featured" | "compact" | "luxury";
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
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-5px); }
  }
`;

const ImageShimmer = () => (
  <div className="absolute inset-0 overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-r from-gray-100 via-gray-50/80 to-gray-100 animate-pulse" />
    <div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
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
    if (firstTag.includes("luxury") || firstTag.includes("premium")) theme = "luxury";
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
        container: "rounded-xl",
        title: "text-lg md:text-xl font-serif font-light",
        content: "p-4",
        image: "aspect-[16/9]",
        excerpt: "line-clamp-2 text-sm font-light leading-relaxed",
        meta: "text-xs",
      },
      default: {
        container: "rounded-2xl",
        title: "text-xl md:text-2xl font-serif font-light tracking-tight",
        content: "p-5 md:p-6",
        image: "aspect-[16/10]",
        excerpt: "line-clamp-3 font-light leading-relaxed",
        meta: "text-sm",
      },
      featured: {
        container: "rounded-[1.5rem] md:rounded-[2rem]",
        title: "text-2xl md:text-3xl lg:text-4xl font-serif font-light tracking-tight",
        content: "p-6 md:p-8",
        image: "aspect-[16/9] md:aspect-[21/9]",
        excerpt: "line-clamp-4 text-base md:text-lg font-light leading-relaxed",
        meta: "text-sm md:text-base",
      },
      luxury: {
        container: "rounded-3xl",
        title: "text-2xl md:text-3xl lg:text-4xl font-serif font-light tracking-tight",
        content: "p-8",
        image: "aspect-[4/3]",
        excerpt: "line-clamp-3 text-base md:text-lg font-light leading-relaxed",
        meta: "text-sm",
      },
    }),
    [],
  );

  const currentSize = sizeClasses[size];

  // Filter and slice tags safely
  // Filter and slice tags safely – now properly typed as string[]
const displayTags = useMemo(() => {
  if (!showTags || !Array.isArray(post.tags)) return [];
  
  // ✅ Type predicate: filters out non‑strings and narrows type to string[]
  const validTags = post.tags.filter((t): t is string => 
    typeof t === 'string' && t.trim().length > 0
  );
  
  // ✅ Explicit generic ensures safeSlice returns string[], not unknown[]
  return safeSlice<string>(validTags, 0, 3);
}, [post.tags, showTags]);

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
          "group relative overflow-hidden bg-gradient-to-br from-white via-white to-ivory",
          "shadow-2xl shadow-black/[0.02] transition-all duration-700",
          "hover:shadow-3xl hover:shadow-black/[0.04] hover:-translate-y-1",
          "border border-slate-100/80 backdrop-blur-sm",
          size === "luxury" && "hover:scale-[1.01]",
          currentSize.container,
          className,
        ].filter(Boolean).join(" ")}
        aria-labelledby={`post-title-${slug}`}
        style={{ animation: "fadeInUp 0.6s ease-out" }}
      >
        {/* Premium background effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-softGold/5" />
        
        {/* Luxury accent border */}
        <div className="absolute inset-0 rounded-inherit border border-slate-100/50 pointer-events-none" />
        
        {/* Hover shine effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-softGold/[0.02] to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

        <Link
          href={href}
          className="block relative z-10"
          prefetch={false}
          onClick={handleClick}
          aria-label={`Read article: ${safeTitle}`}
        >
          {/* IMAGE CONTAINER */}
          <div className={`relative w-full overflow-hidden ${currentSize.image} rounded-t-inherit`}>
            {/* Elegant overlay gradient */}
            <div
              className="absolute inset-0 z-10 bg-gradient-to-t from-black/40 via-black/15 to-transparent"
              aria-hidden="true"
            />
            
            {/* Luxury accent line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent z-20" />

            {!imageLoaded && !imageError ? <ImageShimmer /> : null}

            <Image
              src={imageProps.src}
              alt={imageProps.alt}
              fill
              className={`object-cover transition-all duration-1000 ${
                imageLoaded 
                  ? "opacity-100 group-hover:scale-[1.03] group-hover:brightness-110" 
                  : "opacity-0"
              }`}
              sizes="(min-width: 1536px) 640px, (min-width: 1280px) 560px, (min-width: 1024px) 480px, (min-width: 768px) 400px, 100vw"
              priority={imageProps.priority}
              loading={imageProps.loading}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />

            {/* TOP BADGES - Luxury styling */}
            <div className="absolute left-6 top-6 z-30 flex flex-wrap gap-3">
              {showCategory && safeCategory ? (
                <div className="rounded-full border border-white/30 bg-black/40 backdrop-blur-xl px-4 py-2 transition-all duration-500 group-hover:bg-black/60">
                  <span className="text-xs font-medium tracking-wider text-white">
                    {safeCategory.toUpperCase()}
                  </span>
                </div>
              ) : null}

              {Boolean((post as any).featured) ? (
                <div className="rounded-full border border-softGold/40 bg-gradient-to-r from-softGold/20 to-amber-500/20 backdrop-blur-xl px-4 py-2 transition-all duration-500 group-hover:from-softGold/30 group-hover:to-amber-500/30">
                  <span className="text-xs font-medium tracking-wider text-softGold">
                    FEATURED
                  </span>
                </div>
              ) : null}
            </div>

            {/* Luxury hover CTA */}
            <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 transition-all duration-700 group-hover:opacity-100">
              <div className="rounded-full border border-white/30 bg-black/60 backdrop-blur-xl px-6 py-3 transition-transform duration-500 group-hover:scale-105">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium tracking-wide text-white">
                    Read Article
                  </span>
                  <span className="text-xs text-white/70">•</span>
                  {readText ? (
                    <span className="text-xs font-light text-white/70">{readText}</span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className={`relative ${currentSize.content}`}>
            {/* Title with elegant styling */}
            <h3
              id={`post-title-${slug}`}
              className={[
                "mb-4 font-serif font-light leading-tight text-deepCharcoal transition-colors duration-500",
                "group-hover:text-softGold/90",
                currentSize.title,
              ].join(" ")}
            >
              {safeTitle}
            </h3>

            {/* Excerpt with refined typography */}
            {safeExcerpt ? (
              <p className={`mb-6 font-light leading-relaxed text-slate-600 ${currentSize.excerpt}`}>
                {safeExcerpt}
              </p>
            ) : null}

            {/* AUTHOR & METADATA - Luxury styling */}
            {showAuthor ? (
              <div className="flex items-center justify-between border-t border-slate-100/60 pt-6">
                <div className="flex items-center gap-4">
                  <div className="relative" style={{ animation: "float 3s ease-in-out infinite" }}>
                    {/* Author image glow */}
                    <div
                      className="absolute inset-0 rounded-full bg-gradient-to-r from-softGold/20 to-transparent blur-md transition-all duration-500 group-hover:blur-xl group-hover:from-softGold/40"
                      aria-hidden="true"
                    />
                    <Image
                      src={authorPic}
                      alt={`Author: ${authorName}`}
                      width={44}
                      height={44}
                      className="relative z-10 h-11 w-11 rounded-full border-2 border-white/80 object-cover shadow-lg"
                      onError={handleAuthorImageError}
                    />
                  </div>

                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-deepCharcoal">{authorName}</span>
                    {metaDisplay ? (
                      <span className={`text-xs font-light text-slate-500 ${currentSize.meta}`}>
                        {metaDisplay}
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Luxury arrow button */}
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-softGold/10 to-softGold/5 text-softGold transition-all duration-500 group-hover:from-softGold/20 group-hover:to-softGold/10 group-hover:scale-110">
                  <svg
                    className="h-4 w-4 transition-transform duration-500 group-hover:translate-x-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            ) : null}

            {/* TAGS - Refined styling */}
            {displayTags.length > 0 ? (
              <div className="mt-6 flex flex-wrap gap-2">
                {displayTags.map((tag, idx) => (
                  <span
                    key={`${tag}-${idx}`}
                    className="rounded-full border border-slate-200/60 bg-white/50 px-3.5 py-1.5 text-xs font-light text-slate-600 backdrop-blur-sm transition-all duration-300 hover:border-softGold/30 hover:bg-softGold/10 hover:text-softGold"
                  >
                    {tag}
                  </span>
                ))}

                {post.tags && post.tags.length > 3 ? (
                  <span className="rounded-full border border-slate-200/60 bg-white/50 px-3.5 py-1.5 text-xs font-light text-slate-500">
                    +{post.tags.length - 3}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          {/* Luxury bottom accent line */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-softGold/30 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            aria-hidden="true"
          />
          
          {/* Premium shine effect on hover */}
          <div
            className="absolute inset-0 rounded-inherit bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100"
            aria-hidden="true"
          />
        </Link>
      </article>
    </>
  );
}

export type { BlogPostCardProps };