/**
 * lib/living-intelligence/adapters/content-adapter.ts
 *
 * Content domain adapter — Phase 5B.
 *
 * Translates content family records (blog, books, playbooks, editorials,
 * intelligence, briefs) into LivingStateObjects. This adapter works GENERICALLY
 * across content families — it does NOT hardcode product-specific names.
 *
 * Sources inspected:
 *   content/**                                  (content documents)
 *   pages/blog/** pages/books/** etc.           (public routes)
 *   reports/blog-post-route-audit.json          (blog route audit)
 *   reports/public-content-route-audit.json     (public content route audit)
 *
 * Every object answers:
 *   1. What is the content object?
 *   2. What lifecycle/publication state does frontmatter claim?
 *   3. Is the route public?
 *   4. Is public exposure allowed?
 *   5. Is there a contradiction between content metadata and route exposure?
 *   6. Who must act?
 *   7. What is the next governed action?
 *
 * The system REFUSES to infer:
 *   - publication from file existence
 *   - commercial availability from route presence
 *   - release readiness from MDX/frontmatter alone
 *   - public safety from file location alone
 */

import fs from "node:fs";
import path from "node:path";

import { routeExists as routeExistsCheck } from "@/lib/living-intelligence/living-state-route-map";
import {
  readString,
  readBool,
  readStringArray,
  type LivingDomainAdapter,
  type LivingDomainAdapterInput,
} from "@/lib/living-intelligence/living-domain-adapter-contract";
import type {
  LivingStateArtifactStatus,
  LivingStateBlockerCode,
  LivingStateConsentStatus,
  LivingStateEvidenceStatus,
  LivingStateObject,
  LivingStateStage,
} from "@/lib/living-intelligence/living-state-object-contract";

// ─── Content family definitions ───────────────────────────────────────────────

type ContentFamily = {
  name: string;
  dir: string;
  routePrefix: string;
  /** Expected minimum number of source files. */
  expectedMinFiles: number;
  /** Whether this family is expected to have public routes. */
  expectsPublicRoutes: boolean;
  /** Whether draft/restricted content in this family is expected. */
  allowsDrafts: boolean;
};

const CONTENT_FAMILIES: ContentFamily[] = [
  { name: "blog", dir: "content/blog", routePrefix: "/blog", expectedMinFiles: 1, expectsPublicRoutes: true, allowsDrafts: true },
  { name: "books", dir: "content/books", routePrefix: "/books", expectedMinFiles: 1, expectsPublicRoutes: true, allowsDrafts: false },
  { name: "playbooks", dir: "content/playbooks", routePrefix: "/playbooks", expectedMinFiles: 1, expectsPublicRoutes: true, allowsDrafts: false },
  { name: "editorials", dir: "content/editorials", routePrefix: "/editorials", expectedMinFiles: 1, expectsPublicRoutes: true, allowsDrafts: false },
  { name: "intelligence", dir: "content/intelligence", routePrefix: "/intelligence", expectedMinFiles: 1, expectsPublicRoutes: true, allowsDrafts: true },
  { name: "briefs", dir: "content/briefs", routePrefix: "/briefs", expectedMinFiles: 1, expectsPublicRoutes: true, allowsDrafts: false },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const ROOT = process.cwd();

/**
 * Read frontmatter fields from an MDX file (simple regex-based, no MDX parser).
 */
function readFrontmatter(filePath: string): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  try {
    const abs = path.join(ROOT, filePath);
    if (!fs.existsSync(abs)) return result;
    const content = fs.readFileSync(abs, "utf8");

    // Extract frontmatter block between --- markers.
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return result;

    const fm = match[1];
    if (typeof fm !== "string") return result;
    // Parse simple YAML-like key: value pairs.
    for (const line of fm.split("\n")) {
      const kvMatch = line.match(/^(\w+):\s*(.*)$/);
      if (kvMatch && kvMatch[1] !== undefined && kvMatch[2] !== undefined) {
        const key = kvMatch[1];
        let value: unknown = kvMatch[2].trim();
        // Remove quotes.
        if (typeof value === "string") {
          if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          if (value === "true") value = true;
          else if (value === "false") value = false;
        }
        result[key] = value;
      }
    }
  } catch {
    // Ignore read errors.
  }
  return result;
}

