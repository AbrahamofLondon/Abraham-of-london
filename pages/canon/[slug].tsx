// pages/canon/[slug].tsx
import * as React from "react";
import type {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import Head from "next/head";
import Layout from "@/components/Layout";
import { getAllCanons } from "@/lib/contentlayer-helper";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import mdxComponents from "@/components/mdx-components";
import SafeMDXRemote from "@/components/SafeMDXRemote";

type Props = { canon: any; source: MDXRemoteSerializeResult };

/**
 * Extract the final slug from a canon document's URL
 * e.g., "/canon/my-post" -> "my-post"
 */
function getCanonSlug(canon: any): string {
  // First try the computed URL field
  if (canon.url) {
    const parts = canon.url.split('/').filter(Boolean);
    // Remove 'canon' prefix if present, return last part
    return parts[parts.length - 1] || '';
  }
  
  // Fallback to slug field
  if (canon.slug) {
    return canon.slug.split('/').pop() || canon.slug;
  }
  
  // Final fallback to flattenedPath
  if (canon._raw?.flattenedPath) {
    return canon._raw.flattenedPath.split('/').pop() || '';
  }
  
  return '';
}

/* -------------------------------------------------------------------------- */
/* ✅ REQUIRED FOR DYNAMIC SSG ROUTES                                          */
/* -------------------------------------------------------------------------- */
export const getStaticPaths: GetStaticPaths = async () => {
  const canons = getAllCanons();
  
  const paths = canons
    .map((canon) => {
      const slug = getCanonSlug(canon);
      if (!slug) {
        console.warn(`⚠️ Canon missing slug:`, canon.title || canon._id);
        return null;
      }
      return { params: { slug } };
    })
    .filter(Boolean) as { params: { slug: string } }[];

  console.log(`📚 Generated ${paths.length} canon paths:`, paths.map(p => p.params.slug));
  
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = String(params?.slug ?? "")
    .trim()
    .toLowerCase()
    .replace(/\/$/, ""); // Remove trailing slash for comparison
  
  if (!slug) {
    console.warn(`⚠️ Canon page called with empty slug`);
    return { notFound: true };
  }

  const canons = getAllCanons();
  const canon = canons.find((d) => getCanonSlug(d).toLowerCase().replace(/\/$/, "") === slug);

  if (!canon) {
    console.warn(`⚠️ Canon not found for slug: ${slug}`);
    console.log(`Available canons:`, canons.map(c => ({
      title: c.title,
      slug: getCanonSlug(c),
      url: c.url
    })));
    return { notFound: true };
  }

  console.log(`✅ Found canon: ${canon.title} (slug: ${slug})`);

  const raw = String(canon?.body?.raw ?? "");
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
    // Never crash export/build because one MDX file is malformed
    source = await serialize("Content is being prepared.");
  }

  return { props: { canon, source }, revalidate: 1800 };
};

const CanonPage: NextPage<InferGetStaticPropsType<typeof getStaticProps>> = ({
  canon,
  source,
}) => {
  const title = canon.title ?? "Canon";
  return (
    <Layout title={title}>
      <Head>
        {canon.excerpt ? <meta name="description" content={canon.excerpt} /> : null}
        <meta property="og:title" content={title} />
        {canon.excerpt ? <meta property="og:description" content={canon.excerpt} /> : null}
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
          <SafeMDXRemote source={source} components={mdxComponents} />
        </article>
      </main>
    </Layout>
  );
};

export default CanonPage;