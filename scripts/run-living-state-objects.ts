/**
 * scripts/run-living-state-objects.ts
 *
 * Living State Object runner (TS entrypoint, executed via tsx by the governance
 * checker). This is the SINGLE place where the real engine produces the new
 * living-state reports — no logic is duplicated in JS. It is additive: it writes
 * only the new reports and never touches the existing estate-structure outputs.
 *
 * Emits:
 *   reports/living-state-objects.json
 *   reports/living-state-view-model.json
 *   reports/living-state-summary.md
 *   reports/living-state-memory.json   (durable per-object memory)
 *
 * Source of truth for the Boardroom proof case is the real delivery state
 * machine + value-readiness gate; the engine applies the cross-cutting rules.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { boardroomAdapter } from "@/lib/living-intelligence/adapters/boardroom-adapter";
import { assessmentAdapter } from "@/lib/living-intelligence/adapters/assessment-adapter";
import { evaluateLivingStateObject } from "@/lib/living-intelligence/living-state-engine";
import {
  applyMemoryToBatch,
  coerceMemoryStore,
  emptyMemoryStore,
} from "@/lib/living-intelligence/living-state-memory";
import { buildLivingStateViewModel } from "@/lib/living-intelligence/living-state-view-model";
import {
  composeLivingStateObjectsPayload,
  composeLivingStateSummaryMarkdown,
} from "@/lib/living-intelligence/living-state-report-composer";
import type { LivingStateObject } from "@/lib/living-intelligence/living-state-object-contract";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");
const REPORTS_DIR = path.join(ROOT, "reports");

function writeJson(rel: string, data: unknown): void {
  const abs = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, JSON.stringify(data, null, 2), "utf8");
}

function writeText(rel: string, content: string): void {
  const abs = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, "utf8");
}

function readJson(rel: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8"));
  } catch {
    return null;
  }
}

// ─── Real route discovery (Pages + App router) ───────────────────────────────

function discoverRoutes(): string[] {
  const routes = new Set<string>();

  const walk = (dir: string, toRoute: (file: string) => string | null): void => {
    let entries: fs.Dirent[] = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
        walk(full, toRoute);
      } else {
        const route = toRoute(full);
        if (route) routes.add(route);
      }
    }
  };

  // Pages router: pages/**/*.tsx → route
  const pagesDir = path.join(ROOT, "pages");
  walk(pagesDir, (file) => {
    if (!/\.(tsx|ts|jsx|js)$/.test(file)) return null;
    const rel = path.relative(pagesDir, file).replace(/\\/g, "/");
    if (rel.startsWith("api/")) return null;
    if (/(^|\/)_(app|document|error)\./.test(rel)) return null;
    let route = "/" + rel.replace(/\.(tsx|ts|jsx|js)$/, "");
    route = route.replace(/\/index$/, "");
    return route === "" ? "/" : route;
  });

  // App router: app/**/page.tsx → route (dir path)
  const appDir = path.join(ROOT, "app");
  walk(appDir, (file) => {
    const rel = path.relative(appDir, file).replace(/\\/g, "/");
    if (!/(^|\/)page\.(tsx|ts|jsx|js)$/.test(rel)) return null;
    let route = "/" + rel.replace(/\/page\.(tsx|ts|jsx|js)$/, "").replace(/^page\.(tsx|ts|jsx|js)$/, "");
    // strip route groups (group)
    route = route.replace(/\/\([^)]+\)/g, "");
    return route === "" ? "/" : route;
  });

  return [...routes];
}

// ─── Boardroom proof case (governance self-test, not customer data) ──────────
//
// A realistic Boardroom DRAFT case that must be diagnosed as NOT approvable. It
// makes no positive authority/evidence claim — the opposite: it is mid-pipeline
// with unverified evidence, missing sections, a draft-only artifact, and missing
// publication consent. The engine must therefore block approval/publication.

