/* pages/vault/[...slug].tsx */
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";

import { StaticMDXRenderer, renderDocBodyToStaticHtml } from "@/lib/mdx/static-mdx-runtime";
import ClientUnlockRenderer from "@/components/content/ClientUnlockRenderer";

import { normalizeSlug } from "@/lib/content/shared";

import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

type Props = {
  title: string;
  slug: string;
  requiredTier: AccessTier;
  staticHtml: string;
};

function cleanVaultSlug(input: unknown): string {
  const raw = Array.isArray(input) ? input.join("/") : String(input ?? "");
  const s = normalizeSlug(raw)
    .replace(/^content\//i, "")
    .replace(/^vault\//i, "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  if (!s || s.includes("..")) return "";
  return s;
}

function isVaultDoc(doc: any): boolean {
  const flat = String(doc?._raw?.flattenedPath || "").toLowerCase();
  const source = String(doc?._raw?.sourceFilePath || "").toLowerCase();
  const slug = String(doc?.slug || "").toLowerCase();

  return (
    flat.startsWith("vault/") ||
    flat.startsWith("content/vault/") ||
    source.startsWith("vault/") ||
    source.startsWith("content/vault/") ||
    slug.startsWith("vault/")
  );
}

const Page: NextPage<Props> = ({ title, slug, requiredTier, staticHtml }) => {
  const isPublic = requiredTier === "public";

  return (
    <Layout title={title}>
      <Head>
        <meta name="robots" content={isPublic ? "index,follow" : "noindex,nofollow"} />
      </Head>

      <main className="min-h-screen bg-black text-white px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-5xl font-serif mb-12">{title}</h1>

          {isPublic ? (
            <StaticMDXRenderer html={staticHtml} />
          ) : (
            <ClientUnlockRenderer
              slug={`vault/${slug}`}
              requiredTier={requiredTier}
              initialCode={null}
            />
          )}
        </div>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  // Narrow: load only vault docs (~1) instead of the full 316-doc corpus.
  // VaultBriefs are a separate collection handled by pages/vault/briefs/*,
  // so excluding `briefs` below in the segment filter is still required.
  const { getAllVault, isDraftContent } = await import(
    "@/lib/content/server"
  );
  const docs = getAllVault() || [];

  const paths = (
    docs
      .filter((d: any) => !isDraftContent(d))
      .map((d: any) => {
        const raw = d?.slug || d?._raw?.flattenedPath || "";
        const slug = cleanVaultSlug(raw);
        if (!slug) return null;

        return {
          params: { slug: slug.split("/") },
        };
      })
      .filter((entry): entry is { params: { slug: string[] } } => {
        if (!entry) return false;

        const segments = entry.params.slug;
        if (!segments.length) return false;

        if (segments[0] === "briefs") return false;

        return true;
      })
  ) as Array<{ params: { slug: string[] } }>;

  return { paths, fallback: "blocking" };


};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const slug = cleanVaultSlug(params?.slug);
  if (!slug) return { notFound: true };

  const { getDocBySlug, isDraftContent, sanitizeData } = await import(
    "@/lib/content/server"
  );

  const doc =
    getDocBySlug(`vault/${slug}`) ||
    getDocBySlug(`content/vault/${slug}`) ||
    getDocBySlug(slug);

  if (!doc || isDraftContent(doc) || !isVaultDoc(doc)) {
    return { notFound: true };
  }

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc));
  const isPublic = requiredTier === "public";

  return {
    props: sanitizeData({
      title: doc.title || "Untitled Vault Document",
      slug,
      requiredTier,
      staticHtml: isPublic ? renderDocBodyToStaticHtml(doc).html : "",
    }),
    revalidate: 3600,
  };


};

export default Page;
