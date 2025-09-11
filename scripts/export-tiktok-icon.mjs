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

const svg = `<svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>TikTok</title><path fill="currentColor" d="${pathData}"/></svg>`;

const out = "public/assets/images/social/tiktok.svg";
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, svg, "utf8");
console.log("✅ Exported", out);
