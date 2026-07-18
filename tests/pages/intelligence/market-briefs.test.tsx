import { describe, expect, it } from "vitest";

import { getStaticProps } from "@/pages/intelligence/market";

describe("market intelligence gateway", () => {
  it("emits current, reference and upcoming edition state with live links only where public", async () => {
    const response = await getStaticProps({} as never);
    const props = "props" in response ? response.props : null;

    expect(props).toMatchObject({
      current: expect.objectContaining({
        editionId: "GMI-Q2-2026",
        href: "/intelligence/global-market-intelligence-q2-2026",
        isPublic: true,
        isPurchasable: true,
      }),
      reference: [
        expect.objectContaining({
          editionId: "GMI-Q1-2026",
          href: "/intelligence/global-market-intelligence-q1-2026",
          isPublic: true,
          isPurchasable: false,
        }),
      ],
      upcoming: expect.objectContaining({
        editionId: "GMI-Q3-2026",
        href: null,
        isPublic: false,
        isPurchasable: false,
      }),
    });
  });
});
