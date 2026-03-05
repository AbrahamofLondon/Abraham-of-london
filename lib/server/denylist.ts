// lib/server/denylist.ts — Compliance denylist (DB-backed) + compat signature
import "server-only";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";

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

/**
 * COMPAT SIGNATURE to match your current calls:
 * denyIp(ip, reason, severity)
 */
export async function denyIp(ip: string, reason = "SECURITY_POLICY", severity: DenySeverity = "high") {
  const norm = normalizeIp(ip);
  if (!norm || norm === "unknown") return;

  const ipHash = hashIp(norm);

  await prisma.denylistIp.upsert({
    where: { ipHash },
    create: {
      ipHash,
      reason,
      severity,
      source: "security-monitor",
      expiresAt: null,
      hitCount: 0,
      lastHitAt: null,
    },
    update: {
      reason,
      severity,
      source: "security-monitor",
    },
  });
}

export async function isIpDenied(ip: string): Promise<boolean> {
  const norm = normalizeIp(ip);
  if (!norm || norm === "unknown") return false;

  const ipHash = hashIp(norm);

  const row = await prisma.denylistIp.findUnique({
    where: { ipHash },
    select: { expiresAt: true },
  });

  if (!row) return false;
  if (row.expiresAt && row.expiresAt.getTime() <= Date.now()) return false;
  return true;
}

export async function recordDenylistHit(ip: string): Promise<void> {
  const norm = normalizeIp(ip);
  if (!norm || norm === "unknown") return;

  const ipHash = hashIp(norm);

  await prisma.denylistIp.updateMany({
    where: { ipHash },
    data: {
      hitCount: { increment: 1 },
      lastHitAt: new Date(),
    },
  });
}