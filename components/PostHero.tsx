// components/PostHero.tsx
import Image from "next/image";
import React from "react";

type Props = {
  title: string;
  coverImage?: string | null;
  /** Optional framing controls (read from MDX front-matter) */
  coverAspect?: "book" | "wide" | "square" | null;
  coverFit?: "cover" | "contain" | null;
  coverPosition?: "left" | "center" | "right" | null;
};

const ensureLocal = (p?: string | null) =>
  p && !/^https?:\/\//i.test(p) ? (p.startsWith("/") ? p : `/${p.replace(/^\/+/, "")}`) : undefined;

export default function PostHero({
  title,
  coverImage,
  coverAspect = "wide",
  coverFit = "contain",
  coverPosition = "center",
}: Props) {
  const [src, setSrc] = React.useState<string | undefined>(ensureLocal(coverImage) || "/assets/images/social/og-image.jpg");

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
        onError={() => setSrc("/assets/images/social/og-image.jpg")}
      />
    </div>
  );
}
