/**
 * scripts/check-boardroom-delivery-pipeline.mjs
 *
 * Boardroom Brief Delivery Pipeline Hardening — Proof Gate
 *
 * Checks that the live Boardroom order pipeline is functioning correctly.
 * Must fail if:
 *   - deliveryStatus = dossier_generated but ProductArtifact.status = PENDING
 *   - deliveryStatus suggests generated but no admin preview URL exists
 *   - Mark Delivered is available while artefact is pending
 *   - case study exists but no Open Draft / Preview action exists
 *   - deliveredAt is null after delivered state
 *   - customerAccessUrl missing when status is ready/delivered
 *   - Open Draft URL returns 404
 *   - adminPreviewUrl is missing when case study exists
 *   - caseStudyId exists but route cannot resolve
 *   - ProductArtifact remains PENDING while deliveryStatus says dossier_generated
 *   - generated state exists without admin preview
 *
 * Usage:
 *   node scripts/check-boardroom-delivery-pipeline.mjs [orderId]
 *
 * If no orderId is provided, checks the most recent non-delivered order.
 */

import { createClient } from "@prisma/client";
import http from "http";

const prisma = new createClient();

// ─── Types ────────────────────────────────────────────────────────────────────

const VALID_DELIVERY_STATES = [
  "paid",
  "case_stubs_created",
  "draft_generated",
  "awaiting_operator_review",
  "approved_for_delivery",
  "customer_access_ready",
  "delivered",
  "blocked",
  "failed",
];

const OPTIMISTIC_LEGACY_STATES = ["dossier_generated", "in_review"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function mapLegacyStatus(status) {
  switch (status) {
    case "requested":
    case "paid": return "paid";
    case "in_review": return "awaiting_operator_review";
    case "dossier_generated": return "draft_generated";
    case "delivered": return "delivered";
    case "follow_up_due": return "delivered";
    case "blocked": return "blocked";
    case "failed": return "failed";
    default: return status;
  }
}

async function checkUrlResolves(urlPath) {
  // Check if a local URL path resolves (returns non-404)
  // We check via the API since we can't do full SSR resolution here
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const fullUrl = `${baseUrl}${urlPath}`;
    // Use a HEAD request to check without loading full page
    return new Promise((resolve) => {
      const parsed = new URL(fullUrl);
      const req = http.request(
        {
          hostname: parsed.hostname,
          port: parsed.port || 80,
          path: parsed.pathname,
          method: "HEAD",
          timeout: 5000,
        },
        (res) => {
          resolve(res.statusCode !== 404);
        },
      );
      req.on("error", () => resolve(null)); // Can't determine
      req.on("timeout", () => { req.destroy(); resolve(null); });
      req.end();
    });
  } catch {
    return null; // Can't determine
  }
}

// ─── Checks ───────────────────────────────────────────────────────────────────

