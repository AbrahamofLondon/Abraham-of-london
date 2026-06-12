#!/usr/bin/env node
/**
 * scripts/reconcile-boardroom-legacy-order.mjs
 *
 * CLI tool to reconcile legacy Boardroom orders into the governed delivery pipeline.
 *
 * Usage:
 *   node scripts/reconcile-boardroom-legacy-order.mjs <orderId> [actorEmail]
 *
 * If no actorEmail is provided, defaults to "system@reconciliation.script".
 *
 * Example:
 *   node scripts/reconcile-boardroom-legacy-order.mjs cmqa10fcl0000l8093s0jucwr admin@example.com
 */

import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

// ─── Detection (raw queries to avoid schema mismatch) ─────────────────────────

async function detectContradictions(orderId) {
  const contradictions = [];

  const order = await prisma.boardroomBriefOrder.findUnique({ where: { id: orderId } });
  if (!order) return { contradictions: ["ORDER_NOT_FOUND"], order: null, artifact: null, caseStudy: null, caseStudyId: null };

  const artRows = await prisma.$queryRawUnsafe(
    `SELECT id, "artifactId", status, "deliveryStatus", "downloadUrl", "deliveredAt" FROM product_artifacts WHERE "artifactId" = $1`,
    `pa_boardroom_${orderId}`
  );
  const artifact = artRows.length > 0 ? artRows[0] : null;

  const evRows = await prisma.$queryRawUnsafe(
    `SELECT "caseStudyId" FROM case_study_evidence WHERE "sourceType" = $1 AND "sourceId" = $2 LIMIT 1`,
    "boardroom_brief_order", orderId
  );

  let caseStudy = null;
  let caseStudyId = null;
  if (evRows.length > 0) {
    caseStudyId = evRows[0].caseStudyId;
    const csRows = await prisma.$queryRawUnsafe(
      `SELECT id, title, status FROM case_studies WHERE id = $1 LIMIT 1`,
      caseStudyId
    );
    caseStudy = csRows.length > 0 ? csRows[0] : null;
  }

  if (order.deliveryStatus === "dossier_generated" && artifact?.status === "PENDING") {
    contradictions.push("dossier_generated_artifact_pending");
  }
  if (order.deliveryStatus === "dossier_generated" && !caseStudy) {
    contradictions.push("dossier_generated_no_case_study");
  }
  if (order.deliveryStatus === "in_review" && artifact?.status === "PENDING") {
    contradictions.push("in_review_artifact_pending");
  }
  if ((order.deliveryStatus === "draft_generated" || order.deliveryStatus === "dossier_generated") && artifact && !artifact.downloadUrl) {
    contradictions.push("draft_generated_no_admin_preview");
  }
  if (caseStudy && artifact?.status === "PENDING") {
    contradictions.push("case_study_exists_no_artifact_update");
  }

  if (contradictions.length === 0) contradictions.push("none");

  return { contradictions, order, artifact, caseStudy, caseStudyId };
}

// ─── Reconciliation ───────────────────────────────────────────────────────────

