import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAllBriefs: vi.fn(),
  sanitizeData: vi.fn((value) => value),
}));

vi.mock("@/lib/content/server", () => ({
  getAllBriefs: mocks.getAllBriefs,
  sanitizeData: mocks.sanitizeData,
}));

vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import PublicBriefsIndexPage, { getStaticProps } from "@/pages/briefs/index";

const institutionalAlphaBrief = {
  title: "Frontier Resilience 067 — Beyond Survival Mode",
  description: "A public brief.",
  date: "2026-02-12",
  accessLevel: "public",
  status: "canonical",
  publicationStatus: "published",
  series: "institutional-alpha",
  published: true,
  draft: false,
  _raw: {
    flattenedPath: "briefs/frontier-resilience-beyond-survival-mode",
    sourceFilePath: "briefs/frontier-resilience-beyond-survival-mode.mdx",
  },
};

const sovereignBrief = {
  ...institutionalAlphaBrief,
  title: "Sovereign Intelligence Brief 001",
  series: "sovereign-intelligence",
  _raw: {
    flattenedPath: "briefs/sovereign-intelligence-001",
    sourceFilePath: "briefs/sovereign-intelligence-001.mdx",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("public briefs index", () => {
  it("lists canonical public briefs and excludes restricted or non-canonical records", async () => {
    mocks.getAllBriefs.mockReturnValue([
      institutionalAlphaBrief,
      sovereignBrief,
      {
        ...institutionalAlphaBrief,
        title: "Restricted body should stay hidden",
        accessLevel: "restricted",
      },
      {
        ...institutionalAlphaBrief,
        title: "Draft brief",
        status: "draft",
      },
    ]);

    const response = await getStaticProps({} as never);
    const props = "props" in response ? response.props : null;
    const html = renderToStaticMarkup(<PublicBriefsIndexPage {...(props as any)} />);

    // The page now returns categorized briefs (institutionalAlpha / sovereignIntelligence)
    expect((props as any).institutionalAlpha).toBeDefined();
    expect((props as any).sovereignIntelligence).toBeDefined();

    // Canonical institutional-alpha brief should appear
    expect((props as any).institutionalAlpha).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Frontier Resilience 067 — Beyond Survival Mode",
          href: "/briefs/frontier-resilience-beyond-survival-mode",
        }),
      ])
    );

    // Sovereign brief should appear in sovereignIntelligence
    expect((props as any).sovereignIntelligence).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          title: "Sovereign Intelligence Brief 001",
        }),
      ])
    );

    expect(html).toContain("Frontier Resilience 067");
    expect(html).not.toContain("Restricted body should stay hidden");
    expect(html).not.toContain("Draft brief");

    // No raw body content leaked
    if ((props as any).institutionalAlpha[0]) {
      expect((props as any).institutionalAlpha[0].body).toBeUndefined();
      expect((props as any).institutionalAlpha[0].bodyCode).toBeUndefined();
    }
  });
});
