// pages/events/[slug].tsx

import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
} from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import Layout from "@/components/Layout";
import {
  getEventSlugs,
  getEventBySlug,
  getEventResourcesSummary,
  type EventMeta,
  // NOTE: we deliberately do NOT import EventResources here,
  // because the actual implementation of getEventResourcesSummary
  // returns a looser/different shape.
} from "@/lib/events";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

type EventMetaSerialized = {
  slug: string;
  title?: string;
  date?: string | null;
  time?: string | null;
  location?: string | null;
  description?: string | null;
  heroImage?: string | null;
  coverImage?: string | null;
  tags?: string[] | null;
  [key: string]: unknown;
};

type RelatedResourceSerialized = {
  slug?: string | null;
  title?: string | null;
  description?: string | null;
  coverImage?: string | null;
  href?: string | null;
  kind?: string | null;
};

type EventResourcesSerialized = {
  heading?: string | null;
  description?: string | null;
  downloads?: RelatedResourceSerialized[];
  links?: RelatedResourceSerialized[];
};

type EventPageProps = {
  event: EventMetaSerialized;
  resources: EventResourcesSerialized | null;
};

/* -------------------------------------------------------------------------- */
/*  Utilities                                                                 */
/* -------------------------------------------------------------------------- */

/** Ensure values from getStaticProps are JSON-serialisable */
function toSerializable<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Normalise event fields into a serialisable shape */
function serialiseEvent(event: EventMeta): EventMetaSerialized {
  const anyEv = event as any;

  const dateRaw = anyEv.date ?? anyEv.startDate ?? null;
  const date =
    typeof dateRaw === "string"
      ? dateRaw
      : dateRaw instanceof Date
      ? dateRaw.toISOString()
      : null;

  const heroImage =
    typeof anyEv.heroImage === "string"
      ? anyEv.heroImage
      : typeof anyEv.coverImage === "string"
      ? anyEv.coverImage
      : null;

  return {
    slug: String(anyEv.slug ?? ""),
    title: anyEv.title ?? "",
    date,
    time: anyEv.time ?? null,
    location: anyEv.location ?? anyEv.venue ?? null,
    description: anyEv.description ?? anyEv.excerpt ?? null,
    heroImage,
    coverImage:
      typeof anyEv.coverImage === "string" ? anyEv.coverImage : heroImage,
    tags: Array.isArray(anyEv.tags) ? anyEv.tags : null,
  };
}

/**
 * Normalise resources into a serialisable shape.
 * Accepts unknown because the underlying implementation is loose
 * (e.g. may return stats objects, etc.).
 */
function serialiseResources(resources: unknown): EventResourcesSerialized | null {
  if (!resources || typeof resources !== "object") return null;

  const anyRes = resources as any;

  const toRel = (item: any): RelatedResourceSerialized => {
    if (!item || typeof item !== "object") return {};
    return {
      slug: item.slug ?? null,
      title: item.title ?? null,
      description: item.description ?? item.excerpt ?? null,
      coverImage:
        typeof item.coverImage === "string" ? item.coverImage : null,
      href: typeof item.href === "string" ? item.href : null,
      kind: item.kind ?? null,
    };
  };

  const downloadsSource = Array.isArray(anyRes.downloads)
    ? anyRes.downloads
    : [];

  const linksSource = Array.isArray(anyRes.links) ? anyRes.links : [];

  return {
    heading:
      typeof anyRes.heading === "string" ? anyRes.heading : null,
    description:
      typeof anyRes.description === "string" ? anyRes.description : null,
    downloads: downloadsSource.map(toRel),
    links: linksSource.map(toRel),
  };
}

/* -------------------------------------------------------------------------- */
/*  Next.js data functions                                                    */
/* -------------------------------------------------------------------------- */