async function reconcile(orderId, actorEmail) {
  console.log(`\n═══ Reconcile Legacy Boardroom Order: ${orderId} ═══\n`);

  const { contradictions, order, artifact, caseStudy, caseStudyId } = await detectContradictions(orderId);

  if (!order) {
    console.log("✗ Order not found.");
    return { reconciled: false, errors: ["Order not found"] };
  }

  console.log(`  Current deliveryStatus: ${order.deliveryStatus}`);
  console.log(`  Artifact status: ${artifact?.status ?? "N/A"} / ${artifact?.deliveryStatus ?? "N/A"}`);
  console.log(`  Case study: ${caseStudy ? `${caseStudy.id} (${caseStudy.status})` : "None"}`);
  console.log(`  Contradictions: ${contradictions.join(", ")}`);

  if (contradictions.length === 1 && contradictions[0] === "none") {
    console.log("\n  ✓ No contradictions detected. Order is already in a governed state.\n");
    return { reconciled: false, errors: [] };
  }

  const errors = [];
  const actions = [];

  // Determine new delivery status
  let newDeliveryStatus = order.deliveryStatus;
  if (order.deliveryStatus === "dossier_generated") {
    newDeliveryStatus = caseStudy
      ? (caseStudy.status === "DRAFT" ? "draft_generated" : "awaiting_operator_review")
      : "paid";
    actions.push(`Map status: ${order.deliveryStatus} → ${newDeliveryStatus}`);
  } else if (order.deliveryStatus === "in_review") {
    newDeliveryStatus = "awaiting_operator_review";
    actions.push(`Map status: ${order.deliveryStatus} → ${newDeliveryStatus}`);
  }

  // Build admin preview URL
  let adminPreviewUrl = artifact?.downloadUrl ?? null;
  if (!adminPreviewUrl && caseStudyId) {
    adminPreviewUrl = `/admin/case-studies/${caseStudyId}`;
    actions.push(`Set adminPreviewUrl: ${adminPreviewUrl}`);
  }

  // Update ProductArtifact via raw query
  if (artifact) {
    const updateFields = [];
    const updateValues = [];

    if (artifact.status === "PENDING" && caseStudy) {
      updateFields.push(`status = $${updateValues.length + 1}`);
      updateValues.push("DRAFT");
      actions.push("Set artifact status: PENDING → DRAFT");
    }
    if (artifact.deliveryStatus === "PENDING" && caseStudy) {
      updateFields.push(`"deliveryStatus" = $${updateValues.length + 1}`);
      updateValues.push("AWAITING_REVIEW");
      actions.push("Set artifact deliveryStatus: PENDING → AWAITING_REVIEW");
    }
    if (adminPreviewUrl && adminPreviewUrl !== artifact.downloadUrl) {
      updateFields.push(`"downloadUrl" = $${updateValues.length + 1}`);
      updateValues.push(adminPreviewUrl);
      actions.push(`Set artifact downloadUrl: ${adminPreviewUrl}`);
    }

    if (updateFields.length > 0) {
      const sql = `UPDATE product_artifacts SET ${updateFields.join(", ")} WHERE "artifactId" = $${updateValues.length + 1}`;
      updateValues.push(`pa_boardroom_${orderId}`);
      await prisma.$queryRawUnsafe(sql, ...updateValues);
      console.log(`  ✓ ProductArtifact updated`);
    }
  }

  // Update order
  await prisma.boardroomBriefOrder.update({
    where: { id: orderId },
    data: {
      deliveryStatus: newDeliveryStatus,
      metadata: {
        ...((order.metadata ?? {})),
        reconciledAt: new Date().toISOString(),
        reconciledBy: actorEmail,
        previousDeliveryStatus: order.deliveryStatus,
        reconciliationNote: "Legacy order reconciled into governed delivery pipeline",
      },
    },
  });
  console.log(`  ✓ Order status updated to: ${newDeliveryStatus}`);

  // Write audit event via raw query (AccessAuditLog has actorType required)
  try {
    await prisma.$queryRawUnsafe(
      `INSERT INTO "AccessAuditLog" (action, "actorEmail", "targetKey", "targetType", metadata, "createdAt", "actorType") VALUES ($1, $2, $3, $4, $5, NOW(), $6)`,
      "BOARDROOM_LEGACY_ORDER_RECONCILED",
      actorEmail,
      orderId,
      "BoardroomBriefOrder",
      JSON.stringify({
        previousStatus: order.deliveryStatus,
        newStatus: newDeliveryStatus,
        contradictions: contradictions.filter(c => c !== "none"),
        actions,
        caseStudyId,
      }),
      "admin"
    );
    console.log("  ✓ Audit event written: BOARDROOM_LEGACY_ORDER_RECONCILED");
  } catch (err) {
    errors.push(`Audit write failed: ${err.message}`);
    console.log(`  ✗ Audit write failed: ${err.message}`);
  }

  // Summary
  console.log("\n  ─── Result ───");
  console.log(`  Reconciled: ${errors.length === 0 ? "Yes" : "Partial"}`);
  console.log(`  New deliveryStatus: ${newDeliveryStatus}`);
  console.log(`  Artifact: ${caseStudy ? "DRAFT / AWAITING_REVIEW" : "Unchanged"}`);
  console.log(`  Admin preview: ${adminPreviewUrl ?? "Not set"}`);
  console.log(`  Customer access: Not generated (blocked until approval)`);
  console.log(`  Mark Delivered: Blocked until all evidence exists`);
  console.log(`  Errors: ${errors.length > 0 ? errors.join("; ") : "None"}`);
  console.log("");

  return { reconciled: errors.length === 0, errors };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const orderId = process.argv[2];
  const actorEmail = process.argv[3] || "system@reconciliation.script";

  if (!orderId) {
    console.log("Usage: node scripts/reconcile-boardroom-legacy-order.mjs <orderId> [actorEmail]");
    console.log("");
    console.log("Examples:");
    console.log("  node scripts/reconcile-boardroom-legacy-order.mjs cmqa10fcl0000l8093s0jucwr");
    console.log("  node scripts/reconcile-boardroom-legacy-order.mjs cmqa10fcl0000l8093s0jucwr admin@example.com");
    process.exitCode = 1;
    return;
  }

  const result = await reconcile(orderId, actorEmail);
  if (!result.reconciled && result.errors.length > 0) {
    process.exitCode = 1;
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});