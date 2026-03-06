/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/books/[slug].tsx — BOOK READER (SSG, SSOT slugs, tier-safe) */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { ArrowLeft, Clock, Tag, Lock, Loader2, AlertCircle, BookOpen } from "lucide-react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";

import { getPublishedBooks, sanitizeData, resolveDocCoverImage } from "@/lib/content/server";
import { joinHref } from "@/lib/content/shared";

import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
  getTierLabel,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";

type Props = {
  doc: any;
  requiredTier: AccessTier;
  bareSlug: string;
};

const DEFAULT_COVER = "/assets/images/blog/default-blog-cover.jpg";

/* -----------------------------------------------------------------------------
  SLUG HELPERS — preserve slashes, normalize segments (same as canon pattern)
----------------------------------------------------------------------------- */

function collapseSlashes(s: string): string {
  return String(s || "").replace(/\\/g, "/").replace(/\/{2,}/g, "/");
}

/** Books SSOT slug normalizer:
 * - keeps nested paths intact
 * - strips only known prefixes
 * - blocks traversal
 */
function booksBareSlug(input: unknown): string {
  let s = String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");

  if (!s || s.includes("..")) return "";

  // Strip prefixes repeatedly
  const stripOnce = (prefix: string) => {
    const p = prefix.replace(/^\/+/, "").replace(/\/+$/, "") + "/";
    if (s.toLowerCase().startsWith(p.toLowerCase())) {
      s = s.slice(p.length);
      s = s.replace(/^\/+/, "");
      return true;
    }
    return false;
  };

  let changed = true;
  while (changed) {
    changed = false;
    changed = stripOnce("content") || changed;
    changed = stripOnce("vault") || changed;
    changed = stripOnce("books") || changed;
  }

  s = s.replace(/^\/+/, "").replace(/\/+$/, "").replace(/\/{2,}/g, "/");
  if (!s || s.includes("..")) return "";
  return s;
}

function extractBodyCode(doc: any): string {
  return String(doc?.body?.code || doc?.bodyCode || "");
}

/* -----------------------------------------------------------------------------
  PAGE
----------------------------------------------------------------------------- */

const BookSlugPage: NextPage<Props> = ({ doc, requiredTier, bareSlug }) => {
  const { data: session, status } = useSession();

  const title = doc?.title || "Untitled Book";
  const excerpt = doc?.excerpt || doc?.description || "";
  const cover = resolveDocCoverImage(doc) || DEFAULT_COVER;

  const canonicalUrl = joinHref("books", bareSlug);

  const required = normalizeRequiredTier(requiredTier);
  const userTier = normalizeUserTier((session?.user as any)?.tier ?? (session?.user as any)?.role ?? "public");

  const needsAuth = required !== "public";
  const canRead = !needsAuth || (!!session?.user && hasAccess(userTier, required));

  const [activeCode, setActiveCode] = React.useState<string>(doc?.bodyCode || "");
  const [loadingContent, setLoadingContent] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);

  const handleUnlock = async () => {
    if (!needsAuth) return;
    if (!bareSlug) return;

    setUnlockError(null);
    setLoadingContent(true);

    try {
      const res = await fetch(`/api/books/${encodeURIComponent(bareSlug)}`, { method: "GET" });
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
              message="This volume requires appropriate clearance."
              onUnlocked={handleUnlock}
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

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/10">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 aol-vignette" />
          <div className="absolute inset-0 aol-grain opacity-[0.10]" />
        </div>

        <div className="relative z-10 mx-auto max-w-6xl px-6 lg:px-10 pt-[calc(var(--aol-header-h,88px)+2rem)] pb-10">
          <div className="flex items-center justify-between gap-6">
            <Link
              href="/books"
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
                  {doc?.category || "Book"}
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

              {doc?.subtitle ? (
                <p className="mt-4 text-sm md:text-base text-amber-200/55 leading-relaxed max-w-2xl">
                  {String(doc.subtitle)}
                </p>
              ) : null}

              {excerpt ? (
                <p className="mt-4 text-sm md:text-base text-white/55 leading-relaxed max-w-2xl">{excerpt}</p>
              ) : null}

              <div className="mt-8 aol-hairline" />
              <div className="mt-6 text-[10px] font-mono uppercase tracking-[0.35em] text-white/30">
                Abraham of London • Books & Manifestos
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 lg:px-10 py-14">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.02] p-7 md:p-10">
          {unlockError ? (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm justify-center">
              <AlertCircle className="w-4 h-4" /> {unlockError}
            </div>
          ) : null}

          {loadingContent ? (
            <div className="py-14 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-amber-500" />
            </div>
          ) : activeCode ? (
            <SafeMDXRenderer code={activeCode} loadingLabel="Loading volume…" />
          ) : (
            <div className="py-10 text-center text-white/55">
              <BookOpen className="mx-auto mb-3 h-6 w-6 text-white/30" />
              No content available.
            </div>
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
  const books = getPublishedBooks() || [];

  const paths = books
    .filter((b: any) => !b?.draft)
    .map((b: any) => {
      // ✅ SSOT: flattenedPath is the truth
      const fp = String(b?._raw?.flattenedPath || b?.slug || "");
      const bare = booksBareSlug(fp);
      if (!bare) return null;
      return { params: { slug: bare } };
    })
    .filter(Boolean) as Array<{ params: { slug: string } }>;

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const bare = booksBareSlug(params?.slug);
  if (!bare) return { notFound: true };

  // ✅ SSOT lookup order (same as canon pattern)
  const rawDoc =
    getPublishedBooks().find((d: any) => {
      const fp = String(d?._raw?.flattenedPath || d?.slug || "");
      const derived = booksBareSlug(fp);
      return derived === bare;
    }) || null;

  if (!rawDoc || rawDoc?.draft) return { notFound: true };

  const requiredTier = normalizeRequiredTier(requiredTierFromDoc(rawDoc));
  const locked = requiredTier !== "public";

  const doc = {
    ...rawDoc,
    // keep the route's bare slug stable
    slug: bare,
    bodyCode: locked ? "" : extractBodyCode(rawDoc),
    coverImage: resolveDocCoverImage(rawDoc),
  };

  return {
    props: sanitizeData({
      doc,
      requiredTier,
      bareSlug: bare,
    }),
    revalidate: 1800,
  };
};

export default BookSlugPage;