import * as React from "react";
import clsx from "clsx";
import { CoverFrame, type CoverAspect } from "@/components/media/CoverFrame";
import { isString, safeString } from "@/lib/utils"; // Import the utility

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

  // Use the safeString function
  const safeTitle = safeString(title);
  const safeSubtitle = safeString(subtitle);

  return (
    <section
      className={clsx(
        "border-b border-gray-200 bg-white dark:border-white/10 dark:bg-[#0a0b0d]"
      )}
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-10 px-6 py-16 md:flex-row md:items-start md:gap-16 md:py-20 lg:px-8">
        {/* LEFT: Content - More space */}
        <div className="flex-1">
          {category && (
            <p className="mb-5 text-xs font-bold uppercase tracking-[0.2em] text-[#D6B26A]">
              {category}
            </p>
          )}
          <h1 className="mb-8 font-serif text-4xl font-bold leading-[1.2] text-gray-900 dark:text-white md:text-5xl">
            {safeTitle}
          </h1>
          {subtitle && (
            <p className="mb-8 text-lg leading-relaxed text-gray-700 dark:text-gray-100 md:text-xl">
              {safeSubtitle}
            </p>
          )}
          {metaBits && (
            <p className="text-sm font-medium uppercase tracking-wide text-gray-600 dark:text-gray-300">
              {metaBits}
            </p>
          )}
        </div>

        {/* RIGHT: Smaller cover image */}
        {coverImage && (
          <div className="w-48 shrink-0 md:w-56">
            <CoverFrame
              src={coverImage}
              alt={safeTitle}
              aspect={coverAspect}
              priority
            />
          </div>
        )}
      </div>
    </section>
  );
}
