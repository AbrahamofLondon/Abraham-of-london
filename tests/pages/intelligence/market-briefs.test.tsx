import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAllBriefs: vi.fn(),
  getPremiumContentList: vi.fn(() => []),
}));

vi.mock("@/lib/content/server", () => ({
  getAllBriefs: mocks.getAllBriefs,
}));

vi.mock("@/lib/premium/content-registry", () => ({
  getPremiumContentList: mocks.getPremiumContentList,
}));

import { getStaticProps } from "@/pages/intelligence/market";

describe("market intelligence related briefs", () => {
  it("emits live links only for public canonical briefs and keeps restricted items metadata-only", async () => {
    mocks.getAllBriefs.mockReturnValue([
      {
        title: "Public brief",
        description: "Readable",
        status: "canonical",
        accessLevel: "public",
        published: true,
        slug: "briefs/public-brief",
      },
      {
        title: "Restricted brief",
        description: "Metadata only",
        status: "canonical",
        accessLevel: "restricted",
        published: true,
        slug: "briefs/restricted-brief",
      },
    ]);

    const response = await getStaticProps({} as never);
    const props = "props" in response ? response.props : null;

    expect(props).toMatchObject({
      briefs: [
        expect.objectContaining({
          title: "Public brief",
          href: "/briefs/public-brief",
          actionLabel: "Read public brief",
          routeStatus: "readable",
        }),
        expect.objectContaining({
          title: "Restricted brief",
          href: "#",
          actionLabel: "View restricted metadata",
          routeStatus: "metadata_only",
        }),
      ],
    });
  });
});
