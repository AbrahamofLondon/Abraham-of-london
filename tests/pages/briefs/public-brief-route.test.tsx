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

vi.mock("@/components/mdx/SafeMDXRenderer", () => ({
  default: ({ code }: { code: string }) => <div data-testid="body">{code}</div>,
}));

vi.mock("@/lib/content/render-body", () => ({
  getRenderableBody: (doc: any) => ({ code: doc?.bodyCode || "" }),
}));

import PublicBriefPage, { getStaticPaths, getStaticProps } from "@/pages/briefs/[slug]";

const publicBrief = {
  title: "Frontier Resilience 067 — Beyond Survival Mode",
  subtitle: "How institutions move from perpetual triage back into governed action",
  description: "A strategic brief on the transition out of survival mode.",
  summary: "A strategic brief on the transition out of survival mode.",
  date: "2026-02-12",
  readTime: "8 min",
  category: "governance",
  tags: ["frontier-resilience"],
  accessLevel: "public",
  status: "canonical",
  published: true,
  draft: false,
  bodyCode: "<p>Public body</p>",
  slug: "/briefs/frontier-resilience-beyond-survival-mode",
  _raw: {
    flattenedPath: "briefs/frontier-resilience-beyond-survival-mode",
    sourceFilePath: "briefs/frontier-resilience-beyond-survival-mode.mdx",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("public brief route", () => {
  it("renders a public canonical brief at /briefs/[slug]", async () => {
    mocks.getAllBriefs.mockReturnValue([publicBrief]);

    const response = await getStaticProps({
      params: { slug: "frontier-resilience-beyond-survival-mode" },
    } as never);
    const props = "props" in response ? response.props : null;
    const html = renderToStaticMarkup(<PublicBriefPage {...(props as any)} />);

    expect(html).toContain("Frontier Resilience 067");
    expect(html).toContain("Public brief");
    expect(html).toContain("Public body");
  });

  it("generates a public route param for the canonical public brief", async () => {
    mocks.getAllBriefs.mockReturnValue([publicBrief]);

    await expect(getStaticPaths({} as never)).resolves.toMatchObject({
      paths: [{ params: { slug: "frontier-resilience-beyond-survival-mode" } }],
    });
  });

  it("does not render restricted, draft, non-canonical, or vault-only briefs through the public family", async () => {
    mocks.getAllBriefs.mockReturnValue([
      {
        ...publicBrief,
        accessLevel: "member",
      },
      {
        ...publicBrief,
        draft: true,
      },
      {
        ...publicBrief,
        status: "draft",
      },
      {
        ...publicBrief,
        slug: "/vault/briefs/brief-001-modern-household",
        _raw: {
          flattenedPath: "vault/briefs/brief-001-modern-household",
          sourceFilePath: "vault/briefs/brief-001-modern-household.mdx",
        },
      },
    ]);

    const response = await getStaticProps({
      params: { slug: "frontier-resilience-beyond-survival-mode" },
    } as never);

    expect(response).toMatchObject({ notFound: true });
  });
});
