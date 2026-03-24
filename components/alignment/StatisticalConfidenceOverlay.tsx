"use client";

import React from "react";

interface StatisticalConfidenceProps {
  score: number; // 0 to 100
}

export function StatisticalConfidenceOverlay({ score }: StatisticalConfidenceProps) {
  // Logic to determine the "Institutional Trust Level"
  const getStatus = (s: number) => {
    if (s >= 85) {
      return {
        label: "High Precision",
        description: "Statistically significant; high reliability for intervention.",
        color: "#b89b6e", // Brand Gold
        glow: "shadow-[0_0_15px_rgba(184,155,110,0.4)]",
      };
    }
    if (s >= 60) {
      return {
        label: "Indicative Signal",
        description: "Directionally accurate; consider as a baseline for further inquiry.",
        color: "#d6b26a", // Muted Gold
        glow: "shadow-none",
      };
    }
    return {
      label: "Low Sample Reliability",
      description: "Insufficient data volume for definitive structural conclusions.",
      color: "#f59e0b", // Amber/Warning
      glow: "shadow-none",
    };
  };

  const status = getStatus(score);

  return (
    <div className="city-gate-card group relative flex flex-col gap-3 overflow-hidden p-4 transition-all hover:border-brand-gold/30">
      {/* Background Decorative Element */}
      <div className="absolute -right-4 -top-4 font-mono text-[40px] font-bold opacity-[0.03] select-none">
        SIG-75
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-brand-cream-muted">
            Statistical Confidence
          </span>
          <h4 
            className="font-serif text-lg tracking-tight transition-colors duration-500"
            style={{ color: status.color }}
          >
            {status.label}
          </h4>
        </div>
        <div className="text-right">
          <span className="font-mono text-xl font-light text-brand-cream">
            {score}<span className="text-[10px] text-brand-charcoal-light ml-0.5">%</span>
          </span>
        </div>
      </div>

      {/* The Confidence Rail */}
      <div className="relative h-1.5 w-full rounded-full bg-brand-charcoal/50">
        <div 
          className={`absolute left-0 top-0 h-full rounded-full transition-all duration-1000 ease-out ${status.glow}`}
          style={{ 
            width: `${score}%`, 
            backgroundColor: status.color 
          }}
        />
      </div>

      <p className="font-mono text-[9px] leading-relaxed text-brand-charcoal-light uppercase tracking-tighter">
        {status.description}
      </p>

      {/* Forensic Border Effect */}
      <div 
        className="absolute bottom-0 left-0 h-[1px] w-full opacity-30 transition-all duration-700 group-hover:opacity-100"
        style={{ 
          background: `linear-gradient(90deg, transparent, ${status.color}, transparent)` 
        }} 
      />
    </div>
  );
}