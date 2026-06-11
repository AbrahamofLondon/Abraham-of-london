import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockPing,
} = vi.hoisted(() => ({
  mockPing: vi.fn(),
}));

vi.mock("@/lib/redis", () => ({
  getRedis: () => ({ ping: mockPing }),
}));

import {
  checkCanonicalRedisHealth,
  getRedisEnvShape,
} from "@/lib/redis-health";

const ORIGINAL_FETCH = globalThis.fetch;

describe("canonical Redis health", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
    globalThis.fetch = vi.fn() as unknown as typeof fetch;
  });

  afterEach(() => {
    globalThis.fetch = ORIGINAL_FETCH;
    vi.unstubAllEnvs();
  });

  it("detects Redis env shape without exposing secret values", () => {
    vi.stubEnv("REDIS_DISABLED", "false");
    vi.stubEnv("USE_REDIS", "true");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://secret-upstash.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "secret-token-value");
    vi.stubEnv("REDIS_PASSWORD", "secret-password-value");

    const shape = getRedisEnvShape();
    const serialized = JSON.stringify(shape);

    expect(shape).toEqual(expect.objectContaining({
      REDIS_DISABLED: "present:false",
      USE_REDIS: "present:true",
      UPSTASH_REDIS_REST_URL: "present",
      UPSTASH_REDIS_REST_TOKEN: "present",
      REDIS_PASSWORD: "present",
    }));
    expect(serialized).not.toContain("secret-upstash");
    expect(serialized).not.toContain("secret-token-value");
    expect(serialized).not.toContain("secret-password-value");
  });

  it("uses Upstash REST when configured and marks Redis healthy on PONG", async () => {
    vi.stubEnv("USE_REDIS", "true");
    vi.stubEnv("REDIS_DISABLED", "false");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://secret-upstash.example");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "secret-token-value");
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(new Response(JSON.stringify({ result: "PONG" }), { status: 200 }));

    const result = await checkCanonicalRedisHealth(1000);

    expect(result).toEqual(expect.objectContaining({
      ok: true,
      clientMode: "upstash-rest",
      configured: true,
      required: true,
    }));
    expect(JSON.stringify(result)).not.toContain("secret-upstash");
    expect(JSON.stringify(result)).not.toContain("secret-token-value");
  });

  it("returns a clear non-secret configuration failure for missing Upstash token", async () => {
    vi.stubEnv("USE_REDIS", "true");
    vi.stubEnv("REDIS_DISABLED", "false");
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://secret-upstash.example");

    const result = await checkCanonicalRedisHealth(1000);

    expect(result).toEqual(expect.objectContaining({
      ok: false,
      clientMode: "upstash-rest",
      configured: false,
      required: true,
      message: "Upstash Redis REST environment is incomplete",
      errorClass: "RedisConfigurationError",
    }));
    expect(JSON.stringify(result)).not.toContain("secret-upstash");
  });

  it("uses explicit REDIS_URL ioredis path only when Upstash REST is absent", async () => {
    vi.stubEnv("USE_REDIS", "true");
    vi.stubEnv("REDIS_DISABLED", "false");
    vi.stubEnv("REDIS_URL", "redis://secret-redis.example:6379");
    mockPing.mockResolvedValueOnce("PONG");

    const result = await checkCanonicalRedisHealth(1000);

    expect(result).toEqual(expect.objectContaining({
      ok: true,
      clientMode: "ioredis",
      configured: true,
      required: true,
    }));
    expect(JSON.stringify(result)).not.toContain("secret-redis");
  });

  it("marks Redis unhealthy when required and not configured", async () => {
    vi.stubEnv("USE_REDIS", "true");
    vi.stubEnv("REDIS_DISABLED", "false");

    const result = await checkCanonicalRedisHealth(1000);

    expect(result).toEqual(expect.objectContaining({
      ok: false,
      clientMode: "not-configured",
      configured: false,
      required: true,
      message: "Redis not configured",
    }));
  });
});
