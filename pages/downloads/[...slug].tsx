/* pages/downloads/[...slug].tsx */
/* eslint-disable @typescript-eslint/no-explicit-any */

import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import Layout from "@/components/Layout";

import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";
import ClientUnlockRenderer from "@/components/content/ClientUnlockRenderer";

import tiers, { requiredTierFromDoc } from "@/lib/access/tiers";
import type { AccessTier } from "@/lib/access/tiers";

import { getMdxDocumentBySlug } from "@/lib/server/mdx-collections";

type Props = {
  slug: string;
  title: string;
  requiredTier: AccessTier;
  bodyCode: string | null;
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

function safeString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function looksLikeLeakedModuleCode(code: string): boolean {
  const s = safeString(code).trim();
  if (!s) return false;

  return (
    /\bObject\.defineProperty\s*\(\s*exports\b/.test(s) ||
    /\bmodule\.exports\b/.test(s) ||
    /\bexports\.[A-Za-z_$]/.test(s) ||
    /\b__esModule\b/.test(s) ||
    /\brequire\s*\(/.test(s) ||
    /\bjsx_runtime\b/.test(s) ||
    /\bvar\s+\w+\s*=\s*Object\.create/.test(s)
  );
}

function pickRenderableDocumentCode(doc: any): string {
  const compiled = safeString(doc?.body?.code || doc?.bodyCode);
  const raw = safeString(doc?.body?.raw || doc?.content);

  if (compiled && !looksLikeLeakedModuleCode(compiled)) {
    return compiled;
  }

  if (raw) {
    return raw;
  }

  return compiled || "";
}

const Page: NextPage<Props> = ({ slug, title, requiredTier, bodyCode }) => {
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

          {isPublic ? (
            <SafeMDXRenderer code={bodyCode || ""} />
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

  const doc = await getMdxDocumentBySlug("downloads", slug);
  if (!doc) return { notFound: true };

  const requiredTier = tiers.normalizeRequired(requiredTierFromDoc(doc as Parameters<typeof requiredTierFromDoc>[0]));
  const isPublic = requiredTier === "public";

  return {
    props: {
      slug,
      title: doc.title || "Untitled Download",
      requiredTier,
      bodyCode: isPublic ? pickRenderableDocumentCode(doc) : null,
    },
  };
};

export default Page;