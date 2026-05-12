/**
 * scripts/value-surface-guard.mjs
 *
 * Verifies all paid/governed surfaces have:
 *   1. Price visibility where relevant
 *   2. Delivery format visibility
 *   3. Included outputs listed
 *   4. No "upgrade now" language
 *   5. No "premium content" language
 *   6. Memory/dossier status on decision instruments
 *   7. Free/paid distinction on Purpose Alignment
 *   8. Retained surfaces show continuity/memory/cadence value
 *   9. Next admissible move on paid surfaces
 *   10. Access posture not hidden
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

let violations = 0;

function check(condition, label, detail) {
  if (!condition) {
    console.error(`  ❌ FAIL: ${label} — ${detail}`);
    violations++;
  } else {
    console.log(`  ✅ PASS: ${label}`);
  }
}

function fileContains(path, pattern) {
  try {
    const content = readFileSync(join(ROOT, path), "utf-8");
    if (typeof pattern === "string") return content.includes(pattern);
    return pattern.test(content);
  } catch {
    return false;
  }
}

console.log("\n🔍 VALUE SURFACE GUARD — Commercial Transparency Check\n");

// ── 1. Decision instruments index shows prices ──
console.log("\n📋 Decision Instruments Index");
const diIndex = "pages/decision-instruments/index.tsx";
check(
  fileContains(diIndex, "getProductDisplayPrice"),
  "Uses catalog pricing",
  "No price lookup found",
);
check(
  fileContains(diIndex, "getProductDisplayPrice") || fileContains(diIndex, "price"),
  "Shows prices via catalog",
  "No price references found",
);

// ── 2. Decision instrument detail pages show delivery format ──
console.log("\n📋 Decision Instrument Detail");
const diDetail = "pages/decision-instruments/[slug].tsx";
check(
  fileContains(diDetail, "whatItProduces"),
  "Lists what it produces",
  "No whatItProduces found",
);
check(
  fileContains(diDetail, "price"),
  "Shows price",
  "No price reference found",
);

// ── 3. No "upgrade now" or "premium content" language ──
console.log("\n📋 Forbidden Language Check");
const forbiddenPatterns = [
  { pattern: /upgrade now/i, label: "No 'upgrade now'" },
  { pattern: /premium content/i, label: "No 'premium content'" },
  { pattern: /unlock premium/i, label: "No 'unlock premium'" },
  { pattern: /go Pro/i, label: "No 'go Pro'" },
];
const surfacesToCheck = [
  "pages/decision-instruments/index.tsx",
  "pages/decision-instruments/[slug].tsx",
  "pages/diagnostics/purpose-alignment.tsx",
  "pages/diagnostics/executive-reporting/run.tsx",
  "pages/strategy-room/index.tsx",
  "pages/decision-centre.tsx",
  "pages/boardroom/index.tsx",
  "pages/oversight/index.tsx",
  "pages/playbooks/index.tsx",
  "pages/frameworks/index.tsx",
];
for (const { pattern, label } of forbiddenPatterns) {
  let found = false;
  for (const file of surfacesToCheck) {
    if (fileContains(file, pattern)) {
      found = true;
      console.error(`  ❌ FAIL: ${label} — found in ${file}`);
      violations++;
      break;
    }
  }
  if (!found) console.log(`  ✅ PASS: ${label}`);
}

// ── 4. Decision instruments show memory/dossier status ──
console.log("\n📋 Memory & Dossier Status");
check(
  fileContains(diDetail, "writesToDecisionMemory") || fileContains(diDetail, "memory"),
  "References memory write",
  "No memory reference found in detail page",
);

// ── 5. Purpose Alignment shows free/paid distinction ──
console.log("\n📋 Purpose Alignment Free/Paid Distinction");
const paPage = "pages/diagnostics/purpose-alignment.tsx";
check(
  fileContains(paPage, "entitlementState"),
  "Has entitlement state tracking",
  "No entitlement state found",
);
check(
  fileContains(paPage, "free") && fileContains(paPage, "paid_unlocked"),
  "Shows both free and paid states",
  "Missing free or paid state labels",
);

// ── 6. Retained/oversight surfaces show continuity value ──
console.log("\n📋 Retained Surface Value");
const oversightPages = [
  "pages/oversight/index.tsx",
  "pages/oversight/brief/[cycleId].tsx",
  "pages/oversight/portfolio.tsx",
];
for (const page of oversightPages) {
  if (!existsSync(join(ROOT, page))) continue;
  check(
    fileContains(page, "cadence") || fileContains(page, "continuity") || fileContains(page, "memory") || fileContains(page, "history"),
    `${page} shows continuity/cadence value`,
    "No continuity/cadence/memory reference found",
  );
}

// ── 7. Paid surfaces have next admissible move ──
console.log("\n📋 Next Admissible Move on Paid Surfaces");
const paidSurfaces = [
  { path: "pages/decision-instruments/[slug].tsx", pattern: "nextAdmissibleMove" },
  { path: "pages/diagnostics/executive-reporting/run.tsx", pattern: "nextAdmittedStep" },
];
for (const { path, pattern } of paidSurfaces) {
  if (!existsSync(join(ROOT, path))) continue;
  check(
    fileContains(path, pattern),
    `${path} has next admissible move`,
    "No next admissible move reference found",
  );
}

// ── 8. Access posture not hidden ──
console.log("\n📋 Access Posture Visibility");
const postureTerms = [
  "Free signal", "Paid instrument", "Earned escalation", "Restricted", "Retained oversight",
  "accessPosture", "AccessPosture", "AccessPostureBadge",
  "Free assessment", "paid_unlocked", "Personal Decision Audit",
  "Decision Centre", "Oversight", "Boardroom",
  "Governed playbook", "Retained",
  "architect", "tier", "PlaybookCard",
  "Paid", "Free", "Instrument",
];
for (const page of surfacesToCheck) {
  if (!existsSync(join(ROOT, page))) continue;
  const hasPosture = postureTerms.some((term) => fileContains(page, term));
  check(
    hasPosture,
    `${page} has access posture label`,
    "No access posture label found",
  );
}

// ── 9. Strategy Room shows governance value ──
console.log("\n📋 Strategy Room Value");
const srIndex = "pages/strategy-room/index.tsx";
if (existsSync(join(ROOT, srIndex))) {
  check(
    fileContains(srIndex, "govern") || fileContains(srIndex, "intervention") || fileContains(srIndex, "execution"),
    "Strategy Room shows governance/intervention value",
    "No governance/intervention reference found",
  );
}

// ── 10. Boardroom shows qualification criteria ──
console.log("\n📋 Boardroom Value");
const brIndex = "pages/boardroom/index.tsx";
if (existsSync(join(ROOT, brIndex))) {
  check(
    fileContains(brIndex, "qualified") || fileContains(brIndex, "dossier") || fileContains(brIndex, "board"),
    "Boardroom shows qualification/dossier value",
    "No qualification/dossier reference found",
  );
}

// ── 11. Homepage category declaration ──────────────────────────────────────────
console.log("\n📋 Homepage Category Declaration");
const heroFile = "components/homepage/HomepageHero.tsx";
check(
  fileContains(heroFile, "Governed Decision Intelligence"),
  "Homepage hero declares 'Governed Decision Intelligence'",
  "Category phrase not found in HomepageHero.tsx",
);
check(
  fileContains(heroFile, "Evidence first") || fileContains(heroFile, "No guaranteed outcomes"),
  "Homepage hero includes evidence-first credibility line",
  "Evidence-first credibility line not found",
);
check(
  fileContains(heroFile, "Submit One Real Decision"),
  "Homepage CTA is 'Submit One Real Decision'",
  "Required CTA text not found in hero",
);

// ── 12. Homepage verification spine ────────────────────────────────────────────
console.log("\n📋 Homepage Verification Spine");
const spineFile = "components/homepage/VerificationSpineBlock.tsx";
check(
  existsSync(join(ROOT, spineFile)),
  "VerificationSpineBlock component exists",
  "components/homepage/VerificationSpineBlock.tsx not found",
);
check(
  fileContains(spineFile, "Detect") && fileContains(spineFile, "Verify") && fileContains(spineFile, "Correct"),
  "Verification spine contains Detect, Verify, and Correct steps",
  "Spine steps incomplete",
);
check(
  fileContains(spineFile, "future review point") || fileContains(spineFile, "operator review"),
  "Verification spine references future review point or operator review",
  "No future review/operator review copy found",
);

// ── 13. Homepage correction transparency ────────────────────────────────────────
console.log("\n📋 Homepage Correction Transparency");
const trustFile = "components/homepage/TrustArchitectureBlock.tsx";
check(
  fileContains(trustFile, "Correction is part of the governance") ||
  fileContains(trustFile, "record can reflect it"),
  "Trust block states correction is part of governance",
  "Correction transparency language not found",
);
check(
  fileContains(trustFile, "operator review") || fileContains(trustFile, "evidence posture"),
  "Trust block references evidence posture / operator review",
  "Evidence posture / operator review language missing from trust block",
);

// ── 14. Homepage forbidden copy terms ──────────────────────────────────────────
console.log("\n📋 Homepage Forbidden Copy Terms");
const homepageFiles = [
  "components/homepage/HomepageHero.tsx",
  "components/homepage/CategoryFrontDoor.tsx",
  "components/homepage/VerificationSpineBlock.tsx",
  "components/homepage/OperatorPilotBlock.tsx",
  "components/homepage/HomepageFinalCTA.tsx",
];
const homepageForbidden = [
  { pattern: /\bAI-powered\b/gi, label: "AI-powered" },
  { pattern: /guaranteed outcome/gi, label: "guaranteed outcome (affirmative claim)" },
  { pattern: /\bupgrade\b/gi, label: "upgrade (SaaS upsell language)" },
];
// Negation phrases that make a match acceptable (disclaimers, not claims)
const homepageNegations = [
  "no guaranteed outcomes",
  "not guaranteed outcomes",
  "no guaranteed outcome",
  "not guaranteed outcome",
  "no outcomes guaranteed",
];
for (const { pattern, label } of homepageForbidden) {
  let found = false;
  for (const file of homepageFiles) {
    try {
      const lines = readFileSync(join(ROOT, file), "utf-8").split("\n");
      for (const line of lines) {
        pattern.lastIndex = 0;
        if (pattern.test(line)) {
          const lower = line.toLowerCase();
          const isNegation = homepageNegations.some((n) => lower.includes(n));
          if (!isNegation) {
            found = true;
            console.error(`  ❌ FAIL: Homepage forbidden term '${label}' — found in ${file}: ${line.trim()}`);
            violations++;
            break;
          }
        }
      }
    } catch { /* file not found — other checks handle existence */ }
    if (found) break;
  }
  if (!found) console.log(`  ✅ PASS: Homepage does not use '${label}'`);
}

