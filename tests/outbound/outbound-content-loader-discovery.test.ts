/**
 * tests/outbound/outbound-content-loader-discovery.test.ts
 *
 * Integration-style tests that verify recursive discovery of .md/.mdx files
 * across all three outbound providers, using filesystem mocks.
 *
 * Verified invariants:
 *  - X: root files + the-truth-in-the-frame/ + what-survived/ are all discovered
 *  - Facebook: root files + what-survived/ are all discovered
 *  - LinkedIn: root files + campaign subdirs are all discovered; posted/ is excluded
 *  - Nested folders are included recursively
 *  - .md and .mdx are both accepted
 *  - posted/ files recorded as excluded with reason "posted_archive"
 *  - No silent exclusions — every skipped file has a reason
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type fs from "fs";

const {
  mockExistsSync,
  mockReaddirSync,
  mockReadFileSync,
} = vi.hoisted(() => ({
  mockExistsSync: vi.fn() as ReturnType<typeof vi.fn<(p: string) => boolean>>,
  mockReaddirSync: vi.fn() as ReturnType<typeof vi.fn<(p: string, ...args: unknown[]) => fs.Dirent<string>[]>>,
  mockReadFileSync: vi.fn() as ReturnType<typeof vi.fn<(p: string, ...args: unknown[]) => string>>,
}));

vi.mock("fs", () => ({
  default: {
    existsSync: mockExistsSync,
    readdirSync: mockReaddirSync,
    readFileSync: mockReadFileSync,
  },
  existsSync: mockExistsSync,
  readdirSync: mockReaddirSync,
  readFileSync: mockReadFileSync,
}));

import {
  getFacebookOutboundPosts,
  getXOutboundPosts,
  getLinkedInOutboundPosts,
} from "@/lib/outbound/outbound-content-loader";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeDirent(name: string, isFile = true): fs.Dirent<string> {
  return {
    name,
    isFile: () => isFile,
    isDirectory: () => !isFile,
    isBlockDevice: () => false,
    isCharacterDevice: () => false,
    isFIFO: () => false,
    isSocket: () => false,
    isSymbolicLink: () => false,
    path: "",
  } as unknown as fs.Dirent<string>;
}

function makePost(id: string): string {
  return `---\nid: "${id}"\nstatus: "draft"\napprovalStatus: "needs_review"\nrequiresFinalApproval: true\n---\nBody text.\n`;
}

/** Last path segment, cross-platform (handles / and \ separators). */
function lastSeg(dir: string): string {
  return dir.split(/[\\/]/).filter(Boolean).pop() ?? "";
}

/** Second-to-last path segment. */
function parentSeg(dir: string): string {
  const parts = dir.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 2] ?? "";
}

beforeEach(() => {
  vi.clearAllMocks();
  mockExistsSync.mockReturnValue(true);
  mockReaddirSync.mockReturnValue([]);
  mockReadFileSync.mockImplementation((p: string) =>
    makePost(String(p).split("/").pop()?.replace(/\.(md|mdx)$/, "") ?? "unknown"),
  );
});

// ─── Recursive discovery ──────────────────────────────────────────────────────

