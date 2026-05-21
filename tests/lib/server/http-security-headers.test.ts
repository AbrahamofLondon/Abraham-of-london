import { describe, expect, it, vi } from "vitest";
import type { NextApiResponse } from "next";

import { setSecurityHeaders } from "@/lib/server/http";

function makeRes() {
  const headers: Record<string, string | string[]> = {};
  return {
    headers,
    response: {
      headersSent: false,
      setHeader(key: string, value: string | string[]) {
        headers[key] = value;
      },
    } as unknown as NextApiResponse,
  };
}

describe("setSecurityHeaders", () => {
  it("does not emit HSTS outside production", () => {
    vi.stubEnv("NODE_ENV", "development");
    const { headers, response } = makeRes();

    setSecurityHeaders(response);

    expect(headers["Strict-Transport-Security"]).toBeUndefined();
  });
});
