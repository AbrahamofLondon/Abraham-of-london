import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/Layout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import IntelligenceIndexPage from "@/pages/intelligence/index";

describe("intelligence landing", () => {
  it("links to the public delay-governance brief without rendering the index manuscript wholesale", () => {
    const html = renderToStaticMarkup(<IntelligenceIndexPage />);

    expect(html).toContain("/intelligence/decision-delay-governance-cost");
    expect(html).toContain("Read public intelligence");
    expect(html).toContain("Intelligence is not the accumulation of information.");
    expect(html).not.toContain("What belongs here");
  });
});
