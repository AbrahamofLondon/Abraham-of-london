/* pages/downloads/[...slug].tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";

import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";
import ClientUnlockRenderer from "@/components/content/ClientUnlockRenderer";

import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";
import { getRenderableBody } from "@/lib/content/render-body";

import { getMdxDocumentBySlug } from "@/lib/server/mdx-collections";
import {
  assertPdfAssetIdentity,
  pdfAccessToRequiredTier,
  type PdfAssetIdentityResolved,
} from "@/lib/assets/pdf-identity";

type Props = {
  slug: string;
  title: string;
  requiredTier: AccessTier;
  bodyCode: string | null;
  identity: PdfAssetIdentityResolved;
};

function cleanSlug(input: unknown): string {
  const raw = Array.isArray(input) ? input.join("/") : String(input ?? "");
  const s = raw
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");

  if (!s || s.includes("..")) return "";
  return s;
}

// Do not access doc.body.code directly; use getRenderableBody(doc).

const Page: NextPage<Props> = ({ slug, title, requiredTier, bodyCode, identity }) => {
  const isPublic = requiredTier === "public";

  return (
    <Layout
      title={title}
      description="Download resource from Abraham of London."
      canonicalUrl={`/downloads/${slug}`}
      className="bg-zinc-950 text-white"
      fullWidth
      headerTransparent={false}
    >
      <Head>
        <meta
          name="robots"
          content={isPublic ? "index,follow" : "noindex,nofollow"}
        />
      </Head>

      <main className="min-h-screen bg-zinc-950 px-6 py-16 text-white md:py-20">
        <div className="mx-auto max-w-5xl">
          <div className="mb-4 flex items-center gap-3">
            <span className="h-px w-10 bg-gradient-to-r from-amber-500/50 to-transparent" />
            <span className="font-mono text-[9px] uppercase tracking-[0.34em] text-white/34">
              Download Resource
            </span>
          </div>

          <h1 className="mb-10 font-serif text-4xl md:text-5xl">{title}</h1>

          <section className="mb-10 rounded-lg border border-white/10 bg-white/[0.03] p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-200">
              {identity.category} / {identity.authority} / {identity.access}
            </p>
            <p className="mt-4 max-w-3xl text-white/70">
              {identity.description || "This asset is controlled through the canonical download system and delivered from the authoritative binary."}
            </p>
            <a
              href={`/api/downloads/resolve/${encodeURIComponent(identity.slug)}`}
              className="mt-6 inline-flex rounded-md bg-amber-300 px-4 py-2 text-sm font-semibold text-zinc-950"
            >
              Request download
            </a>
          </section>

          {isPublic ? (
            bodyCode ? (
              <SafeMDXRenderer code={bodyCode} />
            ) : (
              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-200">
                  {identity.category} / {identity.authority}
                </p>
                <p className="mt-4 max-w-2xl text-white/70">
                  This asset is controlled through the canonical download system. Access is granted through the resolver and delivered from the authoritative binary.
                </p>
                <a
                  href={`/api/downloads/resolve/${encodeURIComponent(slug)}`}
                  className="mt-6 inline-flex rounded-md bg-amber-300 px-4 py-2 text-sm font-semibold text-zinc-950"
                >
                  Request download
                </a>
              </div>
            )
          ) : (
            <ClientUnlockRenderer
              slug={`downloads/${slug}`}
              requiredTier={requiredTier}
              initialCode={null}
            />
          )}
        </div>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async ({
  params,
}) => {
  const slug = cleanSlug(params?.slug);
  if (!slug) return { notFound: true };

  let identity: PdfAssetIdentityResolved;
  try {
    identity = assertPdfAssetIdentity(slug);
  } catch {
    return { notFound: true };
  }

  const doc = await getMdxDocumentBySlug("downloads", slug);

  const identityTier = pdfAccessToRequiredTier(identity.access);
  const requiredTier = tiers.normalizeRequired(identityTier || (doc ? requiredTierFromDoc(doc as Parameters<typeof requiredTierFromDoc>[0]) : "public"));
  const isPublic = requiredTier === "public";

  return {
    props: {
      slug: identity.slug,
      title: identity.title,
      requiredTier,
      bodyCode: isPublic && doc ? getRenderableBody(doc).code : null,
      identity,
    },
  };

};

export default Page;
