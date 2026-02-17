// lib/server/site-counts.ts
import fs from "fs";
import path from "path";

export type SiteCounts = {
  shorts: number;
  canon: number;
  briefs: number;
  library: number; // PDFs in public/pdfs/registry.json
};

function readPdfRegistryCount(): number {
  try {
    const jsonPath = path.join(process.cwd(), "public", "pdfs", "registry.json");
    if (!fs.existsSync(jsonPath)) return 0;

    const raw = fs.readFileSync(jsonPath, "utf8");
    const parsed = JSON.parse(raw);

    const arr =
      Array.isArray(parsed?.items) ? parsed.items :
      Array.isArray(parsed) ? parsed :
      [];

    return Array.isArray(arr) ? arr.length : 0;
  } catch {
    return 0;
  }
}

export async function getSiteCounts(): Promise<SiteCounts> {
  // Contentlayer is generated at build time. If the import fails, we return 0s rather than exploding.
  let shorts = 0;
  let canon = 0;
  let briefs = 0;

  try {
    const mod: any = await import("contentlayer/generated");
    const allShorts: any[] = Array.isArray(mod?.allShorts) ? mod.allShorts : [];
    const allCanon: any[] = Array.isArray(mod?.allCanons) ? mod.allCanons : [];
    const allBriefs: any[] = Array.isArray(mod?.allBriefs) ? mod.allBriefs : [];

    shorts = allShorts.length;
    canon = allCanon.length;
    briefs = allBriefs.length;
  } catch {
    // keep zeros
  }

  const library = readPdfRegistryCount();

  return { shorts, canon, briefs, library };
}