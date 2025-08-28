import Image from "next/image";
import Link from "next/link";
import React from "react";
import { siteConfig } from "@/lib/siteConfig";

type Author = string | { name?: string; image?: string };

type BlogPostCardProps = {
  slug: string;
  title: string;
  date?: string | null;
  excerpt?: string | null;
  coverImage?: string | null;
  author?: Author | null;
  readTime?: string | null;
  category?: string | null;
  tags?: string[] | null;
};

const toLocal = (src?: string | null) => (src && src.startsWith("/") ? src : undefined);

// Never 404: local fallback avatar
const FALLBACK_AVATAR = siteConfig.authorImage || "/assets/images/profile-portrait.webp";
// Optional article image fallback (place this file in /public if you want a guaranteed cover)
const FALLBACK_COVER = "/assets/images/blog/default.jpg";

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

  // Author avatar (local only)
  const preferredAvatar =
    (typeof author !== "string" && toLocal(author?.image)) || FALLBACK_AVATAR;
  const [avatarSrc, setAvatarSrc] = React.useState(preferredAvatar);

  // Cover image (local only) with safe fallback
  const coverSrc = toLocal(coverImage) || FALLBACK_COVER;
  const [imgSrc, setImgSrc] = React.useState<string>(coverSrc);

  // Stabilise date: render in UTC so SSR/CSR match exactly
  const dt = date ? new Date(date) : null;
  const dateTime = dt && !Number.isNaN(+dt) ? dt.toISOString().slice(0, 10) : undefined;
  const dateLabel =
    dt && !Number.isNaN(+dt)
      ? new Intl.DateTimeFormat("en-GB", {
          timeZone: "UTC",
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(dt)
      : undefined;

  return (
    <article className="rounded-2xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover">
      <Link href={`/blog/${slug}`} className="block" prefetch={false} aria-label={`Read: ${title}`}>
        {/* Full-bleed, stable aspect ratio */}
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-2xl">
          <Image
            src={imgSrc}
            alt="" /* decorative in card grid */
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover"
            priority={false}
            onError={() => setImgSrc(FALLBACK_COVER)}
          />
        </div>

        <div className="p-5">
          <h3 className="font-serif text-xl font-semibold text-deepCharcoal">{title}</h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-deepCharcoal/70">
            {dateLabel && <time dateTime={dateTime}>{dateLabel}</time>}
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
