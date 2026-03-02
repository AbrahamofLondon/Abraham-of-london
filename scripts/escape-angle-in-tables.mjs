import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "content");
const exts = new Set([".md", ".mdx"]);

function walk(dir) {
  const out = [];
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(p));
    else if (exts.has(path.extname(ent.name).toLowerCase())) out.push(p);
  }
  return out;
}

function isTableRow(line) {
  const t = line.trim();
  // typical markdown table row: starts and ends with | (or starts with | at least)
  return t.startsWith("|") && t.includes("|");
}

function escapeInTableRow(line) {
  // Only escape "<" when it looks like a comparison (followed by space or digit),
  // and not already escaped as &lt;
  return line
    .replace(/<(?!\/)(?=\s*\d)/g, "&lt;") // < 10, <10
    .replace(/<(?!\/)(?=\s)/g, (m, offset) => {
      // If it's "< " in a table cell, we want &lt;
      // but avoid cases like "<Component" (rare in tables)
      return "&lt;";
    });
}

const files = fs.existsSync(ROOT) ? walk(ROOT) : [];
let changed = 0;

for (const f of files) {
  const text = fs.readFileSync(f, "utf8");
  const lines = text.split(/\r?\n/);

  let inFence = false;
  let dirty = false;

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];

    const trim = l.trim();
    if (trim.startsWith("```") || trim.startsWith("~~~")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    if (isTableRow(l) && l.includes("<") && !l.includes("&lt;")) {
      const next = escapeInTableRow(l);
      if (next !== l) {
        lines[i] = next;
        dirty = true;
      }
    }
  }

  if (dirty) {
    fs.writeFileSync(f, lines.join("\n"), "utf8");
    changed++;
    console.log(`🧼 patched table "<": ${path.relative(process.cwd(), f)}`);
  }
}

console.log(`\nDone. Files changed: ${changed}`);