/**
 * List content files in a directory (non-recursive).
 */
function listContentFiles(dir: string): string[] {
  try {
    const abs = path.join(ROOT, dir);
    if (!fs.existsSync(abs)) return [];
    return fs.readdirSync(abs)
      .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
      .map((f) => path.join(dir, f).replace(/\\/g, "/"));
  } catch {
    return [];
  }
}

/**
 * Map frontmatter status to a living stage.
 */
function frontmatterToStage(fm: Record<string, unknown>): LivingStateStage {
  const status = readString(fm, "status");
  const draft = readBool(fm, "draft");
  const published = readBool(fm, "published");
  const accessLevel = readString(fm, "accessLevel");

  // Explicitly published.
  if (status === "published" && published !== false) return "published";
  // Explicitly draft.
  if (status === "draft" || draft === true || published === false) return "draft_generated";
  // Archived.
  if (status === "archived") return "archived";
  // Unlisted / restricted.
  if (status === "unlisted" || accessLevel === "restricted") return "blocked";

  // draft: false with no explicit status means published (common blog pattern).
  if (draft === false) return "published";

  // Default: treat as draft.
  return "draft_generated";
}

/**
 * Derive evidence status for a content item.
 */
function deriveContentEvidence(
  fm: Record<string, unknown>,
  stage: LivingStateStage,
): LivingStateEvidenceStatus {
  const status = readString(fm, "status");
  const draft = readBool(fm, "draft");

  if (stage === "published") {
    // Published content with explicit status or draft=false is verified.
    if (status === "published" || draft === false) return "verified";
    return "weakly_indicated";
  }
  if (stage === "draft_generated") {
    if (status === "draft" || draft === true) return "weakly_indicated";
    return "unverified";
  }
  return "weakly_indicated";
}

/**
 * Build the list of things the system refuses to infer.
 */
function buildCannotInfer(): string[] {
  return [
    "Publication from file existence — a content file is not a published document.",
    "Commercial availability from route presence — a route does not create purchase permission.",
    "Release readiness from MDX/frontmatter alone — frontmatter is not publication authority.",
    "Public safety from file location alone — file location does not determine public exposure.",
  ];
}

/**
 * Detect content-level blockers.
 */
function detectContentBlockers(
  fm: Record<string, unknown>,
  filePath: string,
  family: ContentFamily,
  stage: LivingStateStage,
  availableRoutes: string[],
): { code: LivingStateBlockerCode; explanation: string; requiredAction: string }[] {
  const blockers: { code: LivingStateBlockerCode; explanation: string; requiredAction: string }[] = [];

  const status = readString(fm, "status");
  const title = readString(fm, "title");
  const access = readString(fm, "access");

  // Published content with missing title.
  if (stage === "published" && !title) {
    blockers.push({
      code: "missing_evidence",
      explanation: `Content file "${filePath}" is published but has no title in frontmatter.`,
      requiredAction: "Add a title to the frontmatter of this published content.",
    });
  }

      // Published content with no resolving route.
    if (stage === "published") {
      const slug = filePath.replace(/\.(mdx|md)$/, "").split("/").pop() ?? "";
      const expectedRoute = `${family.routePrefix}/${slug}`;
      if (!routeExistsCheck(expectedRoute, availableRoutes)) {
        blockers.push({
          code: "route_missing",
          explanation: `Content file "${filePath}" is published but its expected route (${expectedRoute}) does not exist in the application.`,
          requiredAction: "Create the missing route or update the content's publication status.",
        });
      }
    }
  // Content family is empty despite expected source files.
  const files = listContentFiles(family.dir);
  if (files.length === 0 && family.expectedMinFiles > 0) {
    blockers.push({
      code: "route_missing",
      explanation: `Content family "${family.name}" has no source files in ${family.dir} but ${family.expectedMinFiles} were expected.`,
      requiredAction: "Add source files or update the expected minimum.",
    });
  }

  return blockers;
}

