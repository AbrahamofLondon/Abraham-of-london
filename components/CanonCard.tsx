// components/CanonCard.tsx
import * as React from "react";
import Link from "next/link";

export type CanonCardProps = {
  canon: {
    slug: string;
    title: string;
    subtitle?: string | null;
    excerpt?: string | null;
    description?: string | null;
    coverImage?: string | null;
    volumeNumber?: number | string | null;
    featured?: boolean | null;
    tags?: string[] | null;
    date?: string | null;
    accessLevel?: string | null;
  };
};

/**
 * CanonCard
 * ----------
 * Harrods Library × Ancient Near Eastern Gravitas × Modern Strategic Intelligence.
 * 
 * Designed to slot straight into pages/canon/index.tsx wherever `CanonCard` is used,
 * without changing that page.
 */
export default function CanonCard({ canon }: CanonCardProps): JSX.Element {
  const {
    slug,
    title,
    subtitle,
    excerpt,
    description,
    coverImage,
    volumeNumber,
    featured,
    tags,
    date,
    accessLevel,
  } = canon;

  const primaryLine = title || "Untitled Canon Volume";

  const secondaryLine =
    subtitle ||
    excerpt ||
    description ||
    "A catalogued volume from the Abraham of London Canon.";

  const isInnerCircle = accessLevel === "inner-circle";

  const displayDate =
    date && !Number.isNaN(new Date(date).getTime())
      ? new Date(date).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

  const primaryTag =
    tags && tags.length > 0 ? tags[0] : featured ? "Featured Volume" : null;

  return (
    <Link
      href={`/canon/${slug}`}
      className="
        group relative flex flex-col overflow-hidden
        rounded-3xl border border-white/10 bg-gradient-to-b
        from-[#020617] via-black to-[#020617]
        px-5 py-5 md:px-6 md:py-6
        shadow-[0_18px_45px_rgba(0,0,0,0.75)]
        transition-all duration-250
        hover:-translate-y-1 hover:border-softGold/60 hover:shadow-[0_24px_60px_rgba(0,0,0,0.9)]
      "
    >
      {/* Soft gold halo */}
      <div
        className="
          pointer-events-none absolute inset-0 opacity-0
          group-hover:opacity-40 transition-opacity duration-300
        "
      >
        <div className="absolute inset-x-0 -top-10 h-32 bg-[radial-gradient(circle,_rgba(226,197,120,0.25),_transparent_60%)]" />
      </div>

      <div className="relative flex gap-4">
        {/* Left “spine” accent & volume meta */}
        <div className="hidden md:flex flex-col items-center pr-3 border-r border-white/10 mr-3">
          {/* Vertical spine */}
          <div className="h-20 w-[2px] rounded-full bg-gradient-to-b from-softGold/90 via-softGold/40 to-transparent group-hover:from-softGold group-hover:via-softGold/60" />
          {volumeNumber && (
            <div className="mt-3 text-[0.65rem] uppercase tracking-[0.22em] text-softGold/90 text-center">
              Vol. {volumeNumber}
            </div>
          )}
          {displayDate && (
            <div className="mt-1 text-[0.65rem] text-gray-400 text-center">
              {displayDate}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-[0.22em] text-softGold/80">
            <span className="inline-flex items-center gap-1">
              <span className="h-[3px] w-[3px] rounded-full bg-softGold" />
              Canon Volume
            </span>

            {primaryTag && (
              <span className="inline-flex items-center gap-1 rounded-full border border-softGold/30 bg-softGold/5 px-2 py-0.5 text-[0.6rem]">
                {primaryTag}
              </span>
            )}

            {isInnerCircle && (
              <span className="inline-flex items-center gap-1 rounded-full border border-softGold/60 bg-softGold/10 px-2 py-0.5 text-[0.6rem] text-softGold">
                <span>🔒</span> Inner Circle
              </span>
            )}
          </div>

          <h2 className="font-serif text-lg md:text-xl font-semibold text-cream leading-snug line-clamp-2 group-hover:text-softGold transition-colors">
            {primaryLine}
          </h2>

          <p className="text-sm text-gray-300/90 leading-relaxed line-clamp-3">
            {secondaryLine}
          </p>

          {/* Tag + meta row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
            <div className="flex flex-wrap gap-1.5 text-[0.65rem] text-gray-400">
              {tags?.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="
                    rounded-full border border-white/10 bg-white/5
                    px-2 py-[2px] text-[0.65rem]
                  "
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="inline-flex items-center gap-1 text-[0.7rem] text-softGold/90">
              <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                Read Volume
              </span>
              <span className="text-[0.8rem]">↗</span>
            </div>
          </div>
        </div>

        {/* Optional cover thumbnail (if present) */}
        {coverImage && (
          <div className="hidden sm:block flex-shrink-0 ml-3">
            <div
              className="
                h-20 w-14 rounded-lg border border-white/10
                bg-cover bg-center bg-no-repeat
                shadow-lg
              "
              style={{ backgroundImage: `url(${coverImage})` }}
            />
          </div>
        )}
      </div>
    </Link>
  );
}