import fs from "node:fs";
import path from "node:path";

const registryPath = path.join(process.cwd(), "lib", "reporting", "report-output-registry.ts");
const source = fs.readFileSync(registryPath, "utf8");

const failures = [];

if (!source.includes("REPORT_OUTPUT_REGISTRY")) {
  failures.push("REPORT_OUTPUT_REGISTRY export is missing.");
}

if (source.includes("reportStandardTier: \"free\"") && /reportStandardTier: "free"[\s\S]{0,500}arrivalVariant: "(transmission|sealed|intelligence)"/.test(source)) {
  failures.push("Free report entries must not use boardroom, executive, or intelligence arrival variants.");
}

const paidFalse = /reportStandardTier: "(paid|boardroom|executive|retainer)"[\s\S]{0,700}arrivalImplemented: false/.exec(source);
if (paidFalse) {
  failures.push("A paid report registry entry has arrivalImplemented: false.");
}

for (const required of [
  "boardroom_dossier",
  "executive_client_report",
  "gmi_q1_2026_institutional_report",
  "strategy_room_session_report",
  "retainer_oversight_cycle",
  "fast_diagnostic_result",
]) {
  if (!source.includes(`reportCode: "${required}"`)) {
    failures.push(`Missing report registry entry: ${required}`);
  }
}

if (!source.includes("isReportOutputSellable")) {
  failures.push("Report output sellable gate helper is missing.");
}

if (failures.length > 0) {
  console.error("Report output registry gate failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log("Report output registry gate passed.");
