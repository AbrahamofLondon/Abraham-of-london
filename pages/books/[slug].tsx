/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/books/[slug].tsx */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import DirectorateOversight from "@/components/content/DirectorateOversight";

import { joinHref } from "@/lib/content/shared";
import { sanitizeData, resolveDocCoverImage } from "@/lib/content/client-utils";
import { getRenderableBody } from "@/lib/content/render-body";
import { decodeBodyCodePayload } from "@/lib/content/client-codec";

import type { AccessTier } from "@/lib/access/tier-policy";
import {
  normalizeUserTier,
  normalizeRequiredTier,
  hasAccess,
  requiredTierFromDoc,
} from "@/lib/access/tier-policy";

type Props = {
  doc: any;
  requiredTier: AccessTier;
  bareSlug: string;
};

const DEFAULT_COVER = "/assets/images/blog/default-blog-cover.jpg";

function safeString(value: unknown): string {
  if (typeof value === "string") return value;
  if (value == null) return "";
  return String(value);
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

const BookSlugPage: NextPage<Props> = ({ doc, requiredTier, bareSlug }) => {
  const { data: session, status } = useSession();

  const title = doc?.title || "Untitled Book";
  const subtitle = doc?.subtitle ? String(doc.subtitle) : "";
  const excerpt = doc?.excerpt || doc?.description || "";
  const cover = resolveDocCoverImage(doc) || DEFAULT_COVER;
  const canonicalUrl = joinHref("books", bareSlug);

  const required = normalizeRequiredTier(requiredTier);
  const userTier = normalizeUserTier(
    (session?.user as any)?.tier ?? (session?.user as any)?.role ?? "public"
  );
  const needsAuth = required !== "public";
  const canRead = !needsAuth || (!!session?.user && hasAccess(userTier, required));

  const [activeCode, setActiveCode] = React.useState<string>(doc?.bodyCode || "");
  const [loadingContent, setLoadingContent] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);

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
        setUnlockError(json?.reason || "UNLOCK_FAILED");
        return;
      }

      const decoded = decodeBodyCodePayload(json);

      if (decoded.trim()) {
        setActiveCode(decoded);
      } else {
        setUnlockError("UNLOCK_PAYLOAD_MISSING");
      }
    } catch {
      setUnlockError("UNLOCK_NETWORK_FAILURE");
    } finally {
      setLoadingContent(false);
    }
  }, [bareSlug, needsAuth]);

  if (needsAuth && status === "loading") {
    return (
      <Layout title={title}>
        <div className="flex min-h-screen items-center justify-center bg-black">
          <div className="animate-pulse font-mono text-xs text-amber-500">
            Verifying clearance…
          </div>
        </div>
      </Layout>
    );
  }

  if (needsAuth && (!session?.user || !canRead)) {
    return (
      <Layout title={title}>
        <div className="flex min-h-screen items-center justify-center bg-black px-6">
          <div className="w-full max-w-lg">
            <AccessGate
              title={title}
              requiredTier={required}
              message="This volume requires appropriate clearance."
              onUnlocked={handleUnlock}
              onGoToJoin={() => {
                window.location.href = "/inner-circle";
              }}
            />
            {unlockError ? (
              <div className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-red-400/90">
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
        backHref="/books"
        backLabel="Back"
        imprint="Abraham of London • Books & Manifestos"
        requiredTier={required}
        loading={loadingContent}
        unlockError={unlockError}
        activeCode={activeCode}
        emptyLabel="No content available."
      />
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  console.log("[PAGE_DATA] pages/books/[slug].tsx getStaticPaths START");
  try {
  try {
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

  } finally {
  }

  } finally {
    console.log("[PAGE_DATA] pages/books/[slug].tsx getStaticPaths END");
  }
};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  console.log("[PAGE_DATA] pages/books/[slug].tsx getStaticProps START");
  try {
  try {
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

    const doc = {
      ...rawDoc,
      slug: bare,
      bodyCode: locked ? "" : renderBody.code,
      bodyMode: renderBody.mode,
      coverImage: resolveDocCoverImage(rawDoc) || rawDoc?.coverImage || DEFAULT_COVER,
    };

    return {
      props: sanitizeData({
        doc,
        requiredTier,
        bareSlug: bare,
      }),
      revalidate: 1800,
    };
  } catch (error) {
    console.error("[Books] Error in getStaticProps:", error);
    return { notFound: true, revalidate: 60 };
  }

  } finally {
  }

  } finally {
    console.log("[PAGE_DATA] pages/books/[slug].tsx getStaticProps END");
  }
};

export default BookSlugPage;