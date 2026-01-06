// pages/events/[slug].tsx - COMPLETE FIXED VERSION
import React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";

import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";

import {
  getServerAllEvents,
  getServerEventBySlug,
  normalizeSlug,
  resolveDocCoverImage,
} from "@/lib/contentlayer";

import EventHero from "@/components/events/EventHero";
import EventDetails from "@/components/events/EventDetails";
import EventContent from "@/components/events/EventContent";
import EventRegistration from "@/components/events/EventRegistration";
import EventSpeakers from "@/components/events/EventSpeakers";
import EventSchedule from "@/components/events/EventSchedule";
import RelatedEvents from "@/components/events/RelatedEvents";
import ShareButtons from "@/components/ShareButtons";
import { CalendarDays, MapPin, Clock, Users } from "lucide-react";
import { mdxComponents } from "@/lib/server/md-utils"; // Add this import

// Fix the interface to include ALL properties used in the component
interface EventViewModel {
  slug: string;
  title: string;
  excerpt: string | null;
  eventDate: string | null;
  location: string | null;
  registrationUrl: string | null;
  tags: string[];
  coverImage: string;
  venue: string | null;
  endDate: string | null;
  time: string | null;
  price: string | null;
  capacity: number | null;
}

interface Props {
  event: EventViewModel;
  source: MDXRemoteSerializeResult;
}

const EventPage: NextPage<Props> = ({ event, source }) => {
  const metaDescription = event.excerpt || "An exclusive event by Abraham of London";

  const formattedDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const isPastEvent = event.eventDate ? new Date(event.eventDate) < new Date() : false;
  const canonicalUrl = `https://www.abrahamoflondon.org/events/${event.slug}`;

  return (
    <Layout>
      <Head>
        <title>{event.title} | Events | Abraham of London</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={event.coverImage || "/assets/images/event-default.jpg"} />
        <meta property="og:type" content="event" />
        <link rel="canonical" href={canonicalUrl} />
        {event.eventDate && <meta property="event:start_time" content={event.eventDate} />}
        {event.location && <meta property="event:location" content={event.location} />}
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <EventHero
          title={event.title}
          date={formattedDate}
          location={event.location}
          coverImage={event.coverImage || undefined}
          excerpt={event.excerpt}
          isPast={isPastEvent}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <main className="lg:col-span-8">
              <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
                    <CalendarDays className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-gray-600">Date</p>
                      <p className="font-semibold text-gray-900">{formattedDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm text-gray-600">Location</p>
                      <p className="font-semibold text-gray-900">{event.location || "TBA"}</p>
                    </div>
                  </div>

                  {event.time && (
                    <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
                      <Clock className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="text-sm text-gray-600">Time</p>
                        <p className="font-semibold text-gray-900">{event.time}</p>
                      </div>
                    </div>
                  )}

                  {typeof event.capacity === "number" && (
                    <div className="flex items-center space-x-3 p-4 bg-amber-50 rounded-lg">
                      <Users className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="text-sm text-gray-600">Capacity</p>
                        <p className="font-semibold text-gray-900">{event.capacity} seats</p>
                      </div>
                    </div>
                  )}
                </div>

                <EventDetails 
                  venue={event.venue || undefined} 
                  price={event.price || undefined} 
                  endDate={event.endDate || undefined} 
                />

                <div className="mt-8">
                  <EventContent>
                    <MDXRemote {...source} components={mdxComponents ?? {}} />
                  </EventContent>
                </div>

                {!isPastEvent && (
                  <div className="mt-12">
                    <EventSchedule eventId={event.slug} />
                  </div>
                )}

                <div className="mt-12">
                  <EventSpeakers eventTitle={event.title} />
                </div>

                <div className="mt-12">
                  <EventRegistration
                    isPast={isPastEvent}
                    registrationUrl={event.registrationUrl}
                    price={event.price || undefined}
                  />
                </div>

                <div className="mt-12 pt-8 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Share this event</h3>
                      <p className="text-sm text-gray-600">Spread the word with your network</p>
                    </div>
                    <ShareButtons url={canonicalUrl} title={event.title} excerpt={event.excerpt || ""} />
                  </div>
                </div>
              </div>
            </main>

            <aside className="lg:col-span-4">
              <div className="sticky top-8 space-y-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Events</h3>
                  <RelatedEvents currentEventTitle={event.title} />
                </div>

                {event.tags.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventPage;

export const getStaticPaths: GetStaticPaths = async () => {
  const events = getServerAllEvents() || [];
  const paths = events
    // tolerate different shapes, but never crash build
    .map((e: any) => normalizeSlug(e?.slug || e?._raw?.flattenedPath || ""))
    .filter((slug: string) => slug && slug !== "index" && !slug.includes("replace"))
    .map((slug: string) => ({ params: { slug } }));

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = normalizeSlug((params as any)?.slug);
  if (!slug) return { notFound: true };

  const eventData: any = getServerEventBySlug(slug);
  if (!eventData) return { notFound: true };

  const rawBody = eventData?.body?.raw ?? eventData?.body ?? "";
  const raw = typeof rawBody === "string" ? rawBody : "";

  let source: MDXRemoteSerializeResult;
  try {
    source = await serialize(raw || " ", {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    });
  } catch {
    source = await serialize("Content is being prepared.");
  }

  const event: EventViewModel = {
    slug,
    title: eventData.title || "Untitled Gathering",
    excerpt: eventData.excerpt || eventData.description || null,
    eventDate: eventData.eventDate || eventData.date || null,
    location: eventData.location || eventData.venue || null,
    registrationUrl: eventData.registrationUrl || eventData.link || null,
    tags: Array.isArray(eventData.tags) ? eventData.tags : [],
    coverImage: resolveDocCoverImage(eventData),

    // ✅ force JSON-safe values
    venue: eventData.venue ?? null,
    endDate: eventData.endDate ?? null,
    time: eventData.time ?? null,
    price: eventData.price ?? null,
    capacity: typeof eventData.capacity === "number" ? eventData.capacity : null,
  };

  return {
    props: {
      event,
      source,
    },
    revalidate: 60, // Optional: revalidate every 60 seconds
  };
};