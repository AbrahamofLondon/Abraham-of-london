// components/BlogPostCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { siteConfig } from "@/lib/siteConfig";

type PostLike = {
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
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
  size = "default" 
}: BlogPostCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const slug = normalisePostSlug(post.slug);
  const href = `/${encodeURIComponent(slug)}`;

  const cover =
    (post.coverImage && String(post.coverImage)) || FALLBACK_COVERS[0];

  const authorName =
    typeof post.author === "string"
      ? post.author
      : post.author?.name || "Abraham of London";

  const authorPic =
    (typeof post.author !== "string" && post.author?.picture) || FALLBACK_AVATAR;

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
    }
  };

  const currentSize = sizeClasses[size];

  return (
    <article className={`group relative overflow-hidden bg-white/95 backdrop-blur-sm shadow-2xl shadow-black/10 border border-white/20 transition-all duration-700 hover:shadow-3xl hover:shadow-black/20 hover:-translate-y-2 ${currentSize.container}`}>
      {/* Premium background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-50/80 to-softGold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Animated border glow */}
      <div className={`absolute inset-0 bg-gradient-to-r from-softGold/0 via-softGold/10 to-forest/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${currentSize.container}`} />
      
      <Link href={href} className="block relative z-10" prefetch={false}>
        {/* Image container with premium overlay */}
        <div className={`relative w-full overflow-hidden ${currentSize.image}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          {/* Loading shimmer */}
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
          )}
          
          <Image
            src={cover}
            alt={post.title}
            fill
            className={`object-cover transition-all duration-700 ${
              imageLoaded 
                ? 'group-hover:scale-110 opacity-100' 
                : 'opacity-0'
            }`}
            sizes="(min-width: 1024px) 600px, 100vw"
            priority={priority}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Category badge overlay */}
          {post.category && (
            <div className="absolute top-4 left-4 z-20">
              <div className="rounded-full bg-black/60 backdrop-blur-sm px-3 py-1.5 border border-white/10">
                <span className="text-xs font-medium text-white tracking-wider uppercase">
                  {post.category}
                </span>
              </div>
            </div>
          )}
          
          {/* Hover overlay with read more */}
          <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 bg-black/40">
            <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              <div className="flex items-center gap-2 text-white font-medium text-sm bg-black/60 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                <span>Read Insight</span>
                <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content container */}
        <div className={`relative ${currentSize.content}`}>
          {/* Title with gradient hover effect */}
          <h3 className={`mb-3 font-serif font-light text-deepCharcoal leading-tight group-hover:text-forest transition-colors duration-300 line-clamp-2 ${currentSize.title}`}>
            {post.title}
          </h3>

          {/* Excerpt with improved typography */}
          {post.excerpt ? (
            <p className="mb-4 text-sm text-gray-600 leading-relaxed line-clamp-3 font-light">
              {post.excerpt}
            </p>
          ) : null}

          {/* Author and metadata - premium layout */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100/50">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-softGold/20 rounded-full transform group-hover:scale-110 transition-transform duration-300" />
                <Image
                  src={authorPic}
                  alt={authorName}
                  width={40}
                  height={40}
                  className="relative z-10 h-10 w-10 rounded-full object-cover border-2 border-white shadow-sm"
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
                  {readText && (
                    <span className="font-light">{readText}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Premium arrow indicator */}
            <div className="opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
              <div className="w-8 h-8 rounded-full bg-softGold/10 flex items-center justify-center group-hover:bg-softGold/20 transition-colors">
                <svg className="w-4 h-4 text-softGold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
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
                  className="rounded-full bg-gray-100/80 backdrop-blur-sm px-3 py-1 text-xs text-gray-600 border border-gray-200/50 font-light transition-all duration-300 hover:bg-softGold/10 hover:text-softGold hover:border-softGold/20"
                >
                  {String(t)}
                </span>
              ))}
              {post.tags.length > 3 && (
                <span className="rounded-full bg-gray-100/80 backdrop-blur-sm px-3 py-1 text-xs text-gray-500 border border-gray-200/50 font-light">
                  +{post.tags.length - 3}
                </span>
              )}
            </div>
          ) : null}
        </div>

        {/* Premium bottom accent */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-softGold/0 via-softGold to-forest/0 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
      </Link>
    </article>
  );
}