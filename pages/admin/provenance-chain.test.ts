import { describe, expect, it } from "vitest";

import { shortenAnchorHash } from "./provenance-chain";

describe("provenance chain console helpers", () => {
  it("shortens hashes safely", () => {
    expect(shortenAnchorHash("1234567890abcdef1234567890abcdef")).toBe("12345678…abcdef");
  });

  it("keeps short hashes unchanged", () => {
    expect(shortenAnchorHash("abc123")).toBe("abc123");
  });

  it("handles missing hashes without throwing", () => {
    expect(shortenAnchorHash(null)).toBe("—");
    expect(shortenAnchorHash(undefined)).toBe("—");
  });
});
