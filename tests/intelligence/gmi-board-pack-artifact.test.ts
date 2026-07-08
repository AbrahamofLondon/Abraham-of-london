import { beforeAll, describe, expect, it } from "vitest";

import {
  getLatestGmiBoardPackArtifact,
  validateGmiBoardPackArtifact,
} from "@/lib/intelligence/gmi-board-pack-artifact-service.server";
import { resolveGmiReleaseState } from "@/lib/intelligence/gmi-release-authority";
import {
  GMI_FIXTURE_ARTIFACT_ID,
  GMI_FIXTURE_EDITION_ID,
  seedGmiCleanRoomBoardPackFixture,
} from "./gmi-clean-room-fixture";

describe("GMI board-pack artifact registry", () => {
  beforeAll(async () => {
    await seedGmiCleanRoomBoardPackFixture();
  });

  it("records a generated board-pack artifact with content and state hashes", async () => {
    const artifact = await getLatestGmiBoardPackArtifact(GMI_FIXTURE_EDITION_ID);

    expect(artifact?.id).toBe(GMI_FIXTURE_ARTIFACT_ID);
    expect(artifact?.status).toBe("generated");
    expect(artifact?.contentHash).toMatch(/^[a-f0-9]{64}$/);
    expect(artifact?.generatedFromStateHash).toMatch(/^[a-f0-9]{64}$/);
    expect(artifact?.generatedAt).toBeTruthy();
  });

  it("valid generated artifact clears PDF_EXPORT", async () => {
    const [artifact, state] = await Promise.all([
      validateGmiBoardPackArtifact(GMI_FIXTURE_EDITION_ID),
      resolveGmiReleaseState(GMI_FIXTURE_EDITION_ID),
    ]);

    expect(artifact.ok).toBe(true);
    expect(state.blockerCategories).not.toContain("PDF_EXPORT");
    expect(state.metrics.boardPackPdfAvailable).toBe(true);
  });
});