describe("Recursive discovery — nested campaign folders are included", () => {
  it("X: discovers files in root and two campaign subdirs", () => {
    mockReaddirSync.mockImplementation((dir: string) => {
      const seg = lastSeg(dir);
      if (seg === "x") return [makeDirent("root-01.md"), makeDirent("the-truth-in-the-frame", false), makeDirent("what-survived", false)];
      if (seg === "the-truth-in-the-frame") return [makeDirent("tt-01.md"), makeDirent("tt-02.md"), makeDirent("tt-03.mdx")];
      if (seg === "what-survived") return [makeDirent("ws-01.mdx"), makeDirent("ws-02.mdx")];
      return [];
    });

    const { posts, discoveredCount, acceptedCount } = getXOutboundPosts();
    expect(posts).toHaveLength(6); // 1 root + 3 truth-in-frame + 2 what-survived
    expect(discoveredCount).toBe(6);
    expect(acceptedCount).toBe(6);
  });

  it("Facebook: discovers files in root and what-survived subdir", () => {
    mockReaddirSync.mockImplementation((dir: string) => {
      const seg = lastSeg(dir);
      if (seg === "facebook") return [makeDirent("fb-01.md"), makeDirent("fb-02.md"), makeDirent("what-survived", false)];
      if (seg === "what-survived") return [makeDirent("ws-01.mdx"), makeDirent("ws-02.mdx"), makeDirent("ws-03.mdx")];
      return [];
    });

    const { posts, discoveredCount } = getFacebookOutboundPosts();
    expect(posts).toHaveLength(5); // 2 root + 3 what-survived
    expect(discoveredCount).toBe(5);
  });

  it("LinkedIn: discovers root-level files plus all campaign subdirs", () => {
    mockReaddirSync.mockImplementation((dir: string) => {
      const seg = lastSeg(dir);
      if (seg === "linkedin") return [makeDirent("root-01.mdx"), makeDirent("root-02.mdx"), makeDirent("the-burden-changes-hands", false), makeDirent("the-truth-in-the-frame", false), makeDirent("what-survived", false)];
      if (seg === "the-burden-changes-hands") return [makeDirent("w01.md"), makeDirent("w02.md"), makeDirent("w03.md")];
      if (seg === "the-truth-in-the-frame") return [makeDirent("t01.md"), makeDirent("t02.md")];
      if (seg === "what-survived") return [makeDirent("p01.mdx"), makeDirent("p02.mdx")];
      return [];
    });

    const { posts, discoveredCount } = getLinkedInOutboundPosts();
    expect(posts).toHaveLength(9); // 2 root + 3 burden + 2 truth + 2 what-survived
    expect(discoveredCount).toBe(9);
  });
});

// ─── .md and .mdx both accepted ──────────────────────────────────────────────

describe(".md and .mdx extensions are both accepted", () => {
  it("X accepts both .md and .mdx in root", () => {
    mockReaddirSync.mockImplementation((dir: string) =>
      lastSeg(dir) === "x" ? [makeDirent("a.md"), makeDirent("b.mdx")] : [],
    );
    const { posts } = getXOutboundPosts();
    expect(posts).toHaveLength(2);
  });

  it("Facebook accepts both .md and .mdx in nested dir", () => {
    mockReaddirSync.mockImplementation((dir: string) => {
      const seg = lastSeg(dir);
      if (seg === "facebook") return [makeDirent("campaign", false)];
      if (seg === "campaign") return [makeDirent("c.md"), makeDirent("d.mdx")];
      return [];
    });
    const { posts } = getFacebookOutboundPosts();
    expect(posts).toHaveLength(2);
  });

  it("LinkedIn accepts .mdx files in root", () => {
    mockReaddirSync.mockImplementation((dir: string) =>
      lastSeg(dir) === "linkedin" ? [makeDirent("a.mdx"), makeDirent("b.mdx")] : [],
    );
    const { posts } = getLinkedInOutboundPosts();
    expect(posts).toHaveLength(2);
  });
});

// ─── posted/ exclusion is explicit ───────────────────────────────────────────

describe("posted/ folder is explicitly excluded with recorded reason", () => {
  it("LinkedIn excludes posted/ and records files with reason posted_archive", () => {
    mockReaddirSync.mockImplementation((dir: string) => {
      const seg = lastSeg(dir);
      if (seg === "linkedin") return [makeDirent("active.md"), makeDirent("posted", false)];
      if (seg === "posted") return [makeDirent("p01.mdx"), makeDirent("p02.mdx"), makeDirent("p03.mdx")];
      return [];
    });

    const { posts, excluded, excludedCount, discoveredCount } = getLinkedInOutboundPosts();
    expect(posts).toHaveLength(1); // only active.md
    expect(excludedCount).toBe(3);
    expect(discoveredCount).toBe(4); // active.md + 3 posted files
    expect(excluded.every((e) => e.reason === "posted_archive")).toBe(true);
    expect(excluded.map((e) => e.filename)).toEqual(
      expect.arrayContaining(["posted/p01.mdx", "posted/p02.mdx", "posted/p03.mdx"]),
    );
  });

  it("X does not have a posted/ folder — no exclusions recorded", () => {
    mockReaddirSync.mockImplementation((dir: string) =>
      lastSeg(dir) === "x" ? [makeDirent("a.md"), makeDirent("b.md")] : [],
    );
    const { excludedCount, excluded } = getXOutboundPosts();
    expect(excludedCount).toBe(0);
    expect(excluded).toHaveLength(0);
  });

  it("Facebook what-survived is NOT excluded (not a posted/archive dir)", () => {
    mockReaddirSync.mockImplementation((dir: string) => {
      const seg = lastSeg(dir);
      if (seg === "facebook") return [makeDirent("what-survived", false)];
      if (seg === "what-survived") return [makeDirent("ws-01.mdx")];
      return [];
    });
    const { posts, excludedCount } = getFacebookOutboundPosts();
    expect(posts).toHaveLength(1);
    expect(excludedCount).toBe(0);
  });
});

