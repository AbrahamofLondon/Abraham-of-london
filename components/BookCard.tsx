// components/BookCard.tsx
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { motion, type MotionProps } from "framer-motion";
import clsx from "clsx";
import * as React from "react";

export type BookCardProps = {
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  coverImage?: string | StaticImageData | null;
  buyLink?: string | null;
  genre: string;
  downloadPdf?: string | null;
  downloadEpub?: string | null;
  featured?: boolean;
  className?: string;
  motionProps?: MotionProps;
};

const DEFAULT_COVER = "/assets/images/blog/default-blog-cover@1600.jpg";

const isValidLink = (link?: string | null): link is string =>
  !!link && link.trim() !== "" && link.trim() !== "#";

export default function BookCard({
  slug,
  title,
  author,
  excerpt,
  coverImage,
  buyLink,
  genre,
  downloadPdf,
  downloadEpub,
  featured = false,
  className = "",
  motionProps = {},
}: BookCardProps) {
  // ✅ FIX: Force slug to lowercase for reliable Linux routing
  const normalizedSlug = slug.toLowerCase();
  const detailHref = `/books/${normalizedSlug}`;
  
  const finalImageSrc = (typeof coverImage === 'string' && coverImage) || DEFAULT_COVER; 

  return (
    <motion.article
      {...motionProps}
      className={clsx(
        "group overflow-hidden rounded-2xl border border-lightGrey bg-white shadow-card transition-all hover:shadow-cardHover",
        "focus-within:ring-1 focus-within:ring-softGold/50",
        featured && "ring-1 ring-softGold/30",
        className
      )}
    >
      <Link href={detailHref} prefetch={false} className="block relative w-full" tabIndex={-1} aria-hidden="true">
        <div className="relative w-full aspect-[2/3]">
          <Image
            src={finalImageSrc}
            alt={`${title} book cover`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 300px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            priority={featured}
          />
        </div>

        {featured && (
          <span className="absolute top-4 left-4 rounded-full bg-softGold px-3 py-1 text-xs font-semibold text-deepCharcoal shadow">
            Featured<span className="sr-only"> book</span>
          </span>
        )}
      </Link>

      <div className="p-6">
        <h3 className="font-serif text-xl font-semibold text-deepCharcoal">
          <Link
            href={detailHref}
            prefetch={false}
            className="underline decoration-softGold/0 underline-offset-[6px] transition hover:decoration-softGold/70"
          >
            {title}
          </Link>
        </h3>

        <p className="mt-1 text-sm text-[color:var(--color-on-secondary)/0.7]">By {author}</p>

        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[color:var(--color-on-secondary)/0.9]">
          {excerpt}
        </p>
        
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Genre chip */}
          <span className="inline-flex rounded-full border border-lightGrey px-2.5 py-1 text-xs text-[color:var(--color-on-secondary)/0.7]">
            {genre || "Uncategorized"}
          </span>

          {/* Primary: Learn more */}
          <Link
            href={detailHref}
            prefetch={false}
            className="ml-auto inline-flex items-center rounded-full bg-forest px-4 py-2 text-xs font-semibold text-cream transition hover:bg-[color:var(--color-primary)/0.9]"
          >
            Learn more
          </Link>

          {/* Secondary: Buy */}
          {isValidLink(buyLink) && (
            <a
              href={buyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-[color:var(--color-primary)/0.25] px-4 py-2 text-xs font-semibold text-forest transition hover:bg-forest hover:text-cream"
              aria-label={`Buy ${title} (opens in new tab)`}
            >
              Buy
            </a>
          )}
        </div>

        {/* Tertiary: Downloads */}
        {(isValidLink(downloadPdf) || isValidLink(downloadEpub)) && (
          <div className="mt-3 flex flex-wrap gap-4 text-xs">
            {isValidLink(downloadPdf) && (
              <a href={downloadPdf} target="_blank" rel="noopener noreferrer" className="luxury-link">
                PDF
              </a>
            )}
            {isValidLink(downloadEpub) && (
              <a href={downloadEpub} target="_blank" rel="noopener noreferrer" className="luxury-link">
                EPUB
              </a>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}