// components/content/ArticleCoverImage.tsx
// Restrained article-level cover renderer for individual post and editorial pages.
// Returns null when no src — never renders a broken image or empty space.

import * as React from "react";
import Image from "next/image";

export type ArticleCoverAspect = "16/9" | "3/2";

export type ArticleCoverImageProps = {
  src?: string | null;
  alt?: string;
  title?: string;
  priority?: boolean;
  caption?: string;
  aspect?: ArticleCoverAspect;
  className?: string;
};

export default function ArticleCoverImage({
  src,
  alt,
  title,
  priority = false,
  caption,
  aspect = "16/9",
  className,
}: ArticleCoverImageProps) {
  if (!src) return null;

  const resolvedAlt = alt || (title ? `Cover image for ${title}` : "Article cover image");
  const paddingTop = aspect === "3/2" ? "66.67%" : "56.25%";

  return (
    <figure className={`w-full${className ? ` ${className}` : ""}`}>
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30"
        style={{ paddingTop }}
      >
        <Image
          src={src}
          alt={resolvedAlt}
          fill
          priority={priority}
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 720px"
        />
      </div>
      {caption ? (
        <figcaption
          className="mt-3 text-center"
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "7.5px",
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.28)",
          }}
        >
          {caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
