#!/usr/bin/env node
/**
 * Market adoption posture audit.
 *
 * Maps product journeys to real buyer pain, then checks whether the current
 * public/user-facing surfaces make the pain, action, evidence, and next step
 * obvious enough for adoption.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { extname, join, relative } from "node:path";

const ROOT = process.cwd();
const REPORTS = join(ROOT, "reports");
const SCAN_ROOTS = ["pages", "app", "components", "content", "emails", "lib/product", "lib/commercial"];
const TEXT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".md", ".mdx"]);

const PRODUCTS = [
  {
    productCode: "fast_diagnostic",
    surfaceFiles: ["pages/diagnostics/fast.tsx", "pages/foundry/decision-test.tsx", "components/kernel/FreeSignalResult.tsx"],
    marketPain: "Leaders make expensive decisions from incomplete evidence and need a fast signal before committing.",
    buyer: "Founder, operator, functional executive",
    user: "Decision owner under time pressure",
    triggerEvent: "A decision is live, stakes are high, and internal confidence feels stronger than the evidence.",
    currentAlternative: "Ask a senior colleague, consultant, or generic AI prompt for a second opinion.",
    whyAlternativeFails: "The alternative may sound useful without forcing evidence, uncertainty, falsification, or authority limits.",
    productResolution: "Capture the case, derive judgement by pattern, expose consequence, next move, falsification, and escalation trigger.",
    commercialWording: "A fast evidence-governed decision signal that shows what would make the decision safer before you commit.",
  },
  {
    productCode: "team_assessment",
    surfaceFiles: ["pages/diagnostics/team-assessment.tsx", "pages/api/diagnostics/team-alignment.ts", "components/diagnostics/AssessmentResultSurface.tsx"],
    marketPain: "Teams hide disagreement behind consensus language until execution exposes the split.",
    buyer: "CEO, COO, chief of staff, people/operations lead",
    user: "Team lead or facilitator",
    triggerEvent: "A leadership team says it agrees but execution signals, priorities, or ownership are diverging.",
    currentAlternative: "Run a workshop, survey, or retrospective.",
    whyAlternativeFails: "The output often records sentiment without forcing decision authority, evidence gaps, or next action.",
    productResolution: "Surface alignment gaps, decision risk, accountability, and the next evidence or operating move.",
    commercialWording: "A governed alignment diagnostic that turns soft consensus into visible decision risk and action.",
  },
  {
    productCode: "enterprise_assessment",
    surfaceFiles: ["pages/diagnostics/enterprise-assessment.tsx", "pages/api/diagnostics/enterprise.ts", "components/diagnostics/AssessmentResultSurface.tsx"],
    marketPain: "Enterprise decisions pass through committees without a clear evidence state or authority owner.",
    buyer: "Executive sponsor, transformation leader, risk/governance lead",
    user: "Programme owner, PMO, strategy/operations team",
    triggerEvent: "A strategic initiative is moving through governance with unresolved dependencies or unclear ownership.",
    currentAlternative: "Governance deck, steering committee pack, consultant assessment.",
    whyAlternativeFails: "The pack can describe risk but still permit unsupported authority and vague next steps.",
    productResolution: "Bind decision risk to evidence, authority, limitations, and escalation conditions.",
    commercialWording: "Decision governance that shows where enterprise confidence is unsupported before the programme hardens.",
  },
  {
    productCode: "personal_decision_audit",
    surfaceFiles: ["pages/test-your-decision.tsx", "pages/checkout/personal-decision-audit.tsx", "pages/decision-instruments/[slug].tsx"],
    marketPain: "A founder or leader needs a defensible decision record, not another reflective worksheet.",
    buyer: "Founder, executive, advisor, operator",
    user: "Individual decision owner",
    triggerEvent: "A personal or commercial decision has consequences but lacks a structured decision record.",
    currentAlternative: "Coaching call, template, generic AI analysis, private notes.",
    whyAlternativeFails: "The output rarely creates a traceable evidence position, falsification test, and execution sequence.",
    productResolution: "Use a decision instrument to convert the case into a governed judgement and action path.",
    commercialWording: "A decision audit that turns one live choice into a traceable judgement and next evidence action.",
  },
  {
    productCode: "decision_centre",
    surfaceFiles: ["pages/decision-centre.tsx", "pages/decision-centre/case/[caseId].tsx", "lib/product/decision-centre-contract.ts"],
    marketPain: "Organisations repeat the same decision failures because cases, evidence, and lessons are not retained in one operating surface.",
    buyer: "COO, chief of staff, transformation leader",
    user: "Decision operations team",
    triggerEvent: "Multiple decisions are moving at once and leadership cannot see evidence quality or risk state.",
    currentAlternative: "Spreadsheets, PMO dashboards, Slack threads, board packs.",
    whyAlternativeFails: "The alternatives track activity but not decision authority, falsification, or reusable learning.",
    productResolution: "Create a live centre for decision cases, evidence state, authority state, and next action.",
    commercialWording: "A decision operating surface for tracking which choices are supported, exposed, or blocked.",
  },
  {
    productCode: "boardroom_mode",
    surfaceFiles: ["app/boardroom/dossier/[dossierId]/page.tsx", "app/boardroom/dossier/[dossierId]/BoardroomDossierClient.tsx", "lib/boardroom/boardroom-dossier-service.ts"],
    marketPain: "Boards approve strategy without seeing what would falsify the case or where authority is unsupported.",
    buyer: "Chair, board member, CEO, investor",
    user: "Board secretary, strategy lead, executive sponsor",
    triggerEvent: "A board-level decision requires scrutiny before approval.",
    currentAlternative: "Board paper or consultant deck.",
    whyAlternativeFails: "The format can reward persuasive narrative over evidence pressure and explicit challenge.",
    productResolution: "Present decision risk, evidence, falsification triggers, and unsupported claims in board-facing form.",
    commercialWording: "Boardroom evidence pressure for decisions that should not pass on narrative strength alone.",
  },
  {
    productCode: "global_market_reports",
    surfaceFiles: ["pages/intelligence/market.tsx", "pages/artifacts/global-market-outlook-q1-2026-public.tsx", "lib/intelligence/market-intelligence-lifecycle.ts"],
    marketPain: "Leaders need market intelligence connected to decision consequences, not static commentary.",
    buyer: "Investor, CEO, strategy lead",
    user: "Strategy, research, commercial planning team",
    triggerEvent: "A macro or market shift changes strategic timing, exposure, or prioritisation.",
    currentAlternative: "Analyst report, newsletter, generic AI market summary.",
    whyAlternativeFails: "The output often stops at insight rather than decision implication, evidence state, and next action.",
    productResolution: "Turn market signals into decision lessons, constraints, limitations, and reuse value.",
    commercialWording: "Market intelligence that is governed by evidence and connected to decision action.",
  },
  {
    productCode: "control_room",
    surfaceFiles: ["pages/admin/authority-center.tsx", "pages/admin/index.tsx", "components/product/ProductAuthorityPanel.tsx"],
    marketPain: "Operators cannot prove which claims and products are externally supported versus internally asserted.",
    buyer: "Founder, product owner, governance lead",
    user: "Internal operator/admin",
    triggerEvent: "A product claim, launch, or sales page needs authority before going public.",
    currentAlternative: "Manual review, status spreadsheet, launch checklist.",
    whyAlternativeFails: "Manual state is easy to drift from the actual user-facing surface.",
    productResolution: "Expose product authority, evidence ledger state, and blocked claims in one admin surface.",
    commercialWording: "A control room for keeping product claims inside their evidence authority.",
  },
  {
    productCode: "checkout_fulfilment",
    surfaceFiles: ["pages/checkout/personal-decision-audit.tsx", "pages/api/checkout/decision-failure-brief.ts", "lib/product/product-fulfilment-contract.ts"],
    marketPain: "A buyer needs clear fulfilment after purchase and confidence that the delivered output matches the public promise.",
    buyer: "Paying customer",
    user: "Paying customer",
    triggerEvent: "A user is ready to buy or has paid for a decision product.",
    currentAlternative: "Consulting booking form or generic downloadable product.",
    whyAlternativeFails: "Payment, fulfilment, and evidence authority can be disconnected.",
    productResolution: "Tie product claims, checkout, output route, and fulfilment contract together.",
    commercialWording: "Purchase only the decision product whose output and evidence status are explicit.",
  },
];

const files = listFiles(SCAN_ROOTS);
const corpus = new Map(files.map((file) => [file, read(file)]));
const rows = PRODUCTS.map(auditProduct);
const postureCounts = countBy(rows, "adoptionPosture");
const marketPainUnclear = rows.filter((row) => row.flags.includes("market_pain_unclear"));
const gate = "PASSED_WITH_FINDINGS";

const result = {
  generatedAt: new Date().toISOString(),
  gate,
  marketAdoptionState: deriveOverallPosture(rows),
  productsAudited: rows.length,
  postureCounts,
  marketPainUnclearCount: marketPainUnclear.length,
  rows,
  adoptionFindings: buildAdoptionFindings(rows),
  implementationReadyRecommendations: [
    "Put the pain, the decision action, and the evidence state in the first viewport of every product entry route.",
    "Replace abstract authority language on customer surfaces with visible evidence state, limitation, next evidence action, and blocked-claim state.",
    "Wire the ProductAuthorityContract and evidence ledger into public product pages, result pages, checkout, and admin authority centre.",
    "Turn static market and boardroom surfaces into decision outputs with consequence, falsification trigger, and reuse value.",
    "Give every route a single next action that follows from the judgement state: test evidence, assign owner, escalate, reduce scope, or buy/submit.",
  ],
};

mkdirSync(REPORTS, { recursive: true });
writeFileSync(join(REPORTS, "market-adoption-posture-audit.json"), `${JSON.stringify(result, null, 2)}\n`);
writeFileSync(join(REPORTS, "market-adoption-posture-audit.md"), renderMarkdown(result));

console.log("MARKET ADOPTION POSTURE AUDIT");
console.log(`Gate: ${result.gate}`);
console.log(`Products audited: ${result.productsAudited}`);
console.log(`Market adoption state: ${result.marketAdoptionState}`);
console.log(`Market pain unclear: ${result.marketPainUnclearCount}`);

function auditProduct(product) {
  const surfaceText = product.surfaceFiles.map((file) => read(file)).join("\n");
  const routeFilesPresent = product.surfaceFiles.filter((file) => existsSync(join(ROOT, file)));
  const publicCorpusText = [...corpus.entries()]
    .filter(([file]) => product.surfaceFiles.includes(file))
    .map(([, text]) => text)
    .join("\n");
  const combined = `${surfaceText}\n${publicCorpusText}`.toLowerCase();

  const signals = {
    routeOrSurfaceExists: routeFilesPresent.length > 0,
    painVisible: hasAny(combined, ["pain", "risk", "cost of delay", "delay", "misalignment", "unresolved", "exposure", "failure"]),
    buyerClear: hasAny(combined, ["leader", "founder", "operator", "board", "enterprise", "team", "customer", "buyer"]),
    productActionClear: hasAny(combined, ["submit", "start", "run", "diagnose", "checkout", "download", "book", "continue"]),
    evidenceVisible: hasAny(combined, ["evidence", "authority", "validated", "ledger", "proof", "limitation"]),
    judgementVisible: hasAny(combined, ["diagnosis", "judgement", "consequence", "next move", "falsification", "escalation"]),
    genericAiContrastVisible: hasAny(combined, ["generic ai", "generic prompt", "prompt", "unaccountable ai", "unsupported advice"]),
    authorityContractVisible: hasAny(combined, ["productauthority", "resolveproductauthority", "productauthoritycontract", "authoritystate"]),
    limitationVisible: hasAny(combined, ["limitation", "does not prove", "unsupported", "blocked", "not proven"]),
    fulfilmentOrNextActionVisible: hasAny(combined, ["success", "fulfilment", "checkout", "book", "report", "dashboard", "next action", "continue"]),
  };

  const evidenceOfResolution = buildEvidenceOfResolution(signals, product, combined);
  const flags = buildFlags(signals, product);
  const adoptionPosture = classifyPosture(signals, flags);

  return {
    productCode: product.productCode,
    marketPain: product.marketPain,
    buyer: product.buyer,
    user: product.user,
    triggerEvent: product.triggerEvent,
    currentAlternative: product.currentAlternative,
    whyCurrentAlternativeFails: product.whyAlternativeFails,
    productResolution: product.productResolution,
    evidenceOfResolution,
    commercialWording: product.commercialWording,
    surfaceFiles: product.surfaceFiles,
    routeFilesPresent,
    signals,
    flags,
    adoptionPosture,
    recommendedAction: recommendAction(adoptionPosture, flags, product),
  };
}

function buildEvidenceOfResolution(signals, product, text) {
  const evidence = [];
  if (signals.routeOrSurfaceExists) evidence.push("Product route or surface file exists.");
  if (signals.evidenceVisible) evidence.push("Surface references evidence, authority, validation, proof, or limitations.");
  if (signals.judgementVisible) evidence.push("Surface references judgement output such as diagnosis, consequence, next move, falsification, or escalation.");
  if (signals.productActionClear) evidence.push("Surface includes a visible product action or submission path.");
  if (text.includes("productauthority") || text.includes("resolveproductauthority")) evidence.push("Surface appears to reference ProductAuthority components or resolver.");
  if (evidence.length === 0) evidence.push("No customer-visible resolution evidence found in audited surface files.");
  return evidence;
}

function buildFlags(signals) {
  const flags = [];
  if (!signals.routeOrSurfaceExists) flags.push("missing_surface");
  if (!signals.painVisible) flags.push("market_pain_unclear");
  if (!signals.buyerClear) flags.push("buyer_unclear");
  if (!signals.productActionClear) flags.push("missing_next_action");
  if (!signals.evidenceVisible) flags.push("evidence_layer_not_visible");
  if (!signals.judgementVisible) flags.push("judgement_value_not_visible");
  if (!signals.authorityContractVisible) flags.push("authority_contract_not_visible");
  if (!signals.limitationVisible) flags.push("limitations_not_visible");
  if (!signals.genericAiContrastVisible) flags.push("generic_ai_contrast_weak");
  if (!signals.fulfilmentOrNextActionVisible) flags.push("fulfilment_or_next_action_unclear");
  return flags;
}

function classifyPosture(signals, flags) {
  if (!signals.routeOrSurfaceExists || flags.includes("judgement_value_not_visible")) return "not_market_ready";
  if (flags.includes("market_pain_unclear") || flags.includes("missing_next_action")) return "interesting_but_unclear";
  if (flags.includes("evidence_layer_not_visible") || flags.includes("authority_contract_not_visible")) return "credible_but_too_complex";
  if (flags.includes("generic_ai_contrast_weak") || flags.includes("limitations_not_visible")) return "strong_but_needs_clarity";
  if (flags.length > 0) return "strong_but_needs_clarity";
  return "dominant";
}

function deriveOverallPosture(rows) {
  if (rows.some((row) => row.adoptionPosture === "not_market_ready")) return "not_market_ready";
  if (rows.some((row) => row.adoptionPosture === "interesting_but_unclear")) return "interesting_but_unclear";
  if (rows.some((row) => row.adoptionPosture === "credible_but_too_complex")) return "credible_but_too_complex";
  if (rows.some((row) => row.adoptionPosture === "strong_but_needs_clarity")) return "strong_but_needs_clarity";
  return "dominant";
}

function recommendAction(posture, flags, product) {
  if (flags.includes("missing_surface")) return "Create or expose the customer route before making adoption claims.";
  if (flags.includes("judgement_value_not_visible")) return "Render diagnosis, consequence, next move, falsification, and limitation on the product surface.";
  if (flags.includes("authority_contract_not_visible")) return "Wire ProductAuthorityContract state into the customer-visible surface before claiming governed authority.";
  if (flags.includes("evidence_layer_not_visible")) return "Show evidence state, authority state, limitations, and next evidence action in the customer journey.";
  if (flags.includes("generic_ai_contrast_weak")) return "State why this product is accountable decision infrastructure rather than generic AI advice.";
  if (posture === "dominant") return "Keep language strong and bind it to visible proof.";
  return `Clarify ${product.productCode} around one buyer pain, one product action, and one evidence-backed next step.`;
}

function buildAdoptionFindings(rows) {
  return rows.map((row) => ({
    productCode: row.productCode,
    adoptionPosture: row.adoptionPosture,
    marketPain: row.marketPain,
    currentAlternative: row.currentAlternative,
    recommendedAction: row.recommendedAction,
  }));
}

function renderMarkdown(report) {
  const lines = [
    "# Market Adoption Posture Audit",
    "",
    "## Gate Result",
    "",
    `Gate: ${report.gate}`,
    "",
    `Market adoption state: ${report.marketAdoptionState}`,
    "",
    "## Products Audited",
    "",
    "| Product | Buyer | User | Adoption Posture | Flags |",
    "| --- | --- | --- | --- | --- |",
    ...report.rows.map(
      (row) =>
        `| ${row.productCode} | ${escapeMd(row.buyer)} | ${escapeMd(row.user)} | ${row.adoptionPosture} | ${escapeMd(row.flags.join(", ") || "none")} |`,
    ),
    "",
    "## Market Pain Mapping",
    "",
    "| Product | Market Pain | Trigger Event | Current Alternative | Product Resolution |",
    "| --- | --- | --- | --- | --- |",
    ...report.rows.map(
      (row) =>
        `| ${row.productCode} | ${escapeMd(row.marketPain)} | ${escapeMd(row.triggerEvent)} | ${escapeMd(row.currentAlternative)} | ${escapeMd(row.productResolution)} |`,
    ),
    "",
    "## Adoption Findings",
    "",
    ...report.adoptionFindings.flatMap((finding) => [
      `### ${finding.productCode}`,
      "",
      `- Posture: ${finding.adoptionPosture}`,
      `- Current alternative: ${finding.currentAlternative}`,
      `- Recommended action: ${finding.recommendedAction}`,
      "",
    ]),
    "## Implementation-Ready Recommendations",
    "",
    ...report.implementationReadyRecommendations.map((item) => `- ${item}`),
    "",
  ];
  return `${lines.join("\n")}\n`;
}

function listFiles(roots) {
  const results = [];
  for (const root of roots) {
    const absolute = join(ROOT, root);
    if (!existsSync(absolute)) continue;
    walk(absolute, results);
  }
  return results;
}

function walk(dir, results) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === ".next") continue;
    const absolute = join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(absolute, results);
      continue;
    }
    if (TEXT_EXTENSIONS.has(extname(entry.name))) {
      results.push(relative(ROOT, absolute).replaceAll("\\", "/"));
    }
  }
}

function read(file) {
  const absolute = join(ROOT, file);
  if (!existsSync(absolute)) return "";
  return readFileSync(absolute, "utf8");
}

function hasAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function countBy(rows, key) {
  return rows.reduce((acc, row) => {
    acc[row[key]] = (acc[row[key]] ?? 0) + 1;
    return acc;
  }, {});
}

function escapeMd(value) {
  return String(value).replace(/\|/g, "\\|").replace(/\n/g, " ");
}
