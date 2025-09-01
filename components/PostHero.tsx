import Image from "next/image";
import React from "react";

type Props = {
  title: string;
  slug: string;
  coverImage?: string | null;
  coverAspect?: "book" | "wide" | "square" | null;
  coverFit?: "cover" | "contain" | null;
  coverPosition?: "left" | "center" | "right" | null;
};

const normalizeLocal = (src?: string | null) =>
  src && !/^https?:\/\//i.test(src)
    ? (src.startsWith("/") ? src : `/${src.replace(/^\/+/, "")}`)
    : undefined;

export default function PostHero({
  title,
  slug,
  coverImage,
  coverAspect = "wide",
  coverFit = "contain",
  coverPosition = "center",
}: Props) {
  // Try the explicit cover first, then slug-based fallbacks, then site defaults
  const candidates = React.useMemo(() => {
    const list = [
      normalizeLocal(coverImage),
      `/assets/images/blog/${slug}.webp`,
      `/assets/images/blog/${slug}.jpg`,
      `/assets/images/blog/${slug}.jpeg`,
      `/assets/images/blog/${slug}.png`,
      `/assets/images/blog/default-blog.jpg`,
      `/assets/images/default-blog.jpg`,
      `/assets/images/social/og-image.jpg`,
    ].filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [slug, coverImage]);

  const [idx, setIdx] = React.useState(0);
  const src = candidates[idx] as string;

  const onError = React.useCallback(() => {
    setIdx((i) => (i + 1 < candidates.length ? i + 1 : i));
  }, [candidates.length]);

  const aspectClass =
    coverAspect === "square" ? "aspect-[1/1]" :
    coverAspect === "book"   ? "aspect-[3/4]" :
                               "aspect-[16/9]";

  const fitClass = coverFit === "cover" ? "object-cover" : "object-contain";
  const posClass =
    coverPosition === "left"  ? "object-left"  :
    coverPosition === "right" ? "object-right" :
                                "object-center";

  const frameBg = coverFit === "contain" ? "bg-[rgb(10,37,30)]/92" : "bg-transparent";

  return (
    <div className={`relative mb-10 w-full overflow-hidden rounded-lg shadow-lg ${aspectClass} ${frameBg}`}>
      <Image
        src={src}
        alt={title}
        fill
        sizes="(max-width: 768px) 100vw, 768px"
        className={`${fitClass} ${posClass}`}
        priority
        onError={onError}
      />
    </div>
  );
}
