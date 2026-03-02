/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/books/[slug].tsx — BOOK READER (SSOT, build-safe, public-first, no header bleed)
   - ZERO server-only imports at module scope (Prisma-safe)
   - Dynamic imports ONLY inside getStaticProps/getStaticPaths
   - Public ships MDX at build-time; restricted unlocks via API
*/

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, Lock, Loader2, Shield } from "lucide-react";

import Layout from "@/components/Layout";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";
import AccessGate from "@/components/AccessGate";

// Client-safe util only
import { resolveDocCoverImage } from "@/lib/content/shared";

import type { AccessTier } from "@/lib/access/tier-policy";
import { normalizeUserTier, normalizeRequiredTier, hasAccess, getTierLabel } from "@/lib/access/tier-policy";

type BookPageProps = {
  doc: any;
  initialCode: string; // always present for public
  requiredTier: AccessTier; // SSOT
};

const DEFAULT_COVER = "/assets/images/books/default-book.jpg";

// ------------------------------
// SLUG HELPERS (PURE, CLIENT-SAFE)
// ------------------------------

function normalizeSlug(input: string): string {
  return String(input || "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

function toBareBookSlug(input: string) {
  const n = normalizeSlug(input || "");
  return n.replace(/^\/?books\//, "").replace(/^\/?books\//, "");
}

function ensureBooksPrefix(slugOrBare: string) {
  const s = normalizeSlug(slugOrBare || "");
  if (!s) return "";
  return s.startsWith("books/") ? s : `books/${s}`;
}

function extractCode(doc: any): string {
  return String(
    doc?.body?.code ||
      doc?.bodyCode ||
      doc?.content ||
      doc?.mdx ||
      doc?.body?.raw ||
      (typeof doc?.body === "string" ? doc.body : "") ||
      "",
  );
}

// ------------------------------
// PAGE
// ------------------------------

const BookSlugPage: NextPage<BookPageProps> = ({ doc, initialCode, requiredTier }) => {
  const { data: session, status } = useSession();

  const title = doc?.title || "Untitled";
  const subtitle = doc?.subtitle || null;
  const cover = resolveDocCoverImage(doc) || DEFAULT_COVER;

  const bareSlug = toBareBookSlug(doc?.slug || doc?._raw?.flattenedPath || "");
  const canonicalUrl = `/books/${bareSlug || ""}`;

  const required = normalizeRequiredTier(requiredTier);
  const userTier = normalizeUserTier(
    (session?.user as any)?.tier ?? (session?.user as any)?.role ?? "public",
  );

  const needsAuth = required !== "public";
  const canRead = !needsAuth || (!!session?.user && hasAccess(userTier, required));

  const [activeCode, setActiveCode] = React.useState(initialCode || "");
  const [loading, setLoading] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);

  const handleUnlock = async () => {
    if (!needsAuth) return;
    if (!bareSlug) return;

    setUnlockError(null);
    setLoading(true);

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
      setLoading(false);
    }
  };

  // Auth loading only matters for restricted
  if (needsAuth && status === "loading") {
    return (
      <Layout title={title}>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-amber-500 font-mono text-xs animate-pulse">Verifying access…</div>
        </div>
      </Layout>
    );
  }

  // Gate restricted content
  if (needsAuth && (!session?.user || !canRead)) {
    return (
      <Layout title={title}>
        <div className="min-h-screen bg-black flex items-center justify-center px-6">
          <div className="w-full max-w-lg">
            <AccessGate
              title={title}
              requiredTier={required}
              message={doc?.lockMessage || "This book requires appropriate clearance."}
              onUnlocked={() => void handleUnlock()}
              onGoToJoin={() => window.location.assign("/inner-circle")}
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
        <meta name="robots" content={required === "public" ? "index, follow" : "noindex, nofollow"} />
      </Head>

      {/* HERO (header-safe padding to stop bleed) */}
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

            <div className="flex items-center gap-3">
              {required !== "public" && (
                <span className="inline-flex items-center gap-2 px-3 py-1 border border-amber-500/30 bg-amber-500/10 rounded-full text-amber-400">
                  <Lock size={12} />
                  <span className="aol-micro">{getTierLabel(required)}</span>
                </span>
              )}
              {doc?.readTime ? <div className="aol-micro text-white/35">{doc.readTime}</div> : null}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-12 gap-10 items-start">
            {/* Cover */}
            <div className="md:col-span-4">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.02]">
                <div className="relative w-full" style={{ aspectRatio: "3 / 4" }}>
                  <Image
                    src={cover}
                    alt={title}
                    fill
                    priority
                    className={doc?.coverFit === "contain" ? "object-contain" : "object-cover"}
                    style={{ objectPosition: doc?.coverPosition || "center" }}
                    sizes="(max-width: 768px) 100vw, 420px"
                  />
                  <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                </div>
              </div>
            </div>

            {/* Meta */}
            <div className="md:col-span-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2">
                <Shield size={12} className="text-amber-500/60" />
                <span className="aol-micro text-amber-200/60">{doc?.docKind || "Book"}</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span className="aol-micro text-white/35">{doc?.volume || "Canon"}</span>
                {required === "public" ? (
                  <>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span className="aol-micro text-emerald-500/60">Public</span>
                  </>
                ) : null}
              </div>

              <h1 className="mt-6 font-serif text-4xl md:text-5xl tracking-tight text-white/95">{title}</h1>

              {subtitle ? (
                <p className="mt-3 text-base md:text-lg text-white/55 leading-relaxed max-w-2xl">{subtitle}</p>
              ) : null}

              {doc?.description ? (
                <p className="mt-6 text-sm md:text-base text-white/45 leading-relaxed max-w-2xl">{doc.description}</p>
              ) : null}

              {/* Optional unlock panel if restricted AND no code */}
              {needsAuth && !activeCode ? (
                <div className="mt-8 rounded-3xl border border-amber-500/20 bg-amber-500/10 p-6">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-amber-200/80" />
                    <div>
                      <div className="aol-micro text-amber-200/70">Restricted • {getTierLabel(required)}</div>
                      <div className="mt-2 text-sm text-white/70">Unlock to continue.</div>
                      {unlockError ? (
                        <div className="mt-2 text-[10px] font-mono uppercase tracking-widest text-red-400/90">
                          {unlockError}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => void handleUnlock()}
                    className="mt-6 inline-flex items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/15 px-5 py-3 text-sm text-amber-100 hover:bg-amber-500/20 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Unlocking…
                      </span>
                    ) : (
                      "Unlock"
                    )}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* READER */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 lg:px-10 py-14">
        <div className="rounded-[28px] border border-white/10 bg-white/[0.02] p-7 md:p-10">
          <SafeMDXRenderer code={activeCode} loadingLabel="Loading book…" />
        </div>

        <div className="mt-10 aol-hairline" />
        <div className="mt-8 text-center">
          <div className="aol-micro text-white/35">Abraham of London • Institutional Library</div>
        </div>
      </section>
    </Layout>
  );
};

// ------------------------------
// SSG — SERVER ONLY (dynamic imports)
// ------------------------------

export const getStaticPaths: GetStaticPaths = async () => {
  const { getBooks } = await import("@/lib/content/server");

  const books = (await (async () => {
    // getBooks may be sync or async depending on your SSOT; normalize safely.
    const r = (getBooks as any)();
    return r && typeof r.then === "function" ? await r : r;
  })()) || [];

  const paths = books
    .map((b: any) => {
      const raw = normalizeSlug(b?._raw?.flattenedPath || "") || normalizeSlug(b?.slug || "");
      const bare = toBareBookSlug(raw);
      if (!bare) return null;
      return { params: { slug: bare } };
    })
    .filter(Boolean) as Array<{ params: { slug: string } }>;

  return { paths, fallback: "blocking" };
};

export const getStaticProps: GetStaticProps<BookPageProps> = async ({ params }) => {
  const [{ getServerBookBySlug, sanitizeData }, tierMod] = await Promise.all([
    import("@/lib/content/server"),
    import("@/lib/access/tier-policy"),
  ]);

  const bare = toBareBookSlug(String(params?.slug || ""));
  if (!bare) return { notFound: true };

  // Some projects store slugs with or without "books/" prefix — try both.
  const doc =
    (await getServerBookBySlug(bare)) ||
    (await getServerBookBySlug(`books/${bare}`));

  if (!doc || doc?.draft) return { notFound: true };

  const requiredTier = normalizeRequiredTier((tierMod as any).requiredTierFromDoc(doc));

  // Public always ships code at build time; restricted requires unlock via API.
  const initialCode = requiredTier === "public" ? extractCode(doc) : "";

  const finalSlug = ensureBooksPrefix(doc?.slug || bare);

  return {
    props: sanitizeData({
      doc: { ...doc, slug: finalSlug },
      initialCode,
      requiredTier,
    }),
    revalidate: 1800,
  };
};

export default BookSlugPage;