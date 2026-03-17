/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ShortCard.tsx

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Heart, Bookmark, Eye } from "lucide-react";

type ShortCardModel = {
  slug: string;
  title: string;
  excerpt: string;
  category?: string | null;
  readTime?: string | null;
  views?: number;
  intensity?: 1 | 2 | 3 | 4 | 5;
  lineage?: string | null;
  coverImage?: string | null;
  metrics?: {
    likes?: number;
    saves?: number;
    views?: number;
  };
  state?: {
    liked?: boolean;
    saved?: boolean;
  };
};

function safeNumber(n: unknown, fallback = 0) {
  const x = typeof n === "number" ? n : Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function safeString(v: unknown) {
  return typeof v === "string" ? v : "";
}

function normalizeCardSlug(slug: unknown) {
  return safeString(slug)
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^shorts\//, "");
}

function intensityLabel(i?: number) {
  const v = safeNumber(i, 3);
  if (v <= 2) return "quiet";
  if (v === 3) return "steel";
  if (v === 4) return "edge";
  return "fire";
}

function formatCompact(n: number) {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
}

export default function ShortCard({
  short,
  onClick,
}: {
  short: ShortCardModel;
  onClick?: () => void;
}) {
  const routeSlug = normalizeCardSlug(short.slug);
  const href = `/shorts/${routeSlug}`;
  const hasCover = !!safeString(short.coverImage);

  const tagA = safeString(short.category || "Intel").toUpperCase();
  const tagB = safeString(short.readTime || "2 min");
  const power = intensityLabel(short.intensity);

  const likes = safeNumber(short.metrics?.likes, 0);
  const saves = safeNumber(short.metrics?.saves, 0);
  const views = safeNumber(short.metrics?.views ?? short.views, 0);

  const showUtilities = likes > 0 || saves > 0 || views > 0;

  return (
    <Link
      href={href}
      onClick={onClick}
      className="group block no-underline hover:no-underline focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/20"
    >
      <article className="relative flex flex-col border-l border-white/[0.08] py-5 pl-6 transition-all duration-500 hover:border-amber-500/25 hover:pl-7">

        {/* Elegant background treatment on hover */}
        <div className="absolute inset-y-0 left-0 w-0 bg-gradient-to-r from-amber-500/[0.02] to-transparent opacity-0 transition-all duration-700 group-hover:w-full group-hover:opacity-100 pointer-events-none" />

        {/* Meta row — same tokens as FeaturedNoteCard */}
        <div className="relative flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-wider text-amber-300/60">
              {tagA}
            </span>
            <span className="text-white/15">•</span>
            <span className="font-mono text-[9px] text-white/30">
              {tagB}
            </span>
            <span className="relative ml-1 font-mono text-[8px] uppercase tracking-[0.14em] text-white/20 before:absolute before:-inset-1 before:rounded-full before:bg-amber-500/5 before:opacity-0 before:transition-opacity group-hover:before:opacity-100">
              {power}
            </span>
          </div>
          <div className="relative">
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/18 transition-all duration-500 group-hover:text-amber-300/60 group-hover:translate-x-px group-hover:-translate-y-px" />
            {/* Subtle glow on arrow */}
            <div className="absolute inset-0 blur-[2px] bg-amber-500/0 group-hover:bg-amber-500/20 rounded-full transition-all duration-700" />
          </div>
        </div>

        {/* Cover image — restrained, with elegant overlay */}
        {hasCover && (
          <div className="relative mt-4 overflow-hidden rounded-sm" style={{ aspectRatio: "16 / 9" }}>
            <Image
              src={short.coverImage as string}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 480px"
              className="object-cover brightness-[0.75] saturate-[0.80] contrast-[1.03] transition-all duration-700 group-hover:brightness-[0.88] group-hover:scale-[1.02]"
              priority={false}
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
            />
            {/* Thin border accent */}
            <div className="absolute inset-0 border border-white/5 group-hover:border-amber-500/20 transition-colors duration-700" />
            
            {/* Subtle corner detail */}
            <div className="absolute top-2 right-2 h-6 w-6 border-r border-t border-white/5 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
          </div>
        )}

        {/* Title — with elegant underline on hover */}
        <h3
          className={[
            hasCover ? "mt-4" : "mt-3",
            "relative font-serif text-base leading-snug text-white/85",
            "transition-colors duration-500 group-hover:text-white",
          ].join(" ")}
        >
          {short.title}
          <span className="absolute -bottom-0.5 left-0 h-px w-0 bg-gradient-to-r from-amber-500/40 to-transparent transition-all duration-700 group-hover:w-8" />
        </h3>

        {/* Excerpt — matches featured card style */}
        <p className="relative mt-2 line-clamp-2 text-sm leading-relaxed text-white/40 transition-colors duration-500 group-hover:text-white/52">
          {short.excerpt}
        </p>

        {/* Utilities — toned to match the system */}
        {showUtilities && (
          <div className="relative mt-4 flex items-center gap-4 border-t border-white/[0.05] pt-3">
            <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/28 transition-colors group-hover:text-white/35">
              <Eye className="h-3 w-3 text-white/18 transition-colors group-hover:text-amber-300/40" />
              {formatCompact(views)}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/28 transition-colors group-hover:text-white/35">
              <Heart
                className={[
                  "h-3 w-3 transition-colors",
                  short.state?.liked ? "text-amber-300/60" : "text-white/18 group-hover:text-amber-300/30",
                ].join(" ")}
              />
              {formatCompact(likes)}
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-white/28 transition-colors group-hover:text-white/35">
              <Bookmark
                className={[
                  "h-3 w-3 transition-colors",
                  short.state?.saved ? "text-amber-300/60" : "text-white/18 group-hover:text-amber-300/30",
                ].join(" ")}
              />
              {formatCompact(saves)}
            </span>
          </div>
        )}

        {/* Lineage footer — with refined treatment */}
        <div className={[showUtilities ? "mt-3" : "mt-4", "relative flex items-center gap-2"].join(" ")}>
          <span className="h-px w-5 bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent transition-all duration-700 group-hover:w-6 group-hover:from-amber-500/40" />
          <span className="font-mono text-[8px] uppercase tracking-[0.24em] text-white/18 transition-colors group-hover:text-white/25">
            {short.lineage ? short.lineage.replace(/\s+/g, "·") : "Archive"}
          </span>
        </div>

        {/* Subtle bottom edge treatment */}
        <div className="absolute bottom-0 right-0 h-px w-0 bg-gradient-to-l from-amber-500/20 via-amber-500/10 to-transparent transition-all duration-1000 group-hover:w-12" />

      </article>
    </Link>
  );
}