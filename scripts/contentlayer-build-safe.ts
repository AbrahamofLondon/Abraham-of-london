/* scripts/contentlayer-build-safe.ts — Institutional Absolute Path Wrapper */
import { spawn } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..");

export async function runContentlayer(): Promise<boolean> {
  console.log("📚 Initiating Hardened Contentlayer Build...");
  const binPath = path.resolve(PROJECT_ROOT, "node_modules/contentlayer2/bin/cli.cjs");
  
  if (!fs.existsSync(binPath)) {
    console.error(`💥 Fatal: Binary not found at ${binPath}`);
    return false;
  }

  return new Promise((resolve) => {
    const child = spawn("node", [binPath, "build"], {
      cwd: PROJECT_ROOT,
      stdio: "inherit",
      env: { ...process.env, NODE_OPTIONS: "--no-warnings" }
    });

    child.on("close", (code) => {
      if (code === 0) {
        console.log("✅ Contentlayer build complete.");
        resolve(true);
      } else {
        const generated = path.join(PROJECT_ROOT, ".contentlayer/generated");
        const exists = fs.existsSync(generated) && fs.readdirSync(generated).length > 0;
        console.warn(`⚠️ Execution code ${code}. Recovery: ${exists}`);
        resolve(exists);
      }
    });
    child.on("error", (err) => { console.error("❌ Process Error:", err.message); resolve(false); });
  });
}

const argv1 = process.argv[1] ? path.resolve(process.argv[1]) : "";
const isMain = argv1 && import.meta.url === `file:///${argv1.replace(/\\/g, "/")}`;

if (isMain) {
  runContentlayer().then((ok) => process.exit(ok ? 0 : 1));
}

export default runContentlayer;