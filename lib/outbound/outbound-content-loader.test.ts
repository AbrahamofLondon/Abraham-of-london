/**
 * lib/outbound/outbound-content-loader.test.ts
 *
 * Unit tests for the outbound content loader.
 * Uses vi.hoisted + vi.mock to control fs so tests run without disk access.
 *
 * Test groups:
 *   1. Frontmatter parser — field types, defaults, body extraction
 *   2. Post defaults — requiresFinalApproval, status, approvalStatus
 *   3. Idempotency key — format, uniqueness
 *   4. getOutboundPostsDue — approval + status guard (core governance invariant)
 *   5. getOutboundPostsForReview — review-eligible filter
 *   6. Provider routing — correct provider on every post
 *   7. Error handling — missing dir, unreadable file, bad frontmatter
 *   8. Sort order — scheduledFor ascending, unscheduled last
 *   9. File filters — .backup- skipped, non-md skipped
 *  10. Thread fields — threadIndex, threadId, thread bool
 *  11. X char count — stored as number or null
 *  12. getOutboundPostById / getOutboundPostBySlug — lookup helpers
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type fs from "fs";

// ─── Hoist mock functions so they're available inside vi.mock() factory ───────

const {
  mockExistsSync,
  mockReaddirSync,
  mockReadFileSync,
} = vi.hoisted(() => ({
  // Cast to loose mock types to avoid Dirent<T> / overload-intersection issues in Vitest v4
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

// Import AFTER vi.mock is hoisted
import {
  getFacebookOutboundPosts,
  getXOutboundPosts,
  getOutboundPostsByProvider,
  getOutboundPostById,
  getOutboundPostBySlug,
  getOutboundPostsDue,
  getOutboundPostsForReview,
} from "./outbound-content-loader";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Minimal fs.Dirent mock — only properties the loader actually reads. */
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
  } as unknown as fs.Dirent;
}

type FrontmatterOverrides = Record<
  string,
  string | boolean | number | null | string[]
>;

/**
 * Build a minimal valid outbound post file string.
 * Generates YAML frontmatter followed by a body.
 */
function makeFileContent(
  fm: FrontmatterOverrides,
  body = "Post body text here.",
): string {
  const lines: string[] = ["---"];
  for (const [key, val] of Object.entries(fm)) {
    if (Array.isArray(val)) {
      lines.push(`${key}:`);
      for (const item of val) lines.push(`  - ${item}`);
    } else if (val === null) {
      lines.push(`${key}: null`);
    } else if (typeof val === "string") {
      lines.push(`${key}: "${val}"`);
    } else {
      lines.push(`${key}: ${val}`);
    }
  }
  lines.push("---", body);
  return lines.join("\n") + "\n";
}

/** Base valid facebook post frontmatter. */
const BASE_FB: FrontmatterOverrides = {
  id: "test-fb-001",
  provider: "facebook",
  status: "draft",
  approvalStatus: "needs_review",
  requiresFinalApproval: true,
};

/** Base valid x post frontmatter. */
const BASE_X: FrontmatterOverrides = {
  id: "test-x-001",
  provider: "x",
  status: "draft",
  approvalStatus: "needs_review",
  requiresFinalApproval: true,
  xCharCount: 120,
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  // Default: directories exist but are empty
  mockExistsSync.mockReturnValue(true);
  mockReaddirSync.mockReturnValue([]);
  mockReadFileSync.mockReturnValue("");
});

// ─── Helper: set up one file in a given "provider" dir ───────────────────────

function setupOneFile(
  provider: "facebook" | "x",
  filename: string,
  content: string,
): void {
  mockReaddirSync.mockImplementation((dir: string) => {
    const isTarget =
      provider === "facebook"
        ? dir.includes("facebook")
        : dir.includes(`outbound`) && !dir.includes("facebook");
    return isTarget ? [makeDirent(filename)] : [];
  });
  mockReadFileSync.mockReturnValue(content);
}

// ─── Group 1: Frontmatter parser ─────────────────────────────────────────────

