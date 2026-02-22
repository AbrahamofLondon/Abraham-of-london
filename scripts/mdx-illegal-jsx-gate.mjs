// scripts/mdx-illegal-jsx-gate.mjs
import fs from "fs";
import path from "path";
import glob from "fast-glob";

const CONTENT_DIR = "content";
const FIX = process.argv.includes("--fix");
const QUARANTINE = process.argv.includes("--quarantine");

const BOM = "\uFEFF";
const FM_RE = /(^|\n)---\s*\n[\s\S]*?\n---\s*(\n|$)/g;

function stripBom(s) {
  return s.startsWith(BOM) ? s.slice(1) : s;
}

function splitCodeFences(s) {
  // Returns array of {type:'code'|'text', value}
  const parts = [];
  const fenceRe = /```[\s\S]*?```/g;
  let last = 0;
  let m;
  while ((m = fenceRe.exec(s))) {
    if (m.index > last) parts.push({ type: "text", value: s.slice(last, m.index) });
    parts.push({ type: "code", value: m[0] });
    last = m.index + m[0].length;
  }
  if (last < s.length) parts.push({ type: "text", value: s.slice(last) });
  return parts;
}

function unescapeHtmlOutsideCode(s) {
  const parts = splitCodeFences(s);
  return parts
    .map((p) => {
      if (p.type === "code") return p.value;
      return p.value
        .replace(/&gt;/g, ">")
        .replace(/&lt;/g, "<")
        .replace(/&amp;/g, "&");
    })
    .join("");
}

function getFrontmatterBlocks(s) {
  // strict: frontmatter fences at start-of-file or line boundary
  const re = /^---\s*\n[\s\S]*?\n---\s*(\n|$)/gm;
  return s.match(re) || [];
}

function hasNonWhitespaceBeforeFirstFm(s) {
  const idx = s.search(/^---\s*$/m);
  if (idx === -1) return false;
  const before = s.slice(0, idx);
  return before.trim().length > 0;
}

function moveSingleFmToTopIfNeeded(s) {
  const blocks = getFrontmatterBlocks(s);
  if (blocks.length !== 1) return s;

  const fm = blocks[0];
  const start = s.indexOf(fm);
  if (start === 0) return s;

  const before = s.slice(0, start).trimStart();
  const after = s.slice(start + fm.length).trimStart();

  // Put FM first, then blank line, then original content without losing it
  return `${fm}\n${before}${before ? "\n\n" : ""}${after}`;
}

function demoteExtraFrontmatterFences(s) {
  // If there are multiple FM blocks, don’t try to “merge”.
  // Convert any later `---` fence that looks like a divider into `***`
  // ONLY when it's not followed by typical YAML key patterns.
  const lines = s.split("\n");
  let fmCount = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      // look ahead: if next non-empty line looks like yaml key, treat as frontmatter fence
      const next = lines.slice(i + 1).find((l) => l.trim().length > 0) ?? "";
      const isYamlKey = /^[A-Za-z0-9_-]+\s*:\s*.*$/.test(next.trim());
      if (isYamlKey) {
        fmCount++;
        continue;
      }
      // divider fence: demote
      lines[i] = "***";
    }
  }
  return lines.join("\n");
}

function detectOrphanClosingTags(s) {
  // heuristic: flag stray </X> where <X> never appears
  const closing = [...s.matchAll(/<\/([A-Za-z][A-Za-z0-9]*)\s*>/g)].map((m) => m[1]);
  if (!closing.length) return [];
  const issues = [];
  for (const tag of new Set(closing)) {
    const openRe = new RegExp(`<${tag}(\\s|>|\\/)`, "g");
    if (!openRe.test(s)) issues.push(tag);
  }
  return issues;
}

function quarantineFile(file, reason) {
  const qdir = path.join(".mdx-quarantine");
  fs.mkdirSync(qdir, { recursive: true });
  const base = file.replace(/[\\/]/g, "__");
  const dest = path.join(qdir, base);
  fs.copyFileSync(file, dest);
  fs.writeFileSync(dest + ".reason.txt", reason + "\n", "utf8");
}

async function run() {
  const files = await glob([`${CONTENT_DIR}/**/*.mdx`], { dot: false });
  const invalid = [];
  let fixedCount = 0;

  for (const file of files) {
    const original = fs.readFileSync(file, "utf8");
    let s = original;
    const issues = [];

    // BOM
    if (s.startsWith(BOM)) issues.push("File begins with UTF-8 BOM. Remove BOM so frontmatter starts at byte 0.");

    // Frontmatter positioning
    const fmBlocks = getFrontmatterBlocks(s);
    if (fmBlocks.length && hasNonWhitespaceBeforeFirstFm(s)) {
      issues.push("Non-whitespace content found before the first frontmatter fence. Frontmatter must be the first thing in the file.");
    }

    // Escaped HTML entities
    const parts = splitCodeFences(s);
    const hasEscapes = parts.some((p) => p.type === "text" && /&(gt|lt|amp);/.test(p.value));
    if (hasEscapes) {
      issues.push("HTML-escaped entities detected (&gt; / &lt; / &amp;) outside code fences. Convert back to raw markdown ('>') where appropriate.");
    }

    // Extra frontmatter fences (often corruption)
    if (fmBlocks.length > 1) {
      issues.push("Additional '---' frontmatter fence found after the first block. Remove or convert to a divider (e.g. '***').");
    }

    // Orphan closing tags
    const orphan = detectOrphanClosingTags(s);
    if (orphan.length) {
      issues.push(`Potential orphan closing tag(s) found: ${orphan.join(", ")}. Ensure every </X> has a matching <X>.`);
    }

    if (issues.length) {
      if (FIX) {
        let updated = s;
        updated = stripBom(updated);
        updated = unescapeHtmlOutsideCode(updated);
        updated = moveSingleFmToTopIfNeeded(updated);
        updated = demoteExtraFrontmatterFences(updated);

        if (updated !== original) {
          fs.writeFileSync(file, updated, "utf8");
          fixedCount++;
        } else if (QUARANTINE) {
          quarantineFile(file, issues.join("\n"));
        }
      } else {
        invalid.push({ file, issues });
      }
    }
  }

  if (!FIX) {
    if (invalid.length) {
      console.error(`[MDX_GATE] Integrity check failed: ${invalid.length} file(s) invalid.`);
      for (const f of invalid.slice(0, 40)) {
        console.error(`- ${f.file}`);
        for (const i of f.issues) console.error(`  • ${i}`);
      }
      if (invalid.length > 40) console.error(`...and ${invalid.length - 40} more.`);
      process.exit(1);
    } else {
      console.log(`[MDX_GATE] OK. ${files.length} file(s) checked. 0 invalid.`);
    }
  } else {
    console.log(`[MDX_GATE] Fix mode complete. Files checked: ${files.length}. Files modified: ${fixedCount}.`);
  }
}

run().catch((err) => {
  console.error("[MDX_GATE] Failed:", err);
  process.exit(1);
});