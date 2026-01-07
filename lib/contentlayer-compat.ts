/* lib/contentlayer-compat.ts - HARDENED ABSOLUTE PATH LOADER */

import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

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

const localGeneratedDir = path.join(process.cwd(), ".contentlayer", "generated");
const localIndexMjs = path.join(localGeneratedDir, "index.mjs");

const log = (...args: any[]) => console.log("[contentlayer-compat]", ...args);
const warn = (...args: any[]) => console.warn("[contentlayer-compat]", ...args);
const err = (...args: any[]) => console.error("[contentlayer-compat]", ...args);

function looksNonEmpty(mod: any): mod is GeneratedShape {
  if (!mod || typeof mod !== "object") return false;
  // If at least one collection exists and has length, treat as real.
  const keys = [
    "allPosts",
    "allBooks",
    "allCanons",
    "allDownloads",
    "allEvents",
    "allPrints",
    "allResources",
    "allShorts",
    "allStrategies",
  ] as const;

  return keys.some((k) => Array.isArray((mod as any)[k]) && (mod as any)[k].length > 0);
}

async function loadFromLocalGeneratedDir(): Promise<GeneratedShape | null> {
  // 1) Best-case: require the directory (works if it’s CJS or has proper exports)
  try {
    if (fs.existsSync(localGeneratedDir)) {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require(localGeneratedDir) as GeneratedShape;
      if (looksNonEmpty(mod)) {
        log("SUCCESS: loaded from directory require:", localGeneratedDir);
        return mod;
      }
      // Some setups return an object but empty; keep going.
      if (mod && typeof mod === "object") {
        warn("Directory require returned empty collections; trying index.mjs import next.");
      }
    }
  } catch (e) {
    warn("Directory require failed; trying index.mjs import next.", e);
  }

  // 2) Correct ESM path: dynamic import of index.mjs
  try {
    if (fs.existsSync(localIndexMjs)) {
      const url = pathToFileURL(localIndexMjs).href;
      const mod = (await import(url)) as any;

      // Some ESM outputs put exports under `default`; normalize
      const normalized = (mod?.default && typeof mod.default === "object") ? mod.default : mod;

      if (looksNonEmpty(normalized)) {
        log("SUCCESS: loaded from ESM import:", localIndexMjs);
        return normalized as GeneratedShape;
      }

      warn("ESM import worked but collections appear empty; will fallback.");
    }
  } catch (e) {
    warn("ESM import of index.mjs failed; will fallback.", e);
  }

  return null;
}

function loadFromModuleAlias(): GeneratedShape | null {
  // 3) Module alias fallback
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("contentlayer/generated") as GeneratedShape;
    if (looksNonEmpty(mod)) {
      log('SUCCESS: loaded from module alias "contentlayer/generated".');
      return mod;
    }
    if (mod && typeof mod === "object") {
      warn('Module alias loaded but collections empty; will try JSON last resort.');
    }
  } catch {
    // ignore
  }
  return null;
}

function loadFromCollectionJson(): GeneratedShape {
  // 4) Last resort: parse individual _index.json files
  const collectionMap: Record<string, keyof GeneratedShape> = {
    Book: "allBooks",
    Canon: "allCanons",
    Download: "allDownloads",
    Event: "allEvents",
    Post: "allPosts",
    Print: "allPrints",
    Resource: "allResources",
    Short: "allShorts",
    Strategy: "allStrategies",
  };

  const result: GeneratedShape = {};
  let foundAny = false;

  for (const [dirName, exportName] of Object.entries(collectionMap)) {
    const indexPath = path.join(localGeneratedDir, dirName, "_index.json");
    if (!fs.existsSync(indexPath)) continue;

    try {
      const raw = fs.readFileSync(indexPath, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data)) {
        (result as any)[exportName] = data;
        foundAny = true;
        log(`Loaded ${exportName}: ${data.length} items (JSON fallback)`);
      }
    } catch (e) {
      warn(`Failed to parse ${indexPath}`, e);
    }
  }

  if (!foundAny) {
    err(
      `CRITICAL: No content data found. Expected .contentlayer at: ${localGeneratedDir}. ` +
        `Collections will be empty until contentlayer build runs in this environment.`
    );
  }

  return result;
}

/**
 * IMPORTANT:
 * Next Pages router can evaluate this module at build/prerender time.
 * We MUST avoid top-level async blocking. So we expose an async getter.
 *
 * Call `await getContentlayerData()` inside getStaticProps/getStaticPaths
 * (or inside API handlers).
 */
let _memo: GeneratedShape | null = null;

export async function getContentlayerData(): Promise<GeneratedShape> {
  if (_memo) return _memo;

  log("Looking for generated files at:", localGeneratedDir);

  const local = await loadFromLocalGeneratedDir();
  if (local) {
    _memo = local;
    return _memo;
  }

  const alias = loadFromModuleAlias();
  if (alias) {
    _memo = alias;
    return _memo;
  }

  _memo = loadFromCollectionJson();
  return _memo;
}

/* -------------------------------------------------------------------------- */
/* “SYNC” EXPORTS: safe defaults (empty until getContentlayerData() is used)   */
/* -------------------------------------------------------------------------- */
/**
 * These are provided so legacy imports don’t crash.
 * But to get real data reliably during build, prefer `await getContentlayerData()`.
 */
export const allBooks: ContentLayerDoc[] = [];
export const allCanons: ContentLayerDoc[] = [];
export const allDownloads: ContentLayerDoc[] = [];
export const allEvents: ContentLayerDoc[] = [];
export const allPosts: ContentLayerDoc[] = [];
export const allPrints: ContentLayerDoc[] = [];
export const allResources: ContentLayerDoc[] = [];
export const allShorts: ContentLayerDoc[] = [];
export const allStrategies: ContentLayerDoc[] = [];

export function getAllDocumentsSync(): ContentLayerDoc[] {
  return [
    ...allBooks,
    ...allCanons,
    ...allDownloads,
    ...allEvents,
    ...allPosts,
    ...allPrints,
    ...allResources,
    ...allShorts,
    ...allStrategies,
  ];
}

export type DocumentTypes =
  | "Book"
  | "Canon"
  | "Download"
  | "Event"
  | "Post"
  | "Print"
  | "Resource"
  | "Short"
  | "Strategy";