describe("Frontmatter parser", () => {
  it("parses string id correctly", () => {
    setupOneFile("facebook", "test.md", makeFileContent(BASE_FB));
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.id).toBe("test-fb-001");
  });

  it("parses status: ready correctly", () => {
    const content = makeFileContent({ ...BASE_FB, status: "ready" });
    setupOneFile("facebook", "test.md", content);
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.status).toBe("ready");
  });

  it("parses approvalStatus: approved correctly", () => {
    const content = makeFileContent({
      ...BASE_FB,
      approvalStatus: "approved",
    });
    setupOneFile("facebook", "test.md", content);
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.approvalStatus).toBe("approved");
  });

  it("parses boolean true for requiresFinalApproval", () => {
    const content = makeFileContent({
      ...BASE_FB,
      requiresFinalApproval: true,
    });
    setupOneFile("facebook", "test.md", content);
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.requiresFinalApproval).toBe(true);
  });

  it("parses boolean false for requiresFinalApproval", () => {
    const content = makeFileContent({
      ...BASE_FB,
      requiresFinalApproval: false,
    });
    setupOneFile("facebook", "test.md", content);
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.requiresFinalApproval).toBe(false);
  });

  it("parses numeric xCharCount correctly", () => {
    const content = makeFileContent({ ...BASE_X, xCharCount: 245 });
    setupOneFile("x", "test.md", content);
    const { posts } = getXOutboundPosts();
    expect(posts[0]?.xCharCount).toBe(245);
  });

  it("parses theme array correctly", () => {
    const content = makeFileContent({
      ...BASE_FB,
      theme: ["memory", "writing", "cognition"],
    });
    setupOneFile("facebook", "test.md", content);
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.theme).toEqual(["memory", "writing", "cognition"]);
  });

  it("parses scheduledFor as string (not Date)", () => {
    const content = makeFileContent({
      ...BASE_FB,
      scheduledFor: "2026-06-02T09:00:00Z",
    });
    setupOneFile("facebook", "test.md", content);
    const { posts } = getFacebookOutboundPosts();
    expect(typeof posts[0]?.scheduledFor).toBe("string");
    expect(posts[0]?.scheduledFor).toBe("2026-06-02T09:00:00Z");
  });

  it("extracts body text after frontmatter delimiter", () => {
    const body = "This is the post body.\n\nSecond paragraph.";
    const content = makeFileContent(BASE_FB, body);
    setupOneFile("facebook", "test.md", content);
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.text).toBe(body.trim());
  });

  it("falls back to filename (without extension) when id is omitted", () => {
    const fmWithoutId = { ...BASE_FB };
    delete (fmWithoutId as Record<string, unknown>).id;
    const content = makeFileContent(fmWithoutId as FrontmatterOverrides);
    setupOneFile("facebook", "my-post-slug.md", content);
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.id).toBe("my-post-slug");
    expect(posts[0]?.slug).toBe("my-post-slug");
  });

  it("derives slug from filename regardless of id field", () => {
    const content = makeFileContent({ ...BASE_FB, id: "explicit-id" });
    setupOneFile("facebook", "my-filename.md", content);
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.slug).toBe("my-filename");
    expect(posts[0]?.id).toBe("explicit-id");
  });

  it("parses null link as null", () => {
    const content = makeFileContent({ ...BASE_FB, link: null });
    setupOneFile("facebook", "test.md", content);
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.link).toBeNull();
  });
});

// ─── Group 2: Post defaults ───────────────────────────────────────────────────

describe("Post defaults", () => {
  it("defaults requiresFinalApproval to true when omitted", () => {
    const fm = { ...BASE_FB };
    delete (fm as Record<string, unknown>).requiresFinalApproval;
    const content = makeFileContent(fm as FrontmatterOverrides);
    setupOneFile("facebook", "test.md", content);
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.requiresFinalApproval).toBe(true);
  });

  it("defaults status to 'draft' for unrecognised status values", () => {
    const content = makeFileContent({
      ...BASE_FB,
      status: "pending_review", // not a valid status
    });
    setupOneFile("facebook", "test.md", content);
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.status).toBe("draft");
  });

  it("defaults approvalStatus to 'needs_review' for unrecognised values", () => {
    const content = makeFileContent({
      ...BASE_FB,
      approvalStatus: "pending", // not valid
    });
    setupOneFile("facebook", "test.md", content);
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.approvalStatus).toBe("needs_review");
  });

  it("defaults thread to false when omitted", () => {
    const content = makeFileContent(BASE_FB);
    setupOneFile("facebook", "test.md", content);
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.thread).toBe(false);
  });

  it("defaults theme to empty array when omitted", () => {
    const content = makeFileContent(BASE_FB);
    setupOneFile("facebook", "test.md", content);
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.theme).toEqual([]);
  });

  it("defaults xCharCount to null when omitted", () => {
    const content = makeFileContent(BASE_FB);
    setupOneFile("facebook", "test.md", content);
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.xCharCount).toBeNull();
  });

  it("sets provider to 'facebook' for facebook directory", () => {
    const content = makeFileContent(BASE_FB);
    setupOneFile("facebook", "test.md", content);
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.provider).toBe("facebook");
  });

  it("sets provider to 'x' for x directory", () => {
    const content = makeFileContent(BASE_X);
    setupOneFile("x", "test.md", content);
    const { posts } = getXOutboundPosts();
    expect(posts[0]?.provider).toBe("x");
  });
});

