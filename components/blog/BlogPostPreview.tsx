import { safeString } from "@/lib/utils";

import Link from "next/link";
import Image from "next/image";
import type { PostMeta } from "@/types/post";

// Extended interface to handle optional properties safely
interface BlogPostPreviewProps {
  post: PostMeta & {
    readTime?: string;
    coverImage?: string | { src?: string } | null;
  };
  featured?: boolean;
  className?: string;
}

// -----------------------------------------------------------------------------
// Local utility functions (safe, JSON-friendly, no external deps)
// -----------------------------------------------------------------------------

const safeString = (value: unknown, fallback: string = ""): string => {
  if (typeof value === "string") return value.trim();
  if (value == null) return fallback;
  const asString = String(value).trim();
  return asString || fallback;
};

const safePostProp = (value: unknown): string => safeString(value, "");

// Safe date formatting utility
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

// Cover image can be string or StaticImageData-like
type CoverImageLike = string | { src?: string | undefined } | null | undefined;

// Safe image URL utility – supports string or StaticImageData-style objects
const getSafeImageUrl = (image: CoverImageLike): string => {
  if (!image) return "";

  // Static import (e.g. next/image StaticImageData)
  if (typeof image === "object") {
    const candidate = safeString((image as { src?: string }).src);
    if (!candidate) return "";
    if (candidate.startsWith("/")) return candidate;
    try {
      // Absolute URL
      // eslint-disable-next-line no-new
      new URL(candidate);
      return candidate;
    } catch {
      return "";
    }
  }

  // Plain string path or URL
  const url = safeString(image);
  if (!url) return "";

  // Allow relative paths starting with "/"
  if (url.startsWith("/")) return url;

  // Validate absolute URL
  try {
    // eslint-disable-next-line no-new
    new URL(url);
    return url;
  } catch {
    return "";
  }
};

// Type guard to check if object has coverImage property
const hasCoverImage = (
  post: unknown
): post is { coverImage: CoverImageLike } => {
  return typeof post === "object" && post !== null && "coverImage" in post;
};

// Type guard to check if object has readTime property
const hasReadTime = (post: unknown): post is { readTime: string } => {
  return (
    typeof post === "object" &&
    post !== null &&
    "readTime" in post &&
    typeof (post as { readTime: unknown }).readTime === "string"
  );
};

export default function BlogPostPreview({
  post,
  featured = false,
  className = "",
}: BlogPostPreviewProps) {
  // Safe extraction with proper type checking
  const safeTitle = safeString(post.title, "Untitled Post");
  const safeExcerpt = safePostProp(post.excerpt);
  const safeDate = formatDateSafe(post.date);

  // ✅ TYPE-SAFE: Handle readTime with proper type checking
  const safeReadTime = hasReadTime(post) ? safePostProp(post.readTime) : "";

  // ✅ TYPE-SAFE: Handle coverImage with proper type checking
  const safeCoverImage = hasCoverImage(post)
    ? getSafeImageUrl(post.coverImage)
    : "";

  // ✅ Route aligned with /[slug].tsx
  const safeSlug = safeString(post.slug);
  const href = safeSlug ? `/${safeSlug}` : "#";

  return (
    <article className={`group ${className}`}>
      <Link href={href} className="block h-full" prefetch={false}>
        <div className="flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-md">
          {/* Cover Image - Only render if we have a valid image */}
          {safeCoverImage && (
            <div className="aspect-[4/3] overflow-hidden bg-gray-100">
              <Image
                src={safeCoverImage}
                alt={safeTitle}
                width={400}
                height={300}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                // Static blur placeholder – safe even for dynamic paths
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R"
              />
            </div>
          )}

          {/* Content */}
          <div
            className={`flex flex-1 flex-col ${
              safeCoverImage ? "p-6" : "p-6 pt-8"
            }`}
          >
            {/* Title */}
            <h3
              className={`mb-3 line-clamp-2 font-serif font-semibold text-deepCharcoal ${
                featured ? "text-2xl" : "text-xl"
              }`}
            >
              {safeTitle}
            </h3>

            {/* Excerpt */}
            {safeExcerpt && (
              <p className="mb-4 flex-1 line-clamp-3 text-sm text-gray-600">
                {safeExcerpt}
              </p>
            )}

            {/* Metadata */}
            <div className="mt-auto flex items-center justify-between text-xs text-gray-500">
              {/* Date */}
              {safeDate && (
                <time dateTime={post.date || undefined}>{safeDate}</time>
              )}

              {/* Read Time - Only show if we have readTime */}
              {safeReadTime && <span>{safeReadTime}</span>}

              {/* Spacer when no metadata */}
              {!safeDate && !safeReadTime && <span />}
            </div>

            {/* Featured Badge */}
            {featured && (
              <div className="mt-3">
                <span className="inline-block rounded-full bg-softGold px-3 py-1 text-xs font-semibold text-deepCharcoal">
                  Featured
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
}

// Optional: Display name for debugging
BlogPostPreview.displayName = "BlogPostPreview";

