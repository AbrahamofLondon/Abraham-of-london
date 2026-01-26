import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { safeSlice } from "@/lib/utils/safe";
import type {
  BaseCardProps,
  DocumentCardProps,
  CoverAspect,
  CoverFit,
  CoverPosition,
} from "./types";

// =============================================================================
// SAFE HELPERS (avoid `any` + keep logic local)
// =============================================================================

type AnyRecord = Record<string, unknown>;

function isRecord(v: unknown): v is AnyRecord {
  return typeof v === "object" && v !== null;
}

function asString(v: unknown): string | null {
  return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is string => typeof x === "string" && x.trim().length > 0);
}

function asBool(v: unknown): boolean {
  return v === true;
}

function asCoverAspect(v: unknown): CoverAspect | null {
  const s = asString(v);
  if (s === "wide" || s === "square" || s === "book") return s;
  return null;
}

function asCoverFit(v: unknown): CoverFit | null {
  const s = asString(v)?.toLowerCase();
  // tolerate legacy "fit"
  if (s === "fit") return "contain";
  if (s === "cover" || s === "contain") return s;
  return null;
}

function asCoverPosition(v: unknown): CoverPosition | null {
  const s = asString(v);
  if (s === "center" || s === "top" || s === "bottom" || s === "left" || s === "right")
    return s;
  return null;
}

function aspectClass(aspect?: CoverAspect | null): string {
  switch (aspect) {
    case "book":
      return "aspect-[3/4]";
    case "square":
      return "aspect-square";
    case "wide":
    default:
      return "aspect-[16/9]";
  }
}

function fitClass(fit?: CoverFit | null): string {
  return fit === "contain" ? "object-contain" : "object-cover";
}

function positionClass(pos?: CoverPosition | null): string {
  switch ((pos || "center").toLowerCase()) {
    case "top":
      return "object-top";
    case "bottom":
      return "object-bottom";
    case "left":
      return "object-left";
    case "right":
      return "object-right";
    default:
      return "object-center";
  }
}

// Local date formatter (kept here to avoid circular imports)
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-GB", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

// =============================================================================
// DOC -> CARD PROPS (no `any`)
// =============================================================================

function getCardPropsFromDocument(doc: unknown): Omit<BaseCardProps, 'href' | 'className'> {
  if (!isRecord(doc)) {
    return { slug: "", title: "Untitled" };
  }

  return {
    slug: asString(doc.slug) ?? "",
    title: asString(doc.title) ?? "Untitled",
    subtitle: asString(doc.subtitle),
    excerpt: asString(doc.excerpt),
    description: asString(doc.description),
    coverImage: asString(doc.coverImage),
    date: asString(doc.date),
    tags: asStringArray(doc.tags),
    featured: asBool(doc.featured),

    // ✅ NEW: pass through cover controls
    coverAspect: asCoverAspect(doc.coverAspect),
    coverFit: asCoverFit(doc.coverFit),
    coverPosition: asCoverPosition(doc.coverPosition),

    accessLevel: (asString(doc.accessLevel) as BaseCardProps["accessLevel"]) ?? null,
    lockMessage: asString(doc.lockMessage),
    category: asString(doc.category),
    readingTime: (asString(doc.readingTime) ??
      (typeof doc.readingTime === "number" ? String(doc.readingTime) : null)) as
      | string
      | null,
    isNew: asBool(doc.isNew),
  };
}

// =============================================================================
// COMPONENT - MAIN BASE CARD
// =============================================================================

