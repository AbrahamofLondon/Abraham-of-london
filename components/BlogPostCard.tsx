// components/BlogPostCard.tsx
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

type BlogPostCardProps = {
  slug: string;
  title: string;
  date?: string;
  excerpt?: string;
  coverImage?: string;
  author?: string | { name?: string; image?: string };
  readTime?: string | number;
  category?: string;
  tags?: string[];
  coverAspect?: "book" | "wide" | "square";
  coverFit?: "cover" | "contain";
  coverPosition?: "center" | "left" | "right";
};

const FALLBACK_AVATAR = siteConfig.authorImage || "/assets/images/profile-portrait.webp";

/** Normalize to /public paths + provide fallbacks by slug */
function useBlogCover(slug: string, coverImage?: string) {
  const normalizeLocal = (src?: string) => {
    if (!src) return undefined;
    if (/^https?:\/\//i.test(src)) return undefined;
    return src.startsWith("/") ? src : `/${src.replace(/^\/+/, "")}`;
  };

  const candidates = React.useMemo(() => {
    const list = [
      normalizeLocal(coverImage),
      `/assets/images/blog/${slug}.webp`,
      `/assets/images/blog/${slug}.jpg`,
      `/assets/images/blog/${slug}.jpeg`,
      `/assets/images/blog/${slug}.png`,
      // Retain a non-slug-specific fallback as the final option
      `/assets/images/blog/default-blog-cover.jpg`,
    ].filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [slug, coverImage]);

  // Use the first candidate as the source. We rely on the pre-generated image
  // candidates list being ordered by preference, and will attempt to load the first one.
  // We remove the stateful `onError` logic as it causes unnecessary client-side re-renders.
  const src = candidates[0];
  
  // The onError function should not trigger a re-render loop on the client.
  // Leaving it as a no-op or removing it is safer than state-based retry.
  const onError = React.useCallback(() => {
    // In a real application, you might use a service to check image validity 
    // or rely on Next.js logging the failure. State-based retry here is problematic.
    console.warn(`Failed to load blog cover: ${src}`);
  }, [src]);


  // Only return the first candidate. If it fails, the Next/Image component will show nothing 
  // or a broken icon, which is generally better than a re-render loop.
  return { src, hasAny: candidates.length > 0, onError };
}

export default function BlogPostCard({
  slug,
  title,
  excerpt,
  date,
  coverImage,
  author,
  readTime,
  category,
  coverAspect = "book",
  coverFit = "cover",
  coverPosition = "center",
}: BlogPostCardProps) {
  const authorName = typeof author === "string" ? author : author?.name || siteConfig.author;

  const normalizeLocal = (src?: string) =>
    !src || /^https?:\/\//i.test(src) ? undefined : src.startsWith("/") ? src : `/${src.replace(/^\/+/, "")}`;

  const preferredAvatar = (typeof author !== "string" && normalizeLocal(author?.image)) || FALLBACK_AVATAR;
  // NOTE: Avatar error handling is kept, as it's a simple, two-state fallback (preferred or default)
  const [avatarSrc, setAvatarSrc] = React.useState(preferredAvatar);

  // We are now just using the *first* potential source and letting Next/Image handle the load
  const { src: coverSrc, hasAny: showCover, onError: onCoverError } = useBlogCover(slug, coverImage);
  
  // Check if coverSrc is still the original preferredAvatar, and if so,
  // we can use a no-op for the error handler, as the image will be the final fallback.
  const handleCoverError = coverSrc?.endsWith("default-blog-cover.jpg") ? undefined : onCoverError;


  const dt = date ? new Date(date) : null;
  const dateTime = dt && !Number.isNaN(+dt) ? dt.toISOString().slice(0, 10) : undefined;
  const dateLabel =
    dt && !Number.isNaN(+dt)
      ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(dt)
      : undefined;

  // aspect frame
  const aspectClass =
    coverAspect === "square" ? "aspect-[1/1]" : coverAspect === "wide" ? "aspect-[16/9]" : "aspect-[2/3]";

  // fit + position
  const fitClass = coverFit === "contain" ? "object-contain" : "object-cover";
  const posClass =
    coverPosition === "left" ? "object-left" : coverPosition === "right" ? "object-right" : "object-center";

  // background for letterboxing when using contain (prevents “kissing” look)
  const framePadding = coverFit === "contain" ? "p-2 sm:p-3" : "";
  const frameBg = coverFit === "contain" ? "bg-warmWhite" : "bg-transparent";

  return (
    <article className="rounded-2xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover">
      <Link href={`/blog/${slug}`} className="block" prefetch={false} aria-label={`Read: ${title}`}>
        {showCover && coverSrc && (
          <div className={`relative w-full overflow-hidden rounded-t-2xl ${aspectClass} ${frameBg} ${framePadding}`}>
            <Image
              src={coverSrc}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className={`${fitClass} ${posClass}`}
              // Use the simplified error handler which avoids state updates for cover
              onError={handleCoverError} 
              priority={false}
            />
          </div>
        )}

        <div className="p-5">
          <h3 className="font-serif text-xl font-semibold text-deepCharcoal">{title}</h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--color-on-secondary)/0.7]">
            {dateTime && <time dateTime={dateTime}>{dateLabel}</time>}
            {readTime && <span aria-label="Estimated reading time">{readTime} min read</span>}
            {category && <span className="inline-flex rounded-full border border-lightGrey px-2 py-0.5">{category}</span>}
            <span className="luxury-link">Discuss</span>
          </div>

          {excerpt && <p className="mt-3 line-clamp-3 text-sm text-[color:var(--color-on-secondary)/0.8]">{excerpt}</p>}

          <div className="mt-4 flex items-center gap-3">
            <Image
              src={avatarSrc}
              alt={authorName}
              width={40}
              height={40}
              className="rounded-full object-cover"
              // Keep avatar fallback logic as it is simple and safe
              onError={() => setAvatarSrc(FALLBACK_AVATAR)}
            />
            <div className="text-xs text-[color:var(--color-on-secondary)/0.7]">
              <p className="font-medium">{authorName}</p>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}