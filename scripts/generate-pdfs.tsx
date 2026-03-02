// scripts/generate-pdfs.tsx
import { spawn } from "child_process";
import path from "path";

const ROOT = process.cwd();
const tsx = process.platform === "win32"
  ? path.join(ROOT, "node_modules", ".bin", "tsx.cmd")
  : path.join(ROOT, "node_modules", ".bin", "tsx");

async function main() {
  const args = process.argv.slice(2);
  const script = "scripts/pdf/pdf-ops.ts";

  const child = spawn(tsx, [script, ...args], {
    stdio: "inherit",
    shell: true,
    cwd: ROOT,
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  child.on("close", (code) => process.exit(code ?? 1));
}

main().catch((e) => {
  console.error("Fatal:", e?.message || String(e));
  process.exit(1);
});