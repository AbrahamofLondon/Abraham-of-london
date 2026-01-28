const { execSync } = require("child_process");

const skip = process.env.SKIP_ASSET_OPTIMIZE === "1" || process.env.NETLIFY === "true";

if (skip) {
  console.log("[prebuild] Netlify detected → skipping heavy/strict steps (assets:optimize, security:scan).");
  process.exit(0);
}

execSync("pnpm assets:optimize", { stdio: "inherit" });