import Link from "next/link";
import clsx from "clsx";
import React from "react";

type Props = {
  slug: string;
  title: string;
  date: string;              // ISO. Prefer "YYYY-MM-DD" for all-day events.
  location?: string;
  description?: string | null;
  className?: string;
  prefetch?: boolean;
  timeZone?: string;         // for date-times (defaults to 'Europe/London')
};

// ---- Helpers ----
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
  const mm = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, minute: "2-digit" }).format(dt)
  );
  return { hh, mm };
}

function formatNiceDate(iso: string, tz = "Europe/London") {
  // If it's date-only (YYYY-MM-DD), render the calendar day only
  if (isDateOnly(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d)); // stable UTC so no drift
    if (!isValidDate(dt)) return iso;
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(dt);
  }

  // Otherwise, treat as full ISO and format in target TZ
  const dt = new Date(iso);
  if (!isValidDate(dt)) return iso;

  const dateStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(dt);

  const { hh, mm } = getLocalHM(dt, tz);

  // Suppress midnight times (00:00 local)
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
  // For <time dateTime>, both "YYYY-MM-DD" and full ISO are valid.
  // Keep date-only as-is (cleaner microdata), otherwise return original.
  return isDateOnly(iso) ? iso : iso;
}

export default function EventCard({
  slug,
  title,
  date,
  location,
  description,
  className,
  prefetch = false,
  timeZone = "Europe/London",
}: Props) {
  const nice = formatNiceDate(date, timeZone);
  const machine = toMachineDate(date);
  const hasLocation = Boolean(location && location.trim());
  const titleId = React.useId();

  return (
    <article
      className={clsx(
        "rounded-2xl border border-lightGrey bg-white p-6 shadow-card transition hover:shadow-cardHover",
        className
      )}
      aria-labelledby={titleId}
      itemScope
      itemType="https://schema.org/Event"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2 text-sm text-gray-600">
        <time
          dateTime={machine}
          className="rounded-full bg-warmWhite px-2 py-0.5 text-deepCharcoal/80"
          itemProp="startDate"
        >
          {nice}
        </time>
        {hasLocation && (
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
    </article>
  );
}
