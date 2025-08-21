// pages/events/[slug].tsx
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type { GetStaticPaths, GetStaticProps } from "next";
import Layout from "@/components/Layout";
import { getAllEvents, getEventBySlug, type EventItem } from "@/lib/events";

type Props = { event: EventItem };

export default function EventPage({ event }: Props) {
  const { slug, title, date, location, description, heroImage } = event;

  const ORIGIN =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.URL ??
    process.env.DEPLOY_PRIME_URL ??
    "https://abrahamoflondon.org";

  const isoDate = new Date(date).toISOString();
  const prettyDate = new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const canonical = `${ORIGIN.replace(/\/$/, "")}/events/${slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: title,
    startDate: isoDate,
    eventAttendanceMode: "https://schema.org/MixedEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location: {
      "@type": "Place",
      name: location,
      address: location,
    },
    image: heroImage ? [`${ORIGIN.replace(/\/$/, "")}${heroImage}`] : undefined,
    description:
      description ||
      "An event hosted by Abraham of London focused on leadership, culture, and enduring standards.",
    organizer: {
      "@type": "Organization",
      name: "Abraham of London",
      url: ORIGIN.replace(/\/$/, ""),
    },
    url: canonical,
  };

  return (
    <Layout pageTitle={title}>
      <Head>
        <meta name="description" content={description || `${title} — ${location} on ${prettyDate}`} />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="event" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description || `${title} — ${location} on ${prettyDate}`} />
        {heroImage && <meta property="og:image" content={`${ORIGIN.replace(/\/$/, "")}${heroImage}`} />}
        <meta property="og:url" content={canonical} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </Head>

      {/* Page header bar */}
      <section className="border-b border-lightGrey/70 bg-warmWhite/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
          <nav aria-label="Breadcrumb" className="text-deepCharcoal/70">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-deepCharcoal">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <Link href="/events" className="hover:text-deepCharcoal">
                  Events
                </Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-deepCharcoal/80">{title}</li>
            </ol>
          </nav>
        </div>
      </section>

      {/* Hero */}
      <section className="relative bg-white">
        <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
          {heroImage && (
            <div className="relative mb-8 h-64 w-full overflow-hidden rounded-2xl shadow-lg md:h-96">
              <Image
                src={heroImage}
                alt={title}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 1024px"
                priority
              />
            </div>
          )}

          <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-brand text-forest">{title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-deepCharcoal/70">
            <time dateTime={isoDate} className="rounded-full bg-warmWhite px-2 py-1">
              {prettyDate}
            </time>
            <span aria-hidden="true">·</span>
            <span className="rounded-full bg-warmWhite px-2 py-1">{location}</span>
          </div>

          {description && (
            <p className="prose prose-lg mt-6 max-w-none text-deepCharcoal">
              {description}
            </p>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            {/* If you later add a registration URL, place it here */}
            <Link
              href="/contact"
              className="rounded-full bg-forest px-5 py-2 text-sm font-semibold text-cream transition hover:bg-forest/90"
            >
              Enquire
            </Link>
            <Link
              href="/events"
              className="rounded-full border border-forest/20 px-5 py-2 text-sm font-semibold text-forest transition hover:bg-forest hover:text-cream"
            >
              All Events
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const events = getAllEvents();
  return {
    paths: events.map((e) => ({ params: { slug: e.slug } })),
    fallback: false, // change to 'blocking' if you’ll add events dynamically at runtime
  };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");
  const event = getEventBySlug(slug);

  if (!event) return { notFound: true };
  return { props: { event }, revalidate: 60 };
};
