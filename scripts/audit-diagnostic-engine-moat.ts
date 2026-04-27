/**
 * Diagnostic Engine Moat Audit
 * Run: npx tsx scripts/audit-diagnostic-engine-moat.ts
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");

function exists(p: string): boolean {
  return fs.existsSync(path.join(ROOT, p));
}
function read(p: string): string {
  const f = path.join(ROOT, p);
  return fs.existsSync(f) ? fs.readFileSync(f, "utf-8") : "";
}

type CheckResult = { label: string; pass: boolean };

export async function runAudit(): Promise<{ name: string; checks: CheckResult[] }> {
  const checks: CheckResult[] = [];

  function check(label: string, condition: boolean) {
    checks.push({ label, pass: condition });
  }

  // 1. decision-engine.ts exists and exports a scoring function
  const decisionEngine = read("lib/diagnostics/decision-engine.ts");
  check(
    "lib/diagnostics/decision-engine.ts exists and exports scoring",
    exists("lib/diagnostics/decision-engine.ts") &&
      (decisionEngine.includes("export function") || decisionEngine.includes("export const")),
  );

  // 2. arbiter-tournament.ts exists with validation rules
  const arbiter = read("lib/decision/arbiter-tournament.ts");
  check(
    "lib/decision/arbiter-tournament.ts exists with validation rules",
    exists("lib/decision/arbiter-tournament.ts") &&
      arbiter.includes("condition_integrity") &&
      arbiter.includes("contradiction_alignment") &&
      arbiter.includes("move_validity") &&
      arbiter.includes("cost_consistency") &&
      arbiter.includes("avoidance_proof"),
  );

  // 3. contradictions.ts exports named contradiction types
  const contradictions = read("lib/diagnostics/contradictions.ts");
  check(
    "lib/diagnostics/contradictions.ts exports named contradiction types",
    contradictions.includes("URGENCY_VS_OWNERSHIP") &&
      contradictions.includes("CLARITY_VS_ACCOUNTABILITY") &&
      contradictions.includes("URGENCY_VS_STATE"),
  );

  // 4. Confidence scoring exists
  check(
    "Confidence scoring exists in decision engine",
    decisionEngine.includes("confidence") || decisionEngine.includes("toConfidence"),
  );

  // 5. Deterministic classification exists (not just AI generation)
  const spine = read("lib/decision/intelligence-spine.ts");
  check(
    "Deterministic classification exists (not purely AI)",
    (decisionEngine.includes("ARCHETYPES") || decisionEngine.includes("archetype")) &&
      (spine.includes("deterministic") || spine.includes("Deterministic")),
  );

  // 6. TAR/pressure feedback exists
  check(
    "Pressure feedback loop exists (48h/7d/14d)",
    exists("lib/follow-up/pressure-loop.ts") &&
      read("lib/follow-up/pressure-loop.ts").includes("48h") &&
      read("lib/follow-up/pressure-loop.ts").includes("7d") &&
      read("lib/follow-up/pressure-loop.ts").includes("14d"),
  );

  // 7. Output includes rationale
  check(
    "Output includes rationale/trace/reasoning fields",
    decisionEngine.includes("rationale") ||
      decisionEngine.includes("trace") ||
      decisionEngine.includes("reasoning") ||
      arbiter.includes("audit") ||
      arbiter.includes("userMessage"),
  );

  return { name: "Diagnostic Engine Moat", checks };
}

// ── CLI entrypoint ──────────────────────────────────────────────────────────
if (require.main === module) {
  runAudit().then(({ name, checks }) => {
    console.log(`\n========================================`);
    console.log(`  ${name.toUpperCase()} AUDIT`);
    console.log(`========================================\n`);

    let passed = 0;
    let failed = 0;
    for (const c of checks) {
      if (c.pass) {
        console.log(`\x1b[32m PASS\x1b[0m  ${c.label}`);
        passed++;
      } else {
        console.log(`\x1b[31m FAIL\x1b[0m  ${c.label}`);
        failed++;
      }
    }

    console.log(`\n── ${passed} passed, ${failed} failed ──\n`);
    process.exit(failed > 0 ? 1 : 0);
  });
}