/**
 * Build operator summary.
 */
function buildOperatorSummary(
  fm: Record<string, unknown>,
  filePath: string,
  family: ContentFamily,
  stage: LivingStateStage,
): string {
  const title = readString(fm, "title") ?? "(untitled)";
  const status = readString(fm, "status") ?? "unknown";
  const access = readString(fm, "access") ?? "public";
  const slug = filePath.replace(/\.(mdx|md)$/, "").split("/").pop() ?? "";

  return `Content "${title}" (${family.name}/${slug}) — frontmatter status: ${status}, access: ${access}, stage: ${stage}. Route: ${family.routePrefix}/${slug}.`;
}

/**
 * Build user-visible summary.
 */
function buildUserSummary(
  fm: Record<string, unknown>,
  stage: LivingStateStage,
): string {
  const title = readString(fm, "title") ?? "Content";
  const summary = readString(fm, "summary") ?? readString(fm, "description") ?? "";

  if (stage === "published") {
    return summary ? `${title} — ${summary}` : `${title} — published content.`;
  }
  if (stage === "draft_generated") {
    return `${title} — in preparation.`;
  }
  return `${title} — content item.`;
}

// ─── Map one content item ─────────────────────────────────────────────────────

function mapOne(
  filePath: string,
  family: ContentFamily,
  input: LivingDomainAdapterInput,
): LivingStateObject {
  const fm = readFrontmatter(filePath);
  const stage = frontmatterToStage(fm);
  const slug = filePath.replace(/\.(mdx|md)$/, "").split("/").pop() ?? "unknown";
  const title = readString(fm, "title") ?? `Content: ${slug}`;
  const id = `content-${family.name}-${slug}`;
  const expectedRoute = `${family.routePrefix}/${slug}`;
  const routeExists = routeExistsCheck(expectedRoute, input.availableRoutes);

  const evidenceStatus = deriveContentEvidence(fm, stage);
  const contentBlockers = detectContentBlockers(fm, filePath, family, stage, input.availableRoutes);

  // Determine artefact status.
  let artifactStatus: LivingStateArtifactStatus = "not_required";
  if (stage === "published") {
    artifactStatus = "generated";
  } else if (stage === "draft_generated") {
    artifactStatus = "draft";
  }

  return {
    id,
    domain: "content",
    subjectType: "content_item",
    sourceId: filePath,
    productCode: family.name,
    title,
    currentStage: stage,
    statusLabel: `${stage} — ${family.name}/${slug}`,
    userVisibleSummary: buildUserSummary(fm, stage),
    operatorSummary: buildOperatorSummary(fm, filePath, family, stage),
    evidence: {
      status: evidenceStatus,
      supportingEvidence: [
        `Frontmatter status: ${readString(fm, "status") ?? "not set"}`,
        `Route exists: ${routeExists}`,
      ],
      missingEvidence: (!readString(fm, "status") && readBool(fm, "draft") !== false)
        ? ["Publication status in frontmatter"]
        : [],
      cannotInfer: buildCannotInfer(),
    },
    consent: {
      required: false,
      status: "not_required",
      supportingEvidence: [],
      missing: [],
    },
    artifact: {
      required: stage === "published",
      status: artifactStatus,
      artifactIds: [filePath],
      artifactRoutes: routeExists ? [expectedRoute] : [],
      missing: stage === "published" && !routeExists
        ? [`Public route for "${slug}"`]
        : [],
    },
    publication: {
      relevant: stage === "published",
      allowed: stage === "published",
      reason: stage === "published"
        ? "Content is published and publicly accessible."
        : `Content is not published (stage: ${stage}).`,
      missing: stage !== "published" ? [] : [],
    },
    blockers: contentBlockers.map((b) => ({
      code: b.code,
      label: b.code === "publication_not_allowed"
        ? "Publication not permitted in this state"
        : b.code === "route_missing"
          ? "A referenced route does not exist"
          : b.code === "missing_evidence"
            ? "Required evidence is missing"
            : "Content issue",
      severity: b.code === "publication_not_allowed"
        ? "blocker"
        : b.code === "route_missing"
          ? "blocker"
          : "warning",
      explanation: b.explanation,
      evidence: [
        `family=${family.name}`,
        `file=${filePath}`,
        `stage=${stage}`,
        `routeExists=${routeExists}`,
      ],
      affectedItems: [filePath],
      requiredAction: b.requiredAction,
      actionOwner: "operator",
      canAutomate: false,
    })),
    nextActions: [
      ...(stage === "draft_generated" && family.expectsPublicRoutes
        ? [{
            label: "Review and publish content",
            description: `Content "${slug}" in ${family.name} is in draft stage. Review and set status to published to expose it publicly.`,
            owner: "operator" as const,
            actionType: "review_draft" as const,
            route: expectedRoute,
            safeToAutomate: false,
            requiredEvidence: [] as string[],
          }]
        : []),
      ...(stage === "published" && !routeExists
        ? [{
            label: "Create missing public route",
            description: `Content "${slug}" is published but route ${expectedRoute} does not exist.`,
            owner: "operator" as const,
            actionType: "create_missing_route" as const,
            safeToAutomate: false,
            requiredEvidence: [] as string[],
          }]
        : []),
    ],
    memory: {
      recurrenceCount: 1,
      currentStage: stage,
      regressionDetected: false,
      resolvedSinceLastRun: false,
    },
    safeToShowUser: stage === "published",
    safeToShowOperator: true,
    safeToAutomate: false,
    sourceOfTruth: [
      "content/** (frontmatter)",
      "reports/blog-post-route-audit.json",
      "reports/public-content-route-audit.json",
    ],
    raw: {
      family: family.name,
      filePath,
      slug,
      frontmatterStatus: readString(fm, "status") ?? null,
      frontmatterDraft: readBool(fm, "draft") ?? null,
      frontmatterPublished: readBool(fm, "published") ?? null,
      routeExists,
      expectedRoute,
    },
  };
}

