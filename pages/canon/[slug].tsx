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

import {
  getAllCanons,
  getCanonDocBySlug,
  getAccessLevel,
  resolveCanonSlug,
} from "@/lib/canon";
import type { Canon } from "@/lib/canon";

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

type LockedProps = {
  canon: CanonMeta;
  locked: true;
};

type UnlockedProps = {
  canon: CanonMeta;
  locked: false;
  source: MDXRemoteSerializeResult;
};

type Props = LockedProps | UnlockedProps;

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org"
).replace(/\/+$/, "");

/* -----------------------------------------------------------------------------
  Helpers
----------------------------------------------------------------------------- */

function safeString(v: unknown): string {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function safeTitle(v: unknown): string {
  const s = safeString(v).trim();
  return s || "Canon";
}

/** conservative slug cleaner (also stops weird URL-ish stuff) */
function cleanSlug(input: unknown): string {
  const s = safeString(input)
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");

  // block full URLs / query fragments / path traversal vibes
  if (!s) return "";
  if (s.includes("http://") || s.includes("https://")) return "";
  if (s.includes("?") || s.includes("#")) return "";
  if (s.includes("..")) return "";

  // allow nested segments if you ever use them: canon/foo/bar
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
    title: safeTitle(doc?.title),
    excerpt: doc?.excerpt ? safeString(doc.excerpt) : null,
    subtitle: doc?.subtitle ? safeString(doc.subtitle) : null,
    slug,
    accessLevel: toAccessLevel(getAccessLevel(doc)),
    lockMessage: safeString(doc?.lockMessage).trim() || null,
    coverImage: safeString(doc?.coverImage).trim() || null,
  };
}

/* -----------------------------------------------------------------------------
  Static generation
----------------------------------------------------------------------------- */

export const getStaticPaths: GetStaticPaths = async () => {
  const canons: Canon[] = getAllCanons();

  // ✅ ONLY prebuild PUBLIC (non-draft) canon pages
  const paths = canons
    .filter((c) => c && !isDraft(c))
    .filter((c) => toAccessLevel(getAccessLevel(c)) === "public")
    .map((c) => cleanSlug(resolveCanonSlug(c)))
    .filter(Boolean)
    .map((slug) => ({ params: { slug } }));

  console.log(`📚 Canon (public): Generated ${paths.length} paths`);
  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async (ctx) => {
  const slug = cleanSlug(ctx.params?.slug);
  if (!slug) return { notFound: true };

  const rawDoc = getCanonDocBySlug(slug);

  if (!rawDoc) {
    console.warn(`⚠️ Canon not found for slug: ${slug}`);
    return { notFound: true, revalidate: 60 };
  }

  if (isDraft(rawDoc)) {
    return { notFound: true, revalidate: 60 };
  }

  const canon = getCanonMeta(rawDoc, slug);

  /**
   * ✅ Gating rule:
   * - If accessLevel != public AND not in preview mode => return lock screen
   * - Do NOT serialize MDX => content never ships in HTML/JS
   */
  if (canon.accessLevel !== "public" && !ctx.preview) {
    return {
      props: { canon, locked: true },
      revalidate: 300,
    };
  }

  // ✅ Unlocked: serialize MDX safely
  const raw = safeString(rawDoc?.body?.raw);

  let source: MDXRemoteSerializeResult;
  try {
    source = await serialize(raw || "Content is being prepared.", {
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
    props: { canon, locked: false, source },
    revalidate: 1800,
  };
};

/* -----------------------------------------------------------------------------
  Page
----------------------------------------------------------------------------- */

const CanonPage: NextPage<Props> = (props) => {
  const { canon } = props;

  const title = canon.title || "Canon";
  const canonicalUrl = `${SITE}/canon/${canon.slug}`;

  // Optional: use cover image for OG if you have it
  const ogImage = canon.coverImage
    ? canon.coverImage.startsWith("http")
      ? canon.coverImage
      : `${SITE}${canon.coverImage.startsWith("/") ? "" : "/"}${canon.coverImage}`
    : undefined;

  return (
    <Layout title={title} canonicalUrl={canonicalUrl}>
      <Head>
        <title>{title} | Abraham of London</title>

        {canon.excerpt ? (
          <meta name="description" content={canon.excerpt} />
        ) : null}

        <link rel="canonical" href={canonicalUrl} />

        <meta property="og:title" content={title} />
        {canon.excerpt ? (
          <meta property="og:description" content={canon.excerpt} />
        ) : null}
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        {ogImage ? <meta property="og:image" content={ogImage} /> : null}

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        {canon.excerpt ? (
          <meta name="twitter:description" content={canon.excerpt} />
        ) : null}
        {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
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

          {/* Access badge (soft, non-alarming) */}
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
            <h2 className="font-serif text-xl font-semibold text-cream">
              This entry is gated
            </h2>

            <p className="mt-2 text-sm text-gold/70">
              {canon.lockMessage ||
                "Access is reserved. If you have an Inner Circle key, unlock below."}
            </p>

            {/* ✅ POST unlock form (no key in URL) */}
            <form
              className="mt-5 flex flex-col gap-3 sm:flex-row"
              action="/api/inner-circle/preview"
              method="POST"
            >
              <input type="hidden" name="slug" value={canon.slug} />
              <input
                name="key"
                placeholder="Enter access key"
                className="w-full rounded-xl border border-gold/20 bg-black/60 px-4 py-3 text-sm text-cream outline-none placeholder:text-gold/40"
                autoComplete="off"
                inputMode="text"
              />
              <button
                type="submit"
                className="rounded-xl bg-gold px-5 py-3 text-sm font-semibold text-black hover:bg-amber-300"
              >
                Unlock
              </button>
            </form>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gold/60">
              <Link
                href="/inner-circle"
                className="underline underline-offset-2 hover:text-amber-200"
              >
                What is Inner Circle?
              </Link>
              <span className="opacity-40">•</span>
              <Link
                href="/api/inner-circle/exit-preview?returnTo=/canon"
                className="underline underline-offset-2 hover:text-amber-200"
              >
                Exit unlock mode
              </Link>
            </div>
          </section>
        ) : (
          <article className="prose prose-invert max-w-none prose-headings:font-serif prose-headings:text-cream prose-a:text-gold">
            {/* Type guard ensures props has source when locked is false */}
            <MDXRemote {...(props as UnlockedProps).source} components={mdxComponents} />
          </article>
        )}
      </main>
    </Layout>
  );
};

export default CanonPage;