/**
 * tests/research/research-run-validation.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  CreateResearchRunSchema,
  UpdateResearchRunSchema,
  DeferRunSchema,
  ResearchRunFiltersSchema,
} from "@/lib/research/research-run-validation";

describe("CreateResearchRunSchema", () => {
  const valid = {
    title: "Security scan — /api/admin/*",
    slug: "security-scan-api-admin",
    runType: "SECURITY",
    module: "security-red-team",
    severity: "HIGH",
    status: "PENDING",
    isDemo: false,
  };

  it("accepts a valid create input", () => {
    expect(() => CreateResearchRunSchema.parse(valid)).not.toThrow();
  });

  it("rejects slug with uppercase", () => {
    expect(() => CreateResearchRunSchema.parse({ ...valid, slug: "Invalid-Slug" })).toThrow();
  });

  it("rejects slug with spaces", () => {
    expect(() => CreateResearchRunSchema.parse({ ...valid, slug: "invalid slug" })).toThrow();
  });

  it("rejects invalid severity", () => {
    expect(() => CreateResearchRunSchema.parse({ ...valid, severity: "SEVERE" })).toThrow();
  });

  it("rejects invalid runType", () => {
    expect(() => CreateResearchRunSchema.parse({ ...valid, runType: "UNKNOWN" })).toThrow();
  });

  it("applies defaults for severity, status, isDemo", () => {
    const { severity, status, isDemo, ...minimal } = valid;
    const result = CreateResearchRunSchema.parse(minimal);
    expect(result.severity).toBe("INFO");
    expect(result.status).toBe("PENDING");
    expect(result.isDemo).toBe(false);
  });
});

describe("DeferRunSchema", () => {
  it("rejects empty reason", () => {
    expect(() => DeferRunSchema.parse({ deferredReason: "" })).toThrow();
  });

  it("rejects reason under 20 characters", () => {
    expect(() => DeferRunSchema.parse({ deferredReason: "short" })).toThrow();
  });

  it("rejects reason of exactly 15 characters", () => {
    expect(() => DeferRunSchema.parse({ deferredReason: "fifteen chars!!" })).toThrow();
  });

  it("accepts reason of exactly 20 characters", () => {
    expect(() => DeferRunSchema.parse({ deferredReason: "exactly twenty chars" })).not.toThrow();
  });

  it("accepts reason over 20 characters", () => {
    expect(() => DeferRunSchema.parse({ deferredReason: "Deferred until next sprint due to capacity" })).not.toThrow();
  });
});

describe("ResearchRunFiltersSchema", () => {
  it("applies defaults", () => {
    const result = ResearchRunFiltersSchema.parse({});
    expect(result.limit).toBe(50);
    expect(result.offset).toBe(0);
  });

  it("clamps limit to max 200", () => {
    expect(() => ResearchRunFiltersSchema.parse({ limit: 201 })).toThrow();
  });

  it("rejects negative offset", () => {
    expect(() => ResearchRunFiltersSchema.parse({ offset: -1 })).toThrow();
  });
});
