import * as React from "react";
import Image from "next/image";
import clsx from "clsx";

type Props = { className?: string };

export default function CtaArt({ className }: Props) {
  // Try webp then jpg; add a cache-buster so any old 404 isn't reused by the CDN
  const candidates = React.useMemo(
    () => [
      "/assets/images/cta/cta-bg.webp?v=2",
      "/assets/images/cta/cta-bg.jpg?v=2",
    ],
    []
  );

  const [idx, setIdx] = React.useState(0);
  const src = candidates[idx];
  const fallback =
    "linear-gradient(135deg, rgba(253,224,71,0.9), rgba(234,179,8,0.9))";

  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-lightGrey shadow-card",
        "aspect-[4/3] w-full", // gives the box a real height
        className
      )}
      aria-hidden="true"
    >
      {/* graceful fallback if image fails twice */}
      {idx >= candidates.length ? (
        <div className="absolute inset-0" style={{ background: fallback }} />
      ) : (
        <Image
          src={src}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover"
          onError={() => setIdx((i) => (i + 1 < candidates.length ? i + 1 : i + 1))}
          priority={false}
        />
      )}
    </div>
  );
}
