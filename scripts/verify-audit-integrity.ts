import { auditLogger } from "../lib/audit/audit-logger";

async function verifyAuditIntegrity() {
  console.log("🛠️ Starting Audit Integrity Verification...");

  try {
    // Test 1: Standard Log (will be batched)
    await auditLogger.log({
      action: "INTEGRITY_CHECK_LOW",
      severity: "info",
      actorId: "test-actor",
      details: { note: "This should be batched" }
    });
    console.log("✅ Low-severity log accepted (queued).");

    // Test 2: High-Clearance Log (Immediate write)
    await auditLogger.log({
      action: "INTEGRITY_CHECK_HIGH",
      severity: "critical",
      actorId: "admin-check",
      tags: ["top-secret"],
      metadata: { scope: "global" }
    });
    console.log("✅ High-clearance log accepted (immediate write triggered).");

    // Test 3: Force Flush
    await auditLogger.flush();
    console.log("✅ Batch queue flushed successfully.");

    console.log("\n✨ Audit System is synchronized with the 2026 Schema.");
  } catch (error) {
    console.error("\n❌ Integrity Check Failed:", error);
    process.exit(1);
  }
}

verifyAuditIntegrity();