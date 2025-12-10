import * as React from "react";
import type {
  GetStaticProps,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import Link from "next/link";

import Layout from "@/components/Layout";
import { getAllEvents } from "@/lib/contentlayer-helper";
import type { Event } from "contentlayer/generated";

type Props = {
  upcoming: Event[];
  past: Event[];
};

export const getStaticProps: GetStaticProps<Props> = async () => {
  const events = getAllEvents().filter((e) => !(e as any).draft);
  const now = new Date();

  const upcoming = events
    .filter((e) => e.eventDate && new Date(e.eventDate) >= now)
    .sort(
      (a, b) =>
        new Date(a.eventDate || "").getTime() -
        new Date(b.eventDate || "").getTime(),
    );

  const past = events
    .filter((e) => !e.eventDate || new Date(e.eventDate) < now)
    .sort(
      (a, b) =>
        new Date(b.eventDate || "").getTime() -
        new Date(a.eventDate || "").getTime(),
    );

  return {
    props: { upcoming, past },
    revalidate: 1800,
  };
};

const EventsIndexPage: NextPage<
  InferGetStaticPropsType<typeof getStaticProps>
> = ({ upcoming, past }) => {
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
            Private rooms, salons and workshops designed for builders who take
            responsibility seriously.
          </p>
        </header>

        {/* Upcoming */}
        <section className="space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-gold/70">
            Upcoming
          </h2>

          {upcoming.length === 0 && (
            <p className="text-sm text-gray-400">
              No upcoming events announced yet. Join the newsletter to hear
              first when the next room opens.
            </p>
          )}

          {upcoming.length > 0 && (
            <ul className="space-y-4">
              {upcoming.map((event) => (
                <li
                  key={event._id}
                  className="rounded-2xl border border-white/5 bg-black/40 p-4 transition hover:border-gold/60 hover:bg-black/70"
                >
                  <Link
                    href={`/events/${event.slug}`}
                    className="block space-y-1 no-underline"
                  >
                    <p className="text-xs uppercase tracking-[0.25em] text-gold/70">
                      {event.location || "Private Room"}
                    </p>
                    <h3 className="font-serif text-lg font-semibold text-cream">
                      {event.title ?? "Untitled Event"}
                    </h3>
                    <p className="text-xs text-gray-300">
                      {event.eventDate
                        ? new Date(event.eventDate).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Date TBC"}
                    </p>
                    {event.excerpt && (
                      <p className="mt-2 text-sm text-gray-300">
                        {event.excerpt}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Archive */}
        <section className="mt-10 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-gold/70">
            Archive
          </h2>

          {past.length === 0 && (
            <p className="text-sm text-gray-400">
              Once the first rooms have run, they’ll live here as part of the
              Canon archive.
            </p>
          )}

          {past.length > 0 && (
            <ul className="space-y-3 text-sm text-gray-400">
              {past.map((event) => (
                <li key={event._id} className="flex items-baseline gap-3">
                  <span className="w-32 shrink-0 text-xs text-gray-500">
                    {event.eventDate
                      ? new Date(event.eventDate).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "Past"}
                  </span>
                  <Link
                    href={`/events/${event.slug}`}
                    className="flex-1 text-cream hover:text-gold"
                  >
                    {event.title ?? "Untitled Event"}
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