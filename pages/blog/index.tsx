// NOTE: identical to your current Home, just ensure Layout gets `hideCTA`
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
  date: string;
  location: string | null;
  description?: string | null;
  tags?: string[] | null;
};
type EventsTeaser = Array<EventsTeaserItem>;

type HomeProps = {
  posts: PostMeta[];
  booksCount: number;
  eventsTeaser: EventsTeaser;
};

const LONDON_TZ = "Europe/London";
const isDateOnly = (s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s);
function londonDayKey(d: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: LONDON_TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
function isUpcomingLondon(isoish: string) {
  if (!isoish) return false;
  const todayKey = londonDayKey(new Date());
  if (isDateOnly(isoish)) return isoish >= todayKey;
  const d = new Date(isoish);
  if (Number.isNaN(d.valueOf())) return false;
  return londonDayKey(d) >= todayKey;
}

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

      {/* …your existing sections unchanged… */}
      {/* (Keep your Hero, Featured Insights, Books, Events, Ventures, Testimonials, Closing CTA) */}
      {/* I’m not duplicating everything here to keep this reply compact.
          The only required change is <Layout pageTitle="Home" hideCTA>. */}
    </Layout>
  );
}

Home.displayName = "Home";
export default Home;

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

  const rawEvents = getAllEvents(["slug", "title", "date", "location", "summary", "tags"]);
  const deduped = dedupeEventsByTitleAndDay(
    rawEvents
      .filter((e): e is Required<Pick<EventMeta, "slug" | "title" | "date">> & Partial<EventMeta> => Boolean(e?.slug && e?.title && e?.date))
      .map((e: any) => ({
        slug: String(e.slug),
        title: String(e.title),
        date: String(e.date),
        location: e.location ?? null,
        summary: e.summary ?? null,
        tags: Array.isArray(e.tags) ? e.tags : null,
      }))
  );

  const upcomingSorted = deduped
    .filter((e) => isUpcomingLondon(e.date))
    .sort((a, b) => +new Date(a.date) - +new Date(b.date));

  const eventsTeaser: EventsTeaser = upcomingSorted.slice(0, 3).map((e: any) => ({
    slug: e.slug,
    title: e.title,
    date: e.date,
    location: e.location ?? null,
    description: e.summary ?? null,
    tags: Array.isArray(e.tags) ? e.tags : null,
  }));

  return { props: { posts: safePosts, booksCount, eventsTeaser }, revalidate: 3600 };
}
