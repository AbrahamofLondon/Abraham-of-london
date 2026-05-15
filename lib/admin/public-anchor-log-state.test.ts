import { describe, expect, it } from "vitest";

import { buildPublicAnchorLogState, toPublicAnchorEntries } from "./public-anchor-log-state";

describe("buildPublicAnchorLogState", () => {
  it("distinguishes an empty public log from internal anchoring availability", () => {
    const state = buildPublicAnchorLogState({
      publicRootsCount: 0,
      latestPublicRootAt: null,
      internalAnchoringAvailable: true,
    });

    expect(state.publicRootsCount).toBe(0);
    expect(state.internalAnchoringAvailable).toBe(true);
    expect(state.publicationBoundary).toContain("deliberately published");
  });

  it("keeps external anchoring explicitly not configured", () => {
    const state = buildPublicAnchorLogState({
      publicRootsCount: 2,
      latestPublicRootAt: "2026-05-14T12:00:00.000Z",
      internalAnchoringAvailable: null,
    });

    expect(state.externalAnchoringConfigured).toBe(false);
    expect(state.latestPublicRootAt).toBe("2026-05-14T12:00:00.000Z");
  });

  it("maps only public-safe anchor fields and omits scopeId", () => {
    const entries = toPublicAnchorEntries([
      {
        metadata: {
          version: 1,
          scope: "DAILY",
          scopeId: "sensitive-scope-id",
          merkleRoot: "root_001",
          leafCount: 3,
          computedAt: "2026-05-14T12:00:00.000Z",
        },
        createdAt: new Date("2026-05-14T12:00:00.000Z"),
      },
    ]);

    expect(entries).toEqual([
      {
        version: 1,
        scope: "DAILY",
        merkleRoot: "root_001",
        leafCount: 3,
        computedAt: "2026-05-14T12:00:00.000Z",
      },
    ]);
    expect(JSON.stringify(entries)).not.toContain("scopeId");
  });
});
