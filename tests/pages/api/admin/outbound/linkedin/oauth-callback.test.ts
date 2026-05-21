import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

const {
  mockRequireAdminApi,
  mockExchangeCodeForToken,
  mockReadLinkedInOAuthState,
} = vi.hoisted(() => ({
  mockRequireAdminApi: vi.fn(),
  mockExchangeCodeForToken: vi.fn(),
  mockReadLinkedInOAuthState: vi.fn(),
}));

vi.mock("@/lib/access/server", () => ({
  requireAdminApi: mockRequireAdminApi,
}));

vi.mock("@/lib/outbound/linkedin-oauth", () => ({
  LINKEDIN_OAUTH_STATE_COOKIE: "linkedin_oauth_state",
  exchangeCodeForToken: mockExchangeCodeForToken,
  readLinkedInOAuthState: mockReadLinkedInOAuthState,
}));

import handler from "@/pages/api/admin/outbound/linkedin/oauth/callback";

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

function makeReq(): NextApiRequest {
  return {
    method: "GET",
    query: { code: "oauth-code", state: "signed-state" },
    cookies: { linkedin_oauth_state: "signed-state" },
  } as unknown as NextApiRequest;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdminApi.mockResolvedValue({
    session: { user: { id: "admin-1" } },
  });
  mockReadLinkedInOAuthState.mockReturnValue({
    nonce: "nonce",
    profileKey: "community",
    returnTo: "/admin/outbound/linkedin",
    issuedAt: Date.now(),
  });
  mockExchangeCodeForToken.mockResolvedValue({ ok: true, message: "stored" });
});

describe("GET /api/admin/outbound/linkedin/oauth/callback", () => {
  it("uses the profile recovered from signed OAuth state", async () => {
    const res = makeRes();

    await handler(makeReq(), res);

    expect(mockExchangeCodeForToken).toHaveBeenCalledWith(
      "oauth-code",
      "admin-1",
      "community",
    );
    expect(res._redirect).toContain("connection=success");
  });

  it("refuses invalid or tampered OAuth state", async () => {
    mockReadLinkedInOAuthState.mockReturnValue(null);
    const res = makeRes();

    await handler(makeReq(), res);

    expect(mockExchangeCodeForToken).not.toHaveBeenCalled();
    expect(res._redirect).toContain("code=state_mismatch");
  });
});
