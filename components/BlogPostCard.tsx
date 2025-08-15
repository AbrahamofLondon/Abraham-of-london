// components/BlogPostCard.tsx
import React from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import clsx from "clsx";
import DateFormatter from "@/components/DateFormatter";

export type BlogPostCardProps = {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
  coverImage: string;
  author: string;
  readTime?: string;
  category?: string;
  /** When true, use the featured/hero styling (optional) */
  isFeatured?: boolean;
  className?: string;
};

// small, neutral blur placeholder for crisp perceived loading
const BLUR_DATA_URL =
  "data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxNicgaGVpZ2h0PSc5JyBmaWxsPSdub25lJz48cmVjdCB3aWR0aD0nMTYnIGhlaWdodD0nOScgZmlsbD0nI2U1ZTdlYicvPjwvc3ZnPg==";

const FALLBACK_COVER = "/assets/images/blog/default-blog-cover.jpg";

export default function BlogPostCard({
  slug,
  title,
  date,
  excerpt,
  coverImage,
  author,
  readTime,
  category,
  isFeatured = false,
  className,
}: BlogPostCardProps) {
  const cardClass = clsx(
    "group relative overflow-hidden rounded-2xl border border-black/10 bg-white shadow-card",
    "transition-transform hover:scale-[1.01] dark:border-white/10 dark:bg-white/5 dark:backdrop-blur",
    isFeatured && "hover:scale-[1.005] md:col-span-2 lg:col-span-2",
    className,
  );

  const sizes = isFeatured
    ? "(min-width: 1280px) 800px, (min-width: 768px) 70vw, 100vw"
    : "(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw";

  const quality = 90;
  const img = coverImage?.trim() || FALLBACK_COVER;

  return (
    <motion.article
      className={cardClass}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
    >
      <Link
        href={`/blog/${slug}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-forest/60 rounded-2xl"
        aria-label={`Read blog post: ${title}`}
      >
        {/* Cover image */}
        <div
          className={clsx(
            "relative w-full overflow-hidden",
            isFeatured ? "aspect-[16/9]" : "aspect-[4/3]",
          )}
        >
          <Image
            src={img}
            alt={title}
            fill
            priority={isFeatured}
            loading={isFeatured ? "eager" : "lazy"}
            sizes={sizes}
            quality={quality}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* gentle top gradient for caption/label legibility */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          {category && (
            <span className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {category}
            </span>
          )}
        </div>

        {/* Content */}
        <div className={clsx("p-5", isFeatured && "md:p-6 lg:p-8")}>
          <h3
            className={clsx(
              "font-semibold leading-tight line-clamp-2 text-deepCharcoal dark:text-cream",
              isFeatured ? "text-xl md:text-2xl" : "text-lg",
            )}
          >
            {title}
          </h3>

          <p
            className={clsx(
              "mt-2 line-clamp-3 text-deepCharcoal/70 dark:text-cream/80",
              isFeatured && "md:mt-3",
            )}
          >
            {excerpt}
          </p>

          {/* Meta */}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-deepCharcoal/60 dark:text-cream/70">
            <DateFormatter dateString={date} pattern="d MMM yyyy" />
            <span className="mx-1 select-none" aria-hidden="true">
              {"\u00B7"}
            </span>
            <span>by {author}</span>
            {readTime && (
              <>
                <span className="mx-1 select-none" aria-hidden="true">
                  {"\u00B7"}
                </span>
                <span>{readTime}</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
