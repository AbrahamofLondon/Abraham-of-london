// components/ArticleHero.tsx
import * as React from "react";
import Image from "next/image";
import clsx from "clsx";

type Aspect = "book" | "wide" | "square";

export interface ArticleHeroProps {
  title?: string;
  subtitle?: string | null;
  category?: string | string[] | null;
  date?: string | null;
  readTime?: string | number | null;

  coverImage?: string | null;
  coverAspect?: Aspect;
  coverFit?: "cover" | "contain";
  coverPosition?: "top" | "center" | "left" | "right";
}

/** Simple date pretty-printer (date-only safe) */
function formatPretty(date?: string | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.valueOf())) return date;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

function aspectClass(aspect: Aspect = "book"): string {
  switch (aspect) {
    case "wide":
      return "aspect-[16/9]";
    case "square":
      return "aspect-[1/1]";
    case "book":
    default:
      return "aspect-[2/3]";
  }
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
  coverPosition = "center",
}: ArticleHeroProps): JSX.Element {
  const hasCover =
    typeof coverImage === "string" && coverImage.trim().length > 0;

  const catLabel = Array.isArray(category)
    ? category.filter(Boolean).join(" · ")
    : category ?? "Article";

  const readTimeLabel =
    typeof readTime === "number" ? `${readTime} min read` : readTime ?? "";

  return (
    <section className="relative border-b border-white/10 bg-gradient-to-b from-black via-deepCharcoal to-charcoal/90">
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-12 pt-20 md:flex-row md:items-center md:gap-12 lg:px-0">
        {/* LEFT: text */}
        <div className="flex-1">
          {catLabel && (
            <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.24em] text-softGold">
              {catLabel}
            </p>
          )}

          {title && (
            <h1 className="font-serif text-3xl font-light leading-tight text-cream sm:text-4xl md:text-5xl">
              {title}
            </h1>
          )}

          {(date || readTimeLabel) && (
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-300">
              {date && (
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  <time
                    dateTime={date}
                    className="uppercase tracking-[0.18em]"
                  >
                    {formatPretty(date)}
                  </time>
                </div>
              )}

              {date && readTimeLabel && (
                <span className="text-softGold/50">•</span>
              )}

              {readTimeLabel && (
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex h-2 w-2 rounded-full bg-softGold" />
                  <span className="uppercase tracking-[0.18em]">
                    {readTimeLabel}
                  </span>
                </div>
              )}
            </div>
          )}

          {subtitle && (
            <p className="mt-5 max-w-xl text-base leading-relaxed text-gray-200">
              {subtitle}
            </p>
          )}
        </div>

        {/* RIGHT: cover – only rendered when we actually have one */}
        {hasCover && (
          <div
            className={clsx(
              "relative w-full max-w-xs flex-1 md:max-w-sm",
              aspectClass(coverAspect),
            )}
          >
            <div className="absolute inset-0 overflow-hidden rounded-2xl border border-softGold/40 bg-black/60 shadow-2xl shadow-black/50">
              <Image
                src={coverImage as string}
                alt={title || "Cover image"}
                fill
                sizes="(max-width: 1024px) 60vw, 320px"
                className={clsx(
                  "h-full w-full",
                  coverFit === "contain" ? "object-contain" : "object-cover",
                  {
                    "object-top": coverPosition === "top",
                    "object-left": coverPosition === "left",
                    "object-right": coverPosition === "right",
                    "object-center": coverPosition === "center",
                  },
                )}
                priority
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}