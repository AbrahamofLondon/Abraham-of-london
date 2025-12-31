// src/components/ArticleHero.tsx
import * as React from "react";

export type ArticleHeroProps = {
  title: string;
  subtitle?: string | null;
  description?: string | null;
  date?: string | null;
  readTime?: string | null;
  tags?: string[] | null;
  category?: string | null;
} & React.HTMLAttributes<HTMLDivElement>;

/**
 * Primary hero header for long-form articles.
 */
export default function ArticleHero(props: ArticleHeroProps): JSX.Element {
  const {
    title,
    subtitle,
    description,
    date,
    readTime,
    tags,
    category,
    className,
    ...rest
  } = props;

  return (
    <header
      className={[
        "mb-10 border-b border-white/5 pb-8",
        "sm:mb-12 sm:pb-10",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    >
      {/* Eyebrow */}
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-softGold/80">
        Abraham of London · {category || "Essay"}
      </p>

      {/* Title */}
      <h1 className="mt-3 font-serif text-3xl font-semibold text-cream sm:text-4xl md:text-5xl">
        {title}
      </h1>

      {/* Subtitle */}
      {subtitle && (
        <p className="mt-3 max-w-2xl text-sm text-gold/80 sm:text-base">
          {subtitle}
        </p>
      )}

      {/* Description/excerpt */}
      {description && (
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-gray-200 sm:text-base">
          {description}
        </p>
      )}

      {/* Meta row */}
      {(date || readTime || (tags && tags.length > 0)) && (
        <div className="mt-6 flex flex-wrap items-center gap-3 text-[0.75rem] text-gray-400">
          {date && (
            <span className="rounded-full border border-gray-700/70 px-3 py-1">
              {new Date(date).toLocaleDateString("en-GB", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          )}

          {readTime && (
            <span className="rounded-full border border-gray-700/70 px-3 py-1 uppercase tracking-[0.18em]">
              {readTime}
            </span>
          )}

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 6).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-gray-700/70 bg-black/40 px-3 py-1 text-[0.7rem] uppercase tracking-[0.14em] text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
