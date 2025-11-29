import * as React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import clsx from "clsx";

// --- Types ---

export type EventItem = {
  id?: string;
  /** ISO date string (YYYY-MM-DD) or Date */
  date: string | Date;
  title: string;
  location?: string;
  href?: string;
};

type Props = {
  events?: EventItem[];
  variant?: "light" | "dark";
  title?: string;
  emptyMessage?: string;
  /** Hide past events (default: true) */
  hidePast?: boolean;
  /** Limit number shown */
  max?: number;
  /** Locale for date formatting (default: en-GB) */
  locale?: string;
  className?: string;
};

// --- Constants & Utilities ---

const DEFAULT_EVENTS: EventItem[] = [
  {
    date: "2026-09-12",
    title: "Strategic Leadership Workshop",
    location: "London, UK",
    href: "/events/leadership-workshop",
  },
  {
    date: "2026-11-11",
    title: "Fathers & Futures Panel: Online Session",
    location: "Online",
    href: "/events/fathers-and-futures",
  },
];

/**
 * Safely parses a date string/object into a Date object.
 * @returns Date object or null if parsing fails.
 */
function parseDate(d: string | Date): Date | null {
  try {
    const date = d instanceof Date ? d : new Date(d);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Safely converts a Date object to YYYY-MM-DD string.
 */
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

// --- Component ---

export default function EventsSection({
  events = DEFAULT_EVENTS,
  variant = "light",
  title = "Upcoming Events",
  emptyMessage = "No upcoming events scheduled at this time. Please check back later!",
  hidePast = true,
  max,
  locale = "en-GB",
  className,
}: Props) {
  // ✅ UPGRADE: Centralized reference date for safety
  const today = React.useMemo(() => {
    const t = new Date();
    // Normalize to start of day for accurate comparison
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // ✅ UPGRADE: Robust Data Filtering and Sorting
  const list = React.useMemo(() => {
    const normalized = (Array.isArray(events) ? events : [])
      .map((e) => {
        const date = parseDate(e.date);
        // Only return objects with valid Date
        return date ? { ...e, date } : null;
      })
      .filter(Boolean) as (Omit<EventItem, "date"> & { date: Date })[];

    const filtered = hidePast
      ? normalized.filter((e) => e.date >= today)
      : normalized;

    // Sort chronologically (earliest first)
    filtered.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Apply max limit
    return typeof max === "number" ? filtered.slice(0, max) : filtered;
  }, [events, hidePast, max, today]);

  const hasEvents = list.length > 0;
  const headingId = React.useId();

  // ✅ UPGRADE: Cleaned up variant styling definition
  const isDark = variant === "dark";

  const styles = React.useMemo(
    () => ({
      heading: clsx(
        "text-3xl md:text-4xl font-serif font-semibold text-center mb-10", // Added font-serif
        isDark ? "text-cream" : "text-deepCharcoal"
      ),
      card: clsx(
        "rounded-2xl p-6 shadow-xl transition-transform duration-300 hover:scale-[1.01]", // Added hover effect
        isDark
          ? "border border-white/10 bg-white/10 backdrop-blur-sm text-cream"
          : "border border-black/5 bg-white text-gray-900"
      ),
      subText: clsx(
        "text-sm",
        isDark ? "text-[color:var(--color-on-primary)/0.7]" : "text-gray-600"
      ),
      locationText: clsx(
        "mt-1 text-base",
        isDark ? "text-[color:var(--color-on-primary)/0.85]" : "text-gray-700"
      ),
      button: clsx(
        "inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-full font-medium transition duration-200",
        isDark
          ? "bg-forest text-cream hover:bg-emerald-700 focus-visible:ring-emerald-400"
          : "bg-forest text-cream hover:bg-deepCharcoal focus-visible:ring-[color:var(--color-on-secondary)/0.5]"
      ),
    }),
    [isDark]
  );

  const fmt = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [locale]
  );

  return (
    <section
      className={clsx("max-w-7xl mx-auto px-4 py-16", className)}
      role="region"
      aria-labelledby={headingId}
    >
      <motion.h2
        id={headingId}
        className={styles.heading}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {title}
      </motion.h2>

      {!hasEvents ? (
        <p className={clsx("text-center italic", styles.subText)}>
          {emptyMessage}
        </p>
      ) : (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {list.map((ev, i) => {
            const dateLabel = fmt.format(ev.date);
            const linkHref = ev.href ?? "#"; // Ensure a fallback href for Link

            return (
              <motion.article
                key={ev.id ?? `${ev.title}-${isoDate(ev.date)}`}
                className={styles.card}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
              >
                <div className={styles.subText}>
                  {/* ✅ UPGRADE: Time component and strong semantic structure */}
                  <time
                    dateTime={isoDate(ev.date)}
                    className="font-semibold tracking-wide"
                  >
                    {dateLabel}
                  </time>
                </div>

                <h3 className="text-xl font-semibold mt-2">
                  {/* ✅ UPGRADE: Wrap title in link if href exists for a larger click target */}
                  {ev.href ? (
                    <Link
                      href={linkHref}
                      className="hover:underline decoration-softGold/60 underline-offset-4"
                    >
                      {ev.title}
                    </Link>
                  ) : (
                    ev.title
                  )}
                </h3>

                {ev.location && (
                  <p className={styles.locationText}>
                    <span aria-hidden="true">📍 </span>
                    {ev.location}
                  </p>
                )}

                {ev.href && (
                  <Link
                    href={linkHref}
                    className={styles.button}
                    aria-label={`View details for the event: ${ev.title} on ${dateLabel}`} // ✅ UPGRADE: Rich ARIA label
                  >
                    Details
                    {/* SVG Arrow for visual cue */}
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </Link>
                )}
              </motion.article>
            );
          })}
        </div>
      )}
    </section>
  );
}
