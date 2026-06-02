/**
 * lib/outbound/facebook-outbound-adapter.ts
 *
 * Server-only adapter: maps OutboundPost records from the recursive
 * outbound-content-loader into FacebookPublishedAsset objects for the
 * Facebook publish gate and console.
 *
 * Mirrors x-outbound-adapter.ts. See that file for the rationale.
 *
 * Slug convention:
 *   FacebookPublishedAsset.slug = "outbound-fb/<OutboundPost.id>"
 */

import { getFacebookOutboundPosts } from "./outbound-content-loader";
import type { OutboundPost, OutboundPostsResult } from "./outbound-content-loader";
import type { FacebookPublishedAsset } from "./facebook-types";

export const FB_OUTBOUND_SLUG_PREFIX = "outbound-fb";

/** Map a single OutboundPost to a FacebookPublishedAsset. */
export function outboundPostToFacebookAsset(post: OutboundPost): FacebookPublishedAsset {
  const title = post.campaign
    ? `[${post.campaign}] ${post.slug}`
    : post.slug;
  return {
    assetType: "outbound",
    slug: `${FB_OUTBOUND_SLUG_PREFIX}/${post.id}`,
    title,
    text: post.text,
    link: post.link,
    imagePath: post.imagePath,
  };
}

export type OutboundDraftFBResult = {
  assets: FacebookPublishedAsset[];
  posts: OutboundPost[];
  result: OutboundPostsResult;
};

/**
 * Load all Facebook outbound draft posts and map them to FacebookPublishedAssets.
 */
export function getOutboundDraftFBAssets(): OutboundDraftFBResult {
  const result = getFacebookOutboundPosts();
  return {
    assets: result.posts.map(outboundPostToFacebookAsset),
    posts: result.posts,
    result,
  };
}

/**
 * Look up an outbound-fb post AND its FacebookPublishedAsset by console slug.
 */
export function getOutboundFBPostAndAssetBySlug(
  slug: string,
): { post: OutboundPost; asset: FacebookPublishedAsset } | null {
  const prefix = `${FB_OUTBOUND_SLUG_PREFIX}/`;
  if (!slug.startsWith(prefix)) return null;
  const id = slug.slice(prefix.length);
  const { posts } = getFacebookOutboundPosts();
  const post = posts.find((p) => p.id === id);
  return post ? { post, asset: outboundPostToFacebookAsset(post) } : null;
}
