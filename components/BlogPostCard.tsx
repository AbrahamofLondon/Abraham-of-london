import Image from "next/image";
import Link from "next/link";
import * as React from "react";
import { siteConfig } from "@/lib/siteConfig";

type BlogPostCardProps = {
  slug: string;
  title: string;
  date?: string;
  excerpt?: string;
  coverImage?: string | null;
  author?: string | { name?: string; image?: string | null };
  readTime?: string | null;
  category?: string | null;
  tags?: string[] | null;
};

const DEFAULT_BLOG_IMG = "/assets/images/blog/default-blog.jpg"; // ensure this file exists
const FALLBACK_AVATAR = siteConfig.authorImage || "/assets/images/profile-portrait.webp";

function normalizeLocal(src?: string | null) {
  if (!src) return DEFAULT_BLOG_IMG;
  const s = String(src).replace(/\\/g, "/");
  return s.startsWith("/") ? s : `/${s}`;
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
    (typeof author !== "string" && normalizeLocal(author?.image || FALLBACK_AVATAR)) || FALLBACK_AVATAR;
  const [avatarSrc, setAvatarSrc] = React.useState(preferredAvatar);

  const coverSrc = normalizeLocal(coverImage);

  const dt = date ? new Date(date) : null;
  const dateTime = dt && !Number.isNaN(+dt) ? dt.toISOString().slice(0, 10) : undefined;
  const dateLabel =
    dt && !Number.isNaN(+dt)
      ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(dt)
      : undefined;

  return (
    <article className="rounded-2xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover">
      <Link href={`/blog/${slug}`} className="block" prefetch={false} aria-label={`Read: ${title}`}>
        {/* Cover image (always render with safe fallback for consistent layout) */}
        <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-2xl">
          <Image
            src={coverSrc}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            onError={(e) => {
              try {
                (e.currentTarget as HTMLImageElement).src = DEFAULT_BLOG_IMG;
              } catch {}
            }}
            priority={false}
          />
        </div>

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
