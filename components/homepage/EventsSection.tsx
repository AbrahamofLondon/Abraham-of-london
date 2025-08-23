import * as React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import clsx from "clsx";

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

const DEFAULT_EVENTS: EventItem[] = [
  {
    date: "2026-09-12",
    title: "Leadership Workshop",
    location: "London, UK",
    href: "/events/leadership-workshop",
  },
  {
    date: "2026-11-11",
    title: "Fathers & Futures Panel",
    location: "Online",
    href: "/events/fathers-and-futures",
  },
];

function parseDate(d: string | Date): Date | null {
  const date = d instanceof Date ? d : new Date(d);
  return isNaN(date.getTime()) ? null : date;
}
const isoDate = (d: Date) => d.toISOString().slice(0, 10);

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
  const today = React.useMemo(() => {
    const t = new Date();
    // Normalize to start of day for comparisons
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  const list = React.useMemo(() => {
    const normalized = (Array.isArray(events) ? events : [])
      .map((e) => {
        const date = parseDate(e.date);
        return date ? { ...e, date } : null;
      })
      .filter(Boolean) as (Omit<EventItem, "date"> & { date: Date })[];

    const filtered = hidePast
      ? normalized.filter((e) => e.date >= today)
      : normalized;

    filtered.sort((a, b) => a.date.getTime() - b.date.getTime());
    return typeof max === "number" ? filtered.slice(0, max) : filtered;
  }, [events, hidePast, max, today]);

  const hasEvents = list.length > 0;
  const headingId = React.useId();

  const headingClass = clsx(
    "text-3xl md:text-4xl font-bold text-center mb-8",
    variant === "dark" ? "text-cream" : "text-gray-900"
  );
  const cardClass = clsx(
    "rounded-2xl p-6 shadow-card",
    variant === "dark"
      ? "border border-white/10 bg-white/10 backdrop-blur text-cream"
      : "border border-black/10 bg-white text-gray-900"
  );
  const subText = variant === "dark" ? "text-cream/80" : "text-gray-600";

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
      className={clsx("container px-4 py-16", className)}
      role="region"
      aria-labelledby={headingId}
    >
      <motion.h2
        id={headingId}
        className={headingClass}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        {title}
      </motion.h2>

      {!hasEvents ? (
        <p className={clsx("text-center", subText)}>{emptyMessage}</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {list.map((ev, i) => (
            <motion.article
              key={ev.id ?? `${ev.title}-${isoDate(ev.date)}`}
              className={cardClass}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
            >
              <div className={clsx("text-sm", subText)}>
                <time dateTime={isoDate(ev.date)}>{fmt.format(ev.date)}</time>
              </div>
              <h3 className="text-xl font-semibold mt-1">{ev.title}</h3>
              {ev.location && (
                <p className={clsx("mt-1", variant === "dark" ? "text-cream/80" : "text-gray-700")}>
                  {ev.location}
                </p>
              )}
              {ev.href && (
                <Link
                  href={ev.href}
                  className={clsx(
                    "inline-flex items-center mt-4 px-4 py-2 rounded-full transition",
                    variant === "dark"
                      ? "bg-forest text-cream hover:bg-emerald-700"
                      : "bg-forest text-cream hover:bg-forest/90"
                  )}
                >
                  Details
                </Link>
              )}
            </motion.article>
          ))}
        </div>
      )}
    </section>
  );
}
