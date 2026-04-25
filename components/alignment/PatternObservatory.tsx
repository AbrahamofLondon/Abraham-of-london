// components/alignment/PatternObservatory.tsx
// Premium feature - cross-user anonymized intelligence

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Users, Briefcase, AlertTriangle, Crown, Lock } from "lucide-react";
import { GlobalTrends } from "@/lib/alignment/enhanced-types";
import { getContracts } from "@/lib/alignment/contract-engine";

const GOLD = "#C9A96E";

interface PatternObservatoryProps {
  organizationId?: string;
  isPremium: boolean;
}

export function PatternObservatory({ organizationId, isPremium }: PatternObservatoryProps) {
  const [trends, setTrends] = useState<GlobalTrends | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!isPremium) return;
    
    // Aggregate all contracts across all users (anonymized)
    const allContracts = getContracts();
    
    // Role breakdown
    const roleStats: Record<string, { breaches: number; completed: number; total: number }> = {};
    const industryStats: Record<string, { breaches: number; completed: number; total: number }> = {};
    const domainStats: Record<string, { breaches: number; total: number; recurrence: number }> = {};
    
    for (const contract of allContracts) {
      const role = contract.demographic?.role;
      const industry = contract.demographic?.industry;
      const domain = contract.weakestDomain;
      
      if (role) {
        if (!roleStats[role]) roleStats[role] = { breaches: 0, completed: 0, total: 0 };
        roleStats[role].total++;
        if (contract.status === "breached") roleStats[role].breaches++;
        if (contract.status === "completed") roleStats[role].completed++;
      }
      
      if (industry) {
        if (!industryStats[industry]) industryStats[industry] = { breaches: 0, completed: 0, total: 0 };
        industryStats[industry].total++;
        if (contract.status === "breached") industryStats[industry].breaches++;
        if (contract.status === "completed") industryStats[industry].completed++;
      }
      
      if (domain) {
        if (!domainStats[domain]) domainStats[domain] = { breaches: 0, total: 0, recurrence: 0 };
        domainStats[domain].total++;
        if (contract.status === "breached") domainStats[domain].breaches++;
      }
    }
    
    const roleBreakdown = Object.entries(roleStats)
      .filter(([_, stats]) => stats.total >= 5) // Minimum sample size
      .map(([name, stats]) => ({
        name,
        breachRate: stats.breaches / stats.total,
        completionRate: stats.completed / stats.total,
        count: stats.total
      }))
      .sort((a, b) => b.breachRate - a.breachRate);
    
    const industryBreakdown = Object.entries(industryStats)
      .filter(([_, stats]) => stats.total >= 5)
      .map(([name, stats]) => ({
        name,
        breachRate: stats.breaches / stats.total,
        completionRate: stats.completed / stats.total,
        count: stats.total
      }))
      .sort((a, b) => b.breachRate - a.breachRate);
    
    const domainDifficulty = Object.entries(domainStats)
      .map(([name, stats]) => ({
        name: name.replace("_", " "),
        difficulty: stats.breaches / stats.total,
        recurrenceRate: stats.recurrence / stats.total
      }))
      .sort((a, b) => b.difficulty - a.difficulty);
    
    // Generate actionable insight
    const highestRiskRole = roleBreakdown[0];
    const highestRiskDomain = domainDifficulty[0];
    const lowestRiskRole = roleBreakdown[roleBreakdown.length - 1];
    
    let actionableInsight = "";
    if (highestRiskRole && highestRiskDomain) {
      actionableInsight = `${highestRiskRole.name}s show a ${Math.round(highestRiskRole.breachRate * 100)}% breach rate on '${highestRiskDomain.name}' patterns — ${Math.round((highestRiskRole.breachRate - (lowestRiskRole?.breachRate || 0)) * 100)}% higher than ${lowestRiskRole?.name}s. `;
      actionableInsight += `Recommended: ${highestRiskRole.name}s should run the Constitutional Diagnostic before committing to strategic decisions.`;
    }
    
    setTrends({
      totalContracts: allContracts.length,
      totalUsers: new Set(allContracts.map(c => c.subjectId)).size,
      roleBreakdown,
      industryBreakdown,
      domainDifficulty,
      orgCompletionRate: 0,
      orgVsBenchmark: 0,
      orgPercentile: 0,
      actionableInsight,
      topPerformingRoles: roleBreakdown.slice(-2).map(r => r.name),
      highestRiskDomains: domainDifficulty.slice(0, 2).map(d => d.name)
    });
    
    setLoading(false);
  }, [isPremium, organizationId]);
  
  if (!isPremium) {
    return (
      <div style={{ 
        border: `1px solid ${GOLD}30`, 
        backgroundColor: `${GOLD}05`,
        padding: "3rem 2rem",
        textAlign: "center",
        borderRadius: "4px"
      }}>
        <Lock style={{ color: GOLD, width: "32px", height: "32px", margin: "0 auto 1rem" }} />
        <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: "1.25rem", color: "rgba(255,255,255,0.8)", marginBottom: "0.5rem" }}>
          Pattern Observatory
        </h3>
        <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)", marginBottom: "1rem" }}>
          Unlock anonymized intelligence from {getContracts().length} decision traces
        </p>
        <button style={{
          background: `${GOLD}15`,
          border: `1px solid ${GOLD}40`,
          padding: "8px 20px",
          color: GOLD,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "7px",
          letterSpacing: "0.2em",
          cursor: "pointer"
        }}>
          Upgrade to Premium
        </button>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <div style={{ color: "rgba(255,255,255,0.3)" }}>Loading intelligence...</div>
      </div>
    );
  }
  
  if (!trends || trends.totalContracts < 10) {
    return (
      <div style={{ border: `1px solid ${GOLD}30`, padding: "2rem", textAlign: "center" }}>
        <Users style={{ color: GOLD, width: "32px", height: "32px", margin: "0 auto 1rem" }} />
        <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
          Pattern Observatory needs more data. {10 - (trends?.totalContracts ?? 0)} more contracts needed for statistical significance.
        </p>
      </div>
    );
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ padding: "1rem 0" }}
    >
      <div style={{ marginBottom: "2rem" }}>
        <div className="flex items-center gap-2 mb-2">
          <Crown style={{ color: GOLD, width: "14px", height: "14px" }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.3em", color: GOLD }}>
            PREMIUM INTELLIGENCE
          </span>
        </div>
        <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontWeight: 300, fontSize: "1.6rem", color: "rgba(255,255,255,0.9)" }}>
          Pattern Observatory
        </h2>
        <p style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>
          Anonymized intelligence from {trends.totalContracts} decision traces · {trends.totalUsers} decision-makers
        </p>
      </div>
      
      {/* Role-based breach rates */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="flex items-center gap-2 mb-3">
          <Briefcase style={{ width: "12px", height: "12px", color: GOLD }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.25em", color: "rgba(255,255,255,0.5)" }}>
            BREACH RATES BY ROLE
          </span>
        </div>
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {trends.roleBreakdown.slice(0, 5).map(role => (
            <div key={role.name} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span style={{ width: "100px", fontSize: "0.75rem", color: "rgba(255,255,255,0.6)" }}>{role.name}</span>
              <div style={{ flex: 1, height: "6px", backgroundColor: "rgba(255,255,255,0.1)" }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${role.breachRate * 100}%` }}
                  transition={{ duration: 0.8 }}
                  style={{ 
                    height: "100%", 
                    backgroundColor: role.breachRate > 0.5 ? "rgba(252,165,165,0.8)" : 
                                    role.breachRate > 0.3 ? GOLD : "rgba(110,231,183,0.6)"
                  }}
                />
              </div>
              <span style={{ width: "50px", fontSize: "0.7rem", color: "rgba(255,255,255,0.4)" }}>
                {Math.round(role.breachRate * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Domain difficulty ranking */}
      <div style={{ marginBottom: "2rem" }}>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle style={{ width: "12px", height: "12px", color: GOLD }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.25em", color: "rgba(255,255,255,0.5)" }}>
            HARDEST DOMAINS TO RESOLVE
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
          {trends.domainDifficulty.map(domain => (
            <div key={domain.name} style={{ 
              textAlign: "center", 
              padding: "1rem",
              backgroundColor: "rgba(255,255,255,0.02)",
              border: `1px solid ${domain.difficulty > 0.5 ? "rgba(252,165,165,0.2)" : `${GOLD}15`}`
            }}>
              <div style={{ fontSize: "1.5rem", fontFamily: "'Cormorant Garamond', Georgia, serif", color: domain.difficulty > 0.5 ? "#fca5a5" : GOLD }}>
                {Math.round(domain.difficulty * 100)}%
              </div>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.5)", marginTop: "0.25rem" }}>{domain.name}</div>
              <div style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.25)", marginTop: "0.5rem" }}>
                breach rate
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Actionable insight */}
      <div style={{ 
        backgroundColor: `${GOLD}08`, 
        borderLeft: `3px solid ${GOLD}`,
        padding: "1.25rem",
        marginBottom: "2rem"
      }}>
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp style={{ width: "12px", height: "12px", color: GOLD }} />
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.25em", color: GOLD }}>
            STRATEGIC INTELLIGENCE
          </span>
        </div>
        <p style={{ fontSize: "0.85rem", lineHeight: 1.6, color: "rgba(255,255,255,0.7)" }}>
          {trends.actionableInsight}
        </p>
        <p style={{ marginTop: "0.5rem", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>
          Based on {trends.totalContracts} anonymized contracts
        </p>
      </div>
      
      {/* Top performing roles */}
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
        <div style={{ flex: 1, padding: "1rem", backgroundColor: "rgba(255,255,255,0.02)" }}>
          <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}>BEST PERFORMING</span>
          <div style={{ fontSize: "0.9rem", marginTop: "0.3rem", color: GOLD }}>
            {trends.topPerformingRoles.join(" · ")}
          </div>
        </div>
        <div style={{ flex: 1, padding: "1rem", backgroundColor: "rgba(255,255,255,0.02)" }}>
          <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.4)" }}>HIGHEST RISK DOMAINS</span>
          <div style={{ fontSize: "0.9rem", marginTop: "0.3rem", color: "#fca5a5" }}>
            {trends.highestRiskDomains.join(" · ")}
          </div>
        </div>
      </div>
    </motion.div>
  );
}