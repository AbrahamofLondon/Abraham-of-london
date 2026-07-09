/**
 * tests/demo-journey/simple-rate-limit.test.ts — §10 funnel abuse resistance.
 */

import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, _resetRateLimitForTest, clientIpFrom } from "@/lib/runtime/simple-rate-limit";

beforeEach(() => _resetRateLimitForTest());

describe("§10 simple rate limit", () => {
  it("allows up to max then blocks within the window", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 5; i++) expect(checkRateLimit("k", 5, 60_000, t0 + i).ok).toBe(true);
    expect(checkRateLimit("k", 5, 60_000, t0 + 6).ok).toBe(false); // 6th blocked
  });

  it("recovers after the window elapses", () => {
    const t0 = 2_000_000;
    for (let i = 0; i < 5; i++) checkRateLimit("k2", 5, 60_000, t0 + i);
    expect(checkRateLimit("k2", 5, 60_000, t0 + 61_000).ok).toBe(true); // window passed
  });

  it("isolates keys (one flooder does not block another session)", () => {
    const t0 = 3_000_000;
    for (let i = 0; i < 5; i++) checkRateLimit("flood", 5, 60_000, t0 + i);
    expect(checkRateLimit("flood", 5, 60_000, t0 + 6).ok).toBe(false);
    expect(checkRateLimit("other", 5, 60_000, t0 + 6).ok).toBe(true);
  });

  it("extracts client ip from x-forwarded-for", () => {
    expect(clientIpFrom({ "x-forwarded-for": "203.0.113.9, 10.0.0.1" })).toBe("203.0.113.9");
    expect(clientIpFrom({})).toBe("unknown");
  });
});
