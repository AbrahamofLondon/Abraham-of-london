/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/books/[slug].tsx */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Lock } from "lucide-react";

import Layout from "@/components/Layout";
import DirectorateOversight from "@/components/content/DirectorateOversight";

import { joinHref } from "@/lib/content/shared";
import { sanitizeData, resolveDocCoverImage } from "@/lib/content/client-utils";
import { getRenderableBody } from "@/lib/content/render-body";
import { decodeBodyCodePayload, decodeBodyHtmlPayload } from "@/lib/content/client-codec";
import { renderDocBodyToStaticHtml } from "@/lib/mdx/static-mdx-runtime";

import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
  requiredTierFromDoc,
  getTierLabel,
} from "@/lib/access/tier-policy";

type Props = {
  doc: any;
  requiredTier: AccessTier;
  bareSlug: string;
  bodyEmpty?: boolean;
};

const DEFAULT_COVER = "/assets/images/books/the-architecture-of-human-purpose.jpg";

const UNLOCK_ERROR_MESSAGES: Record<string, string> = {
  CLEARANCE_REQUIRED:
    "Sign in to access this volume. Professional or Inner Circle access required.",
  SESSION_INVALID:
    "Your session has expired. Please sign in again to continue reading.",
  INSUFFICIENT_CLEARANCE:
    "Your account does not have access to this volume. Upgrade your access tier to continue.",
  UNLOCK_FAILED:
    "Unable to verify access. Please sign in again or refresh the page.",
  UNLOCK_NETWORK_FAILURE:
    "Unable to verify access. Please check your connection and try again.",
  UNLOCK_PAYLOAD_MISSING:
    "This volume could not be loaded. Please refresh or try again.",
  BODY_UNAVAILABLE:
    "This volume is temporarily unavailable in the reading chamber.",
};

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
}

function readerFacingUnlockError(reason: unknown): string {
  const key = safeString(reason).trim().toUpperCase();
  return UNLOCK_ERROR_MESSAGES[key] || "Unable to verify access. Please refresh or sign in again.";
}

function normalizePathish(input: unknown): string {
  return safeString(input)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");
}

function booksBareSlug(input: unknown): string {
  let s = normalizePathish(input);

  if (!s || s.includes("..")) return "";

  const stripOnce = (prefix: string) => {
    const normalized = `${prefix.replace(/^\/+/, "").replace(/\/+$/, "")}/`;
    if (s.toLowerCase().startsWith(normalized.toLowerCase())) {
      s = s.slice(normalized.length).replace(/^\/+/, "");
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

  s = normalizePathish(s).replace(/\.(md|mdx)$/i, "");
  if (!s || s.includes("..")) return "";

  return s;
}

function pickBookSlug(doc: any): string {
  return (
    booksBareSlug(doc?.urlSlug) ||
    booksBareSlug(doc?.collectionSlug) ||
    booksBareSlug(doc?.slug) ||
    booksBareSlug(doc?._raw?.flattenedPath) ||
    booksBareSlug(doc?._raw?.sourceFilePath) ||
    ""
  );
}

function normalizeCoverAspect(
  input: unknown,
): "square" | "wide" | "book" | null {
  const v = String(input ?? "").trim().toLowerCase();
  if (v === "square") return "square";
  if (v === "wide") return "wide";
  if (v === "book") return "book";
  return null;
}

function normalizeCoverFit(input: unknown): "cover" | "contain" | null {
  const v = String(input ?? "").trim().toLowerCase();
  if (v === "cover") return "cover";
  if (v === "contain") return "contain";
  return null;
}

function normalizeCoverPosition(
  input: unknown,
): "center" | "top" | "bottom" | "left" | "right" | null {
  const v = String(input ?? "").trim();
  return v === "center" || v === "top" || v === "bottom" || v === "left" || v === "right"
    ? v
    : null;
}

function BookLockedState({
  title,
  slug,
  message,
  requiredTier,
  authenticated,
}: {
  title: string;
  slug: string;
  message: string;
  requiredTier: AccessTier;
  authenticated: boolean;
}) {
  const requiredLabel = getTierLabel(requiredTier);
  const returnPath = `/books/${slug}`;
  const signInHref = `/api/auth/signin?callbackUrl=${encodeURIComponent(returnPath)}`;

  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-amber-500/25 bg-amber-500/10">
        <Lock className="h-5 w-5 text-amber-300" />
      </div>
      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.34em] text-amber-200/70">
        {requiredLabel} access required
      </p>
      <h2 className="mt-4 font-serif text-3xl italic text-white">{title}</h2>
      <p className="mt-4 text-sm leading-relaxed text-white/55">
        This volume requires {requiredLabel} access.
      </p>
      {message ? (
        <p className="mt-3 text-sm leading-relaxed text-white/45">{message}</p>
      ) : null}
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link
          href={signInHref}
          className="inline-flex items-center justify-center bg-amber-500 px-5 py-3 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-black transition hover:bg-white"
        >
          {authenticated ? "Sign In Again" : "Sign In"}
        </Link>
        <Link
          href="/access"
          className="inline-flex items-center justify-center border border-white/10 px-5 py-3 font-mono text-[10px] uppercase tracking-[0.28em] text-white/55 transition hover:border-white/25 hover:text-white"
        >
          View Access Options
        </Link>
      </div>
    </div>
  );
}

