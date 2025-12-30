/* scripts/maintenance/clean-keys.ts */
import { prisma } from "../../lib/prisma";

/**
 * INSTITUTIONAL KEY MAINTENANCE
 * Targets:
 * 1. Expired keys (Past expiresAt)
 * 2. Stale keys (No usage in 180 days)
 * 3. Orphaned keys (Status 'active' but logically invalid)
 */
async function cleanKeys() {
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - 180); // 6-month inactivity threshold

  console.log(`[MAINTENANCE] Commencing Key Cleanup: ${new Date().toISOString()}`);

  try {
    const result = await prisma.$transaction([
      // 1. AUTO-REVOKE EXPIRED KEYS
      prisma.innerCircleKey.updateMany({
        where: {
          status: "active",
          expiresAt: { lt: new Date() },
        },
        data: {
          status: "expired",
          revokedAt: new Date(),
          revokedReason: "Automatic system expiry",
        },
      }),

      // 2. AUTO-REVOKE STALE KEYS (Inactive for 6 months)
      prisma.innerCircleKey.updateMany({
        where: {
          status: "active",
          lastUsedAt: { lt: thresholdDate },
          createdAt: { lt: thresholdDate }, // Ensure we don't revoke brand new keys never used
        },
        data: {
          status: "revoked",
          revokedAt: new Date(),
          revokedReason: "Revoked due to 180-day inactivity",
        },
      }),
    ]);

    console.log(`[SUCCESS] Maintenance Complete.`);
    console.log(` - Expired keys processed: ${result[0].count}`);
    console.log(` - Stale keys revoked: ${result[1].count}`);

  } catch (error) {
    console.error("[CRITICAL] Maintenance Subsystem Failure:", error);
    process.exit(1);
  }
}

cleanKeys()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });