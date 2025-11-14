// pages/events/[slug].tsx
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { GetStaticPaths, GetStaticProps } from "next";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";
import { getEventBySlug, getEventSlugs } from "@/lib/server/events-data";
import { getDownloadsBySlugs, type DownloadMeta } from "@/lib/server/downloads-data";
import type { EventMeta } from "@/types/event";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const isDateOnly = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s);

function formatPretty(
  isoish: string | null | undefined,
  tz = "Europe/London"
): string {
  if (!isoish || typeof isoish !== "string") return "";
  if (isDateOnly(isoish)) {
    const d = new Date(`${isoish}T00:00:00Z`);
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: tz,
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

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

type EventPageProps = {
  event: EventMeta;
  contentSource: MDXRemoteSerializeResult;
  resourcesMeta: DownloadMeta[];
};

// -----------------------------------------------------------------------------
// Page component
// -----------------------------------------------------------------------------

function EventPage({ event, contentSource, resourcesMeta }: EventPageProps) {
  if (!event) return <div>Event not found.</div>;

  const { slug, title, summary, location, date, tags, heroImage, coverImage } = event;

  const prettyDate = formatPretty(date);
  const site =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
  const url = `${site.replace(/\/+$/, "")}/events/${slug}`;
  const relImage = coverImage ?? heroImage;
  const absImage = relImage ? new URL(relImage, site).toString() : undefined;
  const isChatham =
    Array.isArray(tags) &&
    tags.some((t) => String(t).toLowerCase() === "chatham");

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: title,
    startDate: date,
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
    <Layout title={title || undefined}>
      <Head>
        <title>{title} | Events | Abraham of London</title>
        <meta name="description" content={summary || ""} />
        {absImage && <meta property="og:image" content={absImage} />}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta property="og:title" content={`${title} | Abraham of London`} />
        <meta property="og:description" content={summary || ""} />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <article className="event-page mx-auto max-w-3xl px-4 py-10">
        {/* Hero image if present */}
        {(heroImage || coverImage) && (
          <div className="relative mb-6 w-full overflow-hidden rounded-xl aspect-[21/9]">
            <Image
              src={String(heroImage || coverImage)}
              alt={title || "Event image"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 80vw"
              priority
            />
          </div>
        )}

        <h1 className="mb-2 font-serif text-3xl font-semibold md:text-4xl">
          {title}
        </h1>

        {isChatham && (
          <>
            <span
              className="inline-block rounded-full bg-[color:var(--color-on-secondary)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream"
              title="Chatham Room (off the record)"
            >
              Chatham
            </span>
            <p className="mt-2 text-xs text-neutral-600">
              Off the record. No recordings. No press.
            </p>
          </>
        )}

        <p className="mb-1 mt-3 text-sm text-neutral-600">
          <span className="font-medium">Date:</span> {prettyDate}
        </p>
        {location && (
          <p className="mb-6 text-sm text-neutral-600">
            <span className="font-medium">Location:</span> {location}
          </p>
        )}

        <section className="prose max-w-none">
          <MDXRemote {...contentSource} components={mdxComponents} />
        </section>

        {resourcesMeta && resourcesMeta.length > 0 && (
          <section className="mt-10 border-t border-lightGrey pt-8">
            <h2 className="mb-4 font-serif text-2xl font-semibold text-deepCharcoal">
              Suggested Resources
            </h2>
            <ul className="grid gap-5 sm:grid-cols-2">
              {resourcesMeta.map((r) => (
                <li
                  key={r.slug}
                  className="group overflow-hidden rounded-2xl border border-lightGrey bg-white shadow-md transition hover:shadow-lg"
                >
                  {r.coverImage && (
                    <div className="relative aspect-[3/2] w-full">
                      <Image
                        src={String(r.coverImage)}
                        alt={r.title || ""}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="text-base font-semibold text-deepCharcoal">
                      <Link
                        href={`/downloads/${r.slug}`}
                        className="hover:underline"
                      >
                        {r.title}
                      </Link>
                    </h3>
                    {r.excerpt && (
                      <p className="mt-1 line-clamp-3 text-sm text-[color:var(--color-on-secondary)] opacity-85">
                        {String(r.excerpt)}
                      </p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Link
                        href={`/downloads/${r.slug}`}
                        className="inline-flex items-center rounded-full border border-[color:var(--color-primary)]/20 px-3 py-1.5 text-sm font-medium text-forest hover:bg-forest hover:text-cream"
                      >
                        Notes
                      </Link>
                      {(r as any).pdfPath && (
                        <a
                          href={String((r as any).pdfPath)}
                          download
                          className="inline-flex items-center rounded-full border border-lightGrey px-3 py-1.5 text-sm font-medium text-deepCharcoal hover:bg-warmWhite"
                        >
                          Download
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </Layout>
  );
}

// -----------------------------------------------------------------------------
// SSG – paths
// -----------------------------------------------------------------------------

export const getStaticPaths: GetStaticPaths = async () => {
  const slugs = getEventSlugs();
  const paths =
    slugs?.map((slug: string) => ({
      params: { slug },
    })) ?? [];

  return {
    paths,
    // keep blocking to avoid 404 for new events
    fallback: "blocking",
  };
};

// -----------------------------------------------------------------------------
// SSG – props
// -----------------------------------------------------------------------------

export const getStaticProps: GetStaticProps<EventPageProps> = async ({
  params,
}) => {
  try {
    const slug = params?.slug as string | undefined;
    if (!slug) return { notFound: true };

    const eventData = getEventBySlug(slug, [
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

    if (!eventData || !eventData.title || !eventData.content) {
      return { notFound: true };
    }

    const { content, ...event } = eventData;

    const jsonSafeEvent = JSON.parse(
      JSON.stringify(event)
    ) as EventMeta & {
      resources?: {
        downloads?: { href?: string }[];
        reads?: { href?: string }[];
      };
    };

    const contentSource = await serialize(content || "", {
      scope: jsonSafeEvent as unknown as Record<string, unknown>,
    });

    const resourceSlugs: string[] = [];

    if (jsonSafeEvent.resources?.downloads) {
      jsonSafeEvent.resources.downloads.forEach((r) => {
        const s = r.href?.split("/").pop();
        if (s) resourceSlugs.push(s);
      });
    }

    if (jsonSafeEvent.resources?.reads) {
      jsonSafeEvent.resources.reads.forEach((r) => {
        const s = r.href?.split("/").pop();
        if (s) resourceSlugs.push(s);
      });
    }

    const resourcesMetaRaw: DownloadMeta[] =
      resourceSlugs.length > 0 ? getDownloadsBySlugs(resourceSlugs) : [];

    const resourcesMeta = JSON.parse(
      JSON.stringify(resourcesMetaRaw)
    ) as DownloadMeta[];

    return {
      props: {
        event: jsonSafeEvent,
        contentSource,
        resourcesMeta,
      },
      revalidate: 3600,
    };
  } catch (error) {
    console.error("Error in getStaticProps for /events/[slug]:", error);
    return { notFound: true };
  }
};

export default EventPage;