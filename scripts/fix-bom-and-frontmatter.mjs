import fs from "fs";
import path from "path";
import glob from "fast-glob";

const BOM_CHAR = "\uFEFF";

function stripBom(text) {
  // Handles BOM as character (common when reading "utf8")
  if (text.startsWith(BOM_CHAR)) return text.slice(1);

  // Handles BOM bytes if you ever switch to Buffer reads
  if (text.charCodeAt(0) === 0xFEFF) return text.slice(1);

  return text;
}

function firstNonWhitespaceIndex(s) {
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (c !== " " && c !== "\t" && c !== "\r" && c !== "\n") return i;
  }
  return -1;
}

function beginsWithFrontmatter(text) {
  // Must be at byte 0
  return text.startsWith("---\n") || text.startsWith("---\r\n");
}

function hasFrontmatterLater(text) {
  // Find a frontmatter fence not at byte 0
  const idx = text.indexOf("\n---\n");
  const idx2 = text.indexOf("\r\n---\r\n");
  return idx !== -1 || idx2 !== -1;
}

function countFrontmatterFencesAtTop(text) {
  // Counts only the first contiguous frontmatter block at the top
  // If file starts with --- then we count fences until the closing ---
  if (!beginsWithFrontmatter(text)) return 0;

  const lines = text.split(/\r?\n/);
  let fences = 0;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === "---") fences++;
    if (fences === 2) return 2; // open+close found
  }
  return fences; // 1 means unclosed
}

async function main() {
  const files = await glob(["content/**/*.mdx"], { dot: false });
  let bomFixed = 0;
  let quarantined = 0;
  let touched = 0;

  const quarantineDir = path.join("content", "__quarantine__");
  if (!fs.existsSync(quarantineDir)) fs.mkdirSync(quarantineDir, { recursive: true });

  for (const file of files) {
    let content = fs.readFileSync(file, "utf8");
    const original = content;

    // 1) Remove BOM (safe)
    const stripped = stripBom(content);
    if (stripped !== content) {
      content = stripped;
      bomFixed++;
    }

    // 2) Enforce: frontmatter (if present) must start at byte 0
    // If there's ANY non-whitespace before the first fence, quarantine.
    const firstNW = firstNonWhitespaceIndex(content);
    if (firstNW > 0) {
      // If there's a frontmatter fence later, this file is structurally invalid for your pipeline.
      if (hasFrontmatterLater(content)) {
        const dest = path.join(quarantineDir, path.basename(file));
        fs.copyFileSync(file, dest);
        quarantined++;
        // Do not auto-rewrite content. Leave for manual restore.
        continue;
      }
    }

    // 3) If it begins with frontmatter, ensure it’s closed (2 fences)
    const fences = countFrontmatterFencesAtTop(content);
    if (fences === 1) {
      // Unclosed frontmatter: quarantine for manual repair
      const dest = path.join(quarantineDir, path.basename(file));
      fs.copyFileSync(file, dest);
      quarantined++;
      continue;
    }

    if (content !== original) {
      fs.writeFileSync(file, content, "utf8");
      touched++;
      if (touched % 50 === 0) {
        // small progress signal without spam
        process.stdout.write(".");
      }
    }
  }

  console.log("\n✅ Done.");
  console.log(`- BOM removed in: ${bomFixed} file(s)`);
  console.log(`- Files modified: ${touched} file(s)`);
  console.log(`- Quarantined for manual repair: ${quarantined} file(s) (see content/__quarantine__)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});