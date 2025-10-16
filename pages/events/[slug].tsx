// pages/events/[slug].tsx
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { getEventBySlug, getEventSlugs } from "@/lib/server/events-data";
import type { EventMeta } from "@/lib/server/events-data";
import { getDownloadsBySlugs, type DownloadMeta } from "@/lib/server/downloads-data";

// Detect YYYY-MM-DD (date-only)
const isDateOnly = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);

// London-first pretty date; show time only if a time exists
function formatPretty(isoish: string, tz = "Europe/London") {
  if (isDateOnly(isoish)) {
    const d = new Date(`${isoish}T00:00:00Z`);
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
    tags?: string[] | null;
    resources?: string[] | null;
  };
  contentSource: any;
  resourcesMeta: DownloadMeta[];
};

function EventPage({ event, contentSource, resourcesMeta }: EventPageProps) {
  if (!event) return <div>Event not found.</div>;

  const prettyDate = formatPretty(event.date);
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
  const url = `${site}/events/${event.slug}`;

  // Support either field name from content
  const relImage = (event as any).coverImage ?? (event as any).heroImage;
  const absImage = relImage ? new URL(relImage, site).toString() : undefined;

  const isChatham =
    Array.isArray(event.tags) &&
    event.tags.some((t) => String(t).toLowerCase() === "chatham");

  const jsonLd: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.date,
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
      url: site,
    },
    ...(absImage ? { image: [absImage] } : {}),
    description: event.summary || "",
    url,
  };

  return (
    <div className="event-page px-4 py-10 mx-auto max-w-3xl">
      <Head>
        <title>{event.title} | Abraham of London</title>
        <meta name="description" content={event.summary || ""} />
        {absImage && <meta property="og:image" content={absImage} />}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <h1 className="text-3xl md:text-4xl font-serif font-semibold mb-2">{event.title}</h1>

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
      {event.location && (
        <p className="text-sm text-neutral-600 mb-6">
          <span className="font-medium">Location:</span> {event.location}
        </p>
      )}

      <article className="prose max-w-none">
        <MDXRemote {...contentSource} />
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
                      alt=""
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
                    {r.file ? (
                      <Link
                        href={r.file}
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

export async function getStaticPaths() {
  const slugs = getEventSlugs();
  const paths = slugs.map((slug: string) => ({ params: { slug } }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }: { params: { slug: string } }) {
  // Include so we can wire up Suggested Resources
  const { content, ...event } = getEventBySlug(params.slug, [
    | "slug"
  | "title"
  | "date"
  | "location"
  | "summary"
  | "heroImage"
  | "tags"
  | "resources"   // ✅
  | "content";
  ]);

  const contentSource = await serialize(content || "");

  const resourcesList: string[] = Array.isArray((event as any).resources)
    ? ((event as any).resources as string[])
    : [];
  const resourcesMeta = resourcesList.length
    ? getDownloadsBySlugs(resourcesList)
    : [];

  return { props: { event, contentSource, resourcesMeta } };
}

export default EventPage;