const BookSlugPage: NextPage<Props> = ({ doc, requiredTier, bareSlug, bodyEmpty }) => {
  const { data: session, status } = useSession();

  const title = doc?.title || "Untitled Book";
  const subtitle = doc?.subtitle ? String(doc.subtitle) : "";
  const excerpt = doc?.excerpt || doc?.description || "";
  const cover = resolveDocCoverImage(doc, { contentType: 'BOOK' });
  const canonicalUrl = joinHref("books", bareSlug);

  const required = normalizeRequiredTier(requiredTier);
  const userTier = normalizeUserTier(
    (session?.user as any)?.tier ?? (session?.user as any)?.role ?? "public"
  );
  const needsAuth = required !== "public";
  const canRead = !needsAuth || (!!session?.user && hasAccess(userTier, required));

  const [activeCode, setActiveCode] = React.useState<string>(doc?.bodyCode || "");
  const [activeHtml, setActiveHtml] = React.useState<string>(doc?.staticHtml || "");
  const [loadingContent, setLoadingContent] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);

  // Guards the one-shot auto-unlock below so a failed fetch cannot re-fire.
  const autoUnlockAttempted = React.useRef(false);

  const handleUnlock = React.useCallback(async () => {
    if (!needsAuth || !bareSlug) return;

    setUnlockError(null);
    setLoadingContent(true);

    try {
      const res = await fetch(`/api/books/${encodeURIComponent(bareSlug)}`, {
        method: "GET",
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok || !json?.ok) {
        setUnlockError(readerFacingUnlockError(json?.reason || "UNLOCK_FAILED"));
        return;
      }

      const decodedHtml = decodeBodyHtmlPayload(json);
      const decoded = decodeBodyCodePayload(json);

      if (decodedHtml.trim()) {
        setActiveHtml(decodedHtml);
        setActiveCode("");
      } else if (decoded.trim()) {
        setActiveCode(decoded);
      } else {
        setUnlockError(readerFacingUnlockError("UNLOCK_PAYLOAD_MISSING"));
      }
    } catch {
      setUnlockError(readerFacingUnlockError("UNLOCK_NETWORK_FAILURE"));
    } finally {
      setLoadingContent(false);
    }
  }, [bareSlug, needsAuth]);

  // Pre-authorized readers bypass <AccessGate>, but gated bodyCode was stripped
  // in getStaticProps — without this, activeCode stays "" and the reader renders
  // empty. Fetch the secured payload exactly once when authenticated + cleared.
  React.useEffect(() => {
    if (
      needsAuth &&
      session?.user &&
      canRead &&
      !activeCode &&
      !autoUnlockAttempted.current
    ) {
      autoUnlockAttempted.current = true;
      void handleUnlock();
    }
  }, [needsAuth, session?.user, canRead, activeCode, handleUnlock]);

  if (bodyEmpty && !needsAuth) {
    return (
      <Layout title={title} description="This volume is under institutional review.">
        <div className="flex min-h-screen items-center justify-center bg-black px-6">
          <div className="max-w-md text-center">
            <p className="font-mono text-[8px] uppercase tracking-[0.3em] text-amber-500/60">
              Abraham of London · Books
            </p>
            <h1 className="mt-4 font-serif text-3xl italic text-white/80">{title}</h1>
            <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.25em] text-white/30">
              Under Institutional Review
            </p>
            <p className="mt-3 text-xs leading-relaxed text-white/20">
              This volume is part of the governed estate but its content has not been
              cleared for public rendering. Contact the administration if you believe
              this is in error.
            </p>
            <Link href="/books" className="mt-8 inline-block font-mono text-[9px] uppercase tracking-[0.3em] text-amber-500/50 transition-colors hover:text-amber-500">
              ← Return to Books
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const showLockedReader = needsAuth && (!session?.user || !canRead);
  const lockedReaderFallback = showLockedReader ? (
    <BookLockedState
      title={title}
      slug={bareSlug}
      requiredTier={required}
      authenticated={!!session?.user}
      message={doc?.lockMessage || "This volume requires appropriate access."}
    />
  ) : null;

  return (
    <Layout
      title={`${title} // Abraham of London`}
      canonicalUrl={canonicalUrl}
      className="bg-black text-white"
      fullWidth
      headerTransparent={false}
    >
      <Head>
        <title>{`${title} // Abraham of London`}</title>
        {excerpt ? <meta name="description" content={excerpt} /> : null}
        <meta
          name="robots"
          content={required === "public" ? "index, follow" : "noindex, nofollow"}
        />
      </Head>

      <DirectorateOversight
        kind="book"
        title={title}
        subtitle={subtitle}
        excerpt={excerpt}
        category={doc?.category || "Book"}
        date={doc?.date || null}
        tags={Array.isArray(doc?.tags) ? doc.tags : []}
        readTime={doc?.readTime || null}
        cover={cover}
        coverAspect={normalizeCoverAspect(doc?.coverAspect)}
        coverFit={normalizeCoverFit(doc?.coverFit)}
        coverPosition={normalizeCoverPosition(doc?.coverPosition)}
        backHref="/books"
        backLabel="Back"
        imprint="Abraham of London • Books & Manifestos"
        requiredTier={required}
        loading={loadingContent}
        unlockError={unlockError}
        activeCode={activeCode}
        activeHtml={activeHtml}
        readerFallback={lockedReaderFallback}
        emptyLabel={doc?.lockMessage || "No content available."}
      />
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const { getPublishedBooks } = await import("@/lib/content/server");
  const books = (await getPublishedBooks()) || [];

  const paths = books
    .filter((b: any) => !b?.draft)
    .map((b: any) => {
      const bare = pickBookSlug(b);
      return bare ? { params: { slug: bare } } : null;
    })
    .filter(Boolean) as Array<{ params: { slug: string } }>;

  return { paths, fallback: "blocking" };


};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  try {
    const bare = booksBareSlug(params?.slug);
    if (!bare) return { notFound: true };

    const { getPublishedBooks } = await import("@/lib/content/server");
    const books = (await getPublishedBooks()) || [];

    const rawDoc =
      books.find((d: any) => pickBookSlug(d) === bare) ||
      books.find((d: any) => normalizePathish(d?.urlSlug) === bare) ||
      books.find((d: any) => normalizePathish(d?.collectionSlug) === `books/${bare}`) ||
      null;

    if (!rawDoc || rawDoc?.draft) {
      return { notFound: true };
    }

    const requiredTier = normalizeRequiredTier(requiredTierFromDoc(rawDoc));
    const locked = requiredTier !== "public";
    const renderBody = getRenderableBody(rawDoc);
    const staticRender = !locked ? renderDocBodyToStaticHtml(rawDoc) : { html: "", mode: "empty" };
    const bodyCode = locked || staticRender.html ? "" : renderBody.code;
    const bodyEmpty = !locked && !staticRender.html && (renderBody.mode === "empty" || renderBody.mode === "suspicious" || !bodyCode.trim());

    // Strip body (raw MDX source + compiled code) before serialising into page
    // props — locked books set bodyCode="" but rawDoc.body would still leak
    // body.raw and body.code into __NEXT_DATA__ if spread unchecked.
    const { body: _body, ...safeRawDoc } = rawDoc as any;

    const doc = {
      ...safeRawDoc,
      slug: bare,
      bodyCode,
      staticHtml: staticRender.html,
      staticMode: staticRender.mode,
      bodyMode: renderBody.mode,
      coverImage: resolveDocCoverImage(rawDoc) || rawDoc?.coverImage || DEFAULT_COVER,
    };

    return {
      props: sanitizeData({
        doc,
        requiredTier,
        bareSlug: bare,
        bodyEmpty,
      }),
      revalidate: 1800,
    };
  } catch (error) {
    console.error("[Books] Error in getStaticProps:", error);
    return { notFound: true, revalidate: 60 };
  }


};

export default BookSlugPage;
