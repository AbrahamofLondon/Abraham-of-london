/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/api/_debug/content-counts.ts — REALITY CHECK (filesystem + contentlayer output)
//
// What it does:
// - Counts actual MDX files under /content/* (ground truth)
// - Also reports whether a usable "contentlayer/generated" module resolves in Next runtime
// - Never imports lib/server/pages-data etc (those are legacy and currently misleading)

import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

type Data = {
  ok: boolean;
  meta: {
    cwd: string;
    contentRoot: string;
    contentExists: boolean;
    contentlayerDir: string;
    contentlayerDirExists: boolean;
    contentlayerGeneratedModuleResolvable: boolean;
    note: string;
  };
  counts: Record<string, number>;
  sample: Record<string, Array<{ file: string; slug: string }>>;
  error?: string;
};

function listMdxFilesRecursive(dir: string): string[] {
  const out: string[] = [];
  if (!fs.existsSync(dir)) return out;

  const stack = [dir];
  while (stack.length) {
    const cur = stack.pop()!;
    const entries = fs.readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(abs);
      else if (e.isFile() && (abs.endsWith(".mdx") || abs.endsWith(".md"))) out.push(abs);
    }
  }
  return out;
}

function toSlugFromPath(contentRoot: string, absFile: string): string {
  const rel = absFile
    .replace(contentRoot, "")
    .replace(/\\/g, "/")
    .replace(/^\/+/, "");
  return rel.replace(/\.(mdx|md)$/i, "");
}

function top3(files: string[], contentRoot: string) {
  return files.slice(0, 3).map((f) => ({
    file: f.replace(process.cwd(), "").replace(/\\/g, "/"),
    slug: toSlugFromPath(contentRoot, f),
  }));
}

async function canResolveContentlayerGenerated(): Promise<boolean> {
  // In Next runtime, TS path mapping may allow this even if Node -e cannot.
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const mod = await import("contentlayer/generated");
    return !!mod;
  } catch {
    return false;
  }
}

export default async function handler(_req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    const cwd = process.cwd();
    const contentRoot = path.join(cwd, "content");
    const contentlayerDir = path.join(cwd, ".contentlayer", "generated");

    const contentExists = fs.existsSync(contentRoot);
    const contentlayerDirExists = fs.existsSync(contentlayerDir);

    const collections = [
      "blog",
      "books",
      "canon",
      "downloads",
      "events",
      "prints",
      "resources",
      "shorts",
      "strategy",
      "lexicon",
      "vault",
      "briefs",
      "intelligence",
    ];

    const counts: Record<string, number> = {};
    const sample: Record<string, Array<{ file: string; slug: string }>> = {};

    for (const col of collections) {
      const dir = path.join(contentRoot, col);
      const files = listMdxFilesRecursive(dir);
      counts[col] = files.length;
      sample[col] = top3(files, contentRoot);
    }

    const generatedResolvable = await canResolveContentlayerGenerated();

    return res.status(200).json({
      ok: true,
      meta: {
        cwd,
        contentRoot: contentRoot.replace(/\\/g, "/"),
        contentExists,
        contentlayerDir: contentlayerDir.replace(/\\/g, "/"),
        contentlayerDirExists,
        contentlayerGeneratedModuleResolvable: generatedResolvable,
        note:
          "This endpoint reports ground-truth filesystem counts. If UI shows 0 while these are >0, the UI is NOT consuming SSOT correctly.",
      },
      counts,
      sample,
    });
  } catch (e: any) {
    return res.status(500).json({
      ok: false,
      meta: {
        cwd: process.cwd(),
        contentRoot: path.join(process.cwd(), "content"),
        contentExists: false,
        contentlayerDir: path.join(process.cwd(), ".contentlayer", "generated"),
        contentlayerDirExists: false,
        contentlayerGeneratedModuleResolvable: false,
        note: "Failed to read filesystem counts.",
      },
      counts: {},
      sample: {},
      error: e?.message || String(e),
    });
  }
}