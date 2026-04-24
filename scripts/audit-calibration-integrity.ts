/**
 * Calibration Integrity Audit
 *
 * Fails if:
 * - calibration mutates model weights directly during ingest
 * - calibration state is in-memory only
 * - outcome count threshold missing
 * - no CalibrationEvent created
 * - no model version attached
 * - prediction comparison missing
 */

import * as fs from "fs";
import * as path from "path";

const FAIL_REASONS: string[] = [];
const PASS_CHECKS: string[] = [];

function check(name: string, condition: boolean, failMessage: string) {
  if (condition) {
    PASS_CHECKS.push(`✓ ${name}`);
  } else {
    FAIL_REASONS.push(`✗ ${name}: ${failMessage}`);
  }
}

// 1. CalibrationState model exists in schema
const schema = fs.readFileSync(path.join(process.cwd(), "prisma/schema.prisma"), "utf-8");
check(
  "CalibrationState model exists",
  schema.includes("model CalibrationState"),
  "CalibrationState model not found in prisma/schema.prisma",
);

// 2. CalibrationEvent model exists
check(
  "CalibrationEvent model exists",
  schema.includes("model CalibrationEvent"),
  "CalibrationEvent model not found in prisma/schema.prisma",
);

// 3. Ingest route exists and does NOT mutate live weights
const ingestPath = path.join(process.cwd(), "app/api/calibration/ingest/route.ts");
check("Ingest route exists", fs.existsSync(ingestPath), "app/api/calibration/ingest/route.ts not found");

if (fs.existsSync(ingestPath)) {
  const ingestCode = fs.readFileSync(ingestPath, "utf-8");
  check(
    "Ingest does NOT update calibrationData directly",
    !ingestCode.includes("calibrationData:") || ingestCode.includes("RECORDED_NOT_APPLIED"),
    "Ingest route appears to mutate calibration state directly. Must only create events.",
  );
}

// 4. Calibration engine exists with threshold
const enginePath = path.join(process.cwd(), "lib/calibration/calibration-engine.ts");
check("Calibration engine exists", fs.existsSync(enginePath), "lib/calibration/calibration-engine.ts not found");

if (fs.existsSync(enginePath)) {
  const engineCode = fs.readFileSync(enginePath, "utf-8");
  check(
    "Minimum outcome threshold enforced",
    engineCode.includes("MIN_OUTCOMES") && engineCode.includes("< MIN_OUTCOMES"),
    "No minimum outcome threshold found in calibration engine.",
  );
  check(
    "Max adjustment cap exists",
    engineCode.includes("MAX_ADJUSTMENT"),
    "No maximum adjustment cap found.",
  );
  check(
    "comparePredictionToOutcome function exists",
    engineCode.includes("comparePredictionToOutcome"),
    "Missing prediction comparison function.",
  );
  check(
    "Model versioning via modelVersion field",
    engineCode.includes("modelVersion"),
    "No model version handling found.",
  );
}

// 5. Cron route exists
const cronPath = path.join(process.cwd(), "app/api/cron/calibration/route.ts");
check("Calibration cron exists", fs.existsSync(cronPath), "app/api/cron/calibration/route.ts not found");

// 6. Admin surface exists
const adminPath = path.join(process.cwd(), "pages/admin/calibration.tsx");
check("Admin calibration surface exists", fs.existsSync(adminPath), "pages/admin/calibration.tsx not found");

// 7. Tests exist
const testPath = path.join(process.cwd(), "lib/calibration/calibration-engine.test.ts");
check("Calibration tests exist", fs.existsSync(testPath), "lib/calibration/calibration-engine.test.ts not found");

// Report
console.log("\n=== CALIBRATION INTEGRITY AUDIT ===\n");
for (const p of PASS_CHECKS) console.log(p);
for (const f of FAIL_REASONS) console.log(f);
console.log(`\n${PASS_CHECKS.length} passed, ${FAIL_REASONS.length} failed\n`);

if (FAIL_REASONS.length > 0) {
  process.exit(1);
}
