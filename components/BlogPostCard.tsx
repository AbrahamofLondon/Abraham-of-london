// components/BlogPostCard.tsx
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { siteConfig } from "@/lib/siteConfig";

type BlogPostCardProps = {
  slug: string;
  title: string;
  date?: string;
  excerpt?: string;
  coverImage?: string; // optional front-matter path (prefer local /public)
  author?: string | { name?: string; image?: string };
  readTime?: string;
  category?: string;
  tags?: string[];
};

const FALLBACK_AVATAR = siteConfig.authorImage || "/assets/images/profile-portrait.webp";

/** Normalize to a local /public path (ignore remote for cards) */
const normalizeLocal = (src?: string) =>
  !src || /^https?:\/\//i.test(src) ? undefined : src.startsWith("/") ? src : `/${src.replace(/^\/+/, "")}`;

/** Prefer a card-specific crop when present, then normal cover, then slug fallbacks */
function useBlogCover(slug: string, coverImage?: string) {
  const candidates = React.useMemo(() => {
    const name = slug.replace(/\.[a-z]+$/i, "");
    const list = [
      normalizeLocal(coverImage && coverImage.replace(/(\.\w+)$/, "-card$1")), // if front-matter provided, try -card next to it
      `/assets/images/blog/${name}-card.webp`,  // 👈 explicit card crop
      `/assets/images/blog/${name}-card.jpg`,
      `/assets/images/blog/${name}-card.jpeg`,
      `/assets/images/blog/${name}-card.png`,

      normalizeLocal(coverImage),               // then the regular cover
      `/assets/images/blog/${name}.webp`,
      `/assets/images/blog/${name}.jpg`,
      `/assets/images/blog/${name}.jpeg`,
      `/assets/images/blog/${name}.png`,

      `/assets/images/blog/default-blog.jpg`,
      `/assets/images/default-blog.jpg`,
    ].filter(Boolean) as string[];

    // de-dup while preserving order
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
}: BlogPostCardProps) {
  const authorName = typeof author === "string" ? author : author?.name || siteConfig.author;
  const preferredAvatar =
    (typeof author !== "string" && normalizeLocal(author?.image)) || FALLBACK_AVATAR;
  const [avatarSrc, setAvatarSrc] = React.useState(preferredAvatar);

  const { src: coverSrc, hasAny: showCover, onError: onCoverError } = useBlogCover(slug, coverImage);

  // Orientation-aware wrapper: default portrait (4/5), switch to 16/9 if the image is landscape
  const [isLandscape, setIsLandscape] = React.useState(false);

  const dt = date ? new Date(date) : null;
  const dateTime = dt && !Number.isNaN(+dt) ? dt.toISOString().slice(0, 10) : undefined;
  const dateLabel =
    dt && !Number.isNaN(+dt)
      ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(dt)
      : undefined;

  return (
    <article className="rounded-2xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover">
      <Link href={`/blog/${slug}`} className="block" prefetch={false} aria-label={`Read: ${title}`}>
        {showCover && coverSrc && (
          <div
            className={
              // Portrait-first look (bookish); swap to 16/9 if we detect a landscape source
              (isLandscape ? "aspect-[16/9]" : "aspect-[4/5]") +
              " relative w-full overflow-hidden rounded-t-2xl"
            }
          >
            <Image
              src={coverSrc}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
              priority={false}
              onError={onCoverError}
              onLoadingComplete={(img) => {
                // If the natural width is >= height, use landscape wrapper next paint
                if (img.naturalWidth >= img.naturalHeight) setIsLandscape(true);
              }}
            />
          </div>
        )}

        <div className="p-5">
          <h3 className="font-serif text-xl font-semibold text-deepCharcoal">{title}</h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-deepCharcoal/70">
            {dateTime && <time dateTime={dateTime}>{dateLabel}</time>}
            {readTime && <span aria-label="Estimated reading time">{readTime}</span>}
            {category && (
              <span className="inline-flex rounded-full border border-lightGrey px-2 py-0.5">
                {category}
              </span>
            )}
            <span aria-hidden="true" className="sr-only">
              —
            </span>
            <Link
              href={`/blog/${slug}#comments`}
              className="luxury-link"
              prefetch={false}
              aria-label={`Discuss: ${title}`}
            >
              Discuss
            </Link>
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
