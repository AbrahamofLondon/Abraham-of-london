scripts/check-json.mjs
#!/usr/bin/env node
import { readFileSync } from "fs";
try {
  const s = readFileSync("package.json","utf8");
  if (s.charCodeAt(0) === 0xFEFF) {
    console.error("package.json has a BOM");
    process.exit(2);
  }
  JSON.parse(s);
} catch (e) {
  console.error("Invalid package.json:", e.message);
  process.exit(1);
}
