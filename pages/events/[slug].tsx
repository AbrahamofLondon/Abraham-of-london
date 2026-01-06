import React from 'react';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import { MDXRemote, MDXRemoteSerializeResult } from 'next-mdx-remote';
import { serialize } from 'next-mdx-remote/serialize';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import Head from 'next/head';
import Layout from '@/components/Layout';

import { getServerAllEvents, getServerEventBySlug } from "@/lib/contentlayer";

import {
  getAllDownloads,
  getDownloadBySlug,
  sanitizeDownloadData,
} from '@/lib/contentlayer';

import EventHero from '@/components/events/EventHero';
import EventDetails from '@/components/events/EventDetails';
import EventContent from '@/components/events/EventContent';
import EventRegistration from '@/components/events/EventRegistration';
import EventSpeakers from '@/components/events/EventSpeakers';
import EventSchedule from '@/components/events/EventSchedule';
import RelatedEvents from '@/components/events/RelatedEvents';
import ShareButtons from '@/components/ShareButtons';
import { CalendarDays, MapPin, Clock, Users } from 'lucide-react';

interface Event {
  title: string;
  excerpt: string | null;
  eventDate: string | null;
  location: string | null;
  registrationUrl: string | null;
  tags: string[];
  coverImage?: string;
  venue?: string;
  endDate?: string;
  time?: string;
  price?: string | number;
  capacity?: number;
}

interface Props {
  event: Event;
  source: MDXRemoteSerializeResult;
}

const EventPage: NextPage<Props> = ({ event, source }) => {
  const metaDescription = event.excerpt || 'An exclusive event by Abraham of London';
  const formattedDate = event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }) : '';
  const isPastEvent = event.eventDate ? new Date(event.eventDate) < new Date() : false;

  return (
    <Layout>
      <Head>
        <title>{event.title} | Events | Abraham of London</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={event.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:image" content={event.coverImage || '/assets/images/event-default.jpg'} />
        <meta property="og:type" content="event" />
        {event.eventDate && <meta property="event:start_time" content={event.eventDate} />}
        {event.location && <meta property="event:location" content={event.location} />}
      </Head>

      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* Event Hero Section */}
        <EventHero 
          title={event.title}
          date={formattedDate}
          location={event.location}
          coverImage={event.coverImage}
          excerpt={event.excerpt}
          isPast={isPastEvent}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Main Content */}
            <main className="lg:col-span-8">
              <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
                {/* Quick Info Bar */}
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
                      <p className="font-semibold text-gray-900">{event.location || 'TBA'}</p>
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
                  
                  {event.capacity && (
                    <div className="flex items-center space-x-3 p-4 bg-amber-50 rounded-lg">
                      <Users className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="text-sm text-gray-600">Capacity</p>
                        <p className="font-semibold text-gray-900">{event.capacity} seats</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Event Details */}
                <EventDetails 
                  venue={event.venue}
                  price={event.price}
                  endDate={event.endDate}
                />

                {/* Event Content */}
                <div className="mt-8">
                  <EventContent>
                    <MDXRemote {...source} />
                  </EventContent>
                </div>

                {/* Event Schedule */}
                {!isPastEvent && (
                  <div className="mt-12">
                    <EventSchedule eventId={event.title} />
                  </div>
                )}

                {/* Event Speakers */}
                <div className="mt-12">
                  <EventSpeakers eventTitle={event.title} />
                </div>

                {/* Registration CTA */}
                <div className="mt-12">
                  <EventRegistration 
                    isPast={isPastEvent}
                    registrationUrl={event.registrationUrl}
                    price={event.price}
                  />
                </div>

                {/* Share Section */}
                <div className="mt-12 pt-8 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Share this event</h3>
                      <p className="text-sm text-gray-600">Spread the word with your network</p>
                    </div>
                    <ShareButtons 
                      url={`https://abrahamoflondon.com/events/${event.title}`}
                      title={event.title}
                      excerpt={event.excerpt || ''}
                    />
                  </div>
                </div>
              </div>
            </main>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="sticky top-8 space-y-8">
                {/* Related Events */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Related Events</h3>
                  <RelatedEvents currentEventTitle={event.title} />
                </div>

                {/* Quick Actions */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Actions</h3>
                  <div className="space-y-3">
                    <button className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
                      <CalendarDays className="w-4 h-4" />
                      <span>Add to Calendar</span>
                    </button>
                    <button className="w-full bg-white text-gray-900 border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span>Download Info Pack</span>
                    </button>
                    <button className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg px-4 py-3 hover:from-indigo-700 hover:to-purple-700 transition-all">
                      Join Waitlist
                    </button>
                  </div>
                </div>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Topics</h3>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <span
                          key={index}
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
  const events = await getServerAllEvents();
  
  const filteredEvents = events
    .filter((event: any) => event && !event.draft)
    .filter((event: any) => {
      const slug = event.slug || event._raw?.flattenedPath || "";
      return slug && !String(slug).includes("replace");
    });

  const paths = filteredEvents
    .filter((event: any) => event && !event.draft)
    .map((event: any) => event.slug)
    .filter(Boolean)
    .map((slug: string) => ({ params: { slug } }));

  return { paths, fallback: 'blocking' };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = params?.slug as string;
  if (!slug) return { notFound: true };

  const eventData = await getServerEventBySlug(slug);
  if (!eventData) return { notFound: true };

  const event = {
    title: eventData.title || "Untitled Gathering",
    excerpt: eventData.excerpt || eventData.description || null,
    eventDate: eventData.eventDate || eventData.date || null,
    location: eventData.location || eventData.venue || null,
    registrationUrl: eventData.registrationUrl || eventData.link || null,
    tags: Array.isArray(eventData.tags) ? eventData.tags : [],
    coverImage: eventData.coverImage,
    venue: eventData.venue,
    endDate: eventData.endDate,
    time: eventData.time,
    price: eventData.price,
    capacity: eventData.capacity,
  };

  let source: MDXRemoteSerializeResult;
  try {
    source = await serialize(eventData.body || " ", {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug],
      },
    });
  } catch {
    source = await serialize("Content is being prepared.");
  }

  return { props: { event, source }, revalidate: 3600 };
};