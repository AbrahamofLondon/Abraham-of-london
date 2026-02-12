'use client';

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { BookOpen, Lock, Calendar, Tag, Volume2, ChevronRight } from "lucide-react";

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
    variant?: "grid" | "list";
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
export default function CanonCard({ canon }: CanonCardProps) {
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
  const isFeatured = featured === true;

  const displayDate =
    date && !Number.isNaN(new Date(date).getTime())
      ? new Date(date).toLocaleDateString("en-GB", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      : null;

  // Safe tags: ensure array, filter strings, slice first 3
  const safeTags = React.useMemo(() => {
    if (!Array.isArray(tags)) return [];
    return tags
      .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
      .slice(0, 3);
  }, [tags]);

  const primaryTag = safeTags[0] || (isFeatured ? "Featured" : null);

  return (
    <Link
      href={`/canon/${slug}`}
      className="group relative flex h-full w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-black via-zinc-950 to-black p-6 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-2xl hover:shadow-amber-900/20"
    >
      {/* Animated background glow */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
        <div className="absolute inset-x-0 -top-20 h-40 bg-[radial-gradient(50%_50%_at_50%_50%,rgba(245,158,11,0.12),transparent)]" />
      </div>

      <div className="relative flex w-full flex-col gap-5 sm:flex-row">
        {/* --- LEFT: SPINE ACCENT (desktop only) --- */}
        <div className="hidden sm:flex sm:flex-col sm:items-center sm:pr-4 sm:border-r sm:border-white/10">
          <div className="h-20 w-0.5 rounded-full bg-gradient-to-b from-amber-400/80 via-amber-400/40 to-transparent transition-all duration-300 group-hover:from-amber-400 group-hover:via-amber-400/60" />
          {volumeNumber && (
            <div className="mt-3 flex flex-col items-center gap-1">
              <Volume2 className="h-3.5 w-3.5 text-amber-400/70" />
              <span className="text-[0.65rem] font-mono font-medium uppercase tracking-wider text-amber-400/80">
                Vol. {volumeNumber}
              </span>
            </div>
          )}
          {displayDate && (
            <div className="mt-2 flex flex-col items-center gap-1">
              <Calendar className="h-3 w-3 text-zinc-500" />
              <span className="text-[0.6rem] font-mono text-zinc-500">
                {displayDate}
              </span>
            </div>
          )}
        </div>

        {/* --- RIGHT: MAIN CONTENT --- */}
        <div className="flex flex-1 flex-col space-y-4">
          {/* Badge row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-amber-400">
              <BookOpen className="h-3.5 w-3.5" />
              Canon
            </span>

            {primaryTag && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1 text-[0.65rem] font-medium uppercase tracking-wider text-amber-300">
                <Tag className="h-3 w-3" />
                {primaryTag}
              </span>
            )}

            {isInnerCircle && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-amber-400">
                <Lock className="h-3 w-3" />
                Inner Circle
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="font-serif text-xl font-semibold leading-tight text-white transition-colors duration-200 group-hover:text-amber-400 md:text-2xl">
            {primaryLine}
          </h3>

          {/* Description */}
          <p className="text-sm leading-relaxed text-zinc-400 line-clamp-3 md:text-base">
            {secondaryLine}
          </p>

          {/* Tags row (mobile-friendly) */}
          {safeTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {safeTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[0.65rem] font-medium text-zinc-300 transition-colors hover:border-amber-500/30 hover:bg-amber-500/10"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Read more link (always visible, refined) */}
          <div className="flex items-center justify-between pt-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 transition-all group-hover:gap-2.5">
              Read Volume
              <ChevronRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
            </span>

            {/* Mobile metadata (visible only on small screens) */}
            <div className="flex items-center gap-3 text-[0.65rem] text-zinc-500 sm:hidden">
              {volumeNumber && <span>Vol. {volumeNumber}</span>}
              {displayDate && <span>{displayDate}</span>}
            </div>
          </div>
        </div>

        {/* --- COVER IMAGE (if present) --- */}
        {coverImage && (
          <div className="relative mt-2 h-24 w-16 flex-shrink-0 overflow-hidden rounded-lg border border-white/10 shadow-lg transition-transform duration-300 group-hover:scale-105 sm:mt-0 sm:h-28 sm:w-20">
            <Image
              src={coverImage}
              alt={primaryLine}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 64px, 80px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
        )}
      </div>
    </Link>
  );
}