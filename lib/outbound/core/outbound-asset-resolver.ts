/**
 * lib/outbound/core/outbound-asset-resolver.ts
 *
 * Unified outbound asset resolution facade.
 *
 * Wraps the three provider-specific content resolvers behind a single
 * contract-typed interface. Callers request a draft by provider + slug
 * and receive an OutboundDraft ready for gate evaluation.
 *
 * Each provider resolver remains authoritative for its own composition
 * logic (tweet budgets, Facebook image paths, LinkedIn body).
 * This module only adapts their outputs to the shared OutboundDraft shape.
 *
 * DOES NOT call any server-only modules directly — content resolvers are
 * intentionally server-safe (Contentlayer reads, no DB).
 */

import type { OutboundDraft, ProviderId, OutboundAssetType } from "./outbound-provider-contract";

// ─── Facebook ─────────────────────────────────────────────────────────────────

import {
  getFacebookAssetBySlug,
  getBlogSeriesFacebookAssets,
} from "@/lib/outbound/facebook-content-resolver";
import type { FacebookPublishedAsset } from "@/lib/outbound/facebook-types";

function facebookAssetToDraft(asset: FacebookPublishedAsset): OutboundDraft {
  return {
    provider: "facebook",
    assetType: asset.assetType as OutboundAssetType,
    slug: asset.slug,
    title: asset.title,
    text: asset.text,
    link: asset.link,
    meta: {
      imagePath: asset.imagePath ?? null,
    },
  };
}

// ─── X (Twitter) ─────────────────────────────────────────────────────────────

import {
  getXAssetBySlug,
  getBlogSeriesXAssets,
  getAllXPublishableAssets,
} from "@/lib/outbound/x-content-resolver";
import type { XPublishedAsset } from "@/lib/outbound/x-types";

function xAssetToDraft(asset: XPublishedAsset): OutboundDraft {
  return {
    provider: "x",
    assetType: asset.assetType as OutboundAssetType,
    slug: asset.slug,
    title: asset.title,
    text: asset.text,
    link: asset.link,
    meta: {},
  };
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────

import {
  getResolvedLinkedInOutboundBySlug,
  getResolvedLinkedInOutboundAssets,
} from "@/lib/outbound/linkedin-content-resolver";

function linkedInAssetToDraft(asset: {
  slug: string;
  title: string;
  body: string;
  item: {
    status?: string | null;
    claimRisk?: string | null;
    linkedReportId?: string | null;
    sequence?: number | null;
  };
}): OutboundDraft {
  return {
    provider: "linkedin",
    assetType: "editorial", // LinkedIn uses MDX outbound items, not blog series
    slug: asset.slug,
    title: asset.title,
    text: asset.body,
    link: null, // LinkedIn posts are text-only (commentary); links embedded in text if any
    meta: {
      claimRisk: asset.item.claimRisk ?? null,
      linkedReportId: asset.item.linkedReportId ?? null,
      status: asset.item.status ?? null,
      sequence: asset.item.sequence ?? null,
    },
  };
}

// ─── Unified resolution ───────────────────────────────────────────────────────

/**
 * Resolve a single outbound draft by provider + slug.
 * Returns null if the asset is not found.
 */
export function resolveOutboundDraft(
  provider: ProviderId,
  slug: string,
): OutboundDraft | null {
  switch (provider) {
    case "facebook": {
      const asset = getFacebookAssetBySlug(slug);
      return asset ? facebookAssetToDraft(asset) : null;
    }
    case "x": {
      const asset = getXAssetBySlug(slug);
      return asset ? xAssetToDraft(asset) : null;
    }
    case "linkedin": {
      const asset = getResolvedLinkedInOutboundBySlug(slug);
      return asset ? linkedInAssetToDraft(asset) : null;
    }
  }
}

/**
 * Resolve all publishable outbound drafts for a given provider.
 * Useful for populating admin consoles.
 */
export function resolveAllOutboundDrafts(provider: ProviderId): OutboundDraft[] {
  switch (provider) {
    case "facebook":
      return getBlogSeriesFacebookAssets().map(facebookAssetToDraft);
    case "x":
      return getBlogSeriesXAssets().map(xAssetToDraft);
    case "linkedin":
      return getResolvedLinkedInOutboundAssets().map(linkedInAssetToDraft);
  }
}

/**
 * Resolve all X publishable assets including non-blog types.
 * Used when a custom text post is routed via X resolver.
 */
export function resolveAllXDrafts(): OutboundDraft[] {
  return getAllXPublishableAssets().map(xAssetToDraft);
}

/**
 * Build a custom OutboundDraft without backing content.
 * Used for free-form or adapter-sourced posts (e.g. FB→X sync).
 */
export function buildCustomOutboundDraft(input: {
  provider: ProviderId;
  assetType?: OutboundAssetType;
  slug: string;
  title: string;
  text: string;
  link: string | null;
  meta?: Record<string, unknown>;
}): OutboundDraft {
  return {
    provider: input.provider,
    assetType: input.assetType ?? "custom",
    slug: input.slug,
    title: input.title,
    text: input.text,
    link: input.link,
    meta: input.meta ?? {},
  };
}
