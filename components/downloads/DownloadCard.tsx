// components/downloads/DownloadCard.tsx
import * as React from "react";
import Image, { type StaticImageData } from "next/image";
import Link from "next/link";
import clsx from "clsx";

// Import the necessary metadata structure
import type { DownloadItem } from "@/lib/downloads";

type DownloadCardProps = {
    // These properties are required and guaranteed string/safe by getStaticProps
    slug: string;
    title: string;
    excerpt: string | null;
    coverImage: string | null;
    fileHref: string | null; // The direct link to the actual PDF file (/downloads/file.pdf)
    
    // Optional metadata
    category?: string | null;
    size?: string; // e.g., "45 KB"
    
    className?: string;
};

const DEFAULT_COVER = "/assets/images/downloads/default-download-cover.jpg";

/**
 * Renders a card component for a single downloadable resource (PDF/guide).
 * Assumes data has been pre-coerced to string/null in getStaticProps.
 */
export default function DownloadCard({
    slug,
    title,
    excerpt,
    coverImage,
    fileHref,
    category,
    size,
    className,
}: DownloadCardProps) {
    
    // The main link goes to the notes/detail page
    const detailHref = `/downloads/${slug}`;
    
    // Fallback image source
    const finalImageSrc = (typeof coverImage === 'string' && coverImage) || DEFAULT_COVER;

    return (
        <article
            className={clsx(
                "group relative overflow-hidden rounded-xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover",
                "flex flex-col",
                className
            )}
        >
            {/* Image Link Block */}
            <Link href={detailHref} prefetch={false} className="block relative w-full flex-shrink-0" tabIndex={-1}>
                <div className="relative w-full aspect-[16/9]">
                    <Image
                        src={finalImageSrc}
                        alt={`Cover image for ${title}`}
                        fill
                        sizes="(max-width: 768px) 50vw, 300px"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                        priority={false}
                    />
                </div>
            </Link>

            <div className="p-4 flex flex-col flex-grow">
                {/* Title and Detail Link */}
                <h3 className="font-serif text-lg font-semibold leading-snug text-deepCharcoal">
                    <Link
                        href={detailHref}
                        prefetch={false}
                        className="outline-none transition-colors hover:text-forest focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)/0.3]"
                    >
                        {title}
                    </Link>
                </h3>
                
                {/* Metadata */}
                <div className="mt-1 flex items-center text-xs text-gray-600 space-x-2">
                    {category && (
                        <span className="rounded-full bg-warmWhite px-2 py-0.5">{category}</span>
                    )}
                    {size && (
                        <span className="text-xs text-[color:var(--color-on-secondary)/0.6]">{size}</span>
                    )}
                </div>

                {/* Excerpt */}
                {excerpt && (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-700 flex-grow">
                        {excerpt}
                    </p>
                )}

                {/* CTA Buttons */}
                <div className="mt-4 flex gap-3 flex-shrink-0">
                    <Link
                        href={detailHref}
                        className="inline-flex items-center rounded-full border border-lightGrey px-3 py-1.5 text-sm font-medium text-deepCharcoal transition-colors hover:bg-warmWhite"
                        prefetch={false}
                    >
                        View Notes
                    </Link>

                    {fileHref && (
                        <a
                            href={fileHref}
                            download // Triggers browser download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center rounded-full bg-forest px-4 py-1.5 text-sm font-semibold text-cream transition-colors hover:bg-deepCharcoal"
                        >
                            Download
                        </a>
                    )}
                </div>
            </div>
        </article>
    );
}object-right"
      : "object-center";

  const pills: Array<{ href: string; label: string; kind: "download" | "read" }> = [];
  if (resources?.downloads?.length) {
    for (const d of resources.downloads.slice(0, 2)) pills.push({ href: d.href, label: d.label, kind: "download" });
  }
  if (pills.length < 2 && resources?.reads?.length) {
    for (const r of resources.reads.slice(0, 2 - pills.length))
      pills.push({ href: r.href, label: r.label, kind: "read" });
  }

  return (
    <article
      className={clsx(
        "relative overflow-hidden rounded-2xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover",
        className
      )}
      aria-labelledby={titleId}
      itemScope
      itemType="https://schema.org/Event"
    >
      {hasAny && src && (
        <div className={clsx("relative w-full", aspectClass)}>
          <Image
            src={src}
            alt={`${title} image`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className={clsx(fitClass, posClass)}
            onError={onError}
            priority={false}
          />
          {isChatham && (
            <span
              className="absolute right-3 top-3 rounded-full bg-[color:var(--color-on-secondary)/0.9] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream"
            >
              Chatham
            </span>
          )}
        </div>
      )}

      <div className="p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <time dateTime={date} className="rounded-full bg-warmWhite px-2 py-0.5 text-[color:var(--color-on-secondary)/0.8]" itemProp="startDate">
            {nice}
          </time>
          {location?.trim() && (
            <>
              <span aria-hidden="true">·</span>
              <span className="rounded-full bg-warmWhite px-2 py-0.5 text-[color:var(--color-on-secondary)/0.8]" itemProp="location">
                {location}
              </span>
            </>
          )}
        </div>

        <h3 id={titleId} className="text-lg font-semibold leading-snug text-gray-900" itemProp="name">
          <Link
            href={`/events/${slug}`}
            className="outline-none transition-colors hover:text-forest focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)/0.3]"
            prefetch={prefetch}
          >
            {title}
          </Link>
        </h3>

        {description && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-700" itemProp="description">
            {description}
          </p>
        )}

        {/* quick resource pills */}
        {pills.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {pills.map((p, i) => (
              <li key={i}>
                <Link
                  href={p.href}
                  prefetch={false}
                  className={clsx(
                    "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition",
                    p.kind === "download"
                      ? "border-[color:var(--color-primary)/0.2] text-forest hover:bg-forest hover:text-cream"
                      : "border-lightGrey text-[color:var(--color-on-secondary)] hover:bg-warmWhite"
                  )}
                  target={/\.pdf$/i.test(p.href) ? "_blank" : undefined}
                  rel={/\.pdf$/i.test(p.href) ? "noopener noreferrer" : undefined}
                >
                  {p.label}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4">
          <Link
            href={`/events/${slug}`}
            className="inline-flex items-center rounded-full border border-[color:var(--color-primary)/0.2] px-3 py-1.5 text-sm font-medium text-forest transition-colors hover:bg-forest hover:text-cream"
            prefetch={prefetch}
            aria-labelledby={titleId}
          >
            Details
          </Link>
        </div>

        <meta itemProp="url" content={`/events/${slug}`} />
      </div>
    </article>
  );
}
