/**
 * tests/pages/api/admin/security/toggle-lock.test.ts
 *
 * Proves: global lock requires OWNER authority.
 * A session with ADMIN (isAdmin=true, isOwner=false) must be rejected with 403.
 * A session with OWNER (isOwner=true) can lock and unlock.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

// ── hoisted mocks ──────────────────────────────────────────────────────────────

const {
  mockRequireAdminServer,
  mockGetUserAccess,
  mockPrismaCreate,
  mockWriteSecurityAudit,
} = vi.hoisted(() => ({
  mockRequireAdminServer: vi.fn(),
  mockGetUserAccess: vi.fn(),
  mockPrismaCreate: vi.fn(),
  mockWriteSecurityAudit: vi.fn(),
}));

vi.mock("@/lib/auth/requireAdminServer", () => ({
  requireAdminServer: mockRequireAdminServer,
}));

vi.mock("@/lib/access/get-user-access", () => ({
  getUserAccess: mockGetUserAccess,
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    systemAuditLog: { create: mockPrismaCreate },
  },
}));

vi.mock("@/lib/security/audit-log", () => ({
  writeSecurityAudit: mockWriteSecurityAudit,
}));

// ── test helpers ───────────────────────────────────────────────────────────────

import handler from "@/pages/api/admin/security/toggle-lock";

function makeAccess(isOwner: boolean) {
  return {
    permissions: { isAdmin: true, isOwner },
    tier: "none",
    entitlements: { products: [], artifacts: [] },
  };
}

function makeSession(email = "admin@test.com") {
  return { user: { id: "user-1", email } };
}

function makeReq(body: Record<string, unknown>, method = "POST"): NextApiRequest {
  return {
    method,
    body,
    headers: {},
    socket: { remoteAddress: "127.0.0.1" },
  } as unknown as NextApiRequest;
}

function makeRes() {
  const res = {
    _status: 200,
    _body: {} as unknown,
    status(code: number) { this._status = code; return this; },
    json(body: unknown) { this._body = body; return this; },
    setHeader: vi.fn(),
  };
  return res as unknown as NextApiResponse & { _status: number; _body: unknown };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("toggle-lock handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrismaCreate.mockResolvedValue({});
    mockWriteSecurityAudit.mockResolvedValue(undefined);
  });

  it("rejects non-POST methods", async () => {
    const req = makeReq({}, "GET");
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(405);
  });

  it("returns null early if requireAdminServer returns null (auth failed)", async () => {
    mockRequireAdminServer.mockResolvedValue(null);
    const req = makeReq({ locked: true });
    const res = makeRes();
    await handler(req, res);
    expect(mockGetUserAccess).not.toHaveBeenCalled();
  });

  it("returns 403 OWNER_REQUIRED for ADMIN-only session (isOwner=false)", async () => {
    mockRequireAdminServer.mockResolvedValue(makeSession());
    mockGetUserAccess.mockResolvedValue(makeAccess(false));

    const req = makeReq({ locked: true });
    const res = makeRes();
    await handler(req, res);

    expect(res._status).toBe(403);
    expect((res._body as any).error).toBe("OWNER_REQUIRED");
  });

  it("writes a security audit event when ADMIN-only is rejected", async () => {
    mockRequireAdminServer.mockResolvedValue(makeSession("admin@company.com"));
    mockGetUserAccess.mockResolvedValue(makeAccess(false));

    const req = makeReq({ locked: true });
    const res = makeRes();
    await handler(req, res);

    expect(mockWriteSecurityAudit).toHaveBeenCalledOnce();
    const auditCall = mockWriteSecurityAudit.mock.calls[0][0];
    expect(auditCall.action).toBe("forbidden_object_access");
    expect(auditCall.status).toBe("BLOCKED");
  });

  it("allows OWNER to lock the system", async () => {
    mockRequireAdminServer.mockResolvedValue(makeSession("owner@company.com"));
    mockGetUserAccess.mockResolvedValue(makeAccess(true));

    const req = makeReq({ locked: true, reason: "Maintenance window" });
    const res = makeRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect((res._body as any).ok).toBe(true);
    expect((res._body as any).locked).toBe(true);
    expect((res._body as any).available).toBe(true);
  });

  it("allows OWNER to unlock the system", async () => {
    mockRequireAdminServer.mockResolvedValue(makeSession("owner@company.com"));
    mockGetUserAccess.mockResolvedValue(makeAccess(true));

    const req = makeReq({ locked: false });
    const res = makeRes();
    await handler(req, res);

    expect(res._status).toBe(200);
    expect((res._body as any).locked).toBe(false);
  });

  it("records SYSTEM_LOCKED audit log when OWNER locks", async () => {
    mockRequireAdminServer.mockResolvedValue(makeSession("owner@company.com"));
    mockGetUserAccess.mockResolvedValue(makeAccess(true));

    const req = makeReq({ locked: true, reason: "Security incident" });
    const res = makeRes();
    await handler(req, res);

    expect(mockPrismaCreate).toHaveBeenCalledOnce();
    const data = mockPrismaCreate.mock.calls[0][0].data;
    expect(data.action).toBe("SYSTEM_LOCKED");
    expect(data.severity).toBe("critical");
    expect(data.category).toBe("SYSTEM_OVERRIDE");
  });

  it("records SYSTEM_UNLOCKED when OWNER unlocks", async () => {
    mockRequireAdminServer.mockResolvedValue(makeSession("owner@company.com"));
    mockGetUserAccess.mockResolvedValue(makeAccess(true));

    const req = makeReq({ locked: false });
    const res = makeRes();
    await handler(req, res);

    const data = mockPrismaCreate.mock.calls[0][0].data;
    expect(data.action).toBe("SYSTEM_UNLOCKED");
  });

  it("returns 400 for invalid request body", async () => {
    mockRequireAdminServer.mockResolvedValue(makeSession());
    mockGetUserAccess.mockResolvedValue(makeAccess(true));

    const req = makeReq({ locked: "yes" }); // wrong type
    const res = makeRes();
    await handler(req, res);

    expect(res._status).toBe(400);
    expect((res._body as any).error).toBe("INVALID_REQUEST");
  });
});
