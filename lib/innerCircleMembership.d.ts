// lib/innerCircleMembership.d.ts
declare module "@/lib/innerCircleMembership" {
  export interface CreateOrUpdateMemberArgs {
    email: string;
    name?: string;
    ipAddress?: string;
    context?: string;
  }
  
  export interface IssuedKey {
    key: string;
    keySuffix: string;
    createdAt: string;
    status: string;
  }
  
  export function createOrUpdateMemberAndIssueKey(
    args: CreateOrUpdateMemberArgs
  ): Promise<IssuedKey>;
}


