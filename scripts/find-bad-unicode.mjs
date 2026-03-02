import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(process.cwd(), "content"); // adjust if your MDX lives elsewhere
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

function scanFile(file) {
  const buf = fs.readFileSync(file); // raw bytes
  // decode as UTF-8, replacing errors
  const text = buf.toString("utf8");

  // 1) UTF-8 replacement char indicates decode issues
  const hasReplacement = text.includes("\uFFFD");

  // 2) Null bytes or other control chars (except tab/newline/carriage return)
  let badControls = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c === 9 || c === 10 || c === 13) continue;
    if (c < 32) badControls++;
  }

  // 3) BOM at beginning (can break some parsers)
  const hasBOM = text.charCodeAt(0) === 0xfeff;

  // 4) Zero-width chars often introduced by copy/paste
  const zw = /[\u200B\u200C\u200D\u2060\uFEFF]/.test(text);

  // 5) Unpaired surrogates (can explode codepoint logic)
  let unpaired = 0;
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = text.charCodeAt(i + 1);
      if (!(next >= 0xdc00 && next <= 0xdfff)) unpaired++;
      else i++;
    } else if (code >= 0xdc00 && code <= 0xdfff) {
      unpaired++;
    }
  }

  const score =
    (hasReplacement ? 10 : 0) +
    (hasBOM ? 3 : 0) +
    (zw ? 2 : 0) +
    Math.min(badControls, 20) +
    Math.min(unpaired * 5, 50);

  return { hasReplacement, badControls, hasBOM, zw, unpaired, score };
}

const files = fs.existsSync(ROOT) ? walk(ROOT) : [];
if (!files.length) {
  console.error(`No .md/.mdx files found under: ${ROOT}`);
  process.exit(1);
}

const results = [];
for (const f of files) {
  const r = scanFile(f);
  if (r.score > 0) results.push({ file: f, ...r });
}

results.sort((a, b) => b.score - a.score);

if (!results.length) {
  console.log("✅ No obvious bad unicode/control characters found.");
  process.exit(0);
}

console.log("🚨 Potentially problematic files (highest risk first):");
for (const r of results.slice(0, 50)) {
  console.log(
    `${r.score.toString().padStart(3, " ")}  ${r.file}\n` +
      `     replacement:${r.hasReplacement} bom:${r.hasBOM} zeroWidth:${r.zw} badControls:${r.badControls} unpairedSurrogates:${r.unpaired}`
  );
}

process.exit(2);