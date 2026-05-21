import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

const { mockRequireAdminApi } = vi.hoisted(() => ({
  mockRequireAdminApi: vi.fn(),
}));

vi.mock("@/lib/access/server", () => ({
  requireAdminApi: mockRequireAdminApi,
}));

import handler from "@/pages/api/admin/outbound/linkedin/oauth/start";
import { readLinkedInOAuthState } from "@/lib/outbound/linkedin-oauth";

type MockRes = NextApiResponse & {
  _status: number;
  _redirect: string | null;
  _headers: Record<string, string>;
};

function makeRes(): MockRes {
  const response = {
    _status: 200,
    _redirect: null as string | null,
    _headers: {} as Record<string, string>,
    status(code: number) {
      response._status = code;
      return response;
    },
    json() {
      return response;
    },
    setHeader(name: string, value: string | number | readonly string[]) {
      response._headers[name] = Array.isArray(value) ? value.join(";") : String(value);
      return response;
    },
    redirect(code: number, url: string) {
      response._status = code;
      response._redirect = url;
      return response;
    },
  };
  return response as unknown as MockRes;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdminApi.mockResolvedValue({
    session: { user: { id: "admin-1" } },
  });
  process.env.CSRF_SECRET = "test-linkedin-oauth-state";
  process.env.LINKEDIN_COMMUNITY_CLIENT_ID = "community-id";
  process.env.LINKEDIN_COMMUNITY_CLIENT_SECRET = "community-secret";
  process.env.LINKEDIN_COMMUNITY_REDIRECT_URI =
    "http://localhost:3000/api/admin/outbound/linkedin/oauth/callback";
});

describe("GET /api/admin/outbound/linkedin/oauth/start", () => {
  it("starts OAuth with the selected Community profile", async () => {
    const res = makeRes();

    await handler(
      {
        method: "GET",
        query: { profile: "community" },
      } as unknown as NextApiRequest,
      res,
    );

    expect(res._status).toBe(302);
    const redirect = new URL(String(res._redirect));
    expect(redirect.searchParams.get("client_id")).toBe("community-id");
    const state = redirect.searchParams.get("state") || "";
    expect(readLinkedInOAuthState(state, state)?.profileKey).toBe("community");
    expect(res._headers["Set-Cookie"]).toContain("linkedin_oauth_state=");
  });
});
