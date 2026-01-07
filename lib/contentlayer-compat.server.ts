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

// ---- server loader (isolated) ----
// Keep the import specifier STATIC to reduce bundler warnings.
async function loadServer() {
  return import("./contentlayer-compat.server");
}

// ---- async getter (server-only behind dynamic import) ----
export async function getContentlayerData(): Promise<GeneratedShape> {
  const mod = await loadServer();
  return mod.getContentlayerData();
}

export async function getAllDocuments(): Promise<ContentLayerDoc[]> {
  const mod = await loadServer();
  const data = await mod.getContentlayerData();
  return mod.getAllDocumentsSync(data);
}

// IMPORTANT:
// Do NOT export fake sync arrays. They hide bugs and cause silent empty renders.
// If any legacy code needs these names, export async functions instead:

export async function allPosts(): Promise<ContentLayerDoc[]> {
  const d = await getContentlayerData();
  return (d.allPosts ?? []).filter((x: any) => x && !isDraftContent(x));
}
export async function allBooks(): Promise<ContentLayerDoc[]> {
  const d = await getContentlayerData();
  return (d.allBooks ?? []).filter((x: any) => x && !isDraftContent(x));
}
export async function allCanons(): Promise<ContentLayerDoc[]> {
  const d = await getContentlayerData();
  return (d.allCanons ?? []).filter((x: any) => x && !isDraftContent(x));
}
export async function allDownloads(): Promise<ContentLayerDoc[]> {
  const d = await getContentlayerData();
  return (d.allDownloads ?? []).filter((x: any) => x && !isDraftContent(x));
}
export async function allEvents(): Promise<ContentLayerDoc[]> {
  const d = await getContentlayerData();
  return (d.allEvents ?? []).filter((x: any) => x && !isDraftContent(x));
}
export async function allPrints(): Promise<ContentLayerDoc[]> {
  const d = await getContentlayerData();
  return (d.allPrints ?? []).filter((x: any) => x && !isDraftContent(x));
}
export async function allResources(): Promise<ContentLayerDoc[]> {
  const d = await getContentlayerData();
  return (d.allResources ?? []).filter((x: any) => x && !isDraftContent(x));
}
export async function allShorts(): Promise<ContentLayerDoc[]> {
  const d = await getContentlayerData();
  return (d.allShorts ?? []).filter((x: any) => x && !isDraftContent(x));
}
export async function allStrategies(): Promise<ContentLayerDoc[]> {
  const d = await getContentlayerData();
  return (d.allStrategies ?? []).filter((x: any) => x && !isDraftContent(x));
}

// Back-compat: keep this, but make it noisy in dev so it can’t silently break pages.
export function getAllDocumentsSync(): ContentLayerDoc[] {
  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.warn(
      "[contentlayer-compat] getAllDocumentsSync() called in client-safe wrapper. Returning []. Use await getAllDocuments() instead."
    );
  }
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