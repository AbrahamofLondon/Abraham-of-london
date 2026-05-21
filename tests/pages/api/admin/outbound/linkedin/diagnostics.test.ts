import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

const { mockRequireAdminApi } = vi.hoisted(() => ({
  mockRequireAdminApi: vi.fn(),
}));

vi.mock("@/lib/access/server", () => ({
  requireAdminApi: mockRequireAdminApi,
}));

import handler from "@/pages/api/admin/outbound/linkedin/diagnostics";

type MockRes = NextApiResponse & {
  _status: number;
  _body: unknown;
};

function makeRes(): MockRes {
  const response = {
    _status: 200,
    _body: null,
    status(code: number) {
      response._status = code;
      return response;
    },
    json(body: unknown) {
      response._body = body;
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
  process.env.LINKEDIN_ACTIVE_PROFILE = "community";
  process.env.NEXT_PUBLIC_APP_URL = "https://www.abrahamoflondon.org";
  process.env.LINKEDIN_COMMUNITY_CLIENT_ID = "community-id";
  process.env.LINKEDIN_COMMUNITY_CLIENT_SECRET = "community-secret";
  process.env.LINKEDIN_COMMUNITY_REDIRECT_URI =
    "https://www.abrahamoflondon.org/api/admin/outbound/linkedin/oauth/callback";
});

describe("GET /api/admin/outbound/linkedin/diagnostics", () => {
  it("returns safe LinkedIn profile presence diagnostics", async () => {
    const res = makeRes();

    await handler({ method: "GET" } as NextApiRequest, res);

    expect(res._status).toBe(200);
    const text = JSON.stringify(res._body);
    expect(text).toContain("clientSecretPresent");
    expect(text).toContain("community");
    expect(text).not.toContain("community-secret");
  });
});