// ── 15. Operator pilot block ────────────────────────────────────────────────────
console.log("\n📋 Operator Pilot Block");
const pilotFile = "components/homepage/OperatorPilotBlock.tsx";
check(
  existsSync(join(ROOT, pilotFile)),
  "OperatorPilotBlock component exists",
  "components/homepage/OperatorPilotBlock.tsx not found",
);
check(
  fileContains(pilotFile, "controlled proof") || fileContains(pilotFile, "Selective Operator Pilot"),
  "Pilot block uses controlled proof language",
  "Controlled proof language not found in OperatorPilotBlock",
);
check(
  fileContains(pilotFile, "Submit One Real Decision"),
  "Pilot block CTA is 'Submit One Real Decision'",
  "Required pilot CTA text not found",
);
check(
  fileContains(pilotFile, "Read Pilot Terms"),
  "Pilot block has 'Read Pilot Terms' secondary CTA",
  "Secondary pilot CTA not found",
);

// Summary
console.log(`\n${"=".repeat(50)}`);
console.log(`RESULTS: ${violations} violations`);
console.log(`${"=".repeat(50)}`);

if (violations > 0) {
  console.error("\n❌ VALUE SURFACE GUARD FAILED\n");
  process.exit(1);
} else {
  console.log("\n✅ VALUE SURFACE GUARD PASSED\n");
}
