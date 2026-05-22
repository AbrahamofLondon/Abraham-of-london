/**
 * tests/pages/api/system/lock-status.test.ts
 *
 * Proves: lock-status reads from systemAuditLog, returns the correct persisted
 * lock state, and fails open (isLocked=false, available=false) when the DB throws.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

// ── hoisted mocks ──────────────────────────────────────────────────────────────

const { mockFindFirst } = vi.hoisted(() => ({
  mockFindFirst: vi.fn(),
}));

vi.mock("@/lib/prisma.server", () => ({
  prisma: {
    systemAuditLog: { findFirst: mockFindFirst },
  },
}));

// ── imports ───────────────────────────────────────────────────────────────────

import handler from "@/pages/api/system/lock-status";

// ── helpers ───────────────────────────────────────────────────────────────────

function makeReq(method = "GET"): NextApiRequest {
  return { method } as unknown as NextApiRequest;
}

function makeRes() {
  const res = {
    _status: 200,
    _body: {} as unknown,
    _headers: {} as Record<string, string>,
    status(code: number) { this._status = code; return this; },
    json(body: unknown) { this._body = body; return this; },
    end() { return this; },
    setHeader(key: string, val: string) { this._headers[key] = val; },
  };
  return res as unknown as NextApiResponse & {
    _status: number;
    _body: unknown;
    _headers: Record<string, string>;
  };
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/system/lock-status", () => {
  beforeEach(() => {
    mockFindFirst.mockReset();
  });

  it("returns 405 for non-GET methods", async () => {
    const req = makeReq("POST");
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(405);
  });

  it("returns isLocked=false, available=true when no lock event exists", async () => {
    mockFindFirst.mockResolvedValue(null);
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect((res._body as any).isLocked).toBe(false);
    expect((res._body as any).available).toBe(true);
  });

  it("returns isLocked=true, available=true when most recent event is SYSTEM_LOCKED", async () => {
    mockFindFirst.mockResolvedValue({
      action: "SYSTEM_LOCKED",
      createdAt: new Date("2026-05-22T10:00:00Z"),
    });
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect((res._body as any).isLocked).toBe(true);
    expect((res._body as any).available).toBe(true);
    expect((res._body as any).lockedAt).toBe("2026-05-22T10:00:00.000Z");
  });

  it("returns isLocked=false, available=true when most recent event is SYSTEM_UNLOCKED", async () => {
    mockFindFirst.mockResolvedValue({
      action: "SYSTEM_UNLOCKED",
      createdAt: new Date("2026-05-22T11:00:00Z"),
    });
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect((res._body as any).isLocked).toBe(false);
    expect((res._body as any).available).toBe(true);
    expect((res._body as any).lockedAt).toBeNull();
  });

  it("queries with correct filter: action in SYSTEM_LOCKED/SYSTEM_UNLOCKED, resourceId=global_lock, ordered by createdAt desc", async () => {
    mockFindFirst.mockResolvedValue(null);
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);

    expect(mockFindFirst).toHaveBeenCalledOnce();
    const { where, orderBy } = mockFindFirst.mock.calls[0][0];
    expect(where.action.in).toContain("SYSTEM_LOCKED");
    expect(where.action.in).toContain("SYSTEM_UNLOCKED");
    expect(where.resourceId).toBe("global_lock");
    expect(orderBy.createdAt).toBe("desc");
  });

  it("fails open (isLocked=false, available=false) when the DB throws", async () => {
    mockFindFirst.mockRejectedValue(new Error("DB connection refused"));
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._status).toBe(200);
    expect((res._body as any).isLocked).toBe(false);
    expect((res._body as any).available).toBe(false);
  });

  it("sets Cache-Control header", async () => {
    mockFindFirst.mockResolvedValue(null);
    const req = makeReq();
    const res = makeRes();
    await handler(req, res);
    expect(res._headers["Cache-Control"]).toMatch(/s-maxage=1/);
  });
});
