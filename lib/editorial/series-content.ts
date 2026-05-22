import type { ContentDoc } from "@/lib/contentlayer-helper";

type NodeFs = typeof import("fs");
type NodePath = typeof import("path");

function assertServerRuntime(): void {
  if (typeof window !== "undefined") {
    throw new Error("Editorial series content can only be read on the server.");
  }
}

function getNodeModules(): {
  fs: NodeFs;
  path: NodePath;
  indexPath: string;
} {
  assertServerRuntime();

  // eslint-disable-next-line no-eval
  const req = eval("require") as NodeRequire;
  const fs = req("fs") as NodeFs;
  const path = req("path") as NodePath;

  return {
    fs,
    path,
    indexPath: path.join(
      process.cwd(),
      ".contentlayer",
      "generated",
      "EditorialSeriesPart",
      "_index.json",
    ),
  };
}

function safeSlug(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function getEditorialSeriesPartDocuments(): ContentDoc[] {
  const { fs, indexPath } = getNodeModules();

  if (!fs.existsSync(indexPath)) {
    return [];
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(indexPath, "utf8")) as unknown;
    return Array.isArray(parsed) ? (parsed as ContentDoc[]) : [];
  } catch {
    return [];
  }
}

export function getEditorialSeriesPartDocument(
  mdxSlug: string,
): ContentDoc | null {
  const target = safeSlug(mdxSlug);
  if (!target) return null;

  return (
    getEditorialSeriesPartDocuments().find((doc) => {
      const docSlug =
        safeSlug(doc.slug) ||
        safeSlug(doc.slugSafe) ||
        safeSlug(doc._raw?.sourceFileName).replace(/\.(md|mdx)$/i, "");

      return docSlug === target;
    }) ?? null
  );
}
