import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("forensic report stability", () => {
  it("keeps the shared forensic layer free of transform-based layout", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "components", "print", "ForensicMarkLayer.tsx"),
      "utf8",
    );

    expect(source).not.toMatch(/transform\s*:/);
    expect(source).toContain("maxWidth");
  });

  it("keeps Boardroom dossier pages in flow layout with bounded text handling", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "lib", "boardroom", "dossier-pdf.tsx"),
      "utf8",
    );

    expect(source).toContain("function truncate");
    expect(source).toContain("[...continued]");
    expect(source).not.toContain('position: "absolute"');
  });

  it("keeps Boardroom provenance visible in cover and transmission layers", () => {
    const source = fs.readFileSync(
      path.join(process.cwd(), "lib", "boardroom", "dossier-pdf.tsx"),
      "utf8",
    );

    expect(source).toContain("BOARDROOM · CONFIDENTIAL");
    expect(source).toContain("Prepared for");
    expect(source).toContain("Not for redistribution");
  });
});
