// pages/events/[slug].tsx
import type { GetStaticPaths, GetStaticProps } from "next";
import * as React from "react";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import Layout from "@/components/Layout";
import SEOHead from "@/components/SEOHead";
import EventHero from "@/components/events/EventHero";
import { MDXComponents } from "@/components/MDXComponents";
import MDXProviderWrapper from "@/components/MDXProviderWrapper";
import EventResources from "@/components/events/EventResources";

import { absUrl } from "@/lib/siteConfig";
import { getAllEvents, getEventBySlug } from "@/lib/server/events-data";

type FrontmatterExtras = {
  reads?: { href: string; label: string; sub?: string }[];
  downloads?: { href: string; label: string }[];
};

type EventPageMeta = {
  slug: string;
  title: string;
  date?: string | null;
  endDate?: string | null;
  location?: string | null;
  summary?: string | null;
  heroImage?: string | null;
  tags?: string[] | null;
} & FrontmatterExtras;

type Props = {
  meta: EventPageMeta;
  mdx: MDXRemoteSerializeResult;
};

export const getStaticPaths: GetStaticPaths = async () => {
  const items = getAllEvents(["slug"]);
  const paths = items
    .map((e) => e.slug)
    .filter(Boolean)
    .map((slug) => ({ params: { slug: String(slug) } }));
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");
  const raw = getEventBySlug(slug, [
    "slug",
    "title",
    "date",
    "endDate",
    "location",
    "summary",
    "heroImage",
    "tags",
    "content",
  ]) as any;

  if (!raw?.slug || !raw?.title) return { notFound: true };

  // Pull resource arrays directly from front-matter if present
  const reads = Array.isArray(raw.reads) ? raw.reads : [];
  const downloads = Array.isArray(raw.downloads) ? raw.downloads : [];

  const meta: EventPageMeta = {
    slug: raw.slug,
    title: raw.title,
    date: raw.date ?? null,
    endDate: raw.endDate ?? null,
    location: raw.location ?? null,
    summary: raw.summary ?? null,
    heroImage: raw.heroImage ?? null,
    tags: Array.isArray(raw.tags) ? raw.tags : null,
    reads,
    downloads,
  };

  const source = String(raw.content || "");
  const mdx = await serialize(source, {
    parseFrontmatter: false,
    scope: meta,
    mdxOptions: { remarkPlugins: [], rehypePlugins: [], format: "mdx" },
  });

  return { props: { meta, mdx }, revalidate: 60 };
};

export default function EventPage({ meta, mdx }: Props) {
  const coverForMeta = meta.heroImage
    ? absUrl(meta.heroImage)
    : absUrl("/assets/images/social/og-image.jpg");

  return (
    <Layout pageTitle={meta.title} hideCTA>
      <SEOHead
        title={meta.title}
        description={meta.summary ?? ""}
        slug={`/events/${meta.slug}`}
        coverImage={coverForMeta}
        publishedTime={meta.date ?? undefined}
        modifiedTime={meta.date ?? undefined}
        tags={meta.tags ?? []}
      />

      <EventHero
        slug={meta.slug}
        title={meta.title}
        date={meta.date ?? undefined}
        endDate={meta.endDate ?? undefined}
        location={meta.location ?? undefined}
        summary={meta.summary ?? undefined}
        heroImage={meta.heroImage ?? undefined}
        aspect="wide"
        fit="contain"
      />

      <MDXProviderWrapper>
        <article className="mx-auto max-w-3xl px-4 py-8 md:py-12">
          <div className="prose md:prose-lg max-w-none text-deepCharcoal dark:prose-invert">
            <MDXRemote {...mdx} components={MDXComponents} />
          </div>

          <EventResources
            className="mt-10"
            reads={meta.reads || []}
            downloads={meta.downloads || []}
          />
        </article>
      </MDXProviderWrapper>
    </Layout>
  );
}
