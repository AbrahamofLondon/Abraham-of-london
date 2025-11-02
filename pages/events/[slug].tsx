// pages/events/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, InferGetStaticPropsType } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

import Layout from "@/components/Layout";
// ✅ CRITICAL FIX: Use the correct lowercase import name for the component map
import mdxComponents from '@/components/mdx-components'; 
import EventResources from "@/components/events/EventResources";
import { getAllContent, getContentBySlug } from "@/lib/mdx"; 
import type { PostMeta } from "@/types/post";

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

// Placeholder utility functions for rendering (replace with your actual implementations)
const niceDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB') : '');
const normalizeSlug = (s) => (s ? s.toLowerCase() : '');


export const getStaticPaths: GetStaticPaths = async () => {
  const allContent = getAllContent("events");
  const slugs = allContent.map(item => item.slug.toLowerCase());
  return { paths: slugs.map((slug) => ({ params: { slug } })), fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug || "");
  const { content, ...raw } = getContentBySlug("events", slug, { withContent: true });
  
  const meta = {
    slug: String(raw.slug || slug),
    title: String(raw.title || slug),
    date: String(raw.date || new Date().toISOString()),
    endDate: raw.endDate ? String(raw.endDate) : null,
    location: raw.location ? String(raw.location) : null,
    summary: raw.summary ? String(raw.summary) : null,
    heroImage: raw.coverImage ? String(raw.coverImage) : null, 
    tags: Array.isArray(raw.tags) ? raw.tags.map(String) : [],
    resources: (raw as any).resources ?? null,
    chatham: (raw as any).chatham === true,
  };

  const finalMeta = JSON.parse(JSON.stringify(meta));
  const mdx = await serialize(content || "", { scope: finalMeta });

  return {
    props: { meta: finalMeta, content: mdx },
    revalidate: 60,
  };
};

export default function EventPage({ meta, content }: Props) {
  const { slug, title, date, location, summary, heroImage, tags, resources, chatham } = meta;

  const when = niceDate(date);
  const normalizedSlug = normalizeSlug(slug);

  return (
    <Layout pageTitle={title} hideCTA>
      <Head>
        <meta name="description" content={summary || title} />
        <meta property="og:type" content="event" />
      </Head>
      
      <article className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-4xl font-serif font-bold">{title}</h1>
        <div className="prose md:prose-lg max-w-none">
          {/* ✅ FIX: Use lowercase mdxComponents */}
          <MDXRemote {...content} components={mdxComponents} /> 
        </div>
      </article>
    </Layout>
  );
}