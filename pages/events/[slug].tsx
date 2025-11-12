// pages/events/[slug].tsx
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import { getEventBySlug, getEventSlugs } from "@/lib/server/events-data";
import type { EventMeta } from "@/types/event";
import { getDownloadsBySlugs, type DownloadMeta } from "@/lib/server/downloads-data";
import mdxComponents from "@/components/mdx-components"; 
import { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next"; 
import Layout from "@/components/Layout";
import remarkGfm from "remark-gfm";
import * as React from "react";

const isDateOnly = (s: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(s);

function formatPretty(isoish: string | null | undefined, tz = "Europe/London"): string {
  if (!isoish || typeof isoish !== 'string') return ''; 
  if (isDateOnly(isoish)) {
    const d = new Date(`${isoish}T00:00:00Z`);
    return new Intl.DateTimeFormat("en-GB", { timeZone: tz, day: "2-digit", month: "short", year: "numeric" }).format(d);
  }
  const d = new Date(isoish);
  if (Number.isNaN(d.valueOf())) return isoish;
  const date = new Intl.DateTimeFormat("en-GB", { timeZone: tz, weekday: "short", day: "2-digit", month: "short", year: "numeric" }).format(d);
  const time = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: "short" }).format(d);
  return `${date}, ${time}`;
}

type EventPageProps = {
  event: EventMeta;
  contentSource: MDXRemoteSerializeResult;
  resourcesMeta: DownloadMeta[];
};

function EventPage({ event, contentSource, resourcesMeta }: EventPageProps): JSX.Element {
  if (!event) return <div>Event not found.</div>;
  
  const { slug, title, summary, location, date, tags, heroImage, coverImage } = event;
  const prettyDate = formatPretty(date);
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";
  const url = `${site}/events/${slug}`;
  const relImage = coverImage ?? heroImage;
  const absImage = relImage ? new URL(relImage, site).toString() : undefined;
  const isChatham = Array.isArray(tags) && tags.some((t) => String(t).toLowerCase() === "chatham");
  
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
      address: location 
    },
    organizer: { 
      "@type": "Organization", 
      name: "Abraham of London", 
      url: site 
    },
    ...(absImage ? { image: [absImage] } : {}),
    description: summary,
    url,
  };

  return (
    <Layout pageTitle={title}>
      <Head>
        <title>{title} | Abraham of London</title>
        <meta name="description" content={summary || ""} />
        {absImage && <meta property="og:image" content={absImage} />}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>
      
      <article className="event-page px-4 py-10 mx-auto max-w-3xl">
        <h1 className="text-3xl md:text-4xl font-serif font-semibold mb-2">{title}</h1>
        
        {isChatham && (
          <div className="mb-4">
            <span
              className="inline-block rounded-full bg-[color:var(--color-on-secondary)/0.9] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream"
              title="Chatham Room (off the record)"
            >
              Chatham
            </span>
            <p className="mt-2 text-xs text-neutral-600">Off the record. No recordings. No press.</p>
          </div>
        )}
        
        <p className="mt-3 text-sm text-neutral-600 mb-1">
          <span className="font-medium">Date:</span> {prettyDate}
        </p>
        
        {location && (
          <p className="text-sm text-neutral-600 mb-6">
            <span className="font-medium">Location:</span> {location}
          </p>
        )}
        
        <div className="prose max-w-none">
          <MDXRemote {...contentSource} components={mdxComponents} /> 
        </div>
        
        {resourcesMeta?.length > 0 && (
          <section className="mt-10 border-t border-lightGrey pt-8">
            <h2 className="font-serif text-2xl font-semibold text-deepCharcoal mb-4">
              Suggested Resources
            </h2>
            <ul className="grid gap-5 sm:grid-cols-2">
              {resourcesMeta.map((r) => (
                <li key={r.slug} className="group overflow-hidden rounded-2xl border border-lightGrey bg-white shadow-card transition hover:shadow-cardHover">
                  {r.coverImage && (
                    <div className="relative aspect-[3/2] w-full">
                      <Image
                        src={String(r.coverImage)}
                        alt={r.title || 'Resource cover image'}
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
                        prefetch={false}
                      >
                        {r.title || 'Untitled Resource'}
                      </Link>
                    </h3>
                    {r.excerpt && (
                      <p className="mt-1 text-sm text-[color:var(--color-on-secondary)/0.85] line-clamp-3">
                        {String(r.excerpt)}
                      </p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <Link
                        href={`/downloads/${r.slug}`}
                        className="inline-flex items-center rounded-full border border-[color:var(--color-primary)/0.2] px-3 py-1.5 text-sm font-medium text-forest hover:bg-forest hover:text-cream transition-colors"
                        prefetch={false}
                      >
                        Notes
                      </Link>
                      {(r as any).pdfPath && ( 
                        <a
                          href={String((r as any).pdfPath)}
                          download
                          className="inline-flex items-center rounded-full border border-lightGrey px-3 py-1.5 text-sm font-medium text-deepCharcoal hover:bg-warmWhite transition-colors"
                          rel="noopener noreferrer"
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

export const getStaticPaths: GetStaticPaths = async () => {
  try {
    const slugs = getEventSlugs();
    const paths = slugs.map((slug: string) => ({ params: { slug } }));
    return { 
      paths, 
      fallback: 'blocking' 
    };
  } catch (error) {
    console.error('Error generating event paths:', error);
    return {
      paths: [],
      fallback: 'blocking',
    };
  }
};

export const getStaticProps: GetStaticProps<EventPageProps> = async ({ params }) => {
  try {
    if (!params?.slug) {
      return { notFound: true };
    }

    const slug = params.slug as string;
    const eventData = getEventBySlug(slug, [
      "slug", "title", "date", "location", "summary", "heroImage", "coverImage", "tags", "resources", "content",
    ]);
    
    if (!eventData || !eventData.title || !eventData.content) {
      return { notFound: true };
    }

    const { content, ...event } = eventData;
    const jsonSafeEvent = JSON.parse(JSON.stringify(event));
    
    const contentSource = await serialize(content, { 
      scope: jsonSafeEvent, 
      mdxOptions: { remarkPlugins: [remarkGfm as any] } 
    });

    // Extract resource slugs safely
    const resourceSlugs: string[] = [];
    try {
      const downloads = jsonSafeEvent.resources?.downloads || [];
      const reads = jsonSafeEvent.resources?.reads || [];
      
      downloads.forEach((r: any) => {
        if (r?.href) {
          const slug = r.href.split('/').pop();
          if (slug) resourceSlugs.push(slug);
        }
      });
      
      reads.forEach((r: any) => {
        if (r?.href) {
          const slug = r.href.split('/').pop();
          if (slug) resourceSlugs.push(slug);
        }
      });
    } catch (error) {
      console.warn('Error extracting resource slugs:', error);
    }

    const resourcesMeta = resourceSlugs.length > 0 ? getDownloadsBySlugs(resourceSlugs) : [];
    
    return { 
      props: { 
        event: jsonSafeEvent, 
        contentSource, 
        resourcesMeta: JSON.parse(JSON.stringify(resourcesMeta))
      },
      revalidate: 3600 
    };
  } catch (error) {
    console.error('Error in getStaticProps for event:', params?.slug, error);
    return { notFound: true };
  }
};

export default EventPage;