// ─── Group 3: Idempotency key ─────────────────────────────────────────────────

describe("Idempotency key", () => {
  it("formats key as id:provider:scheduledFor when scheduledFor is set", () => {
    const content = makeFileContent({
      ...BASE_FB,
      scheduledFor: "2026-06-10T09:00:00Z",
    });
    setupOneFile("facebook", "test.md", content);
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.idempotencyKey).toBe(
      "test-fb-001:facebook:2026-06-10T09:00:00Z",
    );
  });

  it("uses 'unscheduled' suffix when scheduledFor is null", () => {
    const content = makeFileContent({ ...BASE_FB, scheduledFor: null });
    setupOneFile("facebook", "test.md", content);
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.idempotencyKey).toBe("test-fb-001:facebook:unscheduled");
  });

  it("produces different keys for different scheduledFor values", () => {
    mockReaddirSync.mockImplementation(() => [
      makeDirent("a.md"),
      makeDirent("b.md"),
    ]);
    mockReadFileSync
      .mockReturnValueOnce(
        makeFileContent({
          ...BASE_FB,
          id: "same-id",
          scheduledFor: "2026-06-01T09:00:00Z",
        }),
      )
      .mockReturnValueOnce(
        makeFileContent({
          ...BASE_FB,
          id: "same-id",
          scheduledFor: "2026-06-02T09:00:00Z",
        }),
      );
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.idempotencyKey).not.toBe(posts[1]?.idempotencyKey);
  });

  it("produces identical keys for same id+provider+scheduledFor", () => {
    const fm = {
      ...BASE_FB,
      id: "dupe-id",
      scheduledFor: "2026-06-15T12:00:00Z",
    };
    const key1 = `${fm.id}:facebook:${fm.scheduledFor}`;
    const content = makeFileContent(fm);
    setupOneFile("facebook", "test.md", content);
    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.idempotencyKey).toBe(key1);
  });
});

// ─── Group 4: getOutboundPostsDue (core governance) ──────────────────────────

