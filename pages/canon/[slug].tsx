/* pages/canon/[slug].tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { GetStaticPaths, GetStaticProps, GetStaticPropsContext, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";

import ServerMDXRenderer from "@/components/mdx/ServerMDXRenderer";
import ClientUnlockRenderer from "@/components/content/ClientUnlockRenderer";

import { normalizeSlug } from "@/lib/content/shared";

import { getRenderableBody } from "@/lib/content/render-body";

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
  bodyCode: string | null;
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

const Page: NextPage<Props> = ({ canon, requiredTier, bodyCode }) => {
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

      <main className="min-h-screen bg-black text-white">
        <section className="border-b border-white/8 px-6 pb-10 pt-32 md:pb-12 md:pt-36">
          <div className="mx-auto max-w-6xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-10 bg-gradient-to-r from-amber-500/50 to-transparent" />
              <span className="font-mono text-[9px] uppercase tracking-[0.34em] text-white/34">
                Canonical Volume
              </span>
            </div>

            <h1 className="max-w-5xl font-serif text-5xl font-light leading-[0.94] tracking-[-0.055em] text-white md:text-7xl">
              {canon.title}
            </h1>

            {(canon.excerpt || canon.category || canon.readTime || canon.date) && (
              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] font-mono uppercase tracking-[0.18em] text-white/36">
                {canon.category ? <span>{canon.category}</span> : null}
                {canon.readTime ? <span>{canon.readTime}</span> : null}
                {canon.date ? <span>{canon.date}</span> : null}
              </div>
            )}
          </div>
        </section>

        <section className="px-6 py-12 md:py-16">
          <div className="mx-auto max-w-5xl">
            {isPublic ? (
              <div className="aol-mdx-shell">
                <ServerMDXRenderer code={bodyCode || ""} />
              </div>
            ) : (
              <ClientUnlockRenderer
                slug={`canon/${canon.slug}`}
                requiredTier={requiredTier}
                initialCode={null}
              />
            )}
          </div>
        </section>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  try {
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

  } finally {
  }
};

export const getStaticProps = async ({ params }: GetStaticPropsContext) => {
  try {
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

  const renderBody = getRenderableBody(doc);
  const safeCode = isPublic ? String(renderBody?.code || "") : null;

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
      bodyCode: safeCode,
    }),
    revalidate: 3600,
  };

  } finally {
  }
};

export default Page;