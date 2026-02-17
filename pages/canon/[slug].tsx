// pages/canon/[slug].tsx — HARDENED (Netlify-Resilient / Institutional Gate)
// (GitHub fix version + slug hygiene to prevent canon/canon and other path pollution)

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useRouter } from "next/router";
import type { MDXRemoteSerializeResult } from "next-mdx-remote";

// ✅ INSTITUTIONAL IMPORTS
import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import CanonHero from "@/components/canon/CanonHero";
import { BriefSummaryCard } from "@/components/mdx/BriefSummaryCard";
import { MDXLayoutRenderer } from "@/components/mdx/MDXLayoutRenderer";

// Logic & Hooks
import { useAccess } from "@/hooks/useAccess";
import { getDocBySlug, getAllCanons, normalizeSlug, sanitizeData } from "@/lib/content/server";
import { joinHref } from "@/lib/content/shared";
import { resolveDocCoverImage } from "@/lib/content/client-utils";
import { prepareMDX } from "@/lib/server/md-utils";

import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";

/* -----------------------------------------------------------------------------
  TYPES
----------------------------------------------------------------------------- */
type Tier = "public" | "inner-circle" | "private";

type CanonDoc = {
  title: string;
  excerpt?: string | null;
  description?: string | null;
  slug: string; // ALWAYS bare: "volume-x-the-arc-of-future-civilisation"
  href: string; // ALWAYS "/canon/<bare>"
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

/* -----------------------------------------------------------------------------
  SLUG HYGIENE (prevents /canon/canon/... or mixed slugs)
----------------------------------------------------------------------------- */
function stripCanonPrefix(slug: string): string {
  let s = normalizeSlug(String(slug || ""));
  const prefix = "canon/";
  while (s.toLowerCase().startsWith(prefix)) s = s.slice(prefix.length);
  return normalizeSlug(s);
}

function getRawBody(doc: any): string {
  return doc?.body?.raw || doc?.bodyRaw || doc?.content || doc?.body || "";
}

/* -----------------------------------------------------------------------------
  PAGE COMPONENT
----------------------------------------------------------------------------- */
const CanonSlugPage: NextPage<Props> = ({ doc, initialLocked, initialSource }) => {
  const router = useRouter();
  const { hasClearance, verify, isValidating } = useAccess();

  const [source, setSource] = React.useState<MDXRemoteSerializeResult | null>(initialSource);
  const [loadingContent, setLoadingContent] = React.useState(false);

  const isAuthorized = hasClearance(doc.accessLevel);

  /**
   * Secure fetch for gated intelligence.
   */
  const fetchDecryptedContent = React.useCallback(async () => {
    if (loadingContent || source) return;
    setLoadingContent(true);

    try {
      const res = await fetch(`/api/canon/${encodeURIComponent(doc.slug)}`);
      const json = await res.json();
      if (res.ok && json?.source) setSource(json.source);
    } catch {
      console.error("[CANON_DECRYPT_ERROR] Failed to fetch secure payload.");
    } finally {
      setLoadingContent(false);
    }
  }, [doc.slug, loadingContent, source]);

  React.useEffect(() => {
    // Only fetch when user has clearance and we don't already have source.
    // Also, only necessary when the page is initially locked.
    if (isAuthorized && !source && initialLocked) fetchDecryptedContent();
  }, [isAuthorized, source, initialLocked, fetchDecryptedContent]);

  if (router.isFallback) {
    return (
      <Layout title="Synchronizing...">
        <div className="min-h-screen flex items-center justify-center bg-black">
          <Loader2 className="animate-spin text-amber-500" size={32} />
        </div>
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
                  onGoToJoin={() => router.push("/inner-circle")}
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
                    {source ? <MDXLayoutRenderer code={source as any} /> : null}
                  </div>
                </div>
              )}

              {/* Intelligence Chain Navigation — Hardened Version */}
              <nav className="mt-24 border-t border-white/5 pt-12 grid grid-cols-1 sm:grid-cols-2 gap-px bg-white/5 overflow-hidden">
                {doc.prevDoc ? (
                  <a
                    href={doc.prevDoc.href}
                    className="group bg-black p-8 hover:bg-zinc-900 transition-all border-r border-white/5"
                  >
                    <div className="flex items-center gap-3 text-zinc-600 mb-4 font-mono text-[9px] uppercase tracking-[0.4em]">
                      <ArrowLeft size={12} /> Previous Dispatch
                    </div>
                    <span className="text-lg font-serif italic text-zinc-300 group-hover:text-amber-500 transition-colors">
                      {doc.prevDoc.title}
                    </span>
                  </a>
                ) : (
                  <div className="bg-black p-8 opacity-20 border-r border-white/5">
                    <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-zinc-800">Origin Point</div>
                  </div>
                )}

                {doc.nextDoc ? (
                  <a
                    href={doc.nextDoc.href}
                    className="group bg-black p-8 text-right hover:bg-zinc-900 transition-all"
                  >
                    <div className="flex items-center justify-end gap-3 text-zinc-600 mb-4 font-mono text-[9px] uppercase tracking-[0.4em]">
                      Next Dispatch <ArrowRight size={12} />
                    </div>
                    <span className="text-lg font-serif italic text-zinc-300 group-hover:text-amber-500 transition-colors">
                      {doc.nextDoc.title}
                    </span>
                  </a>
                ) : (
                  <div className="bg-black p-8 opacity-20 text-right">
                    <div className="font-mono text-[9px] uppercase tracking-[0.4em] text-zinc-800">Terminal Dispatch</div>
                  </div>
                )}
              </nav>
            </main>

            <aside className="hidden lg:block lg:col-span-1">
              <div className="sticky top-32 p-8 border border-white/5 bg-zinc-950/30 shadow-2xl">
                <h4 className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-500 mb-8 pb-4 border-b border-white/5">
                  Brief Context
                </h4>
                <div className="space-y-8">
                  <div>
                    <span className="block text-[10px] text-amber-500/60 uppercase tracking-widest mb-2 font-mono">
                      Tier
                    </span>
                    <span className="text-xl font-serif italic text-white/90 capitalize">
                      {doc.accessLevel.replace("-", " ")}
                    </span>
                  </div>

                  {doc.tags && doc.tags.length > 0 && (
                    <div>
                      <span className="block text-[10px] text-amber-500/60 uppercase tracking-widest mb-4 font-mono">
                        Registry Tags
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {doc.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-1 bg-white/[0.03] text-[9px] text-white/40 border border-white/5 uppercase font-mono"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </Layout>
  );
};

/* -----------------------------------------------------------------------------
  ROUTING & DATA
----------------------------------------------------------------------------- */
export const getStaticPaths: GetStaticPaths = async () => {
  const canons = getAllCanons() || [];

  const paths = canons
    .filter((d: any) => !d?.draft)
    .map((d: any) => {
      const raw = d?.slug || d?._raw?.flattenedPath || "";
      const bare = stripCanonPrefix(raw);
      return bare ? { params: { slug: bare } } : null;
    })
    .filter(Boolean) as { params: { slug: string } }[];

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const incoming = String(params?.slug || "");
  const slug = stripCanonPrefix(incoming);
  if (!slug) return { notFound: true };

  // Try both canonical and sloppy inputs (robust under migration)
  const rawDoc = getDocBySlug(`canon/${slug}`) || getDocBySlug(slug) || getDocBySlug(`canon/canon/${slug}`);
  if (!rawDoc || rawDoc?.draft) return { notFound: true };

  const accessLevel = (rawDoc.accessLevel || "inner-circle") as Tier;
  const initialLocked = accessLevel !== "public";

  const mdxRaw = getRawBody(rawDoc);

  let initialSource: MDXRemoteSerializeResult | null = null;
  if (!initialLocked) {
    initialSource = await prepareMDX(mdxRaw || " ");
  }

  // Navigation list (ensure stable ordering)
  const all = (getAllCanons() || []).filter((d: any) => !d?.draft);
  const normalizedAll = all.map((d: any) => ({
    ...d,
    __bare: stripCanonPrefix(d?.slug || d?._raw?.flattenedPath || ""),
  }));

  const idx = normalizedAll.findIndex((d: any) => d.__bare === slug);
  const prevDocRaw = idx > 0 ? normalizedAll[idx - 1] : null;
  const nextDocRaw = idx >= 0 && idx < normalizedAll.length - 1 ? normalizedAll[idx + 1] : null;

  const doc: CanonDoc = {
    title: rawDoc.title || "Institutional Brief",
    slug, // ✅ bare
    href: joinHref("canon", slug), // ✅ /canon/<bare>
    accessLevel,
    date: rawDoc.date ? String(rawDoc.date) : null,
    coverImage: resolveDocCoverImage(rawDoc),
    category: rawDoc.category || null,
    tags: Array.isArray(rawDoc.tags) ? rawDoc.tags : [],
    author: rawDoc.author || "Abraham of London",
    nextDoc: nextDocRaw
      ? {
          title: nextDocRaw.title || "Next",
          href: joinHref("canon", String(nextDocRaw.__bare)),
        }
      : null,
    prevDoc: prevDocRaw
      ? {
          title: prevDocRaw.title || "Previous",
          href: joinHref("canon", String(prevDocRaw.__bare)),
        }
      : null,
  };

  return {
    props: sanitizeData({
      doc,
      initialLocked,
      initialSource: initialLocked ? null : initialSource,
      mdxRaw,
    }),
    revalidate: 1800,
  };
};

export default CanonSlugPage;