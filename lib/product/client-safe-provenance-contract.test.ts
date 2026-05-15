import { describe, expect, it } from "vitest";

import {
  buildClientSafeProvenanceCaseHref,
  CLIENT_SAFE_PROVENANCE_SAMPLE_ROUTE,
} from "./client-safe-provenance-contract";

describe("client-safe provenance routes", () => {
  it("keeps public samples separate from live authenticated case routes", () => {
    expect(CLIENT_SAFE_PROVENANCE_SAMPLE_ROUTE).toBe("/provenance/sample-export");
    expect(buildClientSafeProvenanceCaseHref({
      subjectType: "OVERSIGHT_CYCLE",
      subjectId: "cycle_001",
    })).toBe("/provenance/case/OVERSIGHT_CYCLE/cycle_001");
    expect(buildClientSafeProvenanceCaseHref({
      subjectType: "OVERSIGHT_CYCLE",
      subjectId: "cycle_001",
    })).not.toBe(CLIENT_SAFE_PROVENANCE_SAMPLE_ROUTE);
  });
});
