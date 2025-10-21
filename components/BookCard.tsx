// components/BookCard.tsx
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { motion, type MotionProps } from "framer-motion";
import clsx from "clsx";
import * as React from "react";

// --- Type Definitions ---

// Updated type for coverImage to accept null
export type BookCardProps = {
  slug: string; // accepts "my-book" or "/books/my-book"
  title: string;
  author: string;
  excerpt: string;
  coverImage?: string | StaticImageData | null; 
  buyLink?: string | null; // Explicitly allow null
  genre: string;
  downloadPdf?: string | null;
  downloadEpub?: string | null;
  featured?: boolean;
  className?: string;
  motionProps?: MotionProps;
};

// --- Constants & Helpers ---

const DEFAULT_COVER: string = "/assets/images/default-book.jpg";

// Helper function to check if a link is a non-empty, non-placeholder string
const isValidLink = (link?: string | null): link is string => 
  !!link && link.trim() !== "" && link.trim() !== "#";

// --- Component ---

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
  
  // 1. Determine the canonical detail URL
  const detailHref = slug.startsWith("/") ? slug : `/books/${slug}`;

  // 2. Determine the initial image source with fallback logic
  const initialSrc: string | StaticImageData =
    (coverImage && (typeof coverImage === "string" ? coverImage.trim() : coverImage)) || DEFAULT_COVER;

  // State for image source, used for runtime error fallback
  const [imgSrc, setImgSrc] = React.useState<string | StaticImageData>(initialSrc);

  return (
    <motion.article
      {...motionProps}
      className={clsx(
        "group overflow-hidden rounded-2xl border border-lightGrey bg-white shadow-card transition-all hover:shadow-cardHover",
        "focus-within:ring-1 focus-within:ring-softGold/50", // Use softGold for consistency/brand
        featured && "ring-1 ring-softGold/30",
        className
      )}
    >
      {/* 3. Link wrapping image for hover effect. Add tabIndex=-1 to prioritize title link. */}
      <Link 
        href={detailHref} 
        className="block relative w-full" 
        prefetch={false}
        tabIndex={-1} 
        aria-hidden="true" 
      >
        {/* 2:3 book-cover ratio container */}
        <div className="relative w-full aspect-[2/3]">
          <Image
            src={imgSrc}
            alt={`${title} book cover`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 300px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            // Robust error handling: only set default if the current image is a string AND not already the default
            onError={() => {
              if (typeof imgSrc === "string" && imgSrc !== DEFAULT_COVER) {
                setImgSrc(DEFAULT_COVER);
              }
            }}
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
          {/* Main title link, primary focus target */}
          <Link
            href={detailHref}
            prefetch={false}
            className="underline decoration-softGold/0 underline-offset-[6px] transition hover:decoration-softGold/70"
          >
            {title}
          </Link>
        </h3>
        <p className="mt-1 text-sm text-[color:var(--color-on-secondary)/0.7]">By {author}</p>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-[color:var(--color-on-secondary)/0.9]">{excerpt}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          {/* Genre Pill */}
          <span className="inline-flex rounded-full border border-lightGrey px-2.5 py-1 text-xs text-[color:var(--color-on-secondary)/0.7]">
            {genre || "Uncategorized"}
          </span>

          {/* Learn More Link */}
          <Link
            href={detailHref}
            prefetch={false}
            className="ml-auto inline-flex items-center rounded-full bg-forest px-4 py-2 text-xs font-semibold text-cream transition hover:bg-forest/90" // Adjusted hover color
          >
            Learn more
          </Link>

          {/* Buy Link - uses isValidLink helper */}
          {isValidLink(buyLink) && (
            <a
              href={buyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-full border border-forest/25 px-4 py-2 text-xs font-semibold text-forest transition hover:bg-forest hover:text-cream"
              aria-label={`Buy ${title} (opens in new tab)`}
            >
              Buy
            </a>
          )}
        </div>

        {/* Download Links - uses isValidLink helper */}
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