/* lib/contentlayer-compat.ts - SAFE (client-bundle friendly) */

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

// ---- pure helpers (safe in client bundle) ----
export function normalizeSlug(input: any): string {
  const raw =
    typeof input === "string"
      ? input
      : input?.slug ?? input?._raw?.flattenedPath ?? "";
  return String(raw || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

export function isDraftContent(doc: any): boolean {
  return doc?.draft === true || doc?._raw?.sourceFileDir === "drafts";
}

export function getAccessLevel(doc: any): string {
  return String(doc?.accessLevel ?? doc?.tier ?? "public");
}

export function getDocHref(doc: any): string {
  const slug = normalizeSlug(doc);
  const kind =
    (doc?._type ?? doc?.type ?? "").toString().toLowerCase() ||
    (doc?._raw?.sourceFileDir ?? "").split(/[\\/]/).pop()?.toLowerCase() ||
    "";

  // Map your doc types to routes (adjust if your routes differ)
  if (kind.includes("post") || kind.includes("blog")) return `/blog/${slug}`;
  if (kind.includes("book")) return `/books/${slug}`;
  if (kind.includes("canon")) return `/canon/${slug}`;
  if (kind.includes("download")) return `/downloads/${slug}`;
  if (kind.includes("event")) return `/events/${slug}`;
  if (kind.includes("print")) return `/prints/${slug}`;
  if (kind.includes("resource")) return `/resources/${slug}`;
  if (kind.includes("short")) return `/shorts/${slug}`;
  if (kind.includes("strategy")) return `/strategy/${slug}`;

  return `/${slug}`;
}

// ---- async getter (server-only behind dynamic import) ----
export async function getContentlayerData(): Promise<GeneratedShape> {
  const mod = await import("./contentlayer-compat.server");
  return mod.getContentlayerData();
}

export async function getAllDocuments(): Promise<ContentLayerDoc[]> {
  const mod = await import("./contentlayer-compat.server");
  const data = await mod.getContentlayerData();
  return mod.getAllDocumentsSync(data);
}

// Named export your per-collection arrays as “async access” only.
// (Avoid exporting sync arrays here; they cause client bundling of server logic.)
export const allBooks: ContentLayerDoc[] = [];
export const allCanons: ContentLayerDoc[] = [];
export const allDownloads: ContentLayerDoc[] = [];
export const allEvents: ContentLayerDoc[] = [];
export const allPosts: ContentLayerDoc[] = [];
export const allPrints: ContentLayerDoc[] = [];
export const allResources: ContentLayerDoc[] = [];
export const allShorts: ContentLayerDoc[] = [];
export const allStrategies: ContentLayerDoc[] = [];

// Back-compat: some files referenced getAllDocumentsSync in errors
export function getAllDocumentsSync(): ContentLayerDoc[] {
  // Intentionally empty in the safe wrapper; server should call getAllDocuments() instead.
  return [];
}

// Default export for legacy `import Contentlayer from "@/lib/contentlayer"`
const CompatDefault = {
  normalizeSlug,
  isDraftContent,
  getAccessLevel,
  getDocHref,
  getContentlayerData,
  getAllDocuments,
};
export default CompatDefault;