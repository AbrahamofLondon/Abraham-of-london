#!/usr/bin/env node
/**
 * Surgical MDX repair – preserves inner JSX/layout, no studs.
 * Usage:
 *   node scripts/fix-mdx-structural.mjs [--apply]
 *
 * What it does (only when needed):
 *  1) Fixes broken imports like: from "@/components/mdx';
 *  2) Unwraps illegal MDX wrappers:
 *       {(() => { return ( ... ) })()}
 *       {(() => { const content = ( ... ); return content; })()}
 *       const content = ( ... ); ... return content;
 *       return ( ... );
 *     → keeps ONLY the inner JSX/MDX block.
 *  3) Frontmatter:
 *       - adds title only if missing (prefers first H1, else filename)
 *       - normalises type: Post/Book/Download/... only if malformed
 *       - fixes draft: "false\r" / "true\r" → booleans
 * Writes .bak files when --apply is used. Dry-run by default.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const APPLY = process.argv.includes("--apply");
const root = process.cwd();
const exts = new Set([".mdx", ".md"]);

const typeMap = new Map([
  ["download", "Download"],
  ["guide", "Guide"],
  ["brief", "Brief"],
  ["post", "Post"],
  ["book", "Book"],
  ["resource", "Resource"],
  ["strategy", "Strategy"],
  ["event", "Event"],
  ["template", "Template"],
  ["pack", "Pack"],
  ["checklist", "Checklist"],
  ["plan", "Plan"],
  ["registry", "Registry"],
]);

function* walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git", "public"].includes(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      yield* walk(p);
    } else if (exts.has(path.extname(ent.name))) {
      yield p;
    }
  }
}

function titleFromFilename(fp) {
  const base = path.basename(fp).replace(/\.[^.]+$/, "");
  const t = base.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  return t.replace(/\b\w/g, (c) => c.toUpperCase());
}

function extractH1(body) {
  const m = body.match(/^\s*#\s+(.+?)\s*$/m);
  return m ? m[1].trim() : null;
}

function unwrapJsx(body) {
  let changed = false;
  let out = body;

  // Pattern A: {(() => { return ( ... ) })()}
  out = out.replace(
    /\{\(\s*\)\s*=>\s*\{\s*return\s*\(([\s\S]*?)\)\s*;?\s*\}\s*\)\(\)\s*\}/g,
    (_m, inner) => {
      changed = true;
      return `\n${inner}\n`;
    }
  );

  // Pattern B: {(() => { const content = ( ... ); return content; })()}
  out = out.replace(
    /\{\(\s*\)\s*=>\s*\{\s*const\s+\w+\s*=\s*\(([\s\S]*?)\)\s*;?\s*return\s+\w+\s*;?\s*\}\s*\)\(\)\s*\}/g,
    (_m, inner) => {
      changed = true;
      return `\n${inner}\n`;
    }
  );

  // Pattern C: const content = ( ... ); ... return content;
  out = out.replace(
    /const\s+content\s*=\s*\(([\s\S]*?)\)\s*;([\s\S]*?)return\s+content\s*;?/g,
    (_m, inner) => {
      changed = true;
      return `\n${inner}\n`;
    }
  );

  // Pattern D: lone "return ( ... )" at top-level
  out = out.replace(
    /(^|\n)\s*return\s*\(\s*([\s\S]*?)\s*\)\s*;?\s*$/m,
    (_m, _pre, inner) => {
      changed = true;
      return `\n${inner}\n`;
    }
  );

  return { out, changed };
}

function fixMdxImports(text) {
  return text
    .replace(/from\s+["']@\/components\/mdx['"]\s*;/g, 'from "@/components/mdx";')
    .replace(/from\s+["']~\/components\/mdx['"]\s*;/g, 'from "@/components/mdx";');
}

function splitFrontmatter(text) {
  if (!text.startsWith("---")) return { fm: null, body: text };
  const m = text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?/);
  if (!m) return { fm: null, body: text };
  return { fm: m[1], body: text.slice(m[0].length) };
}

function normaliseFrontmatter(fp, fm, body) {
  let fmFixed = fm;
  let changed = false;

  // Add title if missing
  if (!/^title\s*:/mi.test(fmFixed)) {
    const h1 = extractH1(body);
    const title = h1 || titleFromFilename(fp);
    fmFixed = `title: "${title}"\n` + fmFixed;
    changed = true;
  }

  // Normalise type only if clearly malformed (quoted/lower/escaped)
  fmFixed = fmFixed.replace(
    /^\s*type\s*:\s*["\\]*([A-Za-z]+)["\\]*\s*$/gmi,
    (m, g1) => {
      const norm = typeMap.get(g1.toLowerCase());
      if (norm) {
        changed = true;
        return `type: ${norm}`;
      }
      return m;
    }
  );

  // Fix variant: type "Brief"
  fmFixed = fmFixed.replace(/^\s*type\s+"Brief"\s*$/gmi, () => {
    changed = true;
    return "type: Brief";
  });

  // Fix CR-littered booleans
  fmFixed = fmFixed.replace(/^\s*draft\s*:\s*"[Ff]alse\\?r?"\s*$/gmi, () => {
    changed = true;
    return "draft: false";
  });
  fmFixed = fmFixed.replace(/^\s*draft\s*:\s*"[Tt]rue\\?r?"\s*$/gmi, () => {
    changed = true;
    return "draft: true";
  });

  // Dedent typical misindented keys (author/date only)
  fmFixed = fmFixed.replace(/^\s+author:/gmi, () => {
    changed = true;
    return "author:";
  });
  fmFixed = fmFixed.replace(/^\s+date:/gmi, () => {
    changed = true;
    return "date:";
  });

  return { fmFixed, changed };
}

function processFile(fp) {
  let raw = fs.readFileSync(fp, "utf8");
  const original = raw;

  // 1) Fix import mismatches
  raw = fixMdxImports(raw);

  // 2) Unwrap illegal wrappers
  const unwrapped = unwrapJsx(raw);
  raw = unwrapped.out;

  // 3) Frontmatter (minimal)
  const { fm, body } = splitFrontmatter(raw);
  if (fm !== null) {
    const { fmFixed, changed } = normaliseFrontmatter(fp, fm, body);
    if (changed) raw = `---\n${fmFixed}\n---\n\n${body}`;
  } else {
    // If no frontmatter: only add title when H1 exists (non-invasive)
    const h1 = extractH1(body);
    if (h1) {
      raw = `---\ntitle: "${h1}"\n---\n\n${body}`;
    }
  }

  if (raw !== original) {
    if (APPLY) {
      fs.writeFileSync(fp + ".bak", original, "utf8");
      fs.writeFileSync(fp, raw, "utf8");
      console.log("✔ fixed", path.relative(root, fp));
    } else {
      console.log("~ would fix", path.relative(root, fp));
    }
    return true;
  }
  return false;
}

let touched = 0;
for (const fp of walk(root)) {
  try {
    if (processFile(fp)) touched++;
  } catch (e) {
    console.error("ERR", path.relative(root, fp), "-", e.message);
  }
}
console.log(`${APPLY ? "Applied" : "Planned"} changes to ${touched} file(s).`);
