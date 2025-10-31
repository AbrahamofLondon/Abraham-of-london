import { promises as fsp } from "fs";
import fg from "fast-glob";

const GLOBS = [
  "**/*.mjs","**/*.js","**/*.ts","**/*.tsx","**/*.json","**/*.toml","**/*.md","**/*.mdx","**/*.css","**/*.yml","**/*.yaml"
];
const files = await fg(GLOBS, { ignore: ["node_modules/**",".next/**"] });
let fixed = 0;

for (const p of files) {
  let buf = await fsp.readFile(p);
  // Strip BOM
  if (buf[0] === 0xEF && buf[1] === 0xBB && buf[2] === 0xBF) {
    buf = buf.slice(3);
  }
  let txt = buf.toString("utf8");
  // Normalize CRLF -> LF
  const txt2 = txt.replace(/\r\n/g, "\n");
  if (txt2 !== txt || buf.length !== (new TextEncoder().encode(txt2)).length) {
    await fsp.writeFile(p, txt2, { encoding: "utf8" }); // UTF-8, no BOM
    fixed++;
  }
}

if (fixed) console.log(`strip-bom-lf: fixed ${fixed} file(s)`);
