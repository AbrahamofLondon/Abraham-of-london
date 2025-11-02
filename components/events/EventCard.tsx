// components/events/EventCard.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

/** ──────────────────────────────────────────────────────────────────────────
 * EventCard - UPGRADED
 * - Encapsulated Tag/Resource Pills
 * - Enhanced Accessibility for Resources
 * - Consolidated logic and improved date handling
 * ────────────────────────────────────────────────────────────────────────── */

// --- Type Definitions ---
type ResItem = { href: string; label: string };
type Resources = { downloads?: ResItem[]; reads?: ResItem[] };

type Props = {
  slug: string;
  title: string;
  date: string;
  location?: string;
  description?: string;
  tags?: string[];
  heroImage?: string;
  resources?: Resources | null;
};

// NEW: explicit types so TS knows left/right are allowed
type HeroFit = "cover" | "contain";
type HeroPosition = "top" | "center" | "left" | "right";
type Overrides = {
  heroFit?: HeroFit;
  heroAspect?: "3/1" | "21/9" | "16/9" | "2/3" | "1/1";
  heroPosition?: HeroPosition;
};

// --- Constants & Utilities ---

const DEFAULT_EVENT_IMAGE = "/assets/images/events/default.jpg";
const FALLBACK_CANDIDATES = [DEFAULT_EVENT_IMAGE] as const;

// Normalizes a string slug for comparison and URL generation
const normalizeSlug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

// Helper to ensure relative URLs start with a slash
function normalizeLocal(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return undefined;
  return src.startsWith("/") ? src : `/${src.replace(/^\/+/, "")}`;
}

// Per-event visual overrides (aspect/fit/position)
const HERO_OVERRIDES: Record<string, Overrides> = {
  'leadership-workshop': { heroFit: "contain", heroAspect: "3/1", heroPosition: "top" },
  'founders-salon': { heroFit: "contain", heroAspect: "16/9", heroPosition: "center" },
  // add more slugs here…
};

// Utility to generate the ordered list of candidate image URLs
function generateImageCandidates(slug: string, heroImage?: string): string[] {
  const base = normalizeSlug(slug);

  const candidates = [
    normalizeLocal(heroImage), // 1. Primary image from frontmatter
    `/assets/images/events/${base}.webp`, // 2. Slug-based fallbacks
    `/assets/images/events/${base}.jpg`,
    `/assets/images/events/${base}.jpeg`,
    `/assets/images/events/${base}.png`,
    ...FALLBACK_CANDIDATES, // 3. Absolute default fallback
  ].filter(Boolean) as string[];

  // Filter out duplicates
  return Array.from(new Set(candidates));
}

// Helper to determine Tailwind aspect ratio class
function aspectClass(key?: Overrides["heroAspect"]) {
  switch (key) {
    case "3/1": return "aspect-[3/1]";
    case "21/9": return "aspect-[21/9]";
    case "16/9": return "aspect-[16/9]";
    case "2/3": return "aspect-[2/3]";
    case "1/1": return "aspect-[1/1]";
    default: return "aspect-[16/10]"; // Default if no override/invalid key
  }
}

// --- Sub-Components ---

// Encapsulates the tag and resource pill logic and styling
const TagPill = React.memo(({ label, isLink, href }: { label: string; isLink?: boolean; href?: string }) => {
  const isResource = !!href;
  
  let icon = "";
  if (isResource) {
    if (href?.includes(".pdf")) {
      icon = "📄 "; // Document
    } else if (href?.includes("article") || href?.includes("read")) {
      icon = "📚 "; // Reading material
    } else {
      icon = "🔗 "; // Generic link
    }
  }

  const baseClasses = "rounded-full px-2 py-0.5 text-xs font-medium transition-colors duration-200";
  const content = (
    <span className={clsx(
        baseClasses,
        // Tag styling
        !isResource && "border border-lightGrey bg-warmWhite text-[color:var(--color-on-secondary)]/[0.8]",
        // Resource styling
        isResource && "border border-[color:var(--color-primary)]/[0.2] bg-[color:var(--color-primary)]/[0.05] text-[color:var(--color-primary)] hover:bg-[color:var(--color-primary)]/[0.1]"
    )}>
      {icon}
      {label}
    </span>
  );

  // If it's a resource (link), return a functional anchor tag for accessibility
  if (isLink && href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex">
        {content}
      </a>
    );
  }

  // If it's just a descriptive tag, return the span
  return content;
});
TagPill.displayName = "TagPill";

// --- Main Component ---

