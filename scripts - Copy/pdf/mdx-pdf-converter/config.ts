// scripts/pdf/mdx-pdf-converter/config.ts
import fs from "fs";
import path from "path";

export type PaperFormat = "A4" | "Letter" | "A3";
export type Quality = "standard" | "premium" | "enterprise";

export type AccessLevel = "free" | "basic" | "premium" | "enterprise" | "restricted";

export type TierConfig = {
  slug: string; // e.g. "free" | "member" | "inner-circle"
  displayName: string;
  accessLevel: AccessLevel;
  generatePdf: boolean;
  generateFillable: boolean;
  formats: PaperFormat[];
  quality: Quality[];
};

export type DocumentRegistryEntry = {
  mdxPath: string; // absolute or relative
  pdfName: string; // base output name
  displayName: string;
  category: string;
  description: string;
  tiers: TierConfig[];
};

// -----------------------------------------------------------------------------
// Output strategy (BRANDED / CANONICAL)
// - This generator only handles MDX sources; output goes into content-downloads.
// - You can route by category later if you want.
// -----------------------------------------------------------------------------

export function outputPublicPathForMdx(args: {
  pdfName: string;
  tier: string;
  format: PaperFormat;
  quality: Quality;
}) {
  const { pdfName, tier, format, quality } = args;

  // Keep filenames stable and clean; put tier/format/quality into folders to avoid collisions.
  // Example:
  // /assets/downloads/content-downloads/free/A4/premium/leadership-playbook.pdf
  const safeTier = String(tier || "free").trim().toLowerCase();
  const safeFormat = String(format || "A4").trim();
  const safeQuality = String(quality || "standard").trim().toLowerCase();

  return `/assets/downloads/content-downloads/${safeTier}/${safeFormat}/${safeQuality}/${pdfName}.pdf`;
}

export function repoAbsFromPublic(publicPath: string) {
  const rel = String(publicPath || "").replace(/^\/+/, "");
  return path.join(process.cwd(), "public", rel);
}

// -----------------------------------------------------------------------------
// MDX discovery
// -----------------------------------------------------------------------------

export function discoverMdxFiles(rootRel = path.join("content", "downloads")): string[] {
  const root = path.join(process.cwd(), rootRel);
  if (!fs.existsSync(root)) return [];

  const out: string[] = [];

  function walk(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) walk(abs);
      else if (e.isFile() && e.name.toLowerCase().endsWith(".mdx")) out.push(abs);
    }
  }

  walk(root);
  return out.sort((a, b) => a.localeCompare(b));
}

// -----------------------------------------------------------------------------
// Registry (you can expand this; script auto-discovers the rest)
// -----------------------------------------------------------------------------

export const DOCUMENT_REGISTRY: DocumentRegistryEntry[] = [
  // Example items (keep or remove):
  // {
  //   mdxPath: path.join(process.cwd(), "content", "downloads", "leadership-playbook.mdx"),
  //   pdfName: "leadership-playbook",
  //   displayName: "The Leadership Playbook",
  //   category: "Leadership",
  //   description: "A field manual for operators.",
  //   tiers: [
  //     { slug: "free", displayName: "Free", accessLevel: "free", generatePdf: true, generateFillable: false, formats: ["A4"], quality: ["standard", "premium"] },
  //   ],
  // },

  // Your current set can remain registry-less; auto-discovery will pick them up.
];