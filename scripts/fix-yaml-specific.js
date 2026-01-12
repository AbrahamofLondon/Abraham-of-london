// scripts/fix-yaml-specific.js
// Fixes YAML and prevents regression by stripping duplicate frontmatter blocks.
// ESM-safe (repo is "type": "module")

import fs from "fs";
import path from "path";
import yaml from "js-yaml";

const projectRoot = process.cwd();
const contentDir = path.join(projectRoot, "content");

const isMdx = (p) => p.endsWith(".mdx") || p.endsWith(".md");

const normalizeSlashes = (p) => p.replace(/\\/g, "/");

const getTypeFromRelativePath = (relativePath) => {
  const p = normalizeSlashes(relativePath);
  const top = p.split("/")[0];
  switch (top) {
    case "blog":
      return "Post";
    case "books":
      return "Book";
    case "canon":
      return "Canon";
    case "downloads":
      return "Download";
    case "shorts":
      return "Short";
    case "events":
      return "Event";
    case "prints":
      return "Print";
    case "resources":
      return "Resource";
    case "strategy":
      return "Strategy";
    default:
      return "Document";
  }
};

const getAllFiles = (dir) => {
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    if (!fs.existsSync(d)) continue;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && isMdx(full)) out.push(full);
    }
  }
  return out;
};

// Match ALL frontmatter blocks anywhere, at beginning-of-line
const FRONTMATTER_BLOCK_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n?/gm;

// Extract the first FM (must be at file start)
const extractFirstFrontmatter = (raw) => {
  if (!raw.startsWith("---")) return null;
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return null;
  return { yamlText: match[1], body: raw.slice(match[0].length), fmRaw: match[0] };
};

const ensureArray = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]);

const safeTrim = (s) => String(s ?? "").trim();

// Make excerpt a single string (yaml.dump will quote if needed)
const normalizeExcerpt = (v) => {
  if (v == null) return v;
  if (typeof v === "string") return v.replace(/\r?\n+/g, " ").trim();
  return String(v);
};

const normalizeTags = (v) => {
  if (v == null) return v;
  if (Array.isArray(v)) return v.map((x) => safeTrim(x)).filter(Boolean);
  // comma-separated or single string
  const s = String(v);
  if (s.includes(",")) return s.split(",").map((x) => safeTrim(x)).filter(Boolean);
  return [safeTrim(s)].filter(Boolean);
};

const rewriteFrontmatterYaml = (obj) => {
  // Prefer stable key ordering to reduce diffs
  const ordered = {};
  const preferredOrder = [
    "type",
    "title",
    "subtitle",
    "description",
    "excerpt",
    "author",
    "date",
    "updated",
    "slug",
    "tags",
    "category",
    "draft",
    "featured",
    "coverImage",
    "accessLevel",
    "tier",
    "requiresAuth",
    "order",
    "volumeNumber",
    "resourceType",
    "aliases"
  ];
  for (const k of preferredOrder) if (k in obj) ordered[k] = obj[k];
  for (const k of Object.keys(obj)) if (!(k in ordered)) ordered[k] = obj[k];

  return yaml.dump(ordered, {
    lineWidth: 1000,
    quotingType: '"',
    forceQuotes: false,
    noRefs: true
  });
};

let changed = 0;
let stripped = 0;

const files = getAllFiles(contentDir);

for (const filePath of files) {
  const rel = path.relative(contentDir, filePath);
  const raw = fs.readFileSync(filePath, "utf8");

  const first = extractFirstFrontmatter(raw);
  if (!first) continue; // no fm -> let validator handle

  // Parse canonical FM
  let fmObj = {};
  try {
    fmObj = yaml.load(first.yamlText) || {};
  } catch {
    // If YAML is broken, skip here (validator will flag)
    continue;
  }

  // Normalise key fields
  fmObj.title = safeTrim(fmObj.title);
  fmObj.excerpt = normalizeExcerpt(fmObj.excerpt);
  if (fmObj.tags != null) fmObj.tags = normalizeTags(fmObj.tags);
  if (fmObj.aliases != null) fmObj.aliases = ensureArray(fmObj.aliases).map(safeTrim).filter(Boolean);

  // Enforce folder type by default (prevents drift)
  const folderType = getTypeFromRelativePath(rel);
  fmObj.type = folderType;

  // Remove ALL frontmatter blocks from body (including extra ones)
  const bodyBefore = first.body;
  const bodyWithoutAnyFrontmatterBlocks = bodyBefore.replace(FRONTMATTER_BLOCK_RE, (m) => {
    stripped++;
    return "\n\n<!-- stripped: duplicate frontmatter block -->\n\n";
  });

  // Rebuild file with one clean FM + cleaned body
  const newFm = rewriteFrontmatterYaml(fmObj).trimEnd();
  const rebuilt = `---\n${newFm}\n---\n${bodyWithoutAnyFrontmatterBlocks.replace(/^\s*\n/, "")}`;

  if (rebuilt !== raw) {
    fs.writeFileSync(filePath, rebuilt, "utf8");
    changed++;
  }
}

console.log("🔧 Fixing YAML + stripping duplicate frontmatter blocks...");
console.log(`✅ Updated files: ${changed}`);
console.log(`🧽 Stripped duplicate FM blocks: ${stripped}`);
console.log("Done.");