// lib/inner-circle/index.ts
/**
 * Public Inner Circle module surface (stable import path).
 * Keeps legacy imports working:
 *   import { ... } from "@/lib/inner-circle"
 */

export {
  createOrUpdateMemberAndIssueKey,
  verifyInnerCircleKey,
  recordInnerCircleUnlock,
  revokeInnerCircleKey,
  deleteMemberByEmail,
  getPrivacySafeStats,
  getMemberByEmail,
} from "@/lib/server/inner-circle-store";

// Email: new canonical location
export { sendInnerCircleEmail } from "@/lib/inner-circle/email";

// Admin export helpers (if used by routes)
export { getPrivacySafeKeyExport } from "@/lib/server/inner-circle-export";

// IP helpers SHOULD NOT be from inner-circle, but keep a compat export if needed.
export { getClientIp } from "@/lib/server/ip";