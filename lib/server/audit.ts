/* lib/server/audit.ts */
import prisma from "@/lib/prisma";
import { getClientIp } from "@/lib/server/ip";
import { getRequestId } from "@/lib/server/http";
import type { NextApiRequest } from "next";

export async function logAuditEventFromRequest(
  req: NextApiRequest,
  action: string,
  resource: { type: string; id?: string },
  details?: unknown
) {
  const ip = getClientIp(req);
  const requestId = getRequestId(req);

  return prisma.systemAuditLog.create({
    data: {
      actorType: "api",
      action,
      resourceType: resource.type,
      resourceId: resource.id ?? null,
      ipAddress: ip,
      requestId,
      newValue: details ? JSON.stringify(details) : null,
      status: "success",
    },
  });
}