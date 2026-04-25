// lib/alignment/execution-engine.ts
// Agentic execution tracking between contract signing and deadline

import { ExecutionTrace, MicroCheckin, ContractStatus } from "./enhanced-types";
import { getContract, updateContractStatus, getContracts } from "./contract-engine";

const EXECUTION_STORAGE_KEY = "aol_execution_traces";
const CHECKIN_QUEUE_KEY = "aol_checkin_queue";

// Store execution trace
export function saveExecutionTrace(trace: ExecutionTrace): void {
  try {
    const traces = getExecutionTraces();
    const updated = [...traces.filter(t => t.contractId !== trace.contractId), trace];
    localStorage.setItem(EXECUTION_STORAGE_KEY, JSON.stringify(updated));
    
    // Schedule first checkin
    scheduleCheckin(trace.contractId, 48); // 48 hours after signing
  } catch (error) {
    console.error("Failed to save execution trace:", error);
  }
}

export function getExecutionTrace(contractId: string): ExecutionTrace | null {
  try {
    const traces = getExecutionTraces();
    return traces.find(t => t.contractId === contractId) || null;
  } catch {
    return null;
  }
}

export function getExecutionTraces(): ExecutionTrace[] {
  try {
    const raw = localStorage.getItem(EXECUTION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Update progress on a trace
export function updateProgress(contractId: string, progress: number, action?: string): void {
  const trace = getExecutionTrace(contractId);
  if (!trace) return;
  
  trace.currentProgress = Math.min(100, Math.max(0, progress));
  if (action) {
    trace.microActions.push({
      action,
      completedAt: new Date().toISOString(),
      source: "user_report"
    });
  }
  trace.lastCheckinAt = new Date().toISOString();
  
  saveExecutionTrace(trace);
  
  // If progress hits 100, trigger auto-verification
  if (progress >= 100) {
    triggerVerification(contractId);
  }
}

// Schedule a checkin (email/push/in-app)
function scheduleCheckin(contractId: string, hoursFromNow: number): void {
  const queue = getCheckinQueue();
  const scheduledFor = new Date(Date.now() + hoursFromNow * 60 * 60 * 1000);
  
  queue.push({
    contractId,
    scheduledFor: scheduledFor.toISOString(),
    type: "in_app",
    retryCount: 0
  });
  
  localStorage.setItem(CHECKIN_QUEUE_KEY, JSON.stringify(queue));
}

export function getCheckinQueue(): Array<{
  contractId: string;
  scheduledFor: string;
  type: "email" | "push" | "in_app";
  retryCount: number;
}> {
  try {
    const raw = localStorage.getItem(CHECKIN_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Process due checkins (call this on app initialization or via service worker)
export function processDueCheckins(): MicroCheckin[] {
  const queue = getCheckinQueue();
  const now = new Date();
  const due = queue.filter(item => new Date(item.scheduledFor) <= now);
  const processed: MicroCheckin[] = [];
  
  for (const item of due) {
    const contract = getContract(item.contractId);
    if (!contract || contract.status !== "pending") continue;
    
    const daysRemaining = Math.ceil(
      (new Date(contract.deadline).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    // Create checkin record
    const checkin: MicroCheckin = {
      contractId: item.contractId,
      daysRemaining,
      timestamp: now.toISOString()
    };
    
    processed.push(checkin);
    
    // Update trace with checkpoint
    const trace = getExecutionTrace(item.contractId);
    if (trace) {
      trace.checkpoints.push({
        scheduledAt: item.scheduledFor,
        type: item.type,
        status: "sent",
        deliveredAt: now.toISOString()
      });
      saveExecutionTrace(trace);
    }
    
    // If overdue and near deadline, escalate urgency
    if (daysRemaining <= 2 && daysRemaining >= 0) {
      escalateUrgency(item.contractId, daysRemaining);
    }
    
    // If past deadline, auto-mark breached after grace period
    if (daysRemaining < -2) {
      updateContractStatus(item.contractId, "breached", {
        breachedAt: now.toISOString(),
        breachReason: "No verification received within grace period"
      });
    }
  }
  
  // Remove processed items
  const remaining = queue.filter(item => !due.includes(item));
  localStorage.setItem(CHECKIN_QUEUE_KEY, JSON.stringify(remaining));
  
  return processed;
}

// Urgency escalation for approaching deadline
function escalateUrgency(contractId: string, daysRemaining: number): void {
  const contract = getContract(contractId);
  if (!contract) return;
  
  // In production: send SMS/email/push notification
  console.log(`[URGENT] Contract ${contractId}: ${daysRemaining} days remaining`);
  console.log(`Commitment: "${contract.userCommitment}"`);
  console.log(`Consequence of inaction: "${contract.consequenceOfInaction}"`);
  
  // Store escalation in trace
  const trace = getExecutionTrace(contractId);
  if (trace) {
    trace.checkpoints.push({
      scheduledAt: new Date().toISOString(),
      type: "email",
      status: "sent",
      userResponse: "URGENT_ESCALATION"
    });
    saveExecutionTrace(trace);
  }
}

// User reports progress
export function reportProgress(contractId: string, update: {
  status: "in_progress" | "completed" | "blocked";
  description: string;
}): void {
  const contract = getContract(contractId);
  if (!contract || contract.status !== "pending") return;
  
  if (update.status === "completed") {
    triggerVerification(contractId);
  } else if (update.status === "blocked") {
    // Store blocker for learning
    const trace = getExecutionTrace(contractId);
    if (trace) {
      trace.microActions.push({
        action: `BLOCKED: ${update.description}`,
        completedAt: new Date().toISOString(),
        source: "user_report"
      });
      saveExecutionTrace(trace);
    }
  } else {
    // In progress - update progress estimate
    updateProgress(contractId, 50, update.description);
  }
}

// Request deadline extension
export function requestExtension(contractId: string, additionalDays: number, reason: string): boolean {
  const contract = getContract(contractId);
  if (!contract || contract.status !== "pending") return false;
  
  const trace = getExecutionTrace(contractId);
  const extensionCount = trace?.extensionCount || 0;
  
  // Max 2 extensions allowed
  if (extensionCount >= 2) return false;
  
  const newDeadline = new Date(contract.deadline);
  newDeadline.setDate(newDeadline.getDate() + additionalDays);
  
  // Update contract
  updateContractStatus(contractId, "extended", {
    modifiedDeadline: newDeadline.toISOString(),
    extensionReason: reason
  });
  
  // Update trace
  if (trace) {
    trace.extensionGranted = true;
    trace.extensionReason = reason;
    trace.modifiedDeadline = newDeadline.toISOString();
    trace.extensionCount = extensionCount + 1;
    saveExecutionTrace(trace);
  }
  
  // Reschedule checkins
  scheduleCheckin(contractId, 48);
  
  return true;
}

// Trigger verification (manual or auto)
async function triggerVerification(contractId: string): Promise<void> {
  const contract = getContract(contractId);
  if (!contract || contract.status !== "pending") return;
  
  // In production: call API
  await fetch("/api/contracts/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contractId,
      completed: true,
      userNote: "Auto-verified via progress tracking"
    })
  });
  
  // Update trace
  const trace = getExecutionTrace(contractId);
  if (trace) {
    trace.currentProgress = 100;
    saveExecutionTrace(trace);
  }
}