// components/dashboard/PDFDataDashboard.tsx
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

type RegistryItemLite = {
  id: string;
  title: string;
  category?: string;
};

interface PDFDataDashboardProps {
  view?: "dashboard" | "analytics" | "live";
  theme?: "light" | "dark";
  onPDFSelect?: (pdfId: string) => void;

  enableAnalytics?: boolean;
  enableSharing?: boolean;
  enableAnnotations?: boolean;

  /** If true (default), this component will NOT mount protected dashboards unless authenticated */
  requiresAuth?: boolean;

  /** Used for the login redirect */
  loginPath?: string;

  /** Cosmetic and future-proofing */
  autoRefresh?: boolean;
  initialCategory?: string;
  maxItems?: number;
}

function isLocalPath(v: unknown): v is string {
  return typeof v === "string" && v.startsWith("/") && !/^(https?:)?\/\//i.test(v) && !/^javascript:/i.test(v);
}

export const PDFDataDashboard: React.FC<PDFDataDashboardProps> = ({
  view = "dashboard",
  theme = "light",
  onPDFSelect,

  enableAnalytics = true,
  enableSharing = false,
  enableAnnotations = false,

  requiresAuth = true,
  loginPath = "/admin/login",

  autoRefresh = true,
  initialCategory = "all",
  maxItems = 50,
}) => {
  const { status } = useSession();

  // Optional: lightweight registry index to validate selections.
  // IMPORTANT: This fetch is also gated behind auth to stop 401 spam.
  const [indexLoading, setIndexLoading] = useState(false);
  const [index, setIndex] = useState<Record<string, RegistryItemLite>>({});
  const [indexError, setIndexError] = useState<string | null>(null);

  const isAuthenticated = status === "authenticated";
  const shouldGate = requiresAuth === true;

  const surface = useMemo(
    () => (theme === "dark" ? "bg-black text-white" : "bg-white text-zinc-900"),
    [theme]
  );

  // Fetch a small index only when authenticated (prevents “select invalid id” issues)
  useEffect(() => {
    if (!shouldGate) return;
    if (!isAuthenticated) return;
    if (view === "analytics") return; // analytics view doesn’t need registry selection validation
    if (!autoRefresh && Object.keys(index).length > 0) return;

    const ctrl = new AbortController();
    setIndexLoading(true);
    setIndexError(null);

    (async () => {
      try {
        const res = await fetch(`/api/pdfs/list?page=1&limit=${Math.min(100, Math.max(1, maxItems))}`, {
          method: "GET",
          signal: ctrl.signal,
          headers: { "Accept": "application/json" },
        });

        if (!res.ok) {
          const j = await res.json().catch(() => null);
          throw new Error(j?.error || `Registry request failed (${res.status})`);
        }

        const json = await res.json();
        const items = Array.isArray(json?.pdfs) ? json.pdfs : [];

        const next: Record<string, RegistryItemLite> = {};
        for (const it of items) {
          const id = String(it?.id || "");
          if (!id) continue;
          next[id] = {
            id,
            title: String(it?.title || id),
            category: it?.category ? String(it.category) : undefined,
          };
        }

        setIndex(next);
      } catch (e: any) {
        if (e?.name === "AbortError") return;
        setIndexError(e?.message || "Unable to load registry index.");
      } finally {
        setIndexLoading(false);
      }
    })();

    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldGate, isAuthenticated, view, autoRefresh, maxItems]);

  const handlePDFSelect = useCallback(
    (pdfId: string) => {
      // If we have an index, validate selection (soft validation only).
      if (Object.keys(index).length > 0 && !index[pdfId]) {
        console.warn(`[PDFDataDashboard] Selected PDF not found in index: ${pdfId}`);
        // still allow the selection callback (don’t block user)
      }

      onPDFSelect?.(pdfId);

      if (enableAnalytics && typeof window !== "undefined") {
        // swap this for your real analytics pipeline
        console.log("[Analytics] PDF selected:", { pdfId });
      }
    },
    [index, onPDFSelect, enableAnalytics]
  );

  const dashboardProps = useMemo(() => {
    const baseProps = {
      enableAnalytics,
      enableSharing,
      enableAnnotations,
      defaultCategory: initialCategory,
      onPDFOpen: handlePDFSelect,
    };

    switch (view) {
      case "live":
        return { ...baseProps, initialViewMode: "detail" as const };
      case "analytics":
        return { ...baseProps, initialViewMode: "grid" as const, enableSharing: true };
      default:
        return { ...baseProps, initialViewMode: "list" as const };
    }
  }, [view, enableAnalytics, enableSharing, enableAnnotations, initialCategory, handlePDFSelect]);

  const errorFallback = useMemo(() => {
    return (
      <div className={`min-h-[400px] flex items-center justify-center p-8 ${surface}`}>
        <div className="text-center max-w-md">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold mb-2">Dashboard Error</h3>
          <p className="mb-4 opacity-80">Unable to load the dashboard. Refresh and try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg font-medium bg-amber-500 text-black hover:bg-amber-400 transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }, [surface]);

  const handleBoundaryError = useCallback(
    (error: Error, errorInfo: ErrorInfo) => {
      console.error("[PDFDataDashboard] error:", error, errorInfo);
      if (enableAnalytics && typeof window !== "undefined") {
        console.error("[Analytics] dashboard_error", {
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
        });
      }
    },
    [enableAnalytics]
  );

  // ✅ AUTH GATE (this is what stops the /api/pdfs/list 401 spam)
  if (shouldGate && status !== "authenticated") {
    const returnTo = "/admin/pdf-dashboard"; // safe default
    const joinHref = isLocalPath(returnTo)
      ? `${loginPath}?returnTo=${encodeURIComponent(returnTo)}`
      : loginPath;

    if (status === "loading") {
      return (
        <LoadingState
          message="Verifying session…"
          theme={theme}
          subMessage="Establishing secure context"
          showProgress
        />
      );
    }

    return (
      <div className={`min-h-[420px] flex items-center justify-center p-8 rounded-2xl border border-white/10 ${surface}`}>
        <div className="max-w-md text-center">
          <div className="text-4xl mb-4">🔒</div>
          <h3 className="text-2xl font-semibold mb-3">Institutional Access Required</h3>
          <p className="opacity-80 mb-6">
            This dashboard is protected. Authenticate to access the registry and PDF intelligence pipeline.
          </p>
          <Link
            href={joinHref}
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-amber-500 text-black font-bold uppercase tracking-widest text-[10px] hover:bg-amber-400 transition-colors"
          >
            Enter Directorate Terminal
          </Link>

          {indexError ? (
            <p className="mt-4 text-xs text-rose-400">
              Registry status: {indexError}
            </p>
          ) : null}
        </div>
      </div>
    );
  }

  // Optional: show a loading state while the index is building (only relevant to dashboard/live)
  if (view !== "analytics" && indexLoading && Object.keys(index).length === 0) {
    return (
      <LoadingState
        message="Loading registry…"
        theme={theme}
        subMessage="Preparing restricted manuscripts"
        showProgress
      />
    );
  }

  return (
    <ErrorBoundary fallback={errorFallback} onError={handleBoundaryError}>
      <AnalyticsProvider enabled={enableAnalytics}>
        <PDFDashboardProvider>
          {view === "live" ? (
            <LiveDataDashboard theme={theme} onPDFSelect={handlePDFSelect} />
          ) : view === "analytics" ? (
            <AnalyticsDashboard
              theme={theme}
              timeRange="7d"
              metrics={["generations", "views", "downloads", "errors"]}
              showComparisons
              exportEnabled
              onExport={(data) => {
                if (enableAnalytics) console.log("[Analytics] export", data);
              }}
            />
          ) : (
            <PDFDashboard
              {...dashboardProps}
              onPDFGenerated={(pdfId: string) => {
                if (enableAnalytics) console.log("[Analytics] pdf_generated", { pdfId });
              }}
              onError={(error: any) => {
                console.error("[PDFDashboard] error:", error);
              }}
            />
          )}
        </PDFDashboardProvider>
      </AnalyticsProvider>
    </ErrorBoundary>
  );
};

PDFDataDashboard.displayName = "PDFDataDashboard";
export default PDFDataDashboard;