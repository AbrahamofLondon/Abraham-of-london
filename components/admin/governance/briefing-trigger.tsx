'use client';

import React, { useState, useTransition } from "react";
import { generateExecutiveBrief } from "@/app/actions/briefing";
import { 
  FileText, 
  Loader2, 
  X, 
  ShieldCheck, 
  ChevronRight,
  Download,
  CheckCircle2,
  Clock,
  Zap,
  AlertCircle
} from "lucide-react";

interface BriefingData {
  organisation: string;
  nodeRef: string;
  timestamp: string;
  summary: string;
  keyFindings: string[];
  recoveryProgress: string;
  recommendations: string[];
  metrics: {
    integrityIndex: number;
    recoveryProgress: number;
    isStable: boolean;
  };
  protocols: {
    active: number;
    liquidated: number;
    total: number;
    expiryWarning: "STABLE" | "WARNING" | "CRITICAL";
    daysRemaining: number;
  };
  executiveSummary: {
    headline: string;
    primaryAction: string;
    recoveryConfidence: "HIGH" | "MEDIUM" | "LOW";
  };
}

export function BriefingTrigger({ campaignId }: { campaignId: string }) {
  const [isPending, startTransition] = useTransition();
  const [showModal, setShowModal] = useState(false);
  const [briefData, setBriefData] = useState<BriefingData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = () => {
    setError(null);
    startTransition(async () => {
      try {
        const result = await generateExecutiveBrief(campaignId);
        if (result.success) {
          setBriefData((result.data as BriefingData | undefined) ?? null);
          setShowModal(true);
        } else {
          setError(result.error || "Briefing compilation failed.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown structural error.");
      }
    });
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case "HIGH": return "text-emerald-600 bg-emerald-50 border-emerald-100";
      case "MEDIUM": return "text-amber-600 bg-amber-50 border-amber-100";
      default: return "text-red-600 bg-red-50 border-red-100";
    }
  };

  const getExpiryColor = (warning: string) => {
    switch (warning) {
      case "CRITICAL": return "text-red-500";
      case "WARNING": return "text-amber-500";
      default: return "text-emerald-500";
    }
  };

  return (
    <>
      <button
        onClick={handleGenerate}
        disabled={isPending}
        className="group relative flex items-center gap-2 px-4 py-2 border border-neutral-200 bg-white hover:border-neutral-800 hover:bg-neutral-50 transition-all duration-300 disabled:opacity-50"
      >
        {isPending ? (
          <Loader2 className="w-3 h-3 animate-spin text-neutral-400" />
        ) : (
          <FileText className="w-3 h-3 text-neutral-400 group-hover:text-neutral-900 transition-colors" />
        )}
        <span className="text-[8px] font-mono uppercase tracking-widest font-medium text-neutral-500 group-hover:text-neutral-900">
          {isPending ? "Compiling..." : "Intelligence Brief"}
        </span>
      </button>

      {/* Error Feedback */}
      {error && (
        <div className="fixed bottom-6 right-6 z-[200] animate-in slide-in-from-bottom-2 fade-in">
          <div className="flex items-center gap-3 bg-white border border-red-100 shadow-xl p-4">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-[10px] font-mono uppercase text-neutral-600 flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-neutral-300 hover:text-neutral-500">
              <X className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Briefing Modal */}
      {showModal && briefData && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-neutral-900/40 backdrop-blur-md animate-in fade-in duration-500">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] relative border border-neutral-200">
            {/* Minimalist Top Bar */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-20 border-b border-neutral-100 p-4 flex justify-between items-center">
               <div className="flex items-center gap-2">
                  <ShieldCheck className="w-3 h-3 text-neutral-800" />
                  <span className="text-[7px] font-mono uppercase tracking-widest text-neutral-400">Restricted Access // Node {briefData.nodeRef}</span>
               </div>
               <button onClick={() => setShowModal(false)} className="p-1 hover:bg-neutral-100 transition-colors">
                 <X className="w-4 h-4 text-neutral-400" />
               </button>
            </div>

            <div className="p-12">
              {/* Header Context */}
              <div className="mb-12 border-b border-neutral-100 pb-8">
                <h2 className="text-3xl font-light tracking-tighter text-neutral-900 mb-2">
                  Executive <span className="italic font-normal">Summary</span>
                </h2>
                <div className="flex justify-between items-end">
                  <p className="text-[10px] text-neutral-400 font-mono uppercase tracking-tighter">
                    {briefData.organisation} // Issued: {new Date(briefData.timestamp).toLocaleDateString()}
                  </p>
                  <div className={`px-2 py-0.5 border text-[7px] font-mono uppercase tracking-widest ${getConfidenceColor(briefData.executiveSummary.recoveryConfidence)}`}>
                    {briefData.executiveSummary.recoveryConfidence} Confidence
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                {/* Abstract */}
                <section>
                  <p className="text-base font-serif italic text-neutral-700 leading-relaxed indent-8">
                    {briefData.summary}
                  </p>
                </section>

                {/* KPI Matrix */}
                <div className="grid grid-cols-2 gap-px bg-neutral-100 border border-neutral-100">
                  <div className="bg-white p-6">
                    <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-400 mb-2">Integrity Index</p>
                    <p className="text-3xl font-light text-neutral-900">{briefData.metrics.integrityIndex}%</p>
                  </div>
                  <div className="bg-white p-6">
                    <p className="text-[7px] font-mono uppercase tracking-widest text-neutral-400 mb-2">Liquidated Protocols</p>
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-light text-neutral-900">{briefData.protocols.liquidated}</span>
                      <span className="text-neutral-300 text-xl font-thin">/</span>
                      <span className="text-neutral-400 text-xl font-light">{briefData.protocols.total}</span>
                    </div>
                  </div>
                </div>

                {/* Intelligence Findings */}
                <section>
                  <h4 className="text-[8px] font-mono uppercase tracking-widest text-neutral-400 mb-5 border-b border-neutral-50 pb-2">Technical Observations</h4>
                  <div className="space-y-4">
                    {briefData.keyFindings.map((finding, i) => (
                      <div key={i} className="flex gap-4 items-start group">
                        <span className="text-[9px] font-mono text-neutral-300 mt-0.5">0{i + 1}</span>
                        <p className="text-[11px] text-neutral-600 leading-normal group-hover:text-neutral-900 transition-colors">
                          {finding}
                        </p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Expiry Window Notice */}
                <div className="bg-neutral-50 border border-neutral-100 p-4 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Clock className={`w-4 h-4 ${getExpiryColor(briefData.protocols.expiryWarning)}`} />
                    <span className="text-[9px] font-mono uppercase tracking-wider text-neutral-600">Governance Liquidation Window</span>
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${getExpiryColor(briefData.protocols.expiryWarning)}`}>
                    {briefData.protocols.daysRemaining > 0 ? `${briefData.protocols.daysRemaining}D REMAINING` : "TERMINATED"}
                  </span>
                </div>

                {/* Recommendations */}
                <section className="bg-neutral-900 p-8 text-white">
                  <h4 className="text-[8px] font-mono uppercase tracking-widest text-neutral-500 mb-6">Immediate Directives</h4>
                  <ul className="space-y-4">
                    {briefData.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Zap className="w-3 h-3 mt-0.5 text-amber-400 shrink-0" />
                        <span className="text-[10px] font-light leading-relaxed text-neutral-300 uppercase tracking-tight">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>

              {/* Footer / Auth String */}
              <div className="mt-16 pt-8 border-t border-neutral-100 flex justify-between items-end">
                <div className="space-y-1">
                  <div className="text-[6px] font-mono text-neutral-400 uppercase tracking-[0.2em]">Sovereign Alignment Protocol v2.0</div>
                  <div className="text-[6px] font-mono text-neutral-300 uppercase">Hash: {btoa(briefData.nodeRef).slice(0, 16).toUpperCase()}</div>
                </div>
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-[8px] font-mono uppercase tracking-widest text-neutral-600 transition-all"
                >
                  <Download className="w-3 h-3" /> 
                  <span>Finalize & Export</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}