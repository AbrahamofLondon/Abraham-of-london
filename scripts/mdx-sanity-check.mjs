import fs from "node:fs";
import path from "node:path";
import fg from "fast-glob";
import { compile } from "@mdx-js/mdx";

const repoRoot = process.cwd();
const patterns = ["content/**/*.mdx", "content/**/*.md"];
const files = await fg(patterns, { cwd: repoRoot, dot: true, absolute: true });

const failures = [];

for (const file of files) {
  const raw = fs.readFileSync(file, "utf8");

  try {
    // compile() will throw if parsing fails (same micromark/mdx pipeline family)
    await compile(raw, {
      development: false,
      format: "mdx",
    });
  } catch (e) {
    failures.push(file);
    console.log("\n❌ MDX FAIL:", file);
    console.log(String(e?.message || e));
  }
}

console.log("\n==============================");
console.log("Total files:", files.length);
console.log("Failures:", failures.length);

if (failures.length) {
  const out = path.join(repoRoot, "mdx-failures.txt");
  fs.writeFileSync(out, failures.sort().join("\n"), "utf8");
  console.log("Wrote:", out);
}