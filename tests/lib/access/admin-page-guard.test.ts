import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GetServerSidePropsContext } from "next";

const { mockGetServerSession, mockGetUserAccess } = vi.hoisted(() => ({
  mockGetServerSession: vi.fn(),
  mockGetUserAccess: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: mockGetServerSession,
}));

vi.mock("@/lib/access/get-user-access", () => ({
  getUserAccess: mockGetUserAccess,
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {},
}));

import { requireAdminPage } from "@/lib/access/server";

function makeCtx(): GetServerSidePropsContext {
  return {
    req: {} as GetServerSidePropsContext["req"],
    res: {} as GetServerSidePropsContext["res"],
    query: {},
    resolvedUrl: "/admin/outbound/linkedin",
  } as GetServerSidePropsContext;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireAdminPage", () => {
  it("recognises a NextAuth admin session for a protected admin route", async () => {
    mockGetServerSession.mockResolvedValue({
      user: {
        id: "user_1",
        email: "admin@abrahamoflondon.org",
        role: "ADMIN",
      },
    });
    mockGetUserAccess.mockResolvedValue({
      userId: "user_1",
      tier: "architect",
      entitlements: { tiers: [], products: [], artifacts: [] },
      permissions: {
        isAuthenticated: true,
        isAdmin: true,
        isOwner: false,
      },
    });

    const guard = await requireAdminPage(makeCtx());

    expect(guard).toEqual(expect.objectContaining({
      authorized: true,
      userId: "user_1",
    }));
    expect(mockGetUserAccess).toHaveBeenCalledWith({}, "user_1", "admin@abrahamoflondon.org");
  });

  it("redirects unauthenticated outbound admin access to login with encoded returnTo", async () => {
    mockGetServerSession.mockResolvedValue(null);
    mockGetUserAccess.mockResolvedValue({
      userId: null,
      tier: "public",
      entitlements: { tiers: [], products: [], artifacts: [] },
      permissions: {
        isAuthenticated: false,
        isAdmin: false,
        isOwner: false,
      },
    });

    const guard = await requireAdminPage(makeCtx());

    expect(guard).toEqual({
      authorized: false,
      redirect: {
        redirect: {
          destination: "/admin/login?returnTo=%2Fadmin%2Foutbound%2Flinkedin",
          permanent: false,
        },
      },
    });
  });
});
