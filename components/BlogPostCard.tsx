import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, type MotionProps } from "framer-motion";

export type BlogPostCardProps = {
  slug: string;
  title: string;
  date?: string;
  excerpt?: string;
  coverImage?: string;
  author?: string;
  readTime?: string;
  category?: string;
  motionProps?: MotionProps; // ✨ NEW
};

function formatDate(input?: string) {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function BlogPostCard({
  slug,
  title,
  date,
  excerpt,
  coverImage,
  author = "Abraham of London",
  readTime,
  category,
  motionProps = {}, // ✨
}: BlogPostCardProps) {
  const cover = coverImage?.trim()
    ? coverImage
    : "/assets/images/blog/default-blog-cover.jpg";

  return (
    <motion.article
      {...motionProps} // ✨ parent controls animation
      className="group h-full overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-black/10 transition-shadow hover:shadow-lg"
    >
      <Link href={`/blog/${slug}`} aria-label={`Open post: ${title}`}>
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src={cover}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
        </div>
      </Link>

      <div className="flex h-full flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
          {category && (
            <span className="rounded-full border border-forest/20 px-2 py-0.5 text-forest/90">
              {category}
            </span>
          )}
          {date && (
            <time dateTime={date} className="text-gray-500">
              {formatDate(date)}
            </time>
          )}
          {readTime && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-gray-500">{readTime}</span>
            </>
          )}
        </div>

        <h3 className="text-lg font-semibold leading-snug text-gray-900">
          <Link
            href={`/blog/${slug}`}
            className="outline-none transition-colors hover:text-forest focus-visible:rounded focus-visible:ring-2 focus-visible:ring-forest/30"
          >
            {title}
          </Link>
        </h3>

        {excerpt && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-700">
            {excerpt}
          </p>
        )}

        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-forest/90">
            {author}
          </span>
        </div>

        <div className="mt-5">
          <Link
            href={`/blog/${slug}`}
            className="inline-flex items-center rounded-full border border-forest/20 px-3 py-1.5 text-sm font-medium text-forest transition-colors hover:bg-forest hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/30"
            aria-label={`Read more: ${title}`}
          >
            Read more
            <svg
              className="ml-2 h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export default BlogPostCard;
