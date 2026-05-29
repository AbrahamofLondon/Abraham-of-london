import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAllIntelligence: vi.fn(),
  sanitizeData: vi.fn((value: unknown) => value),
}));

vi.mock("@/lib/content/server", () => ({
  getAllIntelligence: mocks.getAllIntelligence,
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

import PublicIntelligencePage, { getStaticProps } from "@/pages/intelligence/[slug]";

const publicIntelligence = {
  title: "When Delay Becomes a Governance Cost",
  subtitle: "The market signal hidden inside unresolved decisions",
  description: "A public decision-intelligence brief.",
  summary: "A public decision-intelligence brief.",
  date: "2026-05-17",
  category: "Decision Intelligence",
  accessLevel: "public",
  published: true,
  draft: false,
  bodyCode: "<p>Public intelligence body</p>",
  slug: "/intelligence/decision-delay-governance-cost",
  _raw: {
    flattenedPath: "intelligence/decision-delay-governance-cost",
    sourceFilePath: "intelligence/decision-delay-governance-cost.mdx",
  },
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("public intelligence route", () => {
  it("renders a public intelligence item at /intelligence/[slug]", async () => {
    mocks.getAllIntelligence.mockReturnValue([publicIntelligence]);

    const response = await getStaticProps({
      params: { slug: "decision-delay-governance-cost" },
    } as never);
    const props = "props" in response ? response.props : null;
    const html = renderToStaticMarkup(<PublicIntelligencePage {...(props as any)} />);

    expect(props).toMatchObject({
      bareSlug: "decision-delay-governance-cost",
    });
    expect(html).toContain("When Delay Becomes a Governance Cost");
    expect(html).toContain("Public intelligence");
    expect(html).toContain("Public intelligence body");
  });

  it("does not render restricted or draft intelligence through the public family", async () => {
    mocks.getAllIntelligence.mockReturnValue([
      {
        ...publicIntelligence,
        accessLevel: "inner-circle",
      },
      {
        ...publicIntelligence,
        draft: true,
      },
    ]);

    const response = await getStaticProps({
      params: { slug: "decision-delay-governance-cost" },
    } as never);

    expect(response).toMatchObject({ notFound: true });
  });
});
