// pages/events/index.tsx
import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";
import { getAllEvents } from "@/lib/content";
import type { Event } from "contentlayer/generated";

type EventsPageProps = {
  events: Event[];
};

const EventsPage: NextPage<EventsPageProps> = ({ events }) => {
  const safe = Array.isArray(events) ? events : [];
  const hasEvents = safe.length > 0;

  return (
    <Layout title="Events" pageTitle="Events">
      <main className="mx-auto max-w-5xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-10 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Abraham of London · Live Sessions
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            Live Sessions &amp; Rooms
          </h1>
          <p className="max-w-2xl text-sm text-gray-300">
            Curated salons, leadership workshops, and private rooms for people who are
            building lives and institutions that outlast headlines.
          </p>
        </header>

        {!hasEvents && (
          <section className="rounded-2xl border border-dashed border-gold/30 bg-charcoal-light/40 p-8 text-center text-sm text-gray-200">
            <h2 className="mb-2 font-semibold text-cream">No events live yet</h2>
            <p className="mx-auto max-w-md">
              The next set of salons and workshops is being scheduled. Join the Inner
              Circle to be first in the room when new dates drop.
            </p>
          </section>
        )}

        {hasEvents && (
          <section className="grid gap-6 md:grid-cols-2">
            {safe.map((event) => (
              <EventCard key={event.slug} event={event} />
            ))}
          </section>
        )}
      </main>
    </Layout>
  );
};

type EventCardProps = {
  event: Event;
};

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const { slug, title, excerpt, description, date, tags } = event;
  const href = `/events/${slug}`;
  const copy = description || excerpt || "";
  const displayTags = Array.isArray(tags) ? tags.slice(0, 3) : [];

  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-2xl border border-gold/25 bg-charcoal-light/60 p-5 transition hover:-translate-y-0.5 hover:border-gold/70"
    >
      <div className="flex flex-1 flex-col gap-3">
        <div className="space-y-1">
          <h2 className="font-serif text-lg font-semibold text-cream transition group-hover:text-gold">
            {title}
          </h2>
          {copy && <p className="text-xs text-gray-300 line-clamp-3">{copy}</p>}
        </div>

        <div className="mt-auto flex flex-wrap items-center gap-2 text-[0.7rem] text-gray-400">
          {date && (
            <span>
              {new Date(date).toLocaleString("en-GB", {
                year: "numeric",
                month: "short",
                day: "2-digit",
              })}
            </span>
          )}

          {displayTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {displayTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-charcoal px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.12em] text-gray-200"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
};

export const getStaticProps: GetStaticProps<EventsPageProps> = async () => {
  const events = getAllEvents();
  return {
    props: { events },
    revalidate: 3600,
  };
};

export default EventsPage;