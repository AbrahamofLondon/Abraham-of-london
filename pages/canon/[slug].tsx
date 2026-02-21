/* pages/canon/[slug].tsx — CANON SLUG PIPELINE (HARDENED & PERMANENT) */
import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";
import { MDXRemote } from "next-mdx-remote";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import CanonHero from "@/components/canon/CanonHero";
import { BriefSummaryCard } from "@/components/mdx/BriefSummaryCard";
import mdxComponents from "@/components/mdx-components";

import { useAccess } from "@/hooks/useAccess";
import { getDocBySlug, getAllCanons, sanitizeData } from "@/lib/content/server";
import { joinHref, normalizeSlug as normalizeSlugShared } from "@/lib/content/shared";
import { resolveDocCoverImage } from "@/lib/content/client-utils";
import { prepareMDX } from "@/lib/server/md-utils";

type Tier = "public" | "inner-circle" | "private";

type CanonDoc = {
  title: string;
  excerpt?: string | null;
  description?: string | null;
  slug: string; // ✅ ALWAYS BARE (no canon/, no leading slash)
  href: string; // ✅ /canon/<bare>
  accessLevel: Tier;
  date?: string | null;
  coverImage?: string | null;
  category?: string | null;
  tags?: string[];
  author?: string | null;
  nextDoc?: { title: string; href: string } | null;
  prevDoc?: { title: string; href: string } | null;
};

interface Props {
  doc: CanonDoc;
  initialLocked: boolean;
  initialSource: MDXRemoteSerializeResult | null;
  mdxRaw: string;
}

// ---------------------------------------------------------------------------
// SLUG HARDENING (THE FIX)
// ---------------------------------------------------------------------------

function collapseSlashes(input: string): string {
  return String(input || "")
    .replace(/\\/g, "/")
    .replace(/\/{2,}/g, "/");
}

function safeDecodeURIComponent(input: string): string {
  // Decode only when it’s actually encoded (but safe either way)
  try {
    return decodeURIComponent(input);
  } catch {
    return input; // if malformed, don’t crash build
  }
}

function normalizeCanonBareSlug(slugish: unknown): string {
  // Handles:
  // - "canon/x"
  // - "/canon/x"
  // - "canon/canon/x"
  // - "%2Fcanon%2Fcanon-introduction-letter"
  // - "/canon//canon/x"
  let s = String(slugish ?? "").trim();
  if (!s) return "";

  s = safeDecodeURIComponent(s);
  s = collapseSlashes(s);

  // Prefer shared normalizeSlug, but it doesn't always remove leading "/"
  s = normalizeSlugShared(s);
  s = collapseSlashes(s).replace(/^\/+/, "").replace(/\/+$/, "");

  // Strip repeated "canon/" prefixes forever
  const prefix = "canon/";
  while (s.toLowerCase().startsWith(prefix)) s = s.slice(prefix.length);

  // Remove any remaining leading slashes again
  s = s.replace(/^\/+/, "");

  // Last sanity: no empty, no "canon" alone
  if (s.toLowerCase() === "canon") return "";

  return s;
}

function normalizeCanonHref(bare: string): string {
  // joinHref is good; just guarantee bare is bare.
  const b = normalizeCanonBareSlug(bare);
  return joinHref("canon", b);
}

// ---------------------------------------------------------------------------
// PAGE
// ---------------------------------------------------------------------------

