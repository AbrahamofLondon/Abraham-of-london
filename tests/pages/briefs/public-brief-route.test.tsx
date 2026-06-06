import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAllBriefs: vi.fn(),
  sanitizeData: vi.fn((value: unknown) => value),
}));

vi.mock("@/lib/content/server", () => ({
  getAllBriefs: mocks.getAllBriefs,
  sanitizeData: mocks.sanitizeData,
}));

vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Pages use renderDocBodyToStaticHtml + StaticMDXRenderer from static-mdx-runtime.
// Mock them so the body content flows through without the real content classifier.
vi.mock("@/lib/mdx/static-mdx-runtime", () => ({
  renderDocBodyToStaticHtml: (doc: any) => ({
    html: doc?.bodyCode ?? doc?.body?.code ?? "",
    mode: "raw-mdx" as const,
  }),
  StaticMDXRenderer: ({ html }: { html?: string; doc?: any; className?: string }) =>
    html ? React.createElement("div", { "data-testid": "mdx-body", dangerouslySetInnerHTML: { __html: html } }) : null,
}));

import PublicBriefPage, { getStaticPaths, getStaticProps } from "@/pages/briefs/[slug]";

const publicBrief = {
  title: "Institutional Alpha — The Hidden Cost of Flattering Data",
  subtitle: "Why optimistic metrics decay into governance risk",
  description: "A strategic brief on reporting integrity.",
  summary: "A strategic brief on reporting integrity.",
  date: "2026-02-12",
  readTime: "8 min",
  category: "governance",
  tags: ["institutional-alpha"],
  accessLevel: "public",
  status: "canonical",
  publicationStatus: "published",
  published: true,
  draft: false,
  bodyCode: "<p>Public body</p>",
  slug: "/briefs/institutional-alpha-the-hidden-cost-of-flattering-data",
  _raw: {
    flattenedPath: "briefs/institutional-alpha-the-hidden-cost-of-flattering-data",
    sourceFilePath: "briefs/institutional-alpha-the-hidden-cost-of-flattering-data.mdx",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("public brief route", () => {
  it("renders a public canonical brief at /briefs/[slug]", async () => {
    mocks.getAllBriefs.mockReturnValue([publicBrief]);

    const response = await getStaticProps({
      params: { slug: "institutional-alpha-the-hidden-cost-of-flattering-data" },
    } as never);
    const props = "props" in response ? response.props : null;
    const html = renderToStaticMarkup(<PublicBriefPage {...(props as any)} />);

    expect(html).toContain("Institutional Alpha");
    expect(html).toContain("Public brief");
    expect(html).toContain("Public body");
  });

  it("generates a public route param for the canonical public brief", async () => {
    mocks.getAllBriefs.mockReturnValue([publicBrief]);

    await expect(getStaticPaths({} as never)).resolves.toMatchObject({
      paths: [{ params: { slug: "institutional-alpha-the-hidden-cost-of-flattering-data" } }],
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
      params: { slug: "institutional-alpha-the-hidden-cost-of-flattering-data" },
    } as never);

    expect(response).toMatchObject({ notFound: true });
  });
});
