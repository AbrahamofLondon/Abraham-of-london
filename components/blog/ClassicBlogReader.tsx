// components/blog/ClassicBlogReader.tsx
// Individual classic blog post reading layout for /blog/[slug].
// Does NOT affect editorial, books, or editorial-series routes.
//
// Layout order:
//   1. Back nav + read-time chip
//   2. Category · date · tag pill
//   3. Title (serif, large)
//   4. Excerpt / dek
//   5. Compact one-line meta (read time · access · imprint)
//   6. Cover image — restrained width, after header, before body
//   7. Essay body (readable column width)
//   8. TOC sidebar (compact, secondary, sticky)
//   9. Post-body slot (NextStepCTA etc.)

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Clock3,
  Lock,
  Loader2,
  AlertCircle,
} from "lucide-react";

import type { AccessTier } from "@/lib/access/public";
import { getTierLabel } from "@/lib/access/public";
import { SafeTableOfContents } from "@/components/mdx/TableOfContents";
import dynamic from "next/dynamic";

const ClientOnlyMDXRenderer = dynamic(
  () => import("@/components/mdx/ClientOnlyMDXRenderer"),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center py-20">
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/30">
          Loading…
        </span>
      </div>
    ),
  },
);

// ─── Types ───────────────────────────────────────────────────────────────────

type CoverAspect = "wide" | "book" | "square" | "standard" | "auto";
type CoverFit = "cover" | "contain" | "smart";
type CoverPosition =
  | "center" | "top" | "bottom" | "left" | "right"
  | "top left" | "top right" | "bottom left" | "bottom right";

export type ClassicBlogReaderProps = {
  title: string;
  excerpt?: string;
  category?: string;
  date?: string | null;
  tags?: string[];
  readTime?: string | number | null;
  /** Resolved cover URL. Pass null/undefined to suppress the cover. */
  cover?: string | null;
  coverAspect?: CoverAspect | null;
  coverFit?: CoverFit | null;
  coverPosition?: CoverPosition | null;
  backHref: string;
  backLabel?: string;
  imprint?: string;
  requiredTier?: AccessTier;
  loading?: boolean;
  unlockError?: string | null;
  activeCode?: string | null;
  emptyLabel?: string;
  childrenBottom?: React.ReactNode;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(input?: string | null): string {
  if (!input) return "";
  const d = new Date(input);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      });
}

function normalizeReadTime(value?: string | number | null): string | null {
  if (value == null || value === "") return null;
  return String(value);
}

function resolveAspect(aspect?: CoverAspect | null): string {
  switch ((aspect || "auto").toLowerCase()) {
    case "wide":   return "16 / 9";
    case "book":   return "3 / 4";
    case "square": return "1 / 1";
    case "standard": return "4 / 3";
    default:       return "3 / 2";
  }
}

function resolvePosition(pos?: CoverPosition | null): string {
  const n = String(pos || "center").toLowerCase().trim();
  const allowed = new Set([
    "center","top","bottom","left","right",
    "top left","top right","bottom left","bottom right",
  ]);
  return allowed.has(n) ? n : "center";
}

// ─── Cover renderer ───────────────────────────────────────────────────────────

