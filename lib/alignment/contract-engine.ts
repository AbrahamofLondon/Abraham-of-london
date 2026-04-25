// lib/alignment/contract-engine.ts

import { PatternBreakerContract, ContractStatus, PeerComparison } from "./contract-types";
import { getOrCreateSubjectId } from "@/lib/diagnostics/subject-id";

const CONTRACTS_STORAGE_KEY = "aol_pattern_contracts";
const VERIFICATION_PENDING_KEY = "aol_pending_verification";

// LocalStorage persistence (upgrade to DB later)
export function saveContract(contract: PatternBreakerContract): void {
  try {
    const existing = getContracts();
    const updated = [...existing.filter(c => c.id !== contract.id), contract];
    localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(updated));
    
    // Schedule verification
    scheduleVerification(contract);
  } catch (error) {
    console.error("Failed to save contract:", error);
  }
}

export function getContracts(subjectId?: string): PatternBreakerContract[] {
  try {
    const raw = localStorage.getItem(CONTRACTS_STORAGE_KEY);
    const all = raw ? JSON.parse(raw) : [];
    return subjectId ? all.filter((c: PatternBreakerContract) => c.subjectId === subjectId) : all;
  } catch {
    return [];
  }
}

export function getContract(contractId: string): PatternBreakerContract | null {
  const contracts = getContracts();
  return contracts.find(c => c.id === contractId) ?? null;
}

export function getContractById(contractId: string): PatternBreakerContract | null {
  return getContract(contractId);
}

export function getMostRecentContract(subjectId: string): PatternBreakerContract | null {
  const contracts = getContracts(subjectId).filter(c => c.status !== "archived");
  if (contracts.length === 0) return null;
  return contracts.sort((a, b) => new Date(b.signedAt).getTime() - new Date(a.signedAt).getTime())[0]!;
}

export function updateContractStatus(
  contractId: string,
  status: ContractStatus,
  metadata?: { completedAt?: string; breachedAt?: string; breachReason?: string; modifiedDeadline?: string; extensionReason?: string }
): void {
  const contracts = getContracts();
  const index = contracts.findIndex(c => c.id === contractId);
  if (index === -1 || !contracts[index]) return;

  contracts[index] = {
    ...contracts[index]!,
    status,
    ...metadata,
    updatedAt: new Date().toISOString(),
  } as PatternBreakerContract;
  
  localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(contracts));
  
  // Trigger re-evaluation for longitudinal intelligence
  window.dispatchEvent(new CustomEvent("contract-status-updated", { detail: { contractId, status } }));
}

function scheduleVerification(contract: PatternBreakerContract): void {
  const deadline = new Date(contract.deadline);
  const now = new Date();
  const msUntilDeadline = deadline.getTime() - now.getTime();
  
  if (msUntilDeadline <= 0) {
    // Already past deadline - mark breached immediately
    updateContractStatus(contract.id, "breached", { breachedAt: new Date().toISOString() });
    return;
  }
  
  // Store in verification queue
  const pending = getPendingVerifications();
  pending.push({
    contractId: contract.id,
    scheduledFor: deadline.toISOString(),
    retryCount: 0,
  });
  localStorage.setItem(VERIFICATION_PENDING_KEY, JSON.stringify(pending));
}

function getPendingVerifications(): Array<{ contractId: string; scheduledFor: string; retryCount: number }> {
  try {
    const raw = localStorage.getItem(VERIFICATION_PENDING_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Call this on app initialization or via a service worker
export function processDueVerifications(): void {
  const pending = getPendingVerifications();
  const now = new Date();
  const due = pending.filter(p => new Date(p.scheduledFor) <= now);
  
  for (const item of due) {
    const contract = getContracts().find(c => c.id === item.contractId);
    if (!contract || contract.status !== "pending") continue;
    
    // In production: send email/SMS via API
    console.log(`[VERIFICATION REQUIRED] Contract ${contract.id} for ${contract.demographic.role}`);
    console.log(`Commitment: "${contract.userCommitment}"`);
    console.log(`Consequence: "${contract.consequenceOfInaction}"`);
    
    // For demo: auto-mark breached after 48h grace period
    const daysSinceDeadline = Math.floor((now.getTime() - new Date(contract.deadline).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceDeadline >= 2) {
      updateContractStatus(contract.id, "breached", { 
        breachedAt: now.toISOString(),
        breachReason: "No verification received within grace period"
      });
    }
  }
  
  // Remove processed items from queue
  const remaining = pending.filter(p => !due.includes(p));
  localStorage.setItem(VERIFICATION_PENDING_KEY, JSON.stringify(remaining));
}

// Peer analysis for "unfair advantage"
export function getPeerComparison(
  role: string, 
  weakestDomain: string, 
  currentPercentile?: number
): PeerComparison | null {
  const allContracts = getContracts();
  const relevantContracts = allContracts.filter(
    c => c.demographic.role === role && c.weakestDomain === weakestDomain && c.status !== "archived"
  );
  
  if (relevantContracts.length < 5) return null;
  
  const breached = relevantContracts.filter(c => c.status === "breached").length;
  const completed = relevantContracts.filter(c => c.status === "completed").length;
  const breachRate = breached / relevantContracts.length;
  const completionRate = completed / relevantContracts.length;
  
  // Calculate average completion time
  const completedWithDates = relevantContracts.filter(c => c.completedAt && c.signedAt);
  const avgDays = completedWithDates.reduce((sum, c) => {
    const signed = new Date(c.signedAt);
    const completed = new Date(c.completedAt!);
    const days = (completed.getTime() - signed.getTime()) / (1000 * 60 * 60 * 24);
    return sum + days;
  }, 0) / (completedWithDates.length || 1);
  
  // Percentile rank: if currentPercentile provided, lower breach rate = higher percentile
  const percentileRank = currentPercentile !== undefined 
    ? Math.min(100, Math.max(0, (breachRate - currentPercentile) * 100))
    : Math.round(breachRate * 100);
  
  return {
    role,
    weakestDomain,
    totalContracts: relevantContracts.length,
    breachRate,
    completionRate,
    averageCompletionDays: avgDays,
    percentileRank,
  };
}

// Generate unique token for verification
function generateVerificationToken(): string {
  return `pbc_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}