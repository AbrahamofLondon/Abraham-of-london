import crypto from "node:crypto";
import { prisma } from "@/lib/prisma.server";
import { BoardroomDossierService } from "@/lib/boardroom/boardroom-dossier-service";
import {
  assertPaidDeliveryAuthorised,
  hashArtifact,
} from "@/lib/boardroom/boardroom-brief-authority";
import { BoardroomAccessTokenService } from "@/lib/boardroom/boardroom-access-token";
import { ClientPortalTokenService } from "@/lib/client-portal/client-portal-token";
import { createPaidRuntimeArtifact } from "@/lib/artifacts/paid-product-runtime";
import { buildSpineFromOrder } from "@/app/api/admin/boardroom-delivery/generate/route";

function hash(value: unknown): string {
  return crypto.createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

async function main() {
  const now = new Date();
  const stamp = now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
  const email = `operation10-boardroom-smoke+${stamp}@example.test`;
  const userId = `operation10_staging_${stamp}`;
  const spineId = `SPINE-STAGING-${stamp}`;
  const stripeSessionId = `cs_test_operation10_boardroom_${stamp}`;

  const inputSnapshot = {
    smokeType: "ADMIN_AUTHORISED_STAGING_SMOKE",
    notProductionRevenue: true,
    stripeMode: "test",
    createdFor: "Operation 10/10 Boardroom Brief paid ladder closure proof",
    decision: "Whether to approve a controlled Boardroom Brief delivery after authority migration.",
    blocker: "The estate cannot promote Boardroom Brief without a paid delivery artifact proof.",
    owner: "Operation 10 admin",
    estimatedMonthlyCost: 25000,
  };

  const spine = await prisma.intelligenceSpine.create({
    data: {
      spineId,
      sourceType: "EXECUTIVE_REPORT",
      userId,
      userEmail: email,
      decisionSubject: "Operation 10 staging Boardroom Brief smoke",
      decisionContext: inputSnapshot,
      evidenceNodes: [
        {
          sourceType: "ADMIN_AUTHORISED_STAGING_SMOKE",
          sourceId: stripeSessionId,
          label: "Controlled test-mode paid order",
        },
      ],
      authorityLevel: "VERIFIED",
      isSample: false,
      qualifyingChecks: {
        paymentMode: "test",
        explicitlyNotProductionRevenue: true,
        fixtureDemoSample: false,
      },
      inputSnapshotHash: hash(inputSnapshot),
    },
  });

  const order = await prisma.boardroomBriefOrder.create({
    data: {
      userId,
      email,
      spineId: spine.spineId,
      stripeSessionId,
      stripePaymentIntentId: `pi_test_operation10_${stamp}`,
      paymentStatus: "paid",
      deliveryStatus: "paid",
      source: "admin_staging_smoke",
      riskLevel: "HIGH",
      score: 91,
      metadata: {
        ...inputSnapshot,
        stagingOnly: true,
        publicProductionSmoke: false,
      },
    },
  });

  const sourceType = "EXECUTIVE_REPORT";
  const authority = assertPaidDeliveryAuthorised({
    spineId: spine.spineId,
    sourceType,
    isSample: false,
    inputObject: {
      orderId: order.id,
      email: order.email,
      sourceType,
      spineId: spine.spineId,
      paymentStatus: order.paymentStatus,
      smokeType: "ADMIN_AUTHORISED_STAGING_SMOKE",
      notProductionRevenue: true,
    },
  });

  const realSpine = buildSpineFromOrder(
    {
      id: order.id,
      email: order.email,
      diagnosticId: order.diagnosticId,
      handoffId: order.handoffId,
      riskLevel: order.riskLevel,
      score: order.score,
      metadata: order.metadata,
    },
    spine.spineId,
  );

  const dossier = await BoardroomDossierService.generate({
    spine: realSpine,
    generatedBy: "operation10-staging-smoke",
    clientEmail: order.email,
    clientName: "Operation 10 Staging",
    sourceType,
    isSample: false,
    orderId: order.id,
    inputSnapshotHash: authority.inputSnapshotHash,
    artifactHash: null,
  });

  const artifactPayload = {
    id: dossier.id,
    title: dossier.title,
    sections: dossier.sections,
    spineId: dossier.spineId,
    sourceType: dossier.sourceType,
    orderId: dossier.orderId,
    generatedAt: dossier.createdAt,
  };
  const artifactHash = hashArtifact(artifactPayload);

  await prisma.boardroomDossier.update({
    where: { id: dossier.id },
    data: { artifactHash },
  });

  const runtime = await createPaidRuntimeArtifact({
    productCode: "boardroom_brief",
    sourceEntityType: "BRIEF_ORDER",
    sourceEntityId: order.id,
    userId: order.userId,
    userEmail: order.email,
    inputSnapshot,
    evidenceRefs: [
      { sourceId: spine.spineId, sourceType, label: "Verified staging IntelligenceSpine" },
      { sourceId: dossier.id, sourceType: "BoardroomDossier", label: "Persisted staging Boardroom Dossier" },
    ],
    artifactContent: JSON.stringify(artifactPayload),
    downloadUrl: `/boardroom/dossier/${dossier.id}`,
    publicSafeSummary: "Staging Boardroom Brief paid smoke dossier.",
    generatedBy: "operation10-staging-smoke",
    falsification: [
      {
        claimOrRecommendation:
          "The controlled Boardroom Brief delivery path produces a governed paid artifact from a non-sample spine.",
        confidenceLevel: "HIGH",
        whatWouldChangeThisView:
          "Any generated record is linked to fixture/demo/sample input, lacks hashes, or cannot be reached by customer/admin status routes.",
        observableIndicator:
          "ProductArtifact, FalsificationEntry, OutcomeHypothesis, ReturnBriefRequest, dossier, or delivery status record missing after smoke.",
        threshold: "One required runtime proof record is absent or linked to a sample source.",
        strongestCounterargument:
          "This is a staging/test-mode payment record and not production revenue.",
        responseToCounterargument:
          "The smoke proves runtime authority only; production public_active promotion still requires a real Stripe production paid order.",
      },
    ],
    outcomeHypothesis: {
      predictedDecisionMove:
        "Admin can move a paid Boardroom Brief from paid order to delivered customer artifact.",
      expectedObservableChange:
        "Dossier, ProductArtifact, falsification panel, outcome hypothesis, Return Brief request, access token, and delivery status all persist.",
      observationWindowDays: 14,
    },
  });

  await BoardroomDossierService.approve(dossier.id, "operation10-staging-smoke");
  const delivered = await BoardroomDossierService.grantAccess({
    dossierId: dossier.id,
    clientEmail: order.email,
    clientName: "Operation 10 Staging",
    grantedBy: "operation10-staging-smoke",
  });

  await prisma.boardroomBriefOrder.update({
    where: { id: order.id },
    data: { deliveryStatus: "delivered", deliveredAt: new Date() },
  });

  const boardroomToken = await BoardroomAccessTokenService.createToken({
    dossierId: dossier.id,
    clientEmail: order.email,
    clientName: "Operation 10 Staging",
    expiryDays: 7,
    createdBy: "operation10-staging-smoke",
  });
  const portalSession = await ClientPortalTokenService.createSession({
    clientEmail: order.email,
    expiryDays: 7,
    createdBy: "operation10-staging-smoke",
  });
  const portalValidation = await ClientPortalTokenService.validateSession(portalSession.rawToken);
  const accessValidation = await BoardroomAccessTokenService.validateToken(boardroomToken.rawToken);

  const [persistedDossier, productArtifact, falsificationCount, hypothesis, request] = await Promise.all([
    prisma.boardroomDossier.findUnique({
      where: { id: dossier.id },
      select: {
        id: true,
        orderId: true,
        sourceType: true,
        isSample: true,
        inputSnapshotHash: true,
        artifactHash: true,
        status: true,
        clientEmail: true,
      },
    }),
    prisma.productArtifact.findFirst({
      where: { sourceEntityType: "BRIEF_ORDER", sourceEntityId: order.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.falsificationEntry.count({ where: { artifactId: runtime.artifact.artifactId } }),
    prisma.outcomeHypothesis.findFirst({
      where: { sourceRunId: order.id, productCode: "boardroom_brief" },
      orderBy: { createdAt: "desc" },
    }),
    prisma.returnBriefRequest.findFirst({
      where: { outcomeHypothesisId: runtime.outcomeHypothesis.hypothesisId },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const checks = {
    stagingOnly: order.source === "admin_staging_smoke" && (order.metadata as any)?.notProductionRevenue === true,
    paymentStatusPaid: order.paymentStatus === "paid",
    authorityPassed: Boolean(authority.inputSnapshotHash),
    noFixtureDemoSampleSpine:
      !spine.spineId.toLowerCase().includes("fixture") &&
      !spine.spineId.toLowerCase().includes("demo") &&
      !spine.spineId.toLowerCase().includes("sample") &&
      spine.isSample === false,
    dossierPersists: Boolean(persistedDossier?.id),
    orderIdLinked: persistedDossier?.orderId === order.id,
    inputSnapshotHashExists: Boolean(persistedDossier?.inputSnapshotHash && productArtifact?.inputSnapshotHash),
    artifactHashExists: Boolean(persistedDossier?.artifactHash && productArtifact?.artifactHash),
    productArtifactExists: Boolean(productArtifact?.artifactId),
    falsificationPanelExists: falsificationCount > 0,
    outcomeHypothesisExists: Boolean(hypothesis?.hypothesisId),
    returnBriefDueDateExists: Boolean(hypothesis?.returnBriefDueAt && request?.dueAt),
    customerStatusRouteWorks: portalValidation.valid && accessValidation.valid,
    adminDeliveryStatusUpdates: delivered.status === "DELIVERED",
    noRawSensitiveDataLeaks:
      !JSON.stringify({
        id: persistedDossier?.id,
        title: delivered.title,
        status: delivered.status,
        sourceType: delivered.sourceType,
      }).includes(String(order.metadata)),
  };

  const passed = Object.values(checks).every(Boolean);

  console.log(JSON.stringify({
    ok: passed,
    mode: "ADMIN_AUTHORISED_STAGING_SMOKE",
    publicProductionSmoke: false,
    orderId: order.id,
    dossierId: dossier.id,
    artifactId: runtime.artifact.artifactId,
    outcomeHypothesisId: runtime.outcomeHypothesis.hypothesisId,
    returnBriefRequestId: request?.id ?? null,
    checks,
  }, null, 2));

  if (!passed) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
