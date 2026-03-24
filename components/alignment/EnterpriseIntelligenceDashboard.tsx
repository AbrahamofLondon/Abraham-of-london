"use client";

import React from "react";
import PurposeAlignmentRadarChart from "./PurposeAlignmentRadarChart";
import PurposeAlignmentTrendChart from "./PurposeAlignmentTrendChart";
import { StatisticalConfidenceOverlay } from "./StatisticalConfidenceOverlay";
import type { EnterpriseDashboardView } from "@/lib/alignment/enterprise-types";

interface Props {
  view: EnterpriseDashboardView;
}

export default function EnterpriseIntelligenceDashboard({ view }: Props) {
  const { organisationSnapshot, trendSeries, campaign, organisation } = view;

  // We extract the confidence score from the snapshot metadata
  // If not yet persisted, we default to 0 to ensure the UI remains stable
  const confidence = (organisationSnapshot as any)?.confidenceScore ?? 0;

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto py-12 px-6">
      
      {/* 1. INSTITUTIONAL HEADER & CONFIDENCE SIGNAL */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start border-b border-brand-charcoal/30 pb-10">
        <div className="lg:col-span-7 flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="h-1 w-8 bg-brand-gold opacity-60" />
            <span className="font-mono text-[10px] uppercase tracking-[0.5em] text-brand-gold">
              Intelligence Brief
            </span>
          </div>
          <h1 className="font-serif text-5xl text-brand-cream tracking-tighter">
            {organisation.name}
          </h1>
          <p className="font-mono text-xs text-brand-cream-muted uppercase tracking-widest mt-1">
            Campaign: {campaign.title} // Protocol 75 Internal Trace
          </p>
        </div>
        
        <div className="lg:col-span-5 h-full flex flex-col justify-end">
          <StatisticalConfidenceOverlay score={confidence} />
        </div>
      </div>

      {/* 2. FORENSIC VISUALIZATION SUITE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Structural Mapping (Radar) */}
        <div className="lg:col-span-5 h-[460px]">
          <PurposeAlignmentRadarChart 
            title="Structural Fragility Mapping"
            data={organisationSnapshot?.domainScores ?? []}
            fragilitySignal={organisationSnapshot?.fragilitySignal}
            dissonanceArea={organisationSnapshot?.dissonanceArea}
          />
        </div>

        {/* Temporal Trajectory (Trend) */}
        <div className="lg:col-span-7 h-[460px]">
          <PurposeAlignmentTrendChart 
            title="Institutional Alignment Trajectory"
            data={trendSeries}
          />
        </div>

      </div>

      {/* 3. INTERVENTION ARCHITECTURE (The Weakest Links) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
        <div className="lg:col-span-1 flex flex-col justify-center p-6 border-l border-brand-charcoal">
          <h4 className="font-serif text-2xl text-brand-gold opacity-90">Strategic Nodes</h4>
          <p className="font-mono text-[10px] uppercase text-brand-charcoal-light tracking-[0.2em] mt-2">
            Primary Structural Intervention Points
          </p>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {organisationSnapshot?.weakestDomains.map((domain) => (
            <div 
              key={domain} 
              className="city-gate-card p-5 flex items-center justify-between group hover:bg-brand-gold/[0.02] transition-all duration-500"
            >
              <div className="flex flex-col">
                <span className="font-mono text-[9px] text-brand-gold uppercase tracking-widest opacity-70">
                  Critical Variance
                </span>
                <span className="font-serif text-base text-brand-cream capitalize mt-1">
                  {domain.replace(/_/g, " ")}
                </span>
              </div>
              <div className="h-2 w-2 rounded-full bg-brand-gold shadow-[0_0_8px_#b89b6e] animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. DATA METADATA FOOTER */}
      <div className="flex flex-wrap justify-between items-center gap-6 pt-10 border-t border-brand-charcoal/30">
        <div className="flex gap-10">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] uppercase text-brand-charcoal-light">Respondents</span>
            <span className="font-serif text-brand-cream-dim">{organisationSnapshot?.respondentCount} / {organisationSnapshot?.invitedCount}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] uppercase text-brand-charcoal-light">Completion Rate</span>
            <span className="font-serif text-brand-cream-dim">{organisationSnapshot?.completionRate}%</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[9px] uppercase text-brand-charcoal-light">Geometric Dissonance</span>
            <span className="font-serif text-brand-gold">{organisationSnapshot?.dissonanceArea}</span>
          </div>
        </div>

        <div className="font-mono text-[8px] uppercase tracking-[0.4em] text-brand-charcoal-light">
          Abraham of London // Registered Intelligence Protocol 2026
        </div>
      </div>
    </div>
  );
}