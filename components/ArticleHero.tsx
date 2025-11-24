// components/ArticleHero.tsx
import * as React from "react";
import clsx from "clsx";
import { CoverFrame, type CoverAspect, type CoverFit } from "@/components/media/CoverFrame";

interface ArticleHeroProps {
  title?: string | null;
  subtitle?: string | null;
  category?: string | null;
  date?: string | null;
  readTime?: string | number | null;
  coverImage?: string | null;
  coverAspect?: CoverAspect;
  coverFit?: CoverFit;
}

function formatDate(date?: string | null): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.valueOf())) return null;
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
  coverAspect = "book",
  coverFit = "contain",
}: ArticleHeroProps): JSX.Element {
  const dateText = formatDate(date);
  const readText =
    typeof readTime === "number"
      ? `${readTime} min read`
      : typeof readTime === "string" && readTime.trim()
      ? readTime
      : null;

  const metaParts = [dateText, readText].filter(Boolean);
  const metaText = metaParts.join(" • ");

  const hasCover = typeof coverImage === "string" && coverImage.trim().length > 0;

  return (
    <section
      className={clsx(
        "border-b border-white/10",
        "bg-[radial-gradient(circle_at_top,rgba(214,178,106,0.18),transparent_55%),#050608]",
      )}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-4 pb-10 pt-10 md:flex-row md:items-center md:gap-12 md:pb-12 md:pt-14 lg:px-0">
        {/* LEFT: text */}
        <div className="flex-1 space-y-4">
          {category && (
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-softGold/80">
              {category}
            </p>
          )}

          <h1 className="font-serif text-3xl leading-tight text-cream sm:text-4xl md:text-[2.6rem]">
            {title}
          </h1>

          {subtitle && (
            <p className="max-w-prose text-sm sm:text-base text-gray-200/95">
              {subtitle}
            </p>
          )}

          {metaText && (
            <p className="pt-1 text-xs font-medium uppercase tracking-wide text-gray-400">
              {metaText}
            </p>
          )}
        </div>

        {/* RIGHT: controlled cover */}
        {hasCover && (
          <div className="flex-1 md:flex md:justify-end">
            <CoverFrame
              src={coverImage}
              alt={title ?? "Article cover"}
              aspect={coverAspect}
              fit={coverFit}
            />
          </div>
        )}
      </div>
    </section>
  );
}