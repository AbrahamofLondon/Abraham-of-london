// components/ArticleHero.tsx
import * as React from "react";
import clsx from "clsx";
import { CoverFrame, type CoverAspect } from "@/components/media/CoverFrame";

type ArticleHeroProps = {
  title?: string | null;
  subtitle?: string | null;
  category?: string | null;
  date?: string | null;
  readTime?: string | number | null;
  coverImage?: string | null;
  coverAspect?: CoverAspect;
  coverFit?: "cover" | "contain";
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

export default function ArticleHero(props: ArticleHeroProps): JSX.Element {
  const {
    title = "",
    subtitle,
    category,
    date,
    readTime,
    coverImage,
    coverAspect = "book",
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
        "border-b border-white/10 bg-gradient-to-b",
        "from-black via-[#050608] to-[#050608]",
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 pb-12 pt-8 md:flex-row md:items-center md:gap-12 md:pb-16 md:pt-12 lg:px-8">
        {/* LEFT: copy - now takes more space */}
        <div className="flex-1 md:max-w-2xl">
          {category && (
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#D6B26A]">
              {category}
            </p>
          )}
          <h1 className="font-serif text-[clamp(2rem,4vw,2.75rem)] font-semibold leading-[1.15] text-white">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-gray-200 md:text-lg">
              {subtitle}
            </p>
          )}
          {metaBits && (
            <p className="mt-6 text-xs font-medium uppercase tracking-[0.16em] text-gray-400">
              {metaBits}
            </p>
          )}
        </div>

        {/* RIGHT: controlled cover frame - now smaller */}
        {coverImage && (
          <div className="w-full shrink-0 md:w-64 lg:w-72">
            <CoverFrame
              src={coverImage}
              alt={title}
              aspect={coverAspect}
              priority
            />
          </div>
        )}
      </div>
    </section>
  );
}