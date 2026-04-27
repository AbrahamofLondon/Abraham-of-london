/**
 * Homepage Conversion Dominance Audit
 * Run: npx tsx scripts/audit-homepage-conversion.ts
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "..");
const PASS = "\x1b[32m PASS\x1b[0m";
const FAIL = "\x1b[31m FAIL\x1b[0m";
let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) { console.log(`${PASS}  ${name}`); passed++; }
  else { console.log(`${FAIL}  ${name}${detail ? ` — ${detail}` : ""}`); failed++; }
}

function read(p: string): string {
  const f = path.join(ROOT, p);
  return fs.existsSync(f) ? fs.readFileSync(f, "utf-8") : "";
}

console.log("\n========================================");
console.log("  HOMEPAGE CONVERSION DOMINANCE AUDIT");
console.log("========================================\n");

const src = read("pages/index.tsx");

// Extract rendered content (between Layout tags in the HomePage component)
const renderMatch = src.match(/const HomePage[\s\S]*?return\s*\(\s*<Layout[\s\S]*?<\/Layout>/);
const rendered = renderMatch ? renderMatch[0] : src;

// 1. Single hero — only one hero component rendered
console.log("─── Hero ───\n");
const heroRenderCount = (rendered.match(/<HomeHero/g) || []).length;
const heroSectionRenderCount = (rendered.match(/<HeroSection/g) || []).length;
check("Only one primary hero rendered", heroRenderCount === 1 && heroSectionRenderCount === 0, `HomeHero=${heroRenderCount}, HeroSection=${heroSectionRenderCount}`);

// 2. Hero includes decision-not-taken reframe
check("Hero includes decision-not-taken reframe", src.includes("decision that hasn") || src.includes("decision that hasn\u2019t"));

// 3. CTA says "Run the diagnostic"
check("Primary CTA says 'Run the diagnostic'", src.includes("Run the diagnostic"));

// 4. ProofLayer appears before product explanation
console.log("\n─── Structure ───\n");
const proofLayerPos = rendered.indexOf("ProofLayer");
const howItWorksPos = rendered.indexOf("HowItWorksLadder");
check("ProofLayer appears before product ladder", proofLayerPos > -1 && howItWorksPos > -1 && proofLayerPos < howItWorksPos);

// 5. Consequence escalation block exists after proof
const consequencePos = rendered.indexOf("ConsequenceEscalation");
check("Consequence escalation block exists after proof", consequencePos > -1 && proofLayerPos > -1 && consequencePos > proofLayerPos);

// 6. Concrete diagnostic output preview exists
check("Concrete diagnostic output preview exists", src.includes("Example diagnostic output"));

// 7. Trust links visible before final CTA
console.log("\n─── Trust & Conversion ───\n");
const trustStripPos = rendered.indexOf("Before you enter the system");
const finalCtaPos = rendered.indexOf("HomeFinalCta");
check("Trust links visible before final CTA", trustStripPos > -1 && finalCtaPos > -1 && trustStripPos < finalCtaPos);

// 8. Content/library section does not appear before core product ladder
const contentLibraryPos = rendered.indexOf("ContentLibrarySection");
check("Content/library section does not appear before product ladder", contentLibraryPos === -1 || (howItWorksPos > -1 && contentLibraryPos > howItWorksPos));

// 9. No fake statistics
check("No fake statistics", !/\b\d{2,3}%\b.*similar (cases|companies|organisations)/i.test(src));

// 10. No unsupported claims (exclude CSS/SVG false positives)
const textContent = src.replace(/style=\{[^}]*\}/g, "").replace(/`[^`]*`/g, "");
check("No unsupported claims", !/(guaranteed|proven to|always works)/i.test(textContent));

// 11. Do-not-sell language is present but restrained
check("Do-not-sell language present", src.includes("will not force a paid next step") || src.includes("No sale if the case is not ready"));

// 12. Final CTA points to diagnostic
console.log("\n─── Final CTA ───\n");
const finalCtaSection = src.match(/function HomeFinalCta[\s\S]*?^}/m);
const finalCtaSrc = finalCtaSection ? finalCtaSection[0] : "";
check("Final CTA points to diagnostic", finalCtaSrc.includes("/diagnostics/fast"));

// 13. System description line present
check("System description line under hero CTA", src.includes("identifies the contradiction, prices the consequence"));

// 14. Product clarity block exists
check("Product clarity block exists", src.includes("ProductClarity") && src.includes("What happens after the diagnostic"));

// 15. Secondary CTA says "See what the system returns"
check("Secondary CTA present", src.includes("See what the system returns"));

// 16. Illustrative format disclaimer
check("Output disclaimer present", src.includes("Your result is generated from your own inputs"));

console.log(`\n========================================`);
console.log(`  RESULTS: ${passed} pass, ${failed} fail`);
console.log(`========================================\n`);

if (failed > 0) { console.log("HOMEPAGE — STILL LEAKING\n"); process.exit(1); }
else { console.log("HOMEPAGE — CONVERSION DOMINANCE READY\n"); }
