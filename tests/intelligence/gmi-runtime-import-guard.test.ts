import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

const runtimeRoots = [
  "pages/intelligence/gmi",
  "pages/api/gmi",
  "pages/admin/intelligence/gmi",
  "pages/api/admin/intelligence/gmi",
];

const runtimeFiles = [
  ...runtimeRoots.flatMap((root) => {
    const fullRoot = path.join(process.cwd(), root);
    if (!fs.existsSync(fullRoot)) return [];
    return fs.readdirSync(fullRoot, { recursive: true })
      .filter((entry) => typeof entry === "string" && /\.(ts|tsx)$/.test(entry))
      .map((entry) => path.join(root, entry));
  }),
  "pages/admin/intelligence/gmi-falsification.tsx",
  "pages/admin/intelligence/gmi-control-plane.tsx",
  "lib/intelligence/gmi-release-authority.ts",
];

const blockedImports = [
  "market-intelligence-call-ledger",
  "gmi-source-appendix-registry",
  "gmi-control-plane",
  "lib/intelligence/seeds",
  "intelligence/seeds",
];

describe("GMI runtime import guard", () => {
  it("keeps public/admin/API runtime surfaces off static seed fixtures", () => {
    const violations = runtimeFiles.flatMap((relativePath) => {
      const fullPath = path.join(process.cwd(), relativePath);
      if (!fs.existsSync(fullPath)) return [];
      const source = fs.readFileSync(fullPath, "utf8");
      return blockedImports
        .filter((blocked) => source.includes(blocked))
        .map((blocked) => `${relativePath} imports or references ${blocked}`);
    });

    expect(violations).toEqual([]);
  });
});
