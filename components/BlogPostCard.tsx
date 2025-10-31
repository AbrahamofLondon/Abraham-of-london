// components/BlogPostCard.tsx
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { siteConfig } from "@/lib/siteConfig";

type BlogPostCardProps = {
  slug: string;
  title: string;
  date?: string;
  excerpt?: string;
  coverImage?: string;
};

const FALLBACK_AVATAR = siteConfig.authorImage || "/assets/images/profile-portrait.webp";

function stripMarkup(input?: string): string {
  if (!input) return "";
  return input.replace(/<[^>]+>/g, "").trim();
}

export default function BlogPostCard({ slug, title, excerpt, date, coverImage }: BlogPostCardProps) {
  const authorName = siteConfig.author;
  const [avatarSrc, setAvatarSrc] = React.useState(FALLBACK_AVATAR);

  const dt = date ? new Date(date) : null;
  const dateLabel = dt ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(dt) : null;

  const safeExcerpt = stripMarkup(excerpt);

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-lg">
      {coverImage && (
        <Link href={`/blog/${slug}`} aria-hidden="true" tabIndex={-1} className="block">
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={coverImage}
              alt={`Cover image for ${title}`}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        </Link>
      )}
      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 className="text-xl font-semibold">
            <Link href={`/blog/${slug}`} className="hover:underline">
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