// lib/content/queries.ts
// Server-safe, build-safe Contentlayer adapter exports.

type AnyDoc = Record<string, any>;

// We want to avoid hard-crashing if Contentlayer hasn't generated yet.
async function loadGenerated(): Promise<any> {
  // Try the common Contentlayer v2 import path first:
  try {
    return await import("contentlayer/generated");
  } catch {
    // Fallback for some Windows/contentlayer2 setups
    return await import("../../.contentlayer/generated");
  }
}

export async function getAllCanonsAsync(): Promise<AnyDoc[]> {
  const gen = await loadGenerated();

  // Typical names: allCanons, allDownloads
  const list: AnyDoc[] =
    gen.allCanons ||
    gen.allCanon ||
    gen.allCanonDocs ||
    gen.allCanonDocuments ||
    [];

  return Array.isArray(list) ? list : [];
}

export async function getAllDownloadsAsync(): Promise<AnyDoc[]> {
  const gen = await loadGenerated();

  const list: AnyDoc[] =
    gen.allDownloads ||
    gen.allDownload ||
    gen.allDownloadDocs ||
    gen.allDownloadDocuments ||
    [];

  return Array.isArray(list) ? list : [];
}

/**
 * Sync wrappers for build-time scripts that are already running in Node.
 * If you prefer, you can convert callers to async and delete these.
 */
export function getAllCanons(): AnyDoc[] {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const gen = safeRequireGenerated();
  return (
    gen.allCanons ||
    gen.allCanon ||
    gen.allCanonDocs ||
    gen.allCanonDocuments ||
    []
  );
}

export function getAllDownloads(): AnyDoc[] {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const gen = safeRequireGenerated();
  return (
    gen.allDownloads ||
    gen.allDownload ||
    gen.allDownloadDocs ||
    gen.allDownloadDocuments ||
    []
  );
}

function safeRequireGenerated(): any {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("contentlayer/generated");
  } catch {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("../../.contentlayer/generated");
  }
}