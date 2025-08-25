// components/BookCard.tsx
import Link from "next/link";
import Image, { type StaticImageData } from "next/image";
import { motion, type MotionProps } from "framer-motion";
import clsx from "clsx";
import * as React from "react";

export type BookCardProps = {
  slug: string; // accepts "my-book" or "/books/my-book"
  title: string;
  author: string;
  excerpt: string;
  coverImage?: string | StaticImageData;
  buyLink?: string;
  genre: string;
  downloadPdf?: string | null;
  downloadEpub?: string | null;
  featured?: boolean;
  className?: string;
  motionProps?: MotionProps;
};

const DEFAULT_COVER = "/assets/images/default-book.jpg";

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
  const detailHref = slug.startsWith("/") ? slug : `/books/${slug}`;

  const initialSrc: string | StaticImageData =
    typeof coverImage === "object"
      ? coverImage
      : (coverImage && coverImage.trim()) || DEFAULT_COVER;

  const [imgSrc, setImgSrc] = React.useState<string | StaticImageData>(initialSrc);

  return (
    <motion.article
      {...motionProps}
      className={clsx(
        "group overflow-hidden rounded-2xl border border-lightGrey bg-white shadow-card transition-all hover:shadow-cardHover",
        "focus-within:ring-1 focus-within:ring-forest/30",
        featured && "ring-1 ring-softGold/30",
        className
      )}
    >
      <Link href={detailHref} className="block relative w-full" prefetch={false}>
        {/* 2:3 book-cover ratio */}
        <div className="relative w-full aspect-[2/3]">
          <Image
            src={imgSrc}
            alt={`${title} book cover`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 300px"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
            onError={() => typeof imgSrc === "string" && imgSrc !== DEFAULT_COVER && setImgSrc(DEFAULT_COVER)}
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
        <p className="mt-1 text-sm text-deepCharcoal/70">By {author}</p>
        <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-deepCharcoal/90">{excerpt}</p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex rounded-full border border-lightGrey px-2.5 py-1 text-xs text-deepCharcoal/70">
            {genre || "Uncategorized"}
          </span>

          <Link
            href={detailHref}
            prefetch={false}
            className="ml-auto inline-flex items-center rounded-full bg-forest px-4 py-2 text-xs font-semibold text-cream transition hover:bg-forest/90"
          >
            Learn more
          </Link>

          {buyLink && buyLink !== "#" && (
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

        {(downloadPdf || downloadEpub) && (
          <div className="mt-3 flex flex-wrap gap-4 text-xs">
            {downloadPdf && (
              <a href={downloadPdf} target="_blank" rel="noopener noreferrer" className="luxury-link">
                PDF
              </a>
            )}
            {downloadEpub && (
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
