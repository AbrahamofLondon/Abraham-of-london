// components/ArticleHero.tsx
import * as React from "react";
import Image from "next/image";
import clsx from "clsx";

type ArticleHeroProps = {
  title?: string;
  subtitle?: string | null;
  category?: string | number | null;
  date?: string | null;
  readTime?: string | number | null;
  coverImage?: string | null;
};

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

export default function ArticleHero({
  title,
  subtitle,
  category,
  date,
  readTime,
  coverImage,
}: ArticleHeroProps) {
  const displayReadTime =
    typeof readTime === "number" ? `${readTime} min read` : readTime || "";

  return (
    <header className="border-b border-white/10 bg-black/80 px-4 pt-20 pb-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 lg:flex-row lg:items-start">
        {/* LEFT – meta + titles */}
        <div className="flex-1">
          {category && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-softGold">
              {String(category)}
            </p>
          )}

          {title && (
            <h1 className="mb-3 font-serif text-3xl font-light text-warmWhite md:text-4xl">
              {title}
            </h1>
          )}

          {(subtitle || date || displayReadTime) && (
            <div className="space-y-4 text-sm text-gray-300">
              {subtitle && (
                <p className="max-w-xl leading-relaxed">{subtitle}</p>
              )}

              {(date || displayReadTime) && (
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                  {date && (
                    <span className="inline-flex items-center gap-1">
                      <span className="inline-block h-2 w-2 rounded-full bg-softGold" />
                      <time dateTime={date}>{formatPretty(date)}</time>
                    </span>
                  )}

                  {displayReadTime && (
                    <>
                      <span className="text-softGold/50">•</span>
                      <span>{displayReadTime}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT – capped book cover */}
        {coverImage && (
          <div className="flex flex-none justify-center lg:justify-end">
            <div
              className={clsx(
                "relative w-full max-w-[380px] sm:max-w-[430px] md:max-w-[480px]",
                "rounded-3xl border border-softGold/50 bg-black/60 p-3 shadow-2xl shadow-black/50",
              )}
            >
              <Image
                src={coverImage}
                alt={title || "Article cover"}
                width={800}
                height={1200}
                priority
                className="h-auto w-full rounded-2xl object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}