import type { NextApiRequest, NextApiResponse } from "next";

import { requireAdminServer } from "@/lib/auth/requireAdminServer";
import { recordEmailDeliveryAttempt } from "@/lib/email/delivery-audit";
import { getEmailTransportStatus, sendEmailTransport } from "@/lib/email/transport";
import {
  listAllDeliveries,
  recordDeliveryOutcome,
} from "@/lib/product/oversight-delivery-service";

function buildPortalLink(baseUrl: string, delivery: Awaited<ReturnType<typeof listAllDeliveries>>[number]) {
  if (delivery.artifactType === "OVERSIGHT_BRIEF") {
    return `${baseUrl}/oversight/brief/${delivery.artifactId}`;
  }
  return `${baseUrl}/account/proof-pack`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "METHOD_NOT_ALLOWED" });
  }

  const session = await requireAdminServer(req, res, {
    routeKey: "admin-delivery-queue-send",
  });
  if (!session) return;

  const { deliveryId } = req.body as { deliveryId?: string };
  if (!deliveryId) {
    return res.status(400).json({ ok: false, error: "DELIVERY_ID_REQUIRED" });
  }

  const deliveries = await listAllDeliveries();
  const delivery = deliveries.find((item) => item.id === deliveryId);
  if (!delivery) {
    return res.status(404).json({ ok: false, error: "DELIVERY_NOT_FOUND" });
  }
  if (!delivery.clientSafe) {
    return res.status(400).json({ ok: false, error: "DELIVERY_NOT_CLIENT_SAFE" });
  }
  if (delivery.status !== "APPROVED" && delivery.status !== "TRANSPORT_PENDING" && delivery.status !== "QUEUED") {
    return res.status(400).json({ ok: false, error: "DELIVERY_NOT_SENDABLE" });
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  const portalLink = buildPortalLink(baseUrl, delivery);
  const sourceLabel = delivery.sourceLabel || (delivery.artifactType === "OVERSIGHT_BRIEF" ? "Governed oversight brief" : "Proof pack");
  const evidencePosture = delivery.evidencePosture || "SOURCE_LABELLED";
  const transport = await sendEmailTransport({
    to: delivery.recipientEmail,
    subject: `${delivery.artifactType === "OVERSIGHT_BRIEF" ? "Oversight brief" : "Proof pack"} ready`,
    html: `
      <div style="font-family: Georgia, serif; color: #111;">
        <p>Your approved client-safe artifact is ready.</p>
        <p>Source label: ${sourceLabel}</p>
        <p>Evidence posture: ${evidencePosture}</p>
        <p>Secure portal link: <a href="${portalLink}">${portalLink}</a></p>
      </div>
    `,
  });

  const operatorId = typeof session.user?.id === "string" ? session.user.id : null;
  await recordEmailDeliveryAttempt({
    deliveryId,
    recipientEmail: delivery.recipientEmail,
    artifactType: delivery.artifactType,
    provider: transport.provider,
    status: transport.status,
    providerMessageId: transport.providerMessageId ?? null,
    failureReason: transport.failureReason ?? null,
    operatorId,
  });

  const updated = await recordDeliveryOutcome(deliveryId, {
    status: transport.status === "SENT" ? "DELIVERED" : transport.status === "FAILED" ? "FAILED" : "TRANSPORT_PENDING",
    deliveredBy: operatorId,
    providerStatus: getEmailTransportStatus(),
    providerMessageId: transport.providerMessageId ?? null,
    failureReason: transport.failureReason ?? null,
    sourceLabel,
    evidencePosture,
  });

  return res.status(200).json({
    ok: true,
    transport,
    record: updated,
  });
}
