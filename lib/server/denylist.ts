/* lib/server/denylist.ts — Compliance denylist (AuditLog-backed) + compat signature */
import "server-only";

import crypto from "crypto";
import { prisma } from "@/lib/prisma.server";

const PEPPER =
  process.env.DENYLIST_PEPPER ||
  process.env.CRON_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "aol-denylist-pepper";

export type DenySeverity = "low" | "medium" | "high" | "critical";

export function normalizeIp(ip: string): string {
  return String(ip || "")
    .trim()
    .toLowerCase()
    .replace(/^\:\:ffff\:/, "");
}

export function hashIp(ip: string): string {
  const norm = normalizeIp(ip);
  return crypto.createHmac("sha256", PEPPER).update(norm).digest("hex");
}

function toDbSeverity(sev: DenySeverity): "low" | "medium" | "high" {
  if (sev === "critical") return "high";
  if (sev === "high") return "high";
  if (sev === "medium") return "medium";
  return "low";
}

/**
 * COMPAT SIGNATURE:
 * denyIp(ip, reason, severity)
 *
 * Persists deny decision in systemAuditLog (no schema changes required).
 */
export async function denyIp(
  ip: string,
  reason = "SECURITY_POLICY",
  severity: DenySeverity = "high"
): Promise<void> {
  const norm = normalizeIp(ip);
  if (!norm || norm === "unknown") return;

  const ipHash = hashIp(norm);

  await prisma.systemAuditLog.create({
    data: {
      actorType: "system",
      action: "IP_DENYLISTED",
      resourceType: "security",
      resourceId: "denylist",
      status: "warning",
      severity: toDbSeverity(severity),
      ipAddress: norm, // store raw ip (optional; remove if you prefer hash-only)
      details: {
        ipHash,
        reason,
        severity,
        source: "security-monitor",
        // Optional future TTL support:
        // expiresAt: null,
      },
    },
  });
}

export async function isIpDenied(ip: string): Promise<boolean> {
  const norm = normalizeIp(ip);
  if (!norm || norm === "unknown") return false;

  const ipHash = hashIp(norm);

  // Find latest deny record for this ipHash
  const row = await prisma.systemAuditLog.findFirst({
    where: {
      action: "IP_DENYLISTED",
      // If you store ipAddress, use it; hash is in details:
      // ipAddress: norm,
    },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      details: true,
    },
  });

  if (!row) return false;

  // Ensure it matches this IP hash (details is typically Json)
  const details: any = row.details ?? {};
  if (details.ipHash !== ipHash) return false;

  // Optional expiry support (if you later include expiresAt in details)
  const expiresAt = details.expiresAt ? Date.parse(String(details.expiresAt)) : NaN;
  if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) return false;

  return true;
}

export async function recordDenylistHit(ip: string): Promise<void> {
  const norm = normalizeIp(ip);
  if (!norm || norm === "unknown") return;

  const ipHash = hashIp(norm);

  await prisma.systemAuditLog.create({
    data: {
      actorType: "system",
      action: "DENYLIST_HIT",
      resourceType: "security",
      resourceId: "denylist",
      status: "warning",
      severity: "medium",
      ipAddress: norm,
      details: { ipHash },
    },
  });
}