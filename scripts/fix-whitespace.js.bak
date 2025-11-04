import { promises as fs } from "fs";
import path from "path";

const roots = ["components", "pages", "lib"]; // add "src" if you use it

const enc = new TextEncoder(); // UTF-8 with BOM not needed in Node write
const toClean = [".ts", ".tsx"];

async function* walk(dir) {
  for (const d of await fs.readdir(dir, { withFileTypes: true })) {
    const entry = path.join(dir, d.name);
    if (d.isDirectory()) yield* walk(entry);
    else if (toClean.some(ext => d.name.endsWith(ext))) yield entry;
  }
}

const replaceWeird = (txt) =>
  txt
    .replace(/\u00A0/g, " ") // NBSP -> space
    .replace(/\u200B|\u200C|\u200D|\uFEFF/g, ""); // ZWSP/ZWNJ/ZWJ/BOM -> remove

(async () => {
  for (const root of roots) {
    try {
      for await (const file of walk(root)) {
        const orig = await fs.readFile(file, "utf8");
        const cleaned = replaceWeird(orig);
        if (cleaned !== orig) {
          await fs.writeFile(file, cleaned);
          console.log("Cleaned", file);
        }
      }
    } catch {
      /* ignore missing folders */
    }
  }
