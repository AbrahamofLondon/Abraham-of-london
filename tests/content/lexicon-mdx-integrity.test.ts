import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const repoRoot = process.cwd();
const lexiconDir = path.join(repoRoot, "content", "lexicon");

function listLexiconFiles(): string[] {
  return fs
    .readdirSync(lexiconDir)
    .filter((name) => name.endsWith(".mdx"))
    .map((name) => path.join(lexiconDir, name))
    .sort();
}

function splitFrontmatter(source: string): { frontmatter: string; body: string } {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/.exec(source);
  if (!match) {
    throw new Error("Missing opening YAML frontmatter block");
  }

  return {
    frontmatter: match[1],
    body: source.slice(match[0].length),
  };
}

describe("lexicon MDX integrity", () => {
  it("keeps every lexicon entry as a standalone MDX document", () => {
    const files = listLexiconFiles();
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const relativePath = path.relative(repoRoot, file).replaceAll(path.sep, "/");
      const source = fs.readFileSync(file, "utf8");
      const { frontmatter, body } = splitFrontmatter(source);

      expect(frontmatter, `${relativePath}: frontmatter should have one title`).toMatch(/^title:\s*/m);
      expect(body.trim().length, `${relativePath}: body is too short`).toBeGreaterThan(150);
      expect(body, `${relativePath}: embedded lexicon corpus marker`).not.toContain("File: `content/lexicon/");
      expect(body, `${relativePath}: raw mdx corpus fence`).not.toContain("```mdx");
      expect(body, `${relativePath}: raw JSX string expression wrapper`).not.toMatch(/^\s*\{\s*["'`]/m);
      expect(body, `${relativePath}: embedded frontmatter delimiter pair`).not.toMatch(
        /(^|\r?\n)---\r?\n(?:title|slug|category|type|docKind|accessLevel|date|status|summary):[\s\S]*?\r?\n---(?=\r?\n|$)/,
      );
      expect(body, `${relativePath}: embedded title field`).not.toMatch(/^title:\s*/m);
      expect(body, `${relativePath}: embedded slug field`).not.toMatch(/^slug:\s*/m);
    }
  });
});
