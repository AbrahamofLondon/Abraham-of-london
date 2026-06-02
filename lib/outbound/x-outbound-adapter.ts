/**
 * lib/outbound/x-outbound-adapter.ts
 *
 * Server-only adapter: maps OutboundPost records from the recursive
 * outbound-content-loader into XPublishedAsset objects that the X publish
 * gate, console, and publish endpoint can operate on.
 *
 * Why a separate file:
 *   x-content-resolver.ts is imported by outbound-asset-resolver.ts and
 *   outbound-sync-orchestrator.ts which must remain free of fs-based imports.
 *   This adapter owns the bridge between the two worlds.
 *
 * Slug convention:
 *   XPublishedAsset.slug = "outbound-x/<OutboundPost.id>"
 *   The publish endpoint strips the prefix to find the source post.
 */

import { getXOutboundPosts } from "./outbound-content-loader";
import type { OutboundPost, OutboundPostsResult } from "./outbound-content-loader";
import type { XPublishedAsset } from "./x-types";

export const X_OUTBOUND_SLUG_PREFIX = "outbound-x";

/** Map a single OutboundPost to an XPublishedAsset for gate + publish use. */
export function outboundPostToXAsset(post: OutboundPost): XPublishedAsset {
  const title = post.campaign
    ? `[${post.campaign}] ${post.slug}`
    : post.slug;
  return {
    assetType: "outbound",
    slug: `${X_OUTBOUND_SLUG_PREFIX}/${post.id}`,
    title,
    text: post.text,
    link: post.link,
  };
}

export type OutboundDraftXResult = {
  assets: XPublishedAsset[];
  posts: OutboundPost[];
  result: OutboundPostsResult;
};

/**
 * Load all X outbound draft posts and return them as XPublishedAssets.
 * Also returns the raw OutboundPostsResult for discovery stats.
 */
export function getOutboundDraftXAssets(): OutboundDraftXResult {
  const result = getXOutboundPosts();
  return {
    assets: result.posts.map(outboundPostToXAsset),
    posts: result.posts,
    result,
  };
}

/**
 * Look up a single outbound-x asset by its console slug ("outbound-x/<id>").
 * Returns null if the slug prefix doesn't match or the post is not found.
 */
export function getOutboundXAssetBySlug(slug: string): XPublishedAsset | null {
  return getOutboundXPostAndAssetBySlug(slug)?.asset ?? null;
}

/**
 * Look up an outbound-x post AND its XPublishedAsset by console slug.
 * Returns both so callers can use the OutboundPost's idempotencyKey and
 * scheduledFor for the publish ledger — without a second disk read.
 */
export function getOutboundXPostAndAssetBySlug(
  slug: string,
): { post: OutboundPost; asset: XPublishedAsset } | null {
  const prefix = `${X_OUTBOUND_SLUG_PREFIX}/`;
  if (!slug.startsWith(prefix)) return null;
  const id = slug.slice(prefix.length);
  const { posts } = getXOutboundPosts();
  const post = posts.find((p) => p.id === id);
  return post ? { post, asset: outboundPostToXAsset(post) } : null;
}
