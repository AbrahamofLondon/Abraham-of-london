// components/Cards/BaseCard.tsx
import * as React from "react";
import Link from "next/link";
import Image from "next/image";
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

function getCardPropsFromDocument(doc: unknown): BaseCardProps {
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
  const linkHref = href || `/${slug}`;
  const displayText = excerpt || description || subtitle || "";
  const displayTags = tags.slice(0, 3);
  const formattedDate = date ? formatDate(date) : "";

  // On-brand fallback for missing cover images
  const cardImage = coverImage || "/assets/images/writing-desk.webp";

  const aClass = aspectClass(coverAspect);
  const oFit = fitClass(coverFit);
  const oPos = positionClass(coverPosition);

  return (
    <Link
      href={linkHref}
      className={`group block rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm transition-all duration-300 hover:border-softGold/30 hover:shadow-[0_8px_30px_rgba(226,197,120,0.15)] ${className}`}
      aria-label={title}
    >
      <article className="relative flex h-full flex-col overflow-hidden">
        {/* Cover Image */}
        <div className={`relative w-full overflow-hidden ${aClass}`}>
          <Image
            src={cardImage}
            alt={title}
            fill
            className={`${oFit} ${oPos} transition-transform duration-500 group-hover:scale-105`}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Optional: add subtle overlay only when contain is used (prevents “dead letterbox”) */}
          {coverFit === "contain" && (
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent"
              aria-hidden="true"
            />
          )}

          {/* Badges Container - Top Left */}
          <div className="absolute left-3 top-3 flex flex-col gap-2">
            {featured && (
              <div className="rounded-full bg-softGold/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-black backdrop-blur-sm">
                Featured
              </div>
            )}
            {isNew && (
              <div className="rounded-full bg-green-600/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
                New
              </div>
            )}
          </div>

          {/* Badges Container - Top Right */}
          <div className="absolute right-3 top-3 flex flex-col gap-2">
            {isLocked && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-700/40 bg-amber-900/30 px-2 py-1 text-[0.65rem] font-semibold text-amber-400/90 backdrop-blur-sm">
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="rounded-full border border-blue-500/30 bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-300 backdrop-blur-sm">
                {category}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col gap-3 p-5">
          {/* Tags & Category Row */}
          {(displayTags.length > 0 || category) && (
            <div className="flex flex-wrap items-center gap-2">
              {category && (
                <span className="rounded-full border border-blue-500/30 bg-blue-900/30 px-3 py-1 text-xs font-semibold text-blue-300">
                  {category}
                </span>
              )}
              {displayTags.map((tag, idx) => (
                <span
                  key={`${tag}-${idx}`}
                  className="rounded-full border border-softGold/20 bg-softGold/10 px-3 py-1 text-xs font-medium text-softGold/90"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Title & Subtitle */}
          <div className="space-y-1">
            <h3 className="font-serif text-xl font-semibold text-cream transition-colors group-hover:text-softGold">
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
          <div className="mt-auto flex items-center justify-between gap-3 pt-3">
            <div className="flex items-center gap-3">
              {formattedDate ? (
                <time className="text-xs text-gray-400">{formattedDate}</time>
              ) : null}

              {readingTime ? (
                <span className="text-xs text-gray-500 before:mr-2 before:content-['•']">
                  {typeof readingTime === "number" ? `${readingTime} min read` : `${readingTime} read`}
                </span>
              ) : null}
            </div>

            {isLocked && lockMessage ? (
              <span className="text-xs italic text-amber-400/80">{lockMessage}</span>
            ) : null}
          </div>
        </div>

        {/* New badge for "text-only" cards fallback */}
        {!coverImage && isNew && (
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-green-600/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
            New
          </div>
        )}
      </article>
    </Link>
  );
};

export default BaseCard;

export function DocumentCard({ document, className = "", href }: DocumentCardProps) {
  const cardProps = getCardPropsFromDocument(document);
  return <BaseCard {...cardProps} className={className} href={href} />;
}

export type { BaseCardProps, DocumentCardProps };