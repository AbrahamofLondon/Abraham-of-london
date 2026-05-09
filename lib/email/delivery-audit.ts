import { prisma } from "@/lib/prisma.server";

export type EmailDeliveryAttempt = {
  deliveryId: string;
  recipientEmail: string;
  artifactType: string;
  provider: "RESEND" | "DRY_RUN";
  status: "SENT" | "FAILED" | "DRY_RUN";
  providerMessageId?: string | null;
  failureReason?: string | null;
  operatorId?: string | null;
};

export async function recordEmailDeliveryAttempt(input: EmailDeliveryAttempt) {
  await prisma.auditEvent.create({
    data: {
      actorType: input.operatorId ? "ADMIN" : "SYSTEM",
      actorId: input.operatorId ?? null,
      objectType: "EMAIL_DELIVERY_ATTEMPT",
      objectId: input.deliveryId,
      actionType: input.status === "FAILED" ? "BLOCKED" : "CREATED",
      summary: `${input.provider} ${input.status.toLowerCase()} for ${input.artifactType} to ${input.recipientEmail}`,
      metadata: {
        ...input,
        attemptedAt: new Date().toISOString(),
      },
    },
  }).catch(() => null);
}
