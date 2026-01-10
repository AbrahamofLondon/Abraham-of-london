// pages/events/[slug].tsx - COMPLETE FIXED VERSION
import React, { useState, useEffect } from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
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
  getContentlayerData
} from "@/lib/contentlayer-compat";

import EventHero from "@/components/events/EventHero";
import EventDetails from "@/components/events/EventDetails";
import EventContent from "@/components/events/EventContent";
import EventRegistration from "@/components/events/EventRegistration";
import EventSpeakers from "@/components/events/EventSpeakers";
import EventSchedule from "@/components/events/EventSchedule";
import RelatedEvents from "@/components/events/RelatedEvents";
import ShareButtons from "@/components/ShareButtons";
import { 
  CalendarDays, 
  MapPin, 
  Clock, 
  Users, 
  ChevronLeft, 
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Ticket
} from "lucide-react";
import { mdxComponents } from "@/lib/server/md-utils";

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
  speaker?: string;
  category?: string;
}

interface Props {
  event: EventViewModel;
  source: MDXRemoteSerializeResult;
}

const EventPage: NextPage<Props> = ({ event, source }) => {
  const router = useRouter();
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isPastEvent, setIsPastEvent] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check bookmarks
      try {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarkedEvents') || '[]');
        setIsBookmarked(bookmarks.includes(event.slug));
      } catch (error) {
        console.error('Error parsing bookmarks:', error);
        localStorage.setItem('bookmarkedEvents', '[]');
      }

      // Check if event is past
      const isPast = event.eventDate ? new Date(event.eventDate) < new Date() : false;
      setIsPastEvent(isPast);
    }
  }, [event.slug, event.eventDate]);

  const handleBookmark = () => {
    if (typeof window !== 'undefined') {
      try {
        const bookmarks = JSON.parse(localStorage.getItem('bookmarkedEvents') || '[]');
        
        if (isBookmarked) {
          const updated = bookmarks.filter((slug: string) => slug !== event.slug);
          localStorage.setItem('bookmarkedEvents', JSON.stringify(updated));
          setIsBookmarked(false);
        } else {
          bookmarks.push(event.slug);
          localStorage.setItem('bookmarkedEvents', JSON.stringify(bookmarks));
          setIsBookmarked(true);
        }
      } catch (error) {
        console.error('Error updating bookmarks:', error);
      }
    }
  };

  const metaDescription = event.excerpt || "An exclusive event by Abraham of London";
  const canonicalUrl = `https://abrahamoflondon.com/events/${event.slug}`;

  const formattedDate = event.eventDate
    ? new Date(event.eventDate).toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const formattedTime = event.time || "Time TBA";
  const locationText = event.location || "Venue TBA";

  return (
    <Layout>
      <Head>
        <title>{event.title} | Events | Abraham of London</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={event.coverImage || "/assets/images/event-default.jpg"} />
        <meta property="og:type" content="event" />
        <meta property="og:url" content={canonicalUrl} />
        {event.eventDate && <meta property="event:start_time" content={event.eventDate} />}
        {event.location && <meta property="event:location" content={event.location} />}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={event.title} />
        <meta name="twitter:description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
      </Head>

      {/* Navigation */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ChevronLeft className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" />
            Back to Events
          </button>
        </div>
      </div>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100">
        <EventHero
          title={event.title}
          date={formattedDate}
          location={locationText}
          coverImage={event.coverImage || undefined}
          excerpt={event.excerpt}
          isPast={isPastEvent}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            <main className="lg:col-span-8">
              <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 lg:p-12">
                {/* Action buttons */}
                <div className="flex flex-wrap gap-4 mb-8">
                  <button
                    onClick={handleBookmark}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isBookmarked 
                        ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30' 
                        : 'bg-gray-100 text-gray-700 border border-gray-200 hover:border-amber-500/30 hover:text-amber-600'
                    }`}
                  >
                    {isBookmarked ? (
                      <>
                        <BookmarkCheck className="w-4 h-4" />
                        <span className="text-sm font-medium">Saved</span>
                      </>
                    ) : (
                      <>
                        <Bookmark className="w-4 h-4" />
                        <span className="text-sm font-medium">Save Event</span>
                      </>
                    )}
                  </button>
                  {!isPastEvent && event.registrationUrl && (
                    <a
                      href={event.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      <Ticket className="w-4 h-4" />
                      <span className="text-sm font-medium">Register Now</span>
                    </a>
                  )}
                </div>

                {/* Event metadata cards */}
                <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl">
                    <CalendarDays className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Date</p>
                      <p className="font-semibold text-gray-900 text-sm">{formattedDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-xl">
                    <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Location</p>
                      <p className="font-semibold text-gray-900 text-sm">{locationText}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl">
                    <Clock className="w-5 h-5 text-purple-600 flex-shrink-0" />
                    <div>
                      <p className="text-xs text-gray-600 font-medium">Time</p>
                      <p className="font-semibold text-gray-900 text-sm">{formattedTime}</p>
                    </div>
                  </div>

                  {typeof event.capacity === "number" && (
                    <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-xl">
                      <Users className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Capacity</p>
                        <p className="font-semibold text-gray-900 text-sm">{event.capacity} seats</p>
                      </div>
                    </div>
                  )}
                </div>

                <EventDetails 
                  venue={event.venue || undefined} 
                  price={event.price || undefined} 
                  endDate={event.endDate || undefined}
                  speaker={event.speaker}
                  category={event.category}
                />

                <div className="mt-8 prose prose-gray max-w-none">
                  <EventContent>
                    <MDXRemote {...source} components={mdxComponents ?? {}} />
                  </EventContent>
                </div>

                {/* Tags */}
                {event.tags.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200">
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <span
                          key={`${tag}-${index}`}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-full border border-gray-200 hover:bg-gray-200 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

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
                    <ShareButtons 
                      url={canonicalUrl} 
                      title={event.title} 
                      excerpt={event.excerpt || ""} 
                    />
                  </div>
                </div>
              </div>
            </main>

            <aside className="lg:col-span-4">
              <div className="sticky top-24 space-y-6">
                {/* Related Events */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Events</h3>
                  <RelatedEvents currentEventTitle={event.title} />
                </div>

                {/* Event Details */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Details</h3>
                  <div className="space-y-4">
                    {event.venue && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Venue</p>
                        <p className="text-gray-900 font-medium">{event.venue}</p>
                      </div>
                    )}
                    {event.price && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Price</p>
                        <p className="text-gray-900 font-medium">{event.price}</p>
                      </div>
                    )}
                    {event.speaker && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Featured Speaker</p>
                        <p className="text-gray-900 font-medium">{event.speaker}</p>
                      </div>
                    )}
                    {event.category && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Category</p>
                        <p className="text-gray-900 font-medium">{event.category}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Add to Calendar */}
                {!isPastEvent && event.eventDate && (
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-lg p-6 border border-blue-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Add to Calendar</h3>
                    <div className="space-y-3">
                      <button className="w-full px-4 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-3">
                        <CalendarDays className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium">Google Calendar</span>
                      </button>
                      <button className="w-full px-4 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-3">
                        <CalendarDays className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium">Apple Calendar</span>
                      </button>
                      <button className="w-full px-4 py-3 bg-white text-gray-700 rounded-lg border border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center gap-3">
                        <CalendarDays className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium">Outlook</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Newsletter CTA */}
                <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl shadow-lg p-6 border border-amber-200">
                  <div className="text-center">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/20 mb-4">
                      <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Never Miss an Event
                    </h3>
                    <p className="text-sm text-gray-600 mb-6">
                      Get notified about upcoming events and exclusive invitations.
                    </p>
                    <button
                      onClick={() => router.push('/newsletter')}
                      className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-lg hover:from-amber-400 hover:to-amber-500 transition-all shadow-md"
                    >
                      Subscribe to Updates
                    </button>
                  </div>
                </div>
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
  try {
    const events = await getServerAllEvents();
    const eventArray = Array.isArray(events) ? events : [];
    
    const paths = eventArray
      .map((e: any) => normalizeSlug(e?.slug || e?.slugComputed || e?._raw?.flattenedPath || ""))
      .filter((slug: string) => slug && slug !== "index" && !slug.includes("replace") && slug.trim() !== '')
      .map((slug: string) => ({ 
        params: { slug } 
      }));

    return { 
      paths, 
      fallback: "blocking" 
    };
  } catch (error) {
    console.error("Error generating event paths:", error);
    return { 
      paths: [], 
      fallback: "blocking" 
    };
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const rawParam = (params as any)?.slug;

  const slug =
    typeof rawParam === "string"
      ? normalizeSlug(rawParam)
      : Array.isArray(rawParam) && typeof rawParam[0] === "string"
        ? normalizeSlug(rawParam[0])
        : "";

  if (!slug) return { notFound: true };

  try {
    const eventData = await getServerEventBySlug(slug);
    if (!eventData) return { notFound: true };

    const rawBody = eventData?.body?.raw ?? eventData?.body ?? "";
    const raw = typeof rawBody === "string" && rawBody.trim() ? rawBody : "Content is being prepared.";

    let source: MDXRemoteSerializeResult;
    try {
      source = await serialize(raw, {
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [rehypeSlug],
        },
      });
    } catch (err) {
      source = await serialize("Content is being prepared.");
    }

    const event: EventViewModel = {
      slug,
      title: typeof eventData.title === "string" && eventData.title.trim() ? eventData.title : "Untitled Gathering",
      excerpt:
        (typeof eventData.excerpt === "string" && eventData.excerpt.trim()
          ? eventData.excerpt
          : typeof eventData.description === "string" && eventData.description.trim()
            ? eventData.description
            : null),

      eventDate: eventData.eventDate ?? eventData.date ?? null,
      location: eventData.location ?? eventData.venue ?? null,
      registrationUrl: eventData.registrationUrl ?? eventData.link ?? null,
      tags: Array.isArray(eventData.tags) ? eventData.tags : [],
      coverImage: resolveDocCoverImage(eventData) || "/assets/images/event-default.jpg",

      // JSON-safe fields
      venue: eventData.venue ?? null,
      endDate: eventData.endDate ?? null,
      time: eventData.time ?? null,
      price: eventData.price ?? null,
      capacity: typeof eventData.capacity === "number" ? eventData.capacity : null,
      speaker: eventData.speaker,
      category: eventData.category,
    };

    return {
      props: { event, source },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Error fetching event:", error);
    return {
      notFound: true,
    };
  }
};