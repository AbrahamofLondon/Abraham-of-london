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
      `/assets/images/blog/default-blog-cover.jpg`,
    ].filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [slug, coverImage]);

  const [idx, setIdx] = React.useState(0);
  const src = candidates[idx];

  const onError = React.useCallback(() => {
    setIdx((i) => (i + 1 < candidates.length ? i + 1 : i));
  }, [candidates.length]);

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
  const [avatarSrc, setAvatarSrc] = React.useState(preferredAvatar);

  const { src: coverSrc, hasAny: showCover, onError: onCoverError } = useBlogCover(slug, coverImage);

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
              onError={onCoverError}
              priority={false}
            />
          </div>
        )}

        <div className="p-5">
          <h3 className="font-serif text-xl font-semibold text-deepCharcoal">{title}</h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-deepCharcoal/70">
            {dateTime && <time dateTime={dateTime}>{dateLabel}</time>}
            {readTime && <span aria-label="Estimated reading time">{readTime} min read</span>}
            {category && <span className="inline-flex rounded-full border border-lightGrey px-2 py-0.5">{category}</span>}
            <span className="luxury-link">Discuss</span>
          </div>

          {excerpt && <p className="mt-3 line-clamp-3 text-sm text-deepCharcoal/80">{excerpt}</p>}

          <div className="mt-4 flex items-center gap-3">
            <Image
              src={avatarSrc}
              alt={authorName}
              width={40}
              height={40}
              className="rounded-full object-cover"
              onError={() => setAvatarSrc(FALLBACK_AVATAR)}
            />
            <div className="text-xs text-deepCharcoal/70">
              <p className="font-medium">{authorName}</p>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
