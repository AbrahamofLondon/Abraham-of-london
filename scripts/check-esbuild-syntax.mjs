scripts/check-esbuild-syntax.mjs
import { build } from "esbuild";
import fg from "fast-glob";
import path from "path";
import fs from "fs/promises";

const root = process.cwd();
const globs = [
  "pages/**/*.{ts,tsx}",
  "components/**/*.{ts,tsx}",
  "lib/**/*.{ts,tsx}",
  "content/**/*.{md,mdx}",
];

const files = (await fg(globs, { absolute: true, dot: false }))
  // ignore generated/cache
  .filter((p) => !p.includes(".contentlayer"));

let failed = false;

for (const file of files) {
  try {
    await build({
      entryPoints: [file],
      write: false,
      bundle: false,
      logLevel: "silent",
      platform: "node",
      format: "esm",
      jsx: "automatic",
      loader: {
        ".md": "text",
        ".mdx": "text",
        ".png": "file",
        ".jpg": "file",
        ".jpeg": "file",
        ".svg": "file",
        ".webp": "file",
      },
    });
  } catch (e) {
    console.error("\n❌ Esbuild parse error in:", path.relative(root, file));
    // esbuild returns structured errors
    const msg = e?.errors?.[0];
    if (msg?.location) {
      const { line, column } = msg.location;
      console.error(`${msg.text} @ ${line}:${column}`);
      const src = await fs.readFile(file, "utf8");
      const lines = src.split(/\r?\n/);
      const around = lines.slice(Math.max(0, line - 3), line + 2);
      console.error("--- context ---");
      console.error(around.map((l, i) => String(line - 2 + i).padStart(4) + " | " + l).join("\n"));
    } else {
      console.error(String(e));
    }
    failed = true;
    break;
  }
}
