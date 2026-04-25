// components/alignment/PatternBreakerContract.tsx

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Lock, AlertTriangle, CheckCircle, TrendingUp } from "lucide-react";
import type { PatternBreakerContract as PatternBreakerContractType, PeerComparison } from "@/lib/alignment/contract-types";
import { saveContract, getPeerComparison, updateContractStatus } from "@/lib/alignment/contract-engine";
import { getOrCreateSubjectId } from "@/lib/diagnostics/subject-id";
import { track } from "@/lib/analytics/track";

const GOLD = "#C9A96E";

interface PatternBreakerContractProps {
  pattern: {
    primaryPattern: string;
    patternTitle: string;
    urgentStatement: string | null;
    firstAction: string;
    weakestDomain: string;
    sharpestSignal?: { statement: string; resonance: number; certainty: number } | null;
  };
  resultPercent: number;
  coherenceBand: string;
  onComplete: () => void;
  onSkip: () => void;
}

export function PatternBreakerContract({ pattern, resultPercent, coherenceBand, onComplete, onSkip }: PatternBreakerContractProps) {
  const [step, setStep] = useState<"intro" | "commitment" | "demographic" | "signed">("intro");
  const [userCommitment, setUserCommitment] = useState("");
  const [deadline, setDeadline] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split("T")[0]!;
  });
  const [consequenceOfInaction, setConsequenceOfInaction] = useState("");
  const [demographic, setDemographic] = useState({
    role: "",
    industry: "",
    teamSize: "",
    gender: null as string | null,
    yearsInRole: "",
    ageRange: "",
  });
  const [isSigning, setIsSigning] = useState(false);
  const [peerData, setPeerData] = useState<PeerComparison | null>(null);
  
  const subjectId = getOrCreateSubjectId();
  
  // Load peer comparison when demographic is complete
  const handleDemographicChange = (field: string, value: string) => {
    const updated = { ...demographic, [field]: value };
    setDemographic(updated);
    
    // If we have role and weakestDomain, fetch peer data
    if (updated.role && pattern.weakestDomain) {
      const peer = getPeerComparison(updated.role, pattern.weakestDomain);
      setPeerData(peer);
    }
  };
  
  const handleSignContract = async () => {
    setIsSigning(true);
    
    const contract: PatternBreakerContractType = {
      id: generateContractId(),
      subjectId,
      weakestDomain: pattern.weakestDomain,
      patternTitle: pattern.patternTitle,
      primaryPattern: pattern.primaryPattern,
      sharpestSignal: pattern.sharpestSignal ?? null,
      userCommitment,
      deadline: new Date(deadline).toISOString(),
      consequenceOfInaction,
      demographic: {
        role: demographic.role,
        industry: demographic.industry,
        teamSize: demographic.teamSize || undefined,
        gender: demographic.gender || undefined,
        yearsInRole: demographic.yearsInRole || undefined,
        ageRange: demographic.ageRange || undefined,
      },
      verificationToken: generateVerificationToken(),
      status: "pending",
      signedAt: new Date().toISOString(),
      recurrenceCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    saveContract(contract);
    
    track("pattern_breaker_contract_signed", {
      weakest_domain: pattern.weakestDomain,
      role: demographic.role,
      industry: demographic.industry,
      deadline_days: Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    });
    
    setStep("signed");
    setIsSigning(false);
    
    // Call onComplete after animation
    setTimeout(() => onComplete(), 2500);
  };
  
  const generateContractId = () => {
    return `pbc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  };

  const generateVerificationToken = () => {
    return `vt_${Date.now()}_${Math.random().toString(36).substring(2, 12)}`;
  };
  
  const canSign = userCommitment.length > 20 && consequenceOfInaction.length > 10 && demographic.role && demographic.industry;
  
  return (
    <div style={{ 
      border: `2px solid ${GOLD}`, 
      backgroundColor: "rgb(6 6 9)", 
      marginTop: "2rem",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Gold accent bar */}
      <div style={{ height: "3px", backgroundColor: GOLD, width: "100%" }} />
      
      <div style={{ padding: "2rem" }}>
        <AnimatePresence mode="wait">
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
                <Shield style={{ color: GOLD, width: "24px", height: "24px" }} />
                <span style={{ 
                  fontFamily: "'JetBrains Mono', monospace", 
                  fontSize: "8px", 
                  letterSpacing: "0.3em", 
                  textTransform: "uppercase",
                  color: GOLD,
                }}>
                  The Pattern-Breaker Contract
                </span>
              </div>
              
              <h3 style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontWeight: 300,
                fontSize: "1.5rem",
                lineHeight: 1.2,
                color: "rgba(255,255,255,0.9)",
                marginBottom: "1rem",
              }}>
                A pattern identified is not a pattern broken.
              </h3>
              
              <p style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: "1rem",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.6)",
                marginBottom: "1.5rem",
              }}>
                The system has identified that your primary weakness is in <strong style={{ color: GOLD }}>{pattern.weakestDomain}</strong>.
                {pattern.urgentStatement && (
                  <span> Your sharpest signal: <em style={{ color: "rgba(252,165,165,0.8)" }}>"{pattern.urgentStatement.split('—')[0]}"</em></span>
                )}
              </p>
              
              <div style={{ 
                backgroundColor: "rgba(255,255,255,0.03)", 
                borderLeft: `3px solid ${GOLD}`,
                padding: "1rem 1.25rem",
                marginBottom: "1.5rem",
              }}>
                <p style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "0.9rem", lineHeight: 1.6, color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>
                  {pattern.primaryPattern}
                </p>
              </div>
              
              <div style={{ display: "flex", gap: "1rem", justifyContent: "flex-end" }}>
                <button
                  onClick={onSkip}
                  style={{
                    padding: "10px 20px",
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Skip — I'll act alone
                </button>
                <button
                  onClick={() => setStep("commitment")}
                  style={{
                    padding: "10px 24px",
                    background: `${GOLD}20`,
                    border: `1px solid ${GOLD}60`,
                    color: GOLD,
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Make it binding →
                </button>
              </div>
            </motion.div>
          )}
          
          {step === "commitment" && (
            <motion.div
              key="commitment"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div style={{ marginBottom: "1.5rem" }}>
                <span style={{ 
                  fontFamily: "'JetBrains Mono', monospace", 
                  fontSize: "7px", 
                  letterSpacing: "0.3em", 
                  textTransform: "uppercase",
                  color: GOLD,
                }}>
                  Step 1 of 2 — Your Binding Commitment
                </span>
              </div>
              
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "7.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem" }}>
                  Your first action (from the assessment)
                </label>
                <div style={{ 
                  padding: "0.75rem 1rem", 
                  backgroundColor: "rgba(255,255,255,0.03)", 
                  border: "1px solid rgba(255,255,255,0.08)",
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "0.9rem",
                  color: "rgba(255,255,255,0.6)",
                  marginBottom: "1rem",
                }}>
                  {pattern.firstAction}
                </div>
                
                <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "7.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem" }}>
                  Rewrite it in YOUR words (be specific)
                </label>
                <textarea
                  value={userCommitment}
                  onChange={(e) => setUserCommitment(e.target.value)}
                  rows={3}
                  placeholder="I will [specific action] by [specific date]. I will [measure of completion]."
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    border: `1px solid ${userCommitment.length > 0 ? `${GOLD}40` : "rgba(255,255,255,0.1)"}`,
                    padding: "0.75rem 1rem",
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "0.95rem",
                    color: "rgba(255,255,255,0.8)",
                    resize: "vertical",
                    marginBottom: "1rem",
                  }}
                />
                
                <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "7.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem" }}>
                  Deadline (7 days recommended)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                    padding: "0.75rem 1rem",
                    color: "rgba(255,255,255,0.8)",
                    marginBottom: "1rem",
                  }}
                />
                
                <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "7.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem" }}>
                  If you fail to act, what is the real cost?
                </label>
                <textarea
                  value={consequenceOfInaction}
                  onChange={(e) => setConsequenceOfInaction(e.target.value)}
                  rows={2}
                  placeholder="This decision will cost me [£X] / [trust] / [opportunity]. The pattern will repeat within [timeframe]."
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    border: `1px solid ${consequenceOfInaction.length > 0 ? `${GOLD}40` : "rgba(255,255,255,0.1)"}`,
                    padding: "0.75rem 1rem",
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "0.95rem",
                    color: "rgba(255,255,255,0.8)",
                    resize: "vertical",
                  }}
                />
              </div>
              
              <div style={{ display: "flex", gap: "1rem", justifyContent: "space-between" }}>
                <button
                  onClick={() => setStep("intro")}
                  style={{
                    padding: "10px 20px",
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
                <button
                  onClick={() => setStep("demographic")}
                  disabled={!canSign}
                  style={{
                    padding: "10px 24px",
                    background: canSign ? `${GOLD}20` : "rgba(255,255,255,0.05)",
                    border: `1px solid ${canSign ? `${GOLD}60` : "rgba(255,255,255,0.1)"}`,
                    color: canSign ? GOLD : "rgba(255,255,255,0.3)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    cursor: canSign ? "pointer" : "not-allowed",
                  }}
                >
                  Continue →
                </button>
              </div>
            </motion.div>
          )}
          
          {step === "demographic" && (
            <motion.div
              key="demographic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div style={{ marginBottom: "1.5rem" }}>
                <span style={{ 
                  fontFamily: "'JetBrains Mono', monospace", 
                  fontSize: "7px", 
                  letterSpacing: "0.3em", 
                  textTransform: "uppercase",
                  color: GOLD,
                }}>
                  Step 2 of 2 — Context (Anonymized)
                </span>
                <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.35)", marginTop: "0.5rem" }}>
                  These fields help the system detect pattern trends across roles and industries. They are not stored with your identity.
                </p>
              </div>
              
              <div style={{ display: "grid", gap: "1rem", marginBottom: "1.5rem" }}>
                <div>
                  <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: "0.3rem" }}>
                    Role *
                  </label>
                  <select
                    value={demographic.role}
                    onChange={(e) => handleDemographicChange("role", e.target.value)}
                    style={{ width: "100%", backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.1)", padding: "0.6rem", color: "rgba(255,255,255,0.8)" }}
                  >
                    <option value="">Select your role</option>
                    <option value="CEO">CEO / Founder</option>
                    <option value="CPO">CPO / Product Lead</option>
                    <option value="CTO">CTO / Engineering Lead</option>
                    <option value="CMO">CMO / Marketing Lead</option>
                    <option value="Director">Director / Department Head</option>
                    <option value="Manager">Manager</option>
                    <option value="Individual Contributor">Individual Contributor</option>
                    <option value="Consultant">Consultant / Advisor</option>
                  </select>
                </div>
                
                <div>
                  <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: "0.3rem" }}>
                    Industry *
                  </label>
                  <select
                    value={demographic.industry}
                    onChange={(e) => handleDemographicChange("industry", e.target.value)}
                    style={{ width: "100%", backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.1)", padding: "0.6rem", color: "rgba(255,255,255,0.8)" }}
                  >
                    <option value="">Select industry</option>
                    <option value="SaaS">SaaS / Software</option>
                    <option value="Fintech">Fintech / Financial Services</option>
                    <option value="Healthcare">Healthcare / Biotech</option>
                    <option value="Agency">Agency / Professional Services</option>
                    <option value="Manufacturing">Manufacturing / Industrial</option>
                    <option value="Retail">Retail / E-commerce</option>
                    <option value="Nonprofit">Nonprofit / Public Sector</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: "0.3rem" }}>
                      Team Size
                    </label>
                    <select
                      value={demographic.teamSize}
                      onChange={(e) => handleDemographicChange("teamSize", e.target.value)}
                      style={{ width: "100%", backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.1)", padding: "0.6rem", color: "rgba(255,255,255,0.8)" }}
                    >
                      <option value="">Select</option>
                      <option value="1-10">1-10</option>
                      <option value="11-50">11-50</option>
                      <option value="51-200">51-200</option>
                      <option value="200+">200+</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: "0.3rem" }}>
                      Years in Role
                    </label>
                    <select
                      value={demographic.yearsInRole}
                      onChange={(e) => handleDemographicChange("yearsInRole", e.target.value)}
                      style={{ width: "100%", backgroundColor: "transparent", border: "1px solid rgba(255,255,255,0.1)", padding: "0.6rem", color: "rgba(255,255,255,0.8)" }}
                    >
                      <option value="">Select</option>
                      <option value="<1">&lt;1 year</option>
                      <option value="1-3">1-3 years</option>
                      <option value="3-7">3-7 years</option>
                      <option value="7+">7+ years</option>
                    </select>
                  </div>
                </div>
              </div>
              
              {/* Peer comparison insight - the unfair advantage */}
              {peerData && peerData.breachRate > 0.3 && (
                <div style={{ 
                  backgroundColor: "rgba(251,146,60,0.1)", 
                  borderLeft: `3px solid ${peerData.breachRate > 0.5 ? "rgba(252,165,165,0.8)" : GOLD}`,
                  padding: "0.75rem 1rem",
                  marginBottom: "1.5rem",
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "flex-start",
                }}>
                  <TrendingUp style={{ width: "16px", height: "16px", color: GOLD, flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", margin: 0 }}>
                      <strong>Peer intelligence:</strong> {peerData.breachRate * 100}% of {peerData.role}s with your pattern ({pattern.weakestDomain}) breach their first contract.
                      {peerData.averageCompletionDays > 0 && ` Those who complete take an average of ${Math.round(peerData.averageCompletionDays)} days.`}
                    </p>
                    <p style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)", marginTop: "0.3rem" }}>
                      Based on {peerData.totalContracts} anonymized contracts.
                    </p>
                  </div>
                </div>
              )}
              
              <div style={{ display: "flex", gap: "1rem", justifyContent: "space-between" }}>
                <button
                  onClick={() => setStep("commitment")}
                  style={{
                    padding: "10px 20px",
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.4)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
                <button
                  onClick={handleSignContract}
                  disabled={!demographic.role || !demographic.industry || isSigning}
                  style={{
                    padding: "10px 24px",
                    background: (demographic.role && demographic.industry) ? `${GOLD}20` : "rgba(255,255,255,0.05)",
                    border: `1px solid ${(demographic.role && demographic.industry) ? `${GOLD}60` : "rgba(255,255,255,0.1)"}`,
                    color: (demographic.role && demographic.industry) ? GOLD : "rgba(255,255,255,0.3)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "7.5px",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    cursor: (demographic.role && demographic.industry && !isSigning) ? "pointer" : "not-allowed",
                  }}
                >
                  {isSigning ? "Signing..." : "Sign Binding Contract →"}
                </button>
              </div>
            </motion.div>
          )}
          
          {step === "signed" && (
            <motion.div
              key="signed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{ textAlign: "center", padding: "2rem 0" }}
            >
              <CheckCircle style={{ color: GOLD, width: "48px", height: "48px", margin: "0 auto 1rem" }} />
              <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.5rem", color: "rgba(255,255,255,0.9)", marginBottom: "0.5rem" }}>
                Contract Signed
              </h3>
              <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "1rem" }}>
                The system will verify your action by {new Date(deadline).toLocaleDateString()}.
              </p>
              <div style={{ 
                backgroundColor: "rgba(255,255,255,0.03)", 
                padding: "0.75rem", 
                borderRadius: "4px",
                maxWidth: "300px",
                margin: "0 auto",
              }}>
                <Lock style={{ width: "12px", height: "12px", display: "inline", marginRight: "0.5rem", color: GOLD }} />
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>
                  This contract is stored and will inform future assessments
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}