// pages/events/index.tsx

import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { GetServerSideProps } from 'next';
import React from 'react';
import Link from 'next/link';
import Head from 'next/head';

// Define the shape of your Event data
interface EventMeta {
  slug: string;
  title: string;
  date: string; // Stored as a string (e.g., "YYYY-MM-DD")
  location: string;
  summary: string;
  // Add other relevant frontmatter fields
}

interface EventsPageProps {
  events: EventMeta[];
}

/* -------------------- Data Fetching (getServerSideProps) -------------------- */

export const getServerSideProps: GetServerSideProps<EventsPageProps> = async () => {
  const eventsDirectory = path.join(process.cwd(), 'content', 'events');
  let events: EventMeta[] = [];

  try {
    // Read all filenames from the 'content/events' directory
    const filenames = fs.readdirSync(eventsDirectory);

    // Process each .mdx file to extract frontmatter
    events = filenames
      .filter(filename => filename.endsWith('.mdx'))
      .map(filename => {
        const filePath = path.join(eventsDirectory, filename);
        const markdownWithMeta = fs.readFileSync(filePath, 'utf-8');
        const { data: frontmatter } = matter(markdownWithMeta);
        
        // Extract necessary metadata
        return {
          slug: filename.replace('.mdx', ''),
          title: frontmatter.title || 'Untitled Event',
          date: frontmatter.date || 'TBD',
          location: frontmatter.location || 'Online',
          summary: frontmatter.summary || 'Click for details.',
        } as EventMeta;
      })
      // CRITICAL: Sort by date, ensuring the newest/upcoming events are first
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  } catch (error) {
    console.error("Error fetching event list for index page:", error);
    events = []; 
  }

  return {
    props: {
      events,
    },
  };
};

/* -------------------- Component Rendering -------------------- */

export default function EventsPage({ events }: EventsPageProps) {
    
  // Helper to format the date
  const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    } catch (e) {
        return dateString;
    }
  };

  return (
    <>
      <Head>
        <title>Upcoming Events</title>
      </Head>
      <main className="max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-4xl font-extrabold mb-10 border-b pb-4">Upcoming Events</h1>

        {events.length === 0 ? (
          <p className="text-gray-600">No events are currently scheduled.</p>
        ) : (
          <div className="space-y-8">
            {events.map((event) => (
              // Link to the dynamic event detail page
              <Link 
                key={event.slug} 
                href={`/events/${event.slug}`} 
                className="block border rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow duration-300 group"
              >
                <div className="flex justify-between items-start mb-2">
                    <h2 className="text-2xl font-bold text-gray-900 group-hover:text-blue-700 transition-colors">
                        {event.title}
                    </h2>
                    <span className="text-md font-medium text-gray-500 flex-shrink-0">
                        {formatDate(event.date)}
                    </span>
                </div>
                <p className="text-gray-600 mb-3">{event.summary}</p>
                <div className="text-sm font-semibold text-blue-600">
                    Location: {event.location} &rarr;
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </>
  );
}