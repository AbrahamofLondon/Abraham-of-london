/* pages/shorts/[...slug].tsx — SHORTS DETAIL (FIXED BODY CODE EXTRACTION) */

import * as React from "react";
import type { GetStaticPaths, GetStaticProps, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";

import Layout from "@/components/Layout";
import SafeMDXRenderer from "@/components/mdx/SafeMDXRenderer";

import ShortHero from "@/components/shorts/ShortHero";
import ShortMetadata from "@/components/shorts/ShortMetadata";
import ShortActions from "@/components/shorts/ShortActions";
import ShortNavigation from "@/components/shorts/ShortNavigation";
import ShortShare from "@/components/shorts/ShortShare";
import RelatedShorts from "@/components/shorts/RelatedShorts";
import ShortComments from "@/components/shorts/ShortComments";

import { getRenderableBody } from "@/lib/content/render-body";
import { resolveDocCoverImage } from "@/lib/content/shared";

type RawShortLike = {
  _id?: string | null;
  title?: string | null;
  description?: string | null;
  excerpt?: string | null;
  summary?: string | null;
  slug?: string | null;
  slugSafe?: string | null;
  hrefSafe?: string | null;
  slugComputed?: string | null;
  date?: string | null;
  tags?: string[] | null;
  readingTime?: string | null;
  readTime?: string | null;
  readTimeSafe?: string | null;
  coverImage?: string | null;
  image?: string | null;
  draft?: boolean | null;
  published?: boolean | null;
  type?: string | null;
  kind?: string | null;
  docKind?: string | null;
  _type?: string | null;
  content?: string | null;
  mdx?: string | null;
  body?: {
    code?: string | null;
    raw?: string | null;
  } | null;
  bodyCode?: string | null;
  _raw?: {
    flattenedPath?: string | null;
    sourceFilePath?: string | null;
    sourceFileName?: string | null;
  } | null;
};

type ShortLinkItem = {
  title: string;
  slug: string;
  excerpt?: string | null;
};

type PageItem = {
  title: string;
  description: string;
  excerpt: string;
  slug: string;
  bodyCode: string | null;
  bodyMode: string | null;
  date: string | null;
  tags: string[];
  readingTime: string | null;
  coverImage: string | null;
};

type Props = {
  item: PageItem;
  relatedShorts: ShortLinkItem[];
  prevShort: ShortLinkItem | null;
  nextShort: ShortLinkItem | null;
};

type InteractionState = {
  likes: number;
  saves: number;
  userLiked: boolean;
  userSaved: boolean;
  shares: number;
  loaded: boolean;
};

type InteractionApiResponse = {
  slug?: string;
  likes?: number;
  saves?: number;
  userLiked?: boolean;
  userSaved?: boolean;
};

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.abrahamoflondon.org";

const EMPTY_ITEM: PageItem = {
  title: "Short",
  description: "",
  excerpt: "",
  slug: "",
  bodyCode: null,
  bodyMode: null,
  date: null,
  tags: [],
  readingTime: null,
  coverImage: null,
};

function safeString(value: unknown): string {
  return typeof value === "string" ? value : value == null ? "" : String(value);
}

function safeArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function normalizePathish(input: unknown): string {
  return safeString(input)
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/{2,}/g, "/")
    .replace(/\.(md|mdx)$/i, "");
}

function joinParamSlug(param: string | string[] | undefined): string {
  if (!param) return "";
  return Array.isArray(param) ? param.join("/") : safeString(param);
}

function stripPrefixOnce(source: string, prefix: string): string {
  const normalizedPrefix = `${prefix.toLowerCase()}/`;
  if (source.toLowerCase().startsWith(normalizedPrefix)) {
    return source.slice(normalizedPrefix.length).replace(/^\/+/, "");
  }
  return source;
}

function toShortRouteSlug(input: unknown): string {
  let s = normalizePathish(input);
  if (!s || s.includes("..")) return "";

  let changed = true;
  while (changed) {
    changed = false;

    const nextA = stripPrefixOnce(s, "content");
    if (nextA !== s) {
      s = nextA;
      changed = true;
    }

    const nextB = stripPrefixOnce(s, "vault");
    if (nextB !== s) {
      s = nextB;
      changed = true;
    }

    const nextC = stripPrefixOnce(s, "shorts");
    if (nextC !== s) {
      s = nextC;
      changed = true;
    }
  }

  s = normalizePathish(s);
  return !s || s.includes("..") ? "" : s;
}

