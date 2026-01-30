// scripts/pdf/build-pdf-registry.ts
// Prebuild orchestrator for PDF registry + variants (Windows-safe, no npx).
//
// Order:
// 1) Ensure scripts/pdf/pdf-registry.generated.ts exists (build-pdf-registry-generated.ts)
// 2) Generate missing variants (generate-from-generated-registry.ts)
// 3) Rebuild generated registry to refresh metadata (exists/fileSize/lastModified)

import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";

type StepResult = {
  step: string;
  ok: boolean;
  code: number | null;
  error?: string;
};

const ROOT = process.cwd();

function fileExists(p: string) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

function findLocalTsxBin(): string {
  // Prefer the .cmd on Windows; plain bin on others.
  const bin = process.platform === "win32" ? "tsx.cmd" : "tsx";
  const p = path.join(ROOT, "node_modules", ".bin", bin);
  if (!fileExists(p)) {
    throw new Error(
      `Local tsx binary not found at ${p}. Install devDependency "tsx" and run pnpm i.`,
    );
  }
  return p;
}

function runTsx(scriptRelPath: string, args: string[] = [], env?: Record<string, string>): StepResult {
  const scriptAbs = path.join(ROOT, scriptRelPath);
  const stepName = scriptRelPath.replace(/\\/g, "/").split("/").slice(-1)[0];

  if (!fileExists(scriptAbs)) {
    return {
      step: stepName,
      ok: false,
      code: 1,
      error: `Script not found: ${scriptRelPath}`,
    };
  }

  let tsxBin: string;
  try {
    tsxBin = findLocalTsxBin();
  } catch (e: any) {
    return { step: stepName, ok: false, code: 1, error: e?.message || String(e) };
  }

  // Spawn the local tsx runner directly.
  // On Windows, node can run the .cmd via shell:true — but shell introduces quoting bugs.
  // Better: run the .cmd directly with shell:true ONLY on win32.
  const useShell = process.platform === "win32";

  const res = spawnSync(
    tsxBin,
    [scriptAbs, ...args],
    {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, ...(env || {}), FORCE_COLOR: "1" },
      shell: useShell,
      windowsHide: true,
    },
  );

  if (res.error) {
    return { step: stepName, ok: false, code: res.status, error: res.error.message };
  }

  return { step: stepName, ok: res.status === 0, code: res.status };
}

function printHeader(title: string) {
  console.log(`\n${title}`);
  console.log("—".repeat(72));
}

function failFast(results: StepResult[]): never {
  const failed = results.filter((r) => !r.ok);
  console.error("\n❌ PDF registry build failed.");
  for (const f of failed) {
    console.error(`- ${f.step}: exit=${f.code}${f.error ? `, ${f.error}` : ""}`);
  }
  process.exit(1);
}

async function main() {
  const results: StepResult[] = [];

  const generatedFile = path.join(ROOT, "scripts", "pdf", "pdf-registry.generated.ts");
  ensureDir(path.dirname(generatedFile));

  // 1) Build generated registry
  printHeader("📦 Step 1/3 — Build generated PDF registry");
  results.push(runTsx("scripts/pdf/build-pdf-registry-generated.ts"));

  if (!fileExists(generatedFile)) {
    results.push({
      step: "pdf-registry.generated.ts",
      ok: false,
      code: 1,
      error: `Expected generated file not created: ${path.relative(ROOT, generatedFile)}`,
    });
    failFast(results);
  }

  // 2) Generate variants
  printHeader("🧱 Step 2/3 — Generate missing format variants");
  results.push(
    runTsx("scripts/pdf/generate-from-generated-registry.ts", [], {
      PDF_QUALITY: (process.env.PDF_QUALITY as string) || "premium",
      PDF_TIER: (process.env.PDF_TIER as string) || "free",
    }),
  );

  // 3) Rebuild registry to refresh metadata
  printHeader("🔁 Step 3/3 — Rebuild registry metadata (post-variants)");
  results.push(runTsx("scripts/pdf/build-pdf-registry-generated.ts"));

  if (!results.every((r) => r.ok)) failFast(results);

  console.log("\n✅ PDF registry is GREEN.");
  console.log(`Generated file: ${path.relative(ROOT, generatedFile)}`);
}

main().catch((err: any) => {
  console.error("❌ Unexpected error in scripts/pdf/build-pdf-registry.ts");
  console.error(err?.stack || err?.message || String(err));
  process.exit(1);
});