/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/blog/[slug].tsx — ESSAY READER (SSG-correct, scan-ready, build-safe, SSOT) */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";
import { ArrowLeft, Clock, Tag, Lock, Loader2 } from "lucide-react";

import { getPublishedPosts } from "@/lib/content/server";
import { normalizeSlug, joinHref } from "@/lib/content/shared";
import { resolveDocCoverImage, sanitizeData } from "@/lib/content/client-utils";

import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
  getTierLabel,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";

type BlogSlugProps = {
  doc: any;
  code: string; // empty only when locked
  requiredTier: AccessTier;
};

const DEFAULT_COVER = "/assets/images/blog/default-blog-cover.jpg";

function collapseSlashes(s: string): string {
  return String(s || "").replace(/\\/g, "/").replace(/\/{2,}/g, "/");
}

function toBareBlogSlug(input: string) {
  let s = collapseSlashes(String(input || "")).trim();
  s = normalizeSlug(s);

  // strip leading blog/ or posts/ repeatedly
  let changed = true;
  while (changed) {
    changed = false;
    const lower = s.toLowerCase();
    if (lower.startsWith("blog/")) {
      s = normalizeSlug(s.slice("blog/".length));
      changed = true;
    } else if (lower.startsWith("posts/")) {
      s = normalizeSlug(s.slice("posts/".length));
      changed = true;
    } else if (lower.startsWith("/blog/")) {
      s = normalizeSlug(s.slice("/blog/".length));
      changed = true;
    } else if (lower.startsWith("/posts/")) {
      s = normalizeSlug(s.slice("/posts/".length));
      changed = true;
    }
  }

  s = normalizeSlug(s);
  if (!s || s.includes("..")) return "";
  return s;
}

function extractCode(doc: any): string {
  return String(
    doc?.body?.code ||
      doc?.bodyCode ||
      doc?.content ||
      doc?.mdx ||
      doc?.body?.raw ||
      (typeof doc?.body === "string" ? doc.body : "") ||
      ""
  );
}

