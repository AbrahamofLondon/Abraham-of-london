/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/books/[slug].tsx — BOOK READER (SSG, SSOT slugs, tier-safe, pages-router safe) */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import { useSession } from "next-auth/react";

import Layout from "@/components/Layout";
import AccessGate from "@/components/AccessGate";
import DirectorateOversight from "@/components/content/DirectorateOversight";

import { joinHref } from "@/lib/content/shared";
import { sanitizeData, resolveDocCoverImage } from "@/lib/content/client-utils";

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

function booksBareSlug(input: unknown): string {
  let s = String(input ?? "")
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/");

  if (!s || s.includes("..")) return "";

  const stripOnce = (prefix: string) => {
    const normalized = prefix.replace(/^\/+/, "").replace(/\/+$/, "") + "/";
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

  s = s.replace(/^\/+/, "").replace(/\/+$/, "").replace(/\/{2,}/g, "/");
  if (!s || s.includes("..")) return "";

  return s;
}

function extractBodyCode(doc: any): string {
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

      if (typeof json?.bodyCode === "string" && json.bodyCode.trim()) {
        setActiveCode(json.bodyCode);
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
  const { getPublishedBooks } = await import("@/lib/content/server");

  const books = getPublishedBooks() || [];

  const paths = books
    .filter((b: any) => !b?.draft)
    .map((b: any) => {
      const fp = String(b?._raw?.flattenedPath || b?.slug || "");
      const bare = booksBareSlug(fp);
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

    const rawDoc =
      getPublishedBooks().find((d: any) => {
        const fp = String(d?._raw?.flattenedPath || d?.slug || "");
        return booksBareSlug(fp) === bare;
      }) || null;

    if (!rawDoc || rawDoc?.draft) {
      return { notFound: true };
    }

    const requiredTier = normalizeRequiredTier(requiredTierFromDoc(rawDoc));
    const locked = requiredTier !== "public";

    const doc = {
      ...rawDoc,
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
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("[Books] Error in getStaticProps:", error);
    return { notFound: true, revalidate: 60 };
  }
};

export default BookSlugPage;