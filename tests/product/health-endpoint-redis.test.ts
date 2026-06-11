import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextApiRequest, NextApiResponse } from "next";

type MockRes = NextApiResponse & {
  _status: number;
  _body: any;
  _headers: Record<string, string>;
};

const envShape = {
  REDIS_DISABLED: "present:false",
  USE_REDIS: "present:true",
  UPSTASH_REDIS_REST_URL: "present",
  UPSTASH_REDIS_REST_TOKEN: "present",
  REDIS_URL: "missing",
  REDIS_HOST: "missing",
  REDIS_PASSWORD: "present",
};

function makeReq(): NextApiRequest {
  return {
    method: "GET",
    headers: { "x-forwarded-for": "127.0.0.1" },
    socket: { remoteAddress: "127.0.0.1" },
  } as NextApiRequest;
}

function makeRes(): MockRes {
  const response = {
    _status: 200,
    _body: null,
    _headers: {} as Record<string, string>,
    status(code: number) {
      response._status = code;
      return response;
    },
    setHeader(key: string, value: string) {
      response._headers[key] = String(value);
      return response;
    },
    json(body: unknown) {
      response._body = body;
      return response;
    },
  };
  return response as unknown as MockRes;
}

async function loadHealthHandler(redisResult: Record<string, unknown>) {
  vi.resetModules();
  vi.doMock("@/lib/redis-health", () => ({
    checkCanonicalRedisHealth: vi.fn(async () => redisResult),
  }));
  vi.doMock("@/lib/db", () => ({
    checkDatabaseConnection: vi.fn(async () => ({ connected: true })),
  }));
  vi.doMock("@/lib/contentlayer-helper", () => ({
    getAllContentlayerDocs: () => [{ id: "doc-1" }],
  }));
  const mod = await import("@/pages/api/health");
  return mod.default;
}

describe("/api/health Redis semantics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("marks health healthy when canonical Redis succeeds", async () => {
    const handler = await loadHealthHandler({
      ok: true,
      clientMode: "upstash-rest",
      configured: true,
      required: true,
      latency: 12,
      timeoutMs: 4000,
      message: "Redis reachable via Upstash REST",
      env: envShape,
    });
    const res = makeRes();

    await handler(makeReq(), res);

    expect(res._status).toBe(200);
    expect(res._body.status).toBe("healthy");
    expect(res._body.checks.redis).toEqual(expect.objectContaining({
      status: "healthy",
      clientMode: "upstash-rest",
      configured: true,
      required: true,
    }));
  });

  it("marks required Redis failure unhealthy without leaking URL or token", async () => {
    const handler = await loadHealthHandler({
      ok: false,
      clientMode: "upstash-rest",
      configured: true,
      required: true,
      latency: 25,
      timeoutMs: 4000,
      message: "Redis authentication failed",
      errorClass: "Error",
      env: envShape,
    });
    const res = makeRes();

    await handler(makeReq(), res);
    const serialized = JSON.stringify(res._body);

    expect(res._status).toBe(503);
    expect(res._body.status).toBe("unhealthy");
    expect(res._body.checks.redis).toEqual(expect.objectContaining({
      status: "unhealthy",
      message: "Redis authentication failed",
      clientMode: "upstash-rest",
      errorClass: "Error",
    }));
    expect(serialized).not.toContain("secret-token-value");
    expect(serialized).not.toContain("secret-upstash");
    expect(serialized).not.toContain("https://");
  });

  it("marks missing required Redis config unhealthy with a clear non-secret error", async () => {
    const handler = await loadHealthHandler({
      ok: false,
      clientMode: "not-configured",
      configured: false,
      required: true,
      latency: 1,
      timeoutMs: 4000,
      message: "Redis not configured",
      errorClass: "RedisConfigurationError",
      env: { ...envShape, UPSTASH_REDIS_REST_URL: "missing", UPSTASH_REDIS_REST_TOKEN: "missing", REDIS_PASSWORD: "missing" },
    });
    const res = makeRes();

    await handler(makeReq(), res);

    expect(res._status).toBe(503);
    expect(res._body.checks.redis).toEqual(expect.objectContaining({
      status: "unhealthy",
      message: "Redis not configured",
      errorClass: "RedisConfigurationError",
    }));
  });
});