describe("getOutboundPostsDue — schedule + approval guard", () => {
  const PAST_ISO = "2025-01-01T00:00:00Z";
  const AS_OF = "2026-12-31T23:59:59Z"; // anything before this counts as "past"

  function setupXPost(overrides: FrontmatterOverrides): void {
    const content = makeFileContent({ ...BASE_X, ...overrides });
    setupOneFile("x", "test.md", content);
  }

  it("returns post when status=scheduled, approvalStatus=approved, scheduledFor in past", () => {
    setupXPost({
      status: "scheduled",
      approvalStatus: "approved",
      scheduledFor: PAST_ISO,
    });
    const due = getOutboundPostsDue("x", AS_OF);
    expect(due).toHaveLength(1);
  });

  it("excludes post when approvalStatus=needs_review (approval required)", () => {
    setupXPost({
      status: "scheduled",
      approvalStatus: "needs_review",
      scheduledFor: PAST_ISO,
    });
    const due = getOutboundPostsDue("x", AS_OF);
    expect(due).toHaveLength(0);
  });

  it("excludes post when approvalStatus=rejected", () => {
    setupXPost({
      status: "scheduled",
      approvalStatus: "rejected",
      scheduledFor: PAST_ISO,
    });
    const due = getOutboundPostsDue("x", AS_OF);
    expect(due).toHaveLength(0);
  });

  it("excludes post when status=draft even if approved", () => {
    setupXPost({
      status: "draft",
      approvalStatus: "approved",
      scheduledFor: PAST_ISO,
    });
    const due = getOutboundPostsDue("x", AS_OF);
    expect(due).toHaveLength(0);
  });

  it("excludes post when status=ready even if approved", () => {
    setupXPost({
      status: "ready",
      approvalStatus: "approved",
      scheduledFor: PAST_ISO,
    });
    const due = getOutboundPostsDue("x", AS_OF);
    expect(due).toHaveLength(0);
  });

  it("excludes post when status=published", () => {
    setupXPost({
      status: "published",
      approvalStatus: "approved",
      scheduledFor: PAST_ISO,
    });
    const due = getOutboundPostsDue("x", AS_OF);
    expect(due).toHaveLength(0);
  });

  it("excludes post when status=skipped", () => {
    setupXPost({
      status: "skipped",
      approvalStatus: "approved",
      scheduledFor: PAST_ISO,
    });
    const due = getOutboundPostsDue("x", AS_OF);
    expect(due).toHaveLength(0);
  });

  it("excludes post when scheduledFor is in the future relative to asOf", () => {
    setupXPost({
      status: "scheduled",
      approvalStatus: "approved",
      scheduledFor: "2099-12-31T00:00:00Z",
    });
    const due = getOutboundPostsDue("x", AS_OF);
    expect(due).toHaveLength(0);
  });

  it("excludes post when scheduledFor is null", () => {
    setupXPost({
      status: "scheduled",
      approvalStatus: "approved",
      scheduledFor: null,
    });
    const due = getOutboundPostsDue("x", AS_OF);
    expect(due).toHaveLength(0);
  });

  it("returns only posts that satisfy all three conditions", () => {
    // Two files: one due, one not (wrong status)
    mockReaddirSync.mockImplementation(() => [
      makeDirent("due.md"),
      makeDirent("notdue.md"),
    ]);
    mockReadFileSync
      .mockReturnValueOnce(
        makeFileContent({
          ...BASE_X,
          id: "due-post",
          status: "scheduled",
          approvalStatus: "approved",
          scheduledFor: PAST_ISO,
        }),
      )
      .mockReturnValueOnce(
        makeFileContent({
          ...BASE_X,
          id: "not-due-post",
          status: "draft",
          approvalStatus: "approved",
          scheduledFor: PAST_ISO,
        }),
      );
    const due = getOutboundPostsDue("x", AS_OF);
    expect(due).toHaveLength(1);
    expect(due[0]?.id).toBe("due-post");
  });
});

// ─── Group 5: getOutboundPostsForReview ──────────────────────────────────────

describe("getOutboundPostsForReview", () => {
  function setupXPost(overrides: FrontmatterOverrides): void {
    const content = makeFileContent({ ...BASE_X, ...overrides });
    setupOneFile("x", "test.md", content);
  }

  it("includes status=ready posts", () => {
    setupXPost({ status: "ready" });
    expect(getOutboundPostsForReview("x")).toHaveLength(1);
  });

  it("includes status=scheduled posts", () => {
    setupXPost({
      status: "scheduled",
      approvalStatus: "approved",
      scheduledFor: "2026-12-01T00:00:00Z",
    });
    expect(getOutboundPostsForReview("x")).toHaveLength(1);
  });

  it("includes status=draft + approvalStatus=needs_review posts", () => {
    setupXPost({ status: "draft", approvalStatus: "needs_review" });
    expect(getOutboundPostsForReview("x")).toHaveLength(1);
  });

  it("excludes status=published posts", () => {
    setupXPost({ status: "published", approvalStatus: "approved" });
    expect(getOutboundPostsForReview("x")).toHaveLength(0);
  });

  it("excludes status=skipped posts", () => {
    setupXPost({ status: "skipped" });
    expect(getOutboundPostsForReview("x")).toHaveLength(0);
  });

  it("excludes status=rejected posts", () => {
    setupXPost({ status: "rejected" });
    expect(getOutboundPostsForReview("x")).toHaveLength(0);
  });
});

// ─── Group 6: Provider routing ────────────────────────────────────────────────

