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
  motionProps?: MotionProps;
};

function formatDate(input?: string) {
  if (!input) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return input;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export default function BlogPostCard({
  slug,
  title,
  date,
  excerpt,
  coverImage,
  author = "Abraham of London",
  readTime,
  category,
  motionProps = {},
}: BlogPostCardProps) {
  const cover = coverImage?.trim() ? coverImage : "/assets/images/blog/default-blog-cover.jpg";

  return (
    <motion.article
      {...motionProps}
      className="group h-full overflow-hidden rounded-2xl border border-lightGrey bg-white shadow-card transition-all duration-300 hover:shadow-cardHover"
    >
      <Link href={`/blog/${slug}`} aria-label={`Open post: ${title}`} className="block">
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <Image
            src={cover}
            alt=""
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          />
          <span className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
        </div>
      </Link>

      <div className="flex h-full flex-col p-5">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-deepCharcoal/70">
          {category && (
            <span className="rounded-full border border-lightGrey bg-warmWhite px-2 py-0.5 text-[11px] uppercase tracking-[0.12em] text-deepCharcoal/75">
              {category}
            </span>
          )}
          {date && (
            <time dateTime={date} className="text-deepCharcoal/60">
              {formatDate(date)}
            </time>
          )}
          {readTime && <span className="text-deepCharcoal/60">· {readTime}</span>}
        </div>

        <h3 className="font-serif text-xl font-semibold leading-snug text-deepCharcoal transition-colors group-hover:text-forest">
          <Link
            href={`/blog/${slug}`}
            className="outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-forest/30"
          >
            {title}
          </Link>
        </h3>

        {excerpt && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-deepCharcoal/90">
            {excerpt}
          </p>
        )}

        <div className="mt-4 flex items-center gap-2 text-xs text-deepCharcoal/70">
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-forest/90">{author}</span>
        </div>

        <div className="mt-5">
          <Link
            href={`/blog/${slug}`}
            className="inline-flex items-center rounded-full border border-deepCharcoal px-3 py-1.5 text-sm font-medium text-deepCharcoal transition-colors hover:bg-deepCharcoal hover:text-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest/20"
            aria-label={`Read more: ${title}`}
          >
            Read more
            <svg className="ml-2 h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
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