function boardroomProofRecords(): Record<string, unknown>[] {
  return [
    {
      orderId: "boardroom-proof-draft-case",
      productCode: "BOARDROOM_BRIEF",
      deliveryStatus: "draft_generated",
      artifactStatus: "DRAFT",
      adminPreviewUrl: "",
      customerAccessUrl: "",
      approvalAllowed: false,
      valueScoreOutOf10: 7.2,
      blockingReasons: [
        "Boardroom intake is incomplete.",
        "Missing boardroom section: falsificationChallenge",
        "Missing boardroom section: recommendedNextMove",
      ],
      evidencePosture: "unverified",
      supportingEvidence: [],
      missingEvidence: [
        "Operator verification of the draft brief.",
        "Completed intake for the missing sections.",
      ],
      publicationIntended: true,
      consentStatus: "missing",
    },
  ];
}

// Assessment proof result (governance self-test, not real user data). A session
// preview with a user-reported posture: continuity is promised by doctrine but no
// durable memory exists yet, so the engine must surface assessment_without_memory
// to the operator while keeping the result safe to show the user.
function assessmentProofRecords(): Record<string, unknown>[] {
  return [
    {
      id: "assessment-proof-fast-diagnostic",
      kind: "FAST_DIAGNOSTIC",
      title: "Decision under pressure — proof case",
      band: "WATCH",
      primaryFinding:
        "A consequential decision is being delayed past the point where delay itself becomes the dominant risk.",
      failurePattern: "Avoidance loop: re-gathering information instead of committing to a governed move.",
      evidencePosture: "USER_REPORTED",
      governanceImplication:
        "Without a governed next move, exposure compounds while no party owns the decision.",
      recommendedNextMove: "Commit to the single next governed move and record it.",
      earnedRoute: {
        route: "DECISION_CENTRE",
        label: "Open in Decision Centre",
        href: "/decision-centre",
        reason: "Carry this result forward into a governed case.",
      },
      recordStatus: { level: "SESSION_PREVIEW", label: "Session preview" },
    },
  ];
}

function main(): void {
  const now = new Date().toISOString();
  const availableRoutes = discoverRoutes();

  // Map → evaluate. Each domain has its own adapter; all emit LivingStateObjects.
  const mapped: LivingStateObject[] = [
    ...boardroomAdapter.map({
      domain: "boardroom",
      records: boardroomProofRecords(),
      availableRoutes,
    }),
    ...assessmentAdapter.map({
      domain: "assessment",
      records: assessmentProofRecords(),
      availableRoutes,
    }),
  ];

  const evaluated = mapped.map((object) =>
    evaluateLivingStateObject(object, { availableRoutes }),
  );

  // Durable memory (additive store, separate from living-product-memory.json).
  const priorStore = coerceMemoryStore(readJson("reports/living-state-memory.json") ?? emptyMemoryStore());
  const { objects, store } = applyMemoryToBatch(evaluated, priorStore, now);

  const viewModel = buildLivingStateViewModel(objects, now);

  writeJson("reports/living-state-objects.json", composeLivingStateObjectsPayload(objects, now));
  writeJson("reports/living-state-view-model.json", viewModel);
  writeText("reports/living-state-summary.md", composeLivingStateSummaryMarkdown(viewModel));
  writeJson("reports/living-state-memory.json", store);

  // Console summary for the parent runner.
  const boardroom = objects.find((o) => o.domain === "boardroom");
  const blockerCodes = boardroom ? boardroom.blockers.map((b) => b.code) : [];
  const hardBlocked = boardroom
    ? boardroom.blockers.some((b) => b.severity === "blocker")
    : false;

  console.log(`living-state: ${objects.length} object(s), ${viewModel.estate.blocked} blocked`);
  console.log(`living-state: routes discovered = ${availableRoutes.length}`);
  if (boardroom) {
    console.log(
      `living-state: boardroom proof case "${boardroom.id}" stage=${boardroom.currentStage} approvable=${!hardBlocked} blockers=[${blockerCodes.join(", ")}]`,
    );
  }
  const assessment = objects.find((o) => o.domain === "assessment");
  if (assessment) {
    console.log(
      `living-state: assessment proof "${assessment.id}" stage=${assessment.currentStage} safeToShowUser=${assessment.safeToShowUser} evidence=${assessment.evidence.status} blockers=[${assessment.blockers.map((b) => b.code).join(", ")}]`,
    );
  }
  if (!fs.existsSync(path.join(REPORTS_DIR, "living-state-objects.json"))) {
    console.error("living-state: FAILED to write living-state-objects.json");
    process.exit(1);
  }
}

main();
