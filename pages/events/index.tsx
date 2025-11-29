// pages/events/index.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

import Layout from "@/components/Layout";
import { getPageTitle } from "@/lib/siteConfig";
import { getAllEventsSafe } from "@/lib/events";
import { resolveCoverImage } from "@/lib/utils";

interface EventListing {
  slug: string;
  title: string;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  description?: string | null;
  heroImage?: string | null;
  coverImage?: string | null;
  tags?: string[];
}

interface EventsPageProps {
  events: EventListing[];
}

export default function EventsPage({ events }: EventsPageProps) {
  const pageTitle = "Events & Gatherings";

  // Sort events by date (most recent first)
  const sortedEvents = React.useMemo(() => {
    return [...events].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateB - dateA;
    });
  }, [events]);

  // Separate into upcoming and past events
  const now = new Date();
  const upcomingEvents = sortedEvents.filter((event) => {
    if (!event.date) return false;
    return new Date(event.date) >= now;
  });

  const pastEvents = sortedEvents.filter((event) => {
    if (!event.date) return false;
    return new Date(event.date) < now;
  });

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{getPageTitle(pageTitle)}</title>
        <meta
          name="description"
          content="Join Abraham of London for exclusive events, workshops, and gatherings. From Founder Salons to Fatherhood Circles, experience transformative conversations in intimate settings."
        />
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-charcoal to-black">
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-gold/20">
          <div className="absolute inset-0 bg-gradient-to-br from-gold/5 via-transparent to-amber-200/5" />
          <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="text-center">
              <motion.h1
                className="mb-6 font-serif text-4xl font-bold text-cream sm:text-5xl lg:text-6xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                Events &amp; Gatherings
              </motion.h1>
              <motion.p
                className="mx-auto max-w-2xl text-lg leading-relaxed text-gold/70"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Intimate conversations, transformative workshops, and strategic
                gatherings for founders, fathers, and leaders committed to
                legacy and impact.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="mb-4 font-serif text-3xl font-bold text-cream">
                Upcoming Events
              </h2>
              <p className="max-w-2xl text-gold/70">
                Join us for these upcoming gatherings. Spaces are intentionally
                limited to ensure meaningful conversation and connection.
              </p>
            </div>

            {upcomingEvents.length > 0 ? (
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {upcomingEvents.map((event, index) => (
                  <EventCard key={event.slug} event={event} index={index} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-gold/20 bg-gold/5 p-12 text-center">
                <h3 className="mb-4 font-serif text-xl font-semibold text-cream">
                  No Upcoming Events Scheduled
                </h3>
                <p className="mx-auto mb-6 max-w-md text-gold/70">
                  New events are being planned. Join our newsletter to be the
                  first to know about upcoming gatherings, workshops, and
                  salons.
                </p>
                <Link
                  href="/newsletter"
                  className="inline-flex items-center rounded-xl bg-gold px-6 py-3 font-semibold text-charcoal transition-all hover:bg-amber-200"
                >
                  Join Newsletter
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <section className="border-t border-gold/20 py-16">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="mb-12">
                <h2 className="mb-4 font-serif text-3xl font-bold text-cream">
                  Past Events
                </h2>
                <p className="max-w-2xl text-gold/70">
                  Browse through our previous gatherings and conversations. Many
                  of these events recur seasonally or inform future programming.
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {pastEvents.map((event, index) => (
                  <EventCard
                    key={event.slug}
                    event={event}
                    index={index}
                    isPast
                  />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="border-t border-gold/20 py-16">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-gold/10 p-12">
              <h2 className="mb-4 font-serif text-3xl font-bold text-cream">
                Host Your Own Gathering
              </h2>
              <p className="mx-auto mb-8 max-w-2xl text-lg leading-relaxed text-gold/70">
                Interested in bringing Abraham of London to your organization,
                board, or community for a private event or workshop?
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-xl bg-gold px-8 py-4 font-semibold text-charcoal transition-all hover:bg-amber-200"
                >
                  Discuss Private Event
                </Link>
                <Link
                  href="/chatham-rooms"
                  className="inline-flex items-center rounded-xl border border-gold px-8 py-4 font-semibold text-gold transition-all hover:bg-gold/10"
                >
                  Learn About Chatham Rooms
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

// Event Card Component
function EventCard({
  event,
  index,
  isPast = false,
}: {
  event: EventListing;
  index: number;
  isPast?: boolean;
}) {
  const displayDate = event.date
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(event.date))
    : null;

  const hasImage = !!(event.heroImage || event.coverImage);
  const imageSrc = event.heroImage || event.coverImage || undefined;

  return (
    <motion.article
      className="group overflow-hidden rounded-2xl border border-gold/20 bg-charcoal/60 backdrop-blur-sm transition-all hover:border-gold/40 hover:bg-charcoal/70"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ y: -5 }}
    >
      <Link href={`/events/${event.slug}`} className="block">
        {hasImage && imageSrc && (
          <div className="relative h-48 overflow-hidden">
            <Image
              src={imageSrc}
              alt={event.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 to-transparent" />
            {isPast && (
              <div className="absolute right-4 top-4 rounded-full bg-charcoal/90 px-3 py-1 text-xs font-semibold text-gold">
                Past Event
              </div>
            )}
          </div>
        )}

        <div className="p-6">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gold">
            {displayDate && <span>{displayDate}</span>}
            {event.time && (
              <>
                <span className="text-gold/50">•</span>
                <span>{event.time}</span>
              </>
            )}
          </div>

          <h3 className="mb-3 font-serif text-xl font-semibold leading-tight text-cream transition-colors group-hover:text-gold">
            {event.title}
          </h3>

          {event.location && (
            <p className="mb-3 flex items-center gap-2 text-sm text-gold/70">
              <span>📍</span>
              {event.location}
            </p>
          )}

          {event.description && (
            <p className="line-clamp-3 text-sm leading-relaxed text-gold/60">
              {event.description}
            </p>
          )}

          {event.tags && event.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {event.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gold/10 px-2.5 py-1 text-xs text-gold"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-4 flex items-center justify-between">
            <span className="text-sm font-semibold text-gold group-hover:underline">
              View Details →
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}

// Static Generation – now uses getAllEventsSafe + resolveCoverImage
export async function getStaticProps() {
  try {
    const rawEvents = getAllEventsSafe();

    const safeString = (value: unknown): string | null =>
      typeof value === "string" ? value : null;

    const events: EventListing[] = rawEvents
      .map<EventListing | null>((event) => {
        const slug = safeString(event.slug) || "";
        if (!slug) return null;

        const resolvedImage = resolveCoverImage(event);

        const heroImage = safeString(event.heroImage) || resolvedImage;
        const coverImage = safeString(event.coverImage) || resolvedImage;

        return {
          slug,
          title: safeString(event.title) || "Untitled Event",
          date: safeString(event.date),
          time: safeString(event.time),
          location: safeString(event.location),
          description:
            safeString(event.description) || safeString(event.excerpt) || null,
          heroImage,
          coverImage,
          tags: Array.isArray(event.tags)
            ? event.tags.filter((tag): tag is string => typeof tag === "string")
            : [],
        };
      })
      .filter((ev): ev is EventListing => ev !== null);

    return {
      props: {
        events,
      },
      revalidate: 3600,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error generating events page:", error);
    return {
      props: {
        events: [],
      },
      revalidate: 3600,
    };
  }
}
