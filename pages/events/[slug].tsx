import * as React from "react";
import type { GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { assertContentlayerHasDocs, getAllEvents, normalizeSlug } from "@/lib/contentlayer-helper";
import { ArrowRight, MapPin, Calendar as CalendarIcon } from "lucide-react";

/* -------------------------------------------------------------------------- */
/* TYPES                                                                      */
/* -------------------------------------------------------------------------- */

interface Event {
  slug: string;
  title: string;
  excerpt: string | null;
  eventDate: string | null;
  location: string | null;
  registrationUrl: string | null;
  tags: string[];
}

interface EventsProps {
  upcomingEvents: Event[];
  pastEvents: Event[];
}

interface EventDoc {
  title?: string;
  eventDate?: string;
  date?: string;
  excerpt?: string;
  description?: string;
  location?: string;
  venue?: string;
  registrationUrl?: string;
  link?: string;
  tags?: string[];
  [key: string]: any;
}

/* -------------------------------------------------------------------------- */
/* DATA FETCHING                                                              */
/* -------------------------------------------------------------------------- */

export const getStaticProps: GetStaticProps<EventsProps> = async () => {
  // FIXED: No arguments as per updated helper signature
  assertContentlayerHasDocs();

  const eventsRaw = (getAllEvents() as unknown as EventDoc[]) || [];
  const now = new Date();

  const processedEvents = eventsRaw
    .map((e) => {
      const dateStr = e.eventDate ?? e.date ?? null;
      let parsedDate: Date | null = null;

      if (dateStr) {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) parsedDate = d;
      }

      return {
        slug: normalizeSlug(e),
        title: e.title ?? "Untitled Gathering",
        excerpt: e.excerpt ?? e.description ?? null,
        eventDate: dateStr,
        location: e.location ?? e.venue ?? null,
        registrationUrl: e.registrationUrl ?? e.link ?? null,
        tags: Array.isArray(e.tags) ? e.tags : [],
        _parsedDate: parsedDate,
      };
    })
    .filter((e) => e.slug && e.title);

  // Principled Sorting: Sequential timeline
  const sorted = [...processedEvents].sort((a, b) => {
    const timeA = a._parsedDate?.getTime() ?? 0;
    const timeB = b._parsedDate?.getTime() ?? 0;
    return timeA - timeB;
  });

  const upcomingEvents = sorted
    .filter((e) => e._parsedDate && e._parsedDate >= now)
    .map(({ _parsedDate, ...rest }) => rest);

  const pastEvents = sorted
    .filter((e) => e._parsedDate && e._parsedDate < now)
    .reverse() // Most recent past events first
    .map(({ _parsedDate, ...rest }) => rest);

  return {
    props: {
      upcomingEvents,
      pastEvents,
    },
    revalidate: 3600,
  };
};

/* -------------------------------------------------------------------------- */
/* PAGE COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

const EventsIndexPage: NextPage<EventsProps> = ({ upcomingEvents, pastEvents }) => {
  const title = "Strategic Gatherings";
  const description = "Private sessions and exclusive gatherings for those building the future.";

  return (
    <Layout title={title} description={description}>
      <Head>
        <title>{title} | Abraham of London</title>
      </Head>

      <main className="min-h-screen bg-[#050607] text-white">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-white/5 py-20 lg:py-32">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent" />
          <div className="container relative mx-auto max-w-7xl px-6">
            <div className="max-w-3xl">
              <p className="mb-4 text-[10px] font-black uppercase tracking-[0.4em] text-gold/80">
                Institutional Access
              </p>
              <h1 className="mb-6 font-serif text-5xl font-light italic leading-tight text-cream sm:text-7xl">
                Strategic <span className="text-white/40">Intelligence Sessions</span>
              </h1>
              <p className="text-lg leading-relaxed text-gray-400">
                Gated gatherings designed for high-agency individuals. We focus on structural clarity, civilisational resilience, and sovereign coordination.
              </p>
            </div>
          </div>
        </section>

        <div className="container mx-auto max-w-7xl px-6 py-16">
          <div className="space-y-24">
            {/* UPCOMING */}
            <section>
              <div className="mb-10 flex items-end justify-between border-b border-white/5 pb-6">
                <h2 className="font-serif text-3xl text-cream">Upcoming Calendars</h2>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                  {upcomingEvents.length} Active Intakes
                </div>
              </div>

              {upcomingEvents.length > 0 ? (
                <div className="grid gap-8 lg:grid-cols-2">
                  {upcomingEvents.map((event) => (
                    <EventCard key={event.slug} event={event} variant="upcoming" />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-white/5 bg-white/[0.01] p-12 text-center">
                  <p className="text-gray-500 italic">No public sessions currently scheduled.</p>
                  <Link href="/inner-circle" className="mt-4 inline-block text-xs font-bold uppercase tracking-widest text-gold hover:underline">
                    Inquire via Inner Circle →
                  </Link>
                </div>
              )}
            </section>

            {/* PAST */}
            {pastEvents.length > 0 && (
              <section>
                <div className="mb-10 border-b border-white/5 pb-6">
                  <h2 className="font-serif text-2xl text-white/60">Archive of Sessions</h2>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {pastEvents.map((event) => (
                    <EventCard key={event.slug} event={event} variant="past" />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
};

/* -------------------------------------------------------------------------- */
/* SUB-COMPONENTS                                                             */
/* -------------------------------------------------------------------------- */

function EventCard({ event, variant }: { event: Event; variant: "upcoming" | "past" }) {
  const dateObj = event.eventDate ? new Date(event.eventDate) : null;
  const dateDisplay = dateObj?.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border p-8 transition-all duration-500 ${
        variant === "upcoming"
          ? "border-gold/20 bg-white/[0.02] hover:border-gold/40 hover:bg-white/[0.04]"
          : "border-white/5 bg-transparent grayscale hover:grayscale-0"
      }`}
    >
      <div className="relative z-10">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-gold/60">
            <CalendarIcon className="h-3 w-3" />
            {dateDisplay}
          </div>
          {variant === "upcoming" && (
            <span className="animate-pulse rounded-full bg-gold/10 px-2 py-1 text-[8px] font-black uppercase tracking-tighter text-gold">
              In-Flow
            </span>
          )}
        </div>

        <h3 className="mb-4 font-serif text-2xl text-cream group-hover:text-gold transition-colors">
          {event.title}
        </h3>

        {event.location && (
          <div className="mb-4 flex items-center gap-2 text-xs text-gray-500">
            <MapPin className="h-3 w-3" />
            {event.location}
          </div>
        )}

        <p className="mb-8 text-sm leading-relaxed text-gray-400 line-clamp-2">
          {event.excerpt}
        </p>

        {variant === "upcoming" ? (
          event.registrationUrl ? (
            <a
              href={event.registrationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-black transition-transform active:scale-95"
            >
              Request Access <ArrowRight className="h-3 w-3" />
            </a>
          ) : (
            <button disabled className="w-full rounded-lg border border-white/10 px-6 py-3 text-xs font-bold uppercase tracking-[0.2em] text-gray-600">
              Session Full
            </button>
          )
        ) : (
          <Link
            href={`/events/${event.slug}`}
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
          >
            Review Record <ArrowRight className="h-3 w-3" />
          </Link>
        )}
      </div>
    </article>
  );
}

export default EventsIndexPage;