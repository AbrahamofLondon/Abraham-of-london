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
  isFeatured?: boolean;
  className?: string;
};

// Small, neutral blur placeholder
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
    "group relative overflow-hidden rounded-2xl bg-white shadow-2xl border border-gray-200 hover:shadow-blue-200 transition-all duration-300",
    isFeatured && "md:col-span-2 lg:col-span-2",
    className,
  );

  const sizes = isFeatured
    ? "(min-width: 1280px) 800px, (min-width: 768px) 70vw, 100vw"
    : "(min-width: 1024px) 400px, (min-width: 768px) 50vw, 100vw";

  const img = coverImage?.trim() || FALLBACK_COVER;

  return (
    <motion.article
      className={cardClass}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6 }}
      whileHover={{ scale: 1.05 }}
    >
      <Link
        href={`/blog/${slug}`}
        className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded-2xl"
        aria-label={`Read blog post: ${title}`}
      >
        {/* Cover Image */}
        <div className={clsx("relative w-full", isFeatured ? "aspect-[16/9]" : "aspect-[4/3]")}>
          <Image
            src={img}
            alt={title}
            fill
            priority={isFeatured}
            loading={isFeatured ? "eager" : "lazy"}
            sizes={sizes}
            quality={90}
            placeholder="blur"
            blurDataURL={BLUR_DATA_URL}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {category && (
            <span className="absolute left-4 top-4 rounded-full bg-blue-600 text-white px-3 py-1 text-sm font-semibold shadow-md">
              {category}
            </span>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent" />
        </div>

        {/* Content */}
        <div className={clsx("p-6", isFeatured && "md:p-8")}>
          <h3 className={clsx("font-serif font-bold leading-tight text-2xl md:text-3xl text-gray-900 group-hover:text-blue-600 transition-colors", isFeatured && "md:text-4xl")}>
            {title}
          </h3>
          <p className={clsx("mt-3 text-gray-600 line-clamp-3", isFeatured && "md:mt-4")}>
            {excerpt}
          </p>

          {/* Meta */}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
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