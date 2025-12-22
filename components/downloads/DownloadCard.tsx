// components/downloads/DownloadCard.tsx
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";
import * as React from "react";

type DownloadCardProps = {
  slug: string;
  title: string;
  excerpt: string | null;
  coverImage: string | null;
  fileHref: string | null;

  category?: string | null;
  size?: string;
  featured?: boolean;

  className?: string;
};

const DEFAULT_COVER = "/assets/images/downloads/default-download-cover.jpg";

function isGatedHref(href: string): boolean {
  return href.startsWith("/api/downloads/");
}

export default function DownloadCard({
  slug,
  title,
  excerpt,
  coverImage,
  fileHref,
  category,
  size,
  featured = false,
  className,
}: DownloadCardProps) {
  const detailHref = `/downloads/${slug}`;
  const finalImageSrc = (typeof coverImage === "string" && coverImage) || DEFAULT_COVER;

  const gated = typeof fileHref === "string" && fileHref ? isGatedHref(fileHref) : false;

  return (
    <article
      className={clsx(
        "group relative overflow-hidden rounded-xl border bg-white shadow-card transition-all duration-300",
        "flex flex-col",
        featured
          ? "border-amber-200 hover:shadow-xl hover:border-amber-300"
          : "border-lightGrey hover:shadow-cardHover",
        className,
      )}
    >
      {featured && (
        <div className="absolute top-3 left-3 z-10">
          <span className="rounded-full bg-amber-500 px-3 py-1 text-xs font-medium text-white shadow-sm">
            Featured
          </span>
        </div>
      )}

      <Link href={detailHref} prefetch={false} className="block relative w-full flex-shrink-0" tabIndex={-1}>
        <div className="relative w-full aspect-[16/9]">
          <Image
            src={finalImageSrc}
            alt={`Cover image for ${title}`}
            fill
            sizes="(max-width: 768px) 50vw, 300px"
            className={clsx(
              "object-cover transition-transform duration-300",
              featured ? "group-hover:scale-[1.03]" : "group-hover:scale-[1.02]",
            )}
            priority={false}
          />
          {featured && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent" />
          )}
        </div>
      </Link>

      <div className={clsx("flex flex-col flex-grow", featured ? "p-6" : "p-4")}>
        <h3
          className={clsx(
            "font-serif leading-snug text-deepCharcoal",
            featured ? "text-xl font-semibold" : "text-lg font-semibold",
          )}
        >
          <Link
            href={detailHref}
            prefetch={false}
            className="outline-none transition-colors hover:text-forest focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)/0.3]"
          >
            {title}
          </Link>
        </h3>

        <div className="mt-2 flex items-center text-xs text-gray-600 space-x-2">
          {category && (
            <span
              className={clsx(
                "rounded-full px-2 py-0.5",
                featured ? "bg-amber-100 text-amber-800" : "bg-warmWhite text-gray-700",
              )}
            >
              {category}
            </span>
          )}
          {size && (
            <span className="text-xs text-[color:var(--color-on-secondary)/0.6]">{size}</span>
          )}
          {gated && (
            <span className="text-[10px] rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-800">
              Inner Circle
            </span>
          )}
        </div>

        {excerpt && (
          <p
            className={clsx(
              "line-clamp-3 leading-relaxed text-gray-700 flex-grow",
              featured ? "mt-3 text-sm" : "mt-2 text-sm",
            )}
          >
            {excerpt}
          </p>
        )}

        <div className={clsx("flex gap-3 flex-shrink-0", featured ? "mt-5" : "mt-4")}>
          <Link
            href={detailHref}
            className={clsx(
              "inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
              featured
                ? "border-amber-300 text-deepCharcoal hover:bg-amber-50 hover:border-amber-400"
                : "border-lightGrey text-deepCharcoal hover:bg-warmWhite",
            )}
            prefetch={false}
            scroll
          >
            View Notes
          </Link>

          {fileHref && (
            gated ? (
              <a
                href={fileHref}
                className={clsx(
                  "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold text-cream transition-colors",
                  featured ? "bg-amber-600 hover:bg-amber-700" : "bg-forest hover:bg-deepCharcoal",
                )}
              >
                Unlock & Download
              </a>
            ) : (
              <a
                href={fileHref}
                download
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(
                  "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-semibold text-cream transition-colors",
                  featured ? "bg-amber-600 hover:bg-amber-700" : "bg-forest hover:bg-deepCharcoal",
                )}
              >
                Download
              </a>
            )
          )}
        </div>
      </div>
    </article>
  );
}