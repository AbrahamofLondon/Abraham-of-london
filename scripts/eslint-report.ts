import fs from "fs";
import path from "path";

const reportPath = path.resolve(".reports/eslint.json");
if (!fs.existsSync(reportPath)) {
  console.error(`Missing ${reportPath}. Run: pnpm exec eslint . --format json --output-file .reports/eslint.json`);
  process.exit(2);
}

const raw = fs.readFileSync(reportPath, "utf8");
const results = JSON.parse(raw);

let errors = 0;
let warnings = 0;

for (const file of results) {
  const msgs = file.messages || [];
  for (const m of msgs) {
    const sev = m.severity === 2 ? "ERROR" : "WARN";
    if (m.severity === 2) errors++;
    else warnings++;

    const where = `${file.filePath}:${m.line ?? 0}:${m.column ?? 0}`;
    const rule = m.ruleId ?? "unknown-rule";
    console.log(`${sev} ${where} ${rule} ${m.message}`);
  }
}

console.log(`\nTotals: ${errors} errors, ${warnings} warnings`);
process.exit(errors > 0 ? 1 : 0);
