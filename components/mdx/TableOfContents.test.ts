/**
 * @vitest-environment jsdom
 */

import { afterEach, describe, expect, it } from "vitest";
import { collectHeadings, resolveTocRoot } from "./TableOfContents";

describe("book table of contents scoping", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("does not fall back to global layout content when reader content is absent", () => {
    document.body.innerHTML = `
      <footer class="aol-mdx-content">
        <h2>Doctrine</h2>
        <h2>Works</h2>
        <h2>Intelligence</h2>
      </footer>
    `;

    expect(resolveTocRoot()).toBeNull();
  });

  it("collects headings only from the explicit reader content container", () => {
    document.body.innerHTML = `
      <main>
        <section class="aol-mdx-content">
          <h2>Doctrine</h2>
          <h2>Works</h2>
        </section>
        <article data-reader-content="true">
          <h1>THE ARCHITECTURE OF ASCENSION</h1>
          <h2>12 Pillars for the Sovereign Household</h2>
          <h2>PROLOGUE: THE GEOMETRY OF GOVERNANCE</h2>
          <h3>PILLAR I</h3>
        </article>
      </main>
    `;

    const root = resolveTocRoot();
    const headings = collectHeadings(root);

    expect(headings.map((heading) => heading.text)).toEqual([
      "THE ARCHITECTURE OF ASCENSION",
      "12 Pillars for the Sovereign Household",
      "PROLOGUE: THE GEOMETRY OF GOVERNANCE",
      "PILLAR I",
    ]);
    expect(headings.map((heading) => heading.text)).not.toContain("Doctrine");
    expect(headings.map((heading) => heading.text)).not.toContain("Works");
  });

  it("ignores navigation and footer headings inside the reader boundary", () => {
    document.body.innerHTML = `
      <article data-reader-content="true">
        <nav><h2>Archive</h2></nav>
        <h1>THE ARCHITECTURE OF ASCENSION</h1>
        <footer><h2>Trust</h2></footer>
      </article>
    `;

    const headings = collectHeadings(resolveTocRoot());

    expect(headings.map((heading) => heading.text)).toEqual(["THE ARCHITECTURE OF ASCENSION"]);
  });
});
