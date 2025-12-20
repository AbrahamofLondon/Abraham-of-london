// pages/canon/[slug].tsx
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { getAllCanons, getCanonBySlug, normalizeSlug, isDraft } from "@/lib/contentlayer-helper";
import { serialize } from "next-mdx-remote/serialize";
import { MDXRemote } from "next-mdx-remote";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";

type Props = { 
  canon: {
    title: string;
    excerpt: string | null;
    subtitle?: string | null;
    slug: string;
  };
  source: MDXRemoteSerializeResult;
};

const SITE = "https://www.abrahamoflondon.org";

export const getStaticPaths: GetStaticPaths = async () => {
  const canons = getAllCanons();
  
  const paths = canons
    .filter((d: any) => !isDraft(d))
    .map((d: any) => {
      const slug = normalizeSlug(d);
      if (!slug) {
        console.warn(`⚠️ Canon missing slug:`, d.title);
        return null;
      }
      return { params: { slug } };
    })
    .filter(Boolean) as { params: { slug: string } }[];

  console.log(`📚 Canon: Generated ${paths.length} paths`);
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "")
    .trim()
    .toLowerCase()
    .replace(/\/$/, "");
  
  if (!slug) {
    console.warn(`⚠️ Canon page called with empty slug`);
    return { notFound: true };
  }

  const rawDoc = getCanonBySlug(slug);

  if (!rawDoc) {
    console.warn(`⚠️ Canon not found for slug: ${slug}`);
    return { notFound: true };
  }

  console.log(`✅ Found canon: ${rawDoc.title} (slug: ${slug})`);

  // Create serializable props
  const canon = {
    title: rawDoc.title || "Canon",
    excerpt: rawDoc.excerpt || null,
    subtitle: rawDoc.subtitle || null,
    slug: slug,
  };

  const raw = String(rawDoc?.body?.raw ?? "");
  let source: MDXRemoteSerializeResult;

  try {
    source = await serialize(raw, {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ],
      },
    });
  } catch (err) {
    console.error(`❌ Failed to serialize MDX for canon: ${canon.title}`, err);
    source = await serialize("Content is being prepared.");
  }

  return {
    props: {
      canon,
      source,
    },
    revalidate: 1800,
  };
};

const CanonPage: NextPage<Props> = ({ canon, source }) => {
  const title = canon.title || "Canon";
  const canonicalUrl = `${SITE}/canon/${canon.slug}`;

  return (
    <Layout title={title} canonicalUrl={canonicalUrl}>
      <Head>
        {canon.excerpt ? <meta name="description" content={canon.excerpt} /> : null}
        <meta property="og:title" content={title} />
        {canon.excerpt ? <meta property="og:description" content={canon.excerpt} /> : null}
        <link rel="canonical" href={canonicalUrl} />
      </Head>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">
            Canon
          </p>
          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">
            {title}
          </h1>
          {canon.subtitle ? (
            <p className="text-lg text-gray-300">{canon.subtitle}</p>
          ) : null}
          {canon.excerpt ? (
            <p className="text-sm text-gray-300">{canon.excerpt}</p>
          ) : null}
        </header>
        <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-cream prose-a:text-gold">
          <MDXRemote {...source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default CanonPage;