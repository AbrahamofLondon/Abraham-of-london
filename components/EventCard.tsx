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
  timeZone?: string;         // for date-times (defaults to 'UTC')
};

function formatNiceDate(date: string, tz = "UTC") {
  // If it's date-only (YYYY-MM-DD), show it as that day in UTC to avoid TZ drift.
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (m) {
    const [_, y, mo, d] = m;
    const dt = new Date(Date.UTC(+y, +mo - 1, +d));
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }).format(dt);
  }

  // Otherwise, try to format the full ISO string in a chosen TZ.
  const dt = new Date(date);
  if (!isNaN(dt.valueOf())) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: tz || "UTC",
    }).format(dt);
  }

  // Fallback to the raw string if parsing fails
  return date;
}

function toMachineDate(date: string) {
  // Ensure <time dateTime> is valid ISO—append midnight Z for date-only.
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T00:00:00Z` : date;
}

export default function EventCard({
  slug,
  title,
  date,
  location,
  description,
  className,
  prefetch = false,
  timeZone = "UTC",
}: Props) {
  const nice = formatNiceDate(date, timeZone);
  const iso = toMachineDate(date);
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
          dateTime={iso}
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

      {/* Optional hidden canonical URL if you have one */}
      <meta itemProp="url" content={`/events/${slug}`} />
    </article>
  );
}
