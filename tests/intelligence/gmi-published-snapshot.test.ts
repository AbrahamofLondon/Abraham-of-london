import { beforeAll, describe, expect, it } from "vitest";

import { buildDbDerivedGmiBoardPack } from "@/lib/intelligence/gmi-board-pack-artifact-service.server";
import { getGmiReleaseSnapshots } from "@/lib/intelligence/gmi-data-service.server";
import {
  GMI_FIXTURE_EDITION_ID,
  GMI_FIXTURE_SNAPSHOT_ID,
  seedGmiCleanRoomBoardPackFixture,
} from "./gmi-clean-room-fixture";

describe("GMI published snapshot read mode", () => {
  beforeAll(async () => {
    await seedGmiCleanRoomBoardPackFixture();
  });

  it("test-local Q2 fixture has a persisted snapshot payload", async () => {
    const snapshots = await getGmiReleaseSnapshots(GMI_FIXTURE_EDITION_ID);
    const published = snapshots.data.find((snapshot) => snapshot.id === GMI_FIXTURE_SNAPSHOT_ID);

    expect(published?.id).toBeTruthy();
    expect(published?.releaseStatus).toBe("PUBLISHED");
    expect(published?.publishedAt).toBeTruthy();
    expect(published?.stateJson).toBeTruthy();
  });

  it("board pack builder reads the fixture-published snapshot when available", async () => {
    const [snapshots, pack] = await Promise.all([
      getGmiReleaseSnapshots(GMI_FIXTURE_EDITION_ID),
      buildDbDerivedGmiBoardPack(GMI_FIXTURE_EDITION_ID),
    ]);
    const published = snapshots.data.find((snapshot) => snapshot.id === GMI_FIXTURE_SNAPSHOT_ID);

    expect(pack.latestSnapshotId).toBe(published?.id);
    expect(pack.callRows).toBe(8);
    expect(pack.sourceRows).toBe(13);
  });
});
