import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Head from "next/head";
import { requireAdminPage } from "@/lib/access/server";
import { prisma } from "@/lib/prisma.server";
import AdminLayout from "@/components/admin/AdminLayout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

type CalibrationRow = {
  modelKey: string;
  modelVersion: string;
  status: string;
  outcomeCount: number;
  accuracyScore: number | null;
  biasScore: number | null;
  lastCalibratedAt: string | null;
  latestAdjustment: Record<string, unknown> | null;
};

type Props = { rows: CalibrationRow[] };

const CalibrationPage: NextPage<Props> = ({ rows }) => {
  return (
    <AdminLayout title="Calibration">
      <Head>
        <title>Calibration | Admin</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>

      <div className="space-y-6">
        <div style={{ border: `1px solid ${GOLD}20`, backgroundColor: `${GOLD}04`, padding: "1rem" }}>
          <span style={{ ...mono, fontSize: "7px", letterSpacing: "0.32em", textTransform: "uppercase", color: `${GOLD}70` }}>
            Calibration state
          </span>
          <p style={{ fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif", fontSize: "0.85rem", color: "rgba(255,255,255,0.40)", marginTop: "0.25rem" }}>
            Prediction → Outcome → Calibration loop. Models adjust based on observed reality.
          </p>
        </div>

        {rows.length === 0 && (
          <div style={{ border: "1px solid rgba(255,255,255,0.06)", padding: "2rem", textAlign: "center" }}>
            <p style={{ color: "rgba(255,255,255,0.30)" }}>No calibration states yet. Outcomes will populate this view.</p>
          </div>
        )}

        {rows.map((row) => (
          <div key={`${row.modelKey}_${row.modelVersion}`} style={{ border: "1px solid rgba(255,255,255,0.08)", backgroundColor: "rgba(255,255,255,0.015)", padding: "1rem" }}>
            <div className="flex items-center justify-between">
              <div>
                <span style={{ ...mono, fontSize: "8px", color: "rgba(255,255,255,0.55)", fontWeight: 700 }}>{row.modelKey}</span>
                <span style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.25)", marginLeft: "0.5rem" }}>v{row.modelVersion}</span>
              </div>
              <span style={{
                ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase",
                color: row.status === "ACTIVE" ? "rgba(110,231,183,0.60)" : row.status === "SHADOW" ? `${GOLD}BB` : "rgba(255,255,255,0.25)",
              }}>
                {row.status}
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Outcomes", value: String(row.outcomeCount), color: row.outcomeCount >= 5 ? "rgba(110,231,183,0.55)" : "rgba(255,255,255,0.35)" },
                { label: "Accuracy", value: row.accuracyScore != null ? `${Math.round(row.accuracyScore * 100)}%` : "—" },
                { label: "Bias", value: row.biasScore != null ? (row.biasScore > 0.02 ? "Overstates" : row.biasScore < -0.02 ? "Understates" : "Calibrated") : "—", color: row.biasScore != null && Math.abs(row.biasScore) > 0.05 ? "rgba(252,165,165,0.55)" : undefined },
                { label: "Last calibrated", value: row.lastCalibratedAt ? new Date(row.lastCalibratedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "Never" },
              ].map((s) => (
                <div key={s.label}>
                  <div style={{ ...mono, fontSize: "6px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)" }}>{s.label}</div>
                  <div style={{ ...mono, fontSize: "10px", color: s.color ?? "rgba(255,255,255,0.45)", marginTop: "2px" }}>{s.value}</div>
                </div>
              ))}
            </div>

            {row.latestAdjustment && (
              <div style={{ marginTop: "0.5rem", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "0.5rem" }}>
                <span style={{ ...mono, fontSize: "6px", color: "rgba(255,255,255,0.18)" }}>Latest adjustment</span>
                <pre style={{ ...mono, fontSize: "7px", color: "rgba(255,255,255,0.30)", marginTop: "0.2rem", whiteSpace: "pre-wrap" }}>
                  {JSON.stringify(row.latestAdjustment, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const auth = await requireAdminPage(ctx);
  if (!auth.authorized) return auth.redirect as any;

  const states = await prisma.calibrationState.findMany({
    orderBy: { updatedAt: "desc" },
  });

  // Get latest adjustment for each state
  const rows: CalibrationRow[] = await Promise.all(
    states.map(async (s) => {
      const latestEvent = await prisma.calibrationEvent.findFirst({
        where: { modelKey: s.modelKey, modelVersion: s.modelVersion, applied: true },
        orderBy: { createdAt: "desc" },
      });

      return {
        modelKey: s.modelKey,
        modelVersion: s.modelVersion,
        status: s.status,
        outcomeCount: s.outcomeCount,
        accuracyScore: s.accuracyScore,
        biasScore: s.biasScore,
        lastCalibratedAt: s.lastCalibratedAt?.toISOString() ?? null,
        latestAdjustment: latestEvent?.adjustmentProposal as Record<string, unknown> | null,
      };
    }),
  );

  return { props: { rows } };
};

export default CalibrationPage;
