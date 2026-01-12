// scripts/contentlayer-windows-fix.js
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.platform === "win32") {
  console.log("🧹 Clearing Contentlayer cache for Windows compatibility...");

  const cachePath = path.join(process.cwd(), ".contentlayer");
  const generatedPath = path.join(cachePath, "generated");

  try {
    // First try to just clear the generated folder (safer)
    if (fs.existsSync(generatedPath)) {
      try {
        fs.rmSync(generatedPath, { recursive: true, force: true });
        console.log("✅ Contentlayer generated cache cleared");
      } catch (error) {
        console.log("⚠️ Could not clear generated cache, trying alternative...");
      }
    }

    // Also clear the .cache folder inside .contentlayer
    const cacheCachePath = path.join(cachePath, ".cache");
    if (fs.existsSync(cacheCachePath)) {
      try {
        fs.rmSync(cacheCachePath, { recursive: true, force: true });
        console.log("✅ Contentlayer .cache cleared");
      } catch (error) {
        // Silent fail is okay
      }
    }

  } catch (error) {
    console.log("⚠️ Cache removal may have partial issues:");
    console.log(error?.message ?? error);
    console.log("Continuing anyway...");
  }
} else {
  console.log("ℹ️ Not on Windows, skipping Windows-specific cache clearing");
}