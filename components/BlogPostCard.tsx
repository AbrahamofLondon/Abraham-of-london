import Link from "next/link";
import Image from "next/image";
import React from "react";
import { siteConfig } from "@/lib/siteConfig";

export type BlogPostCardProps = {
  slug: string;
  title: string;
  date?: string;
  excerpt?: string;
  coverImage?: string; // may be "/..." or "assets/..." or "http(s)://..."
  author?: string | { name?: string; image?: string };
  readTime?: string;
  category?: string;
  tags?: string[];
};

/** Accepts "/path", "path/without/leading/slash", or absolute http(s) */
function normalizeSrc(src?: string): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  // ensure single leading slash
  return `/${src.replace(/^\/+/, "")}`;
}

// A local, guaranteed asset you already have (social/og). 1200×630 works fine for a card.
const FALLBACK_COVER = normalizeSrc(siteConfig.ogImage) || "/assets/images/social/og-image.jpg";
// Your portrait already exists; use it for author fallback.
const FALLBACK_AVATAR = siteConfig.authorImage || "/assets/images/profile-portrait.webp";

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
    typeof author === "string" ? author : author?.name || siteConfig.author;

  const initialCover = normalizeSrc(coverImage) || FALLBACK_COVER;
  const [coverSrc, setCoverSrc] = React.useState(initialCover);

  const preferredAvatar =
    (typeof author !== "string" && normalizeSrc(author?.image)) || FALLBACK_AVATAR;
  const [avatarSrc, setAvatarSrc] = React.useState(preferredAvatar);

  const dt = date ? new Date(date) : null;
  const validDate = dt && !Number.isNaN(+dt);
  const dateTime = validDate ? dt!.toISOString().slice(0, 10) : undefined;
  const dateLabel = validDate
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(dt!)
    : undefined;

  return (
    <article className="rounded-2xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover">
      <Link href={`/blog/${slug}`} className="block" prefetch={false} aria-label={`Read: ${title}`}>
        {/* Cover */}
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-2xl">
          <Image
            src={coverSrc}
            alt="" /* decorative in card context */
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            onError={() => setCoverSrc(FALLBACK_COVER)}
            priority={false}
          />
        </div>

        {/* Body */}
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

          {excerpt && (
            <p className="mt-3 line-clamp-3 text-sm text-deepCharcoal/80">{excerpt}</p>
          )}

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
