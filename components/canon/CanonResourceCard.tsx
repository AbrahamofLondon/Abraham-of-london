// components/canon/CanonResourceCard.tsx

import Link from "next/link";
import LockClosedIcon from "@/components/icons/LockClosedIcon";
import InnerCircleBadge from "@/components/InnerCircleBadge";

export interface CanonSummary {
  slug: string;
  title: string;
  description?: string | null;
  subtitle?: string | null;
  coverImage?: string | null;
  tags?: string[];
  readTime?: string | null;
  volumeNumber?: string | null;
  accessLevel?: string | null; // "public" | "inner-circle" | undefined
  label?: string | null; // e.g. "Volume X", "Campaign", "Featured"
}

interface CanonResourceCardProps {
  doc: CanonSummary;
  /** Route to open. If omitted, defaults to `/canon/${slug}`. */
  href?: string;
  /** Optional override label shown above title. */
  label?: string;
  /** If true, visually emphasise the card (for hero/featured blocks). */
  highlight?: boolean;
}

export default function CanonResourceCard({
  doc,
  href,
  label,
  highlight = false,
}: CanonResourceCardProps) {
  const {
    slug,
    title,
    subtitle,
    description,
    coverImage,
    tags,
    readTime,
    volumeNumber,
    accessLevel,
  } = doc;

  const targetHref = href || `/canon/${slug}`;
  const isInnerCircle = accessLevel === "inner-circle";
  const locked = isInnerCircle; // UI lock - real gate is via middleware

  const displayLabel =
    label || doc.label || (volumeNumber ? `Volume ${volumeNumber}` : undefined);

  const blurb = description || subtitle || "";

  return (
    <Link
      href={targetHref}
      prefetch
      className={[
        "group flex h-full flex-col overflow-hidden rounded-3xl",
        "border bg-white shadow-sm transition-all duration-200",
        "border-gray-200 hover:-translate-y-1 hover:shadow-lg",
        "dark:border-gray-800 dark:bg-gray-900",
        highlight
          ? "ring-1 ring-softGold/40 hover:ring-softGold/70"
          : "hover:border-softGold/70",
      ].join(" ")}
    >
      {/* COVER IMAGE (optional) */}
      {coverImage && (
        <div className="relative aspect-[3/1.6] w-full overflow-hidden border-b border-gray-200 dark:border-gray-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImage}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
          {locked && (
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-black/5 to-transparent" />
          )}
        </div>
      )}

      {/* BODY */}
      <div className="flex flex-1 flex-col p-5">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="space-y-1">
            {displayLabel && (
              <p className="text-[0.65rem] uppercase tracking-[0.22em] text-softGold">
                {displayLabel}
              </p>
            )}

            <h3 className="font-serif text-lg text-gray-900 group-hover:text-softGold dark:text-gray-100">
              {title}
            </h3>
          </div>

          {/* INNER CIRCLE BADGE (if gated) */}
          <InnerCircleBadge
            accessLevel={accessLevel ?? null} // Convert undefined to null
            className="shrink-0"
            size="sm"
          />
        </div>

        {/* BLURB */}
        {blurb && (
          <p className="mb-3 line-clamp-3 text-sm text-gray-700 dark:text-gray-300">
            {blurb}
          </p>
        )}

        {/* META ROW */}
        <div className="mt-auto flex flex-wrap items-center gap-2 text-[0.7rem] text-gray-500 dark:text-gray-400">
          {readTime && (
            <span className="rounded-full border border-gray-300 px-3 py-1 uppercase tracking-[0.16em] dark:border-gray-700">
              {readTime}
            </span>
          )}

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-gray-200 px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.12em] dark:border-gray-700"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <span className="ml-auto inline-flex items-center gap-1 text-[0.7rem] font-semibold text-softGold group-hover:underline">
            {locked ? (
              <>
                <LockClosedIcon className="h-3 w-3" />
                <span>Preview &amp; Request Access</span>
              </>
            ) : (
              "Open"
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}