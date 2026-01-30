// scripts/contentlayer-windows-fix.js
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

// Clear Contentlayer cache on Windows
if (process.platform === "win32") {
  console.log("🧹 Clearing Contentlayer cache for Windows compatibility...");
  try {
    const cachePath = path.join(process.cwd(), ".contentlayer");
    if (fs.existsSync(cachePath)) {
      execSync(`rd /s /q "${cachePath}"`, { stdio: "inherit" });
      console.log("✅ Contentlayer cache cleared");
    }
  } catch (error) {
    console.log("ℹ️  Cache already cleared or not accessible");
  }
}

