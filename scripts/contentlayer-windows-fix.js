// scripts/contentlayer-windows-fix.js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

if (process.platform === "win32") {
  console.log("🧹 Clearing Contentlayer cache for Windows compatibility...");

  const cachePath = path.join(process.cwd(), ".contentlayer");

  try {
    if (fs.existsSync(cachePath)) {
      // Prefer native Node removal first (fast + no shell dependency)
      try {
        fs.rmSync(cachePath, { recursive: true, force: true });
      } catch {
        // Fallback to cmd.exe removal if Node hits a lock
        execSync(`cmd /c rd /s /q "${cachePath}"`, { stdio: "inherit" });
      }
      console.log("✅ Contentlayer cache cleared");
    } else {
      console.log("ℹ️  No .contentlayer cache to clear");
    }
  } catch (error) {
    console.log("⚠️  Cache removal failed (may be locked by another process).");
    console.log(error?.message ?? error);
  }
}