const BlogSlugPage: NextPage<BlogSlugProps> = ({ doc, code, requiredTier }) => {
  const { data: session, status } = useSession();

  const title = doc?.title || "Untitled Essay";
  const excerpt = doc?.excerpt || doc?.description || "";
  const cover = resolveDocCoverImage(doc) || DEFAULT_COVER;

  const raw = normalizeSlug(doc?.slug || doc?._raw?.flattenedPath || "");
  const bare = toBareBlogSlug(raw);
  const canonicalUrl = joinHref("blog", bare);

  const required = normalizeRequiredTier(requiredTier);
  const userTier = normalizeUserTier((session?.user as any)?.tier ?? (session?.user as any)?.role ?? "public");

  const needsAuth = required !== "public";
  const canRead = !needsAuth || (!!session?.user && hasAccess(userTier, required));

  const [activeCode, setActiveCode] = React.useState<string>(code || "");
  const [loadingContent, setLoadingContent] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);

  const handleUnlock = async () => {
    if (!needsAuth) return;
    if (!bare) return;

    setUnlockError(null);
    setLoadingContent(true);

    try {
      const res = await fetch(`/api/blog/${encodeURIComponent(bare)}`, { method: "GET" });
      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        setUnlockError(json?.reason || "UNLOCK_FAILED");
        return;
      }

      if (typeof json?.bodyCode === "string") {
        setActiveCode(json.bodyCode);
      } else {
        setUnlockError("UNLOCK_PAYLOAD_MISSING");
      }
    } catch {
      setUnlockError("UNLOCK_NETWORK_FAILURE");
    } finally {
      setLoadingContent(false);
    }
  };

  if (needsAuth && status === "loading") {
    return (
      <Layout title={title}>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-amber-500 font-mono text-xs animate-pulse">Verifying clearance…</div>
        </div>
      </Layout>
    );
  }

  if (needsAuth && (!session?.user || !canRead)) {
    return (
      <Layout title={title}>
        <div className="min-h-screen bg-black flex items-center justify-center px-6">
          <div className="w-full max-w-lg">
            <AccessGate
              title={title}
              requiredTier={required}
              message="This essay requires appropriate clearance."
              onUnlocked={() => handleUnlock()}
              onGoToJoin={() => (window.location.href = "/inner-circle")}
            />
            {unlockError ? (
              <div className="mt-6 text-center text-[10px] font-mono uppercase tracking-widest text-red-400/90">
                {unlockError}
              </div>
            ) : null}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title={`${title} // Abraham of London`}
      canonicalUrl={canonicalUrl}
      className="bg-black text-white"
      fullWidth
      headerTransparent={false}
    >
      <Head>
        <title>{title} // Abraham of London</title>
        {excerpt ? <meta name="description" content={excerpt} /> : null}
        <meta name="robots" content={required === "public" ? "index, follow" : "noindex, nofollow"} />
      </Head>

      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 aol-vignette" />
          <div className="absolute inset-0 aol-grain opacity-[0.10]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-10 pt-[calc(var(--aol-header-h,88px)+2rem)] pb-10">
          <div className="flex items-center justify-between gap-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 hover:bg-white/[0.05] transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-white/70" />
              <span className="aol-micro text-white/55">Back</span>
            </Link>

            <div className="flex items-center gap-3 text-[10px] font-mono uppercase tracking-[0.35em] text-white/35">
              {required !== "public" && (
                <span className="inline-flex items-center gap-2 px-2 py-1 border border-amber-500/30 bg-amber-500/10 rounded-full text-amber-400">
                  <Lock className="h-3 w-3" />
                  {getTierLabel(required)}
                </span>
              )}
              {doc?.readTime ? (
                <span className="inline-flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5" />
                  {String(doc.readTime)}
                </span>
              ) : null}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
                <div className="relative w-full" style={{ aspectRatio: "16 / 10" }}>
                  <Image
                    src={cover}
                    alt={title}
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 720px"
                  />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                </div>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                <span className="text-[10px] font-mono uppercase tracking-[0.35em] text-amber-200/60">
                  {doc?.category || "Essay"}
                </span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">
                  {doc?.date ? new Date(doc.date).toLocaleDateString("en-GB") : "archive"}
                </span>
                {doc?.tags?.[0] ? (
                  <>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.25em] text-white/35">
                      <Tag className="h-3.5 w-3.5" />
                      {String(doc.tags[0])}
                    </span>
                  </>
                ) : null}
              </div>

              <h1 className="mt-6 font-serif text-4xl md:text-5xl tracking-tight text-white/95">{title}</h1>

              {excerpt ? (
                <p className="mt-4 text-sm md:text-base text-white/55 leading-relaxed max-w-2xl">{excerpt}</p>
              ) : null}

              <div className="mt-8 aol-hairline" />
              <div className="mt-6 text-[10px] font-mono uppercase tracking-[0.35em] text-white/30">
                Abraham of London • Essays & Insights
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-4xl px-6 lg:px-10 py-14">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.02] p-7 md:p-10">
          {loadingContent ? (
            <div className="py-14 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
            </div>
          ) : (
            <SafeMDXRenderer code={activeCode} loadingLabel="Loading essay…" />
          )}
        </div>

        <div className="mt-10 aol-hairline" />
        <div className="mt-8 text-center">
          <div className="aol-micro text-white/35">Abraham of London • Institutional Notes</div>
        </div>
      </section>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getPublishedPosts() || [];

  const paths = posts
    .filter((p: any) => !p?.draft)
    .map((p: any) => {
      const raw = normalizeSlug(p.slug || p._raw?.flattenedPath || "");
      const bare = toBareBlogSlug(raw);
      return bare ? { params: { slug: bare } } : null;
    })
    .filter(Boolean) as Array<{ params: { slug: string } }>;

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<BlogSlugProps> = async ({ params }) => {
  try {
    const param = String(params?.slug || "");
    const bare = toBareBlogSlug(param);
    if (!bare) return { notFound: true };

    const wantBlog = `blog/${bare}`;
    const wantPosts = `posts/${bare}`;

    const posts = getPublishedPosts() || [];
    const doc =
      posts.find((p: any) => normalizeSlug(p.slug || "") === wantBlog) ||
      posts.find((p: any) => normalizeSlug(p._raw?.flattenedPath || "") === wantBlog) ||
      posts.find((p: any) => normalizeSlug(p.slug || "") === wantPosts) ||
      posts.find((p: any) => normalizeSlug(p._raw?.flattenedPath || "") === wantPosts);

    if (!doc || doc?.draft) return { notFound: true };

    const requiredTier = normalizeRequiredTier(requiredTierFromDoc(doc));
    const code = requiredTier === "public" ? extractCode(doc) : "";

    return {
      props: sanitizeData({
        doc,
        code,
        requiredTier,
      }),
      revalidate: 1800,
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Blog] Error in getStaticProps:", error);
    return { notFound: true, revalidate: 60 };
  }
};

export default BlogSlugPage;