export const getStaticPaths: GetStaticPaths = async () => {
  const rawSlugs = await Promise.resolve(getEventSlugs());
  const slugs = Array.isArray(rawSlugs) ? rawSlugs : [];

  const paths =
    slugs.length > 0
      ? slugs
          .filter(
            (s): s is string =>
              typeof s === "string" && s.trim().length > 0,
          )
          .map((slug) => ({ params: { slug } }))
      : [];

  return {
    paths,
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<EventPageProps> = async (ctx) => {
  const slugParam = ctx.params?.slug;
  const slug = Array.isArray(slugParam) ? slugParam[0] : slugParam ?? "";

  if (!slug) {
    return { notFound: true };
  }

  // Tolerate sync/async implementations
  const rawEvent = await Promise.resolve(getEventBySlug(slug));
  if (!rawEvent) {
    return { notFound: true };
  }

  /// NOTE: treat resources as unknown – the implementation currently returns
  // a loose stats object, not strictly EventResources.
  let rawResources: unknown = null;
  try {
    rawResources = await Promise.resolve(
      getEventResourcesSummary ? getEventResourcesSummary() : null,
    );
  } catch {
    rawResources = null;
  }

  const event = toSerializable(serialiseEvent(rawEvent));
  const resources = toSerializable(serialiseResources(rawResources));

  return {
    props: {
      event,
      resources,
    },
    revalidate: 3600,
  };
};

/* -------------------------------------------------------------------------- */
/*  Page component                                                            */
/* -------------------------------------------------------------------------- */

export default function EventPage({
  event,
  resources,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  const pageTitle = event.title || "Event";

  const displayDate =
    event.date &&
    new Date(event.date).toString() !== "Invalid Date"
      ? new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(event.date))
      : null;

  const hasHeroImage =
    typeof event.heroImage === "string" &&
    event.heroImage.trim().length > 0;

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{pageTitle} | Abraham of London</title>
        {event.description && (
          <meta name="description" content={event.description} />
        )}
      </Head>

      <main className="mx-auto max-w-5xl px-4 py-10">
        {/* Hero */}
        <header className="mb-8">
          {hasHeroImage && (
            <div className="relative mb-6 aspect-[16/9] overflow-hidden rounded-2xl border border-lightGrey bg-black/5">
              <Image
                src={event.heroImage as string}
                alt={event.title ?? ""}
                fill
                sizes="(min-width: 1024px) 960px, 100vw"
                className="object-cover"
              />
            </div>
          )}

          <p className="text-xs uppercase tracking-wide text-gray-500">
            Event
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-deepCharcoal sm:text-4xl">
            {event.title}
          </h1>

          {(displayDate || event.location || event.time) && (
            <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-gray-600">
              {displayDate && (
                <span>
                  <span aria-hidden>📅 </span>
                  {displayDate}
                </span>
              )}
              {event.time && (
                <>
                  <span aria-hidden>•</span>
                  <span>
                    <span aria-hidden>⏰ </span>
                    {event.time}
                  </span>
                </>
              )}
              {event.location && (
                <>
                  <span aria-hidden>•</span>
                  <span>
                    <span aria-hidden>📍 </span>
                    {event.location}
                  </span>
                </>
              )}
            </div>
          )}
        </header>

        {/* Description */}
        {event.description && (
          <section className="prose prose-sm max-w-none text-gray-800 prose-headings:font-serif prose-a:text-forest">
            <p>{event.description}</p>
          </section>
        )}

        {/* Related resources */}
        {resources &&
        ((resources.downloads && resources.downloads.length > 0) ||
          (resources.links && resources.links.length > 0)) ? (
          <section className="mt-10 border-t border-lightGrey pt-8">
            <h2 className="font-serif text-xl font-semibold text-deepCharcoal">
              {resources.heading || "Resources for this event"}
            </h2>
            {resources.description && (
              <p className="mt-1 text-sm text-gray-600">
                {resources.description}
              </p>
            )}

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {(resources.downloads ?? []).map((r, idx) => (
                <RelatedResourceCard
                  key={`download-${idx}-${r.slug ?? r.title ?? idx}`}
                  resource={r}
                  kindLabel="Download"
                />
              ))}
              {(resources.links ?? []).map((r, idx) => (
                <RelatedResourceCard
                  key={`link-${idx}-${r.slug ?? r.title ?? idx}`}
                  resource={r}
                  kindLabel="Link"
                />
              ))}
            </div>
          </section>
        ) : null}

        {/* Back link */}
        <div className="mt-10">
          <Link
            href="/events"
            className="text-sm text-forest underline-offset-4 hover:underline"
          >
            View all events
          </Link>
        </div>
      </main>
    </Layout>
  );
}

/* -------------------------------------------------------------------------- */
/*  Related resource card                                                     */
/* -------------------------------------------------------------------------- */

type RelatedResourceProps = {
  resource: RelatedResourceSerialized;
  kindLabel?: string;
};

function RelatedResourceCard({
  resource,
  kindLabel = "Resource",
}: RelatedResourceProps) {
  const title = resource.title || "Resource";
  const hasCover =
    typeof resource.coverImage === "string" &&
    resource.coverImage.trim().length > 0;

  const href =
    typeof resource.href === "string" && resource.href.trim().length > 0
      ? resource.href
      : resource.slug
      ? `/${resource.slug}`
      : null;

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) =>
    href ? (
      href.startsWith("http") ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          {children}
        </a>
      ) : (
        <Link href={href} className="block">
          {children}
        </Link>
      )
    ) : (
      <>{children}</>
    );

  return (
    <article className="group overflow-hidden rounded-xl border border-lightGrey bg-white shadow-sm transition hover:shadow-md">
      <Wrapper>
        {hasCover && (
          <div className="relative w-full aspect-[4/3] overflow-hidden">
            <Image
              src={resource.coverImage as string}
              alt={title}
              fill
              sizes="(min-width: 1024px) 480px, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
          </div>
        )}

        <div className="p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">
            {kindLabel}
          </p>
          <h3 className="mt-1 font-serif text-lg text-deepCharcoal">
            {title}
          </h3>
          {resource.description && (
            <p className="mt-2 line-clamp-3 text-sm text-gray-600">
              {resource.description}
            </p>
          )}
        </div>
      </Wrapper>
    </article>
  );
}