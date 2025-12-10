import { render, screen } from '...';
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
      <Layout pageTitle="Test Page">
        <div>Content</div>
      </Layout>,
    );

    expect(document.title).toContain("Test Page");
  });
});
