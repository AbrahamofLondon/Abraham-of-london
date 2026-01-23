import fs from "fs";
import path from "path";

type ScanResult = {
  file: string;
  changed: boolean;
  notes: string[];
};

const ROOT = process.cwd();
const CONTENT_ROOT = path.join(ROOT, "content");
const TARGET_DIRS = [
  "downloads",
  "blog",
  "shorts",
  "books",
  "canon",
  "events",
  "prints",
  "resources",
  "strategy",
];

const MDX_EXT = new Set([".mdx", ".md"]);

function walk(dir: string, out: string[] = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (
        entry.name === "node_modules" ||
        entry.name === ".git" ||
        entry.name === ".next" ||
        entry.name === ".contentlayer" ||
        entry.name === "_templates"
      ) continue;
      walk(abs, out);
    } else {
      const ext = path.extname(entry.name).toLowerCase();
      if (MDX_EXT.has(ext)) out.push(abs);
    }
  }
  return out;
}

/**
 * Split into segments: TAG vs TEXT
 * TAG = anything like <...>
 * TEXT = everything else
 *
 * We only sanitize TEXT segments.
 */
function splitTagText(input: string): Array<{ kind: "tag" | "text"; value: string }> {
  const parts: Array<{ kind: "tag" | "text"; value: string }> = [];
  const tagRe = /<[^>]*>/g;

  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = tagRe.exec(input))) {
    const start = m.index;
    const end = tagRe.lastIndex;

    if (start > last) parts.push({ kind: "text", value: input.slice(last, start) });
    parts.push({ kind: "tag", value: input.slice(start, end) });

    last = end;
  }

  if (last < input.length) parts.push({ kind: "text", value: input.slice(last) });
  return parts;
}

/**
 * Escape comparisons in TEXT only.
 * We handle common patterns that trigger MDX JSX parsing when adjacent to emphasis etc.
 *
 * Examples we want safe:
 *   **<50** -> **&lt;50**
 *   > 10 (as plain text) -> &gt;10
 *
 * We do NOT touch markdown blockquotes (line starting with > followed by space).
 */
function sanitizeTextSegment(text: string, notes: string[]) {
  let out = text;

  // Do not break blockquotes:
  // Temporarily protect lines that begin with ">" or "> " (markdown quote)
  const protectedQuotes: string[] = [];
  out = out.replace(/^(>.*)$/gm, (line) => {
    protectedQuotes.push(line);
    return `__PROTECTED_BLOCKQUOTE_${protectedQuotes.length - 1}__`;
  });

  const before = out;

  // Replace "<number" and ">number" in text contexts
  // Conservative: require digit soon after and not already an entity
  out = out.replace(/(^|[^&])<\s*(\d+)/g, (_m, p1, num) => {
    notes.push(`Escaped "<${num}" -> "&lt;${num}"`);
    return `${p1}&lt;${num}`;
  });

  out = out.replace(/(^|[^&])>\s*(\d+)/g, (_m, p1, num) => {
    notes.push(`Escaped ">${num}" -> "&gt;${num}"`);
    return `${p1}&gt;${num}`;
  });

  // Restore protected blockquotes
  out = out.replace(/__PROTECTED_BLOCKQUOTE_(\d+)__/g, (_m, idxStr) => {
    const idx = Number(idxStr);
    return protectedQuotes[idx] ?? _m;
  });

  return { out, changed: out !== before };
}

function sanitizeFile(raw: string, file: string): { out: string; changed: boolean; notes: string[] } {
  const notes: string[] = [];

  const segments = splitTagText(raw);

  let changed = false;
  const rebuilt = segments.map((seg) => {
    if (seg.kind === "tag") return seg.value;

    const r = sanitizeTextSegment(seg.value, notes);
    if (r.changed) changed = true;
    return r.out;
  }).join("");

  // Extra safety: if our sanitizer accidentally produced "<tag&gt;" inside tags,
  // do a final repair only inside tags (rare, but cheap insurance).
  if (changed) {
    const repaired = rebuilt.replace(/(<[^>]*?)&gt;([^>]*>)/g, "$1>$2").replace(/(<[^>]*?)&lt;([^>]*>)/g, "$1<$2");
    return { out: repaired, changed: repaired !== raw, notes };
  }

  return { out: rebuilt, changed, notes };
}

function main() {
  console.log("========================================");
  console.log("🧼 MDX SANITIZER v2 (TEXT-ONLY, JSX-SAFE)");
  console.log("========================================");

  const roots = TARGET_DIRS.map((d) => path.join(CONTENT_ROOT, d));
  const files = roots.flatMap((dir) => walk(dir));

  const results: ScanResult[] = [];

  for (const abs of files) {
    const rel = path.relative(ROOT, abs);
    const raw = fs.readFileSync(abs, "utf8");
    const { out, changed, notes } = sanitizeFile(raw, rel);

    if (changed) fs.writeFileSync(abs, out, "utf8");

    results.push({ file: rel, changed, notes });
  }

  const changedFiles = results.filter(r => r.changed);
  console.log(`Scanned: ${results.length}`);
  console.log(`Changed: ${changedFiles.length}`);

  if (changedFiles.length) {
    console.log("\nChanged files:");
    for (const r of changedFiles) {
      console.log(`- ${r.file}`);
      r.notes.slice(0, 6).forEach(n => console.log(`   • ${n}`));
      if (r.notes.length > 6) console.log(`   • ... (${r.notes.length - 6} more)`);
    }
  }

  console.log("========================================");
}

main();