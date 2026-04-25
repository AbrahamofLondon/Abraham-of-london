// components/alignment/DemographicContextCapture.tsx

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Users, TrendingUp, ArrowRight, Shield } from "lucide-react";

const GOLD = "#C9A96E";

interface DemographicContextCaptureProps {
  onComplete: (data: {
    role: string;
    industry: string;
    teamSize: string;
    yearsInRole: string;
  }) => void;
}

export function DemographicContextCapture({ onComplete }: DemographicContextCaptureProps) {
  const [step, setStep] = useState<"intro" | "details">("intro");
  const [data, setData] = useState({
    role: "",
    industry: "",
    teamSize: "",
    yearsInRole: "",
  });

  const canProceed = data.role && data.industry;

  const roles = [
    { value: "CEO", label: "CEO / Founder" },
    { value: "CPO", label: "CPO / Product Lead" },
    { value: "CTO", label: "CTO / Engineering Lead" },
    { value: "CMO", label: "CMO / Marketing Lead" },
    { value: "Director", label: "Director / Department Head" },
    { value: "Manager", label: "Manager" },
    { value: "Individual Contributor", label: "Individual Contributor" },
    { value: "Consultant", label: "Consultant / Advisor" },
  ];

  const industries = [
    { value: "SaaS", label: "SaaS / Software" },
    { value: "Fintech", label: "Fintech / Financial Services" },
    { value: "Healthcare", label: "Healthcare / Biotech" },
    { value: "Agency", label: "Agency / Professional Services" },
    { value: "Manufacturing", label: "Manufacturing / Industrial" },
    { value: "Retail", label: "Retail / E-commerce" },
    { value: "Nonprofit", label: "Nonprofit / Public Sector" },
    { value: "Other", label: "Other" },
  ];

  const teamSizes = [
    { value: "1-10", label: "1-10" },
    { value: "11-50", label: "11-50" },
    { value: "51-200", label: "51-200" },
    { value: "200+", label: "200+" },
  ];

  const yearsInRoles = [
    { value: "<1", label: "< 1 year" },
    { value: "1-3", label: "1-3 years" },
    { value: "3-7", label: "3-7 years" },
    { value: "7+", label: "7+ years" },
  ];

  return (
    <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem 1rem" }}>
      {step === "intro" ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ textAlign: "center" }}
        >
          <div style={{ 
            width: "48px", 
            height: "48px", 
            borderRadius: "50%", 
            backgroundColor: `${GOLD}15`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 1.5rem",
          }}>
            <TrendingUp style={{ color: GOLD, width: "24px", height: "24px" }} />
          </div>
          
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 300,
            fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
            lineHeight: 1.1,
            color: "rgba(255,255,255,0.9)",
            marginBottom: "1rem",
          }}>
            Before we begin
          </h1>
          
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: "1rem",
            lineHeight: 1.6,
            color: "rgba(255,255,255,0.5)",
            marginBottom: "1.5rem",
          }}>
            This assessment becomes more powerful when it knows your context.
          </p>
          
          <div style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
            padding: "1.25rem",
            marginBottom: "1.5rem",
            textAlign: "left",
          }}>
            <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginBottom: "0.5rem" }}>
              <Shield style={{ width: "12px", height: "12px", display: "inline", marginRight: "6px", color: GOLD }} />
              Why this matters:
            </p>
            <ul style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.35)", paddingLeft: "1.25rem", margin: 0 }}>
              <li>Patterns differ by role and industry</li>
              <li>Your results can be compared anonymously to peers</li>
              <li>The system learns trends that give you an edge</li>
              <li>Your identity is never stored with this data</li>
            </ul>
          </div>
          
          <button
            onClick={() => setStep("details")}
            style={{
              background: `${GOLD}15`,
              border: `1px solid ${GOLD}40`,
              padding: "12px 28px",
              color: GOLD,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "8px",
              letterSpacing: "0.25em",
              cursor: "pointer",
              width: "100%",
            }}
          >
            Continue to assessment →
          </button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div style={{ marginBottom: "2rem" }}>
            <span style={{ 
              fontFamily: "'JetBrains Mono', monospace", 
              fontSize: "7px", 
              letterSpacing: "0.3em", 
              color: GOLD,
            }}>
              CONTEXT
            </span>
            <h2 style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontWeight: 300,
              fontSize: "1.6rem",
              marginTop: "0.5rem",
              color: "rgba(255,255,255,0.85)",
            }}>
              A few details
            </h2>
          </div>
          
          <div style={{ display: "grid", gap: "1.25rem", marginBottom: "2rem" }}>
            <div>
              <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.5)", marginBottom: "0.3rem" }}>
                Role *
              </label>
              <select
                value={data.role}
                onChange={(e) => setData({ ...data, role: e.target.value })}
                style={{
                  width: "100%",
                  backgroundColor: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "0.75rem",
                  color: "rgba(255,255,255,0.8)",
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "0.95rem",
                }}
              >
                <option value="">Select your role</option>
                {roles.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.5)", marginBottom: "0.3rem" }}>
                Industry *
              </label>
              <select
                value={data.industry}
                onChange={(e) => setData({ ...data, industry: e.target.value })}
                style={{
                  width: "100%",
                  backgroundColor: "transparent",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "0.75rem",
                  color: "rgba(255,255,255,0.8)",
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: "0.95rem",
                }}
              >
                <option value="">Select industry</option>
                {industries.map(i => (
                  <option key={i.value} value={i.value}>{i.label}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.5)", marginBottom: "0.3rem" }}>
                  Team Size
                </label>
                <select
                  value={data.teamSize}
                  onChange={(e) => setData({ ...data, teamSize: e.target.value })}
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                    padding: "0.75rem",
                    color: "rgba(255,255,255,0.8)",
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "0.95rem",
                  }}
                >
                  <option value="">Select</option>
                  {teamSizes.map(t => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label style={{ display: "block", fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.2em", color: "rgba(255,255,255,0.5)", marginBottom: "0.3rem" }}>
                  Years in Role
                </label>
                <select
                  value={data.yearsInRole}
                  onChange={(e) => setData({ ...data, yearsInRole: e.target.value })}
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    border: "1px solid rgba(255,255,255,0.1)",
                    padding: "0.75rem",
                    color: "rgba(255,255,255,0.8)",
                    fontFamily: "'Cormorant Garamond', Georgia, serif",
                    fontSize: "0.95rem",
                  }}
                >
                  <option value="">Select</option>
                  {yearsInRoles.map(y => (
                    <option key={y.value} value={y.value}>{y.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => onComplete(data)}
            disabled={!canProceed}
            style={{
              background: canProceed ? `${GOLD}15` : "rgba(255,255,255,0.03)",
              border: `1px solid ${canProceed ? `${GOLD}40` : "rgba(255,255,255,0.08)"}`,
              padding: "12px 28px",
              color: canProceed ? GOLD : "rgba(255,255,255,0.2)",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "8px",
              letterSpacing: "0.25em",
              cursor: canProceed ? "pointer" : "not-allowed",
              width: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.5rem",
            }}
          >
            Start assessment <ArrowRight style={{ width: "11px", height: "11px" }} />
          </button>
          
          <p style={{
            marginTop: "1rem",
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "6px",
            letterSpacing: "0.15em",
            color: "rgba(255,255,255,0.2)",
            textAlign: "center",
          }}>
            These fields are anonymized and used only for pattern detection
          </p>
        </motion.div>
      )}
    </div>
  );
}