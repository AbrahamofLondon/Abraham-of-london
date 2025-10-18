// components/BlogPostCard.tsx
import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/siteConfig";

/* ---------- types ---------- */
type BlogPostCardProps = {
  slug: string;
  title: string;
  date?: string;
  excerpt?: string;
  coverImage?: string;
  author?: string | { name?: string; image?: string };
  readTime?: string | number;
  category?: string;
  tags?: string[];
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
function stripMarkup(input?: string | null) {
  if (!input) return "";
  // remove anything that looks like a tag or MDX component
  return input.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

function normalizeLocal(src?: string | null): string | undefined {
  if (!src) return undefined;
  if (/^https?:\/\//i.test(src)) return undefined; // external images not handled here
  return src.startsWith("/") ? src : `/${src.replace(/^\/+/, "")}`;
}

/** Build a strong list of candidates we can try in order */
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

  // de-dup while preserving order
  return Array.from(new Set(baseCandidates));
}

/* ---------- component ---------- */
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

  // cover candidates + failure handling
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
      if (next >= candidates.length) {
        // exhausted all candidates → show placeholder
        setCoverFailed(true);
        return i;
      }
      return next;
    });
  }, [candidates.length]);

  // date label
  const dt = date ? new Date(date) : null;
  const dateTime = dt && !Number.isNaN(+dt) ? dt.toISOString().slice(0, 10) : undefined;
  const dateLabel =
    dt && !Number.isNaN(+dt)
      ? new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(dt)
      : undefined;

  // aspect frame
  const aspectClass =
    coverAspect === "square" ? "aspect-[1/1]" : coverAspect === "wide" ? "aspect-[16/9]" : "aspect-[2/3]";

  // fit + position
  const fitClass = coverFit === "contain" ? "object-contain" : "object-cover";
  const posClass =
    coverPosition === "left" ? "object-left" : coverPosition === "right" ? "object-right" : "object-center";

  // background for letterboxing when using contain (prevents “kissing” look)
  const framePadding = coverFit === "contain" ? "p-2 sm:p-3" : "";
  const frameBg = coverFit === "contain" ? "bg-warmWhite" : "bg-transparent";

  // Initials for the placeholder
  const initials = React.useMemo(() => {
    const words = String(title || "").trim().split(/\s+/).slice(0, 3);
    return words.map((w) => w[0]?.toUpperCase() || "").join("");
  }, [title]);

  const safeExcerpt = stripMarkup(excerpt);

  return (
    <article className="rounded-2xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover">
      <Link href={`/blog/${slug}`} className="block" prefetch={false} aria-label={`Read: ${title}`}>
        {/* Cover frame */}
        <div className={`relative w-full overflow-hidden rounded-t-2xl ${aspectClass} ${frameBg} ${framePadding}`}>
          {!coverFailed && coverSrc ? (
            <Image
              src={coverSrc}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 33vw"
              className={`${fitClass} ${posClass}`}
              onError={onCoverError}
              priority={false}
            />
          ) : (
            // graceful placeholder when all images fail
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-olive/20 to-[color:var(--color-primary)/0.3]">
              <span className="select-none font-serif text-4xl font-semibold text-[color:var(--color-on-secondary)/0.7]">
                {initials || "A•L"}
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
