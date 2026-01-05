// scripts/contentlayer-build-safe.ts — ESM, Windows-safe, artifact-aware
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { pathToFileURL } from "url";

function hasGeneratedContent(): boolean {
  const dir = path.join(process.cwd(), ".contentlayer");
  if (!fs.existsSync(dir)) return false;

  const candidates = [path.join(dir, "generated"), dir];
  for (const p of candidates) {
    if (!fs.existsSync(p)) continue;
    try {
      const files = fs.readdirSync(p).filter((f) => /\.(json|mjs|js)$/i.test(f));
      if (files.length > 0) return true;
    } catch {
      // ignore
    }
  }
  return false;
}

export async function runContentlayer(): Promise<boolean> {
  console.log("📚 Building Contentlayer (safe)…");

  const commands = ["contentlayer build", "npx contentlayer build"];

  for (const cmd of commands) {
    try {
      console.log(`🔄 ${cmd}`);
      execSync(cmd, { stdio: "inherit", windowsHide: true });
      console.log("✅ Contentlayer build completed");
      return true;
    } catch (err: any) {
      console.warn(`⚠️ Failed: ${cmd}`);
      console.warn(err?.message ?? String(err));
    }
  }

  if (hasGeneratedContent()) {
    console.warn("⚠️ Using existing .contentlayer artifacts (build failed but output exists)");
    return true;
  }

  console.error("💥 Contentlayer build failed and no artifacts exist.");
  return false;
}

// Correct ESM “is main” on Windows
const argv1 = process.argv[1] ? path.resolve(process.argv[1]) : "";
const isMain = argv1 && import.meta.url === pathToFileURL(argv1).href;

if (isMain) {
  runContentlayer()
    .then((ok) => process.exit(ok ? 0 : 1))
    .catch((e) => {
      console.error("Unhandled error:", e);
      process.exit(1);
    });
}

export default runContentlayer;