function getRawDocSlug(doc: RawShortLike): string {
  return (
    safeString(doc?.slugSafe) ||
    safeString(doc?.slugComputed) ||
    safeString(doc?.slug) ||
    safeString(doc?.hrefSafe) ||
    safeString(doc?._raw?.flattenedPath) ||
    safeString(doc?._raw?.sourceFilePath) ||
    safeString(doc?._raw?.sourceFileName) ||
    safeString(doc?._id)
  );
}

function getCandidateSlugs(doc: RawShortLike): string[] {
  const rawValues = [
    safeString(doc?.slugSafe),
    safeString(doc?.slugComputed),
    safeString(doc?.slug),
    safeString(doc?.hrefSafe),
    safeString(doc?._raw?.flattenedPath),
    safeString(doc?._raw?.sourceFilePath),
    safeString(doc?._raw?.sourceFileName),
    safeString(doc?._id),
  ].filter(Boolean);

  const out = new Set<string>();

  for (const value of rawValues) {
    const normalized = normalizePathish(value);
    if (!normalized) continue;

    out.add(normalized);
    out.add(toShortRouteSlug(normalized));

    const withoutShorts = stripPrefixOnce(normalized, "shorts");
    if (withoutShorts && withoutShorts !== normalized) {
      out.add(withoutShorts);
      out.add(toShortRouteSlug(withoutShorts));
    }

    const withoutContent = stripPrefixOnce(normalized, "content");
    if (withoutContent && withoutContent !== normalized) {
      out.add(withoutContent);
      out.add(toShortRouteSlug(withoutContent));
    }

    const basename = normalized.split("/").filter(Boolean).pop() || "";
    if (basename) {
      out.add(normalizePathish(basename));
      out.add(toShortRouteSlug(basename));
    }
  }

  return [...out].filter(Boolean);
}

function isMatchingShort(doc: RawShortLike, targetSlug: string): boolean {
  const normalizedTarget = normalizePathish(targetSlug);
  const routeTarget = toShortRouteSlug(targetSlug);

  if (!routeTarget) return false;

  return getCandidateSlugs(doc).some((candidate) => {
    const normalizedCandidate = normalizePathish(candidate);
    const routeCandidate = toShortRouteSlug(candidate);

    return (
      normalizedCandidate === normalizedTarget ||
      normalizedCandidate === `shorts/${routeTarget}` ||
      normalizedCandidate === `content/shorts/${routeTarget}` ||
      routeCandidate === routeTarget
    );
  });
}

