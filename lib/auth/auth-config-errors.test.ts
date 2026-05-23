import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockUserUpsert, mockUserFindUnique, mockUserUpdate, mockGetUserAccess } = vi.hoisted(() => ({
  mockUserUpsert: vi.fn(),
  mockUserFindUnique: vi.fn(),
  mockUserUpdate: vi.fn(),
  mockGetUserAccess: vi.fn(),
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    user: {
      upsert: mockUserUpsert,
      findUnique: mockUserFindUnique,
      update: mockUserUpdate,
    },
  },
}));

vi.mock("@/lib/access/get-user-access", () => ({
  getUserAccess: mockGetUserAccess,
}));

vi.mock("@/lib/auth/password", () => ({
  verifyPassword: vi.fn(),
}));

import { authOptions } from "./config";

describe("authOptions database error sanitization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps prisma.user.upsert connectivity failure to a safe auth code", async () => {
    mockUserUpsert.mockRejectedValueOnce(
      new Error("Invalid `prisma.user.upsert()` invocation: Can't reach database server at ep-solitary-mud-ab6t4raj-pooler.eu-west-2.aws.neon.tech:5432"),
    );

    // signIn now returns true instead of throwing — bootstrap admin emails
    // are authorised by env config, not by database presence.
    const result = await authOptions.callbacks?.signIn?.({
      user: { id: "user_1", email: "info@abrahamoflondon.org" },
      account: null,
      profile: undefined,
      email: undefined,
      credentials: undefined,
    } as any);

    expect(result).toBe(true);
  });

  it("does not throw raw database hostname from signIn callback", async () => {
    mockUserUpsert.mockRejectedValueOnce(
      new Error("Can't reach database server at ep-solitary-mud-ab6t4raj-pooler.eu-west-2.aws.neon.tech:5432"),
    );

    // signIn now returns true instead of throwing — bootstrap admin emails
    // are authorised by env config, not by database presence.
    const result = await authOptions.callbacks?.signIn?.({
      user: { id: "user_1", email: "info@abrahamoflondon.org" },
      account: null,
      profile: undefined,
      email: undefined,
      credentials: undefined,
    } as any);

    expect(result).toBe(true);
  });
});
