// lib/content/server-override.ts
/**
 * Server-side override for content functions
 * This should ONLY be imported in server-side contexts.
 */

type GeneratedMod = { allDocuments?: any[] };

let allDocuments: any[] = [];

function loadGeneratedCJS(): GeneratedMod | null {
  try {
    // Preferred path (your repo already maps this to .contentlayer/generated)
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    return require("contentlayer/generated");
  } catch {
    return null;
  }
}

async function loadGeneratedESM(): Promise<GeneratedMod | null> {
  try {
    const mod: any = await import("contentlayer/generated");
    return mod;
  } catch {
    return null;
  }
}

async function initAllDocuments(): Promise<void> {
  const cjs = loadGeneratedCJS();
  if (cjs?.allDocuments) {
    allDocuments = cjs.allDocuments;
    return;
  }

  const esm = await loadGeneratedESM();
  if (esm?.allDocuments) {
    allDocuments = esm.allDocuments;
    return;
  }

  console.warn("[server-override] Could not load contentlayer generated files");
  allDocuments = [];
}

// Fire on module load (server-only)
const initPromise = initAllDocuments();

/**
 * Override the stub functions with real implementations.
 * Call this at the top of server-only modules if needed.
 */
export async function overrideContentFunctions() {
  await initPromise;

  // Use relative require to avoid TS path alias runtime failures
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const contentModule = require("../content");

  contentModule.getAllContentlayerDocs = function () {
    return allDocuments || [];
  };

  contentModule.getPublishedPosts = function () {
    return (allDocuments || []).filter((doc: any) => !doc.draft && doc.published !== false);
  };

  contentModule.getDocumentBySlug = function (slug: string) {
    const normalized = String(slug || "").replace(/^\/+|\/+$/g, "");

    const compare = (s: string) => String(s || "").replace(/^\/+|\/+$/g, "");

    for (const doc of allDocuments || []) {
      const docSlug = compare(doc.slug || "");
      const flat = compare(doc._raw?.flattenedPath || "");
      const href = compare(String(doc.href || "").replace(/^\//, ""));

      if (docSlug === normalized || flat === normalized || href === normalized) return doc;
    }

    return null;
  };

  // Aliases
  contentModule.getDocBySlug = contentModule.getDocumentBySlug;
  contentModule.getPostBySlug = contentModule.getDocumentBySlug;
}

// Direct “real” exports (optional convenience)
export async function getAllContentlayerDocsReal() {
  await initPromise;
  return allDocuments || [];
}

export async function getPublishedPostsReal() {
  await initPromise;
  return (allDocuments || []).filter((doc: any) => !doc.draft && doc.published !== false);
}

export async function getDocumentBySlugReal(slug: string) {
  await initPromise;

  const normalized = String(slug || "").replace(/^\/+|\/+$/g, "");
  const compare = (s: string) => String(s || "").replace(/^\/+|\/+$/g, "");

  for (const doc of allDocuments || []) {
    const docSlug = compare(doc.slug || "");
    const flat = compare(doc._raw?.flattenedPath || "");
    const href = compare(String(doc.href || "").replace(/^\//, ""));

    if (docSlug === normalized || flat === normalized || href === normalized) return doc;
  }

  return null;
}

export const getDocBySlugReal = getDocumentBySlugReal;
export const getPostBySlugReal = getDocumentBySlugReal;