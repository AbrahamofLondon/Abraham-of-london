import { describe, expect, it } from "vitest";

import {
  getLatestGmiBoardPackArtifact,
  validateGmiBoardPackArtifact,
} from "@/lib/intelligence/gmi-board-pack-artifact-service.server";
import { resolveGmiReleaseState } from "@/lib/intelligence/gmi-release-authority";

describe("GMI board-pack artifact registry", () => {
  it("records a generated board-pack artifact with content and state hashes", async () => {
    const artifact = await getLatestGmiBoardPackArtifact("GMI-Q2-2026");

    expect(artifact?.status).toBe("generated");
    expect(artifact?.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(artifact?.generatedFromStateHash).toMatch(/^[a-f0-9]{64}$/);
    expect(artifact?.generatedAt).toBeTruthy();
  });

  it("valid generated artifact clears PDF_EXPORT", async () => {
    const [artifact, state] = await Promise.all([
      validateGmiBoardPackArtifact("GMI-Q2-2026"),
      resolveGmiReleaseState("GMI-Q2-2026"),
    ]);

    expect(artifact.ok).toBe(true);
    expect(state.blockerCategories).not.toContain("PDF_EXPORT");
    expect(state.metrics.boardPackPdfAvailable).toBe(true);
  });
});
