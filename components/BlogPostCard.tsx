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
    "group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur",
    "shadow-card transition-transform",
    isFeatured
      ? "md:col-span-2 lg:col-span-2"
      : "hover:scale-[1.01]",
    className,
  );

  return (
    <motion.article
      className={cardClass}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
    >
      <Link href={`/blog/${slug}`} className="block focus:outline-none">
        {/* Image */}
        <div className={clsx(
          "relative w-full overflow-hidden",
          isFeatured ? "aspect-[16/9]" : "aspect-[4/3]"
        )}>
          <Image
            src={coverImage}
            alt={title}
            fill
            priority={isFeatured}
            sizes={isFeatured ? "(min-width: 1024px) 800px, 100vw" : "(min-width: 768px) 400px, 100vw"}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {category && (
            <span className="absolute left-3 top-3 rounded-full bg-black/50 px-3 py-1 text-xs text-cream">
              {category}
            </span>
          )}
        </div>

        {/* Content */}
        <div className={clsx(
          "p-5 text-cream",
          isFeatured && "md:p-6 lg:p-8"
        )}>
          <h3 className={clsx(
            "font-semibold leading-tight line-clamp-2",
            isFeatured ? "text-xl md:text-2xl" : "text-lg"
          )}>
            {title}
          </h3>

          <p className={clsx(
            "mt-2 text-cream/80 line-clamp-3",
            isFeatured ? "md:mt-3" : ""
          )}>
            {excerpt}
          </p>

          {/* Meta */}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-cream/70">
            <DateFormatter dateString={date} pattern="d MMM yyyy" />
            <span aria-hidden>â€¢</span>
            <span>by {author}</span>
            {readTime && (
              <>
                <span aria-hidden>â€¢</span>
                <span>{readTime}</span>
              </>
            )}
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

