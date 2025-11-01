// components/BlogPostCard.tsx
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { siteConfig } from "@/lib/siteConfig";
import type { PostMeta } from "@/types/post"; 

const DEFAULT_BLOG_IMAGE = "/assets/images/blog/default-blog-cover@1600.jpg";
const FALLBACK_AVATAR = siteConfig.authorImage || "/assets/images/profile-portrait.webp";

function stripMarkup(input?: string): string {
  if (!input) return "";
  return input.replace(/<[^>]+>/g, "").trim();
}

export default function BlogPostCard(post: PostMeta) {
  const { slug, title, excerpt, date, coverImage } = post;
  const authorName = siteConfig.author;
  const [avatarSrc, setAvatarSrc] = React.useState(FALLBACK_AVATAR);
  const [imgSrc, setImgSrc] = React.useState(coverImage || DEFAULT_BLOG_IMAGE);

  const dt = date ? new Date(date) : null;
  const dateLabel = dt ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(dt) : null;
  const safeExcerpt = stripMarkup(excerpt);
  const detailHref = `/blog/${slug}`;

  // Fallback initials (like 'LFN')
  const initials = title.split(/\s+/).map(w => w[0]?.toUpperCase() || '').join('').slice(0, 3);

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-lg">
      <Link href={detailHref} aria-hidden="true" tabIndex={-1} className="block">
        <div className="relative h-48 w-full overflow-hidden">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={`Cover image for ${title}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              onError={() => setImgSrc(DEFAULT_BLOG_IMAGE)} 
            />
          ) : (
            // ✅ FIX: Placeholder text to prevent container collapse when image is null/corrupt
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <span className="text-4xl font-serif font-bold text-gray-400">{initials}</span>
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="text-xl font-semibold">
            <Link href={detailHref} className="hover:underline">
              {title}
            </Link>
          </h3>
          {dateLabel && <p className="mt-1 text-sm text-neutral-500">{dateLabel}</p>}
          {safeExcerpt && <p className="mt-3 line-clamp-3 text-sm text-neutral-600">{safeExcerpt}</p>}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Image
            src={avatarSrc}
            alt={authorName}
            width={40}
            height={40}
            className="rounded-full object-cover"
            onError={() => setAvatarSrc(FALLBACK_AVATAR)}
          />
          <p className="text-sm font-medium">{authorName}</p>
        </div>
      </div>
    </article>
  );
}