import * as React from "react";

export type ArticleHeroProps = React.PropsWithChildren<{
  title?: string;
  subtitle?: string | null;
  eyebrow?: string | null;
  readTime?: string | null;
  date?: string | null;
  tags?: string[];
  className?: string;
  [key: string]: unknown;
}>;

const ArticleHero: React.FC<ArticleHeroProps> = ({
  title,
  subtitle,
  eyebrow,
  readTime,
  date,
  tags,
  className,
  children,
}) => {
  const displayTitle = title ?? "Untitled";
  const displaySubtitle = subtitle ?? null;

  return (
    <section
      className={[
        "mb-10 rounded-3xl border border-white/10 bg-gradient-to-b",
        "from-charcoal via-charcoal/95 to-charcoal/90 px-6 py-10 sm:px-8",
        "shadow-[0_18px_60px_rgba(0,0,0,0.7)]",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Eyebrow */}
      {eyebrow && (
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.26em] text-softGold/80">
          {eyebrow}
        </p>
      )}

      {/* Title */}
      <h1 className="mt-2 font-serif text-3xl font-semibold text-cream sm:text-4xl lg:text-[2.6rem] lg:leading-tight">
        {displayTitle}
      </h1>

      {/* Subtitle */}
      {displaySubtitle && (
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-gray-200 sm:text-base">
          {displaySubtitle}
        </p>
      )}

      {/* Meta row */}
      {(date || readTime || (tags && tags.length > 0)) && (
        <div className="mt-5 flex flex-wrap items-center gap-3 text-[0.75rem] text-gray-400">
          {date && (
            <span className="rounded-full border border-gray-600/70 px-3 py-1">
              {date}
            </span>
          )}

          {readTime && (
            <span className="rounded-full border border-gray-600/70 px-3 py-1 uppercase tracking-[0.18em]">
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

      {/* Optional extra content below meta (e.g. intro) */}
      {children && <div className="mt-6 text-sm text-gray-200">{children}</div>}
    </section>
  );
};

export default ArticleHero;