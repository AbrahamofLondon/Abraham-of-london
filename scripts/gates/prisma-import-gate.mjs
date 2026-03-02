import { execSync } from "node:child_process";

function run(cmd) {
  return execSync(cmd, { stdio: "pipe", encoding: "utf8", shell: true });
}

// app/** must not import "@/lib/prisma"
const appBad = run(`rg -n -F "@/lib/prisma" app --glob "!**/node_modules/**" || true`).trim();

// pages/** must not import "@/lib/prisma.server"
const pagesBad = run(`rg -n -F "@/lib/prisma.server" pages --glob "!**/node_modules/**" || true`).trim();

if (appBad) {
  console.error("❌ [PRISMA_GATE] app/** must import from '@/lib/prisma.server' (not '@/lib/prisma'):\n");
  console.error(appBad);
  process.exit(1);
}

if (pagesBad) {
  console.error("❌ [PRISMA_GATE] pages/** must import from '@/lib/prisma' (not '@/lib/prisma.server'):\n");
  console.error(pagesBad);
  process.exit(1);
}

console.log("✅ [PRISMA_GATE] OK");