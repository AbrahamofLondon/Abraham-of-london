// components/BlogPostCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import { siteConfig } from "@/lib/siteConfig";

type PostLike = {
  slug: string;
  title: string;
  excerpt?: string | null;
  coverImage?: string | null;
  date?: string | null;
  readTime?: string | number | null;
  tags?: string[] | null;
  author?:
    | { name?: string | null; picture?: string | null }
    | string
    | null
    | undefined;
};

interface BlogPostCardProps {
  post: PostLike;
}

const FALLBACK_AVATAR =
  siteConfig.authorImage ?? "/assets/images/profile-portrait.webp";

const FALLBACK_COVERS = [
  "/assets/images/blog/default.webp",
  "/assets/images/writing-desk.webp",
];

function formatDateISOToGB(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

export default function BlogPostCard({ post }: BlogPostCardProps) {
  const href = `/blog/${encodeURIComponent(post.slug)}`;

  const cover =
    (post.coverImage && String(post.coverImage)) || FALLBACK_COVERS[0];

  const authorName =
    typeof post.author === "string"
      ? post.author
      : post.author?.name || "Abraham of London";

  const authorPic =
    (typeof post.author !== "string" && post.author?.picture) || FALLBACK_AVATAR;

  const dateText = formatDateISOToGB(post.date);

  const readText =
    typeof post.readTime === "number"
      ? `${post.readTime} min read`
      : typeof post.readTime === "string" && post.readTime.trim()
      ? post.readTime
      : null;

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <Link href={href} className="block">
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src={cover}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(min-width: 1024px) 600px, 100vw"
            priority={false}
          />
        </div>

        <div className="p-4">
          <h3 className="mb-2 line-clamp-2 font-serif text-xl text-gray-900">
            {post.title}
          </h3>

          {post.excerpt ? (
            <p className="mb-3 line-clamp-3 text-sm text-gray-600">
              {post.excerpt}
            </p>
          ) : null}

          <div className="mt-4 flex items-center gap-3">
            <Image
              src={authorPic}
              alt={authorName}
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
              <span className="font-medium text-gray-700">{authorName}</span>
              {dateText ? <span aria-hidden>•</span> : null}
              {dateText ? <time dateTime={post.date || undefined}>{dateText}</time> : null}
              {readText ? <span aria-hidden>•</span> : null}
              {readText ? <span>{readText}</span> : null}
            </div>
          </div>

          {post.tags && post.tags.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {post.tags.slice(0, 3).map((t, i) => (
                <span
                  key={`${String(t)}-${i}`}
                  className="rounded bg-gray-100 px-2 py-0.5 text-[11px] text-gray-700"
                >
                  {String(t)}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </Link>
    </article>
  );
}