function toAbsoluteUrl(input: string | null | undefined): string | undefined {
  const raw = safeString(input).trim();
  if (!raw) return undefined;
  if (/^https?:\/\//i.test(raw)) return raw;
  return `${SITE_URL}${raw.startsWith("/") ? raw : `/${raw}`}`;
}

function formatHumanDate(date?: string | null): string | undefined {
  const raw = safeString(date);
  if (!raw) return undefined;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return undefined;

  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function buildShortApiPath(slug: string, suffix?: string): string {
  const encoded = normalizePathish(slug)
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return suffix ? `/api/shorts/${encoded}/${suffix}` : `/api/shorts/${encoded}`;
}

function getDocTimestamp(doc: RawShortLike): number {
  const raw = safeString(doc?.date);
  if (!raw) return 0;
  const value = new Date(raw).getTime();
  return Number.isFinite(value) ? value : 0;
}

function sortShorts(docs: RawShortLike[]): RawShortLike[] {
  return [...docs].sort((a, b) => {
    const aTime = getDocTimestamp(a);
    const bTime = getDocTimestamp(b);

    if (aTime !== bTime) return bTime - aTime;

    const aSlug = toShortRouteSlug(getRawDocSlug(a));
    const bSlug = toShortRouteSlug(getRawDocSlug(b));
    return aSlug.localeCompare(bSlug);
  });
}

function toShortLinkItem(doc: RawShortLike | null | undefined): ShortLinkItem | null {
  if (!doc) return null;

  const slug = toShortRouteSlug(getRawDocSlug(doc));
  if (!slug) return null;

  return {
    title: safeString(doc.title).trim() || `[Untitled: ${slug}]`,
    slug,
    excerpt: safeString(doc.excerpt || doc.summary || doc.description) || null,
  };
}

function toPageItem(doc: RawShortLike): PageItem {
  const slug = toShortRouteSlug(getRawDocSlug(doc));
  const renderBody = getRenderableBody(doc);

  return {
    title: safeString(doc.title).trim() || `[Untitled: ${slug || "unknown"}]`,
    description: safeString(doc.description || doc.excerpt || doc.summary).trim(),
    excerpt: safeString(doc.excerpt || doc.summary || doc.description).trim(),
    slug,
    bodyCode: renderBody.code,
    bodyMode: renderBody.mode,
    date: safeString(doc.date) || null,
    tags: safeArray(doc.tags).map((tag) => safeString(tag)).filter(Boolean),
    readingTime:
      safeString(doc.readingTime) ||
      safeString(doc.readTime) ||
      safeString(doc.readTimeSafe) ||
      null,
    coverImage: resolveDocCoverImage(doc, { contentType: 'SHORT' }),
  };
}

function isPublishedShort(doc: RawShortLike): boolean {
  if (!doc) return false;
  if (doc.draft === true) return false;
  if (doc.published === false) return false;

  const slug = toShortRouteSlug(getRawDocSlug(doc));
  return Boolean(slug);
}

async function loadAllShorts(): Promise<RawShortLike[]> {
  try {
    const { getAllShorts } = await import("@/lib/content/server");
    const flat = (getAllShorts() || []) as RawShortLike[];

    const deduped: RawShortLike[] = [];
    const seen = new Set<string>();

    for (const doc of flat) {
      const key =
        safeString(doc?._id) ||
        safeString(doc?._raw?.flattenedPath) ||
        safeString(doc?.slug) ||
        JSON.stringify(doc);

      if (seen.has(key)) continue;
      seen.add(key);

      const rawSlug = getRawDocSlug(doc);
      const routeSlug = toShortRouteSlug(rawSlug);
      const fp = normalizePathish(doc?._raw?.flattenedPath);

      const looksLikeShort =
        safeString(doc?.kind).toLowerCase() === "short" ||
        safeString(doc?.type).toLowerCase() === "short" ||
        safeString(doc?.docKind).toLowerCase() === "short" ||
        fp.startsWith("shorts/") ||
        rawSlug.toLowerCase().includes("shorts/");

      if (!looksLikeShort) continue;
      if (!isPublishedShort(doc)) continue;

      deduped.push(doc);
    }

    return deduped;
  } catch (error) {
    console.error("[shorts:loadAllShorts] failed", error);
    return [];
  }
}

const ShortsSlugPage: NextPage<Props> = ({
  item = EMPTY_ITEM,
  relatedShorts = [],
  prevShort = null,
  nextShort = null,
}) => {
  const safeItem = item || EMPTY_ITEM;

  const title = safeItem.title || "Short";
  const description = safeItem.description || safeItem.excerpt || "";
  const canonicalSlug = toShortRouteSlug(safeItem.slug);
  const canonicalUrl = canonicalSlug
    ? `${SITE_URL}/shorts/${canonicalSlug}`
    : `${SITE_URL}/shorts`;

  const absoluteCoverImage = toAbsoluteUrl(safeItem.coverImage);
  const formattedDate = React.useMemo(
    () => formatHumanDate(safeItem.date),
    [safeItem.date]
  );

  const [interactions, setInteractions] = React.useState<InteractionState>({
    likes: 0,
    saves: 0,
    userLiked: false,
    userSaved: false,
    shares: 0,
    loaded: false,
  });

  const [interactionPending, setInteractionPending] = React.useState({
    like: false,
    save: false,
  });

  const fetchInteractions = React.useCallback(async () => {
    if (!canonicalSlug) return;

    try {
      const response = await fetch(buildShortApiPath(canonicalSlug, "interactions"), {
        method: "GET",
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });

      if (!response.ok) return;

      const data = (await response.json()) as InteractionApiResponse;

      setInteractions((prev) => ({
        ...prev,
        likes: typeof data.likes === "number" ? data.likes : 0,
        saves: typeof data.saves === "number" ? data.saves : 0,
        userLiked: Boolean(data.userLiked),
        userSaved: Boolean(data.userSaved),
        loaded: true,
      }));
    } catch {
      // fail-open
    }
  }, [canonicalSlug]);

  React.useEffect(() => {
    void fetchInteractions();
  }, [fetchInteractions]);

  const applyInteractionResponse = React.useCallback(
    async (kind: "like" | "save") => {
      if (!canonicalSlug) return;

      const currentlyActive =
        kind === "like" ? interactions.userLiked : interactions.userSaved;

      setInteractionPending((prev) => ({ ...prev, [kind]: true }));

      try {
        const response = await fetch(buildShortApiPath(canonicalSlug, kind), {
          method: currentlyActive ? "DELETE" : "POST",
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) return;

        const data = (await response.json()) as InteractionApiResponse;

        setInteractions((prev) => ({
          ...prev,
          likes: typeof data.likes === "number" ? data.likes : prev.likes,
          saves: typeof data.saves === "number" ? data.saves : prev.saves,
          userLiked:
            typeof data.userLiked === "boolean" ? data.userLiked : prev.userLiked,
          userSaved:
            typeof data.userSaved === "boolean" ? data.userSaved : prev.userSaved,
          loaded: true,
        }));
      } catch {
        // fail-open
      } finally {
        setInteractionPending((prev) => ({ ...prev, [kind]: false }));
      }
    },
    [canonicalSlug, interactions.userLiked, interactions.userSaved]
  );

  const handleNativeShare = React.useCallback(async () => {
    try {
      if (typeof navigator !== "undefined" && navigator.share && canonicalSlug) {
        await navigator.share({
          title,
          text: description,
          url: canonicalUrl,
        });

        setInteractions((prev) => ({ ...prev, shares: prev.shares + 1 }));
        return;
      }

      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(canonicalUrl);
        setInteractions((prev) => ({ ...prev, shares: prev.shares + 1 }));
      }
    } catch {
      // fail-open
    }
  }, [canonicalSlug, canonicalUrl, description, title]);

  const handleBackToTop = React.useCallback(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <Layout
      title={`${title} | Abraham of London`}
      description={description}
      fullWidth
      headerTransparent={false}
      showFooter
      enableVaultSearch={false}
    >
      <Head>
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        {absoluteCoverImage ? (
          <meta property="og:image" content={absoluteCoverImage} />
        ) : null}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        {absoluteCoverImage ? (
          <meta name="twitter:image" content={absoluteCoverImage} />
        ) : null}
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-black via-[#050505] to-zinc-950 text-white">
        <div className="mx-auto max-w-3xl px-6 pt-6">
          <Link
            href="/shorts"
            className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-white/30 transition-colors hover:text-white/50"
          >
            <svg
              className="h-3.5 w-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back
          </Link>
        </div>

        <ShortHero
          title={title}
          excerpt={safeItem.excerpt}
          coverImage={safeItem.coverImage || undefined}
        />

        <div className="relative z-10 mx-auto -mt-6 max-w-3xl px-6">
          <ShortMetadata
            date={formattedDate}
            readingTime={safeItem.readingTime || undefined}
            tags={safeItem.tags}
          />
        </div>

        <article className="mx-auto max-w-3xl px-6 py-8">
          {safeItem.bodyCode ? (
            <SafeMDXRenderer code={safeItem.bodyCode} />
          ) : (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center font-mono text-sm text-red-200">
              No compiled MDX body found for: {safeItem.title || safeItem.slug || "(unknown)"}
            </div>
          )}

          <div className="mt-8 border-t border-white/5 pt-6">
            <ShortActions
              shortId={canonicalSlug}
              likes={interactions.likes}
              isLiked={interactions.userLiked}
              saves={interactions.saves}
              isSaved={interactions.userSaved}
              shares={interactions.shares}
              onLike={() => {
                if (interactionPending.like || !canonicalSlug) return;
                void applyInteractionResponse("like");
              }}
              onSave={() => {
                if (interactionPending.save || !canonicalSlug) return;
                void applyInteractionResponse("save");
              }}
              onShare={() => {
                void handleNativeShare();
              }}
            />
          </div>

          <div className="mt-4">
            <ShortShare url={canonicalUrl} title={title} />
          </div>
        </article>

        {prevShort || nextShort ? (
          <>
            <div className="mx-auto max-w-3xl px-6">
              <div className="h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
            </div>

            <div className="mx-auto max-w-3xl px-6 py-8">
              <ShortNavigation
                previousShort={prevShort ? { id: prevShort.slug, title: prevShort.title, slug: prevShort.slug } : undefined}
                nextShort={nextShort ? { id: nextShort.slug, title: nextShort.title, slug: nextShort.slug } : undefined}
              />
            </div>
          </>
        ) : null}

        {relatedShorts.length > 0 ? (
          <div className="border-t border-white/5 bg-black/30">
            <div className="mx-auto max-w-6xl px-6 py-12">
              <h2 className="mb-8 text-center font-serif text-xl text-white/40">
                More Shorts
              </h2>
              <RelatedShorts
                shorts={relatedShorts.map((s) => ({
                  id: s.slug,
                  title: s.title,
                  excerpt: s.excerpt ?? "",
                  duration: "",
                  category: "",
                  viewCount: 0,
                  image: "",
                  slug: s.slug,
                }))}
                currentShortId={canonicalSlug}
              />
            </div>
          </div>
        ) : null}

        <div id="comments" className="scroll-mt-16 border-t border-white/5 bg-black/30">
          <div className="mx-auto max-w-3xl px-6 py-12">
            <ShortComments shortId={canonicalSlug} />
          </div>
        </div>

        <button
          onClick={handleBackToTop}
          className="fixed bottom-6 right-6 rounded-full border border-white/10 bg-white/5 p-2 opacity-50 backdrop-blur-sm transition-all hover:bg-white/10 hover:opacity-100"
          aria-label="Back to top"
        >
          <svg
            className="h-4 w-4 text-white/60"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7 7 7"
            />
          </svg>
        </button>
      </main>
    </Layout>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  const allShorts = await loadAllShorts();
  const shorts = sortShorts(allShorts);

  const seen = new Set<string>();

  const paths = (shorts
    .map((doc) => {
      const slug = toShortRouteSlug(getRawDocSlug(doc));
      if (!slug || seen.has(slug)) return null;

      seen.add(slug);

      const parts = slug.split("/").filter(Boolean);
      if (!parts.length) return null;

      return { params: { slug: parts } };
    })
    .filter(Boolean) as Array<{ params: { slug: string[] } }>)
    // Cap prebuild to the 5 most recent shorts. Runtime slug resolution
    // still works for older shorts via `fallback: "blocking"` below.
    .slice(0, 5);

  return {
    paths,
    fallback: "blocking",
  };


};

export const getStaticProps: GetStaticProps<Props> = async ({ params }) => {
  const rawParam = joinParamSlug(params?.slug as string | string[] | undefined);
  const targetSlug = toShortRouteSlug(rawParam);

  if (!targetSlug) {
    return { notFound: true };
  }

  const allShorts = sortShorts(await loadAllShorts());

  if (!allShorts.length) {
    return { notFound: true };
  }

  const currentIndex = allShorts.findIndex((candidate) =>
    isMatchingShort(candidate, targetSlug)
  );

  const doc = currentIndex >= 0 ? allShorts[currentIndex] : null;

  if (!doc) {
    return { notFound: true };
  }

  const item = toPageItem(doc);

  if (!item.slug) {
    return { notFound: true };
  }

  // FIXED: Allow content to render even if bodyCode is raw MDX
  // The SafeMDXRenderer will handle raw MDX content appropriately
  if (!item.bodyCode) {
    console.warn(`[Short ${item.title}] No body code available. Content may not render.`);
  }

  const prevDoc =
    currentIndex >= 0 && currentIndex < allShorts.length - 1
      ? allShorts[currentIndex + 1]
      : null;

  const nextDoc =
    currentIndex > 0
      ? allShorts[currentIndex - 1]
      : null;

  const relatedShorts = allShorts
    .filter((candidate) => !isMatchingShort(candidate, targetSlug))
    .slice(0, 3)
    .map((candidate) => toShortLinkItem(candidate))
    .filter(Boolean) as ShortLinkItem[];

  return {
    props: {
      item,
      relatedShorts,
      prevShort: toShortLinkItem(prevDoc),
      nextShort: toShortLinkItem(nextDoc),
    },
    revalidate: 1800,
  };


};

export default ShortsSlugPage;