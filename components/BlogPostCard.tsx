import React from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

export type BlogPostCardProps = {
  slug: string;
  title: string;
  date?: string | null;
  excerpt?: string | null;
  coverImage?: string | null; // local path under /public recommended
  author?: string | { name?: string; image?: string | null } | null;
  readTime?: string | null;
  category?: string | null;
  tags?: string[] | null;
};

const FALLBACK_AVATAR = siteConfig.authorImage || "/assets/images/profile-portrait.webp";
const FALLBACK_BLOG_COVER = "/assets/images/blog/default-blog.jpg";

const toLocal = (src?: string | null) => (src && src.startsWith("/") ? src : undefined);

export default function BlogPostCard({
  slug,
  title,
  date,
  excerpt,
  coverImage,
  author,
  readTime,
  category,
}: BlogPostCardProps) {
  const authorName = typeof author === "string" ? author : author?.name || siteConfig.author;

  const preferredAvatar =
    (typeof author !== "string" && toLocal(author?.image ?? undefined)) || FALLBACK_AVATAR;
  const [avatarSrc, setAvatarSrc] = React.useState(preferredAvatar);

  const initialCover = toLocal(coverImage) || FALLBACK_BLOG_COVER;
  const [coverSrc, setCoverSrc] = React.useState(initialCover);

  const dt = date ? new Date(date) : null;
  const dateTime = dt && !Number.isNaN(+dt) ? dt.toISOString().slice(0, 10) : undefined;
  const dateLabel =
    dt && !Number.isNaN(+dt)
      ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(dt)
      : undefined;

  return (
    <article className="overflow-hidden rounded-2xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover">
      <Link href={`/blog/${slug}`} className="block" prefetch={false} aria-label={`Read: ${title}`}>
        {/* object-contain prevents “hiding” of text-based artwork */}
        <div className="relative aspect-[16/9] w-full bg-white">
          <Image
            src={coverSrc}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-contain"
            onError={() => {
              if (coverSrc !== FALLBACK_BLOG_COVER) setCoverSrc(FALLBACK_BLOG_COVER);
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
              <span className="inline-flex rounded-full border border-lightGrey px-2 py-0.5">{category}</span>
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