describe("Provider routing", () => {
  it("getFacebookOutboundPosts always returns posts with provider=facebook", () => {
    mockReaddirSync.mockImplementation((dir: string) =>
      dir.includes("facebook") ? [makeDirent("a.md"), makeDirent("b.md")] : [],
    );
    mockReadFileSync.mockReturnValue(makeFileContent(BASE_FB));
    const { posts } = getFacebookOutboundPosts();
    for (const p of posts) {
      expect(p.provider).toBe("facebook");
    }
  });

  it("getXOutboundPosts always returns posts with provider=x", () => {
    mockReaddirSync.mockImplementation((dir: string) =>
      !dir.includes("facebook") ? [makeDirent("a.md"), makeDirent("b.md")] : [],
    );
    mockReadFileSync.mockReturnValue(makeFileContent(BASE_X));
    const { posts } = getXOutboundPosts();
    for (const p of posts) {
      expect(p.provider).toBe("x");
    }
  });

  it("getOutboundPostsByProvider('facebook') delegates to facebook dir", () => {
    mockReaddirSync.mockImplementation((dir: string) =>
      dir.includes("facebook") ? [makeDirent("test.md")] : [],
    );
    mockReadFileSync.mockReturnValue(makeFileContent(BASE_FB));
    const { posts } = getOutboundPostsByProvider("facebook");
    expect(posts).toHaveLength(1);
    expect(posts[0]?.provider).toBe("facebook");
  });

  it("getOutboundPostsByProvider('x') delegates to x dir", () => {
    mockReaddirSync.mockImplementation((dir: string) =>
      !dir.includes("facebook") ? [makeDirent("test.md")] : [],
    );
    mockReadFileSync.mockReturnValue(makeFileContent(BASE_X));
    const { posts } = getOutboundPostsByProvider("x");
    expect(posts).toHaveLength(1);
    expect(posts[0]?.provider).toBe("x");
  });
});

// ─── Group 7: Error handling ──────────────────────────────────────────────────

