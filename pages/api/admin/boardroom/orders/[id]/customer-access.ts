/**
 * pages/api/admin/boardroom/orders/[id]/customer-access.ts
 *
 * Generate a secure customer access link for an approved Boardroom dossier.
 * Moves the order from approved_for_delivery → customer_access_ready.
 *
 * Creates:
 * - Secure access token for the customer
 * - Updates ProductArtifact with customerAccessUrl
 * - Records audit trail
 */
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { BoardroomAccessTokenService } from "@/lib/boardroom/boardroom-access-token";
import { assertValidTransition } from "@/lib/boardroom/boardroom-delivery-state-machine.shared";
import { recordBoardroomDeliveryEvent } from "@/lib/boardroom/boardroom-delivery-events.server";
import { routeGovernanceEvent } from "@/lib/platform/governance-event-bus";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, { routeKey: "admin-boardroom-customer-access" });
  if (!session) return;

  const { id } = req.query;
  if (typeof id !== "string") return res.status(400).json({ ok: false, error: "INVALID_ID" });

  try {
    const order = await prisma.boardroomBriefOrder.findUnique({
      where: { id },
      select: {
        id: true, deliveryStatus: true, email: true, metadata: true,
        spineId: true,
      },
    });

    if (!order) return res.status(404).json({ ok: false, error: "NOT_FOUND" });

    // Validate transition: approved_for_delivery → customer_access_ready
    assertValidTransition(order.deliveryStatus, "customer_access_ready", id);

    // Find the dossier linked to this order
    const dossier = await prisma.boardroomDossier.findFirst({
      where: { orderId: id },
      select: { id: true, title: true, clientEmail: true },
    });

    if (!dossier) {
      return res.status(422).json({
        ok: false,
        error: "NO_DOSSIER_FOUND: No BoardroomDossier linked to this order. Generate the dossier first.",
      });
    }

    // Create secure access token
    const tokenResult = await BoardroomAccessTokenService.createToken({
      dossierId: dossier.id,
      clientEmail: order.email,
      clientName: order.email.split("@")[0] ?? undefined,
      expiryDays: 30,
      createdBy: session.user?.email ?? "admin",
    });

    // Update ProductArtifact with customer access URL
    const artifactId = `pa_boardroom_${id}`;
    await prisma.productArtifact.upsert({
      where: { artifactId },
      create: {
        artifactId,
        productCode: "boardroom-brief",
        sourceEntityType: "boardroom_brief_order",
        sourceEntityId: id,
        userEmail: order.email,
        status: "READY",
        deliveryStatus: "READY_FOR_DELIVERY",
        downloadUrl: tokenResult.deliveryUrl,
      },
      update: {
        deliveryStatus: "READY_FOR_DELIVERY",
        downloadUrl: tokenResult.deliveryUrl,
      },
    });

    // Update order status with customer access URL
    const updated = await prisma.boardroomBriefOrder.update({
      where: { id },
      data: {
        deliveryStatus: "customer_access_ready",
        metadata: {
          ...(order.metadata as Record<string, unknown> ?? {}),
          customerAccessUrl: tokenResult.deliveryUrl,
          customerAccessTokenId: tokenResult.record.id,
          customerAccessCreatedAt: new Date().toISOString(),
          dossierId: dossier.id,
        },
      },
      select: { id: true, deliveryStatus: true, deliveredAt: true, updatedAt: true },
    });

    // Record audit event
    await recordBoardroomDeliveryEvent({
      orderId: id,
      fromStatus: order.deliveryStatus,
      toStatus: "customer_access_ready",
      actorEmail: session.user?.email ?? "admin",
      note: `Customer access link created. Token: ${tokenResult.record.id}`,
    });

    // Emit governance event
    await routeGovernanceEvent({
      eventType: "BOARDROOM_SECURE_LINK_CREATED",
      sourceSurface: "boardroom-mode",
      canonicalRecordType: "BoardroomBriefOrder",
      canonicalRecordId: id,
      actorEmail: session.user?.email ?? "admin",
      severity: "HIGH",
      payload: {
        dossierId: dossier.id,
        tokenId: tokenResult.record.id,
        deliveryUrl: tokenResult.deliveryUrl,
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
      customerAccessUrl: tokenResult.deliveryUrl,
      tokenId: tokenResult.record.id,
    });
  } catch (error) {
    console.error("[admin-boardroom-customer-access]", error);
    const message = error instanceof Error ? error.message : "CUSTOMER_ACCESS_FAILED";
    return res.status(422).json({ ok: false, error: message });
  }
}
