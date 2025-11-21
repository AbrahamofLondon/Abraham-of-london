// pages/events/index.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import Layout from "@/components/Layout";
import { getPageTitle } from "@/lib/siteConfig";
import { getEventSlugs, getEventBySlug } from "@/lib/events";

interface EventListing {
  slug: string;
  title: string;
  date?: string;
  time?: string;
  location?: string;
  description?: string;
  heroImage?: string;
  coverImage?: string;
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
      return dateB - dateA; // Most recent first
    });
  }, [events]);

  // Separate into upcoming and past events
  const now = new Date();
  const upcomingEvents = sortedEvents.filter(event => {
    if (!event.date) return false;
    return new Date(event.date) >= now;
  });
  
  const pastEvents = sortedEvents.filter(event => {
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
                className="font-serif text-4xl font-bold text-cream sm:text-5xl lg:text-6xl mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                Events & Gatherings
              </motion.h1>
              <motion.p 
                className="mx-auto max-w-2xl text-lg text-gold/70 leading-relaxed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                Intimate conversations, transformative workshops, and strategic gatherings 
                for founders, fathers, and leaders committed to legacy and impact.
              </motion.p>
            </div>
          </div>
        </section>

        {/* Upcoming Events */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="font-serif text-3xl font-bold text-cream mb-4">
                Upcoming Events
              </h2>
              <p className="text-gold/70 max-w-2xl">
                Join us for these upcoming gatherings. Spaces are intentionally limited 
                to ensure meaningful conversation and connection.
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
                <h3 className="font-serif text-xl font-semibold text-cream mb-4">
                  No Upcoming Events Scheduled
                </h3>
                <p className="text-gold/70 mb-6 max-w-md mx-auto">
                  New events are being planned. Join our newsletter to be the first 
                  to know about upcoming gatherings, workshops, and salons.
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
          <section className="py-16 border-t border-gold/20">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="mb-12">
                <h2 className="font-serif text-3xl font-bold text-cream mb-4">
                  Past Events
                </h2>
                <p className="text-gold/70 max-w-2xl">
                  Browse through our previous gatherings and conversations. 
                  Many of these events recur seasonally or inform future programming.
                </p>
              </div>

              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {pastEvents.map((event, index) => (
                  <EventCard key={event.slug} event={event} index={index} isPast={true} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 border-t border-gold/20">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
            <div className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-gold/10 p-12">
              <h2 className="font-serif text-3xl font-bold text-cream mb-4">
                Host Your Own Gathering
              </h2>
              <p className="text-gold/70 mb-8 max-w-2xl mx-auto text-lg leading-relaxed">
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
function EventCard({ event, index, isPast = false }: { event: EventListing; index: number; isPast?: boolean }) {
  const displayDate = event.date 
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(new Date(event.date))
    : null;

  const hasImage = event.heroImage || event.coverImage;
  const imageSrc = event.heroImage || event.coverImage;

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
              <div className="absolute top-4 right-4 rounded-full bg-charcoal/90 px-3 py-1 text-xs font-semibold text-gold">
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

          <h3 className="font-serif text-xl font-semibold text-cream mb-3 leading-tight group-hover:text-gold transition-colors">
            {event.title}
          </h3>

          {event.location && (
            <p className="text-sm text-gold/70 mb-3 flex items-center gap-2">
              <span>📍</span>
              {event.location}
            </p>
          )}

          {event.description && (
            <p className="text-sm text-gold/60 leading-relaxed line-clamp-3">
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

// Static Generation
export async function getStaticProps() {
  try {
    const slugs = await getEventSlugs();
    const events: EventListing[] = [];

    for (const slug of slugs) {
      try {
        const event = await getEventBySlug(slug);
        if (event) {
          // Helper function to safely convert unknown to string or undefined
          const safeString = (value: unknown): string | undefined => {
            return typeof value === 'string' ? value : undefined;
          };

          events.push({
            slug: safeString(event.slug) || slug,
            title: safeString(event.title) || 'Untitled Event',
            date: safeString(event.date) || safeString(event.startDate),
            time: safeString(event.time),
            location: safeString(event.location) || safeString(event.venue),
            description: safeString(event.description) || safeString(event.excerpt),
            heroImage: safeString(event.heroImage),
            coverImage: safeString(event.coverImage),
            tags: Array.isArray(event.tags) 
              ? event.tags.map(tag => safeString(tag)).filter((tag): tag is string => tag !== undefined)
              : undefined,
          });
        }
      } catch (error) {
        console.warn(`Failed to load event ${slug}:`, error);
      }
    }

    return {
      props: {
        events,
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    console.error('Error generating events page:', error);
    return {
      props: {
        events: [],
      },
      revalidate: 3600,
    };
  }
}