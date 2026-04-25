// components/alignment/PastContractInterrupt.tsx

import React, { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { getMostRecentContract, updateContractStatus } from "@/lib/alignment/contract-engine";
import { PatternBreakerContract } from "@/lib/alignment/contract-types";
import { getOrCreateSubjectId } from "@/lib/diagnostics/subject-id";

const GOLD = "#C9A96E";

interface PastContractInterruptProps {
  onAcknowledge: () => void;
  onProceed: () => void;
}

export function PastContractInterrupt({ onAcknowledge, onProceed }: PastContractInterruptProps) {
  const [contract, setContract] = useState<PatternBreakerContract | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [acknowledged, setAcknowledged] = useState(false);
  
  useEffect(() => {
    const subjectId = getOrCreateSubjectId();
    const recent = getMostRecentContract(subjectId);
    setContract(recent || null);
    setIsLoading(false);
  }, []);
  
  if (isLoading) return null;
  if (!contract) return null;
  if (contract.status === "completed") {
    return (
      <div style={{ 
        border: "1px solid rgba(52,211,153,0.3)", 
        backgroundColor: "rgba(52,211,153,0.05)",
        padding: "1.25rem",
        marginBottom: "1.5rem",
        display: "flex",
        gap: "1rem",
        alignItems: "flex-start",
      }}>
        <CheckCircle style={{ color: "#34d399", width: "20px", height: "20px", flexShrink: 0 }} />
        <div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.2em", color: "#34d399", marginBottom: "0.3rem" }}>
            PREVIOUS CONTRACT COMPLETED
          </p>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.7)", marginBottom: "0.5rem" }}>
            You completed: <em>"{contract.userCommitment.slice(0, 100)}..."</em>
          </p>
          <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>
            The system has updated its confidence in your execution capability.
          </p>
          <button
            onClick={onProceed}
            style={{ marginTop: "0.75rem", background: "none", border: "none", color: GOLD, cursor: "pointer", fontSize: "0.7rem" }}
          >
            Continue assessment →
          </button>
        </div>
      </div>
    );
  }
  
  if (contract.status === "breached") {
    return (
      <div style={{ 
        border: "2px solid rgba(252,165,165,0.6)", 
        backgroundColor: "rgba(252,165,165,0.08)",
        padding: "1.5rem",
        marginBottom: "1.5rem",
      }}>
        <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
          <AlertTriangle style={{ color: "#fca5a5", width: "24px", height: "24px", flexShrink: 0 }} />
          <div>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.2em", color: "#fca5a5", marginBottom: "0.5rem" }}>
              PATTERN CONTRACT — BREACHED
            </p>
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.8)", marginBottom: "0.5rem" }}>
              On {new Date(contract.signedAt).toLocaleDateString()}, you committed to:
            </p>
            <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", fontStyle: "italic", marginBottom: "0.75rem", paddingLeft: "0.75rem", borderLeft: `2px solid ${GOLD}` }}>
              "{contract.userCommitment}"
            </p>
            <p style={{ fontSize: "0.85rem", color: "#fca5a5", marginBottom: "0.5rem" }}>
              The system recorded this as BREACHED. No verification was received by the deadline.
            </p>
            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: "1rem" }}>
              The consequence you identified: <em>"{contract.consequenceOfInaction.slice(0, 120)}..."</em>
            </p>
            
            {!acknowledged ? (
              <button
                onClick={() => {
                  setAcknowledged(true);
                  onAcknowledge();
                }}
                style={{
                  background: "rgba(252,165,165,0.15)",
                  border: "1px solid rgba(252,165,165,0.4)",
                  padding: "8px 16px",
                  color: "#fca5a5",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "7px",
                  letterSpacing: "0.2em",
                  cursor: "pointer",
                }}
              >
                Acknowledge breach & proceed
              </button>
            ) : (
              <button
                onClick={onProceed}
                style={{
                  background: "none",
                  border: `1px solid ${GOLD}40`,
                  padding: "8px 16px",
                  color: GOLD,
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "7px",
                  letterSpacing: "0.2em",
                  cursor: "pointer",
                }}
              >
                Continue assessment →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  if (contract.status === "pending") {
    const daysRemaining = Math.ceil((new Date(contract.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const isOverdue = daysRemaining < 0;
    
    return (
      <div style={{ 
        border: `1px solid ${isOverdue ? "rgba(252,165,165,0.4)" : `${GOLD}30`}`, 
        backgroundColor: `rgba(255,255,255,0.02)`,
        padding: "1.25rem",
        marginBottom: "1.5rem",
        display: "flex",
        gap: "1rem",
        alignItems: "flex-start",
      }}>
        <Clock style={{ color: isOverdue ? "#fca5a5" : GOLD, width: "20px", height: "20px", flexShrink: 0 }} />
        <div>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.2em", color: isOverdue ? "#fca5a5" : GOLD, marginBottom: "0.3rem" }}>
            ACTIVE CONTRACT — {isOverdue ? "OVERDUE" : `${daysRemaining} DAYS REMAINING`}
          </p>
          <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", marginBottom: "0.3rem" }}>
            You committed to: <em>"{contract.userCommitment.slice(0, 80)}..."</em>
          </p>
          <p style={{ fontSize: "0.7rem", color: isOverdue ? "#fca5a5" : "rgba(255,255,255,0.4)" }}>
            {isOverdue 
              ? "This contract is past due. The system will mark it breached if not verified within 48 hours."
              : `Verification required by ${new Date(contract.deadline).toLocaleDateString()}.`}
          </p>
          <button
            onClick={onProceed}
            style={{ marginTop: "0.75rem", background: "none", border: "none", color: GOLD, cursor: "pointer", fontSize: "0.7rem" }}
          >
            Acknowledge & continue →
          </button>
        </div>
      </div>
    );
  }
  
  return null;
}