function BlogCoverImage({
  src,
  alt,
  aspect,
  position,
}: {
  src: string;
  alt: string;
  aspect: string;
  position: string;
}) {
  return (
    <div className="mx-auto w-full max-w-[860px]">
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 shadow-[0_20px_80px_-40px_rgba(0,0,0,0.9)]"
        style={{ aspectRatio: aspect }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          priority
          className="object-cover"
          style={{ objectPosition: position }}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 860px"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.04), rgba(0,0,0,0.36))",
          }}
        />
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ClassicBlogReader({
  title,
  excerpt,
  category = "Essay",
  date,
  tags,
  readTime,
  cover,
  coverAspect,
  coverFit: _coverFit,
  coverPosition,
  backHref,
  backLabel = "Back",
  imprint = "Abraham of London",
  requiredTier = "public",
  loading = false,
  unlockError = null,
  activeCode = "",
  emptyLabel = "No essay content available.",
  childrenBottom,
}: ClassicBlogReaderProps) {
  const resolvedReadTime = normalizeReadTime(readTime);
  const formattedDate = formatDate(date);
  const hasCover = !!cover;
  const heroAspect = resolveAspect(coverAspect);
  const heroPosition = resolvePosition(coverPosition);

  const cleanCode = React.useMemo(() => {
    if (!activeCode || typeof activeCode !== "string") return "";
    const trimmed = activeCode.trim();
    if (
      trimmed.length > 500 &&
      (trimmed.includes("Object.create") ||
        trimmed.includes("getOwnPropertyDescriptor") ||
        trimmed.includes("react-dom-client"))
    ) {
      return "";
    }
    return trimmed;
  }, [activeCode]);

  const hasValidContent = cleanCode.length > 30;

  return (
    <div className="min-h-screen bg-[#0e0e11] text-white">

      {/* ── 1. Article header ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden border-b border-white/[0.07] bg-[#0a0a0d]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 18% 0%, rgba(245,158,11,0.09) 0%, transparent 55%), " +
              "linear-gradient(180deg, #09090c 0%, #0e0e11 100%)",
          }}
        />
        <div aria-hidden className="absolute inset-0 aol-grain opacity-[0.08]" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 pb-10 pt-[calc(var(--aol-header-h,88px)+1.5rem)] lg:px-10">

          {/* Back + access chip */}
          <div className="flex items-center justify-between gap-4">
            <Link
              href={backHref}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-white/50 transition hover:bg-white/[0.06] hover:text-white/70"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {backLabel}
            </Link>

            <div className="flex items-center gap-3 font-mono text-[9px] uppercase tracking-[0.34em] text-white/30">
              {requiredTier !== "public" && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-amber-400">
                  <Lock className="h-2.5 w-2.5" /> {getTierLabel(requiredTier)}
                </span>
              )}
              {resolvedReadTime && (
                <span className="inline-flex items-center gap-1.5">
                  <Clock3 className="h-3 w-3" /> {resolvedReadTime}
                </span>
              )}
            </div>
          </div>

          {/* Category · date · tag pill */}
          <div className="mt-8 inline-flex flex-wrap items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.30em] text-white/30">
            {category && <span className="text-amber-200/60">{category}</span>}
            {formattedDate && (
              <>
                <span className="mx-0.5 text-white/15">·</span>
                <span>{formattedDate}</span>
              </>
            )}
            {tags?.[0] && (
              <>
                <span className="mx-0.5 text-white/15">·</span>
                <span>{tags[0]}</span>
              </>
            )}
          </div>

          {/* Title */}
          <h1 className="mt-4 max-w-[22ch] font-serif text-[2.5rem] font-light leading-[1.02] tracking-[-0.03em] text-white md:text-[3.5rem]">
            {title}
          </h1>

          {/* Excerpt / dek */}
          {excerpt && (
            <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-white/52 md:text-[1.05rem]">
              {excerpt}
            </p>
          )}

          {/* Compact one-line meta */}
          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[8.5px] uppercase tracking-[0.28em] text-white/22">
            {resolvedReadTime && <span>{resolvedReadTime}</span>}
            <span className="text-white/12">·</span>
            <span>{getTierLabel(requiredTier)}</span>
            <span className="text-white/12">·</span>
            <span>{imprint}</span>
          </div>
        </div>
      </div>

      {/* ── 2. Cover image — after header, before body ─────────────────── */}
      {hasCover && cover && (
        <div className="border-b border-white/[0.06] bg-[#0a0a0d] px-6 py-8 lg:px-10">
          <BlogCoverImage
            src={cover}
            alt={title}
            aspect={heroAspect}
            position={heroPosition}
          />
        </div>
      )}

      {/* ── 3. Essay body + sidebar ────────────────────────────────────── */}
      <div className="mx-auto max-w-5xl px-6 py-12 lg:px-10">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">

          {/* Body column */}
          <div className="order-2 lg:col-span-8 lg:order-1">
            {unlockError ? (
              <div className="mb-8 flex gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {unlockError}
              </div>
            ) : loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
              </div>
            ) : hasValidContent ? (
              <div className="classic-blog-body">
                <ClientOnlyMDXRenderer
                  code={cleanCode}
                  debug={process.env.NODE_ENV === "development"}
                />
              </div>
            ) : (
              <div className="py-20 text-center font-mono text-xs uppercase tracking-widest text-white/30">
                {emptyLabel}
              </div>
            )}

            {childrenBottom ? (
              <div className="mt-12 border-t border-white/[0.07] pt-10">
                {childrenBottom}
              </div>
            ) : null}

            <div className="mt-10 font-mono text-[8px] uppercase tracking-widest text-white/18">
              {imprint}
            </div>
          </div>

          {/* Sidebar TOC — compact, secondary */}
          {hasValidContent && !loading && !unlockError && (
            <aside className="order-1 lg:col-span-4 lg:order-2">
              <div className="h-fit lg:sticky lg:top-24">
                <div className="rounded-2xl border border-white/[0.07] bg-white/[0.015] p-4">
                  <div className="mb-3 font-mono text-[8.5px] uppercase tracking-[0.34em] text-amber-200/50">
                    On This Page
                  </div>
                  <SafeTableOfContents delayMs={600} />
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* ── Body typography ────────────────────────────────────────────── */}
      <style>{`
        .classic-blog-body {
          color: rgba(255,255,255,0.80);
          font-family: Georgia, "Times New Roman", ui-serif, serif;
          font-size: 19px;
          line-height: 1.80;
        }

        .classic-blog-body .aol-mdx-content {
          color: inherit;
          font-size: inherit;
          line-height: inherit;
        }

        .classic-blog-body .aol-mdx-content p,
        .classic-blog-body .aol-mdx-content li {
          margin-bottom: 1.65rem;
          color: rgba(255,255,255,0.78);
          font-family: Georgia, "Times New Roman", ui-serif, serif;
          font-size: inherit;
          line-height: inherit;
        }

        .classic-blog-body .aol-mdx-content > p:first-of-type {
          color: rgba(255,255,255,0.90);
          font-size: 20px;
        }

        .classic-blog-body .aol-mdx-content > p:last-of-type {
          margin-top: 2.75rem;
          margin-bottom: 0;
        }

        .classic-blog-body .aol-mdx-content h2 {
          margin: 3rem 0 1.25rem;
          color: rgba(255,255,255,0.92);
          font-family: Georgia, "Times New Roman", ui-serif, serif;
          font-size: clamp(1.35rem, 2.2vw, 1.65rem);
          font-weight: 600;
          letter-spacing: -0.01em;
          line-height: 1.25;
          border: 0;
          text-transform: none;
        }

        .classic-blog-body .aol-mdx-content h3 {
          margin: 2.5rem 0 1rem;
          color: rgba(255,255,255,0.88);
          font-family: Georgia, "Times New Roman", ui-serif, serif;
          font-size: clamp(1.15rem, 1.8vw, 1.35rem);
          font-weight: 600;
          letter-spacing: -0.005em;
          line-height: 1.3;
          border: 0;
          text-transform: none;
        }

        .classic-blog-body .aol-mdx-content blockquote {
          margin: 2.75rem 0;
          border-left: 2px solid rgba(201,150,58,0.32);
          padding: 0.2rem 0 0.2rem 1.5rem;
          color: rgba(255,255,255,0.75);
          font-style: italic;
          font-size: clamp(1.05rem, 1.8vw, 1.2rem);
          line-height: 1.6;
        }

        .classic-blog-body .aol-mdx-content hr {
          margin: 3.25rem 0 2rem;
          border: 0;
          border-top: 1px solid rgba(255,255,255,0.10);
        }

        .classic-blog-body .aol-mdx-content a {
          color: #c9963a;
          text-decoration: underline;
          text-decoration-color: rgba(201,150,58,0.35);
          text-underline-offset: 0.22em;
        }

        .classic-blog-body .aol-mdx-content strong {
          color: rgba(255,255,255,0.92);
          font-weight: 600;
        }

        .classic-blog-body .aol-mdx-content code {
          font-family: "JetBrains Mono", ui-monospace, monospace;
          font-size: 0.82em;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 3px;
          padding: 0.1em 0.4em;
          color: rgba(255,255,255,0.80);
        }

        @media (max-width: 640px) {
          .classic-blog-body {
            font-size: 18px;
            line-height: 1.73;
          }

          .classic-blog-body .aol-mdx-content > p:first-of-type {
            font-size: 19px;
          }
        }
      `}</style>
    </div>
  );
}
