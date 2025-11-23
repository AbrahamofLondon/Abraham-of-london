// components/ArticleHero.tsx
import * as React from "react";
import Image from "next/image";

type ArticleHeroProps = {
  title: string;
  subtitle?: string | null;
  category?: string | null;
  date?: string | null;
  readTime?: string | number | null;
  coverImage?: string | null;
  coverAspect?: "book" | "wide" | "auto";
  coverFit?: "cover" | "contain";
};

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

export default function ArticleHero({
  title,
  subtitle,
  category,
  date,
  readTime,
  coverImage,
  coverAspect = "wide",
  coverFit = "cover",
}: ArticleHeroProps) {
  const dateText = formatDateISOToGB(date);
  const readText =
    typeof readTime === "number"
      ? `${readTime} min read`
      : typeof readTime === "string" && readTime.trim()
      ? readTime
      : null;

  // Aspect + sizing rules – THIS is what keeps the image civilised.
  const aspectClass =
    coverAspect === "book"
      ? // Book / portrait cover
        "aspect-[3/4] max-h-[520px] md:max-h-[640px]"
      : // Default: cinematic wide hero
        "aspect-[16/9] max-h-[420px] md:max-h-[480px]";

  const objectClass =
    coverFit === "contain" ? "object-contain" : "object-cover";

  return (
    <header className="mx-auto w-full max-w-4xl px-4 pt-10 pb-8 lg:px-0">
      {/* Category + meta */}
      <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-medium tracking-wide text-softGold/80">
        {category && (
          <span className="rounded-full border border-softGold/30 bg-black/40 px-3 py-1 uppercase">
            {category}
          </span>
        )}
        <div className="flex flex-wrap items-center gap-2 text-[0.7rem] text-gray-300">
          {dateText && (
            <time dateTime={date ?? undefined}>{dateText}</time>
          )}
          {dateText && readText && <span>•</span>}
          {readText && <span>{readText}</span>}
        </div>
      </div>

      {/* Title / subtitle */}
      <div className="space-y-3">
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-white sm:text-4xl md:text-[2.75rem]">
          {title}
        </h1>
        {subtitle && (
          <p className="max-w-2xl text-sm md:text-[0.98rem] text-slate-200/90">
            {subtitle}
          </p>
        )}
      </div>

      {/* Cover image with breathing room */}
      {coverImage && (
        <div className="mt-8">
          <div
            className={[
              "relative w-full overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-soft-elevated",
              "mx-auto",
              aspectClass,
            ].join(" ")}
          >
            <Image
              src={coverImage}
              alt={title}
              fill
              priority
              sizes="(min-width: 1024px) 768px, 100vw"
              className={`${objectClass} transition-transform duration-700 will-change-transform hover:scale-[1.02]`}
            />

            {/* Soft vignette overlay for readability if you ever overlay text later */}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
          </div>
        </div>
      )}
    </header>
  );
}