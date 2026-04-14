/* lib/contentlayer/ssot.ts — SINGLE SOURCE OF TRUTH (lazy, no wildcard re-export)
 *
 * Previous version did `export * from "contentlayer/generated"` plus
 * `import * as Generated from "contentlayer/generated"`, which forced every
 * consumer — even indirect ones — to pull the entire compiled content corpus
 * (316 documents, ~40 MB) into their module graph. This destroyed server-side
 * tree-shaking and contributed directly to the oversize shared chunks.
 *
 * All access is now routed through lazy getters. Callers that only need one
 * collection pay for one collection, and nothing else.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

async function generated(): Promise<any> {
  return await import("contentlayer/generated");
}

export async function getAllBooks(): Promise<any[]> {
  const mod = await generated();
  return mod?.allBooks ?? [];
}

export async function getAllCanons(): Promise<any[]> {
  const mod = await generated();
  return mod?.allCanons ?? [];
}

export async function getAllBriefs(): Promise<any[]> {
  const mod = await generated();
  return mod?.allBriefs ?? [];
}

export async function getAllEditorials(): Promise<any[]> {
  const mod = await generated();
  return mod?.allEditorials ?? [];
}

export async function getAllShorts(): Promise<any[]> {
  const mod = await generated();
  return mod?.allShorts ?? [];
}

export async function getAllPlaybooks(): Promise<any[]> {
  const mod = await generated();
  return mod?.allPlaybooks ?? [];
}

export async function getAllDocuments(): Promise<any[]> {
  const mod = await generated();
  return mod?.allDocuments ?? [];
}
