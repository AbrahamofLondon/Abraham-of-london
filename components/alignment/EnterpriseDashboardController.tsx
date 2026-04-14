"use client";

import React, { useEffect, useState, useRef } from "react";
import EnterpriseIntelligenceDashboard from "./EnterpriseIntelligenceDashboard";
import DissonanceInterpretationGuide from "./DissonanceInterpretationGuide";
import InterventionBlueprint from "./InterventionBlueprint";
import { type EnterpriseDashboardView } from "@/lib/alignment/enterprise-types";

interface Props {
  initialView: EnterpriseDashboardView;
  campaignId: string;
}

export default function EnterpriseDashboardController({ initialView, campaignId }: Props) {
  const [view, setView] = useState<EnterpriseDashboardView>(initialView);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);
  
  const footerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function syncOGRIntelligence() {
      try {
        setIsSyncing(true);
        // Step A: Aggregate forensic data
        const res = await fetch(`/api/alignment/enterprise/campaigns/${campaignId}/aggregate`, {
          method: "POST",
        });

        if (res.ok) {
          // Step B: Update OGR Dashboard View
          const updated = await fetch(`/api/alignment/enterprise/campaigns/${campaignId}/dashboard`);
          if (updated.ok) {
            const newView = await updated.json();
            setView(newView);

            // Step C: Trigger Executive Notification (The OGR-75 Pulse)
            await fetch(`/api/alignment/enterprise/campaigns/${campaignId}/notify`, { 
              method: 'POST' 
            });
          }
        }
      } catch (err) {
        console.error("[OGR_SYNC_ERROR]:", err);
      } finally {
        setIsSyncing(false);
      }
    }
    syncOGRIntelligence();
  }, [campaignId]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setHasReachedEnd(true);
      },
      { threshold: 0.1 }
    );
    if (footerRef.current) observer.observe(footerRef.current);
    return () => observer.disconnect();
  }, []);

  const handlePrint = () => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setShowPrintView(false);
    }, 200);
  };

  return (
    <div className="relative min-h-screen bg-[#050505] selection:bg-brand-gold/30 scroll-smooth">
      
      {/* OGR HUD */}
      <div className="fixed top-6 right-8 z-[100] flex items-center gap-4 no-print">
        {isSyncing && (
          <div className="flex items-center gap-2 px-3 py-1 bg-brand-charcoal/40 backdrop-blur-md border border-brand-gold/20 rounded-full">
            <span className="font-mono text-[7px] uppercase tracking-[0.4em] text-brand-gold animate-pulse">
              OGR Trace Active
            </span>
            <div className="h-1 w-1 rounded-full bg-brand-gold shadow-[0_0_8px_#b89b6e]" />
          </div>
        )}
        
        <button 
          onClick={handlePrint}
          className="city-gate-card px-5 py-2.5 bg-brand-charcoal/20 backdrop-blur-sm hover:border-brand-gold/60 transition-all group overflow-hidden"
        >
          <span className="relative z-10 font-mono text-[9px] uppercase tracking-[0.3em] text-brand-cream group-hover:text-brand-gold transition-colors">
            Generate OGR Brief
          </span>
        </button>
      </div>

      {!showPrintView && (
        <main className="no-print opacity-0 animate-in fade-in duration-1000 fill-mode-forwards">
          <EnterpriseIntelligenceDashboard view={view} />
          <div ref={footerRef} className="h-24 w-full" />
          <div className={`transition-all duration-1000 transform ${hasReachedEnd ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <InterventionBlueprint 
              dissonanceArea={view.organisationSnapshot?.dissonanceArea ?? 0}
              weakestDomains={view.organisationSnapshot?.weakestDomains ?? []}
            />
          </div>
        </main>
      )}

      {showPrintView && (
        <div className="print:block bg-white min-h-screen">
          <DissonanceInterpretationGuide />
          <div className="mt-12">
            <InterventionBlueprint 
              dissonanceArea={view.organisationSnapshot?.dissonanceArea ?? 0}
              weakestDomains={view.organisationSnapshot?.weakestDomains ?? []}
            />
          </div>
        </div>
      )}

      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <style {...({ jsx: true, global: true } as any)}>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; margin: 0 !important; }
          @page { size: A4; margin: 0; }
        }
      `}</style>
    </div>
  );
}