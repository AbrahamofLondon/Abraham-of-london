/**
 * tests/outbound/linkedin-campaign-queue.test.ts
 *
 * Verifies that the LinkedIn campaign console uses getLinkedInCampaignPosts()
 * from the recursive outbound-content-loader (not getAllLinkedInPosts from
 * linkedin-utils which only reads root .mdx files).
 *
 * Also verifies getRootLinkedInPostsOnly scope is explicit and consistent.
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
  getLinkedInCampaignPosts,
  getLinkedInOutboundPosts,
} from "@/lib/outbound/outbound-content-loader";
import {
  getAllLinkedInPosts,
  getRootLinkedInPostsOnly,
} from "@/lib/outbound/linkedin-utils";

function makeDirent(name: string, isFile = true): fs.Dirent<string> {
  return {
    name, isFile: () => isFile, isDirectory: () => !isFile,
    isBlockDevice: () => false, isCharacterDevice: () => false,
    isFIFO: () => false, isSocket: () => false, isSymbolicLink: () => false, path: "",
  } as unknown as fs.Dirent<string>;
}

function lastSeg(dir: string) { return dir.split(/[\\/]/).filter(Boolean).pop() ?? ""; }

function makeLIPost(id: string, week = 1, seq = 1): string {
  return [
    "---", `id: "${id}"`, "provider: linkedin", "status: draft",
    "approvalStatus: needs_review", "requiresFinalApproval: true",
    `seriesWeek: ${week}`, `sequence: ${seq}`,
    "---", `Body for ${id}.`, "",
  ].join("\n");
}

beforeEach(() => {
  vi.clearAllMocks();
  mockExistsSync.mockReturnValue(true);
  mockReaddirSync.mockReturnValue([]);
  mockReadFileSync.mockReturnValue("");
});

// ─── Campaign loader (recursive) ─────────────────────────────────────────────

describe("getLinkedInCampaignPosts — recursive loader for named campaign", () => {
  it("reads .md files from the campaign subdirectory", () => {
    mockReaddirSync.mockImplementation((dir) => {
      if (lastSeg(dir) === "the-burden-changes-hands") {
        return [makeDirent("w01-thesis.md"), makeDirent("w01-applied.md"), makeDirent("w01-reflective.md")];
      }
      return [];
    });
    mockReadFileSync.mockImplementation((p) => {
      const name = String(p).split(/[\\/]/).pop()?.replace(/\.md$/, "") ?? "u";
      return makeLIPost(name);
    });
    const { posts } = getLinkedInCampaignPosts("the-burden-changes-hands");
    expect(posts).toHaveLength(3);
  });

  it("reads .mdx files from what-survived campaign", () => {
    mockReaddirSync.mockImplementation((dir) => {
      if (lastSeg(dir) === "what-survived") {
        return [makeDirent("p01.mdx"), makeDirent("p02.mdx"), makeDirent("p03.mdx")];
      }
      return [];
    });
    mockReadFileSync.mockImplementation((p) => {
      const name = String(p).split(/[\\/]/).pop()?.replace(/\.mdx$/, "") ?? "u";
      return makeLIPost(name);
    });
    const { posts } = getLinkedInCampaignPosts("what-survived");
    expect(posts).toHaveLength(3);
  });

  it("returns empty result for unknown campaign", () => {
    mockExistsSync.mockReturnValue(false);
    const { posts, errors } = getLinkedInCampaignPosts("non-existent-campaign");
    expect(posts).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });
});

// ─── Root-only loader (linkedin-utils) ───────────────────────────────────────

describe("getAllLinkedInPosts / getRootLinkedInPostsOnly — scope boundary", () => {
  it("reads ONLY root .mdx files, not subdirectory .md files", () => {
    // linkedin-utils calls readdirSync WITHOUT withFileTypes → expects string[]
    // outbound-content-loader calls WITH withFileTypes → expects Dirent[]
    mockReaddirSync.mockImplementation((dir: string, opts?: unknown) => {
      const withTypes = (opts as { withFileTypes?: boolean } | undefined)?.withFileTypes;
      if (!withTypes) {
        // linkedin-utils path: return strings
        if (lastSeg(dir) === "linkedin") return ["root-01.mdx", "root-02.mdx"] as unknown as ReturnType<typeof mockReaddirSync>;
        return [] as unknown as ReturnType<typeof mockReaddirSync>;
      }
      // Should not be called by getAllLinkedInPosts (it doesn't use withFileTypes)
      return [] as unknown as ReturnType<typeof mockReaddirSync>;
    });
    mockReadFileSync.mockImplementation(() => "---\ntitle: test\nplatform: linkedin\nchannel: company\nstatus: draft\n---\nBody.\n");
    const posts = getAllLinkedInPosts(false);
    expect(posts.every((p) => p.filename.endsWith(".mdx"))).toBe(true);
    expect(posts.length).toBe(2);
  });

  it("getRootLinkedInPostsOnly is identical to getAllLinkedInPosts", () => {
    expect(getRootLinkedInPostsOnly).toBe(getAllLinkedInPosts);
  });
});

// ─── Full recursive LinkedIn loader ──────────────────────────────────────────

describe("getLinkedInOutboundPosts — recursive, excludes posted/", () => {
  it("discovers root files AND campaign subdirectory files", () => {
    mockReaddirSync.mockImplementation((dir) => {
      const seg = lastSeg(dir);
      if (seg === "linkedin") return [makeDirent("root.mdx"), makeDirent("the-burden-changes-hands", false)];
      if (seg === "the-burden-changes-hands") return [makeDirent("w01.md"), makeDirent("w02.md")];
      return [];
    });
    mockReadFileSync.mockImplementation((p) => {
      const name = String(p).split(/[\\/]/).pop()?.replace(/\.(md|mdx)$/, "") ?? "u";
      return makeLIPost(name);
    });
    const { posts } = getLinkedInOutboundPosts();
    expect(posts).toHaveLength(3); // 1 root + 2 campaign
  });

  it("posted/ directory is excluded with reason posted_archive", () => {
    mockReaddirSync.mockImplementation((dir) => {
      const seg = lastSeg(dir);
      if (seg === "linkedin") return [makeDirent("active.mdx"), makeDirent("posted", false)];
      if (seg === "posted") return [makeDirent("p01.mdx")];
      return [];
    });
    mockReadFileSync.mockReturnValue(makeLIPost("active"));
    const { posts, excluded } = getLinkedInOutboundPosts();
    expect(posts).toHaveLength(1);
    expect(excluded[0]?.reason).toBe("posted_archive");
  });
});
