import fs from "fs";
import path from "path";

const root = process.cwd();
const bad = [];
const walk = (dir) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next" || e.name === ".contentlayer") continue;
      walk(p);
      continue;
    }
    if (!p.endsWith(".d.ts") && !p.endsWith(".ts") && !p.endsWith(".tsx")) continue;
    const s = fs.readFileSync(p, "utf8");
    if (/declare module\s+['"]@prisma\/client['"]/.test(s)) bad.push(p);
  }
};

walk(root);

if (bad.length) {
  console.error("⛔ Prisma type shadow detected (declare module '@prisma/client'):");
  bad.forEach((p) => console.error(" -", p));
  process.exit(1);
}

console.log("✅ Prisma type gate: OK");