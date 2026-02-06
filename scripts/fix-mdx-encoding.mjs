// scripts/fix-mdx-encoding.mjs
import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");

const TARGETS = [
  path.join(CONTENT_DIR, "blog", "christianity-not-extremism.mdx"),
  path.join(CONTENT_DIR, "blog", "in-my-fathers-house.mdx"),
];

/**
 * Strip characters that commonly break MDX tooling:
 * - NULL bytes
 * - Unpaired surrogates
 * - ASCII control chars except \n \r \t
 */
function sanitizeText(input) {
  let s = input;

  // Remove BOM if present
  if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);

  // Remove NULL bytes
  s = s.replace(/\u0000/g, "");

  // Remove control chars (except tab, newline, carriage return)
  s = s.replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");

  // Remove unpaired surrogates
  s = Array.from(s)
    .filter((ch) => {
      const code = ch.codePointAt(0);
      // If it’s a surrogate half, drop it
      return !(code >= 0xd800 && code <= 0xdfff);
    })
    .join("");

  return s;
}

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  Missing: ${filePath}`);
    return;
  }

  // Read as raw buffer then decode as utf8 (best effort)
  const buf = fs.readFileSync(filePath);
  let text = buf.toString("utf8");

  const before = text.length;
  const cleaned = sanitizeText(text);
  const after = cleaned.length;

  fs.writeFileSync(filePath, cleaned, { encoding: "utf8" });

  console.log(`✅ Fixed: ${path.relative(ROOT, filePath)} (${before} → ${after} chars)`);
}

console.log("🔧 Fixing MDX encoding / invalid unicode…");
for (const f of TARGETS) fixFile(f);
console.log("✅ Done.");