export default function EventCard({
  slug,
  title,
  date,
  location,
  description,
  tags,
  heroImage,
  resources,
}: Props) {
  const normalizedSlug = normalizeSlug(slug);
  const ov = HERO_OVERRIDES[normalizedSlug];

  // --- Image Fallback Logic ---
  const candidates = React.useMemo(() => generateImageCandidates(slug, heroImage), [slug, heroImage]);
  const [idx, setIdx] = React.useState(0);
  const currentHeroSrc = candidates[idx];

  const onHeroError = React.useCallback(() => {
    // Advance to the next candidate if available
    if (idx + 1 < candidates.length) {
      setIdx((i) => i + 1);
    }
  }, [candidates.length, idx]);

  // --- Formatting & Date Handling (UPGRADE) ---
  const dt = React.useMemo(() => (date ? new Date(date) : null), [date]);
  const isValidDate = dt && !Number.isNaN(+dt);

  const dateLabel = isValidDate
    // ✅ UPGRADE: Used `Intl.DateTimeFormat` with a consistent options object
    ? new Intl.DateTimeFormat("en-US", { 
        day: "numeric", 
        month: "short", 
        year: "numeric" 
      }).format(dt!)
    : date;

  const allPills = React.useMemo(() => {
    const downloads = resources?.downloads || [];
    const reads = resources?.reads || [];
    // Combine and limit resources to max 4 total (2 downloads + 2 reads)
    return [...downloads.slice(0, 2), ...reads.slice(0, 2)];
  }, [resources]);


  // --- Dynamic Class Generation ---
  const imageClasses = clsx(
    "transition-transform duration-300 group-hover:scale-[1.02]",
    (ov?.heroFit ?? "cover") === "contain" ? "object-contain" : "object-cover",
    {
      "object-top": ov?.heroPosition === "top",
      "object-left": ov?.heroPosition === "left",
      "object-right": ov?.heroPosition === "right",
      "object-center": ov?.heroPosition === "center" || !ov?.heroPosition,
    }
  );

  const frameClasses = clsx(
    "relative w-full overflow-hidden rounded-t-2xl",
    aspectClass(ov?.heroAspect),
    // Ensure padding/background for contain fit or missing image
    ((ov?.heroFit ?? "cover") === "contain" || !currentHeroSrc) && "bg-warmWhite p-2" 
  );

  // Fallback initials for the image container if all sources fail
  const initials = React.useMemo(() => {
    const words = String(title || "").trim().split(/\s+/).slice(0, 3);
    return words.map((w) => w[0]?.toUpperCase() || "").join("") || "E•V";
  }, [title]);

  const detailHref = `/events/${encodeURIComponent(slug)}`;
  // Consolidated Tailwind opacity variables
  const textSecondaryLight = "text-[color:var(--color-on-secondary)]/[0.7]";
  const textSecondaryNormal = "text-[color:var(--color-on-secondary)]/[0.85]";

  return (
    <article className="group rounded-2xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover">
      <Link href={detailHref} prefetch={false} className="block" aria-label={`View event details for: ${title}`}>
        {/* Hero image container */}
        <div className={frameClasses}>
          {currentHeroSrc ? (
            <Image
              src={currentHeroSrc}
              alt={title ? `${title} event illustration` : "Event illustration"}
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className={imageClasses}
              onError={onHeroError}
              priority={false}
              placeholder="blur" // Add placeholder for better loading UX
              blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0EQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=" 
            />
          ) : (
            // Graceful placeholder when all image candidates fail
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[color:var(--color-primary)]/[0.1] to-[color:var(--color-on-secondary)]/[0.1]">
              <span className={clsx("select-none font-serif text-4xl font-semibold", textSecondaryLight)}>
                {initials}
              </span>
            </div>
          )}
        </div>

        <div className="p-5">
          <h3 className="font-serif text-xl font-semibold text-deepCharcoal">{title}</h3>

          {/* Date and Location */}
          <div className={clsx("mt-1 text-sm", textSecondaryLight)}>
            <span>{dateLabel}</span>
            {location && <span className="ml-2">• {location}</span>}
          </div>

          {/* Description */}
          {description && <p className={clsx("mt-3 text-sm line-clamp-3", textSecondaryNormal)}>{description}</p>}

          {/* Resource pills (UPGRADE: uses TagPill component) */}
          {allPills.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {allPills.map((item, index) => (
                <TagPill
                  key={`${item.href}-${index}`}
                  label={item.label}
                  isLink={true}
                  href={item.href}
                />
              ))}
            </div>
          )}

          {/* Tags (UPGRADE: uses TagPill component) */}
          {Array.isArray(tags) && tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {tags.slice(0, 3).map((t, i) => (
                <TagPill
                  key={`${t}-${i}`}
                  label={t}
                />
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}