// components/ArticleHero.tsx
import * as React from "react";
import Image from "next/image";

type CoverAspect = "book" | "wide" | "auto";
type CoverFit = "cover" | "contain";

interface ArticleHeroProps {
  title?: string;
  subtitle?: string;
  category?: string | number;
  date?: string;
  readTime?: string | number;
  coverImage?: string;
  coverAspect?: CoverAspect;
  coverFit?: CoverFit;
  // Optional extra eyebrow line, e.g. "Faith · Field Notes for Fathers"
  eyebrow?: string;
}

/**
 * Format date in a consistent, premium way.
 */
function formatPrettyDate(date?: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.valueOf())) return date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export default function ArticleHero({
  title,
  subtitle,
  category,
  date,
  readTime,
  coverImage,
  coverAspect = "wide",
  coverFit = "cover",
  eyebrow,
}: ArticleHeroProps): JSX.Element {
  const hasCover = typeof coverImage === "string" && coverImage.trim().length > 0;

  // Aspect classes – this is what stops the image from becoming a huge fullscreen monster
  const aspectClass =
    coverAspect === "book"
      ? "aspect-[3/4]" // tall book/print feel
      : coverAspect === "wide"
      ? "aspect-[16/9]" // cinematic banner
      : "aspect-[4/3]"; // sensible default for "auto"

  const objectClass =
    coverFit === "contain" ? "object-contain bg-black" : "object-cover";

  return (
    <section className="relative border-b border-white/10 bg-gradient-to-b from-black via-deepCharcoal to-black/95">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pb-12 pt-24 sm:px-6 lg:px-0 lg:pt-28">
        {/* Top meta & text */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            {eyebrow && (
              <p className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-softGold">
                {eyebrow}
              </p>
            )}

            {category && (
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-softGold/40 bg-softGold/10 px-4 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-softGold" />
                <span className="text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-softGold">
                  {String(category)}
                </span>
              </div>
            )}

            {title && (
              <h1 className="mb-4 font-serif text-3xl font-light leading-tight text-white sm:text-4xl lg:text-5xl">
                {title}
              </h1>
            )}

            {subtitle && (
              <p className="max-w-xl text-sm text-gray-300 sm:text-base">
                {subtitle}
              </p>
            )}
          </div>

          {/* Meta: date + read time */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 sm:text-sm lg:justify-end">
            {date && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-forest/15">
                  <svg
                    className="h-4 w-4 text-forest"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <time dateTime={date}>{formatPrettyDate(date)}</time>
              </div>
            )}

            {readTime && (
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-softGold/15">
                  <svg
                    className="h-4 w-4 text-softGold"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span>{typeof readTime === "number" ? `${readTime} min read` : readTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Cover image – bounded, not full-screen */}
        {hasCover && (
          <div className="overflow-hidden rounded-3xl border border-white/15 bg-black/40 shadow-2xl shadow-black/40">
            <div className={`relative w-full ${aspectClass}`}>
              <Image
                src={coverImage as string}
                alt={title || "Article cover image"}
                fill
                className={`${objectClass} transition-transform duration-700 hover:scale-[1.03]`}
                sizes="(min-width: 1024px) 960px, 100vw"
                priority={false}
              />
              {/* Gentle gradient to keep text readable if you ever overlay */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/10" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}