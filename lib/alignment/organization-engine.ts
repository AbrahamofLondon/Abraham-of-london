// lib/alignment/organization-engine.ts
// Team/org-level aggregation and benchmarking

import { OrganizationContext } from "./enhanced-types";
import { getContracts } from "./contract-engine";

const ORGS_STORAGE_KEY = "aol_organizations";

// Create or join organization
export function createOrganization(name: string, subjectId: string): OrganizationContext {
  const orgId = `org_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  
  const org: OrganizationContext = {
    orgId,
    name,
    members: [subjectId],
    inviteCode: generateInviteCode(),
    createdAt: new Date().toISOString(),
    patternDistribution: {
      identity: 0,
      decision: 0,
      environment: 0,
      behaviour: 0,
      emotional_order: 0,
      legacy: 0
    },
    avgBreachRate: 0,
    avgCompletionTime: 0,
    totalContracts: 0,
    activeContracts: 0,
    highRiskMembers: [],
    teamTrends: []
  };
  
  saveOrganization(org);
  return org;
}

export function joinOrganization(inviteCode: string, subjectId: string): OrganizationContext | null {
  const org = getOrganizationByInviteCode(inviteCode);
  if (!org) return null;
  
  if (!org.members.includes(subjectId)) {
    org.members.push(subjectId);
    saveOrganization(org);
  }
  
  return org;
}

export function getOrganization(orgId: string): OrganizationContext | null {
  try {
    const orgs = getOrganizations();
    return orgs.find(o => o.orgId === orgId) || null;
  } catch {
    return null;
  }
}

export function getOrganizationByInviteCode(inviteCode: string): OrganizationContext | null {
  try {
    const orgs = getOrganizations();
    return orgs.find(o => o.inviteCode === inviteCode) || null;
  } catch {
    return null;
  }
}

export function getOrganizations(): OrganizationContext[] {
  try {
    const raw = localStorage.getItem(ORGS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveOrganization(org: OrganizationContext): void {
  try {
    const orgs = getOrganizations();
    const updated = [...orgs.filter(o => o.orgId !== org.orgId), org];
    localStorage.setItem(ORGS_STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save organization:", error);
  }
}

// Refresh organization analytics
export function refreshOrganizationAnalytics(orgId: string): OrganizationContext | null {
  const org = getOrganization(orgId);
  if (!org) return null;
  
  // Aggregate all member contracts
  const allContracts = org.members.flatMap(memberId => 
    getContracts(memberId).filter(c => c.status !== "archived")
  );
  
  // Calculate pattern distribution
  const patternCounts: Record<string, number> = {
    identity: 0, decision: 0, environment: 0, behaviour: 0, emotional_order: 0, legacy: 0
  };
  
  for (const contract of allContracts) {
    if (contract.weakestDomain) {
      patternCounts[contract.weakestDomain] = (patternCounts[contract.weakestDomain] || 0) + 1;
    }
  }
  
  const totalPatterns = Object.values(patternCounts).reduce((a, b) => a + b, 0);
  org.patternDistribution = {
    identity: totalPatterns ? ((patternCounts.identity ?? 0) / totalPatterns) : 0,
    decision: totalPatterns ? ((patternCounts.decision ?? 0) / totalPatterns) : 0,
    environment: totalPatterns ? ((patternCounts.environment ?? 0) / totalPatterns) : 0,
    behaviour: totalPatterns ? ((patternCounts.behaviour ?? 0) / totalPatterns) : 0,
    emotional_order: totalPatterns ? ((patternCounts.emotional_order ?? 0) / totalPatterns) : 0,
    legacy: totalPatterns ? ((patternCounts.legacy ?? 0) / totalPatterns) : 0
  };
  
  // Calculate breach rate
  const breached = allContracts.filter(c => c.status === "breached").length;
  org.avgBreachRate = allContracts.length ? breached / allContracts.length : 0;
  
  // Calculate completion time
  const completed = allContracts.filter(c => c.status === "completed" && c.completedAt && c.signedAt);
  const totalDays = completed.reduce((sum, c) => {
    const signed = new Date(c.signedAt!);
    const completedDate = new Date(c.completedAt!);
    return sum + (completedDate.getTime() - signed.getTime()) / (1000 * 60 * 60 * 24);
  }, 0);
  org.avgCompletionTime = completed.length ? totalDays / completed.length : 0;
  
  org.totalContracts = allContracts.length;
  org.activeContracts = allContracts.filter(c => c.status === "pending").length;
  
  // Identify high-risk members
  org.highRiskMembers = org.members.map(memberId => {
    const memberContracts = getContracts(memberId);
    const breachRate = memberContracts.length ? 
      memberContracts.filter(c => c.status === "breached").length / memberContracts.length : 0;
    const recentContract = memberContracts.find(c => c.status === "pending");
    
    return {
      subjectId: memberId,
      riskScore: breachRate,
      pattern: recentContract?.weakestDomain || "unknown",
      currentContractId: recentContract?.id
    };
  }).filter(m => m.riskScore > 0.3);
  
  // Generate monthly trends
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  org.teamTrends = months.slice(-6).map(month => {
    const monthContracts = allContracts.filter(c => 
      new Date(c.signedAt).getMonth() === months.indexOf(month)
    );
    const monthBreached = monthContracts.filter(c => c.status === "breached").length;
    const monthCompleted = monthContracts.filter(c => c.status === "completed").length;
    
    return {
      month,
      breachRate: monthContracts.length ? monthBreached / monthContracts.length : 0,
      completionRate: monthContracts.length ? monthCompleted / monthContracts.length : 0
    };
  });
  
  saveOrganization(org);
  return org;
}

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}