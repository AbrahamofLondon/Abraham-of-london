import Image from "next/image";
import Link from "next/link";
import React from "react";
import { siteConfig } from "@/lib/siteConfig";

type BlogPostCardProps = {
  slug: string;
  title: string;
  date?: string;
  excerpt?: string;
  coverImage?: string;
  author?: string | { name?: string; image?: string };
  readTime?: string;
  category?: string;
  tags?: string[];
};

const FALLBACK_AVATAR = siteConfig.authorImage || "/assets/images/profile-portrait.webp";

/** Normalize to a local /public path and try slug-based fallbacks */
function useBlogCover(slug: string, coverImage?: string) {
  const normalizeLocal = (src?: string) => {
    if (!src) return undefined;
    if (/^https?:\/\//i.test(src)) return undefined; // local only
    return src.startsWith("/") ? src : `/${src.replace(/^\/+/, "")}`;
  };

  const base = slug.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  const short = base.split("-").slice(0, 3).join("-"); // helps when filenames are shorter than slugs

  const candidates = React.useMemo(() => {
    const list = [
      normalizeLocal(coverImage),
      `/assets/images/blog/${base}.webp`,
      `/assets/images/blog/${base}.jpg`,
      `/assets/images/blog/${base}.jpeg`,
      `/assets/images/blog/${base}.png`,
      `/assets/images/blog/${short}.webp`,
      `/assets/images/blog/${short}.jpg`,
      `/assets/images/blog/${short}.jpeg`,
      `/assets/images/blog/${short}.png`,
      `/assets/images/blog/default-blog-cover.jpg`, // <-- your actual file name
      `/assets/images/default-blog-cover.jpg`,
    ].filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [slug, coverImage]);

  const [idx, setIdx] = React.useState(0);
  const src = candidates[idx];
  const onError = React.useCallback(() => setIdx((i) => (i + 1 < candidates.length ? i + 1 : i)), [candidates.length]);

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

  const normalizeLocal = (src?: string) =>
    !src || /^https?:\/\//i.test(src) ? undefined : src.startsWith("/") ? src : `/${src.replace(/^\/+/, "")}`;

  const preferredAvatar =
    (typeof author !== "string" && normalizeLocal(author?.image)) || FALLBACK_AVATAR;
  const [avatarSrc, setAvatarSrc] = React.useState(preferredAvatar);

  const { src: coverSrc, hasAny: showCover, onError: onCoverError } = useBlogCover(slug, coverImage);

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
          // Portrait friendly: no chopped titles
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-t-2xl bg-warmWhite">
            <Image
              src={coverSrc}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover [object-position:50%_15%]" /* bias a bit upward for title bands */
              priority={false}
              onError={onCoverError}
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
            <span className="inline-flex items-center">Discuss</span>
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
