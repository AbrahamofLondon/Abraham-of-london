import { describe, expect, it } from "vitest";

import { buildDbDerivedGmiBoardPack } from "@/lib/intelligence/gmi-board-pack-artifact-service.server";
import { getGmiReleaseSnapshots } from "@/lib/intelligence/gmi-data-service.server";

describe("GMI published snapshot read mode", () => {
  it("published Q2 has a persisted snapshot payload", async () => {
    const snapshots = await getGmiReleaseSnapshots("GMI-Q2-2026");
    const published = snapshots.data.find((snapshot) => snapshot.releaseStatus === "PUBLISHED" && snapshot.publishedAt);

    expect(published?.id).toBeTruthy();
    expect(published?.stateJson).toBeTruthy();
  });

  it("board pack builder reads the published snapshot when available", async () => {
    const [snapshots, pack] = await Promise.all([
      getGmiReleaseSnapshots("GMI-Q2-2026"),
      buildDbDerivedGmiBoardPack("GMI-Q2-2026"),
    ]);
    const published = snapshots.data.find((snapshot) => snapshot.releaseStatus === "PUBLISHED" && snapshot.publishedAt);

    expect(pack.latestSnapshotId).toBe(published?.id);
    expect(pack.callRows).toBe(8);
    expect(pack.sourceRows).toBe(13);
  });
});
