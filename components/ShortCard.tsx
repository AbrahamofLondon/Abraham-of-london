/* eslint-disable @typescript-eslint/no-explicit-any */
// components/ShortCard.tsx — HOUSE TYPEFINISH + QUIET UTILITIES (12/10)

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

  /** Optional: your utilities layer (likes/saves/etc) */
  metrics?: {
    likes?: number;
    saves?: number;
    views?: number; // can override views
  };

  /** Optional: whether the viewer has liked/saved (for subtle state) */
  state?: {
    liked?: boolean;
    saved?: boolean;
  };
};

function safeNumber(n: unknown, fallback = 0) {
  const x = typeof n === "number" ? n : Number(n);
  return Number.isFinite(x) ? x : fallback;
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
  const href = `/shorts/${short.slug}`;
  const hasCover = !!short.coverImage;

  const tagA = (short.category || "Intel").toUpperCase();
  const tagB = short.readTime || "2 min";
  const power = intensityLabel(short.intensity);

  const likes = safeNumber(short.metrics?.likes, 0);
  const saves = safeNumber(short.metrics?.saves, 0);
  const views = safeNumber(short.metrics?.views ?? short.views, 0);

  const showUtilities = likes > 0 || saves > 0 || views > 0;

  return (
    <Link
      href={href}
      onClick={onClick}
      className="group block no-underline hover:no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/30 focus-visible:ring-offset-0"
    >
      <article
        className={[
          "relative overflow-hidden rounded-2xl",
          "bg-black/70 backdrop-blur-md",
          "border border-white/[0.06]",
          "shadow-[0_18px_70px_-55px_rgba(0,0,0,0.85)]",
          "transition-all duration-700",
          "hover:-translate-y-[1px]",
          "hover:border-amber-500/18",
          "hover:shadow-[0_34px_120px_-70px_rgba(245,158,11,0.22)]",
        ].join(" ")}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[1px] rounded-2xl"
          style={{
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,0.06), inset 0 -1px 0 rgba(0,0,0,0.72), inset 0 0 0 1px rgba(255,255,255,0.02)",
          }}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(1200px 380px at 20% 0%, rgba(245,158,11,0.06), transparent 55%), radial-gradient(900px 320px at 100% 10%, rgba(255,255,255,0.04), transparent 55%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.28) 55%, rgba(0,0,0,0.55))",
          }}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.02] mix-blend-soft-light"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 220 220' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E")`,
          }}
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700"
        >
          <div className="absolute -inset-x-24 -top-24 h-52 rotate-12 bg-white/[0.05] blur-2xl" />
        </div>

        <div className="relative p-5">
          {/* META ROW */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[10px] font-mono tracking-[0.22em] text-amber-300/60">
                {tagA}
              </span>
              <span className="text-white/10 text-xs">•</span>
              <span className="text-[10px] font-mono tracking-[0.18em] text-white/32">
                {tagB}
              </span>

              <span className="ml-1 text-[9px] px-2 py-[2px] rounded-full border border-white/[0.08] bg-black/35 text-amber-200/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                {power}
              </span>
            </div>

            <ArrowUpRight className="h-4 w-4 text-amber-700/40 group-hover:text-amber-300/85 transition-colors duration-300" />
          </div>

          {/* COVER */}
          {hasCover && (
            <div className="mt-4">
              <div className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-black/40">
                <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
                  <Image
                    src={short.coverImage as string}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 520px"
                    className="object-cover brightness-[0.90] saturate-[0.92] contrast-[1.02] group-hover:brightness-[0.98] group-hover:saturate-[0.98] transition-all duration-1000 group-hover:scale-[1.02]"
                    priority={false}
                  />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/18 to-transparent" />
                  <div
                    aria-hidden
                    className="absolute inset-0 opacity-35 mix-blend-screen"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.00) 36%, rgba(255,255,255,0.07) 68%, rgba(255,255,255,0.00) 100%)",
                    }}
                  />
                  <div
                    aria-hidden
                    className="absolute inset-0 rounded-xl"
                    style={{
                      boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.05), inset 0 -1px 0 rgba(0,0,0,0.65)",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TITLE */}
          <h3
            className={[
              "mt-4 font-serif",
              "text-[22px] md:text-[26px]",
              "leading-[1.14] tracking-[-0.015em] antialiased",
              "text-amber-50/95 group-hover:text-amber-50",
              "no-underline decoration-transparent",
            ].join(" ")}
          >
            {short.title}
          </h3>

          {/* EXCERPT */}
          <p
            className={[
              "mt-2",
              "text-[13px] leading-[1.55]",
              "text-white/52 group-hover:text-white/58",
              "transition-colors duration-700",
              "line-clamp-2",
              "no-underline decoration-transparent",
            ].join(" ")}
          >
            {short.excerpt}
          </p>

          {/* UTILITIES (quiet) */}
          {showUtilities && (
            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-black/35 px-4 py-3">
              <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-[0.22em] text-white/40">
                <span className="inline-flex items-center gap-2">
                  <Eye className="h-3.5 w-3.5 text-white/25" />
                  {formatCompact(views)}
                </span>

                <span className="inline-flex items-center gap-2">
                  <Heart className={["h-3.5 w-3.5", short.state?.liked ? "text-amber-300/80" : "text-white/25"].join(" ")} />
                  {formatCompact(likes)}
                </span>

                <span className="inline-flex items-center gap-2">
                  <Bookmark className={["h-3.5 w-3.5", short.state?.saved ? "text-amber-300/80" : "text-white/25"].join(" ")} />
                  {formatCompact(saves)}
                </span>
              </div>

              <span className="text-[9px] font-mono tracking-[0.26em] text-white/22 group-hover:text-amber-300/60 transition-colors duration-700 uppercase">
                open
              </span>
            </div>
          )}

          {/* FOOTER */}
          <div className="mt-5 flex items-center justify-between pt-3 border-t border-white/[0.06]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-7 h-[1px] bg-gradient-to-r from-amber-600/45 to-transparent" />
              <span className="text-[9px] font-mono tracking-[0.22em] text-white/26 uppercase truncate">
                {short.lineage ? short.lineage.replace(/\s+/g, "·") : "ARCHIVE"}
              </span>
            </div>

            <span className="text-[9px] font-mono tracking-[0.26em] text-white/22 group-hover:text-amber-300/65 transition-colors duration-700 uppercase">
              indexed
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}