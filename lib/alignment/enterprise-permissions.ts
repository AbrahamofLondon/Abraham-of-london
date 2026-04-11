// lib/alignment/enterprise-permissions.ts

export type EnterpriseRole =
  | "organisation_owner"
  | "campaign_admin"
  | "executive_viewer"
  | "team_lead_viewer"
  | "participant";

export function canViewExecutiveDashboard(role: EnterpriseRole): boolean {
  return ["organisation_owner", "campaign_admin", "executive_viewer"].includes(role);
}

export function canManageCampaign(role: EnterpriseRole): boolean {
  return ["organisation_owner", "campaign_admin"].includes(role);
}

export function canRespond(role: EnterpriseRole): boolean {
  return role === "participant" || canManageCampaign(role) || canViewExecutiveDashboard(role);
}