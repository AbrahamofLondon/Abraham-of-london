// components/dashboard/DashboardDrilldownPanel.tsx
// Reusable drill-down panel for the Decision Intelligence Console.
// Fetches from individual dashboard endpoints on demand — never on initial load.
// Opens as an overlay panel. Supports loading, empty, error, and degraded states.

"use client";

import React, { useCallback, useEffect, useState } from "react";
import type { DrilldownKey } from "@/lib/dashboard/drilldowns";
import {
  DASHBOARD_DRILLDOWNS,
  DRILLDOWN_ACCESS,
  DRILLDOWN_LABELS,
} from "@/lib/dashboard/drilldowns";

// ── Types ──────────────────────────────────────────────────────────────────────

interface DashboardDrilldownPanelProps {
  /** Which drill-down to fetch and display */
  section: DrilldownKey;
  /** Called when the panel is dismissed */
  onClose: () => void;
  /** If true, operator-only drill-downs are blocked */
  publicOnly?: boolean;
}

type PanelState = "loading" | "loaded" | "empty" | "error" | "blocked";

// ── Component ───────────────────────────────────────────────────────────────────

export const DashboardDrilldownPanel: React.FC<DashboardDrilldownPanelProps> = ({
  section,
  onClose,
  publicOnly = false,
}) => {
  const [data, setData] = useState<unknown | null>(null);
  const [state, setState] = useState<PanelState>("loading");
  const [httpStatus, setHttpStatus] = useState<number | null>(null);

  const endpoint = DASHBOARD_DRILLDOWNS[section];
  const access = DRILLDOWN_ACCESS[section];
  const label = DRILLDOWN_LABELS[section];

  // Block operator-only drill-downs if publicOnly is set
  useEffect(() => {
    if (publicOnly && access === "operator_only") {
      setState("blocked");
      return;
    }

    let cancelled = false;

    const fetchData = async () => {
      setState("loading");
      try {
        const res = await fetch(endpoint);
        setHttpStatus(res.status);

        if (!res.ok) {
          if (!cancelled) setState("error");
          return;
        }

        const json = await res.json();

        if (cancelled) return;

        // Check for empty data — if it's an array, check length; if object, check for zero values
        if (Array.isArray(json) && json.length === 0) {
          setState("empty");
        } else if (typeof json === "object" && json !== null) {
          const values = Object.values(json as Record<string, unknown>);
          const allZeroOrEmpty = values.every(
            (v) => v === 0 || v === "0" || v === "" || v === null || v === undefined || (Array.isArray(v) && v.length === 0)
          );
          if (allZeroOrEmpty) {
            setState("empty");
          } else {
            setData(json);
            setState("loaded");
          }
        } else {
          setData(json);
          setState("loaded");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    };

    fetchData();
    return () => { cancelled = true; };
  }, [endpoint, section, access, publicOnly]);

  // ── Render by state ──────────────────────────────────────────────────────────

  const renderBody = () => {
    switch (state) {
      case "loading":
        return (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="w-5 h-5 border border-neutral-700 border-t-[#C5A059] rounded-full animate-spin mx-auto" />
              <p className="mt-3 text-xs font-mono text-neutral-500">Loading detail…</p>
            </div>
          </div>
        );

      case "blocked":
        return (
          <div className="flex items-center justify-center py-16">
            <div className="text-center max-w-sm">
              <div className="text-amber-400 text-lg mb-2">🔒</div>
              <p className="text-sm font-mono text-neutral-400">Operator access required</p>
              <p className="text-xs font-mono text-neutral-600 mt-2">
                This drill-down contains operational data not available in public view.
              </p>
            </div>
          </div>
        );

      case "empty":
        return (
          <div className="flex items-center justify-center py-16 border border-dashed border-neutral-800 rounded mx-6">
            <div className="text-center max-w-sm">
              <p className="text-xs font-mono text-neutral-400">No data available</p>
              <p className="text-[11px] font-mono text-neutral-600 mt-2">
                The {label.toLowerCase()} has no records yet.
              </p>
            </div>
          </div>
        );

      case "error":
        return (
          <div className="flex items-center justify-center py-16">
            <div className="text-center max-w-sm">
              <div className="text-red-400 text-lg mb-2">⚠</div>
              <p className="text-sm font-mono text-neutral-400">
                Failed to load{httpStatus ? ` (HTTP ${httpStatus})` : ""}
              </p>
              <p className="text-xs font-mono text-neutral-600 mt-2">
                Endpoint: <code className="text-neutral-500">{endpoint}</code>
              </p>
            </div>
          </div>
        );

      case "loaded":
        return (
          <div className="px-6 pb-6">
            <pre className="text-xs font-mono text-neutral-300 bg-neutral-950 rounded p-4 overflow-x-auto max-h-[50vh] overflow-y-auto whitespace-pre-wrap break-all">
              {JSON.stringify(data, null, 2)}
            </pre>
            <p className="text-[10px] font-mono text-neutral-600 mt-3">
              Source: <code className="text-neutral-500">{endpoint}</code>
            </p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 pb-8 px-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-[#0F0F0F] border border-neutral-800 rounded-lg w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <div>
            <p className="text-[9px] font-mono tracking-[0.2em] uppercase text-[#C5A059]">
              DRILL-DOWN
            </p>
            <h2 className="text-base font-serif font-medium text-neutral-200 mt-0.5">
              {label}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-300 transition text-lg leading-none px-2"
            aria-label="Close drill-down panel"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        {renderBody()}
      </div>
    </div>
  );
};

export default DashboardDrilldownPanel;
