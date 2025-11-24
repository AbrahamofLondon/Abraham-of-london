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
  coverFit?: "cover" | "contain"; // kept for future, currently always "contain"
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
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-10 pt-10 md:flex-row md:items-start md:pb-12 md:pt-12 lg:px-0">
        {/* LEFT: copy */}
        <div className="flex-1">
          {category && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-softGold/80">
              {category}
            </p>
          )}

          <h1 className="font-serif text-[clamp(2.1rem,3.2vw,3rem)] font-semibold leading-tight text-cream">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-4 max-w-xl text-sm md:text-base text-slate-200/90 leading-relaxed">
              {subtitle}
            </p>
          )}

          {metaBits && (
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.16em] text-slate-400">
              {metaBits}
            </p>
          )}
        </div>

        {/* RIGHT: controlled cover frame */}
        {coverImage && (
          <div className="w-full max-w-md md:flex-1 md:max-w-sm">
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