import "dotenv/config";
import { beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { CATALOG } from "@/lib/commercial/catalog";
import {
  bootstrapProtectedGmiReleaseState,
  getDurableReleaseState,
} from "@/lib/intelligence/gmi-release-store.server";
import {
  gmiEditionIdFromPublicSlug,
  listPublicGmiEditions,
  resolveCurrentGmiEdition,
  resolvePublicGmiEdition,
} from "@/lib/intelligence/gmi-public-edition-resolver.server";

beforeAll(async () => {
  await bootstrapProtectedGmiReleaseState();
});

describe("GMI public edition landing-page factory", () => {
  it("resolves Q2 as the current public purchasable edition from durable release state", async () => {
    const q2 = await resolvePublicGmiEdition("GMI-Q2-2026");

    expect(q2.editionId).toBe("GMI-Q2-2026");
    expect(q2.familyId).toBe("gmi-quarterly");
    expect(q2.slug).toBe("global-market-intelligence-q2-2026");
    expect(q2.isCurrent).toBe(true);
    expect(q2.isPublic).toBe(true);
    expect(q2.isPurchasable).toBe(true);
    expect(q2.commerce.checkoutEligible).toBe(true);
    expect(q2.commerce.productCode).toBe("gmi_q2_2026");
    expect(q2.commerce.priceLabel).toBe(CATALOG.gmi_q2_2026!.displayPrice);
    expect(q2.commerce.priceAuthorityRef).toBe("price_1TP1rRQFpelVFMXJWaFMOpJQ");
    expect(q2.readerAccessState).toBe("ACQUISITION_VISITOR");
    expect(q2.regimeFingerprint).toHaveLength(5);
    expect(q2.consequenceMatrix.map((row) => row.decisionDomain)).toContain("CAPITAL ALLOCATION");
    expect(q2.crossEditionDeltas.some((delta) => delta.movement === "STRENGTHENED")).toBe(true);
    expect(q2.supportingBriefs[0]?.ref).toMatch(/^BRIEF-GMI-/);
    const state = await getDurableReleaseState("GMI-Q2-2026");
    expect(q2.releaseProof.receiptRef).toBeTruthy();
    expect(q2.releaseProof.candidateHash).toBe(state?.candidateHash);
  });

  it("resolves Q1 as a superseded public reference with no standalone checkout", async () => {
    const q1 = await resolvePublicGmiEdition("GMI-Q1-2026");

    expect(q1.lifecycleState).toBe("SUPERSEDED");
    expect(q1.isCurrent).toBe(false);
    expect(q1.isPublic).toBe(true);
    expect(q1.isPurchasable).toBe(false);
    expect(q1.commerce.checkoutEligible).toBe(false);
    expect(q1.readerAccessState).toBe("PUBLIC_SUMMARY");
    expect(q1.consequenceMatrix[0]?.accessLevel).toBe("PUBLIC");
    expect(q1.archiveContext.currentEdition.editionId).toBe("GMI-Q2-2026");
    expect(q1.archiveContext.currentEdition.href).toBe("/intelligence/global-market-intelligence-q2-2026");
  });

  it("excludes draft/future editions from public resolution", async () => {
    expect(gmiEditionIdFromPublicSlug("global-market-intelligence-q3-2026")).toBe("GMI-Q3-2026");
    await expect(resolvePublicGmiEdition("GMI-Q3-2026")).rejects.toThrow(/not structurally defined|not public/);
  });

  it("derives current and archive list without hand-maintained page arrays", async () => {
    const current = await resolveCurrentGmiEdition();
    const editions = await listPublicGmiEditions();

    expect(current.editionId).toBe("GMI-Q2-2026");
    expect(editions.map((edition) => edition.editionId)).toContain("GMI-Q2-2026");
    expect(editions.map((edition) => edition.editionId)).toContain("GMI-Q1-2026");
    expect(editions.find((edition) => edition.editionId === "GMI-Q2-2026")?.isCurrent).toBe(true);
    expect(editions.find((edition) => edition.editionId === "GMI-Q1-2026")?.isPurchasable).toBe(false);
  });

  it("fails closed when durable current-edition invariant has zero or multiple active editions", async () => {
    const fakeDbZero = {
      gmiEditionReleaseState: { findMany: async () => [] },
    } as any;
    const fakeDbTwo = {
      gmiEditionReleaseState: {
        findMany: async () => [
          { editionId: "GMI-Q1-2026", lifecycleState: "ACTIVE_UNTIL_SUPERSEDED", supersededBy: null, publicVisible: true },
          { editionId: "GMI-Q2-2026", lifecycleState: "ACTIVE_UNTIL_SUPERSEDED", supersededBy: null, publicVisible: true },
        ],
      },
    } as any;

    await expect(resolveCurrentGmiEdition(fakeDbZero)).rejects.toThrow(/expected exactly one active public edition/);
    await expect(resolveCurrentGmiEdition(fakeDbTwo)).rejects.toThrow(/expected exactly one active public edition/);
  });
});