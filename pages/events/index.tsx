/* pages/events/index.tsx — EVENTS VAULT (INTEGRITY MODE) */
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";
import { 
  getContentlayerData
} from "@/lib/content/server";

import { 
  normalizeSlug,
  sanitizeData 
} from "@/lib/content/shared";

type EventItem = {
  _id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  eventDate: string | null;
  location: string | null;
  href: string; // Integrity: strictly defined path
};

type Props = {
  upcoming: EventItem[];
  past: EventItem[];
};

function isValidDateString(value: string): boolean {
  const t = Date.parse(value);
  return Number.isFinite(t);
}

function formatDateTimeGB(value: string): string {
  if (!isValidDateString(value)) return "Date TBC";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateGB(value: string): string {
  if (!isValidDateString(value)) return "Past";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * STRATEGIC FIX: INTEGRITY MODE
 * 1. Uses getContentlayerData for absolute synchronization.
 * 2. Enforces /events/ prefix integrity for all generated links.
 */
export const getStaticProps: GetStaticProps<Props> = async () => {
  try {
    // COMMAND: Get contentlayer data for absolute build-time integrity
    const data = getContentlayerData();
    const eventsRaw = data.allEvents || [];
    
    const now = new Date();

    const events: EventItem[] = eventsRaw.map((e: any) => {
      // Resolve slug and ensure /events/ prefix
      const rawSlug = normalizeSlug(e.slugComputed || e.slug || "");
      const slug = rawSlug.replace(/^events\//, "");
      const href = `/events/${slug}`;
      
      const dateCandidate = (e.eventDate ?? e.date ?? null) as string | null;

      return {
        _id: String(e._id ?? `${slug}-${dateCandidate ?? "no-date"}`),
        slug,
        href,
        title: String(e.title ?? "Untitled Event"),
        excerpt: (e.excerpt ?? e.description ?? null) as string | null,
        eventDate: dateCandidate,
        location: (e.location ?? null) as string | null,
      };
    })
    // INTEGRITY: Only show events with valid titles and paths
    .filter(e => Boolean(e.title) && e.href.startsWith("/events/"));

    const upcoming = events
      .filter((e) => e.eventDate && isValidDateString(e.eventDate) && new Date(e.eventDate) >= now)
      .sort((a, b) => Date.parse(a.eventDate as string) - Date.parse(b.eventDate as string));

    const past = events
      .filter((e) => !e.eventDate || !isValidDateString(e.eventDate) || new Date(e.eventDate) < now)
      .sort((a, b) => Date.parse(b.eventDate ?? "") - Date.parse(a.eventDate ?? ""));

    return { 
      props: sanitizeData({ upcoming, past }), 
      revalidate: 1800 
    };
  } catch (error) {
    console.error("Events index getStaticProps failed:", error);
    return { props: { upcoming: [], past: [] }, revalidate: 1800 };
  }
};

const EventsIndexPage: NextPage<Props> = ({ upcoming, past }) => {
  return (
    <Layout title="Events">
      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-8 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Canon · Gatherings
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            Events & Rooms
          </h1>
          <p className="text-sm text-gray-300">
            Private rooms, salons and workshops designed for builders who take responsibility seriously.
          </p>
        </header>

        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-gold/70">
            Upcoming
          </h2>

          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-400">
              No upcoming events announced yet. Join the newsletter to hear first when the next room opens.
            </p>
          ) : (
            <ul className="space-y-4">
              {upcoming.map((event) => (
                <li
                  key={event._id}
                  className="rounded-2xl border border-white/5 bg-black/40 p-4 transition hover:border-gold/60 hover:bg-black/70"
                >
                  <Link href={event.href} className="block space-y-1 no-underline">
                    <p className="text-xs uppercase tracking-[0.25em] text-gold/70">
                      {event.location || "Private Room"}
                    </p>

                    <h3 className="font-serif text-lg font-semibold text-cream">
                      {event.title}
                    </h3>

                    <p className="text-xs text-gray-300">
                      {event.eventDate ? formatDateTimeGB(event.eventDate) : "Date TBC"}
                    </p>

                    {event.excerpt ? (
                      <p className="mt-2 text-sm text-gray-300">{event.excerpt}</p>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-gold/70">
            Archive
          </h2>

          {past.length === 0 ? (
            <p className="text-sm text-gray-400">
              Once the first rooms have run, they&apos;ll live here as part of the Canon archive.
            </p>
          ) : (
            <ul className="space-y-3 text-sm text-gray-400">
              {past.map((event) => (
                <li key={event._id} className="flex items-baseline gap-3">
                  <span className="w-32 shrink-0 text-xs text-gray-500">
                    {event.eventDate ? formatDateGB(event.eventDate) : "Past"}
                  </span>

                  <Link href={event.href} className="flex-1 text-cream hover:text-gold">
                    {event.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </Layout>
  );
};

export default EventsIndexPage;