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

// Premium placeholder for books
const DEFAULT_COVER = "/assets/images/premium-book-placeholder.jpg";

const isValidLink = (link?: string | null): link is string =>
  !!link && link.trim() !== "" && link.trim() !== "#";

function normaliseBookSlug(raw: string): string {
  const s = (raw || "").toString().trim().toLowerCase().replace(/^\/+|\/+$/g, "");
  return s.replace(/^books\//, "");
}

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
        // Premium container styling
        "group relative overflow-hidden rounded-xl bg-white",
        "border border-gold/20 shadow-sm transition-all duration-500",
        "hover:shadow-xl hover:border-gold/40",
        "focus-within:ring-2 focus-within:ring-gold/30",
        featured && "ring-2 ring-gold/50 shadow-lg",
        className,
      )}
    >
      {/* Premium featured badge */}
      {featured && (
        <div className="absolute top-4 left-4 z-10">
          <div className="bg-gold text-charcoal px-3 py-1 rounded-full text-xs font-medium tracking-wide uppercase shadow-lg">
            Featured
            <span className="sr-only"> book</span>
          </div>
        </div>
      )}

      {/* Premium cover with enhanced styling */}
      <Link
        href={detailHref}
        prefetch={false}
        className="block relative overflow-hidden bg-gradient-to-br from-cream/10 to-gold/5"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="relative w-full aspect-[2/3] overflow-hidden">
          <Image
            src={finalImageSrc}
            alt={`${title} book cover`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 300px"
            className="object-cover transition-all duration-700 group-hover:scale-105"
            priority={featured}
          />
          {/* Premium overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>
      </Link>

      {/* Premium content area */}
      <div className="p-6 space-y-4">
        {/* Title with premium typography */}
        <h3 className="font-serif text-xl font-semibold text-charcoal leading-tight">
          <Link
            href={detailHref}
            prefetch={false}
            className="hover:text-gold transition-colors duration-300 block"
          >
            {title}
          </Link>
        </h3>

        {/* Author with subtle styling */}
        <p className="text-sm text-charcoal/70 font-light tracking-wide">
          By {author}
        </p>

        {/* Excerpt with refined typography */}
        <p className="text-sm leading-relaxed text-charcoal/80 font-light line-clamp-3">
          {excerpt}
        </p>

        {/* Premium action bar */}
        <div className="flex items-center justify-between pt-2">
          {/* Genre with premium chip styling */}
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-cream text-charcoal/70 text-xs font-medium border border-gold/20">
            {genre || "Literature"}
          </span>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {/* Primary CTA */}
            <Link
              href={detailHref}
              prefetch={false}
              className="inline-flex items-center px-4 py-2 bg-charcoal text-cream rounded-lg text-sm font-medium hover:bg-gold hover:text-charcoal transition-all duration-300 shadow-sm hover:shadow-md"
            >
              Explore
            </Link>

            {/* Secondary CTA */}
            {isValidLink(buyLink) && (
              <a
                href={buyLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-charcoal/20 text-charcoal rounded-lg text-sm font-medium hover:bg-charcoal hover:text-cream transition-all duration-300"
                aria-label={`Purchase ${title} (opens in new tab)`}
              >
                Buy
              </a>
            )}
          </div>
        </div>

        {/* Premium download links */}
        {(isValidLink(downloadPdf) || isValidLink(downloadEpub)) && (
          <div className="flex items-center gap-4 pt-3 border-t border-gold/10">
            <span className="text-xs text-charcoal/60 font-medium">Download:</span>
            <div className="flex gap-3">
              {isValidLink(downloadPdf) && (
                <a
                  href={downloadPdf}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gold hover:text-charcoal transition-colors duration-300 font-medium"
                >
                  PDF
                </a>
              )}
              {isValidLink(downloadEpub) && (
                <a
                  href={downloadEpub}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gold hover:text-charcoal transition-colors duration-300 font-medium"
                >
                  EPUB
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.article>
  );
}