// ./pages/events/[slug].tsx

import type { GetStaticPaths, GetStaticProps } from "next";
import Image from "next/image";
import Head from "next/head";
import * as React from "react";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import Layout from "@/components/Layout";
import { components } from "@/components/MdxComponents";
import EventResources from "@/components/events/EventResources";
// FIX: Use namespace import to prevent "Exported identifiers must be unique" error
import * as EventsData from "@/lib/server/events-data";
import type { EventMeta } from "@/lib/events"; // Assuming EventMeta is imported from here

/* ---------- types ---------- */
type LinkItem = { href: string; label: string; sub?: string };

type FMResources =
  | {
      title?: string;
      preset?: "leadership" | "founders";
      reads?: LinkItem[];
      downloads?: { href: string; label: string }[];
    }
  | null;

type Props = {
  meta: {
    slug: string;
    title: string;
    date: string;
    // Ensure this type also matches the EventMeta addition
    endDate: string | null; 
    location: string | null;
    summary: string | null;
    heroImage: string | null;
    tags: string[];
    resources: FMResources;
    chatham: boolean;
  };
  content: MDXRemoteSerializeResult;
};

/* ---------- utils ---------- */
const isDateOnly = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
function niceDate(iso?: string, tz = "Europe/London") {
  if (!iso) return "";
  if (isDateOnly(iso)) {
    const [y, m, d] = iso.split("-").map(Number);
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: "UTC",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(new Date(Date.UTC(y, m - 1, d)));
  }
  const d = new Date(iso);
  const dateStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
  const timeStr = new Intl.DateTimeFormat("en-GB", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(d);
  return /\b00:00\b/.test(timeStr) ? dateStr : `${dateStr}, ${timeStr}`;
}

/** Ensure no `undefined` is returned inside props */
function toJSONSafe<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj, (_k, v) => (typeof v === "undefined" ? null : v)));
}

/* ---------- SSG ---------- */
export const getStaticPaths: GetStaticPaths = async () => {
  // Use namespaced import
  const slugs = await EventsData.getEventSlugs(); 
  return { paths: slugs.map((slug) => ({ params: { slug } })), fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");
  
  // Use namespaced import and await. raw is now of type EventMeta (which includes endDate)
  const raw = await EventsData.getEventBySlug(slug);

  if (!raw) {
    return { notFound: true };
  }

  // Parse MDX with front matter to pull optional per-page keys like resources/chatham
  const mdx = await serialize(String(raw.content || ""), {
    parseFrontmatter: true,
    mdxOptions: { remarkPlugins: [], rehypePlugins: [], format: "mdx" },
  });

  const fm: any = (mdx as any).frontmatter || {};
  const fmResources: FMResources = fm.resources ?? null;
  const tagList = Array.isArray(raw.tags) ? raw.tags.map(String) : [];
  const chatham = fm.chatham === true || tagList.some((t) => t.toLowerCase() === "chatham");

  const meta = {
    slug: String(raw.slug || slug),
    title: String(raw.title || slug),
    date: String(raw.date || new Date().toISOString()),
    // FIX: This line now works because EventMeta was updated
    endDate: raw.endDate ? String(raw.endDate) : null,
    location: raw.location ? String(raw.location) : null,
    summary: raw.summary ? String(raw.summary) : null,
    heroImage: raw.heroImage ? String(raw.heroImage) : null,
    tags: tagList,
    resources: fmResources,
    chatham,
  };

  return {
    props: toJSONSafe({
      meta,
      content: mdx,
    }),
    revalidate: 60,
  };
};

/* ---------- Page ---------- */
export default function EventPage({ meta, content }: Props) {
  const { slug, title, date, location, summary, heroImage, tags, resources, chatham } = meta;

  const when = niceDate(date);

  // Try explicit hero, then conventional names, then fallback
  const heroSrcCandidates = React.useMemo(() => {
    const clean = (p?: string | null) =>
      p && !/^https?:\/\//i.test(p) ? (p.startsWith("/") ? p : `/${p}`) : p || undefined;
    const explicit = clean(heroImage);
    const base = slug
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const exts = ["webp", "jpg", "jpeg", "png"];
    return Array.from(
      new Set([explicit, ...exts.map((e) => `/assets/images/events/${base}.${e}`), "/assets/images/events/default.jpg"].filter(Boolean))
    ) as string[];
  }, [slug, heroImage]);

  const [i, setI] = React.useState(0);
  const heroSrc = heroSrcCandidates[i];
  const onHeroError = React.useCallback(
    () => setI((x) => (x + 1 < heroSrcCandidates.length ? x + 1 : x)),
    [heroSrcCandidates.length]
  );

  return (
    <Layout pageTitle={title} hideCTA>
      <Head>
        <meta name="description" content={summary || title} />
        <meta property="og:type" content="event" />
      </Head>

      {/* Hero */}
      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-4 py-10 md:grid-cols-2 md:py-14">
          <div>
            {chatham && (
              <p className="mb-2 text-[10px] tracking-[0.16em] text-[color:var(--color-on-secondary)/0.6] uppercase">
                Chatham Rooms Available
              </p>
            )}
            <h1 className="font-serif text-4xl font-semibold text-deepCharcoal sm:text-5xl">{title}</h1>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[color:var(--color-on-secondary)/0.7]">
              <time dateTime={date}>{when}</time>
              {location && (
                <>
                  <span aria-hidden>•</span>
                  <span>{location}</span>
                </>
              )}
              {tags?.length ? (
                <>
                  <span aria-hidden>•</span>
                  <span className="inline-flex flex-wrap gap-1">
                    {tags.slice(0, 3).map((t) => (
                      <span key={t} className="rounded border border-lightGrey bg-warmWhite px-2 py-0.5 text-xs">
                        {t}
                      </span>
                    ))}
                  </span>
                </>
              ) : null}
            </div>

            {summary && <p className="mt-5 max-w-prose text-[color:var(--color-on-secondary)/0.85]">{summary}</p>}
          </div>

          {heroSrc && (
            <div className="relative w-full overflow-hidden rounded-2xl border border-lightGrey/70 bg-warmWhite p-3 shadow-card aspect-[2/3] md:aspect-[16/10]">
              <Image
                src={heroSrc}
                alt=""
                fill
                sizes="(max-width:768px) 100vw, 50vw"
                className="object-contain"
                onError={onHeroError}
                priority={false}
              />
            </div>
          )}
        </div>
      </section>

      {/* Body + Resources */}
      <article className="mx-auto max-w-3xl px-4 pb-12">
        <div className="prose md:prose-lg max-w-none text-deepCharcoal dark:prose-invert">
          <MDXRemote {...content} components={MDXComponents} />
        </div>

        {resources ? (
          (resources as any).preset ? (
            <EventResources preset={(resources as any).preset} className="mt-12" />
          ) : (
            <EventResources
              title={resources.title}
              reads={resources.reads}
              downloads={resources.downloads}
              className="mt-12"
            />
          )
        ) : (
          <EventResources
            preset={tags?.some((t) => /founder|venture|capital/i.test(t)) ? "founders" : "leadership"}
            className="mt-12"
          />
        )}
      </article>
    </Layout>
  );
}