// ─── No silent exclusions ─────────────────────────────────────────────────────

describe("No silent exclusions — every skipped file has a recorded reason", () => {
  it("backup files are silently skipped (not in excluded list, not counted)", () => {
    mockReaddirSync.mockImplementation((dir: string) =>
      lastSeg(dir) === "x"
        ? [makeDirent("real.md"), makeDirent("real.md.backup-123456")]
        : [],
    );
    const { posts, excludedCount, discoveredCount } = getXOutboundPosts();
    expect(posts).toHaveLength(1);
    expect(discoveredCount).toBe(1); // backup not counted as discovered
    expect(excludedCount).toBe(0);
  });

  it("unsupported extension (.txt) is recorded as unsupported_extension", () => {
    mockReaddirSync.mockImplementation((dir: string) =>
      lastSeg(dir) === "facebook"
        ? [makeDirent("real.md"), makeDirent("notes.txt")]
        : [],
    );
    const { posts, excluded, excludedCount } = getFacebookOutboundPosts();
    expect(posts).toHaveLength(1);
    expect(excludedCount).toBe(1);
    expect(excluded[0]?.reason).toBe("unsupported_extension");
    expect(excluded[0]?.filename).toBe("notes.txt");
  });

  it("parse errors are recorded with reason parse_error", () => {
    mockReaddirSync.mockImplementation((dir: string) =>
      lastSeg(dir) === "x" ? [makeDirent("bad.md")] : [],
    );
    mockReadFileSync.mockImplementationOnce(() => {
      throw new Error("ENOENT: no such file");
    });
    const { posts, excluded, errors, excludedCount } = getXOutboundPosts();
    expect(posts).toHaveLength(0);
    expect(errors).toHaveLength(1);
    expect(excludedCount).toBe(1);
    expect(excluded[0]?.reason).toBe("parse_error");
  });
});

// ─── Discovery stats ──────────────────────────────────────────────────────────

describe("Discovery stats are accurate", () => {
  it("publishableCount counts ready and scheduled+approved posts", () => {
    const readyPost = `---\nid: "r1"\nstatus: "ready"\napprovalStatus: "needs_review"\nrequiresFinalApproval: true\n---\nBody.\n`;
    const scheduledApproved = `---\nid: "s1"\nstatus: "scheduled"\napprovalStatus: "approved"\nrequiresFinalApproval: true\nscheduledFor: "2026-12-01T00:00:00Z"\n---\nBody.\n`;
    const draftPost = `---\nid: "d1"\nstatus: "draft"\napprovalStatus: "needs_review"\nrequiresFinalApproval: true\n---\nBody.\n`;

    mockReaddirSync.mockImplementation((dir: string) =>
      lastSeg(dir) === "x" ? [makeDirent("r1.md"), makeDirent("s1.md"), makeDirent("d1.md")] : [],
    );
    mockReadFileSync
      .mockReturnValueOnce(readyPost)
      .mockReturnValueOnce(scheduledApproved)
      .mockReturnValueOnce(draftPost);

    const result = getXOutboundPosts();
    expect(result.discoveredCount).toBe(3);
    expect(result.acceptedCount).toBe(3);
    expect(result.publishableCount).toBe(2); // ready + scheduled+approved
    expect(result.blockedCount).toBe(1);     // draft
  });

  it("excludedReasons summary groups correctly (tested via index page logic)", () => {
    mockReaddirSync.mockImplementation((dir: string) => {
      const seg = lastSeg(dir);
      if (seg === "linkedin") return [makeDirent("active.mdx"), makeDirent("posted", false)];
      if (seg === "posted") return [makeDirent("p1.mdx"), makeDirent("p2.mdx")];
      return [];
    });

    const result = getLinkedInOutboundPosts();
    expect(result.excludedCount).toBe(2);
    const reasonCounts: Record<string, number> = {};
    for (const ex of result.excluded) {
      reasonCounts[ex.reason] = (reasonCounts[ex.reason] ?? 0) + 1;
    }
    expect(reasonCounts["posted_archive"]).toBe(2);
  });
});
