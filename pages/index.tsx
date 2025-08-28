import * as React from "react";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import BookCard from "@/components/BookCard";
import BlogPostCard from "@/components/BlogPostCard";
import EventCard from "@/components/events/EventCard";
import { getAllPosts } from "@/lib/mdx";
import { getAllBooks } from "@/lib/books";
import { getAllEvents } from "@/lib/server/events-data";
import type { PostMeta } from "@/types/post";
import type { EventMeta } from "@/types/events";
import { motion } from "framer-motion";
import { dedupeEventsByTitleAndDay } from "@/utils/events";

const HERO = {
  poster: "/assets/images/abraham-of-london-banner.webp",
  videoMp4: "/assets/video/brand-reel.mp4#t=0,5",
  videoWebm: "/assets/video/brand-reel.webm#t=0,5",
};

type EventsTeaserItem = {
  slug: string;
  title: string;
  date: string;              // "YYYY-MM-DD" or ISO
  location: string | null;
  description?: string | null;
  tags?: string[] | null;
  heroImage?: string | null;
};
type EventsTeaser = Array<EventsTeaserItem>;

type HomeProps = {
  posts: PostMeta[];
  booksCount: number;
  eventsTeaser: EventsTeaser;
};

function Home({ posts, booksCount, eventsTeaser }: HomeProps) {
  const router = useRouter();

  const incomingQ = typeof router.query.q === "string" ? router.query.q.trim() : "";
  const qSuffix = incomingQ ? `?q=${encodeURIComponent(incomingQ)}` : "";
  const blogHref = `/blog?sort=newest${incomingQ ? `&q=${encodeURIComponent(incomingQ)}` : ""}`;
  const booksHref = `/books${qSuffix}`;
  const postsCount = posts.length;

  return (
    <Layout pageTitle="Home" hideCTA>
      <Head>
        <meta
          name="description"
          content="Principled strategy, writing, and ventures that prioritise signal over noise. Discreet Chatham Rooms available—off the record."
        />
        <link rel="preload" as="image" href={HERO.poster} />
        <meta property="og:type" content="website" />
      </Head>

      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-white">
        <div className="absolute inset-0 -z-10">
          <Image src={HERO.poster} alt="" fill priority sizes="100vw" className="object-cover" />
          {(HERO.videoMp4 || HERO.videoWebm) && (
            <video
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              playsInline
              muted
              loop
              poster={HERO.poster}
              preload="metadata"
              aria-hidden="true"
            >
              {HERO.videoWebm ? <source src={HERO.videoWebm} type="video/webm" /> : null}
              {HERO.videoMp4 ? <source src={HERO.videoMp4} type="video/mp4" /> : null}
            </video>
          )}
          <div className="absolute inset-0 bg-black/35" aria-hidden="true" />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-28 sm:py-36">
          <div className="mx-auto max-w-3xl text-center">
            <motion.h1
              className="font-serif text-4xl font-bold tracking-wide text-white sm:text-6xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Principled Strategy for a Legacy That Endures
            </motion.h1>

            <motion.p
              className="mt-6 text-lg leading-8 text-white/85"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.15 }}
            >
              I help leaders build with clarity, discipline, and standards that endure—across family, enterprise, and society.
            </motion.p>

            <motion.p
              className="mt-3 text-xs tracking-wide text-white/70"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              Chatham Rooms available — off the record
            </motion.p>

            <motion.div
              className="mt-8 flex justify-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Link
                href={booksHref}
                className="rounded-full bg-forest px-6 py-3 text-white shadow-sm transition hover:bg-primary-hover"
                prefetch={false}
              >
                Explore Books
              </Link>
              <Link
                href={blogHref}
                className="rounded-full border border-white/80 px-6 py-3 text-white transition hover:bg-white/10"
                prefetch={false}
              >
                Featured Insights
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Page header crumb & counts */}
      <section className="border-b border-lightGrey/70 bg-warmWhite/60">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
          <nav aria-label="Breadcrumb" className="text-deepCharcoal/70">
            <ol className="flex items-center gap-2">
              <li>
                <Link href="/" className="hover:text-deepCharcoal" prefetch={false}>Home</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="text-deepCharcoal/80">Overview</li>
              {incomingQ ? (
                <>
                  <li aria-hidden="true">/</li>
                  <li className="text-deepCharcoal/60">“{incomingQ}”</li>
                </>
              ) : null}
            </ol>
          </nav>

          <div className="flex items-center gap-3">
            <Link
              href={booksHref}
              className="rounded-full border border-lightGrey bg-white px-3 py-1 text-deepCharcoal/80 hover:text-deepCharcoal"
              aria-label={`View books (${booksCount})`}
              prefetch={false}
            >
              Books <span className="ml-1 text-deepCharcoal/60">({booksCount})</span>
            </Link>
            <Link
              href={blogHref}
              className="rounded-full border border-lightGrey bg-white px-3 py-1 text-deepCharcoal/80 hover:text-deepCharcoal"
              aria-label={`View insights (${postsCount})`}
              prefetch={false}
            >
              Insights <span className="ml-1 text-deepCharcoal/60">({postsCount})</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Insights */}
      <section className="bg-warmWhite px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex items-end justify-between">
            <h2 className="font-serif text-3xl font-semibold text-deepCharcoal">Featured Insights</h2>
            <Link
              href={blogHref}
              className="text-sm font-medium text-deepCharcoal underline decoration-softGold/50 underline-offset-4 hover:decoration-softGold"
              prefetch={false}
            >
              Read the blog
            </Link>
          </header>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.slice(0, 3).map((p) => (
              <BlogPostCard
                key={p.slug}
                slug={p.slug}
                title={p.title}
                date={p.date ?? undefined}
                excerpt={p.excerpt ?? undefined}
                coverImage={p.coverImage ?? undefined}
                author={p.author ?? undefined}
                readTime={p.readTime ?? undefined}
                category={p.category ?? undefined}
                tags={p.tags ?? undefined}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Featured Books */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex items-end justify-between">
            <h2 className="font-serif text-3xl font-semibold text-deepCharcoal">Featured Books</h2>
            <Link
              href={booksHref}
              className="text-sm font-medium text-deepCharcoal underline decoration-softGold/50 underline-offset-4 hover:decoration-softGold"
              prefetch={false}
            >
              View all
            </Link>
          </header>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <BookCard
              slug="fathering-without-fear"
              title="Fathering Without Fear"
              author="Abraham of London"
              excerpt="A bold memoir reclaiming fatherhood—clarity, discipline, and standards that endure."
              genre="Memoir"
              featured
              coverImage="/assets/images/fathering-without-fear-teaser.jpg"
            />
            <BookCard
              slug="the-fiction-adaptation"
              title="The Fiction Adaptation"
              author="Abraham of London"
              excerpt="A dramatized reimagining of lived conviction—raw, luminous, and cinematic."
              genre="Drama"
              coverImage="/assets/images/fathering-without-fear.jpg"
            />
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="bg-white px-4 pb-4 pt-2">
        <div className="mx-auto max-w-7xl">
          <header className="mb-2 flex items-end justify-between">
            <h2 className="font-serif text-3xl font-semibold text-deepCharcoal">Upcoming Events</h2>
            <Link
              href="/events"
              className="text-sm font-medium text-deepCharcoal underline decoration-softGold/50 underline-offset-4 hover:decoration-softGold"
              prefetch={false}
            >
              View all
            </Link>
          </header>
          <p className="mb-6 text-xs text-deepCharcoal/60">
            Select sessions run as Chatham Rooms (off the record).
          </p>

          {eventsTeaser.length === 0 ? (
            <p className="text-sm text-deepCharcoal/70">No upcoming events at the moment.</p>
          ) : (
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {eventsTeaser.map((ev) => (
                <li key={ev.slug}>
                  <EventCard
                    slug={ev.slug}
                    title={ev.title}
                    date={ev.date}
                    location={ev.location ?? undefined}
                    description={ev.description ?? undefined}
                    tags={ev.tags ?? undefined}
                    heroImage={ev.heroImage ?? undefined}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Ventures */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <h2 className="font-serif text-3xl font-semibold text-deepCharcoal">Ventures</h2>
            <p className="mt-2 text-sm text-deepCharcoal/70">
              A portfolio built on craftsmanship, stewardship, and endurance.
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-3">
            <Link
              href="/ventures?brand=alomarada"
              className="group rounded-2xl border border-lightGrey bg-white p-6 shadow-card transition hover:shadow-cardHover"
              prefetch={false}
            >
              <div className="flex items-center justify-between">
                <p className="font-serif text-xl font-semibold text-deepCharcoal">Alomarada</p>
                <span className="text-sm text-softGold transition group-hover:translate-x-0.5">Explore →</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-deepCharcoal/80">
                Strategy & capital—focused on durable businesses with moral clarity and operational discipline.
              </p>
            </Link>

            <Link
              href="/ventures?brand=endureluxe"
              className="group rounded-2xl border border-lightGrey bg-white p-6 shadow-card transition hover:shadow-cardHover"
              prefetch={false}
            >
              <div className="flex items-center justify-between">
                <p className="font-serif text-xl font-semibold text-deepCharcoal">Endureluxe</p>
                <span className="text-sm text-softGold transition group-hover:translate-x-0.5">Explore →</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-deepCharcoal/80">
                Essential goods and refined experiences—engineered to last, designed to serve.
              </p>
            </Link>

            <Link
              href="/about"
              className="group rounded-2xl border border-lightGrey bg-white p-6 shadow-card transition hover:shadow-cardHover"
              prefetch={false}
            >
              <div className="flex items-center justify-between">
                <p className="font-serif text-xl font-semibold text-deepCharcoal">Abraham of London</p>
                <span className="text-sm text-softGold transition group-hover:translate-x-0.5">Explore →</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-deepCharcoal/80">
                Writing, counsel, and cultural work at the intersection of family, enterprise, and society.
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-warmWhite px-4 py-16">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8">
            <h2 className="font-serif text-3xl font-semibold text-deepCharcoal">What Leaders Say</h2>
          </header>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              { quote: "Clear thinking. Strong standards. Abraham brings both to the table.", name: "E. K., Founder" },
              { quote: "He positions problems with moral clarity—and then solves them.", name: "M. A., Director" },
              { quote: "No noise. Just the signal you need to make enduring decisions.", name: "R. T., Investor" },
            ].map((t) => (
              <figure key={t.name} className="rounded-2xl border border-lightGrey bg-white p-6 shadow-card">
                <blockquote className="text-sm leading-relaxed text-deepCharcoal/90">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-xs font-medium text-deepCharcoal/70">— {t.name}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="relative isolate overflow-hidden bg-deepCharcoal">
        <div className="absolute inset-0 -z-10">
          <Image
            src="/assets/images/cta/cta-bg.jpg"
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-20"
            priority={false}
          />
        </div>

        <div className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h3 className="font-serif text-3xl font-semibold text-cream">
            Build with Clarity. Lead with Standards. Leave a Legacy.
          </h3>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-cream/85">
            Start a conversation that moves your family, your venture, and your community forward.
          </p>
          <div className="mt-8">
            <Link
              href="/contact"
              className="rounded-full bg-softGold px-7 py-3 text-sm font-semibold text-deepCharcoal transition hover:brightness-95"
              prefetch={false}
            >
              Connect with a Strategist
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}

Home.displayName = "Home";
export default Home;

/* --------- SSG + ISR --------- */
export async function getStaticProps() {
  const posts = getAllPosts();

  const safePosts = posts.map((p) => ({
    ...p,
    excerpt: p.excerpt ?? null,
    date: p.date ?? null,
    coverImage: p.coverImage ?? null,
    readTime: p.readTime ?? null,
    category: p.category ?? null,
    author: p.author ?? null,
    tags: p.tags ?? null,
  }));

  const booksCount = getAllBooks(["slug"]).length;

  // Include heroImage for events
  const rawEvents = getAllEvents(["slug", "title", "date", "location", "summary", "tags", "heroImage"]);

  const deduped = dedupeEventsByTitleAndDay(
    rawEvents
      .filter(
        (e): e is Required<Pick<EventMeta, "slug" | "title" | "date">> & Partial<EventMeta> =>
          Boolean(e?.slug && e?.title && e?.date)
      )
      .map((e: any) => ({
        slug: String(e.slug),
        title: String(e.title),
        date: String(e.date),
        location: e.location ?? null,
        summary: e.summary ?? null,
        tags: Array.isArray(e.tags) ? e.tags : null,
        heroImage: e.heroImage ?? null,
      }))
  );

  const upcomingSorted = deduped
    .filter((e) => {
      const todayKey = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/London",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date());
      const only = /^\d{4}-\d{2}-\d{2}$/.test(e.date);
      if (only) return e.date >= todayKey;
      const d = new Date(e.date);
      if (Number.isNaN(d.valueOf())) return false;
      const key = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Europe/London",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d);
      return key >= todayKey;
    })
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const eventsTeaser: EventsTeaser = upcomingSorted.slice(0, 3).map((e: any) => ({
    slug: e.slug,
    title: e.title,
    date: e.date,
    location: e.location ?? null,
    description: e.summary ?? null,
    tags: Array.isArray(e.tags) ? e.tags : null,
    heroImage: e.heroImage ?? null,
  }));

  return {
    props: { posts: safePosts, booksCount, eventsTeaser },
    revalidate: 3600,
  };
}
