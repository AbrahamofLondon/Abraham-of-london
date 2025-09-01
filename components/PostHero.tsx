import Image from "next/image";
import * as React from "react";

type Props = {
  /** Optional: used for slug-based image fallbacks */
  slug?: string;
  title: string;
  coverImage?: string | null;
  /** Optional framing controls (read from MDX front-matter) */
  coverAspect?: "book" | "wide" | "square" | null;
  coverFit?: "cover" | "contain" | null;
  coverPosition?: "left" | "center" | "right" | null;
};

const ensureLocal = (p?: string | null) =>
  p && !/^https?:\/\//i.test(p) ? (p.startsWith("/") ? p : `/${p.replace(/^\/+/, "")}`) : undefined;

/** Build a local-fallback chain based on slug + defaults */
function buildCandidates(slug?: string, coverImage?: string | null) {
  const list: Array<string> = [];

  const normalized = ensureLocal(coverImage);
  if (normalized) list.push(normalized);

  if (slug) {
    list.push(
      `/assets/images/blog/${slug}.webp`,
      `/assets/images/blog/${slug}.jpg`,
      `/assets/images/blog/${slug}.jpeg`,
      `/assets/images/blog/${slug}.png`,
    );
  }

  list.push(`/assets/images/social/og-image.jpg`);

  // de-dup
  return Array.from(new Set(list));
}

export default function PostHero({
  slug,
  title,
  coverImage,
  coverAspect = "wide",     // default hero to 16:9
  coverFit = "cover",       // hero should fill, avoid letterbox
  coverPosition = "center",
}: Props) {
  const candidates = React.useMemo(() => buildCandidates(slug, coverImage), [slug, coverImage]);

  const [idx, setIdx] = React.useState(0);
  const src = candidates[idx];

  // frame ratio
  const aspectClass =
    coverAspect === "square" ? "aspect-[1/1]" : coverAspect === "book" ? "aspect-[3/4]" : "aspect-[16/9]";

  // fit & position
  const fitClass = coverFit === "cover" ? "object-cover" : "object-contain";
  const posClass =
    coverPosition === "left" ? "object-left" : coverPosition === "right" ? "object-right" : "object-center";

  // background for letterboxing when using contain
  const frameBg = coverFit === "contain" ? "bg-[rgb(10,37,30)]/92" : "bg-transparent";

  if (!src) return null;

  return (
    <div className={`relative mb-10 w-full overflow-hidden rounded-lg shadow-lg ${aspectClass} ${frameBg}`}>
      <Image
        src={src}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, 768px"
        className={`${fitClass} ${posClass}`}
        priority
        onError={() => setIdx((i) => (i + 1 < candidates.length ? i + 1 : i))}
      />
    </div>
  );
}
