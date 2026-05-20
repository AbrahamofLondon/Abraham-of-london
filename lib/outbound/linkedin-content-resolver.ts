import type { LinkedInOutboundItem } from "./linkedin-outbound-governance";
import { getAllLinkedInPosts, getLinkedInPost } from "./linkedin-utils";
import type { LinkedInPost } from "./linkedin-types";

export type ResolvedLinkedInOutbound = {
  slug: string;
  filename: string;
  title: string;
  body: string;
  item: LinkedInOutboundItem;
  charCount: number;
  isPosted: boolean;
};

function slugFromFilename(filename: string): string {
  return filename.replace(/\.mdx?$/i, "");
}

function stringField(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function booleanField(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function numberField(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function postToLinkedInOutbound(post: LinkedInPost): ResolvedLinkedInOutbound {
  const fm = post.frontmatter as Record<string, unknown>;
  const filename = post.filename;
  const slug = slugFromFilename(filename);
  const title = stringField(fm.title) ?? filename;

  return {
    slug,
    filename,
    title,
    body: post.body,
    charCount: post.charCount,
    isPosted: post.isPosted || fm.status === "posted",
    item: {
      title,
      sequence: numberField(fm.sequence),
      channel: stringField(fm.channel),
      contentType: stringField(fm.contentType),
      status: stringField(fm.status),
      draft: booleanField(fm.draft),
      published: booleanField(fm.published),
      date: stringField(fm.date),
      category: stringField(fm.category),
      tier: stringField(fm.tier),
      campaign: stringField(fm.campaign),
      linkedReportId: stringField(fm.linkedReportId),
      publicationGate: stringField(fm.publicationGate),
      postedAt: stringField(fm.postedAt),
      linkedinUrl: stringField(fm.linkedinUrl) ?? stringField(fm.linkedinPostUrl),
      claimRisk: stringField(fm.claimRisk),
      requiresLifecycleCheck: booleanField(fm.requiresLifecycleCheck),
      release: booleanField(fm.release),
      manualApprovalNote: stringField(fm.manualApprovalNote),
      body: post.body,
      filename,
    },
  };
}

export function getResolvedLinkedInOutboundAssets(includePosted = true): ResolvedLinkedInOutbound[] {
  return getAllLinkedInPosts(includePosted).map(postToLinkedInOutbound);
}

export function getResolvedLinkedInOutboundBySlug(slugOrFilename: string): ResolvedLinkedInOutbound | null {
  const normalized = slugOrFilename.replace(/^\/+|\/+$/g, "");
  const filename = normalized.endsWith(".mdx") ? normalized : `${normalized}.mdx`;
  const post = getLinkedInPost(filename);
  if (post) return postToLinkedInOutbound(post);

  return getResolvedLinkedInOutboundAssets(true).find((asset) =>
    asset.slug === normalized || asset.filename === normalized,
  ) ?? null;
}
