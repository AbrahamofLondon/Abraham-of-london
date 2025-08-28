import Image from "next/image";
import Link from "next/link";
import React from "react";
import { siteConfig } from "@/lib/siteConfig";

type BlogPostCardProps = {
  slug: string;
  title: string;
  date?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;   // local path under /public
  author?: string | { name?: string; image?: string | null } | null;
  readTime?: string | null;
  category?: string | null;
  tags?: string[] | null;
};

// Only allow local (/public) assets
const toLocal = (src?: string | null) => (src && src.startsWith("/") ? src : undefined);

// Fallback avatar (MUST exist)
const FALLBACK_AVATAR = siteConfig.authorImage || "/assets/images/profile-portrait.webp";

// Optional blog cover fallback if you want a default card art
const DEFAULT_BLOG_COVER = "/assets/images/blog/default-blog.jpg"; // add this file if you want a default

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
  const authorName =
    typeof author === "string"
      ? author
      : author?.name || siteConfig.author;

  // Author avatar self-heal
  const preferredAvatar = (typeof author !== "string" && toLocal(author?.image)) || FALLBACK_AVATAR;
  const [avatarSrc, setAvatarSrc] = React.useState(preferredAvatar);

  // Cover self-heal (local only)
  const provided = toLocal(coverImage);
  const first = provided || `/assets/images/blog/${slug}.webp`;
  const candidates = React.useMemo(
    () =>
      [
        first,
        `/assets/images/blog/${slug}.jpg`,
        `/assets/images/blog/${slug}.jpeg`,
        `/assets/images/blog/${slug}.png`,
        // last resort (comment this out if you don’t want a generic cover)
        DEFAULT_BLOG_COVER,
      ].filter(Boolean) as string[],
    [first, slug]
  );

  const [idx, setIdx] = React.useState(0);
  const imgSrc = candidates[idx];

  const advanceCover = React.useCallback(() => {
    setIdx((i) => (i + 1 < candidates.length ? i + 1 : i + 1));
  }, [candidates.length]);

  const dt = date ? new Date(date) : null;
  const dateTime = dt && !Number.isNaN(+dt) ? dt.toISOString().slice(0, 10) : undefined;
  const dateLabel =
    dt && !Number.isNaN(+dt)
      ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(dt)
      : undefined;

  return (
    <article className="overflow-hidden rounded-2xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover">
      <Link href={`/blog/${slug}`} className="block" prefetch={false} aria-label={`Read: ${title}`}>
        {imgSrc ? (
          <div className="relative aspect-[16/9] w-full">
            <Image
              src={imgSrc}
              alt={`${title} cover`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover"
              onError={advanceCover}
              priority={false}
            />
          </div>
        ) : null}

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

          {/* Author row */}
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
