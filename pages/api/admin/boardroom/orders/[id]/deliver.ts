/**
 * pages/api/admin/boardroom/orders/[id]/deliver.ts
 *
 * Deliver a Boardroom Brief to the customer.
 * Moves the order from customer_access_ready → delivered.
 *
 * Guards:
 * - ProductArtifact must exist with status READY or READY_FOR_DELIVERY
 * - adminPreviewUrl must exist
 * - customerAccessUrl must exist
 * - Customer email must exist
 *
 * Actions:
 * - Marks ProductArtifact as DELIVERED
 * - Persists deliveredAt timestamp
 * - Sends delivery email to customer
 * - Records audit trail
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { BoardroomDossierService } from "@/lib/boardroom/boardroom-dossier-service";
import { sendBoardroomDeliveryEmail } from "@/lib/boardroom/boardroom-delivery-email";
import { BoardroomDeliveryLog } from "@/lib/boardroom/boardroom-delivery-log";
import {
  assertValidTransition,
  checkDeliveryReadiness,
} from "@/lib/boardroom/boardroom-delivery-state-machine.shared";
import { recordBoardroomDeliveryEvent } from "@/lib/boardroom/boardroom-delivery-events.server";
import { routeGovernanceEvent } from "@/lib/platform/governance-event-bus";
import { markArtifactDelivered } from "@/lib/artifacts/artifact-authority";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-boardroom-deliver" });
  if (!session) return;

  const { id } = req.query;
  if (typeof id !== "string") return res.status(400).json({ ok: false, error: "INVALID_ID" });

  try {
    const order = await prisma.boardroomBriefOrder.findUnique({
      where: { id },
      select: {
        id: true, deliveryStatus: true, email: true, metadata: true,
        userId: true, deliveredAt: true,
      },
    });

    if (!order) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    // Validate transition: customer_access_ready → delivered
    assertValidTransition(order.deliveryStatus, "delivered", id);

    // Get the ProductArtifact
    const artifactId = `pa_boardroom_${id}`;
    const artifact = await prisma.productArtifact.findUnique({
      where: { artifactId },
      select: { status: true, deliveryStatus: true, downloadUrl: true },
    });

    const meta = (order.metadata as Record<string, unknown> ?? {});
    const customerAccessUrl = (meta.customerAccessUrl as string) ?? null;

    // Run delivery readiness checks
    const readiness = checkDeliveryReadiness({
      deliveryStatus: order.deliveryStatus,
      artifactStatus: artifact?.status ?? null,
      artifactDeliveryStatus: artifact?.deliveryStatus ?? null,
      adminPreviewUrl: artifact?.downloadUrl ?? null,
      customerAccessUrl,
      customerEmail: order.email,
      deliveredAt: order.deliveredAt,
    });

    if (!readiness.ready) {
      const failures = readiness.checks
        .filter((c) => !c.passed)
        .map((c) => `  - ${c.check}: ${c.detail}`)
        .join("\n");

      return res.status(422).json({
        ok: false,
        error: "DELIVERY_NOT_READY",
        detail: "Cannot mark delivered: customer-facing artefact is not ready.",
        checks: readiness.checks,
        failures,
      });
    }

    // Find the dossier
    const dossier = await prisma.boardroomDossier.findFirst({
      where: { orderId: id },
      select: { id: true, title: true, clientEmail: true },
    });

    // Mark ProductArtifact as delivered
    try {
      await markArtifactDelivered(artifactId);
    } catch (err) {
      console.warn("[BOARDROOM_DELIVER_ARTIFACT_MARK_FAILED]", err);
    }

    // Update order status
    const updated = await prisma.boardroomBriefOrder.update({
      where: { id },
      data: {
        deliveryStatus: "delivered",
        deliveredAt: new Date(),
        metadata: {
          ...meta,
          deliveredAt: new Date().toISOString(),
          deliveredBy: session.user?.email ?? "admin",
        },
      },
      select: { id: true, deliveryStatus: true, deliveredAt: true, updatedAt: true },
    });

    // Grant access via dossier service
    if (dossier) {
      try {
        await BoardroomDossierService.grantAccess({
          dossierId: dossier.id,
          clientEmail: order.email,
          clientName: order.email.split("@")[0] ?? undefined,
          grantedBy: session.user?.email ?? "admin",
        });
      } catch (err) {
        console.warn("[BOARDROOM_DELIVER_DOSSIER_ACCESS_FAILED]", err);
      }

      // Send delivery email
      if (customerAccessUrl) {
        try {
          const emailResult = await sendBoardroomDeliveryEmail({
            to: order.email,
            clientName: order.email.split("@")[0],
            dossierTitle: dossier.title,
            deliveryUrl: customerAccessUrl,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            dossierId: dossier.id,
            tokenId: "delivery-" + id,
          });

          if (emailResult.ok) {
            await BoardroomDeliveryLog.record({
              tokenId: "delivery-" + id,
              dossierId: dossier.id,
              eventType: "SENT",
              clientEmail: order.email,
              performedBy: session.user?.email ?? "admin",
              metadata: { emailId: emailResult.emailId },
            });
          } else {
            await BoardroomDeliveryLog.record({
              tokenId: "delivery-" + id,
              dossierId: dossier.id,
              eventType: "SEND_FAILED",
              clientEmail: order.email,
              performedBy: session.user?.email ?? "admin",
              metadata: { error: emailResult.error },
            });
          }
        } catch (err) {
          console.warn("[BOARDROOM_DELIVER_EMAIL_FAILED]", err);
        }
      }
    }

    // Record audit event
    await recordBoardroomDeliveryEvent({
      orderId: id,
      fromStatus: order.deliveryStatus,
      toStatus: "delivered",
      actorEmail: session.user?.email ?? "admin",
      note: "Order delivered to customer.",
    });

    // Emit governance event
    await routeGovernanceEvent({
      eventType: "BOARDROOM_DOSSIER_DELIVERED",
      sourceSurface: "boardroom-mode",
      canonicalRecordType: "BoardroomBriefOrder",
      canonicalRecordId: id,
      actorEmail: session.user?.email ?? "admin",
      severity: "HIGH",
      payload: {
        customerEmail: order.email,
        hasDossier: !!dossier,
        customerAccessUrl: customerAccessUrl ?? null,
      },
      shouldWriteAudit: true,
      shouldWriteLineage: true,
    });

    return res.status(200).json({
      ok: true,
      order: {
        ...updated,
        deliveredAt: updated.deliveredAt?.toISOString() ?? null,
        updatedAt: updated.updatedAt.toISOString(),
      },
      customerAccessUrl,
    });
  } catch (error) {
    console.error("[admin-boardroom-deliver]", error);
    const message = error instanceof Error ? error.message : "DELIVERY_FAILED";
    return res.status(422).json({ ok: false, error: message });
  }
}
