/**
 * lib/series/data.ts
 *
 * Data access layer for the series resolver.
 *
 * Reads from .contentlayer/generated/<Type>/_index.json files directly —
 * never from require("contentlayer/generated") — so webpack does not bundle
 * the full content corpus (47 MB+) into the server Lambda.
 *
 * Pattern mirrors lib/contentlayer-helper.ts:
 *   eval("require") prevents webpack from statically tracing require("fs"/"path")
 *   process.cwd() + ".contentlayer/generated/<Type>/_index.json" is stable on
 *   both Vercel (cwd = /vercel/path0) and Netlify (cwd = /var/task).
 *
 * For testing, this module is mocked via vi.mock("@/lib/series/data").
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-eval */

/**
 * Read a single contentlayer type's _index.json from disk.
 * Returns an empty array when the file is absent or unparseable.
 */
function readIndexJson(typeDir: string): any[] {
  try {
    // eval("require") prevents webpack from statically tracing this
    // require call and bundling the contentlayer corpus into the chunk.
    const req = eval("require") as NodeRequire;
    const fs = req("fs") as typeof import("fs");
    const path = req("path") as typeof import("path");

    const indexPath = path.join(
      process.cwd(),
      ".contentlayer",
      "generated",
      typeDir,
      "_index.json",
    );

    if (!fs.existsSync(indexPath)) return [];

    const raw = fs.readFileSync(indexPath, "utf8");
    const data = JSON.parse(raw) as unknown;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Get documents for a given doc kind from Contentlayer generated data.
 *
 * "blog"      → Post/_index.json
 * "editorial" → EditorialSeriesPart/_index.json
 *
 * The resolver only reads frontmatter fields (series, seriesOrder, title,
 * excerpt, tags, etc.) — body.raw / body.code are present in the JSON but
 * are never accessed, and they are NOT in the webpack bundle.
 */
export function getDocumentsForKind(docKind: "blog" | "editorial"): any[] {
  if (docKind === "blog") {
    return readIndexJson("Post");
  }
  // EditorialSeriesPart is the dedicated contentlayer type for editorial
  // series chapters (distinct from the Editorial type used for standalone
  // editorial pieces).
  return readIndexJson("EditorialSeriesPart");
}
