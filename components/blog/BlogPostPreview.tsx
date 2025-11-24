// components/blog/BlogPostPreview.tsx
import Link from "next/link";
import Image from "next/image";
import type { PostMeta } from "@/types/post";

interface BlogPostPreviewProps {
  post: PostMeta & {
    readTime?: string;
    coverImage?: string | { src?: string } | null;
  };
  featured?: boolean;
  className?: string;
}

// -----------------------------------------------------------------------------
// Local utilities
// -----------------------------------------------------------------------------

const safeString = (value: unknown, fallback: string = ""): string => {
  if (typeof value === "string") return value.trim();
  if (value == null) return fallback;
  const asString = String(value).trim();
  return asString || fallback;
};

const safePostProp = (value: unknown): string => safeString(value, "");

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

type CoverImageLike =
  | string
  | { src?: string | undefined }
  | null
  | undefined;

const getSafeImageUrl = (image: CoverImageLike): string => {
  if (!image) return "";
  if (typeof image === "object") {
    const candidate = safeString((image as { src?: string }).src);
    if (!candidate) return "";
    if (candidate.startsWith("/")) return candidate;
    try {
      // eslint-disable-next-line no-new
      new URL(candidate);
      return candidate;
    } catch {
      return "";
    }
  }
  const url = safeString(image);
  if (!url) return "";
  if (url.startsWith("/")) return url;
  try {
    // eslint-disable-next-line no-new
    new URL(url);
    return url;
  } catch {
    return "";
  }
};

const hasCoverImage = (post: any): post is { coverImage: CoverImageLike } =>
  "coverImage" in post;

const hasReadTime = (post: any): post is { readTime: string } =>
  "readTime" in post && typeof post.readTime === "string";

export default function BlogPostPreview({
  post,
  featured = false,
  className = "",
}: BlogPostPreviewProps) {
  const safeTitle = safeString(post.title, "Untitled Post");
  const safeExcerpt = safePostProp(post.excerpt);
  const safeDate = formatDateSafe(post.date);

  const safeReadTime = hasReadTime(post) ? safePostProp(post.readTime) : "";
  const safeCoverImage = hasCoverImage(post)
    ? getSafeImageUrl(post.coverImage)
    : "";

  // ✅ Route must match pages/[slug].tsx
  const safeSlug = safeString(post.slug);
  const href = safeSlug ? `/${safeSlug}` : "#";

  return (
    <article className={`group ${className}`}>
      <Link href={href} className="block h-full" prefetch={false}>
        <div className="flex h-full flex-col overflow-hidden rounded-lg bg-deepCharcoal/90 shadow-soft-elevated ring-1 ring-white/5 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-glow-gold">
          {safeCoverImage && (
            <div className="aspect-[4/3] overflow-hidden bg-charcoal">
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

          <div
            className={`flex flex-1 flex-col ${
              safeCoverImage ? "p-6" : "p-6 pt-8"
            }`}
          >
            <h3
              className={`mb-3 line-clamp-2 font-serif font-semibold text-slate-50 ${
                featured ? "text-2xl" : "text-xl"
              }`}
            >
              {safeTitle}
            </h3>

            {safeExcerpt && (
              <p className="mb-4 flex-1 line-clamp-3 text-sm text-slate-200/80">
                {safeExcerpt}
              </p>
            )}

            <div className="mt-auto flex items-center justify-between text-xs text-slate-400">
              {safeDate && (
                <time dateTime={post.date || undefined}>{safeDate}</time>
              )}
              {safeReadTime && <span>{safeReadTime}</span>}
              {!safeDate && !safeReadTime && <span />}
            </div>

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

BlogPostPreview.displayName = "BlogPostPreview";