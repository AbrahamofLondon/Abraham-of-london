/* tests/server/security/rate-limit-provider.test.ts — Rate-limit backend tests */
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  buildRateLimitKey,
  hashIpForRateLimit,
} from "@/lib/server/security/rate-limit-provider";

// Mock all backends to be unavailable
vi.mock("@/lib/redis", () => ({
  getRedis: vi.fn(() => null),
  isRedisAvailable: vi.fn(() => Promise.resolve(false)),
}));

vi.mock("@/lib/server/security/persistent-rate-limit", () => ({
  consumePersistentRateLimit: vi.fn(() => Promise.resolve({
    allowed: false,
    remaining: 0,
    limit: 10,
    resetAt: Date.now() + 3600000,
    retryAfterMs: 3600000,
    key: "test",
    source: "unavailable",
  })),
}));

vi.mock("@/lib/server/security/rate-limit-store.postgres", () => ({
  consumePostgresRateLimit: vi.fn(() => Promise.reject(new Error("PG unavailable"))),
}));

describe("Rate-limit provider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildRateLimitKey", () => {
    it("builds a key with route, identity, and hour bucket", () => {
      const key = buildRateLimitKey("pressure-signal", "abc123hash");
      expect(key).toMatch(/^pressure-signal:abc123hash:\d{10}$/);
    });

    it("contains no raw user text", () => {
      const key = buildRateLimitKey("pressure-signal", "abc123hash");
      expect(key).not.toContain("concern");
      expect(key).not.toContain("decision");
      expect(key).not.toContain("raw");
    });
  });

  describe("hashIpForRateLimit", () => {
    it("returns a deterministic hash", () => {
      const hash1 = hashIpForRateLimit("192.168.1.1");
      const hash2 = hashIpForRateLimit("192.168.1.1");
      expect(hash1).toBe(hash2);
    });

    it("returns different hashes for different IPs", () => {
      const hash1 = hashIpForRateLimit("192.168.1.1");
      const hash2 = hashIpForRateLimit("10.0.0.1");
      expect(hash1).not.toBe(hash2);
    });

    it("never stores raw IP", () => {
      const hash = hashIpForRateLimit("192.168.1.1");
      expect(hash).not.toContain("192");
      expect(hash).not.toContain("168");
    });

    it("returns a hex string of length 16", () => {
      const hash = hashIpForRateLimit("203.0.113.42");
      expect(hash).toMatch(/^[0-9a-f]{16}$/);
    });
  });

  describe("consumeRateLimit with all backends unavailable", () => {
    it("falls back to memory in dev mode", async () => {
      // Clear UPSTASH env vars to force memory fallback
      const originalUpstashUrl = process.env.UPSTASH_REDIS_REST_URL;
      const originalUpstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
      const originalNodeEnv = process.env.NODE_ENV;

      process.env.UPSTASH_REDIS_REST_URL = "";
      process.env.UPSTASH_REDIS_REST_TOKEN = "";
      process.env.NODE_ENV = "development";

      // Re-import to get fresh module state
      const { consumeRateLimit } = await import("@/lib/server/security/rate-limit-provider");

      const result = await consumeRateLimit({
        key: "test:identity:2026060512",
        limit: 5,
        windowMs: 60000,
        failClosed: false,
      });

      expect(result.allowed).toBe(true);
      expect(result.backend).toBe("memory");
      expect(result.remaining).toBeGreaterThanOrEqual(0);

      // Restore env
      process.env.UPSTASH_REDIS_REST_URL = originalUpstashUrl;
      process.env.UPSTASH_REDIS_REST_TOKEN = originalUpstashToken;
      process.env.NODE_ENV = originalNodeEnv;
    });
  });
});