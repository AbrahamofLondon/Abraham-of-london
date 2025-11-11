import { toJSONSafe } from '...';
import MDXComponents, { getSafeComponents } from "@/components/MDXComponents";
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { getAllContent } from '...';
import type { GetStaticProps, InferGetStaticPropsType } from "next";
import { format } from '...';
import { allPosts, allResources, allBooks } from '...';
const CONTENT_TYPE = "downloads";
const PAGE_TITLE = "Downloads";

type Item = {
  slug: string;
  title: string;
  date?: string;
  excerpt?: string;
  coverImage?: string;
  category?: string;
  tags?: string[];
};

type ListProps = {
  items: Item[];
};

export const getStaticProps: GetStaticProps<ListProps> = async () => {
  const all = getAllContent(CONTENT_TYPE) as Item[];
  // sort newest first when date exists
  const items = [...all].sort((a, b) => {
    const da = a?.date ? +new Date(a.date) : 0;
    const db = b?.date ? +new Date(b.date) : 0;
    return db - da;
  });
  return { props: toJSONSafe({ items }), revalidate: 1800 };
};

export default function IndexPage({ items }: InferGetStaticPropsType<typeof getStaticProps>) {
  return (
    <Layout pageTitle={PAGE_TITLE}>
      <Head>
        <title>{PAGE_TITLE} | Abraham of London</title>
        <meta name="description" content={PAGE_TITLE} />
      </Head>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <header className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-deepCharcoal">{PAGE_TITLE}</h1>
          <p className="text-neutral-700 mt-3">Browse {PAGE_TITLE.toLowerCase()}.</p>
        </header>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const href = `/${CONTENT_TYPE}/${it.slug}`;
            return (
              <li key={it.slug} className="rounded-2xl border border-lightGrey/60 p-5 bg-white hover:shadow-md transition-shadow">
                <Link href={href} className="block">
                  <h3 className="font-semibold text-lg text-deepCharcoal mb-2">{it.title}</h3>
                  {it.date && (
                    <p className="text-sm text-neutral-600 mb-2">{format(new Date(it.date), "MMMM d, yyyy")}</p>
                  )}
                  {it.excerpt && (
                    <p className="text-sm text-neutral-700 line-clamp-3">{it.excerpt}</p>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </Layout>
  );
}


