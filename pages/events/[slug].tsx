import Head from "next/head";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
// Server-only data accessors
import { getEventBySlug, getEventSlugs } from "@/lib/server/events-data";
import type { EventMeta } from "@/lib/events"; // types only

// London-first pretty date; hides midnight
function formatPretty(iso: string, tz = "Europe/London") {
  const d = new Date(iso);
  if (Number.isNaN(d.valueOf())) return iso;
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
  const hh = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hour12: false }).format(d)
  );
  const mm = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: tz, minute: "2-digit" }).format(d)
  );
  if (hh === 0 && mm === 0) return date;
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return `${date}, ${time}`;
}

function EventPage({ event, contentSource }: { event: EventMeta; contentSource: any }) {
  if (!event) return <div>Event not found.</div>;

  const prettyDate = formatPretty(event.date);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.date, // ISO with TZ in content
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.location || "London, UK",
      address: event.location || "London, UK",
    },
    organizer: {
      "@type": "Organization",
      name: "Abraham of London",
      url: "https://www.abrahamoflondon.org",
    },
    image: (event as any).image || undefined,
    description: event.summary || "",
  };

  return (
    <div className="event-page px-4 py-10 mx-auto max-w-3xl">
      <Head>
        <title>{event.title} | Abraham of London</title>
        <meta name="description" content={event.summary || ""} />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <h1 className="text-3xl md:text-4xl font-serif font-semibold mb-2">{event.title}</h1>
      <p className="text-sm text-neutral-600 mb-1">
        <span className="font-medium">Date:</span> {prettyDate}
      </p>
      {event.location && (
        <p className="text-sm text-neutral-600 mb-6">
          <span className="font-medium">Location:</span> {event.location}
        </p>
      )}

      {/* Render the MDX content using the serialized source */}
      <article className="prose max-w-none">
        <MDXRemote {...contentSource} />
      </article>
    </div>
  );
}

export async function getStaticPaths() {
  const slugs = getEventSlugs();
  const paths = slugs.map((slug: string) => ({ params: { slug } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  const { content, ...event } = getEventBySlug(params.slug, [
    "slug",
    "title",
    "date",
    "location",
    "summary",
    "content", // Ensure content is fetched
  ]);

  const contentSource = await serialize(content || "");
  return { props: { event, contentSource } };
}

export default EventPage;
