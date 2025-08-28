import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";

type Props = {
  slug: string;
  title: string;
  date: string;                // ISO. "YYYY-MM-DD" allowed for all-day events.
  location?: string | null;
  description?: string | null;
  /** Optional tags from front matter (e.g., ["leadership","chatham"]) */
  tags?: string[] | null;
  /** Force the badge without tags (fallback switch) */
  chatham?: boolean;
  /** Optional header image (local path under /public preferred) */
  heroImage?: string | null;
  className?: string;
  prefetch?: boolean;
  timeZone?: string;           // defaults to 'Europe/London'
};

// --- Local image helpers ---
const DEFAULT_EVENT_IMG = "/assets/images/events/default-event.jpg"; // ensure this file exists

function normalizeLocal(src?: string | null) {
  if (!src) return DEFAULT_EVENT_IMG;
  const s = String(src).replace(/\\/g, "/");
  return s.startsWith("/") ? s : `/${s}`;
}

// ---- Date helpers ----
function isDateOnly(isoish: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(isoish);
}
function isValidDate(d: Date) {
  return !Number.isNaN(d.valueOf());
}
function getLocalHM(dt: Date, tz: string): { hh: number; mm: number } {
  const hh = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(dt)
  );
  const mm = Number(new Intl.DateTimeFormat("en-GB", { timeZone: tz, minute: "2-digit" }).format(dt));
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
  if (hh === 0 && mm === 0) return dateStr;
  const timeStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(dt);
  return `${dateStr}, ${timeStr}`;
}
function toMachineDate(iso: string) {
  return iso;
}

export default function EventCard({
  slug,
  title,
  date,
  location,
  description,
  tags = null,
  chatham,
  heroImage = null,
  className,
  prefetch = false,
  timeZone = "Europe/London",
}: Props) {
  const nice = formatNiceDate(date, timeZone);
  const machine = toMachineDate(date);
  const hasLocation = Boolean(location && location.trim());
  const titleId = React.useId();

  const isChatham =
    Boolean(chatham) ||
    (Array.isArray(tags) && tags.some((t) => String(t).toLowerCase() === "chatham"));

  const img = normalizeLocal(heroImage);

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
      {/* Image header */}
      <div className="relative w-full aspect-[16/9]">
        <Image
          src={img}
          alt={`${title} image`}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover"
          // If a bad path sneaks in on Netlify, fall back at runtime:
          onError={(e) => {
            try {
              (e.currentTarget as HTMLImageElement).src = DEFAULT_EVENT_IMG;
            } catch {}
          }}
          priority={false}
        />
      </div>

      {/* Subtle badge */}
      {isChatham && (
        <span
          className="absolute right-3 top-3 rounded-full bg-deepCharcoal/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream"
          title="Chatham Room (off the record)"
          aria-label="Chatham Room (off the record)"
        >
          Chatham
        </span>
      )}

      <div className="p-6">
        <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
          <time dateTime={machine} className="rounded-full bg-warmWhite px-2 py-0.5 text-deepCharcoal/80" itemProp="startDate">
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
      <meta itemProp="image" content={img} />
    </article>
  );
}
