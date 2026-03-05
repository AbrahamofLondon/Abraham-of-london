// lib/audit/init.ts
import { auditLogger } from "./audit-logger";

export async function initAuditLogger() {
  return auditLogger.get();
}

export { auditLogger };