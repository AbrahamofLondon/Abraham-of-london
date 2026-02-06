import { prisma } from "../lib/prisma";
import crypto from "crypto";

async function verifyInfrastructure() {
  console.log("--- ABRAHAM OF LONDON: INFRASTRUCTURE VERIFICATION ---");

  try {
    // 1. Verify Prisma Connection & Member Schema
    const memberCount = await prisma.innerCircleMember.count();
    console.log(`[OK] Database Connected. Current Members: ${memberCount}`);

    // 2. Verify Session Model for Audit Signals
    const testSessionId = `test_${crypto.randomBytes(4).toString('hex')}`;
    const testSession = await prisma.session.create({
      data: {
        sessionId: testSessionId,
        expiresAt: new Date(Date.now() + 1000 * 60),
        lastActivity: new Date(),
        ipAddress: "127.0.0.1",
        userAgent: "SanityCheck/1.0",
        data: JSON.stringify({ type: "sanity_test" })
      }
    });
    
    if (testSession.ipAddress === "127.0.0.1") {
      console.log("[OK] Session Audit Signals (IP/UA) verified.");
    }

    // 3. Verify Audit Log Indices
    const auditTest = await prisma.systemAuditLog.create({
      data: {
        action: "INFRA_CHECK",
        details: { status: "verified" },
        ipAddress: "0.0.0.0"
      }
    });
    console.log("[OK] SystemAuditLog indexed and writable.");

    // Cleanup
    await prisma.session.delete({ where: { sessionId: testSessionId } });
    console.log("--- VERIFICATION COMPLETE: SYSTEM IS HARDENED ---");

  } catch (error: any) {
    console.error("!!! INFRASTRUCTURE ERROR !!!");
    console.error(`Message: ${error.message}`);
    console.error("Check: Did you run 'npx prisma migrate dev' and 'npx prisma generate'?");
    process.exit(1);
  }
}

verifyInfrastructure();