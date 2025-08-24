// pages/events/[slug].tsx
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
// Correct the import path for server-side functions
import { getEventBySlug, getEventSlugs } from "@/lib/server/events-data";
// Use the client-side file for types if needed, or import from the server file
import type { EventMeta } from "@/lib/events"; // Or "@/lib/server/events-data"

// A typical event page component
// Now accepts 'contentSource' as a separate prop
function EventPage({ event, contentSource }: { event: EventMeta; contentSource: any }) {
  if (!event) {
    return <div>Event not found.</div>;
  }
  
  return (
    <div className="event-page">
      <h1>{event.title}</h1>
      <p>Date: {event.date}</p>
      <p>Location: {event.location}</p>
      
      {/* Render the MDX content using the serialized source */}
      <MDXRemote {...contentSource} />
    </div>
  );
}

// getStaticPaths tells Next.js which paths to pre-render at build time
export async function getStaticPaths() {
  const slugs = getEventSlugs();
  const paths = slugs.map((slug) => ({
    params: { slug },
  }));

  return { paths, fallback: false };
}

// getStaticProps fetches the data for a single page
export async function getStaticProps({ params }: { params: { slug: string } }) {
  const { content, ...event } = getEventBySlug(params.slug, [
    "slug",
    "title",
    "date",
    "location",
    "summary",
    "content", // Ensure content is fetched
  ]);
  
  // Serialize the MDX content on the server
  const contentSource = await serialize(content || "");
  
  return {
    props: {
      event,
      contentSource,
    },
  };
}

export default EventPage;