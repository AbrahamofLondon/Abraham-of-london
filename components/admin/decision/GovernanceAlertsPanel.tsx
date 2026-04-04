// components/admin/decision/GovernanceAlertsPanel.tsx
"use client";

import * as React from "react";

type AlertRow = {
  id: string;
  assetId: string;
  assetTitle: string;
  assetKind: string;
  alertType: string;
  severity: string;
  message: string;
  previousValue: number;
  currentValue: number;
  deltaValue: number;
  contextType?: string | null;
  contextValue?: string | null;
  createdAt?: string;
};

function severityTone(severity: string) {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-100 text-red-700";
    case "HIGH":
      return "bg-orange-100 text-orange-700";
    case "MEDIUM":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

export function GovernanceAlertsPanel({
  alerts,
}: {
  alerts: AlertRow[];
}) {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white overflow-hidden">
      <div className="border-b border-neutral-200 px-6 py-4">
        <h2 className="text-[11px] font-mono uppercase tracking-[0.22em] text-neutral-600">
          Governance Alerts
        </h2>
      </div>

      {alerts.length === 0 ? (
        <div className="px-6 py-10 text-sm text-neutral-500">
          No active governance alerts.
        </div>
      ) : (
        <div className="divide-y divide-neutral-100">
          {alerts.map((alert) => (
            <div key={alert.id} className="px-6 py-5">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-3xl">
                  <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-neutral-400">
                    {alert.assetKind} · {alert.alertType}
                    {alert.contextType && alert.contextValue
                      ? ` · ${alert.contextType}=${alert.contextValue}`
                      : ""}
                  </div>
                  <div className="mt-2 text-lg font-medium text-neutral-900">
                    {alert.assetTitle}
                  </div>
                  <div className="mt-2 text-sm text-neutral-600">{alert.message}</div>
                </div>

                <div className="grid min-w-[320px] grid-cols-2 gap-3 xl:grid-cols-4">
                  <div className="rounded-2xl border border-neutral-200 p-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-400">
                      Severity
                    </div>
                    <div
                      className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-mono ${severityTone(
                        alert.severity
                      )}`}
                    >
                      {alert.severity}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 p-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-400">
                      Previous
                    </div>
                    <div className="mt-2 text-sm font-mono text-neutral-800">
                      {alert.previousValue.toFixed(2)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 p-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-400">
                      Current
                    </div>
                    <div className="mt-2 text-sm font-mono text-neutral-800">
                      {alert.currentValue.toFixed(2)}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-200 p-3">
                    <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-neutral-400">
                      Delta
                    </div>
                    <div className="mt-2 text-sm font-mono text-neutral-800">
                      {alert.deltaValue.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}