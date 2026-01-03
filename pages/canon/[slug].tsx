import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import mdxComponents from "@/components/mdx-components";

import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";

// FIX: Removed 'Canon' from named imports as it is not exported by the module
import { getAllCanons, getCanonDocBySlug, getAccessLevel, resolveCanonSlug } from "@/lib/canon";

type AccessLevel = "public" | "inner-circle" | "private";

type CanonMeta = {
  title: string;
  excerpt: string | null;
  subtitle: string | null;
  slug: string;
  accessLevel: AccessLevel;
  lockMessage: string | null;
  coverImage: string | null;
};

type LockedProps = { canon: CanonMeta; locked: true };
type UnlockedProps = { canon: CanonMeta; locked: false; source: MDXRemoteSerializeResult };
type Props = LockedProps | UnlockedProps;

const SITE =
  (process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org").replace(/\/+$/, "");

function safeString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function cleanSlug(input: unknown): string {
  const s = safeString(input).trim().toLowerCase().replace(/^\/+/, "").replace(/\/+$/, "");
  if (!s) return "";
  if (s.includes("http://") || s.includes("https://")) return "";
  if (s.includes("?") || s.includes("#")) return "";
  if (s.includes("..")) return "";
  if (!/^[a-z0-9/_-]+$/i.test(s)) return "";
  return s;
}

function isDraft(doc: any): boolean {
  return doc?.draft === true || doc?.draft === "true";
}

function toAccessLevel(v: unknown): AccessLevel {
  const n = safeString(v).trim().toLowerCase();
  if (n === "inner-circle" || n === "private" || n === "public") return n;
  return "public";
}

function getCanonMeta(doc: any, slug: string): CanonMeta {
  return {
    title: safeString(doc?.title).trim() || "Canon",
    excerpt: doc?.excerpt ? safeString(doc.excerpt) : null,
    subtitle: doc?.subtitle ? safeString(doc.subtitle) : null,
    slug,
    accessLevel: toAccessLevel(getAccessLevel(doc)),
    lockMessage: safeString(doc?.lockMessage).trim() || null,
    coverImage: safeString(doc?.coverImage).trim() || null,
  };
}

export const getStaticPaths: GetStaticPaths = async () => {
  // FIX: Removed explicit type ': Canon[]' to rely on inference
  const canons = getAllCanons();

  const paths = canons
    .filter((c: any) => c && !isDraft(c))
    .map((c: any) => cleanSlug(resolveCanonSlug(c)))
    .filter(Boolean)
    .map((slug: string) => ({ params: { slug } }));

  return { paths, fallback: false };
};

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const slug = cleanSlug(ctx.params?.slug);
  if (!slug) return { notFound: true };

  const rawDoc = getCanonDocBySlug(slug);
  if (!rawDoc || isDraft(rawDoc)) return { notFound: true };

  const canon = getCanonMeta(rawDoc, slug);

  // ✅ Gated: ship a lock page only (no MDX serialization = no content leakage)
  if (canon.accessLevel !== "public") {
    return { props: { canon, locked: true }, revalidate: 1800 };
  }

  const raw = typeof rawDoc?.body?.raw === "string" ? rawDoc.body.raw : "";

  let source: MDXRemoteSerializeResult;
  try {
    source = await serialize(raw || " ", {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: "wrap" }]],
      },
    });
  } catch {
    source = await serialize("Content is being prepared.");
  }

  return { props: { canon, locked: false, source }, revalidate: 1800 };
};

const CanonPage: NextPage<Props> = (props) => {
  const { canon } = props;
  const canonicalUrl = `${SITE}/canon/${canon.slug}`;

  const ogImage = canon.coverImage
    ? canon.coverImage.startsWith("http")
      ? canon.coverImage
      : `${SITE}${canon.coverImage.startsWith("/") ? "" : "/"}${canon.coverImage}`
    : undefined;

  return (
    <Layout title={canon.title} canonicalUrl={canonicalUrl}>
      <Head>
        <title>{canon.title} | Abraham of London</title>
        <link rel="canonical" href={canonicalUrl} />

        {canon.excerpt ? <meta name="description" content={canon.excerpt} /> : null}

        <meta property="og:title" content={canon.title} />
        {canon.excerpt ? <meta property="og:description" content={canon.excerpt} /> : null}
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        {ogImage ? <meta property="og:image" content={ogImage} /> : null}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={canon.title} />
        {canon.excerpt ? <meta name="twitter:description" content={canon.excerpt} /> : null}
        {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16 lg:py-20">
        <header className="mb-8 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/70">Canon</p>

          <h1 className="font-serif text-3xl font-semibold text-cream sm:text-4xl">{canon.title}</h1>

          {canon.subtitle ? <p className="text-lg text-gray-300">{canon.subtitle}</p> : null}
          {canon.excerpt ? <p className="text-sm text-gray-300">{canon.excerpt}</p> : null}

          {canon.accessLevel !== "public" ? (
            <div className="pt-2">
              <span className="inline-flex items-center rounded-full border border-gold/25 bg-black/40 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-gold/70">
                {canon.accessLevel === "inner-circle" ? "Inner Circle" : "Private"}
              </span>
            </div>
          ) : null}
        </header>

        {props.locked ? (
          <section className="rounded-2xl border border-gold/20 bg-black/40 p-6 backdrop-blur">
            <h2 className="font-serif text-xl font-semibold text-cream">This entry is gated</h2>

            <p className="mt-2 text-sm text-gold/70">
              {canon.lockMessage || "Access is reserved. If you have an Inner Circle key, unlock below."}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-gold/60">
              <Link href="/inner-circle" className="underline underline-offset-2 hover:text-amber-200">
                What is Inner Circle?
              </Link>
              <span className="opacity-40">•</span>
              <Link href="/canon" className="underline underline-offset-2 hover:text-amber-200">
                Back to Canon
              </Link>
            </div>
          </section>
        ) : (
          <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-cream prose-a:text-gold">
            <MDXRemote {...(props as UnlockedProps).source} components={mdxComponents} />
          </article>
        )}
      </main>
    </Layout>
  );
};

export default CanonPage;