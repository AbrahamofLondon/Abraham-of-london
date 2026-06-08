// components/content/ArticleCoverImage.tsx
// Restrained article-level cover renderer for individual post and editorial pages.
// Returns null when no src — never renders a broken image or empty space.
//
// Sizing props:
//   maxWidth  — CSS value, e.g. "840px" (default "720px")
//   maxHeight — CSS value, e.g. "460px" (optional, no constraint by default)
//   objectFit — "cover" | "contain" (default "cover")

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
  /** CSS max-width value — overrides the default 720px */
  maxWidth?: string;
  /** CSS max-height value — optional constraint */
  maxHeight?: string;
  /** object-fit for the image — default "cover" */
  objectFit?: "cover" | "contain";
  className?: string;
};

export default function ArticleCoverImage({
  src,
  alt,
  title,
  priority = false,
  caption,
  aspect = "16/9",
  maxWidth = "720px",
  maxHeight,
  objectFit = "cover",
  className,
}: ArticleCoverImageProps) {
  if (!src) return null;

  const resolvedAlt = alt || (title ? `Cover image for ${title}` : "Article cover image");
  const paddingTop = aspect === "3/2" ? "66.67%" : "56.25%";

  // Compute hint for sizes attr from maxWidth
  const sizesHint = maxWidth.endsWith("px") ? maxWidth : "720px";
  const sizesAttr = `(max-width: 768px) 100vw, (max-width: 1200px) 80vw, ${sizesHint}`;

  return (
    <figure
      className={`w-full${className ? ` ${className}` : ""}`}
      style={{ maxWidth, marginLeft: "auto", marginRight: "auto" }}
    >
      <div
        className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/30"
        style={{ paddingTop, maxHeight }}
      >
        <Image
          src={src}
          alt={resolvedAlt}
          fill
          priority={priority}
          style={{ objectFit }}
          sizes={sizesAttr}
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
