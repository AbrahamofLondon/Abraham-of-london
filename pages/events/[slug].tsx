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
  const anyEv = event as Record<string, unknown>;

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
    slug: String(anyEv.slug ?? "").trim(),
    title: (anyEv.title as string | undefined) ?? "",
    date,
    time: (anyEv.time as string | null | undefined) ?? null,
    location:
      (anyEv.location as string | null | undefined) ??
      (anyEv.venue as string | null | undefined) ??
      null,
    description:
      (anyEv.description as string | null | undefined) ??
      (anyEv.excerpt as string | null | undefined) ??
      null,
    heroImage,
    coverImage:
      typeof anyEv.coverImage === "string" ? anyEv.coverImage : heroImage,
    tags: Array.isArray(anyEv.tags) ? (anyEv.tags as string[]) : null,
  };
}

/**
 * Normalise resources into a serialisable shape.
 * Accepts unknown because the underlying implementation is loose.
 */
function serialiseResources(
  resources: unknown
): EventResourcesSerialized | null {
  if (!resources || typeof resources !== "object") return null;

  const anyRes = resources as Record<string, unknown>;

  const toRel = (item: unknown): RelatedResourceSerialized => {
    if (!item || typeof item !== "object") return {};
    const itemObj = item as Record<string, unknown>;
    return {
      slug: (itemObj.slug as string | null | undefined) ?? null,
      title: (itemObj.title as string | null | undefined) ?? null,
      description:
        (itemObj.description as string | null | undefined) ??
        (itemObj.excerpt as string | null | undefined) ??
        null,
      coverImage:
        typeof itemObj.coverImage === "string" ? itemObj.coverImage : null,
      href: typeof itemObj.href === "string" ? itemObj.href : null,
      kind: (itemObj.kind as string | null | undefined) ?? null,
    };
  };

  const downloadsSource = Array.isArray(anyRes.downloads)
    ? anyRes.downloads
    : [];

  const linksSource = Array.isArray(anyRes.links) ? anyRes.links : [];

  return {
    heading: typeof anyRes.heading === "string" ? anyRes.heading : null,
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

  const normalisedSlugs = slugs
    .map((s) => String(s).trim())
    .filter((s) => s.length > 0);

  const paths =
    normalisedSlugs.length > 0
      ? normalisedSlugs.map((slug) => ({ params: { slug } }))
      : [];

  return {
    paths,
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<EventPageProps> = async (ctx) => {
  const slugParam = ctx.params?.slug;
  const rawSlug = Array.isArray(slugParam) ? slugParam[0] : (slugParam ?? "");

  const slug = String(rawSlug).trim();

  if (!slug) {
    return { notFound: true };
  }

  // Tolerate sync/async implementations
  const rawEvent = await Promise.resolve(getEventBySlug(slug));
  if (!rawEvent) {
    return { notFound: true };
  }

  // NOTE: treat resources as unknown – implementation is loose
  let rawResources: unknown = null;
  try {
    rawResources = await Promise.resolve(
      getEventResourcesSummary ? getEventResourcesSummary() : null
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
    event.date && new Date(event.date).toString() !== "Invalid Date"
      ? new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(new Date(event.date))
      : null;

  const hasHeroImage =
    typeof event.heroImage === "string" && event.heroImage.trim().length > 0;

  return (
    <Layout title={pageTitle}>
      <Head>
        <title>{pageTitle} | Abraham of London</title>
        {event.description && (
          <meta name="description" content={event.description} />
        )}
      </Head>

      <div className="bg-gradient-to-b from-black via-deepCharcoal to-black">
        <main className="mx-auto max-w-6xl px-4 pb-16 pt-10 lg:pt-12">
          {/* Breadcrumb */}
          <nav className="mb-6 text-sm text-gray-400">
            <Link
              href="/"
              className="hover:text-softGold hover:underline underline-offset-4"
            >
              Home
            </Link>
            <span className="mx-2 select-none text-gray-500">/</span>
            <Link
              href="/events"
              className="hover:text-softGold hover:underline underline-offset-4"
            >
              Events
            </Link>
            {event.title && (
              <>
                <span className="mx-2 select-none text-gray-500">/</span>
                <span className="text-gray-300 line-clamp-1">
                  {event.title}
                </span>
              </>
            )}
          </nav>

          {/* HERO CARD */}
          <section className="mb-10 overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-softGold/10 via-deepCharcoal to-black shadow-2xl shadow-black/40">
            <div className="relative grid gap-0 md:grid-cols-[1.1fr_1fr]">
              {/* Left: image or gradient */}
              <div className="relative min-h-[220px] md:min-h-[260px]">
                {hasHeroImage ? (
                  <>
                    <Image
                      src={event.heroImage as string}
                      alt={event.title ?? ""}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover"
                      priority
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent" />
                  </>
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.13),transparent_55%),linear-gradient(135deg,_rgba(234,179,8,0.35),_rgba(15,23,42,0.95))]" />
                )}
              </div>

              {/* Right: content */}
              <div className="relative flex flex-col justify-center gap-4 p-6 text-white md:p-8 lg:p-10">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-softGold">
                  <span>Event</span>
                  {displayDate && (
                    <>
                      <span className="text-white/30">•</span>
                      <span>{displayDate}</span>
                    </>
                  )}
                  {event.location && (
                    <>
                      <span className="text-white/30">•</span>
                      <span className="line-clamp-1">{event.location}</span>
                    </>
                  )}
                </div>

                <h1 className="font-serif text-2xl font-semibold leading-snug md:text-3xl lg:text-4xl">
                  {event.title}
                </h1>

                {event.time && (
                  <p className="text-sm text-amber-100/90">⏰ {event.time}</p>
                )}

                {event.description && (
                  <p className="max-w-xl text-sm text-gray-100 md:text-base">
                    {event.description}
                  </p>
                )}

                {event.tags && event.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {event.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center rounded-full bg-black/40 px-3 py-1 text-xs text-gray-200"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <a
                    href="#event-details"
                    className="inline-flex items-center rounded-full bg-softGold px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-950 shadow-lg shadow-black/50 transition hover:bg-softGold/90"
                  >
                    View Event Details
                  </a>
                  <Link
                    href="/contact"
                    className="inline-flex items-center rounded-full border border-white/40 px-6 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 transition hover:bg-white/10"
                  >
                    Register Interest
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* DETAILS + RESOURCES */}
          <section
            id="event-details"
            className="mx-auto max-w-4xl rounded-3xl bg-white/95 p-6 shadow-xl shadow-black/30 ring-1 ring-black/5 md:p-10"
          >
            {/* Core details block */}
            <div className="mb-6 grid gap-4 text-sm text-gray-700 md:grid-cols-2">
              {displayDate && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
                    Date
                  </p>
                  <p className="mt-1 text-sm text-deepCharcoal">
                    {displayDate}
                  </p>
                </div>
              )}
              {event.time && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
                    Time
                  </p>
                  <p className="mt-1 text-sm text-deepCharcoal">{event.time}</p>
                </div>
              )}
              {event.location && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">
                    Location
                  </p>
                  <p className="mt-1 text-sm text-deepCharcoal">
                    {event.location}
                  </p>
                </div>
              )}
            </div>

            {/* Description again, but in richer prose if needed */}
            {event.description && (
              <div className="prose prose-sm max-w-none text-gray-800 prose-headings:font-serif prose-a:text-forest">
                <p>{event.description}</p>
              </div>
            )}

            {/* Related resources */}
            {resources &&
            ((resources.downloads && resources.downloads.length > 0) ||
              (resources.links && resources.links.length > 0)) ? (
              <section className="mt-10 border-t border-lightGrey pt-8">
                <h2 className="mb-2 font-serif text-xl font-semibold text-deepCharcoal">
                  {resources.heading || "Resources for this event"}
                </h2>
                {resources.description && (
                  <p className="mb-4 text-sm text-gray-600">
                    {resources.description}
                  </p>
                )}

                <div className="grid gap-5 md:grid-cols-2">
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

            {/* CTA strip */}
            <section className="mt-10 rounded-2xl bg-gradient-to-r from-forest via-deepCharcoal to-softGold p-6 text-center text-white md:p-8">
              <h2 className="mb-3 text-xl font-serif font-semibold md:text-2xl">
                Want to be in the room when it happens?
              </h2>
              <p className="mx-auto mb-6 max-w-2xl text-sm opacity-90 md:text-base">
                Use the contact form to express interest, or join the newsletter
                to get first notice when registrations open for events like the
                Founder&apos;s Salon and Fathers & Futures.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href="/contact"
                  className="inline-flex items-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-deepCharcoal transition hover:bg-gray-100"
                >
                  Contact Abraham
                </Link>
                <Link
                  href="/newsletter"
                  className="inline-flex items-center rounded-full border border-white px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Join Inner Circle
                </Link>
              </div>
            </section>
          </section>

          {/* Back link */}
          <div className="mt-10 text-center">
            <Link
              href="/events"
              className="text-sm text-softGold underline-offset-4 hover:underline"
            >
              View all events
            </Link>
          </div>
        </main>
      </div>
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
          <h3 className="mt-1 font-serif text-lg text-deepCharcoal">{title}</h3>
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
