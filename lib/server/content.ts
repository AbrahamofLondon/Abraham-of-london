// lib/server/content.ts
import fs from "fs";
import path from "path";

export type ResourceDoc = {
  title: string;
  excerpt?: string | null;
  description?: string | null;
  date?: string | null;
  coverImage?: string | null;
  tags?: string[];
  author?: string | null;
  url: string;            // CANONICAL route (must start with /resources/)
  href?: string | null;   // CTA destination only (optional)
  body: { raw: string };
};

const RESOURCES_DIR = path.join(process.cwd(), "content", "resources");

function stripQuotes(s: string) {
  return String(s || "").replace(/^["']|["']$/g, "").trim();
}

function cleanPath(p: string): string {
  const s = String(p || "").trim();
  if (!s) return "";
  return s.split("#")[0]!.split("?")[0]!.replace(/\/+$/, "");
}

function parseFrontmatter(raw: string): Record<string, any> {
  const out: Record<string, any> = {};
  const m = raw.match(/^---\s*([\s\S]*?)\s*---/);
  if (!m) return out;

  const lines = m[1].split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const idx = trimmed.indexOf(":");
    if (idx === -1) continue;

    const key = trimmed.slice(0, idx).trim();
    let val = trimmed.slice(idx + 1).trim();

    // arrays: tags: ["a","b"]
    if (val.startsWith("[") && val.endsWith("]")) {
      try {
        out[key] = JSON.parse(val);
        continue;
      } catch {
        // fall through
      }
    }

    // booleans
    if (val === "true") out[key] = true;
    else if (val === "false") out[key] = false;
    else out[key] = stripQuotes(val);
  }

  return out;
}

function deriveUrlFromFilename(filename: string) {
  const base = filename.replace(/\.(md|mdx)$/i, "");
  return `/resources/${base}`;
}

export async function getAllResources(): Promise<ResourceDoc[]> {
  if (!fs.existsSync(RESOURCES_DIR)) return [];

  const files = fs
    .readdirSync(RESOURCES_DIR)
    .filter((f) => /\.(md|mdx)$/i.test(f));

  const docs: ResourceDoc[] = [];

  for (const file of files) {
    const abs = path.join(RESOURCES_DIR, file);
    const raw = fs.readFileSync(abs, "utf8");
    const fm = parseFrontmatter(raw);

    if (fm.draft === true) continue;

    const explicitUrl = typeof fm.url === "string" ? cleanPath(fm.url) : "";
    const url =
      explicitUrl && explicitUrl.startsWith("/resources/")
        ? explicitUrl
        : deriveUrlFromFilename(file);

    const href = typeof fm.href === "string" ? cleanPath(fm.href) : "";

    docs.push({
      title: typeof fm.title === "string" ? fm.title : "Untitled Resource",
      excerpt: typeof fm.excerpt === "string" ? fm.excerpt : null,
      description: typeof fm.description === "string" ? fm.description : null,
      date: typeof fm.date === "string" ? fm.date : null,
      coverImage: typeof fm.coverImage === "string" ? fm.coverImage : null,
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      author: typeof fm.author === "string" ? fm.author : null,
      href: href || null,
      url,
      body: { raw },
    });
  }

  // stable sort (newest first by date string)
  docs.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return docs;
}

export async function getResourceByUrlPath(
  urlPath: string
): Promise<ResourceDoc | null> {
  const target = cleanPath(urlPath);
  if (!target) return null;

  const all = await getAllResources();
  return all.find((r) => cleanPath(r.url) === target) ?? null;
}