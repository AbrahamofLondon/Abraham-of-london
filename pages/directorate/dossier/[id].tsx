/* eslint-disable @typescript-eslint/no-explicit-any */
/* pages/directorate/dossier/[id].tsx
   DIRECTORATE DOSSIER — pages-router safe, admin-gated, Prisma-safe
*/

import * as React from "react";
import type { GetServerSideProps, NextPage } from "next";
import Link from "next/link";

import Layout from "@/components/Layout";
import { withUnifiedAuth } from "@/lib/auth/withUnifiedAuth";
import {
  ArrowLeft,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  Cpu,
  FileText,
  ChevronRight,
} from "lucide-react";

type DecisionRow = {
  label: string;
  reasoning: string;
  weight: number;
};

type IntakePayload = {
  decisions?: DecisionRow[];
  riskProfile?: string;
  [key: string]: any;
};

interface DossierProps {
  intake: {
    id: string;
    fullName: string;
    organisation: string;
    score: number;
    status: string;
    createdAt: string;
    payload: IntakePayload;
  };
}

function toTitleCase(input: unknown): string {
  return String(input || "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatDateTime(input: string): string {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "Unknown";
  return d.toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getStatusTone(status: string): string {
  const s = String(status || "").toUpperCase();

  if (["ACCEPTED", "APPROVED", "CLEARED", "PASSED"].includes(s)) {
    return "border-emerald-900 bg-emerald-900/10 text-emerald-500";
  }
  if (["PENDING", "REVIEW", "IN_REVIEW", "UNDER_REVIEW"].includes(s)) {
    return "border-amber-900 bg-amber-900/10 text-amber-400";
  }
  if (["REJECTED", "DECLINED", "FAILED", "FLAGGED"].includes(s)) {
    return "border-red-900 bg-red-900/10 text-red-400";
  }

  return "border-zinc-800 text-zinc-500";
}

function getScoreTone(score: number): string {
  if (score >= 20) return "text-amber-500";
  if (score >= 12) return "text-zinc-100";
  return "text-zinc-500";
}

function coercePayload(input: any): IntakePayload {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  return input as IntakePayload;
}

function coerceDecisions(payload: IntakePayload): DecisionRow[] {
  if (!Array.isArray(payload?.decisions)) return [];

  return payload.decisions.map((item: any, index: number) => ({
    label: String(item?.label || `Issue ${index + 1}`),
    reasoning: String(item?.reasoning || "No reasoning provided."),
    weight: Number(item?.weight || 0),
  }));
}

const DossierDetail: NextPage<DossierProps> = ({ intake }) => {
  const payload = coercePayload(intake?.payload);
  const decisions = coerceDecisions(payload);

  return (
    <Layout
      title={`Dossier: ${intake.fullName}`}
      className="bg-[#050505] text-white"
      fullWidth
      headerTransparent={false}
    >
      <main className="min-h-screen bg-[#050505]">
        <section className="relative overflow-hidden border-b border-zinc-900">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 aol-vignette" />
            <div className="absolute inset-0 aol-grain opacity-[0.08]" />
            <div className="absolute left-0 top-0 h-px w-full bg-gradient-to-r from-transparent via-white/15 to-transparent" />
          </div>

          <div className="relative mx-auto max-w-7xl px-6 pb-10 pt-[calc(var(--aol-header-h,88px)+2rem)] lg:px-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex items-start gap-4">
                <Link
                  href="/directorate/oversight"
                  className="inline-flex items-center justify-center border border-zinc-800 bg-black/60 p-3 transition-colors hover:bg-zinc-900"
                >
                  <ArrowLeft size={16} />
                </Link>

                <div>
                  <div className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-950/70 px-3 py-2 text-[10px] uppercase tracking-[0.32em] text-zinc-500">
                    <FileText className="h-3.5 w-3.5" />
                    Directorate Dossier
                  </div>

                  <h1 className="mt-5 font-serif text-4xl tracking-tight text-white md:text-5xl">
                    Dossier_{intake.id.substring(0, 8)}
                  </h1>

                  <p className="mt-3 text-sm uppercase tracking-[0.18em] text-zinc-500">
                    Principal: {intake.fullName} // {intake.organisation}
                  </p>

                  <p className="mt-3 text-sm text-zinc-500">
                    Submitted {formatDateTime(intake.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <div className="border border-zinc-800 bg-zinc-900 px-4 py-3 text-[11px] uppercase tracking-[0.18em] text-zinc-300">
                  Gravity Score:{" "}
                  <span className={getScoreTone(intake.score)}>{intake.score}/25</span>
                </div>

                <div
                  className={`border px-4 py-3 text-[11px] uppercase tracking-[0.18em] ${getStatusTone(
                    intake.status
                  )}`}
                >
                  Status: {toTitleCase(intake.status)}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="space-y-10 lg:col-span-8">
              <section>
                <div className="mb-4 flex items-center gap-2 border-l-2 border-amber-500 pl-4 text-zinc-200">
                  <ShieldCheck size={14} />
                  <span className="text-[11px] uppercase tracking-[0.28em]">
                    01_Primary_Risk_Logic
                  </span>
                </div>

                <div className="border border-zinc-800 bg-zinc-900/30 p-6">
                  {decisions.length ? (
                    <div className="space-y-6">
                      {decisions.map((decision, idx) => (
                        <div
                          key={`${decision.label}-${idx}`}
                          className="border-b border-zinc-800 pb-6 last:border-0 last:pb-0"
                        >
                          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-zinc-500">
                            Issue_{idx + 1}: {decision.label}
                          </h2>

                          <p className="mb-4 font-sans text-sm leading-relaxed text-zinc-300">
                            {decision.reasoning}
                          </p>

                          <div className="flex items-center gap-4">
                            <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-800">
                              <div
                                className="h-full bg-amber-500"
                                style={{
                                  width: `${Math.max(
                                    0,
                                    Math.min(100, (Number(decision.weight || 0) / 5) * 100)
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="text-[11px] text-zinc-500">
                              Weight: {Number(decision.weight || 0)}/5
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center">
                      <ShieldCheck className="mx-auto h-6 w-6 text-zinc-700" />
                      <h3 className="mt-4 text-base text-zinc-200">No structured decision logic found</h3>
                      <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-zinc-500">
                        The dossier payload does not currently contain a usable decisions array.
                        Either the intake was captured on an older schema, or the upstream logic
                        engine did not emit structured trade-off data.
                      </p>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <div className="mb-4 flex items-center gap-2 border-l-2 border-zinc-700 pl-4 text-zinc-200">
                  <Terminal size={14} />
                  <span className="text-[11px] uppercase tracking-[0.28em]">
                    02_Raw_Input_Log
                  </span>
                </div>

                <div className="max-h-[32rem] overflow-y-auto border border-zinc-800 bg-black p-4 font-mono leading-relaxed text-emerald-500/80">
                  <div className="mb-2 text-zinc-700">// BEGIN RAW PAYLOAD DECODE</div>
                  <pre className="whitespace-pre-wrap break-words">
                    {JSON.stringify(payload, null, 2)}
                  </pre>
                  <div className="mt-2 text-zinc-700">// END DECODE</div>
                </div>
              </section>
            </div>

            <div className="space-y-6 lg:col-span-4">
              <div className="border border-zinc-800 bg-zinc-900/20 p-6">
                <h2 className="mb-4 flex items-center gap-2 uppercase text-white">
                  <AlertTriangle size={14} className="text-amber-500" />
                  <span className="text-[11px] tracking-[0.24em]">Assessment_Notes</span>
                </h2>

                <p className="mb-6 text-sm italic leading-relaxed text-zinc-500">
                  The following parameters were calculated from the intake dossier and current
                  review assumptions. Any score above 18 should be treated as mandatory
                  Directorate attention.
                </p>

                <ul className="space-y-4 text-[11px] uppercase tracking-[0.14em]">
                  <li className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-500">Intel_Quality</span>
                    <span className="text-white">High</span>
                  </li>
                  <li className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-500">Risk_Appetite</span>
                    <span className="text-white">
                      {String(payload?.riskProfile || "CALIBRATED")}
                    </span>
                  </li>
                  <li className="flex justify-between border-b border-zinc-800 pb-2">
                    <span className="text-zinc-500">Entry_Port</span>
                    <span className="text-white">STRATEGY_ROOM_V2</span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-zinc-500">Review_Status</span>
                    <span className="text-white">{toTitleCase(intake.status)}</span>
                  </li>
                </ul>
              </div>

              <div className="border border-zinc-800 bg-black p-6">
                <h2 className="mb-4 flex items-center gap-2 uppercase text-white">
                  <Cpu size={14} className="text-zinc-500" />
                  <span className="text-[11px] tracking-[0.24em]">Background_Tasks</span>
                </h2>

                <div className="space-y-3 text-[11px] uppercase tracking-[0.14em]">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    <span>Encryption_Layer: Active</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                    <span>Prisma_Sync: Complete</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-700">
                    <div className="h-1.5 w-1.5 rounded-full bg-zinc-700" />
                    <span>Llm_Summarization: Pending</span>
                  </div>
                </div>
              </div>

              <div className="border border-zinc-800 bg-gradient-to-b from-zinc-950 to-black p-6">
                <h2 className="mb-4 flex items-center gap-2 uppercase text-white">
                  <FileText size={14} className="text-zinc-500" />
                  <span className="text-[11px] tracking-[0.24em]">Dossier_Controls</span>
                </h2>

                <div className="space-y-3 text-sm text-zinc-400">
                  <p>
                    This surface is intended for scan speed, structured review, and direct access
                    to underlying intake intelligence.
                  </p>
                </div>

                <div className="mt-5">
                  <Link
                    href="/directorate/oversight"
                    className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.22em] text-zinc-300 transition hover:text-white"
                  >
                    Return to oversight
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
};

export const getServerSideProps: GetServerSideProps<DossierProps> = async ({ params }) => {
  const id = String(params?.id || "").trim();
  if (!id) return { notFound: true };

  const [{ default: prisma }] = await Promise.all([import("@/lib/prisma")]);

  const rawIntake = await prisma.strategyRoomIntake.findUnique({
    where: { id },
    select: {
      id: true,
      fullName: true,
      organisation: true,
      score: true,
      status: true,
      createdAt: true,
      payload: true,
    },
  });

  if (!rawIntake) return { notFound: true };

  const intake = {
    id: String(rawIntake.id),
    fullName: String(rawIntake.fullName || "Unnamed Principal"),
    organisation: String(rawIntake.organisation || "Unspecified Organisation"),
    score: Number(rawIntake.score || 0),
    status: String(rawIntake.status || "UNKNOWN"),
    createdAt: new Date(rawIntake.createdAt).toISOString(),
    payload:
      rawIntake.payload && typeof rawIntake.payload === "object" && !Array.isArray(rawIntake.payload)
        ? (rawIntake.payload as IntakePayload)
        : {},
  };

  return {
    props: {
      intake: JSON.parse(JSON.stringify(intake)),
    },
  };
};

export default withUnifiedAuth(DossierDetail, { requiredRole: "admin" });