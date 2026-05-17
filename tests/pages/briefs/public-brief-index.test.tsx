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

const publicBrief = {
  title: "Frontier Resilience 067 — Beyond Survival Mode",
  description: "A public brief.",
  date: "2026-02-12",
  accessLevel: "public",
  status: "canonical",
  published: true,
  draft: false,
  _raw: {
    flattenedPath: "briefs/frontier-resilience-beyond-survival-mode",
    sourceFilePath: "briefs/frontier-resilience-beyond-survival-mode.mdx",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("public briefs index", () => {
  it("lists canonical public briefs and excludes restricted or non-canonical records", async () => {
    mocks.getAllBriefs.mockReturnValue([
      publicBrief,
      {
        ...publicBrief,
        title: "Restricted body should stay hidden",
        accessLevel: "restricted",
      },
      {
        ...publicBrief,
        title: "Draft brief",
        status: "draft",
      },
    ]);

    const response = await getStaticProps({} as never);
    const props = "props" in response ? response.props : null;
    const html = renderToStaticMarkup(<PublicBriefsIndexPage {...(props as any)} />);

    expect(props).toMatchObject({
      briefs: [
        expect.objectContaining({
          title: "Frontier Resilience 067 — Beyond Survival Mode",
          href: "/briefs/frontier-resilience-beyond-survival-mode",
        }),
      ],
    });
    expect(html).toContain("Frontier Resilience 067");
    expect(html).toContain("Read brief");
    expect(html).not.toContain("Restricted body should stay hidden");
    expect(html).not.toContain("Draft brief");
    expect((props as any).briefs[0].body).toBeUndefined();
    expect((props as any).briefs[0].bodyCode).toBeUndefined();
  });
});
