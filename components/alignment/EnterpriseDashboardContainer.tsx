"use client";

import React, { useEffect, useState } from "react";
import EnterpriseIntelligenceDashboard from "./EnterpriseIntelligenceDashboard";
import { type EnterpriseDashboardView } from "@/lib/alignment/enterprise-types";

interface Props {
  initialView: EnterpriseDashboardView;
  campaignId: string;
}

export default function EnterpriseDashboardContainer({ initialView, campaignId }: Props) {
  const [view, setView] = useState<EnterpriseDashboardView>(initialView);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    async function syncIntelligence() {
      // If we already have a snapshot, we could skip, 
      // but for "Live" forensic data, we trigger a refresh on load.
      try {
        setIsSyncing(true);
        const response = await fetch(`/api/alignment/enterprise/campaigns/${campaignId}/aggregate`, {
          method: "POST",
        });

        if (response.ok) {
          // After aggregation is successful, we re-fetch the dashboard view
          const updatedData = await fetch(`/api/alignment/enterprise/campaigns/${campaignId}/dashboard`);
          if (updatedData.ok) {
            const newView = await updatedData.json();
            setView(newView);
          }
        }
      } catch (error) {
        console.error("[DASHBOARD_SYNC_ERROR]:", error);
      } finally {
        setIsSyncing(false);
      }
    }

    syncIntelligence();
  }, [campaignId]);

  return (
    <div className="relative min-h-screen bg-[#050505]">
      {/* Sync Status Indicator: Subtle forensic pulse in the top corner */}
      {isSyncing && (
        <div className="absolute right-8 top-8 z-50 flex items-center gap-2">
          <span className="font-mono text-[8px] uppercase tracking-widest text-brand-gold animate-pulse">
            Syncing Institutional Trace...
          </span>
          <div className="h-1 w-1 rounded-full bg-brand-gold shadow-[0_0_5px_#b89b6e]" />
        </div>
      )}

      <EnterpriseIntelligenceDashboard view={view} />
    </div>
  );
}