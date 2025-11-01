// components/BlogPostCard.tsx
import * as React from "react";
import Link from "next/link";
import Image from "next/image"; // Keep Image for the avatar, but remove fill
import clsx from "clsx";
import { siteConfig } from "@/lib/siteConfig";
// ✅ FIX: Import the CoverImage component
import CoverImage from "@/components/common/CoverImage"; 
import type { PostMeta } from "@/types/post";

const FALLBACK_AVATAR = siteConfig.authorImage || "/assets/images/profile-portrait.webp";
const DEFAULT_BLOG_IMAGE = "/assets/images/blog/default-blog-cover@1600.jpg"; // Use high-res default

function stripMarkup(input?: string): string {
  if (!input) return "";
  return input.replace(/<[^>]+>/g, "").trim();
}

export default function BlogPostCard(post: PostMeta) {
  const { slug, title, excerpt, date, coverImage } = post;
  const authorName = siteConfig.author;
  const [avatarSrc, setAvatarSrc] = React.useState(FALLBACK_AVATAR);

  const dt = date ? new Date(date) : null;
  const dateLabel = dt ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(dt) : null;
  const safeExcerpt = stripMarkup(excerpt);
  const detailHref = `/blog/${slug}`; // Use original slug, as build is successful
  const finalCoverImage = coverImage || DEFAULT_BLOG_IMAGE;

  return (
    <article className="group flex flex-col overflow-hidden rounded-lg border shadow-sm transition-shadow hover:shadow-lg">
      {/* ✅ FIX: Use CoverImage component for consistent rendering */}
      {finalCoverImage && (
        <Link href={detailHref} aria-hidden="true" tabIndex={-1} className="block">
          <CoverImage
            src={finalCoverImage}
            alt={`Cover image for ${title}`}
            className="h-48" // Match old height
            priority={false}
          />
        </Link>
      )}
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