const BaseCard: React.FC<BaseCardProps> = ({
  slug,
  title,
  subtitle,
  excerpt,
  description,
  coverImage,
  coverAspect = null,
  coverFit = null,
  coverPosition = null,
  date,
  tags = [],
  featured = false,
  accessLevel,
  lockMessage,
  category,
  readingTime,
  isNew = false,
  className = "",
  href,
}) => {
  const isLocked = accessLevel === "inner-circle" || accessLevel === "premium";
  
  // Always ensure href is a valid string with fallback
  const linkHref = href || `/${slug}`;
  const safeHref = linkHref.trim() === "" ? "/" : linkHref;
  
  const displayText = excerpt || description || subtitle || "";
  
  // FIX: Ensure tags is treated as an array even if passed as null
  const safeTags = Array.isArray(tags) ? tags : [];
  const displayTags = safeSlice(safeTags, 0, 3);
  
  const formattedDate = date ? formatDate(date) : "";

  // On-brand fallback for missing cover images
  const cardImage = coverImage || "/assets/images/writing-desk.webp";

  const aClass = aspectClass(coverAspect);
  const oFit = fitClass(coverFit);
  const oPos = positionClass(coverPosition);

  return (
    <Link
      href={safeHref}
      className={`group block rounded-2xl border border-white/10 bg-gradient-to-br from-black/50 to-gray-900/60 backdrop-blur-xl transition-all duration-500 hover:border-softGold/40 hover:shadow-[0_20px_60px_rgba(226,197,120,0.15)] hover:shadow-softGold/20 ${className}`}
      aria-label={title}
    >
      <article className="relative flex h-full flex-col overflow-hidden">
        {/* Premium glow effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-softGold/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        
        {/* Cover Image */}
        <div className={`relative w-full overflow-hidden ${aClass}`}>
          {/* Image overlay gradient */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          <Image
            src={cardImage}
            alt={title}
            fill
            className={`${oFit} ${oPos} transition-all duration-700 group-hover:scale-105 group-hover:brightness-110`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Optional: add subtle overlay only when contain is used (prevents "dead letterbox") */}
          {coverFit === "contain" && (
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"
              aria-hidden="true"
            />
          )}

          {/* Badges Container - Top Left */}
          <div className="absolute left-4 top-4 z-20 flex flex-col gap-2">
            {featured && (
              <div className="rounded-full border border-softGold/40 bg-gradient-to-r from-softGold/30 to-amber-500/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-softGold backdrop-blur-xl transition-all duration-500 group-hover:from-softGold/40 group-hover:to-amber-500/40">
                Featured
              </div>
            )}
            {isNew && (
              <div className="rounded-full border border-emerald-500/40 bg-gradient-to-r from-emerald-600/30 to-emerald-500/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-300 backdrop-blur-xl transition-all duration-500 group-hover:from-emerald-600/40 group-hover:to-emerald-500/40">
                New
              </div>
            )}
          </div>

          {/* Badges Container - Top Right */}
          <div className="absolute right-4 top-4 z-20 flex flex-col gap-2">
            {isLocked && (
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-gradient-to-r from-amber-900/30 to-amber-800/30 px-3 py-1.5 text-[0.7rem] font-semibold text-amber-300/95 backdrop-blur-xl transition-all duration-500 group-hover:border-amber-400/60 group-hover:from-amber-900/40 group-hover:to-amber-800/40">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Inner Circle
              </div>
            )}
            {category && (
              <div className="rounded-full border border-blue-500/40 bg-gradient-to-r from-blue-900/30 to-blue-800/30 px-3.5 py-1.5 text-xs font-semibold text-blue-300 backdrop-blur-xl transition-all duration-500 group-hover:border-blue-400/60">
                {category}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="relative flex flex-1 flex-col gap-4 p-6">
          {/* Tags & Category Row */}
          {(displayTags.length > 0 || category) && (
            <div className="flex flex-wrap items-center gap-2">
              {displayTags.map((tag, idx) => (
                <span
                  key={`${tag}-${idx}`}
                  className="rounded-full border border-softGold/30 bg-gradient-to-r from-softGold/15 to-transparent px-3 py-1.5 text-xs font-medium text-softGold/95 backdrop-blur-sm transition-all duration-300 hover:border-softGold/50 hover:from-softGold/25"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title & Subtitle */}
          <div className="space-y-2">
            <h3 className="font-serif text-xl font-semibold text-cream transition-colors duration-300 group-hover:text-softGold">
              {title}
            </h3>
            {subtitle ? (
              <p className="text-sm font-medium text-gray-400">{subtitle}</p>
            ) : null}
          </div>

          {/* Excerpt/Description */}
          {displayText ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-gray-300">
              {displayText}
            </p>
          ) : null}

          {/* Footer */}
          <div className="mt-auto flex items-center justify-between gap-3 pt-4 border-t border-white/10">
            <div className="flex items-center gap-4">
              {formattedDate ? (
                <time className="text-xs font-medium text-gray-400">{formattedDate}</time>
              ) : null}

              {readingTime ? (
                <span className="text-xs font-medium text-gray-500 before:mr-2 before:content-['•']">
                  {typeof readingTime === "number" ? `${readingTime} min read` : `${readingTime} read`}
                </span>
              ) : null}
            </div>

            {/* Premium arrow indicator */}
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-softGold/10 to-softGold/5 text-softGold transition-all duration-500 group-hover:from-softGold/20 group-hover:to-softGold/10 group-hover:scale-110">
              <svg
                className="h-3.5 w-3.5 transition-transform duration-500 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </div>
          </div>

          {/* Lock message if present */}
          {isLocked && lockMessage ? (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-amber-500/30 bg-gradient-to-r from-amber-900/40 to-amber-800/40 px-4 py-1.5 text-xs font-medium text-amber-300/95 backdrop-blur-xl">
              {lockMessage}
            </div>
          ) : null}
        </div>

        {/* New badge for "text-only" cards fallback */}
        {!coverImage && isNew && (
          <div className="pointer-events-none absolute bottom-4 right-4 rounded-full border border-emerald-500/40 bg-gradient-to-r from-emerald-600/40 to-emerald-500/40 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-emerald-100 backdrop-blur-xl">
            New
          </div>
        )}

        {/* Bottom accent line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-softGold/30 to-transparent opacity-0 transition-opacity duration-700 group-hover:opacity-100"
          aria-hidden="true"
        />
      </article>
    </Link>
  );
};

export default BaseCard;

export function DocumentCard({ document, className = "", href }: DocumentCardProps) {
  const cardProps = getCardPropsFromDocument(document);
  
  // Ensure href is always a string - use provided href or fallback to slug-based URL
  const resolvedHref = href || `/${cardProps.slug}`;
  
  return <BaseCard {...cardProps} className={className} href={resolvedHref} />;
}

export type { BaseCardProps, DocumentCardProps };