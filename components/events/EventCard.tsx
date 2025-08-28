import React from "react";
import Link from "next/link";
import Image from "next/image";
import clsx from "clsx";

export type EventCardProps = {
  slug: string;
  title: string;
  /** ISO string; "YYYY-MM-DD" is OK for all-day */
  date: string;
  location?: string | null;
  description?: string | null;
  /** front-matter tags, e.g. ["leadership","chatham"] */
  tags?: string[] | null;
  /** optional explicit hero image (local path under /public) */
  heroImage?: string;
  /** force Chatham badge if tags not present */
  chatham?: boolean;
  className?: string;
  prefetch?: boolean;
  /** display timezone for date strings (render only) */
  timeZone?: string;
};

const FALLBACK_EVENT_IMAGE = "/assets/images/events/default.jpg";

function isDateOnly(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

function isValidDate(d: Date) {
  return !Number.isNaN(d.valueOf());
}

function formatDateNice(isoish: string, tz = "Europe/London") {
  if (!isoish) return "";
  if (isDateOnly(isoish)) {
    const [y, m, d] = isoish.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(dt);
  }
  const dt = new Date(isoish);
  if (!isValidDate(dt)) return isoish;

  const dateStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(dt);

  const timeStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(dt);

  // hide midnight times
  if (timeStr.startsWith("00:")) return dateStr;
  return `${dateStr}, ${timeStr}`;
}

export default function EventCard({
  slug,
  title,
  date,
  location,
  description,
  tags = null,
  chatham,
  heroImage,
  className,
  prefetch = false,
  timeZone = "Europe/London",
}: EventCardProps) {
  const titleId = React.useId();
  const nice = formatDateNice(date, timeZone);
  const hasLocation = !!(location && location.trim());

  const isChatham =
    Boolean(chatham) ||
    (Array.isArray(tags) && tags.some((t) => String(t).toLowerCase() === "chatham"));

  // Prefer an explicit hero image if provided; else derive from slug
  const initialHero =
    (heroImage && heroImage.startsWith("/") ? heroImage : null) ||
    `/assets/images/events/${slug}.jpg`;

  const [heroSrc, setHeroSrc] = React.useState<string>(initialHero);

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
      {/* HERO IMAGE — use object-contain to avoid cropping text artwork */}
      <div className="relative aspect-[16/9] w-full bg-black/80">
        <Image
          src={heroSrc}
          alt=""
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-contain"
          priority={false}
          onError={() => {
            if (heroSrc !== FALLBACK_EVENT_IMAGE) setHeroSrc(FALLBACK_EVENT_IMAGE);
          }}
        />
        {isChatham && (
          <span
            className="absolute right-3 top-3 rounded-full bg-deepCharcoal/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream"
            title="Chatham Room (off the record)"
            aria-label="Chatham Room (off the record)"
          >
            CHATHAM
          </span>
        )}
      </div>

      <div className="p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <time dateTime={date} className="rounded-full bg-warmWhite px-2 py-0.5 text-deepCharcoal/80" itemProp="startDate">
            {nice}
          </time>
          {hasLocation && (
            <>
              <span aria-hidden="true">·</span>
              <span className="rounded-full bg-warmWhite px-2 py-0.5 text-deepCharcoal/80" itemProp="location">
                {location}
              </span>
            </>
          )}
        </div>

        <h3 id={titleId} className="text-lg font-semibold leading-snug text-gray-900" itemProp="name">
          <Link
            href={`/events/${slug}`}
            className="outline-none transition-colors hover:text-forest focus-visible:rounded focus-visible:ring-2 focus-visible:ring-forest/30"
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

        <div className="mt-4">
          <Link
            href={`/events/${slug}`}
            className="inline-flex items-center rounded-full border border-forest/20 px-3 py-1.5 text-sm font-medium text-forest transition-colors hover:bg-forest hover:text-cream"
            prefetch={prefetch}
            aria-labelledby={titleId}
          >
            Details
          </Link>
        </div>
      </div>

      <meta itemProp="url" content={`/events/${slug}`} />
    </article>
  );
}
