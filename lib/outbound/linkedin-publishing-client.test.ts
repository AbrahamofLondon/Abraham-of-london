import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockGetLinkedInAccessToken } = vi.hoisted(() => ({
  mockGetLinkedInAccessToken: vi.fn(),
}));

vi.mock("./linkedin-oauth", () => ({
  getConnectionStatus: vi.fn(),
  getLinkedInAccessToken: mockGetLinkedInAccessToken,
}));

import {
  buildLinkedInTextPostPayload,
  normaliseLinkedInPublishError,
  publishTextPostToLinkedIn,
} from "./linkedin-publishing-client";

beforeEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("LinkedIn publishing client", () => {
  it("builds text-only member post payload", () => {
    const payload = buildLinkedInTextPostPayload({
      authorUrn: "urn:li:person:abc",
      commentary: "Post body",
    });

    expect(payload.author).toBe("urn:li:person:abc");
    expect(payload.commentary).toBe("Post body");
    expect(payload.lifecycleState).toBe("PUBLISHED");
    expect(payload).not.toHaveProperty("content");
  });

  it("normalises provider errors safely", () => {
    expect(normaliseLinkedInPublishError(401).errorCode).toBe("LINKEDIN_TOKEN_INVALID");
    expect(normaliseLinkedInPublishError(403).errorCode).toBe("LINKEDIN_SCOPE_OR_PERMISSION_MISSING");
    expect(normaliseLinkedInPublishError(429).errorCode).toBe("LINKEDIN_RATE_LIMITED");
  });

  it("returns safe not-connected error without token values", async () => {
    mockGetLinkedInAccessToken.mockResolvedValue(null);

    const result = await publishTextPostToLinkedIn({ commentary: "Body" });

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("LINKEDIN_NOT_CONNECTED");
    expect(JSON.stringify(result)).not.toContain("Bearer");
  });

  it("maps 429 response to rate-limit safe error", async () => {
    mockGetLinkedInAccessToken.mockResolvedValue({
      accessToken: "secret-access-token",
      ownerUrn: "urn:li:person:abc",
      scope: "openid profile w_member_social",
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      headers: new Headers(),
    }));

    const result = await publishTextPostToLinkedIn({ commentary: "Body" });

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("LINKEDIN_RATE_LIMITED");
    expect(JSON.stringify(result)).not.toContain("secret-access-token");
  });

  it("returns post urn and url on success", async () => {
    mockGetLinkedInAccessToken.mockResolvedValue({
      accessToken: "secret-access-token",
      ownerUrn: "urn:li:person:abc",
      scope: "openid profile w_member_social",
    });
    const headers = new Headers();
    headers.set("x-restli-id", "urn:li:share:123");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      headers,
    }));

    const result = await publishTextPostToLinkedIn({ commentary: "Body" });

    expect(result.ok).toBe(true);
    expect(result.postUrn).toBe("urn:li:share:123");
    expect(result.postUrl).toContain("urn%3Ali%3Ashare%3A123");
  });
});
