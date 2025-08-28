import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import React from "react";

type Props = {
  slug: string;
  title: string;
  date: string;                // ISO or "YYYY-MM-DD"
  location?: string;
  description?: string | null;
  /** Optional tags from front matter (e.g., ["leadership","chatham"]) */
  tags?: string[] | null;
  /** Force the badge even without tags */
  chatham?: boolean;
  /** Optional hero image path (prefer local /public path) */
  heroImage?: string | null;
  className?: string;
  prefetch?: boolean;
  /** Format times in this TZ (for full ISO). */
  timeZone?: string;           // defaults to 'Europe/London'
};

/* ---------------- helpers ---------------- */

function isDateOnly(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isValidDate(d: Date) {
  return !Number.isNaN(d.valueOf());
}

function getLocalHM(dt: Date, tz: string): { hh: number; mm: number } {
  const hh = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(dt)
  );
  const mm = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, minute: "2-digit" }).format(dt)
  );
  return { hh, mm };
}

function formatNiceDate(iso: string, tz = "Europe/London") {
  if (isDateOnly(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (!isValidDate(dt)) return iso;
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(dt);
  }

  const dt = new Date(iso);
  if (!isValidDate(dt)) return iso;

  const dateStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(dt);

  const { hh, mm } = getLocalHM(dt, tz);
  if (hh === 0 && mm === 0) return dateStr; // hide midnight

  const timeStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(dt);

  return `${dateStr}, ${timeStr}`;
}

function ensureLocal(p?: string | null) {
  if (!p) return undefined;
  if (/^https?:\/\//i.test(p)) return undefined;     // keep local only
  return p.startsWith("/") ? p : `/${p.replace(/^\/+/, "")}`;
}

/** Build a list of likely image paths and auto-fallback onError */
function useEventImageCandidates(slug: string, heroImage?: string | null) {
  const candidates = React.useMemo(() => {
    const list = [
      ensureLocal(heroImage),
      `/assets/images/events/${slug}.webp`,
      `/assets/images/events/${slug}.jpg`,
      `/assets/images/events/${slug}.jpeg`,
      `/assets/images/events/${slug}.png`,
    ].filter(Boolean) as string[];
    // de-dup
    return Array.from(new Set(list));
  }, [slug, heroImage]);

  const [idx, setIdx] = React.useState(0);
  const src = candidates[idx];

  const onError = React.useCallback(() => {
    setIdx((i) => (i + 1 < candidates.length ? i + 1 : i));
  }, [candidates.length]);

  return { src, hasAny: candidates.length > 0, onError };
}

/* ---------------- component ---------------- */

export default function EventCard({
  slug,
  title,
  date,
  location,
  description,
  tags = null,
  chatham,
  className,
  prefetch = false,
  timeZone = "Europe/London",
  heroImage = null,
}: Props) {
  const nice = formatNiceDate(date, timeZone);
  const titleId = React.useId();
  const isChatham =
    Boolean(chatham) ||
    (Array.isArray(tags) && tags.some((t) => String(t).toLowerCase() === "chatham"));

  const { src, hasAny, onError } = useEventImageCandidates(slug, heroImage);

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
      {/* Top media */}
      {hasAny && src && (
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={src}
            alt={`${title} image`}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            onError={onError}
            priority={false}
          />
          {isChatham && (
            <span
              className="absolute right-3 top-3 rounded-full bg-deepCharcoal/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream"
              title="Chatham Room (off the record)"
              aria-label="Chatham Room (off the record)"
            >
              Chatham
            </span>
          )}
        </div>
      )}

      <div className="p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <time
            dateTime={date}
            className="rounded-full bg-warmWhite px-2 py-0.5 text-deepCharcoal/80"
            itemProp="startDate"
          >
            {nice}
          </time>
          {location && location.trim() && (
            <>
              <span aria-hidden="true">·</span>
              <span
                className="rounded-full bg-warmWhite px-2 py-0.5 text-deepCharcoal/80"
                itemProp="location"
              >
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

        {/* Optional canonical URL for microdata */}
        <meta itemProp="url" content={`/events/${slug}`} />
      </div>
    </article>
  );
}