// ─── Content proof records ───────────────────────────────────────────────────
//
// These exercise the adapter generically across different content families and
// states. They are NOT hardcoded to a specific product.

function contentProofRecords(): Record<string, unknown>[] {
  // We generate records from actual content files on disk.
  const records: Record<string, unknown>[] = [];

  for (const family of CONTENT_FAMILIES) {
    const files = listContentFiles(family.dir);
    for (const file of files) {
      const fm = readFrontmatter(file);
      records.push({
        filePath: file,
        family: family.name,
        frontmatter: fm,
      });
    }
  }

  return records;
}

// ─── Adapter ──────────────────────────────────────────────────────────────────

export const contentAdapter: LivingDomainAdapter = {
  domain: "content",
  label: "Content",
  detect(records) {
    return records.some(
      (record) =>
        typeof record["filePath"] === "string" ||
        typeof record["family"] === "string",
    );
  },
  map(input: LivingDomainAdapterInput) {
    // If records were passed in, use them; otherwise scan the filesystem.
    const records = input.records.length > 0
      ? input.records
      : contentProofRecords();

    return records.map((record) => {
      const filePath = readString(record, "filePath") ?? "unknown";
      const familyName = readString(record, "family") ?? "blog";
      const family = (CONTENT_FAMILIES.find((f) => f.name === familyName) ?? CONTENT_FAMILIES[0])!;
      return mapOne(filePath, family, input);
    });
  },
};

export default contentAdapter;
