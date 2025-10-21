// components/BlogPostCard.tsx
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx"; 
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
  tags?: string[];
  coverAspect?: "book" | "wide" | "square";
  coverFit?: "cover" | "contain";
  coverPosition?: "center" | "left" | "right";
};

/* ---------- constants ---------- */
const FALLBACK_AVATAR = siteConfig.authorImage || "/assets/images/profile-portrait.webp";

const DEFAULT_COVERS = [
  "/assets/images/blog/default.webp",
  "/assets/images/blog/default.jpg",
] as const;

/* ---------- helpers ---------- */

function stripMarkup(input?: string | null): string {
  if (!input) return "";
  return input.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function normalizeLocal(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return undefined;
  return src.startsWith("/") ? src : `/${src.replace(/^\/+/, "")}`;
}

function buildCoverCandidates(slug: string, coverImage?: string | null) {
  const cleanSlug = String(slug).trim();

  const baseCandidates = [
    normalizeLocal(coverImage),
    `/assets/images/blog/${cleanSlug}.webp`,
    `/assets/images/blog/${cleanSlug}.jpg`,
    `/assets/images/blog/${cleanSlug}.jpeg`,
    `/assets/images/blog/${cleanSlug}.png`,
    ...DEFAULT_COVERS,
  ].filter(Boolean) as string[];

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
  
  const authorName = typeof author === "string" ? author : author?.name || siteConfig.author;
  const preferredAvatar =
    (typeof author !== "string" && normalizeLocal(author?.image)) || FALLBACK_AVATAR;

  const [avatarSrc, setAvatarSrc] = React.useState(preferredAvatar);

  const candidates = React.useMemo(
    () => buildCoverCandidates(slug, coverImage),
    [slug, coverImage]
  );
  
  const [idx, setIdx] = React.useState(0);
  const [coverFailed, setCoverFailed] = React.useState(false);

  const coverSrc = !coverFailed ? candidates[idx] : undefined;

  const onCoverError = React.useCallback(() => {
    setIdx((i) => {
      const next = i + 1;
      if (next < candidates.length) {
        return next;
      }
      setCoverFailed(true); 
      return i;
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
  
  const aspectClass = clsx({
    "aspect-[1/1]": coverAspect === "square",
    "aspect-[16/9]": coverAspect === "wide",
    "aspect-[2/3]": coverAspect === "book",
  });

  const imageClasses = clsx(
    coverFit === "contain" ? "object-contain" : "object-cover",
    {
      "object-left": coverPosition === "left",
      "object-right": coverPosition === "right",
      "object-center": coverPosition === "center",
    }
  );

  const frameClasses = clsx(
    "relative w-full overflow-hidden rounded-t-2xl",
    aspectClass,
    coverFit === "contain" && "bg-warmWhite p-2 sm:p-3"
  );

  const initials = React.useMemo(() => {
    const words = String(title || "").trim().split(/\s+/).slice(0, 3);
    return words.map((w) => w[0]?.toUpperCase() || "").join("") || "A•L";
  }, [title]);

  const safeExcerpt = stripMarkup(excerpt);

  // FIX: Define the required arbitrary opacity once
  const colorOnSecondary_07 = "text-[color:var(--color-on-secondary)]/[0.7]";
  const colorOnSecondary_08 = "text-[color:var(--color-on-secondary)]/[0.8]";
  const colorOnSecondary_07_bg = "bg-gradient-to-br from-olive/20 to-deepCharcoal/[0.10]";

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
            <div className={clsx("absolute inset-0 flex items-center justify-center", colorOnSecondary_07_bg)}>
              <span className={clsx("select-none font-serif text-4xl font-semibold", colorOnSecondary_07)}>
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
            // Fix 1: Replaced 'text-[color:var(--color-on-secondary)/0.8]' with 'text-[color:var(--color-on-secondary)]/[0.8]'
            <p className={clsx("mt-3 line-clamp-3 text-sm", colorOnSecondary_08)}>{safeExcerpt}</p>
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
            <div className={clsx("text-xs", colorOnSecondary_07)}>
              <p className="font-medium">{authorName}</p>
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}