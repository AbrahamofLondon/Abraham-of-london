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

// ensure we only accept local (/public) assets
const toLocal = (src?: string) => (src && src.startsWith("/") ? src : undefined);

// final fallback (must exist in /public)
const FALLBACK_AVATAR =
  siteConfig.authorImage || "/assets/images/profile/abraham-of-london.jpg";

export default function BlogPostCard({
  slug,
  title,
  excerpt,
  date,
  coverImage,
  author,
}: BlogPostCardProps) {
  const authorName =
    typeof author === "string" ? author : author?.name || siteConfig.author;

  // preferred: author.image if it's a local path; else site fallback
  const preferredAvatar =
    (typeof author !== "string" && toLocal(author?.image)) || FALLBACK_AVATAR;

  // swap to fallback on load error
  const [avatarSrc, setAvatarSrc] = React.useState(preferredAvatar);

  return (
    <article className="rounded-2xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover">
      <Link href={`/blog/${slug}`} className="block" prefetch={false}>
        {toLocal(coverImage) && (
          <div className="relative aspect-[16/9] w-full overflow-hidden rounded-t-2xl">
            <Image
              src={coverImage as string}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className="object-cover"
              priority={false}
            />
          </div>
        )}

        <div className="p-5">
          <h3 className="font-serif text-xl font-semibold text-deepCharcoal">{title}</h3>
          {excerpt && (
            <p className="mt-2 line-clamp-3 text-sm text-deepCharcoal/80">{excerpt}</p>
          )}

          {/* Author row */}
          <div className="mt-4 flex items-center gap-3">
            {/* Next/Image supports onError; we fallback if it 404s */}
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
              {date ? <p>{date}</p> : null}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
