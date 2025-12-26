declare module "@/lib/inner-circle" {
  import type {
    InnerCircleStatus,
    CreateOrUpdateMemberArgs,
    IssuedKey,
    VerifyInnerCircleKeyResult,
    PrivacySafeKeyRow,
    CleanupResult,
  } from "@/lib/server/inner-circle-store";

  export interface InnerCircleApi {
    createOrUpdateMemberAndIssueKey: (
      args: CreateOrUpdateMemberArgs
    ) => Promise<IssuedKey>;
    verifyInnerCircleKey: (key: string) => Promise<VerifyInnerCircleKeyResult>;
    getPrivacySafeStats: () => Promise<{
      totalMembers: number;
      totalKeys: number;
    }>;
    getPrivacySafeKeyRows: () => Promise<PrivacySafeKeyRow[]>;
    getClientIp: (req: any) => string | undefined;
    getPrivacySafeKeyExport: (key: string) => string;
    deleteMemberByEmail: (email: string) => Promise<boolean>;
    cleanupExpiredData: () => Promise<CleanupResult>;
    recordInnerCircleUnlock: (key: string, ip?: string) => Promise<void>;
    revokeInnerCircleKey: (
      key: string,
      revokedBy?: string,
      reason?: string
    ) => Promise<boolean>;
    getActiveKeysForMember: (memberId: string) => Promise<any[]>;
  }

  export interface InnerCircleAdminApi extends InnerCircleApi {
    getPrivacySafeKeyRows: () => Promise<PrivacySafeKeyRow[]>;
    // Add other admin-specific methods here
  }

  const innerCircle: InnerCircleApi;
  export default innerCircle;
}