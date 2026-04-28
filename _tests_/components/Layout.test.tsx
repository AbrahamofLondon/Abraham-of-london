// @vitest-environment jsdom
import { vi, describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";

// Mock next/router
vi.mock("next/router", () => ({
  useRouter: () => ({
    pathname: "/",
    asPath: "/",
    route: "/",
    query: {},
    basePath: "",
    push: vi.fn(),
    replace: vi.fn(),
    reload: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn().mockResolvedValue(undefined),
    beforePopState: vi.fn(),
    events: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
    isFallback: false,
    isReady: true,
    isLocaleDomain: false,
    isPreview: false,
  }),
}));

// Mock next/head — render children into document body so we can inspect them
vi.mock("next/head", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock next/dynamic to return a no-op component
vi.mock("next/dynamic", () => ({
  __esModule: true,
  default: () => () => null,
}));

// Mock heavy sub-components to keep the test focused
vi.mock("@/components/Header", () => ({
  __esModule: true,
  default: () => <header data-testid="header" />,
}));
vi.mock("@/components/EnhancedFooter", () => ({
  __esModule: true,
  default: () => <footer data-testid="footer" />,
}));
vi.mock("@/components/analytics/ConversionIntelligenceTracker", () => ({
  __esModule: true,
  default: () => null,
}));

import Layout from "@/components/Layout";

describe("Layout", () => {
  it("renders children correctly", () => {
    render(
      <Layout>
        <div>Test Content</div>
      </Layout>,
    );

    expect(screen.getByText("Test Content")).toBeInTheDocument();
  });

  it("sets correct page title", () => {
    render(
      <Layout title="Test Page">
        <div>Content</div>
      </Layout>,
    );

    // next/head is mocked to render inline; the <title> appears in the DOM
    expect(document.querySelector("title")?.textContent).toContain("Test Page");
  });
});
