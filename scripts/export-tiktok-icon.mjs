import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Try the modern named export first; fall back for older simple-icons versions
let pathData;
try {
  const { siTiktok } = await import("simple-icons/icons/siTiktok.js");
  pathData = siTiktok.path;
} catch {
  const siTiktok = (await import("simple-icons/icons/tiktok.js")).default;
  pathData = siTiktok.path;
}