describe("Error handling", () => {
  it("returns empty result when directory does not exist", () => {
    mockExistsSync.mockReturnValue(false);
    const result = getFacebookOutboundPosts();
    expect(result.posts).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it("logs error and skips unreadable file, continuing with others", () => {
    mockReaddirSync.mockImplementation((dir: string) =>
      dir.includes("facebook")
        ? [makeDirent("bad.md"), makeDirent("good.md")]
        : [],
    );
    mockReadFileSync
      .mockImplementationOnce(() => {
        throw new Error("Permission denied");
      })
      .mockReturnValueOnce(makeFileContent(BASE_FB));

    const { posts, errors } = getFacebookOutboundPosts();
    expect(errors).toHaveLength(1);
    expect(errors[0]?.filename).toBe("bad.md");
    expect(posts).toHaveLength(1);
    expect(posts[0]?.slug).toBe("good");
  });

  it("includes all valid posts even after an error in one file", () => {
    mockReaddirSync.mockImplementation((dir: string) =>
      dir.includes("facebook")
        ? [makeDirent("err.md"), makeDirent("p1.md"), makeDirent("p2.md")]
        : [],
    );
    mockReadFileSync
      .mockImplementationOnce(() => {
        throw new Error("ENOENT");
      })
      .mockReturnValueOnce(makeFileContent({ ...BASE_FB, id: "post-1" }))
      .mockReturnValueOnce(makeFileContent({ ...BASE_FB, id: "post-2" }));

    const { posts } = getFacebookOutboundPosts();
    expect(posts).toHaveLength(2);
  });
});

// ─── Group 8: Sort order ──────────────────────────────────────────────────────

describe("Sort order", () => {
  it("sorts posts by scheduledFor ascending", () => {
    mockReaddirSync.mockImplementation((dir: string) =>
      dir.includes("facebook")
        ? [makeDirent("b.md"), makeDirent("a.md"), makeDirent("c.md")]
        : [],
    );
    mockReadFileSync
      .mockReturnValueOnce(
        makeFileContent({
          ...BASE_FB,
          id: "post-b",
          scheduledFor: "2026-06-15T00:00:00Z",
        }),
      )
      .mockReturnValueOnce(
        makeFileContent({
          ...BASE_FB,
          id: "post-a",
          scheduledFor: "2026-06-01T00:00:00Z",
        }),
      )
      .mockReturnValueOnce(
        makeFileContent({
          ...BASE_FB,
          id: "post-c",
          scheduledFor: "2026-06-30T00:00:00Z",
        }),
      );

    const { posts } = getFacebookOutboundPosts();
    expect(posts.map((p) => p.id)).toEqual(["post-a", "post-b", "post-c"]);
  });

  it("puts unscheduled posts last, sorted alphabetically by slug", () => {
    mockReaddirSync.mockImplementation((dir: string) =>
      dir.includes("facebook")
        ? [makeDirent("b.md"), makeDirent("a.md")]
        : [],
    );
    mockReadFileSync
      .mockReturnValueOnce(
        makeFileContent({ ...BASE_FB, id: "post-b", scheduledFor: null }),
      )
      .mockReturnValueOnce(
        makeFileContent({ ...BASE_FB, id: "post-a", scheduledFor: null }),
      );

    const { posts } = getFacebookOutboundPosts();
    // "a.md" slug < "b.md" slug
    expect(posts[0]?.slug).toBe("a");
    expect(posts[1]?.slug).toBe("b");
  });

  it("puts scheduled posts before unscheduled posts", () => {
    mockReaddirSync.mockImplementation((dir: string) =>
      dir.includes("facebook")
        ? [makeDirent("unscheduled.md"), makeDirent("scheduled.md")]
        : [],
    );
    mockReadFileSync
      .mockReturnValueOnce(
        makeFileContent({ ...BASE_FB, id: "no-sched", scheduledFor: null }),
      )
      .mockReturnValueOnce(
        makeFileContent({
          ...BASE_FB,
          id: "with-sched",
          scheduledFor: "2026-06-01T09:00:00Z",
        }),
      );

    const { posts } = getFacebookOutboundPosts();
    expect(posts[0]?.id).toBe("with-sched");
    expect(posts[1]?.id).toBe("no-sched");
  });
});

// ─── Group 9: File filters ────────────────────────────────────────────────────

describe("File filters", () => {
  it("skips files with .backup- in the name", () => {
    mockReaddirSync.mockImplementation((dir: string) =>
      dir.includes("facebook")
        ? [
            makeDirent("post.backup-2025-01.md"),
            makeDirent("real-post.md"),
          ]
        : [],
    );
    mockReadFileSync.mockReturnValue(makeFileContent(BASE_FB));
    const { posts } = getFacebookOutboundPosts();
    expect(posts).toHaveLength(1);
    expect(posts[0]?.slug).toBe("real-post");
  });

  it("skips non-markdown files (.txt, .json, .ts)", () => {
    mockReaddirSync.mockImplementation((dir: string) =>
      dir.includes("facebook")
        ? [
            makeDirent("post.txt"),
            makeDirent("meta.json"),
            makeDirent("util.ts"),
            makeDirent("real.md"),
          ]
        : [],
    );
    mockReadFileSync.mockReturnValue(makeFileContent(BASE_FB));
    const { posts } = getFacebookOutboundPosts();
    expect(posts).toHaveLength(1);
  });

  it("accepts both .md and .mdx files", () => {
    mockReaddirSync.mockImplementation((dir: string) =>
      dir.includes("facebook")
        ? [makeDirent("a.md"), makeDirent("b.mdx")]
        : [],
    );
    mockReadFileSync.mockReturnValue(makeFileContent(BASE_FB));
    const { posts } = getFacebookOutboundPosts();
    expect(posts).toHaveLength(2);
  });

  it("skips directory entries (subdirectories)", () => {
    mockReaddirSync.mockImplementation((dir: string) =>
      dir.includes("facebook")
        ? [makeDirent("subdir", false), makeDirent("real.md", true)]
        : [],
    );
    mockReadFileSync.mockReturnValue(makeFileContent(BASE_FB));
    const { posts } = getFacebookOutboundPosts();
    expect(posts).toHaveLength(1);
  });
});

// ─── Group 10: Thread fields ──────────────────────────────────────────────────

describe("Thread fields (X posts)", () => {
  it("parses thread: true correctly", () => {
    const content = makeFileContent({
      ...BASE_X,
      thread: true,
      threadIndex: 1,
      threadId: "my-thread-01",
    });
    setupOneFile("x", "thread-01a.md", content);
    const { posts } = getXOutboundPosts();
    expect(posts[0]?.thread).toBe(true);
  });

  it("parses threadIndex as number", () => {
    const content = makeFileContent({
      ...BASE_X,
      thread: true,
      threadIndex: 3,
      threadId: "my-thread-01",
    });
    setupOneFile("x", "thread.md", content);
    const { posts } = getXOutboundPosts();
    expect(posts[0]?.threadIndex).toBe(3);
  });

  it("parses threadId as string", () => {
    const content = makeFileContent({
      ...BASE_X,
      thread: true,
      threadIndex: 1,
      threadId: "writing-changed-humanity-thread-01",
    });
    setupOneFile("x", "thread.md", content);
    const { posts } = getXOutboundPosts();
    expect(posts[0]?.threadId).toBe("writing-changed-humanity-thread-01");
  });

  it("defaults threadIndex to null for non-thread posts", () => {
    const content = makeFileContent({ ...BASE_X, thread: false });
    setupOneFile("x", "single.md", content);
    const { posts } = getXOutboundPosts();
    expect(posts[0]?.threadIndex).toBeNull();
  });

  it("defaults threadId to null for non-thread posts", () => {
    const content = makeFileContent({ ...BASE_X, thread: false });
    setupOneFile("x", "single.md", content);
    const { posts } = getXOutboundPosts();
    expect(posts[0]?.threadId).toBeNull();
  });
});

// ─── Group 11: X char count ───────────────────────────────────────────────────

describe("X char count field", () => {
  it("parses xCharCount as number", () => {
    const content = makeFileContent({ ...BASE_X, xCharCount: 260 });
    setupOneFile("x", "test.md", content);
    const { posts } = getXOutboundPosts();
    expect(posts[0]?.xCharCount).toBe(260);
  });

  it("stores null when xCharCount is null", () => {
    const content = makeFileContent({ ...BASE_X, xCharCount: null });
    setupOneFile("x", "test.md", content);
    const { posts } = getXOutboundPosts();
    expect(posts[0]?.xCharCount).toBeNull();
  });

  it("stores null when xCharCount is omitted", () => {
    const fm = { ...BASE_X };
    delete (fm as Record<string, unknown>).xCharCount;
    const content = makeFileContent(fm as FrontmatterOverrides);
    setupOneFile("x", "test.md", content);
    const { posts } = getXOutboundPosts();
    expect(posts[0]?.xCharCount).toBeNull();
  });
});

// ─── Group 12: Lookup helpers ─────────────────────────────────────────────────

describe("Lookup helpers", () => {
  beforeEach(() => {
    // FB dir has one post
    mockReaddirSync.mockImplementation((dir: string) => {
      if (dir.includes("facebook")) return [makeDirent("fb-post.md")];
      // x dir pattern: not facebook
      return [makeDirent("x-post.md")];
    });
    mockReadFileSync.mockImplementation((filePath: string) => {
      if (filePath.includes("fb-post"))
        return makeFileContent({
          ...BASE_FB,
          id: "fb-lookup-id",
        });
      return makeFileContent({
        ...BASE_X,
        id: "x-lookup-id",
      });
    });
  });

  it("getOutboundPostById finds by facebook id", () => {
    const post = getOutboundPostById("fb-lookup-id");
    expect(post).not.toBeNull();
    expect(post?.provider).toBe("facebook");
  });

  it("getOutboundPostById finds by x id", () => {
    const post = getOutboundPostById("x-lookup-id");
    expect(post).not.toBeNull();
    expect(post?.provider).toBe("x");
  });

  it("getOutboundPostById returns null for unknown id", () => {
    const post = getOutboundPostById("does-not-exist");
    expect(post).toBeNull();
  });

  it("getOutboundPostBySlug finds by slug", () => {
    const post = getOutboundPostBySlug("facebook", "fb-post");
    expect(post).not.toBeNull();
    expect(post?.slug).toBe("fb-post");
  });

  it("getOutboundPostBySlug also matches by id", () => {
    const post = getOutboundPostBySlug("facebook", "fb-lookup-id");
    expect(post).not.toBeNull();
  });

  it("getOutboundPostBySlug returns null for unknown slug", () => {
    const post = getOutboundPostBySlug("facebook", "ghost-slug");
    expect(post).toBeNull();
  });
});
