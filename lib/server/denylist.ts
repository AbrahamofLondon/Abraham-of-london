/* lib/server/denylist.ts — Production Security */
import "server-only";
import crypto from "crypto";
import { prisma } from "@/lib/prisma.server";
import type { AuditSeverity } from "@prisma/client";

const PEPPER = process.env.DENYLIST_PEPPER || "aol-denylist-pepper";

export type DenySeverity = "low" | "medium" | "high" | "critical";

/**
 * Normalizes IP addresses for consistent hashing and lookups.
 */
export function normalizeIp(ip: string): string {
  return String(ip || "")
    .trim()
    .toLowerCase()
    .replace(/^\:\:ffff\:/, "");
}

/**
 * Generates a HMAC hash of the IP for privacy-safe storage comparisons.
 */
export function hashIp(ip: string): string {
  const norm = normalizeIp(ip);
  return crypto.createHmac("sha256", PEPPER).update(norm).digest("hex");
}

/**
 * Maps local severity logic to Prisma AuditSeverity Enum.
 */
function toDbSeverity(sev: DenySeverity): AuditSeverity {
  switch (sev) {
    case "critical": return "critical";
    case "high": return "high";
    case "medium": return "warning";
    default: return "info";
  }
}

/**
 * Records a denylist entry in the SystemAuditLog.
 */
export async function denyIp(
  ip: string, 
  reason = "SECURITY_POLICY", 
  severity: DenySeverity = "high"
) {
  const norm = normalizeIp(ip);
  if (!norm || norm === "unknown") return;

  const ipHash = hashIp(norm);

  await prisma.systemAuditLog.create({
    data: {
      actorType: "system",
      action: "IP_DENYLISTED",
      resourceType: "security",
      resourceId: "denylist",
      severity: toDbSeverity(severity),
      ipAddress: norm,
      // FIXED: Changed 'details' to 'metadata' to match your Prisma schema
      metadata: { 
        reason, 
        severity, 
        ipHash 
      },
      status: "warning"
    },
  });
}

/**
 * Checks if an IP is currently restricted.
 */
export async function isIpDenied(ip: string): Promise<boolean> {
  const norm = normalizeIp(ip);
  if (!norm || norm === "unknown") return false;

  const ipHash = hashIp(norm);

  const row = await prisma.systemAuditLog.findFirst({
    where: { 
      action: "IP_DENYLISTED", 
      ipAddress: norm 
    },
    orderBy: { createdAt: "desc" },
    select: { metadata: true },
  });

  if (!row) return false;

  const metadata: any = row.metadata ?? {};
  // Verify hash integrity
  if (metadata.ipHash !== ipHash) return false;

  const expiresAt = metadata.expiresAt ? Date.parse(String(metadata.expiresAt)) : NaN;
  if (Number.isFinite(expiresAt) && expiresAt <= Date.now()) return false;

  return true;
}

/**
 * Logs an attempt by a denylisted IP to access the system.
 */
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
      severity: "warning", 
      ipAddress: norm,
      metadata: { ipHash }, // FIXED: details -> metadata
    },
  });
}