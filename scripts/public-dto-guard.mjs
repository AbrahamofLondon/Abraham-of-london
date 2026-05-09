import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const targets = [
  "app/api/executive-reporting/run/route.ts",
  "app/api/decision/guidance/route.ts",
  "app/api/strategy-room/session/init/route.ts",
  "pages/api/checkpoints/respond.ts",
  "pages/api/counsel/intake.ts",
  "pages/api/decision-centre/cases.ts",
  "pages/api/outcomes/verify.ts",
];

const forbiddenPatterns = [
  /\bkernel\b/i,
  /\bgraph\b/i,
  /\barbiterRules\b/i,
  /\bscoringFormula\b/i,
  /\bthreshold\b/i,
  /\bweights?\b/i,
  /\brawEvidenceNodes\b/i,
  /\binternalTrace\b/i,
  /\boperatorNotes\b/i,
  /\bcounselNotes\b/i,
  /\bprompt\b/i,
  /\bsystemPrompt\b/i,
  /\bmodelTrace\b/i,
  /\bdebug\b/i,
  /\brawScores\b/i,
  /\bscoreComponents\b/i,
];

const failures = [];

function extractJsonBlocks(text) {
  const blocks = [];
  const marker = ".json(";
  let start = 0;

  while (start < text.length) {
    const jsonIndex = text.indexOf(marker, start);
    if (jsonIndex === -1) break;
    const objectStart = text.indexOf("{", jsonIndex + marker.length);
    if (objectStart === -1) break;

    let depth = 0;
    let end = objectStart;
    let quote = null;
    let escaped = false;

    for (; end < text.length; end += 1) {
      const char = text[end];
      if (quote) {
        if (escaped) {
          escaped = false;
          continue;
        }
        if (char === "\\") {
          escaped = true;
          continue;
        }
        if (char === quote) {
          quote = null;
        }
        continue;
      }

      if (char === "'" || char === '"' || char === "`") {
        quote = char;
        continue;
      }
      if (char === "{") depth += 1;
      if (char === "}") {
        depth -= 1;
        if (depth === 0) {
          blocks.push(text.slice(objectStart, end + 1));
          break;
        }
      }
    }

    start = end + 1;
  }

  return blocks;
}

for (const rel of targets) {
  const file = path.join(root, rel);
  if (!fs.existsSync(file)) continue;
  const text = fs.readFileSync(file, "utf8");
  const jsonBlocks = extractJsonBlocks(text);

  if (jsonBlocks.length === 0) {
    failures.push(`${rel}: no public JSON payload block found`);
    continue;
  }

  for (const block of jsonBlocks) {
    for (const pattern of forbiddenPatterns) {
      if (pattern.test(block)) {
        failures.push(`${rel}: forbidden public payload token matched ${pattern}`);
      }
    }
  }
}

if (failures.length > 0) {
  console.error("PUBLIC_DTO_GUARD: FAIL");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("PUBLIC_DTO_GUARD: PASS");
