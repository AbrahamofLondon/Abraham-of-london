import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GetServerSidePropsContext } from "next";

const { mockGetServerSession } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/auth/options", () => ({
  authOptions: {},
}));

import { getServerSideProps } from "@/pages/admin/login";

function makeCtx(query: Record<string, string>): GetServerSidePropsContext {
  return {
    req: {} as GetServerSidePropsContext["req"],
    res: {} as GetServerSidePropsContext["res"],
    query,
  } as GetServerSidePropsContext;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("admin login redirect", () => {
  it("redirects an authenticated login visit to a safe returnTo instead of /admin", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user_1", email: "admin@abrahamoflondon.org" },
    });

    const result = await getServerSideProps(
      makeCtx({ returnTo: "/admin/outbound/linkedin" }),
    );

    expect(result).toEqual({
      redirect: {
        destination: "/admin/outbound/linkedin",
        permanent: false,
      },
    });
  });

  it("falls back safely for an external authenticated return target", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "user_1", email: "admin@abrahamoflondon.org" },
    });

    const result = await getServerSideProps(
      makeCtx({ returnTo: "https://example.invalid/admin" }),
    );

    expect(result).toEqual({
      redirect: {
        destination: "/admin",
        permanent: false,
      },
    });
  });
});