const CanonSlugPage: NextPage<Props> = ({ doc, initialLocked, initialSource }) => {
  const { hasClearance, verify, isValidating } = useAccess();
  const [mounted, setMounted] = React.useState(false);
  const [source, setSource] = React.useState<MDXRemoteSerializeResult | null>(initialSource);
  const [loadingContent, setLoadingContent] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isAuthorized = hasClearance(doc.accessLevel);

  const fetchDecryptedContent = React.useCallback(async () => {
    if (loadingContent || source) return;
    setLoadingContent(true);

    try {
      // doc.slug is guaranteed bare, so no %2Fcanon%2F nonsense
      const res = await fetch(`/api/canon/${encodeURIComponent(doc.slug)}`);
      const json = await res.json().catch(() => null);
      if (res.ok && json?.source) setSource(json.source);
    } catch {
      console.error("[CANON_DECRYPT_ERROR] Failed to fetch secure payload.");
    } finally {
      setLoadingContent(false);
    }
  }, [doc.slug, loadingContent, source]);

  React.useEffect(() => {
    if (isAuthorized && !source && initialLocked) {
      void fetchDecryptedContent();
    }
  }, [isAuthorized, source, initialLocked, fetchDecryptedContent]);

  if (!mounted) {
    return (
      <Layout title={doc.title}>
        <div className="min-h-screen bg-black" />
      </Layout>
    );
  }

  return (
    <Layout title={doc.title} description={doc.description || doc.excerpt || ""}>
      <Head>
        <link rel="canonical" href={`https://www.abrahamoflondon.org${doc.href}`} />
        <meta name="robots" content={initialLocked ? "noindex, nofollow" : "index, follow"} />
      </Head>

      <section className="min-h-screen bg-black text-white selection:bg-amber-500/30">
        <CanonHero
          title={doc.title}
          description={doc.description || doc.excerpt || ""}
          coverImage={doc.coverImage}
          category={doc.category || "Institutional Canon"}
          tags={doc.tags || []}
          author={doc.author}
          publishedDate={doc.date}
        />

        <div className="mx-auto max-w-7xl px-6 py-12">
          <BriefSummaryCard
            category="CANON"
            classification={doc.accessLevel}
            date={doc.date || undefined}
            author={doc.author || undefined}
          />

          <div className="grid lg:grid-cols-4 gap-16 mt-16">
            <main className="lg:col-span-3">
              {!isAuthorized && !isValidating ? (
                <AccessGate
                  title={doc.title}
                  message="This foundational brief is restricted to members of the Inner Circle."
                  requiredTier={doc.accessLevel}
                  onUnlocked={() => verify()}
                  onGoToJoin={() => window.location.assign("/inner-circle")}
                />
              ) : (
                <div className="relative min-h-[400px]">
                  {loadingContent && (
                    <div className="absolute inset-0 flex items-center justify-center gap-3 py-12 text-amber-500 z-10 bg-black/50 backdrop-blur-sm">
                      <Loader2 className="animate-spin" size={18} />
                      <span className="font-mono text-[10px] tracking-[0.3em] uppercase italic">
                        Securing Transmission...
                      </span>
                    </div>
                  )}

                  <div className={loadingContent ? "opacity-20 transition-opacity" : "opacity-100 transition-opacity"}>
                    {source ? (
                      <div className="prose prose-invert prose-amber max-w-none">
                        <MDXRemote {...source} components={mdxComponents} />
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              <nav className="mt-24 border-t border-white/5 pt-12 grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/5 overflow-hidden">
                {doc.prevDoc ? (
                  <Link
                    href={doc.prevDoc.href}
                    className="group bg-black p-8 hover:bg-zinc-900 transition-all border-r border-white/5"
                  >
                    <div className="flex items-center gap-3 text-zinc-600 mb-4 font-mono text-[9px] uppercase tracking-[0.4em]">
                      <ArrowLeft size={12} /> Previous Dispatch
                    </div>
                    <span className="text-lg font-serif italic text-zinc-300 group-hover:text-amber-500 transition-colors">
                      {doc.prevDoc.title}
                    </span>
                  </Link>
                ) : (
                  <div className="bg-black p-8 opacity-20 border-r border-white/5">
                    <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-zinc-800">Origin Point</div>
                  </div>
                )}

                {doc.nextDoc ? (
                  <Link href={doc.nextDoc.href} className="group bg-black p-8 text-right hover:bg-zinc-900 transition-all">
                    <div className="flex items-center justify-end gap-3 text-zinc-600 mb-4 font-mono text-[9px] uppercase tracking-[0.4em]">
                      Next Dispatch <ArrowRight size={12} />
                    </div>
                    <span className="text-lg font-serif italic text-zinc-300 group-hover:text-amber-500 transition-colors">
                      {doc.nextDoc.title}
                    </span>
                  </Link>
                ) : (
                  <div className="bg-black p-8 opacity-20 text-right">
                    <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-zinc-800">Terminal Dispatch</div>
                  </div>
                )}
              </nav>
            </main>
          </div>
        </div>
      </section>
    </Layout>
  );
};

// ---------------------------------------------------------------------------
// SSG
// ---------------------------------------------------------------------------

export const getStaticPaths: GetStaticPaths = async () => {
  const canons = getAllCanons() || [];

  const paths = canons
    .filter((d: any) => !d?.draft)
    .map((d: any) => {
      const raw = d?.slug || d?._raw?.flattenedPath || "";
      const bare = normalizeCanonBareSlug(raw);
      return bare ? { params: { slug: bare } } : null;
    })
    .filter(Boolean) as { params: { slug: string } }[];

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const bare = normalizeCanonBareSlug(params?.slug);

  if (!bare) return { notFound: true };

  // Canon lookup — try bare, then canon/<bare> (your content patterns vary)
  const rawDoc =
    getDocBySlug(`canon/${bare}`) ||
    getDocBySlug(bare) ||
    getDocBySlug(`canon/canon/${bare}`); // legacy safety

  if (!rawDoc || rawDoc?.draft) return { notFound: true };

  const accessLevel = (rawDoc.accessLevel || "inner-circle") as Tier;
  const initialLocked = accessLevel !== "public";

  const mdxRaw = rawDoc?.body?.raw || rawDoc?.content || "";
  const initialSource = initialLocked ? null : await prepareMDX(mdxRaw || " ");

  const all = (getAllCanons() || [])
    .filter((d: any) => !d?.draft)
    .map((d: any) => {
      const b = normalizeCanonBareSlug(d?.slug || d?._raw?.flattenedPath || "");
      return { ...d, __bare: b };
    })
    .filter((d: any) => Boolean(d.__bare));

  const idx = all.findIndex((d: any) => d.__bare === bare);

  const doc: CanonDoc = {
    title: rawDoc.title || "Institutional Brief",
    slug: bare,
    href: normalizeCanonHref(bare),
    accessLevel,

    excerpt: rawDoc.excerpt || null,
    description: rawDoc.description || null,
    date: rawDoc.date ? String(rawDoc.date) : null,

    coverImage: resolveDocCoverImage(rawDoc),
    category: rawDoc.category || null,
    tags: Array.isArray(rawDoc.tags) ? rawDoc.tags : [],
    author: rawDoc.author || "Abraham of London",

    nextDoc: all[idx + 1]
      ? { title: all[idx + 1].title, href: normalizeCanonHref(all[idx + 1].__bare) }
      : null,

    prevDoc: all[idx - 1]
      ? { title: all[idx - 1].title, href: normalizeCanonHref(all[idx - 1].__bare) }
      : null,
  };

  return {
    props: sanitizeData({ doc, initialLocked, initialSource, mdxRaw }),
    revalidate: 1800,
  };
};

export default CanonSlugPage;