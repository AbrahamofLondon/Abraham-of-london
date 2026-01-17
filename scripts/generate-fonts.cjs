// scripts/generate-fonts.cjs
/* eslint-disable no-console */
const fs = require("fs");
const path = require("path");

function isDir(p) {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function listFontFiles(dir) {
  if (!isDir(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  const out = [];
  for (const e of entries) {
    // Only files, no recursion (keeps it predictable and avoids weird Windows perms)
    if (!e.isFile()) continue;

    const ext = path.extname(e.name).toLowerCase();
    if (![".woff2", ".woff", ".ttf", ".otf"].includes(ext)) continue;

    out.push({
      file: e.name,
      ext,
      bytes: fs.statSync(path.join(dir, e.name)).size,
      publicPath: `/fonts/${e.name}`,
    });
  }
  return out.sort((a, b) => a.file.localeCompare(b.file));
}

(function main() {
  const repoRoot = process.cwd();
  const fontsDir = path.join(repoRoot, "public", "fonts");

  if (!isDir(fontsDir)) {
    console.warn(`[fonts] Skipped: not a directory: ${fontsDir}`);
    process.exit(0);
  }

  const fonts = listFontFiles(fontsDir);
  const manifest = {
    generatedAt: new Date().toISOString(),
    fontsDir: "public/fonts",
    count: fonts.length,
    fonts,
  };

  const outDir = path.join(repoRoot, "public", "fonts");
  ensureDir(outDir);

  const outFile = path.join(outDir, "fonts.manifest.json");
  fs.writeFileSync(outFile, JSON.stringify(manifest, null, 2), "utf8");

  console.log(`[fonts] Found ${fonts.length} font files.`);
  console.log(`[fonts] Wrote: ${path.relative(repoRoot, outFile)}`);
})();