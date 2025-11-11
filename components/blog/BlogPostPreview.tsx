// components/blog/BlogPostPreview.tsx
import Link from "next/link";
import Image from "next/image";
import { safePostProp, safeString } from '...';
import type { PostMeta } from "@/types/post";

interface BlogPostPreviewProps {
  post: PostMeta;
  featured?: boolean;
  className?: string;
}

// Safe date formatting utility
const formatDateSafe = (dateString: string | null | undefined): string => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    // Check if ___date is valid
    if (isNaN(date.getTime())) return "";

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

// Safe image URL utility
const getSafeImageUrl = (imageUrl: string | null | undefined): string => {
  const url = safeString(imageUrl);
  if (!url) return "";

  // Validate URL format
  try {
    new URL(url);
    return url;
  } catch {
    // If it's a relative path, it's fine
    if (url.startsWith("/")) return url;
    return "";
  }
};

export default function BlogPostPreview({
  post,
  featured = false,
  className = "",
}: BlogPostPreviewProps) {
  const safeTitle = safeString(post.title, "Untitled Post");
  const safeExcerpt = safePostProp(post.excerpt);
  const safeDate = formatDateSafe(post.date);
  const safeReadTime = safePostProp(post.readTime);
  const safeCoverImage = getSafeImageUrl(post.coverImage);

  return (
    <article className={`group ${className}`}>
      <Link
        href={`/blog/${post.slug}`}
        className="block h-full"
        prefetch={false}
      >
        <div className="flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-sm transition-all duration-300 group-hover:shadow-md">
          {/* Cover Image */}
          {safeCoverImage && (
            <div className="aspect-[4/3] overflow-hidden bg-gray-100">
              <Image
                src={safeCoverImage}
                alt={safeTitle}
                width={400}
                height={300}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                placeholder="blur"
                blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R"
              />
            </div>
          )}

          {/* Content */}
          <div className="flex flex-1 flex-col p-6">
            {/* Title */}
            <h3
              className={`font-serif font-semibold text-deepCharcoal mb-3 line-clamp-2 ${
                featured ? "text-2xl" : "text-xl"
              }`}
            >
              {safeTitle}
            </h3>

            {/* Excerpt */}
            {safeExcerpt && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-3 flex-1">
                {safeExcerpt}
              </p>
            )}

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-gray-500 mt-auto">
              {/* Date */}
              {safeDate && (
                <time dateTime={post.date || undefined}>{safeDate}</time>
              )}

              {/* Read Time */}
              {safeReadTime && <span>{safeReadTime}</span>}

              {/* Empty spacer when no metadata */}
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
