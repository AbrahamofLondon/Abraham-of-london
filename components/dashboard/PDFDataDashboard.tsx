"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { ErrorInfo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

import { PDFDashboardProvider } from "@/contexts/PDFDashboardContext";
import { AnalyticsProvider } from "@/contexts/AnalyticsContext";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { LoadingState } from "@/components/ui/LoadingState";

import LiveDataDashboard from "./LiveDataDashboard";
import PDFDashboard from "@/components/PDFDashboard";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";
import { getAllPDFItems } from "@/lib/pdf/registry";
import type { PDFItem } from "@/lib/pdf/registry"; // Added Type Import
import { safeSlice } from "@/lib/utils/safe";

interface PDFDataDashboardProps {
  view?: "dashboard" | "analytics" | "live";
  theme?: "light" | "dark";
  onPDFSelect?: (pdfId: string) => void;
  enableAnalytics?: boolean;
  requiresAuth?: boolean;
  loginPath?: string;
  maxItems?: number;
}

export const PDFDataDashboard: React.FC<PDFDataDashboardProps> = ({
  view = "dashboard",
  onPDFSelect,
  enableAnalytics = true,
  requiresAuth = true,
  loginPath = "/admin/login",
  maxItems = 75,
}) => {
  const { status } = useSession();
  const [indexLoading, setIndexLoading] = useState(true);
  const [rawItems, setRawItems] = useState<PDFItem[]>([]); // ✅ Store full items for the dashboard
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  useEffect(() => {
    try {
      const items = getAllPDFItems({ includeMissing: true });
      const limitedItems = safeSlice(items, 0, maxItems);
      setRawItems(limitedItems);
    } finally {
      setIndexLoading(false);
    }
  }, [maxItems]);

  const handleGenerateRequest = useCallback(async (pdfId: string) => {
    if (!pdfId) return;
    setIsGenerating(pdfId);
    try {
      const res = await fetch("/api/pdfs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pdfId }),
      });
      const data = await res.json();
      if (data.path) window.open(data.path, "_blank");
    } finally {
      setIsGenerating(null);
    }
  }, []);

  if (requiresAuth && status !== "authenticated") {
    if (status === "loading") return <LoadingState message="Awaiting Verification..." />;
    return (
      <div className="relative min-h-[600px] flex items-center justify-center overflow-hidden bg-black text-white">
        <div className="aol-grid absolute inset-0" />
        <div className="aol-vignette absolute inset-0" />
        <div className="relative z-10 text-center animate-aolFadeUp">
          <span className="aol-eyebrow text-amber-500/80 mb-6 block">Restricted Access</span>
          <h2 className="aol-editorial text-4xl mb-8">The Private Archive</h2>
          <Link href={loginPath} className="aol-micro border border-white/20 px-8 py-4 hover:bg-white hover:text-black transition-institutional backdrop-blur-sm">
            Identify Yourself
          </Link>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={<div className="p-20 aol-editorial text-center">System Interrupted</div>}>
      <AnalyticsProvider enabled={enableAnalytics}>
        <PDFDashboardProvider>
          <div className="relative min-h-screen bg-[#050505] flex flex-col">
            <div className="aol-grain absolute inset-0 opacity-20 pointer-events-none" />
            
            <header className="relative z-10 px-8 py-12 flex justify-between items-end border-b border-white/[0.03]">
              <div className="animate-aolFadeUp">
                <span className="aol-micro text-amber-500/60 block mb-2">Portfolio of 75 Intelligence Briefs</span>
                <h1 className="aol-editorial text-5xl tracking-tight">The Institutional <span className="text-white/40">Vault</span></h1>
              </div>
              
              <div className="flex flex-col items-end gap-4 animate-aolFadeUp stagger-1">
                <div className="aol-micro text-white/30">Catalogue Index</div>
                <select 
                  className="bg-transparent aol-micro border-none text-amber-500/80 outline-none cursor-pointer hover:text-white transition-premium"
                  onChange={(e) => onPDFSelect?.(e.target.value)}
                >
                  <option value="">Browse Library</option>
                  {rawItems.map((item) => (
                    <option key={item.id} value={item.id}>{item.title}</option>
                  ))}
                </select>
              </div>
            </header>

            <main className="relative z-10 flex-1 p-8">
              {view === "live" ? (
                <LiveDataDashboard onPDFSelect={onPDFSelect} />
              ) : (
                <PDFDashboard
                  items={rawItems} // ✅ FIXED: Passing the required items prop
                  initialViewMode="list"
                  onPDFOpen={onPDFSelect}
                  onGenerate={handleGenerateRequest}
                  isGeneratingId={isGenerating}
                  renderGenerateAction={(id) => (
                    <button
                      onClick={() => handleGenerateRequest(id)}
                      disabled={!!isGenerating}
                      className="aol-micro group flex items-center gap-4 py-2"
                    >
                      <span className="h-[1px] w-6 bg-white/20 group-hover:w-12 group-hover:bg-amber-500 transition-all duration-700" />
                      <span className={isGenerating === id ? "animate-pulse text-amber-500" : "text-white/40 group-hover:text-white"}>
                        {isGenerating === id ? "Synthesizing" : "Generate Print"}
                      </span>
                    </button>
                  )}
                />
              )}
            </main>

            <footer className="relative z-10 p-8 border-t border-white/[0.03] flex justify-between items-center opacity-40">
              <span className="aol-micro">Abraham of London &copy; 2026</span>
              <div className="aol-hairline w-1/3" />
              <span className="aol-micro uppercase">London — Dubai — Geneva</span>
            </footer >
          </div>
        </PDFDashboardProvider>
      </AnalyticsProvider>
    </ErrorBoundary>
  );
};

export default PDFDataDashboard;