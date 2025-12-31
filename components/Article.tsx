// components/Article.tsx
import * as React from "react";
import Image from "next/image";
import { getSafeImageProps } from "@/lib/image-utils";

interface ArticleProps {
  title?: string;
  subtitle?: string | null;
  coverImage?: string | null;
  date?: string | null;
  category?: string | null;
  readTime?: string | number | null;
  children?: React.ReactNode;
  // allow any extra props to avoid excess property errors
  [key: string]: unknown;
}

function formatDateISOToGB(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(d);
}

export default function Article(props: ArticleProps) {
  const { title, subtitle, coverImage, date, category, readTime, children } =
    props;

  const dateText = formatDateISOToGB(date);

  // Normalise and fallback-cover handling
  const hasCover = Boolean(coverImage);
  const safeCover = hasCover
    ? getSafeImageProps(coverImage, title || "Cover image", {
        // let Next handle sizing via `fill`, so we only use src + alt
        fallbackConfig: { type: "post" },
      })
    : null;

  return (
    <article className="mx-auto flex w-full max-w-4xl flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-0">
      {/* Meta / eyebrow */}
      <header className="mb-6">
        {category && (
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.25em] text-softGold/80">
            {category}
          </p>
        )}

        {title && (
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-cream sm:text-4xl lg:text-5xl">
            {title}
          </h1>
        )}

        {subtitle && (
          <p className="mt-3 max-w-2xl text-sm text-gray-300">{subtitle}</p>
        )}

        {(dateText || readTime) && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-400">
            {dateText && (
              <time dateTime={date || undefined} className="uppercase">
                {dateText}
              </time>
            )}
            {dateText && readTime && (
              <span className="h-1 w-1 rounded-full bg-gray-500" />
            )}
            {readTime && (
              <span>
                {typeof readTime === "number"
                  ? `${readTime} min read`
                  : readTime}
              </span>
            )}
          </div>
        )}
      </header>

      {/* HERO IMAGE - cinematic, capped height */}
      {safeCover && (
        <section className="mb-10">
          <div className="relative overflow-hidden rounded-3xl border border-softGold/25 bg-black/70 shadow-2xl shadow-black/50">
            <div className="relative aspect-[16/9] max-h-[420px] w-full">
              <Image
                src={safeCover.src}
                alt={safeCover.alt}
                fill
                priority={false}
                className="object-cover"
                sizes="(min-width: 1024px) 896px, 100vw"
                // keep blur placeholder if we ever decide to pass it
                placeholder={safeCover.blurDataURL ? "blur" : "empty"}
                blurDataURL={safeCover.blurDataURL}
              />
            </div>

            <div className="flex items-center justify-between border-t border-white/10 px-4 py-3 text-[0.7rem] text-gray-400">
              <span className="truncate pr-4">
                {title ?? "Abraham of London"}
              </span>
              {dateText && (
                <span className="shrink-0 text-right">{dateText}</span>
              )}
            </div>
          </div>
        </section>
      )}

      {/* BODY CONTENT */}
      <section className="prose prose-invert prose-sm max-w-none prose-headings:font-serif prose-headings:text-cream prose-p:text-gray-200 prose-strong:text-gray-50 prose-em:text-gray-200 prose-a:text-softGold">
        <div className="mt-2 space-y-4">{children}</div>
      </section>
    </article>
  );
}
