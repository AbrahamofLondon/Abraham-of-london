/* pages/events/index.tsx — EVENTS REGISTRY (INSTITUTIONAL) */
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";
import { getContentlayerData } from "@/lib/content/server";
import { normalizeSlug, sanitizeData } from "@/lib/content/shared";

type EventItem = {
  _id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  eventDate: string | null;
  location: string | null;
  href: string;
  mode?: "online" | "in-person" | "hybrid" | null;
  capacity?: number | null;
  duration?: string | null;
};

type Props = {
  upcoming: EventItem[];
  past: EventItem[];
  tbc: EventItem[];
};

function safeParseDate(input: string | null): Date | null {
  if (!input) return null;

  // If it's a clean YYYY-MM-DD, force UTC midnight to avoid local TZ shifting.
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const d = new Date(`${input}T00:00:00.000Z`);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(input);
  return isNaN(d.getTime()) ? null : d;
}

function startOfToday(now = new Date()): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Conservative “past”: only if event day is strictly before today (local).
function isPastEvent(date: Date, now = new Date()): boolean {
  const today = startOfToday(now);
  const eventDay = new Date(date);
  eventDay.setHours(0, 0, 0, 0);
  return eventDay.getTime() < today.getTime();
}

function formatDateTimeGB(value: string): string {
  const d = safeParseDate(value);
  if (!d) return "Date TBC";

  // If no time exists (YYYY-MM-DD), don’t fake a time
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  return d.toLocaleString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateGB(value: string): string {
  const d = safeParseDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function modeLabel(mode?: EventItem["mode"]): string | null {
  if (!mode) return null;
  return mode === "online" ? "Virtual" : mode === "in-person" ? "In Person" : "Hybrid";
}

export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    const data = getContentlayerData();
    const eventsRaw = data.allEvents || [];
    const now = new Date();

    const events: Array<EventItem & { __date: Date | null; __past: boolean; __tbc: boolean }> = (eventsRaw as any[])
      .map((e: any) => {
        const rawSlug = normalizeSlug(e.slugComputed || e.slug || "");
        const slug = rawSlug.replace(/^events\//, "");
        const href = `/events/${slug}`;

        const dateCandidate = (e.eventDate ?? e.date ?? null) as string | null;
        const parsed = safeParseDate(dateCandidate);
        const tbc = !parsed;

        const cap = typeof e.capacity === "number" ? e.capacity : null;

        const item: EventItem & { __date: Date | null; __past: boolean; __tbc: boolean } = {
          _id: String(e._id ?? `${slug}-${dateCandidate ?? "no-date"}`),
          slug,
          href,
          title: String(e.title ?? "Untitled Event"),
          excerpt: (e.excerpt ?? e.description ?? null) as string | null,
          eventDate: dateCandidate,
          location: (e.location ?? null) as string | null,
          mode: (e.mode ?? null) as "online" | "in-person" | "hybrid" | null,
          capacity: cap,
          duration: (typeof e.duration === "string" ? e.duration : null) as string | null,
          __date: parsed,
          __past: parsed ? isPastEvent(parsed, now) : false,
          __tbc: tbc,
        };

        return item;
      })
      .filter((e) => Boolean(e.title) && e.href.startsWith("/events/") && Boolean(e.slug));

    // Scheduled (dated + not past)
    const upcoming = events
      .filter((e) => e.__date && !e.__past)
      .sort((a, b) => (a.__date as Date).getTime() - (b.__date as Date).getTime())
      .map(({ __date, __past, __tbc, ...rest }) => rest);

    // Archive (dated + past)
    const past = events
      .filter((e) => e.__date && e.__past)
      .sort((a, b) => (b.__date as Date).getTime() - (a.__date as Date).getTime())
      .map(({ __date, __past, __tbc, ...rest }) => rest);

    // TBC (no date or invalid date)
    const tbc = events
      .filter((e) => e.__tbc)
      .sort((a, b) => String(a.title).localeCompare(String(b.title)))
      .map(({ __date, __past, __tbc, ...rest }) => rest);

    return {
      props: sanitizeData({ upcoming, past, tbc }),
      revalidate: 1800,
    };
  } catch (error) {
    console.error("Events index getStaticProps failed:", error);
    return { props: { upcoming: [], past: [], tbc: [] }, revalidate: 1800 };
  }
};

const EventsIndexPage: NextPage<Props> = ({ upcoming, past, tbc }) => {
  return (
    <Layout title="Events & Gatherings">
      {/* Layout already renders <main> — do NOT nest another <main> */}
      <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:py-24">
        <header className="mb-16 border-b border-white/5 pb-12">
          <div className="mb-3">
            <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-amber-500/50">
              Institutional Calendar
            </span>
          </div>

          <h1 className="font-serif text-5xl font-light italic text-white mb-6 tracking-tight">
            Events & Gatherings
          </h1>

          <p className="text-base text-white/40 leading-relaxed max-w-2xl">
            Private sessions and strategic briefings. Attendance is by verification only.
            If you are registered, you belong here.
          </p>
        </header>

        {/* SCHEDULED */}
        <section className="mb-20">
          <div className="mb-8">
            <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-white/30">Scheduled</h2>
          </div>

          {upcoming.length === 0 && tbc.length === 0 ? (
            <div className="border-l border-white/5 pl-8 py-6">
              <p className="text-sm text-white/30">
                No sessions currently scheduled. Announcements are made via institutional channels.
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {upcoming.map((event) => (
                <article key={event._id} className="group">
                  <Link
                    href={event.href}
                    className="block border-l border-white/5 pl-8 py-2 transition-colors hover:border-white/20"
                  >
                    <div className="mb-4">
                      <time className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/30">
                        {event.eventDate ? formatDateTimeGB(event.eventDate) : "Date to be confirmed"}
                      </time>
                    </div>

                    <h3 className="font-serif text-2xl font-light text-white mb-3 group-hover:text-white/80 transition-colors">
                      {event.title}
                    </h3>

                    {event.excerpt && (
                      <p className="text-sm text-white/40 leading-relaxed mb-4 max-w-2xl">
                        {event.excerpt}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/30">
                      {event.location && <span className="font-mono uppercase tracking-wider">{event.location}</span>}
                      {modeLabel(event.mode) && (
                        <span className="font-mono uppercase tracking-wider">{modeLabel(event.mode)}</span>
                      )}
                      {event.duration && <span className="font-mono uppercase tracking-wider">{event.duration}</span>}
                      {event.capacity ? (
                        <span className="font-mono uppercase tracking-wider">Limited to {event.capacity}</span>
                      ) : null}
                    </div>
                  </Link>
                </article>
              ))}

              {tbc.length > 0 && (
                <div className="pt-6 border-t border-white/5">
                  <div className="mb-6">
                    <h3 className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/20">
                      Date TBC
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {tbc.map((event) => (
                      <Link
                        key={event._id}
                        href={event.href}
                        className="group block border-l border-white/5 pl-8 py-2 hover:border-white/15 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-2">
                          <span className="text-sm text-white/55 group-hover:text-white/70 transition-colors">
                            {event.title}
                          </span>
                          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/20">
                            Awaiting schedule
                          </span>
                        </div>
                        {event.excerpt ? (
                          <p className="mt-2 text-xs text-white/30 leading-relaxed max-w-2xl line-clamp-2">
                            {event.excerpt}
                          </p>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* ARCHIVE */}
        {past.length > 0 && (
          <section>
            <div className="mb-8 border-t border-white/5 pt-12">
              <h2 className="text-xs font-mono uppercase tracking-[0.25em] text-white/30">Archive</h2>
            </div>

            <div className="space-y-1">
              {past.map((event) => (
                <Link
                  key={event._id}
                  href={event.href}
                  className="group flex items-baseline gap-8 py-3 border-l border-transparent hover:border-white/10 pl-8 transition-colors"
                >
                  <time className="text-xs font-mono text-white/20 uppercase tracking-wider shrink-0 w-40">
                    {event.eventDate ? formatDateGB(event.eventDate) : "—"}
                  </time>

                  <span className="text-sm text-white/40 group-hover:text-white/60 transition-colors flex-1">
                    {event.title}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        <footer className="mt-24 pt-12 border-t border-white/5">
          <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/20 text-center">
            Registry Managed by Institutional Protocol
          </p>
        </footer>
      </div>
    </Layout>
  );
};

export default EventsIndexPage;