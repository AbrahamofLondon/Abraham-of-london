import { describe, expect, it } from "vitest";

import { formatRunnerStatusLabel } from "./provenance-chain";

describe("formatRunnerStatusLabel", () => {
  it("renders observed activity as active", () => {
    expect(formatRunnerStatusLabel("ACTIVE")).toBe("Active");
  });

  it("renders unobserved activity honestly", () => {
    expect(formatRunnerStatusLabel("NOT_OBSERVED")).toBe("Not observed");
  });

  it("supports explicit not-configured status when a real source can prove it", () => {
    expect(formatRunnerStatusLabel("NOT_CONFIGURED")).toBe("Not configured");
  });
});
