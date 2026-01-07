/* lib/contentlayer-compat.server.ts - SERVER ONLY */
import fs from "fs";
import path from "path";

export type ContentLayerDoc = any;

export type GeneratedShape = {
  allBooks?: ContentLayerDoc[];
  allCanons?: ContentLayerDoc[];
  allDownloads?: ContentLayerDoc[];
  allEvents?: ContentLayerDoc[];
  allPosts?: ContentLayerDoc[];
  allPrints?: ContentLayerDoc[];
  allResources?: ContentLayerDoc[];
  allShorts?: ContentLayerDoc[];
  allStrategies?: ContentLayerDoc[];
};

let _cache: GeneratedShape | null = null;

function tryRequireGenerated(): GeneratedShape {
  const localGeneratedDir = path.join(process.cwd(), ".contentlayer", "generated");
  const localIndexJs = path.join(localGeneratedDir, "index.js");
  const localIndexMjs = path.join(localGeneratedDir, "index.mjs");

  console.log(`[contentlayer-compat] Looking for generated files at: ${localGeneratedDir}`);

  if (fs.existsSync(localIndexJs)) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require(localIndexJs) as GeneratedShape;
      if (mod && Object.keys(mod).length > 0) {
        console.log(`[contentlayer-compat] SUCCESS: Loaded data from ${localIndexJs}`);
        return mod;
      }
    } catch (err) {
      console.warn(`[contentlayer-compat] Failed to load ${localIndexJs}:`, err);
    }
  }

  // Note: require(.mjs) is not always reliable in Node CJS contexts.
  // We keep it as best-effort.
  if (fs.existsSync(localIndexMjs)) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require(localIndexMjs) as GeneratedShape;
      if (mod && Object.keys(mod).length > 0) {
        console.log(`[contentlayer-compat] SUCCESS: Loaded data from ${localIndexMjs}`);
        return mod;
      }
    } catch (err) {
      console.warn(`[contentlayer-compat] Failed to load ${localIndexMjs}:`, err);
    }
  }

  // Fallback to module alias if present in the environment
  try {
    console.log(`[contentlayer-compat] Falling back to module alias "contentlayer/generated"...`);
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("contentlayer/generated") as GeneratedShape;
    if (mod && Object.keys(mod).length > 0) {
      console.log(`[contentlayer-compat] Loaded from module alias.`);
      return mod;
    }
  } catch {
    // ignore
  }

  // Last resort: parse collection JSON files
  console.log(`[contentlayer-compat] Last resort: Parsing collection JSON files...`);

  const collectionMap: Record<string, keyof GeneratedShape> = {
    Post: "allPosts",
    Book: "allBooks",
    Canon: "allCanons",
    Download: "allDownloads",
    Event: "allEvents",
    Print: "allPrints",
    Resource: "allResources",
    Short: "allShorts",
    Strategy: "allStrategies",
  };

  const result: GeneratedShape = {};
  let foundAny = false;

  for (const [dirName, exportName] of Object.entries(collectionMap)) {
    const indexPath = path.join(localGeneratedDir, dirName, "_index.json");
    if (fs.existsSync(indexPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(indexPath, "utf-8"));
        (result as any)[exportName] = Array.isArray(data) ? data : [];
        foundAny = true;
        console.log(`  -> Loaded ${String(exportName)}: ${(result as any)[exportName].length} items`);
      } catch (err) {
        console.warn(`  -> Failed to parse ${indexPath}:`, err);
      }
    }
  }

  if (foundAny) return result;

  console.error(
    `[contentlayer-compat] CRITICAL: No content data found at ${localGeneratedDir}. Site will have empty collections.`
  );
  return {};
}

export async function getContentlayerData(): Promise<GeneratedShape> {
  if (_cache) return _cache;
  _cache = tryRequireGenerated();
  return _cache;
}

export function getAllDocumentsSync(data: GeneratedShape): ContentLayerDoc[] {
  return [
    ...(data.allBooks ?? []),
    ...(data.allCanons ?? []),
    ...(data.allDownloads ?? []),
    ...(data.allEvents ?? []),
    ...(data.allPosts ?? []),
    ...(data.allPrints ?? []),
    ...(data.allResources ?? []),
    ...(data.allShorts ?? []),
    ...(data.allStrategies ?? []),
  ];
}