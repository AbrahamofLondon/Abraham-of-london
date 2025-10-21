// components/BlogPostCard.tsx
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx"; // Added for cleaner class construction
import { siteConfig } from "@/lib/siteConfig";

/* ---------- types ---------- */
type AuthorType = string | { name?: string; image?: string };

type BlogPostCardProps = {
  slug: string;
  title: string;
  date?: string;
  excerpt?: string;
  coverImage?: string;
  author?: AuthorType;
  readTime?: string | number;
  category?: string;
  tags?: string[]; // Currently unused in the card, but kept for type completeness
  coverAspect?: "book" | "wide" | "square";
  coverFit?: "cover" | "contain";
  coverPosition?: "center" | "left" | "right";
};

/* ---------- constants ---------- */
const FALLBACK_AVATAR = siteConfig.authorImage || "/assets/images/profile-portrait.webp";

// We’ll try these default blog covers if everything else fails
const DEFAULT_COVERS = [
  "/assets/images/blog/default.webp",
  "/assets/images/blog/default.jpg",
] as const;

/* ---------- helpers ---------- */

// quick, safe “strip tags / MDX components” for list cards
function stripMarkup(input?: string | null): string {
  if (!input) return "";
  // remove anything that looks like a tag or MDX component, then normalize whitespace
  return input.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

// Ensures a local path is correctly formatted, ignores external URLs
function normalizeLocal(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return undefined; // Ignore external images
  // Ensure path starts with a single slash
  return src.startsWith("/") ? src : `/${src.replace(/^\/+/, "")}`;
}

/** Build a strong list of candidates we can try in order */
function buildCoverCandidates(slug: string, coverImage?: string | null) {
  const cleanSlug = String(slug).trim();

  const baseCandidates = [
    normalizeLocal(coverImage), // 1. User-provided image
    // 2. Slug-based fallbacks
    `/assets/images/blog/${cleanSlug}.webp`,
    `/assets/images/blog/${cleanSlug}.jpg`,
    `/assets/images/blog/${cleanSlug}.jpeg`,
    `/assets/images/blog/${cleanSlug}.png`,
    // 3. Absolute defaults
    ...DEFAULT_COVERS,
  ].filter(Boolean) as string[];

  // de-dup while preserving order
  return Array.from(new Set(baseCandidates));
}

// --- Component ---
export default function BlogPostCard({
  slug,
  title,
  excerpt,
  date,
  coverImage,
  author,
  readTime,
  category,
  coverAspect = "book",
  coverFit = "cover",
  coverPosition = "center",
}: BlogPostCardProps) {
  
  // --- Author Logic ---
  const authorName = typeof author === "string" ? author : author?.name || siteConfig.author;
  const preferredAvatar =
    (typeof author !== "string" && normalizeLocal(author?.image)) || FALLBACK_AVATAR;

  const [avatarSrc, setAvatarSrc] = React.useState(preferredAvatar);

  // --- Cover Image Fallback Logic ---
  const candidates = React.useMemo(
    () => buildCoverCandidates(slug, coverImage),
    [slug, coverImage]
  );
  
  // idx tracks which candidate we are currently trying
  const [idx, setIdx] = React.useState(0);
  
  // coverFailed state is only set when all candidates are exhausted
  const [coverFailed, setCoverFailed] = React.useState(false);

  const coverSrc = !coverFailed ? candidates[idx] : undefined;

  const onCoverError = React.useCallback(() => {
    setIdx((i) => {
      const next = i + 1;
      if (next < candidates.length) {
        return next;
      }
      // If we reach the end, mark as failed to show placeholder
      setCoverFailed(true); 
      return i; // Return current index to stop trying
    });
  }, [candidates.length]);

  // --- Date Formatting ---
  const dt = date ? new Date(date) : null;
  const isValidDate = dt && !Number.isNaN(+dt);
  
  const dateTime = isValidDate ? dt.toISOString().slice(0, 10) : undefined;
  const dateLabel = isValidDate
      ? new Intl.DateTimeFormat("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        }).format(dt)
      : undefined;

  // --- Class Generation ---
  
  // Aspect frame class
  const aspectClass = clsx({
    "aspect-[1/1]": coverAspect === "square",
    "aspect-[16/9]": coverAspect === "wide",
    "aspect-[2/3]": coverAspect === "book",
  });

  // Fit and Position classes
  const imageClasses = clsx(
    coverFit === "contain" ? "object-contain" : "object-cover",
    {
      "object-left": coverPosition === "left",
      "object-right": coverPosition === "right",
      "object-center": coverPosition === "center",
    }
  );

  // Frame classes (for contain background/padding)
  const frameClasses = clsx(
    "relative w-full overflow-hidden rounded-t-2xl",
    aspectClass,
    coverFit === "contain" && "bg-warmWhite p-2 sm:p-3"
  );

  // Initials for the placeholder
  const initials = React.useMemo(() => {
    const words = String(title || "").trim().split(/\s+/).slice(0, 3);
    return words.map((w) => w[0]?.toUpperCase() || "").join("") || "A•L";
  }, [title]);

  const safeExcerpt = stripMarkup(excerpt);

  return (
    <article className="rounded-2xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover">
      <Link href={`/blog/${slug}`} className="block" prefetch={false} aria-label={`Read: ${title}`}>
        {/* Cover frame */}
        <div className={frameClasses}>
          {!coverFailed && coverSrc ? (
            <Image
              src={coverSrc}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className={imageClasses}
              onError={onCoverError}
              priority={false}
            />
          ) : (
            // graceful placeholder when all images fail
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-olive/20 to-deepCharcoal/10">
              <span className="select-none font-serif text-4xl font-semibold text-[color:var(--color-on-secondary)/0.7]">
                {initials}
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <div className="p-5">
          <h3 className="font-serif text-xl font-semibold text-deepCharcoal">{title}</h3>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[color:var(--color-on-secondary)/0.7]">
            {dateTime && <time dateTime={dateTime}>{dateLabel}</time>}
            {readTime && <span aria-label="Estimated reading time">{readTime} min read</span>}
            {category && (
              <span className="inline-flex rounded-full border border-lightGrey px-2 py-0.5">{category}</span>
            )}
            <span className="luxury-link">Discuss</span>
          </div>

          {safeExcerpt && (
            <p className="mt-3 line-clamp-3 text-sm text-[color:var(--color-on-secondary)/0.8]">{safeExcerpt}</p>
          )}

          <div className="mt-4 flex items-center gap-3">
            <Image
              src={avatarSrc}
              alt={authorName || "Author"}
              width={40}
              height={40}
              className="rounded-full object-cover"
              onError={() => setAvatarSrc(FALLBACK_AVATAR)}
            />
            <div className="text-xs text-[color:var(--color-on-secondary)/0.7]">
              <p className="font-medium">{authorName}</p>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}