import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import Layout from "@/components/Layout";
import type { GetStaticPaths, GetStaticProps } from "next";
import { getAllEvents, getEventBySlug, getEventSlugs } from "@/lib/events";
import type { EventMeta } from "@/types/event";
import MDXRenderer from "@/components/MDXRenderer"; // <- use your blog MDX renderer

type Props = { event: EventMeta & { content?: string } };

export default function EventPage({ event }: Props) {
  const { title, date, location, summary, heroImage, ctaHref, ctaLabel, content } = event;

  const pretty = date
    ? new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    : "";

  return (
    <Layout pageTitle={title}>
      <Head>
        <meta name="description" content={summary || title} />
      </Head>

      {heroImage ? (
        <div className="relative h-[40vh] min-h-[320px] w-full">
          <Image src={heroImage} alt={title} fill priority sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-black/35" />
          <div className="absolute inset-x-0 bottom-0 mx-auto max-w-5xl p-6 text-cream">
            <h1 className="font-serif text-4xl font-semibold">{title}</h1>
            <p className="mt-2 text-cream/90 text-sm">
              {pretty} • {location}
            </p>
          </div>
        </div>
      ) : (
        <header className="mx-auto max-w-5xl px-4 py-10">
          <h1 className="font-serif text-4xl font-semibold">{title}</h1>
          <p className="mt-2 text-deepCharcoal/70 text-sm">
            {pretty} • {location}
          </p>
        </header>
      )}

      <section className="mx-auto max-w-5xl px-4 py-10 prose prose-lg prose-slate">
        {content ? <MDXRenderer source={content} /> : null}

        {ctaHref && (
          <div className="mt-10">
            <Link href={ctaHref} className="rounded-full bg-forest px-6 py-3 text-cream font-semibold hover:bg-forest/90">
              {ctaLabel || "Register Interest"}
            </Link>
          </div>
        )}
      </section>
    </Layout>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const paths = getEventSlugs().map((slug) => ({ params: { slug } }));
  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");
  const event = getEventBySlug(slug, [
    "slug",
    "title",
    "date",
    "location",
    "summary",
    "heroImage",
    "ctaHref",
    "ctaLabel",
    "content",
    "tags",
  ]);

  if (!event?.slug) return { notFound: true };
  return { props: { event: event as Props["event"] } };
};
