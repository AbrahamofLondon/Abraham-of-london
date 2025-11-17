// components/BookCard.tsx
import * as React from "react";
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { motion, type MotionProps } from "framer-motion";
import clsx from "clsx";

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

// Default placeholder specifically for books
const DEFAULT_COVER = "/assets/images/default-book.jpg";

const isValidLink = (link?: string | null): link is string =>
  !!link && link.trim() !== "" && link.trim() !== "#";

function normaliseBookSlug(raw: string): string {
  const s = (raw || "").toString().trim().toLowerCase().replace(/^\/+|\/+$/g, "");
  // If it's "books/slug" or "/books/slug", strip the prefix
  return s.replace(/^books\//, "");
}

/**
 * Support both string paths and StaticImageData
 */
function resolveCoverImage(
  coverImage?: string | StaticImageData | null
): string | StaticImageData {
  if (typeof coverImage === "string" && coverImage.trim().length > 0) {
    return coverImage;
  }
  if (coverImage && typeof coverImage === "object") {
    return coverImage;
  }
  return DEFAULT_COVER;
}

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
  const normalizedSlug = normaliseBookSlug(slug);
  const detailHref = `/books/${encodeURIComponent(normalizedSlug)}`;

  const finalImageSrc = resolveCoverImage(coverImage);

  return (
    <motion.article
      {...motionProps}
      className={clsx(
        "group overflow-hidden rounded-2xl border border-lightGrey bg-white shadow-card transition-all hover:shadow-cardHover",
        "focus-within:ring-1 focus-within:ring-softGold/50",
        featured && "ring-1 ring-softGold/30",
        className,
      )}
    >
      {/* COVER */}
      <Link
        href={detailHref}
        prefetch={false}
        className="block relative w-full"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="relative w-full bg-warmWhite/80">
          {/* Book-like aspect */}
          <div className="relative w-full aspect-[2/3]">
            <Image
              src={finalImageSrc}
              alt={`${title} book cover`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 300px"
              // 🔑 Show the whole cover as a “book object”
              className="object-contain object-center transition-transform duration-500 group-hover:scale-[1.02]"
              priority={featured}
            />
          </div>
        </div>

        {featured && (
          <span className="absolute top-4 left-4 rounded-full bg-softGold px-3 py-1 text-xs font-semibold text-deepCharcoal shadow">
            Featured<span className="sr-only"> book</span>
          </span>
        )}
      </Link>

      {/* BODY */}
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

        <p className="mt-1 text-sm text-[color:var(--color-on-secondary)/0.7]">
          By {author}
        </p>

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
              <a
                href={downloadPdf}
                target="_blank"
                rel="noopener noreferrer"
                className="luxury-link"
              >
                PDF
              </a>
            )}
            {isValidLink(downloadEpub) && (
              <a
                href={downloadEpub}
                target="_blank"
                rel="noopener noreferrer"
                className="luxury-link"
              >
                EPUB
              </a>
            )}
          </div>
        )}
      </div>
    </motion.article>
  );
}