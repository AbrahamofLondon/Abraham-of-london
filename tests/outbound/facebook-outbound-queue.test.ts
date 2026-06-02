/**
 * tests/outbound/facebook-outbound-queue.test.ts
 *
 * Verifies the Facebook outbound adapter maps OutboundPost → FacebookPublishedAsset
 * and that the Facebook publish gate correctly classifies content vs. connection issues.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type fs from "fs";

const { mockExistsSync, mockReaddirSync, mockReadFileSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn() as ReturnType<typeof vi.fn<(p: string) => boolean>>,
  mockReaddirSync: vi.fn() as ReturnType<typeof vi.fn<(p: string, ...args: unknown[]) => fs.Dirent<string>[]>>,
  mockReadFileSync: vi.fn() as ReturnType<typeof vi.fn<(p: string, ...args: unknown[]) => string>>,
}));

vi.mock("fs", () => ({
  default: { existsSync: mockExistsSync, readdirSync: mockReaddirSync, readFileSync: mockReadFileSync },
  existsSync: mockExistsSync,
  readdirSync: mockReaddirSync,
  readFileSync: mockReadFileSync,
}));

import {
  outboundPostToFacebookAsset,
  getOutboundDraftFBAssets,
  getOutboundFBPostAndAssetBySlug,
  FB_OUTBOUND_SLUG_PREFIX,
} from "@/lib/outbound/facebook-outbound-adapter";
import { canPublishFacebookPost } from "@/lib/outbound/facebook-publish-gate";
import type { FacebookConnectionStatus } from "@/lib/outbound/facebook-types";

function makeDirent(name: string, isFile = true): fs.Dirent<string> {
  return {
    name, isFile: () => isFile, isDirectory: () => !isFile,
    isBlockDevice: () => false, isCharacterDevice: () => false,
    isFIFO: () => false, isSocket: () => false, isSymbolicLink: () => false, path: "",
  } as unknown as fs.Dirent<string>;
}

function lastSeg(dir: string) { return dir.split(/[\\/]/).filter(Boolean).pop() ?? ""; }

function makeFBPost(id: string, opts: { status?: string; approvalStatus?: string; campaign?: string; text?: string } = {}): string {
  const { status = "draft", approvalStatus = "needs_review", campaign, text } = opts;
  return [
    "---", `id: "${id}"`, "provider: facebook",
    `status: "${status}"`, `approvalStatus: "${approvalStatus}"`,
    "requiresFinalApproval: true",
    campaign ? `campaign: "${campaign}"` : "",
    "---", text ?? `Post body for ${id}.`, "",
  ].filter((l) => l !== "").join("\n");
}

const CONNECTED: FacebookConnectionStatus = {
  connected: true, state: "oauth", pageId: "123", pageName: "Test Page",
  requiredPermissions: ["pages_manage_posts", "pages_read_engagement"],
  grantedPermissions: ["pages_manage_posts", "pages_read_engagement"],
  missingPermissions: [], canPublish: true, crossPostToXAssumed: false,
  lastPublishAt: null, readiness: "READY", oauthConfigured: true,
  envTokenPresent: false,
};

const DISCONNECTED: FacebookConnectionStatus = {
  ...CONNECTED, connected: false, canPublish: false, readiness: "NOT_CONNECTED",
};

beforeEach(() => {
  vi.clearAllMocks();
  mockExistsSync.mockReturnValue(true);
  mockReaddirSync.mockReturnValue([]);
  mockReadFileSync.mockReturnValue("");
});

describe("outboundPostToFacebookAsset mapping", () => {
  it("slug follows outbound-fb/<id> convention", () => {
    mockReaddirSync.mockImplementation((dir) =>
      lastSeg(dir) === "facebook" ? [makeDirent("p.md")] : [],
    );
    mockReadFileSync.mockReturnValue(makeFBPost("fb-001"));
    const { posts } = getOutboundDraftFBAssets();
    const asset = outboundPostToFacebookAsset(posts[0]!);
    expect(asset.slug).toBe(`${FB_OUTBOUND_SLUG_PREFIX}/fb-001`);
  });

  it("assetType is 'outbound'", () => {
    mockReaddirSync.mockImplementation((dir) =>
      lastSeg(dir) === "facebook" ? [makeDirent("p.md")] : [],
    );
    mockReadFileSync.mockReturnValue(makeFBPost("fb-001"));
    const { posts } = getOutboundDraftFBAssets();
    expect(outboundPostToFacebookAsset(posts[0]!).assetType).toBe("outbound");
  });

  it("campaign appears in title when present", () => {
    mockReaddirSync.mockImplementation((dir) =>
      lastSeg(dir) === "facebook" ? [makeDirent("p.md")] : [],
    );
    mockReadFileSync.mockReturnValue(makeFBPost("fb-001", { campaign: "what-survived" }));
    const { posts } = getOutboundDraftFBAssets();
    expect(outboundPostToFacebookAsset(posts[0]!).title).toContain("what-survived");
  });
});

describe("getOutboundDraftFBAssets — recursive discovery", () => {
  it("discovers files in root and nested campaign subdirs", () => {
    mockReaddirSync.mockImplementation((dir) => {
      const seg = lastSeg(dir);
      if (seg === "facebook") return [makeDirent("root.md"), makeDirent("what-survived", false)];
      if (seg === "what-survived") return [makeDirent("ws-01.mdx"), makeDirent("ws-02.mdx"), makeDirent("ws-03.mdx"), makeDirent("ws-04.mdx"), makeDirent("ws-05.mdx"), makeDirent("ws-06.mdx"), makeDirent("ws-07.mdx")];
      return [];
    });
    mockReadFileSync.mockImplementation((p) => {
      const name = String(p).split(/[\\/]/).pop()?.replace(/\.(md|mdx)$/, "") ?? "u";
      return makeFBPost(name);
    });
    const { assets, result } = getOutboundDraftFBAssets();
    expect(assets).toHaveLength(8); // 1 root + 7 what-survived
    expect(result.discoveredCount).toBe(8);
  });

  it("accepts .md and .mdx", () => {
    mockReaddirSync.mockImplementation((dir) =>
      lastSeg(dir) === "facebook" ? [makeDirent("a.md"), makeDirent("b.mdx")] : [],
    );
    mockReadFileSync.mockImplementation((p) => {
      const name = String(p).split(/[\\/]/).pop()?.replace(/\.(md|mdx)$/, "") ?? "u";
      return makeFBPost(name);
    });
    expect(getOutboundDraftFBAssets().assets).toHaveLength(2);
  });
});

describe("getOutboundFBPostAndAssetBySlug", () => {
  beforeEach(() => {
    mockReaddirSync.mockImplementation((dir) =>
      lastSeg(dir) === "facebook" ? [makeDirent("p.md")] : [],
    );
    mockReadFileSync.mockReturnValue(makeFBPost("fb-test-id"));
  });

  it("resolves valid outbound-fb slug", () => {
    const r = getOutboundFBPostAndAssetBySlug("outbound-fb/fb-test-id");
    expect(r).not.toBeNull();
    expect(r?.asset.slug).toBe("outbound-fb/fb-test-id");
  });

  it("returns null for unknown id", () => {
    expect(getOutboundFBPostAndAssetBySlug("outbound-fb/no-such-id")).toBeNull();
  });

  it("returns null for non-outbound-fb slug", () => {
    expect(getOutboundFBPostAndAssetBySlug("blog-series/foo")).toBeNull();
  });
});

describe("canPublishFacebookPost with outbound assets", () => {
  it("allows publish when connected and content is clean", () => {
    mockReaddirSync.mockImplementation((dir) =>
      lastSeg(dir) === "facebook" ? [makeDirent("p.md")] : [],
    );
    mockReadFileSync.mockReturnValue(makeFBPost("fb-001", { text: "Good post content." }));
    const { posts } = getOutboundDraftFBAssets();
    const asset = outboundPostToFacebookAsset(posts[0]!);
    expect(canPublishFacebookPost(asset, CONNECTED).allowed).toBe(true);
  });

  it("blocks publish when disconnected", () => {
    mockReaddirSync.mockImplementation((dir) =>
      lastSeg(dir) === "facebook" ? [makeDirent("p.md")] : [],
    );
    mockReadFileSync.mockReturnValue(makeFBPost("fb-001", { text: "Good post." }));
    const { posts } = getOutboundDraftFBAssets();
    const result = canPublishFacebookPost(outboundPostToFacebookAsset(posts[0]!), DISCONNECTED);
    expect(result.allowed).toBe(false);
    expect(result.blockers.some((b) => /connection/i.test(b))).toBe(true);
  });

  it("blocks publish when text contains disallowed claim", () => {
    mockReaddirSync.mockImplementation((dir) =>
      lastSeg(dir) === "facebook" ? [makeDirent("p.md")] : [],
    );
    mockReadFileSync.mockReturnValue(makeFBPost("fb-001", { text: "Investment advice here." }));
    const { posts } = getOutboundDraftFBAssets();
    const result = canPublishFacebookPost(outboundPostToFacebookAsset(posts[0]!), CONNECTED);
    expect(result.allowed).toBe(false);
    expect(result.blockers.some((b) => /investment advice/i.test(b))).toBe(true);
  });
});
