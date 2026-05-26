/* pages/canon/[slug].tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { GetStaticPaths, GetStaticProps, GetStaticPropsContext, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";

import { StaticMDXRenderer, renderDocBodyToStaticHtml } from "@/lib/mdx/static-mdx-runtime";
import ClientUnlockRenderer from "@/components/content/ClientUnlockRenderer";
import ReaderFrame from "@/components/reader/ReaderFrame";
import ReaderHeader from "@/components/reader/ReaderHeader";
import ReaderBody from "@/components/reader/ReaderBody";

import { normalizeSlug } from "@/lib/content/shared";


import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

type Props = {
  canon: {
    title: string;
    slug: string;
    excerpt?: string | null;
    category?: string | null;
    date?: string | null;
    tags?: string[];
    readTime?: string | null;
  };
  requiredTier: AccessTier;
  staticHtml: string;
};

function canonBareSlug(input: unknown): string {
  const raw = String(input ?? "");

  let s = normalizeSlug(raw)
    .replace(/^content\//i, "")
    .replace(/^vault\//i, "")
    .replace(/^canon\//i, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\.(md|mdx)$/i, "");

  if (!s || s.includes("..")) return "";

  const parts = s.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

function isCanonDoc(doc: any): boolean {
  const flat = String(doc?._raw?.flattenedPath || "").toLowerCase();
  const source = String(doc?._raw?.sourceFilePath || "").toLowerCase();
  const dir = String(doc?._raw?.sourceFileDir || "").toLowerCase();
  const slug = String(doc?.slug || "").toLowerCase();
  const collectionSlug = String(doc?.collectionSlug || "").toLowerCase();
  const urlSlug = String(doc?.urlSlug || "").toLowerCase();
  const href = String(doc?.href || "").toLowerCase();
  const type = String(doc?.type || doc?.docKind || doc?.kind || "").toLowerCase();

  return (
    type === "canon" ||
    dir.includes("canon") ||
    flat.startsWith("canon/") ||
    flat.startsWith("content/canon/") ||
    flat.startsWith("vault/canon/") ||
    source.startsWith("canon/") ||
    source.startsWith("content/canon/") ||
    source.startsWith("vault/canon/") ||
    slug.startsWith("canon/") ||
    collectionSlug.startsWith("canon/") ||
    href.startsWith("/canon/") ||
    (!!urlSlug && !collectionSlug && type === "canon")
  );
}

const Page: NextPage<Props> = ({ canon, requiredTier, staticHtml }) => {
  const isPublic = requiredTier === "public";

  return (
    <Layout
      title={`${canon.title} // The Canon`}
      description={canon.excerpt || "Canonical volume from Abraham of London."}
      canonicalUrl={`/canon/${canon.slug}`}
      className="bg-black text-white"
      fullWidth
      headerTransparent={false}
    >
      <Head>
        <meta name="robots" content={isPublic ? "index,follow" : "noindex,nofollow"} />
      </Head>

      <ReaderFrame surface="canon">
        <ReaderHeader
          surface="canon"
          title={canon.title}
          meta={[
            ...(canon.category ? [{ label: "Category", value: canon.category }] : []),
            ...(canon.readTime ? [{ label: "Read time", value: canon.readTime }] : []),
            ...(canon.date ? [{ label: "Date", value: canon.date }] : []),
          ]}
        />

        {isPublic ? (
          <ReaderBody surface="canon">
            <StaticMDXRenderer html={staticHtml} />
          </ReaderBody>
        ) : (
          <div className="mx-auto max-w-3xl px-6 py-12">
            <ClientUnlockRenderer
              slug={`canon/${canon.slug}`}
              requiredTier={requiredTier}
              initialCode={null}
            />
          </div>
        )}
      </ReaderFrame>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Narrow: load only canon docs (~15) instead of the full 316-doc corpus.
  const { getAllCanons, isDraftContent } = await import(
    "@/lib/content/server"
  );
  const docs = getAllCanons() || [];
  const seen = new Set<string>();

  // Cap prebuild to the 5 most recent canon docs; rest render via blocking.
  const paths = [...docs]
    .filter((d: any) => !isDraftContent(d))
    .sort(
      (a: any, b: any) =>
        new Date(b?.date || 0).getTime() - new Date(a?.date || 0).getTime(),
    )
    .slice(0, 5)
    .map((d: any) => {
      const raw =
        d?.urlSlug ||
        d?.collectionSlug ||
        d?.slug ||
        d?._raw?.flattenedPath ||
        d?._raw?.sourceFilePath ||
        "";

      const bare = canonBareSlug(raw);
      if (!bare) return null;
      if (seen.has(bare)) return null;

      seen.add(bare);

      return {
        params: { slug: bare },
      };
    })
    .filter(Boolean) as Array<{ params: { slug: string } }>;

  return { paths, fallback: "blocking" };


};

export const getStaticProps = async ({ params }: GetStaticPropsContext) => {
  const slug = canonBareSlug(params?.slug);
  if (!slug) return { notFound: true };

  const { getDocBySlug, isDraftContent, sanitizeData } = await import(
    "@/lib/content/server"
  );

  const doc =
    getDocBySlug(`canon/${slug}`) ||
    getDocBySlug(`content/canon/${slug}`) ||
    getDocBySlug(`vault/canon/${slug}`) ||
    getDocBySlug(slug);

  if (!doc || isDraftContent(doc) || !isCanonDoc(doc)) {
    return { notFound: true };
  }

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));
  const isPublic = requiredTier === "public";

  const { html: staticHtml } = isPublic
    ? renderDocBodyToStaticHtml(doc)
    : { html: "" };

  return {
    props: sanitizeData({
      canon: {
        title: doc.title || "Untitled Canon",
        slug,
        excerpt: doc.excerpt || doc.description || null,
        category: doc.category || doc.series || "Canon",
        date: doc.date || null,
        tags: Array.isArray(doc.tags) ? doc.tags.map(String) : [],
        readTime: doc.readTime || null,
      },
      requiredTier,
      staticHtml,
    }),
    revalidate: 3600,
  };


};

export default Page;