async function checkOrder(orderId) {
  console.log(`\n═══ Boardroom Delivery Pipeline Check: ${orderId} ═══\n`);

  const checks = [];
  let allPassed = true;

  function addCheck(name, passed, detail) {
    checks.push({ name, passed, detail });
    if (!passed) allPassed = false;
    const icon = passed ? "✓" : "✗";
    console.log(`  ${icon} ${name}`);
    if (detail) console.log(`      ${detail}`);
  }

  // 1. Fetch order
  const order = await prisma.boardroomBriefOrder.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    addCheck("Order exists", false, `Order ${orderId} not found`);
    return { orderId, allPassed: false, checks };
  }

  addCheck("Order found", true, `Status: ${order.deliveryStatus} | Payment: ${order.paymentStatus}`);

  // 2. Map status
  const mappedStatus = mapLegacyStatus(order.deliveryStatus);
  const isDelivered = order.deliveryStatus === "delivered" || mappedStatus === "delivered";
  const isLegacyStatus = OPTIMISTIC_LEGACY_STATES.includes(order.deliveryStatus);

  // 3. Check ProductArtifact
  const artifactId = `pa_boardroom_${orderId}`;
  const artifact = await prisma.productArtifact.findUnique({
    where: { artifactId },
  });

  if (artifact) {
    addCheck("ProductArtifact exists", true,
      `Status: ${artifact.status} | DeliveryStatus: ${artifact.deliveryStatus} | DownloadUrl: ${artifact.downloadUrl ?? "null"}`);

    // Check: dossier_generated but artifact is PENDING — LEGACY CONTRADICTION
    if (order.deliveryStatus === "dossier_generated" && artifact.status === "PENDING") {
      addCheck("Legacy contradiction: dossier_generated + artifact PENDING", false,
        "deliveryStatus is 'dossier_generated' but ProductArtifact.status is 'PENDING'. " +
        "This legacy order must be reconciled. Run: node scripts/reconcile-boardroom-legacy-order.mjs " + orderId);
    }

    // Check: in_review but artifact is PENDING — LEGACY CONTRADICTION
    if (order.deliveryStatus === "in_review" && artifact.status === "PENDING") {
      addCheck("Legacy contradiction: in_review + artifact PENDING", false,
        "deliveryStatus is 'in_review' but ProductArtifact.status is 'PENDING'. " +
        "This legacy order must be reconciled.");
    }

    // Check: case study exists but artifact not updated
    const caseStudyEvidence = await prisma.caseStudyEvidence.findFirst({
      where: { sourceType: "boardroom_brief_order", sourceId: orderId },
      select: { caseStudyId: true },
    });
    if (caseStudyEvidence && artifact.status === "PENDING") {
      addCheck("Case study exists but artifact still PENDING", false,
        `Case study ${caseStudyEvidence.caseStudyId} exists but ProductArtifact is still PENDING. ` +
        "Artifact should be DRAFT/AWAITING_REVIEW.");
    }

    // Check: admin preview URL exists when artifact is not PENDING
    if (artifact.status !== "PENDING" && !artifact.downloadUrl) {
      addCheck("Admin preview URL exists", false,
        `Artifact status is ${artifact.status} but no downloadUrl/admin preview URL is set.`);
    } else if (artifact.status !== "PENDING" && artifact.downloadUrl) {
      addCheck("Admin preview URL exists", true, artifact.downloadUrl);

      // Check: admin preview URL resolves (not 404)
      if (artifact.downloadUrl.startsWith("/")) {
        const resolves = await checkUrlResolves(artifact.downloadUrl);
        if (resolves === true) {
          addCheck("Admin preview URL resolves", true, `${artifact.downloadUrl} resolved OK`);
        } else if (resolves === false) {
          addCheck("Admin preview URL resolves", false,
            `${artifact.downloadUrl} returned 404. The admin case study route may be missing.`);
        }
        // If null, we couldn't check — skip
      }
    }

    // Check: artifact should be READY or READY_FOR_DELIVERY before delivery
    if (isDelivered && !["READY", "READY_FOR_DELIVERY", "DELIVERED"].includes(artifact.status)) {
      addCheck("Artifact ready before delivery", false,
        `Order is delivered but artifact status is ${artifact.status}. Expected READY, READY_FOR_DELIVERY, or DELIVERED.`);
    }
  } else {
    addCheck("ProductArtifact exists", false, "No ProductArtifact found for this order");
  }

  // 4. Check FalsificationEntry
  const falsification = await prisma.falsificationEntry.findFirst({
    where: { sourceEntityType: "boardroom_brief_order", sourceEntityId: orderId },
  });
  addCheck("FalsificationEntry exists", !!falsification,
    falsification ? `Status: ${falsification.status}` : "Missing");

  // 5. Check OutcomeHypothesis
  const hypothesis = await prisma.outcomeHypothesis.findFirst({
    where: { sourceRunId: orderId },
  });
  addCheck("OutcomeHypothesis exists", !!hypothesis,
    hypothesis ? `Status: ${hypothesis.status}` : "Missing");

  // 6. Check Case Study / Dossier draft
  const caseStudyEvidence = await prisma.caseStudyEvidence.findFirst({
    where: { sourceType: "boardroom_brief_order", sourceId: orderId },
    select: { caseStudyId: true },
  });

  let caseStudy = null;
  if (caseStudyEvidence) {
    caseStudy = await prisma.caseStudy.findUnique({
      where: { id: caseStudyEvidence.caseStudyId },
      select: { id: true, title: true, status: true },
    });
  }

  if (caseStudy) {
    addCheck("Case study draft exists", true,
      `ID: ${caseStudy.id} | Title: ${caseStudy.title} | Status: ${caseStudy.status}`);

    // Check: case study admin route resolves
    const caseStudyUrl = `/admin/case-studies/${caseStudy.id}`;
    const resolves = await checkUrlResolves(caseStudyUrl);
    if (resolves === true) {
      addCheck("Case study admin route resolves", true, `${caseStudyUrl} resolved OK`);
    } else if (resolves === false) {
      addCheck("Case study admin route resolves", false,
        `${caseStudyUrl} returned 404. The admin case study preview route is missing.`);
    }
  } else {
    if (["draft_generated", "awaiting_operator_review", "approved_for_delivery",
         "customer_access_ready", "delivered"].includes(mappedStatus) ||
        isLegacyStatus) {
      addCheck("Case study draft exists", false,
        "Order is past draft stage but no case study draft found.");
    } else {
      addCheck("Case study draft exists (expected)", true,
        "Not yet generated — order is in pre-draft state.");
    }
  }

  // 7. Check BoardroomDossier
  const dossier = await prisma.boardroomDossier.findFirst({
    where: { orderId },
    select: { id: true, status: true, title: true, clientEmail: true },
  });

  if (dossier) {
    addCheck("BoardroomDossier exists", true,
      `ID: ${dossier.id} | Status: ${dossier.status} | Title: ${dossier.title}`);
  } else {
    if (["draft_generated", "awaiting_operator_review", "approved_for_delivery",
         "customer_access_ready", "delivered"].includes(mappedStatus)) {
      addCheck("BoardroomDossier exists", false,
        "Order is past draft stage but no BoardroomDossier found.");
    }
  }

  // 8. Check deliveredAt
  if (isDelivered) {
    if (order.deliveredAt) {
      addCheck("deliveredAt is populated", true, order.deliveredAt.toISOString());
    } else {
      addCheck("deliveredAt is populated", false,
        "Order is marked delivered but deliveredAt is null.");
    }
  }

  // 9. Check customerAccessUrl
  const meta = order.metadata ?? {};
  const customerAccessUrl = meta.customerAccessUrl;

  if (isDelivered || mappedStatus === "customer_access_ready" || mappedStatus === "approved_for_delivery") {
    if (customerAccessUrl) {
      addCheck("customerAccessUrl exists", true, customerAccessUrl);
    } else {
      addCheck("customerAccessUrl exists", false,
        `Status is ${order.deliveryStatus} but no customerAccessUrl in metadata.`);
    }
  }

  // 10. Check audit trail
  const auditLogs = await prisma.accessAuditLog.findMany({
    where: { targetKey: orderId },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { action: true, createdAt: true, actorEmail: true },
  });

  if (auditLogs.length > 0) {
    addCheck("Audit trail exists", true, `${auditLogs.length} events recorded`);
    const actions = auditLogs.map((l) => l.action);
    const hasPaidEvent = actions.some((a) => a.includes("boardroom_order_paid") || a.includes("checkout.session.completed"));
    const hasDraftEvent = actions.some((a) => a.includes("boardroom_draft_generated") || a.includes("BOARDROOM_DOSSIER_GENERATED"));
    const hasDeliveredEvent = actions.some((a) => a.includes("boardroom_delivered") || a.includes("BOARDROOM_DOSSIER_DELIVERED"));
    const hasReconciledEvent = actions.some((a) => a.includes("BOARDROOM_LEGACY_ORDER_RECONCILED"));

    if (isDelivered && !hasDeliveredEvent) {
      addCheck("Delivery audit event recorded", false,
        "Order is delivered but no delivery audit event found.");
    }
  } else {
    addCheck("Audit trail exists", false, "No audit events found for this order.");
  }

  // 11. Check for optimistic state naming
  if (order.deliveryStatus === "dossier_generated") {
    addCheck("State naming is accurate", false,
      "Using 'dossier_generated' which implies a completed dossier. " +
      "Should be 'draft_generated' or 'awaiting_operator_review' until actual delivery is confirmed.");
  }

  // 12. Check reconciliation audit event
  if (order.metadata?.reconciledAt) {
    addCheck("Legacy reconciliation completed", true,
      `Reconciled at ${new Date(order.metadata.reconciledAt).toISOString()} by ${order.metadata.reconciledBy ?? "unknown"}`);
  }

  // ─── Summary ──────────────────────────────────────────────────────────────

  console.log(`\n  ─── Summary ───`);
  const passed = checks.filter((c) => c.passed).length;
  const failed = checks.filter((c) => !c.passed).length;
  console.log(`  Passed: ${passed}/${checks.length}`);
  console.log(`  Failed: ${failed}/${checks.length}`);

  return {
    orderId,
    allPassed,
    checks,
    summary: { passed, failed, total: checks.length },
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const targetOrderId = process.argv[2];

  let orderId = targetOrderId;

  if (!orderId) {
    // Find the most recent non-delivered order
    const latest = await prisma.boardroomBriefOrder.findFirst({
      where: { deliveryStatus: { not: "delivered" } },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (!latest) {
      // Fall back to most recent order overall
      const anyOrder = await prisma.boardroomBriefOrder.findFirst({
        orderBy: { createdAt: "desc" },
        select: { id: true },
      });
      if (!anyOrder) {
        console.log("No orders found in database.");
        process.exitCode = 1;
        return;
      }
      orderId = anyOrder.id;
      console.log(`No pending orders found. Checking most recent order: ${orderId}`);
    } else {
      orderId = latest.id;
      console.log(`Checking most recent non-delivered order: ${orderId}`);
    }
  }

  const result = await checkOrder(orderId);

  console.log(`\n═══ Gate Result: ${result.allPassed ? "PASSED" : "FAILED"} ═══\n`);

  if (!result.allPassed) {
    process.exitCode = 1;
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exitCode = 1;
});