// components/events/EventCard.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx"; // Added for cleaner class construction

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

// --- Utilities ---

const DEFAULT_EVENT_IMAGE = "/assets/images/events/default.jpg";

// Normalizes a string slug for comparison
const normalizeSlug = (s: string) => 
  s.toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

// Per-event visual overrides (aspect/fit/position)
const HERO_OVERRIDES = {
  "leadership-workshop": { heroFit: "contain", heroAspect: "3/1", heroPosition: "top" },
  "founders-salon": { heroFit: "contain", heroAspect: "16/9", heroPosition: "center" },
  // add more slugs here…
} as const;

// Utility to generate the ordered list of candidate image URLs
function generateImageCandidates(slug: string, heroImage?: string): string[] {
  const base = normalizeSlug(slug);
  
  const candidates: string[] = [];

  // 1. Primary image from frontmatter (if provided and valid)
  if (heroImage && heroImage.trim() !== "") {
    // If it's a relative path, ensure it starts with a slash
    const finalHeroImage = /^https?:\/\//i.test(heroImage) || heroImage.startsWith('/') 
      ? heroImage 
      : `/${heroImage}`;
    candidates.push(finalHeroImage);
  }

  // 2. Slug-based fallbacks (standard naming convention)
  candidates.push(
    `/assets/images/events/${base}.webp`,
    `/assets/images/events/${base}.jpg`,
    `/assets/images/events/${base}.jpeg`,
    `/assets/images/events/${base}.png`
  );

  // 3. Absolute default fallback (always last)
  candidates.push(DEFAULT_EVENT_IMAGE);

  // Filter out duplicates and invalid entries (e.g., if heroImage was empty)
  return Array.from(new Set(candidates)).filter(url => url.includes('/'));
}

// Helper to determine Tailwind aspect ratio class
function aspectClass(key?: string) {
  switch (key) {
    case "3/1": return "aspect-[3/1]";
    case "21/9": return "aspect-[21/9]";
    case "16/9": return "aspect-[16/9]";
    case "2/3": return "aspect-[2/3]";
    default: return "aspect-[16/10]";
  }
}

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
  const ov = HERO_OVERRIDES[normalizedSlug as keyof typeof HERO_OVERRIDES];

  // Memoize the candidate list based on slug and frontmatter image
  const candidates = React.useMemo(() => 
    generateImageCandidates(slug, heroImage), 
    [slug, heroImage]
  );

  // State to track the currently displayed image index (for fallback)
  const [idx, setIdx] = React.useState(0);
  const currentHeroSrc = candidates[idx];

  // Callback to advance to the next candidate on image load failure
  const onHeroError = React.useCallback(() => {
    // Only increment if there is a next candidate AND the current candidate is not the final default
    if (idx + 1 < candidates.length) {
      setIdx((i) => i + 1);
    }
  }, [candidates.length, idx]);

  // --- Formatting ---
  const dt = date ? new Date(date) : null;
  const dateLabel =
    dt && !Number.isNaN(+dt)
      ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(dt)
      : date;

  const pillDownloads = resources?.downloads || [];
  const pillReads = resources?.reads || [];

  // --- Dynamic Class Generation ---
  const imageClasses = clsx(
    "transition-transform duration-300 group-hover:scale-[1.02]", // Added hover effect
    {
      "object-contain": ov?.heroFit?.toLowerCase() === "contain",
      "object-cover": ov?.heroFit?.toLowerCase() !== "contain",
    },
    {
      "object-top": ov?.heroPosition?.toLowerCase() === "top",
      "object-left": ov?.heroPosition?.toLowerCase() === "left",
      "object-right": ov?.heroPosition?.toLowerCase() === "right",
      "object-center": ov?.heroPosition?.toLowerCase() === "center" || !ov?.heroPosition,
    }
  );
  
  // Ensure slug is properly encoded for the URL
  const detailHref = `/events/${encodeURIComponent(slug)}`;

  return (
    <article className="group rounded-2xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover">
      <Link href={detailHref} prefetch={false} className="block">
        {/* Hero image container */}
        <div 
          className={clsx(
            "relative w-full overflow-hidden rounded-t-2xl bg-warmWhite p-2",
            aspectClass(ov?.heroAspect)
          )}
        >
          {/* Only render Image component if a candidate source is available */}
          {currentHeroSrc && (
            <Image 
              src={currentHeroSrc} 
              alt={title ? `${title} event illustration` : "Event illustration"} 
              fill 
              sizes="(max-width: 768px) 100vw, 33vw" 
              className={imageClasses} 
              onError={onHeroError} 
            />
          )}
        </div>

        <div className="p-5">
          <h3 className="font-serif text-xl font-semibold text-deepCharcoal">{title}</h3>
          <div className="mt-1 text-sm text-[color:var(--color-on-secondary)/0.7]">
            <span>{dateLabel}</span>
            {location && <span className="ml-2">• {location}</span>}
          </div>
          {description && <p className="mt-3 text-sm text-[color:var(--color-on-secondary)/0.85] line-clamp-3">{description}</p>}

          {/* Resource pills */}
          {(pillDownloads.length > 0 || pillReads.length > 0) && (
            <div className="mt-4 flex flex-wrap gap-2">
              {[...pillDownloads.slice(0, 2), ...pillReads.slice(0, 2)].map((item, index) => (
                <span 
                  key={`${item.href}-${index}`} 
                  className="inline-flex rounded-full border border-lightGrey px-2 py-0.5 text-xs text-[color:var(--color-on-secondary)/0.7]"
                >
                  {item.href.includes(".pdf") ? "📄 " : item.href.includes("article") ? "📚 " : ""} 
                  {item.label}
                </span>
              ))}
            </div>
          )}

          {/* tags */}
          {Array.isArray(tags) && tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              {tags.slice(0, 3).map((t, i) => (
                <span key={`${t}-${i}`} className="rounded border border-lightGrey bg-warmWhite px-2 py-0.5 text-xs text-[color:var(--color-on-secondary)/0.7]">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </Link>
    </article>
  );
}