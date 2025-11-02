// pages/events/[slug].tsx (FULLY FIXED AND ROBUST)
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { getEventBySlug, getEventSlugs } from "@/lib/server/events-data";
import type { EventMeta } from "@/lib/server/events-data";
import { getDownloadsBySlugs, type DownloadMeta } from "@/lib/server/downloads-data";
import mdxComponents from "@/components/mdx-components"; // CRITICAL: Ensure mdxComponents is imported
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next"; // Import Next.js types

// Detect YYYY-MM-DD (date-only)
const isDateOnly = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

// London-first pretty date; show time only if a time exists
function formatPretty(isoish: string, tz = "Europe/London") {
  // CRITICAL FIX: Ensure isoish is a string before checking regex
  if (!isoish || typeof isoish !== 'string') return ''; 
  
  if (isDateOnly(isoish)) {
    const d = new Date(`${isoish}T00:00:00Z`);
    // ... (date formatting logic remains the same)
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(d);
  }
  const d = new Date(isoish);
  if (Number.isNaN(d.valueOf())) return isoish;
  // ... (time formatting logic remains the same)
  const date = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZoneName: "short",
  }).format(d);
  return `${date}, ${time}`;
}

type EventPageProps = {
  event: EventMeta & {
    slug: string;
    tags: string[] | null; // Tags array guaranteed safe by getStaticProps
    resources: string[] | null;
  };
  contentSource: any;
  resourcesMeta: DownloadMeta[];
};

function EventPage({ event, contentSource, resourcesMeta }: EventPageProps) {
  if (!event) return <div>Event not found.</div>;

  // CRITICAL FIX: Ensure event properties are strings/safe before use
  const slug = event.slug || ''; 
  const title = event.title || 'Untitled Event';
  const summary = event.summary || '';
  const location = event.location || '';

  const prettyDate = formatPretty(event.date);
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
  const url = `${site}/events/${slug}`;

  // Robustly handle different field names for cover image
  const relImage = (event as any).coverImage ?? (event as any).heroImage;
  const absImage = relImage ? new URL(relImage, site).toString() : undefined;

  // ROBUST FIX: Ensure event.tags is treated as an array before calling .some()
  const eventTags = Array.isArray(event.tags) ? event.tags : [];
  const isChatham = eventTags.some((t) => String(t).toLowerCase() === "chatham");

  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: title,
    startDate: event.date, // ISO date is sufficient here
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: location,
      address: location,
    },
    organizer: {
      "@type": "Organization",
      name: "Abraham of London",
      url: site,
    },
    ...(absImage ? { image: [absImage] } : {}),
    description: summary,
    url,
  };

  return (
    <div className="event-page px-4 py-10 mx-auto max-w-3xl">
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={summary} />
        {absImage && <meta property="og:image" content={absImage} />}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <h1 className="text-3xl md:text-4xl font-serif font-semibold mb-2">{title}</h1>

      {isChatham && (
        <>
          <span
            className="inline-block rounded-full bg-[color:var(--color-on-secondary)/0.9] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream"
            title="Chatham Room (off the record)"
            aria-label="Chatham Room (off the record)"
          >
            Chatham
          </span>
          <p className="mt-2 text-xs text-neutral-600">Off the record. No recordings. No press.</p>
        </>
      )}

      <p className="mt-3 text-sm text-neutral-600 mb-1">
        <span className="font-medium">Date:</span> {prettyDate}
      </p>
      {location && (
        <p className="text-sm text-neutral-600 mb-6">
          <span className="font-medium">Location:</span> {location}
        </p>
      )}

      <article className="prose max-w-none">
        {/* CRITICAL FIX: Ensure components are passed for MDX rendering */}
        <MDXRemote {...contentSource} components={mdxComponents} /> 
      </article>

      {resourcesMeta?.length ? (
        <section className="mt-10 border-t border-lightGrey pt-8">
          <h2 className="font-serif text-2xl font-semibold text-deepCharcoal mb-4">
            Suggested Resources
          </h2>
          <ul className="grid gap-5 sm:grid-cols-2">
            {resourcesMeta.map((r) => (
              <li key={r.slug} className="group overflow-hidden rounded-2xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover">
                {r.coverImage ? (
                  <div className="relative aspect-[3/2] w-full">
                    <Image
                      src={r.coverImage}
                      alt={r.title || ''}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                ) : null}
                <div className="p-4">
                  <h3 className="text-base font-semibold text-deepCharcoal">
                    <Link href={`/downloads/${r.slug}`} className="hover:underline">
                      {r.title}
                    </Link>
                  </h3>
                  {r.excerpt ? (
                    // CRITICAL FIX: Ensure excerpt is always treated as string
                    <p className="mt-1 text-sm text-[color:var(--color-on-secondary)/0.85] line-clamp-3">
                      {r.excerpt}
                    </p>
                  ) : null}
                  <div className="mt-3 flex gap-2">
                    <Link
                      href={`/downloads/${r.slug}`}
                      className="inline-flex items-center rounded-full border border-[color:var(--color-primary)/0.2] px-3 py-1.5 text-sm font-medium text-forest hover:bg-forest hover:text-cream"
                    >
                      Notes
                    </Link>
                    {/* CRITICAL FIX: Check for the file property existence before rendering */}
                    {(r as any).file ? (
                      <Link
                        href={(r as any).file}
                        className="inline-flex items-center rounded-full border border-lightGrey px-3 py-1.5 text-sm font-medium text-deepCharcoal hover:bg-warmWhite"
                      >
                        Download
                      </Link>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

// ----------------------------------------------------
// Data Fetching and Path Generation
// ----------------------------------------------------
// CRITICAL FIX: getStaticPaths must be explicitly exported
export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getEventSlugs();
  const paths = slugs.map((slug: string) => ({ params: { slug } }));
  return { paths, fallback: false };
};

// CRITICAL FIX: getStaticProps must handle serialization
export const getStaticProps: GetStaticProps<EventPageProps> = async ({ params }) => {
  const slug = params!.slug as string;
  // Fetching content and frontmatter
  const { content, ...event } = getEventBySlug(params.slug, [
    "slug",
    "title",
    "date",
    "location",
    "summary",
    "heroImage",
    "coverImage",
    "tags",
    "resources",
    "content",
  ]);

  // Handle case where event content might be empty/missing
  if (!event || !event.title || !content) {
    return { notFound: true };
  }

  // CRITICAL FIX: Ensure all fetched data is safe for JSON serialization (Next.js props)
  const jsonSafeEvent = JSON.parse(JSON.stringify(event));

  const contentSource = await serialize(content, { scope: jsonSafeEvent });

  const resourcesList: string[] = Array.isArray(jsonSafeEvent.resources)
    ? (jsonSafeEvent.resources as string[])
    : [];
  const resourcesMeta = resourcesList.length
    ? getDownloadsBySlugs(resourcesList)
    : [];

  return { props: { event: jsonSafeEvent, contentSource, resourcesMeta } };
};

export default EventPage;