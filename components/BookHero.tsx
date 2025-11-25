// components/BookHero.tsx
import * as React from "react";
import clsx from "clsx";
import { CoverFrame, type CoverAspect } from "@/components/media/CoverFrame";

type BookHeroProps = {
  title?: string | null;
  subtitle?: string | null;
  author?: string | null;
  date?: string | null;
  readTime?: string | number | null;
  coverImage?: string | null;
  coverAspect?: CoverAspect;
  coverFit?: "cover" | "contain";
  publisher?: string | null;
  publishedDate?: string | null;
  pages?: number | null;
  format?: string | null;
  isbn?: string | null;
};

function formatDate(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

export default function BookHero(props: BookHeroProps): JSX.Element {
  const {
    title = "",
    subtitle,
    author,
    date,
    readTime,
    coverImage,
    coverAspect = "book",
    publisher,
    publishedDate,
    pages,
    format,
    isbn,
  } = props;

  const dateLabel = formatDate(date);
  const readLabel =
    typeof readTime === "number"
      ? `${readTime} min read`
      : typeof readTime === "string" && readTime.trim()
      ? readTime
      : null;
  
  const metaBits = [dateLabel, readLabel].filter(Boolean).join(" • ");

  return (
    <section
      className={clsx(
        "border-b border-gray-200 bg-gradient-to-br from-softGold/5 to-forest/5 dark:border-white/10 dark:bg-[#0a0b0d]"
      )}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16 md:flex-row md:items-start md:gap-16 md:py-20 lg:px-8">
        {/* LEFT: Content */}
        <div className="flex-1">
          {/* Book-specific metadata */}
          <div className="mb-6 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
            {author && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-softGold">By</span>
                <span>{author}</span>
              </div>
            )}
            {publisher && (
              <div className="flex items-center gap-2">
                <span className="font-semibold text-softGold">Publisher:</span>
                <span>{publisher}</span>
              </div>
            )}
          </div>

          <h1 className="mb-6 font-serif text-4xl font-bold leading-[1.2] text-gray-900 dark:text-white md:text-5xl">
            {title}
          </h1>

          {subtitle && (
            <p className="mb-8 text-lg leading-relaxed text-gray-700 dark:text-gray-100 md:text-xl">
              {subtitle}
            </p>
          )}

          {/* Book details */}
          <div className="mb-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            {publishedDate && (
              <div>
                <strong className="text-deepCharcoal dark:text-cream">Published:</strong>{" "}
                {formatDate(publishedDate)}
              </div>
            )}
            {pages && (
              <div>
                <strong className="text-deepCharcoal dark:text-cream">Pages:</strong> {pages}
              </div>
            )}
            {format && (
              <div>
                <strong className="text-deepCharcoal dark:text-cream">Format:</strong>{" "}
                <span className="capitalize">{format}</span>
              </div>
            )}
          </div>

          {metaBits && (
            <p className="text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">
              {metaBits}
            </p>
          )}
        </div>

        {/* RIGHT: Book cover with enhanced styling */}
        {coverImage && (
          <div className="w-48 shrink-0 md:w-56">
            <div className="relative">
              <div className="absolute -right-2 -top-2 h-full w-full rounded-lg bg-softGold/20 transform rotate-2 transition-transform group-hover:rotate-1" />
              <CoverFrame
                src={coverImage}
                alt={title}
                aspect={coverAspect}
                priority
                className="relative z-10 transform transition-transform group-hover:scale-105 shadow-2xl"
              />
            </div>
            
            {/* Book spine effect */}
            <div className="absolute -left-1 top-2 w-2 h-full bg-gradient-to-r from-gray-400/20 to-transparent rounded-l" />
          </div>
        )}
      </div>
    </section>
  );
}