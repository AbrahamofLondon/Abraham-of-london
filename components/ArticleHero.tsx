// components/ArticleHero.tsx
import * as React from "react";
import Image from "next/image";
import clsx from "clsx";

export type ArticleHeroAspect = "book" | "wide" | "auto";

export type ArticleHeroProps = {
  title?: string;
  subtitle?: string;
  category?: string | number | (string | number)[];
  date?: string;
  readTime?: string | number;
  coverImage?: string | null;
  coverAspect?: ArticleHeroAspect;
  coverFit?: "cover" | "contain";
};

/** Simple guard for date formatting. */
function formatPretty(date?: string): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.valueOf())) return date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function normalizeLocal(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  const clean = src.replace(/^\/+/, "");
  return `/${clean}`;
}

export default function ArticleHero({
  title,
  subtitle,
  category,
  date,
  readTime,
  coverImage,
  coverAspect = "book",
  coverFit = "contain",
}: ArticleHeroProps) {
  const catLabel = Array.isArray(category)
    ? String(category[0] ?? "")
    : category
    ? String(category)
    : undefined;

  const coverSrc = normalizeLocal(coverImage);
  const hasCover = Boolean(coverSrc);

  const aspectClass =
    coverAspect === "wide"
      ? "aspect-[16/9]"
      : coverAspect === "auto"
      ? ""
      : "aspect-[2/3]"; // default book

  return (
    <section className="border-b border-white/10 bg-gradient-to-b from-black via-deepCharcoal to-black text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-10 pt-10 lg:flex-row lg:items-start lg:pb-14 lg:pt-12">
        {/* LEFT: text -------------------------------------------------------- */}
        <div className="flex-1">
          {catLabel && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-softGold">
              {catLabel}
            </p>
          )}

          {title && (
            <h1 className="font-serif text-3xl font-light leading-tight sm:text-4xl lg:text-5xl">
              {title}
            </h1>
          )}

          {subtitle && (
            <p className="mt-4 max-w-prose text-sm leading-relaxed text-gray-200 sm:text-base">
              {subtitle}
            </p>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-gray-400">
            {date && (
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-softGold" />
                <time dateTime={date}>{formatPretty(date)}</time>
              </div>
            )}

            {readTime && (
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-softGold/70" />
                <span>
                  {typeof readTime === "number"
                    ? `${readTime} min read`
                    : readTime}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: cover ------------------------------------------------------ */}
        {hasCover && (
          <div className="flex justify-center lg:flex-shrink-0 lg:pt-1">
            <div
              className={clsx(
                "relative w-full max-w-[360px] sm:max-w-[420px] md:max-w-[460px]",
                "rounded-2xl border border-softGold/40 bg-black/70 p-3",
                "shadow-[0_18px_45px_rgba(0,0,0,0.75)]",
              )}
            >
              <div className={clsx("relative w-full", aspectClass)}>
                <Image
                  src={coverSrc!}
                  alt={title || "Article cover"}
                  width={800}
                  height={1200}
                  priority
                  className={clsx(
                    "h-auto w-full rounded-xl",
                    coverFit === "cover"
                      ? "object-cover"
                      : "object-contain",
                  )}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}