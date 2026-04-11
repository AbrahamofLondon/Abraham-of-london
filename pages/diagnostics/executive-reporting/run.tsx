/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/diagnostics/executive-reporting/run.tsx

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckSquare,
  ChevronRight,
} from "lucide-react";

import Layout from "@/components/Layout";

type ExecutiveReportingIntakeForm = {
  fullName: string;
  email: string;
  organisation: string;
  role: string;
  sector: string;
  problemStatement: string;
  symptoms: string;
  desiredOutcome: string;
  currentConstraint: string;
  authorityScope: string;
  sponsorNameOrSeat: string;
  boardInvolved: string;
  stakeholderBreadth: string;
  revenueBand: string;
  marketExposure: string;
  estimatedExposureGBP: string;
  decisionWindow: string;
  headcountAffected: string;
  evidenceQuality: string;
  evidenceNotes: string;
  priorAttemptOutcome: string;
  decisionQuestion: string;
  whatHappensIfNothingChanges: string;
};

type CanonicalPosture = {
  route?: string;
  orgState?: string;
  readinessTier?: string;
  authorityType?: string;
  priority?: string;
  temperature?: string;
  clarityScore?: number;
  governanceScore?: number;
  severityScore?: number;
  failureModes?: string[];
  requiredInterventions?: string[];
  narrativeSummary?: string;
};

type CanonicalExecutiveSummary = {
  headline?: string;
  summary?: string;
  mandate?: string;
};

type CanonicalGovernedRecommendations = {
  recommendations?: Array<{
    title: string;
    href?: string | null;
    kind: string;
    score: number;
  }>;
  nextAction?: string;
};

type CanonicalFinancialExposure = {
  replacementCostFormatted?: string;
  executionLossFormatted?: string;
  totalExposureFormatted?: string;
};

type CanonicalSections = {
  constitutionalPosture?: CanonicalPosture;
  executiveSummary?: CanonicalExecutiveSummary;
  governedRecommendations?: CanonicalGovernedRecommendations;
  financialExposure?: CanonicalFinancialExposure;
  priorityStack?: { items?: string[] };
  failureModes?: { items?: string[] };
};

type CanonicalReport = {
  sections?: CanonicalSections;
};

type ViewModelFinding = {
  domain?: string;
  severity?: string;
  headline?: string;
  reading?: string;
  signal?: string;
};

type ExecutiveReportViewModel = {
  findings?: ViewModelFinding[];
  boardActions?: string[];
  nextAction?: string;
};

type ExecutiveReportingResult =
  | {
      ok: true;
      runKey: string;
      route?: "STRATEGY" | "DIAGNOSTIC" | "REJECT";
      canonical?: CanonicalReport;
      viewModel?: ExecutiveReportViewModel;
      entitlements?: any;
      diagnostics?: any;
    }
  | {
      ok: false;
      error: string;
    };

type PageState = "intake" | "generating" | "result";

const GOLD = "#C9A96E";
const BASE = "rgb(6 6 9)";
const VOID = "rgb(3 3 5)";
const LIFT = "rgb(10 14 20)";

const GRAIN: React.CSSProperties = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
  backgroundSize: "180px 180px",
};

const INITIAL: ExecutiveReportingIntakeForm = {
  fullName: "",
  email: "",
  organisation: "",
  role: "",
  sector: "",
  problemStatement: "",
  symptoms: "",
  desiredOutcome: "",
  currentConstraint: "",
  authorityScope: "",
  sponsorNameOrSeat: "",
  boardInvolved: "",
  stakeholderBreadth: "",
  revenueBand: "",
  marketExposure: "",
  estimatedExposureGBP: "",
  decisionWindow: "",
  headcountAffected: "",
  evidenceQuality: "",
  evidenceNotes: "",
  priorAttemptOutcome: "",
  decisionQuestion: "",
  whatHappensIfNothingChanges: "",
};

function GoldRule({ soft = false }: { soft?: boolean }) {
  return (
    <div
      className={
        soft
          ? "h-px w-full bg-gradient-to-r from-transparent via-white/[0.06] to-transparent"
          : "h-px w-full bg-gradient-to-r from-transparent via-[#C9A96E]/22 to-transparent"
      }
    />
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-5 w-px" style={{ backgroundColor: `${GOLD}55` }} />
      <span
        style={{
          fontFamily: "'JetBrains Mono', ui-monospace, monospace",
          fontSize: "8px",
          letterSpacing: "0.40em",
          textTransform: "uppercase",
          color: `${GOLD}BB`,
        }}
      >
        {children}
      </span>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  backgroundColor: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(255,255,255,0.09)",
  outline: "none",
  padding: "11px 13px",
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
  fontSize: "1rem",
  lineHeight: 1.55,
  color: "rgba(255,255,255,0.80)",
  transition: "border-color 250ms ease, background-color 250ms ease",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "0.50rem",
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
  fontSize: "7px",
  letterSpacing: "0.36em",
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.26)",
};

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ marginLeft: "0.4rem", color: `${GOLD}80` }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function Input({
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  name: keyof ExecutiveReportingIntakeForm;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      name={name}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      style={inputStyle}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = `${GOLD}35`;
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.035)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.025)";
      }}
    />
  );
}

function Textarea({
  name,
  value,
  onChange,
  placeholder,
  rows = 5,
}: {
  name: keyof ExecutiveReportingIntakeForm;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      name={name}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={rows}
      style={{ ...inputStyle, resize: "none", lineHeight: 1.75 }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = `${GOLD}35`;
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.035)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.025)";
      }}
    />
  );
}

function Select({
  name,
  value,
  onChange,
  options,
}: {
  name: keyof ExecutiveReportingIntakeForm;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      style={{ ...inputStyle, appearance: "none", cursor: "pointer" }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = `${GOLD}35`;
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.035)";
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)";
        e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.025)";
      }}
    >
      <option value="" style={{ backgroundColor: "rgb(6 6 9)" }}>
        Select…
      </option>
      {options.map((o) => (
        <option key={o.value} value={o.value} style={{ backgroundColor: "rgb(6 6 9)" }}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function GroupHeader({ label }: { label: string }) {
  return (
    <div style={{ marginBottom: "1.25rem" }}>
      <GoldRule soft />
      <div style={{ marginTop: "1.5rem" }}>
        <Eyebrow>{label}</Eyebrow>
      </div>
    </div>
  );
}

function severityColor(s: string): { border: string; bg: string; text: string } {
  switch (s) {
    case "CRITICAL":
      return {
        border: "rgba(248,113,113,0.25)",
        bg: "rgba(248,113,113,0.06)",
        text: "rgba(252,165,165,0.90)",
      };
    case "HIGH":
      return {
        border: "rgba(251,146,60,0.25)",
        bg: "rgba(251,146,60,0.06)",
        text: "rgba(253,186,116,0.90)",
      };
    case "MEDIUM":
      return {
        border: `${GOLD}30`,
        bg: `${GOLD}08`,
        text: `${GOLD}CC`,
      };
    default:
      return {
        border: "rgba(255,255,255,0.08)",
        bg: "rgba(255,255,255,0.02)",
        text: "rgba(255,255,255,0.45)",
      };
  }
}

function routeColor(r: string): { border: string; bg: string; text: string } {
  switch (r) {
    case "STRATEGY":
      return {
        border: "rgba(52,211,153,0.25)",
        bg: "rgba(52,211,153,0.06)",
        text: "rgba(110,231,183,0.90)",
      };
    case "REJECT":
      return {
        border: "rgba(248,113,113,0.25)",
        bg: "rgba(248,113,113,0.06)",
        text: "rgba(252,165,165,0.90)",
      };
    default:
      return {
        border: `${GOLD}30`,
        bg: `${GOLD}08`,
        text: `${GOLD}CC`,
      };
  }
}

function resolveRoute(result: Extract<ExecutiveReportingResult, { ok: true }>): string {
  return (
    result.route ??
    result.canonical?.sections?.constitutionalPosture?.route ??
    "DIAGNOSTIC"
  );
}

function ResultSurface({
  result,
  onRerun,
}: {
  result: Extract<ExecutiveReportingResult, { ok: true }>;
  onRerun: () => void;
}) {
  const posture = result.canonical?.sections?.constitutionalPosture;
  const execSumm = result.canonical?.sections?.executiveSummary;
  const governed = result.canonical?.sections?.governedRecommendations;
  const financial = result.canonical?.sections?.financialExposure;
  const priority = result.canonical?.sections?.priorityStack?.items ?? [];
  const failModes = result.canonical?.sections?.failureModes?.items ?? [];
  const findings = result.viewModel?.findings ?? [];
  const actions = result.viewModel?.boardActions ?? [];
  const nextAction = result.viewModel?.nextAction ?? governed?.nextAction;
  const route = resolveRoute(result);
  const rc = routeColor(route);

  function MetricRow({ label, value }: { label: string; value: string }) {
    return (
      <div
        className="flex items-center justify-between gap-3 py-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <span
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "6.5px",
            letterSpacing: "0.30em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.20)",
          }}
        >
          {label}
        </span>
        <span
          style={{
            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
            fontSize: "7.5px",
            letterSpacing: "0.10em",
            color: "rgba(255,255,255,0.60)",
          }}
        >
          {value}
        </span>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>
      <div className="mx-auto max-w-7xl px-6 py-14 lg:px-12">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <Eyebrow>Executive intelligence brief</Eyebrow>
            <h1
              style={{
                marginTop: "1rem",
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontWeight: 300,
                fontSize: "clamp(1.8rem, 3.5vw, 3rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.025em",
                color: "rgba(255,255,255,0.92)",
              }}
            >
              {execSumm?.headline ?? "Constitutional brief generated."}
            </h1>
          </div>

          <div className="mt-1 flex shrink-0 flex-wrap items-center gap-2.5">
            <span
              style={{
                padding: "5px 14px",
                border: `1px solid ${rc.border}`,
                backgroundColor: rc.bg,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7.5px",
                letterSpacing: "0.30em",
                textTransform: "uppercase",
                color: rc.text,
              }}
            >
              {route}
            </span>

            <span
              style={{
                padding: "5px 14px",
                border: "1px solid rgba(255,255,255,0.07)",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px",
                letterSpacing: "0.20em",
                color: "rgba(255,255,255,0.25)",
              }}
            >
              {result.runKey}
            </span>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-6">
            {(execSumm?.summary || execSumm?.mandate) && (
              <div
                style={{
                  border: `1px solid ${GOLD}20`,
                  backgroundColor: `${GOLD}07`,
                  padding: "2rem",
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.40em",
                    textTransform: "uppercase",
                    color: `${GOLD}90`,
                    marginBottom: "1rem",
                  }}
                >
                  Executive summary
                </div>

                {execSumm?.summary && (
                  <p
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "1.05rem",
                      lineHeight: 1.8,
                      color: "rgba(255,255,255,0.70)",
                    }}
                  >
                    {execSumm.summary}
                  </p>
                )}

                {execSumm?.mandate && (
                  <p
                    style={{
                      marginTop: "1rem",
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "0.97rem",
                      lineHeight: 1.7,
                      color: "rgba(255,255,255,0.45)",
                      fontStyle: "italic",
                      borderTop: "1px solid rgba(255,255,255,0.06)",
                      paddingTop: "1rem",
                    }}
                  >
                    {execSumm.mandate}
                  </p>
                )}
              </div>
            )}

            {findings.length > 0 && (
              <div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.38em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.22)",
                    marginBottom: "0.85rem",
                  }}
                >
                  Domain findings ({findings.length})
                </div>

                <div className="space-y-3">
                  {findings.map((f, i) => {
                    const severity = f.severity ?? "LOW";
                    const sc = severityColor(severity);

                    return (
                      <div
                        key={`${f.headline ?? "finding"}-${i}`}
                        style={{
                          border: `1px solid ${sc.border}`,
                          backgroundColor: sc.bg,
                          padding: "1.5rem",
                        }}
                      >
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "7px",
                              letterSpacing: "0.32em",
                              textTransform: "uppercase",
                              color: sc.text,
                            }}
                          >
                            {f.domain ?? "DOMAIN"}
                          </span>

                          <span
                            style={{
                              padding: "2px 8px",
                              border: `1px solid ${sc.border}`,
                              backgroundColor: "rgba(0,0,0,0.20)",
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "6.5px",
                              letterSpacing: "0.28em",
                              textTransform: "uppercase",
                              color: sc.text,
                              flexShrink: 0,
                            }}
                          >
                            {severity}
                          </span>
                        </div>

                        <p
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                            fontWeight: 300,
                            fontSize: "1.02rem",
                            lineHeight: 1.45,
                            color: "rgba(255,255,255,0.82)",
                            marginBottom: "0.6rem",
                          }}
                        >
                          {f.headline ?? "Finding"}
                        </p>

                        {f.reading && (
                          <p
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                              fontWeight: 300,
                              fontSize: "0.92rem",
                              lineHeight: 1.65,
                              color: "rgba(255,255,255,0.50)",
                              marginBottom: "0.6rem",
                            }}
                          >
                            {f.reading}
                          </p>
                        )}

                        {f.signal && (
                          <p
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                              fontWeight: 300,
                              fontSize: "0.88rem",
                              lineHeight: 1.60,
                              color: "rgba(255,255,255,0.32)",
                              fontStyle: "italic",
                            }}
                          >
                            Signal: {f.signal}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {actions.length > 0 && (
              <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT }}>
                <div
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)",
                    }}
                  >
                    Board actions
                  </span>
                </div>

                <div style={{ padding: "1rem 1.25rem" }}>
                  {actions.map((a, i) => (
                    <div
                      key={`${a}-${i}`}
                      className="flex items-start gap-3 py-2.5"
                      style={{
                        borderBottom:
                          i < actions.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      }}
                    >
                      <CheckSquare
                        style={{
                          width: "13px",
                          height: "13px",
                          color: `${GOLD}80`,
                          flexShrink: 0,
                          marginTop: "2px",
                        }}
                      />
                      <span
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "0.97rem",
                          lineHeight: 1.60,
                          color: "rgba(255,255,255,0.65)",
                        }}
                      >
                        {a}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {nextAction && (
              <div
                style={{
                  border: `1px solid ${GOLD}22`,
                  backgroundColor: `${GOLD}06`,
                  padding: "1.25rem 1.5rem",
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.38em",
                    textTransform: "uppercase",
                    color: `${GOLD}90`,
                    marginBottom: "0.65rem",
                  }}
                >
                  Constitutional mandate
                </div>
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                    fontWeight: 300,
                    fontSize: "1.05rem",
                    lineHeight: 1.65,
                    color: "rgba(255,255,255,0.72)",
                    fontStyle: "italic",
                  }}
                >
                  {nextAction}
                </p>
              </div>
            )}

            {(governed?.recommendations?.length ?? 0) > 0 && (
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  backgroundColor: "rgba(255,255,255,0.01)",
                }}
              >
                <div
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.18)",
                    }}
                  >
                    Governed recommendations
                  </span>
                </div>

                <div className="divide-y" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  {governed.recommendations!.slice(0, 4).map((rec, i) => (
                    <div key={`${rec.title}-${i}`} style={{ padding: "0.85rem 1.25rem" }}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p
                            style={{
                              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                              fontWeight: 300,
                              fontSize: "0.95rem",
                              color: "rgba(255,255,255,0.70)",
                              marginBottom: "0.25rem",
                            }}
                          >
                            {rec.title}
                          </p>

                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "6.5px",
                              letterSpacing: "0.26em",
                              textTransform: "uppercase",
                              color: "rgba(255,255,255,0.22)",
                            }}
                          >
                            {rec.kind}
                          </span>
                        </div>

                        {rec.href && (
                          <Link
                            href={rec.href}
                            className="inline-flex shrink-0 items-center gap-1 transition-opacity hover:opacity-70"
                            style={{
                              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                              fontSize: "7px",
                              letterSpacing: "0.24em",
                              textTransform: "uppercase",
                              color: `${GOLD}AA`,
                            }}
                          >
                            Open
                            <ArrowRight style={{ width: "10px", height: "10px" }} />
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {posture && (
              <div style={{ border: "1px solid rgba(255,255,255,0.07)", backgroundColor: LIFT }}>
                <div
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.22)",
                    }}
                  >
                    Constitutional posture
                  </span>
                </div>

                <div style={{ padding: "0.5rem 1.25rem 1rem" }}>
                  {[
                    { label: "Route", value: posture.route ?? "—" },
                    { label: "Org state", value: posture.orgState ?? "—" },
                    { label: "Readiness tier", value: posture.readinessTier ?? "—" },
                    { label: "Authority", value: posture.authorityType ?? "—" },
                    { label: "Priority", value: posture.priority ?? "—" },
                    { label: "Temperature", value: posture.temperature ?? "—" },
                    {
                      label: "Clarity score",
                      value: posture.clarityScore != null ? `${posture.clarityScore}/100` : "—",
                    },
                    {
                      label: "Governance score",
                      value:
                        posture.governanceScore != null ? `${posture.governanceScore}/100` : "—",
                    },
                    {
                      label: "Severity score",
                      value:
                        posture.severityScore != null ? `${posture.severityScore}/100` : "—",
                    },
                  ].map(({ label, value }) => (
                    <MetricRow key={label} label={label} value={value} />
                  ))}
                </div>
              </div>
            )}

            {financial && (
              <div style={{ border: `1px solid ${GOLD}18`, backgroundColor: `${GOLD}06` }}>
                <div
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderBottom: `1px solid ${GOLD}10`,
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: `${GOLD}90`,
                    }}
                  >
                    Financial exposure estimate
                  </span>
                </div>

                <div style={{ padding: "0.75rem 1.25rem" }}>
                  {[
                    { label: "Replacement cost", value: financial.replacementCostFormatted ?? "—" },
                    { label: "Execution loss", value: financial.executionLossFormatted ?? "—" },
                    { label: "Total exposure", value: financial.totalExposureFormatted ?? "—" },
                  ].map(({ label, value }) => (
                    <MetricRow key={label} label={label} value={value} />
                  ))}
                </div>
              </div>
            )}

            {priority.length > 0 && (
              <div
                style={{
                  border: "1px solid rgba(255,255,255,0.06)",
                  backgroundColor: "rgba(255,255,255,0.01)",
                }}
              >
                <div
                  style={{
                    padding: "0.85rem 1.25rem",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                      fontSize: "7px",
                      letterSpacing: "0.38em",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.18)",
                    }}
                  >
                    Priority stack
                  </span>
                </div>

                <div style={{ padding: "0.5rem 1.25rem 1rem" }}>
                  {priority.slice(0, 6).map((item, i) => (
                    <div
                      key={`${item}-${i}`}
                      className="flex items-start gap-2.5 py-2"
                      style={{
                        borderBottom:
                          i < priority.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "1.4rem",
                          lineHeight: 1,
                          color: `${GOLD}25`,
                          flexShrink: 0,
                          minWidth: "22px",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                          fontWeight: 300,
                          fontSize: "0.88rem",
                          lineHeight: 1.55,
                          color: "rgba(255,255,255,0.55)",
                        }}
                      >
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {failModes.length > 0 && (
              <div
                style={{
                  border: "1px solid rgba(252,165,165,0.12)",
                  backgroundColor: "rgba(252,165,165,0.03)",
                  padding: "1rem 1.25rem",
                }}
              >
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "7px",
                    letterSpacing: "0.36em",
                    textTransform: "uppercase",
                    color: "rgba(252,165,165,0.60)",
                    marginBottom: "0.75rem",
                  }}
                >
                  Failure modes
                </div>

                {failModes.map((m, i) => (
                  <div key={`${m}-${i}`} className="flex items-start gap-2.5 py-1.5">
                    <AlertTriangle
                      style={{
                        width: "11px",
                        height: "11px",
                        color: "rgba(252,165,165,0.55)",
                        flexShrink: 0,
                        marginTop: "3px",
                      }}
                    />
                    <span
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                        fontWeight: 300,
                        fontSize: "0.88rem",
                        lineHeight: 1.55,
                        color: "rgba(255,255,255,0.50)",
                      }}
                    >
                      {m}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            marginTop: "3rem",
            padding: "1.75rem 2rem",
            border: "1px solid rgba(255,255,255,0.06)",
            backgroundColor: "rgba(255,255,255,0.01)",
          }}
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "0.97rem",
                  color: "rgba(255,255,255,0.35)",
                  fontStyle: "italic",
                }}
              >
                {route === "STRATEGY"
                  ? "The constitutional signal warrants direct strategic engagement."
                  : route === "REJECT"
                    ? "The matter is not yet at decision-grade threshold. Foundational work should precede escalation."
                    : "A diagnostic reading has been produced. Structured correction should precede premium escalation."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {route === "STRATEGY" && (
                <Link
                  href="/consulting/strategy-room"
                  className="inline-flex items-center gap-2 transition-all duration-300"
                  style={{
                    padding: "10px 20px",
                    border: `1px solid ${GOLD}35`,
                    backgroundColor: `${GOLD}0D`,
                    color: `${GOLD}BB`,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8px",
                    letterSpacing: "0.26em",
                    textTransform: "uppercase",
                  }}
                >
                  Strategy Room
                  <ArrowRight style={{ width: "11px", height: "11px" }} />
                </Link>
              )}

              {(route === "DIAGNOSTIC" || route === "REJECT") && (
                <Link
                  href="/diagnostics"
                  className="inline-flex items-center gap-2 transition-all duration-300"
                  style={{
                    padding: "10px 20px",
                    border: `1px solid ${GOLD}28`,
                    backgroundColor: `${GOLD}08`,
                    color: `${GOLD}AA`,
                    fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                    fontSize: "8px",
                    letterSpacing: "0.26em",
                    textTransform: "uppercase",
                  }}
                >
                  Diagnostic ladder
                  <ChevronRight style={{ width: "11px", height: "11px" }} />
                </Link>
              )}

              <button
                type="button"
                onClick={onRerun}
                style={{
                  padding: "10px 20px",
                  border: "1px solid rgba(255,255,255,0.07)",
                  backgroundColor: "transparent",
                  color: "rgba(255,255,255,0.28)",
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.26em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.55)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.color = "rgba(255,255,255,0.28)";
                }}
              >
                Rerun diagnostic
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ExecutiveReportingIntake({
  onGenerating,
  onResult,
}: {
  onGenerating: () => void;
  onResult: (r: Extract<ExecutiveReportingResult, { ok: true }>) => void;
}) {
  const [form, setForm] = React.useState<ExecutiveReportingIntakeForm>(INITIAL);
  const [isSubmitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (error) setError("");
  }

  function buildPayload() {
    return {
      fullName: form.fullName,
      email: form.email,
      organisation: form.organisation,
      role: form.role,
      sector: form.sector,
      problemStatement: form.problemStatement,
      symptoms: form.symptoms,
      desiredOutcome: form.desiredOutcome,
      currentConstraint: form.currentConstraint,
      governance: {
        authorityScope: form.authorityScope,
        sponsorNameOrSeat: form.sponsorNameOrSeat,
        boardInvolved: form.boardInvolved,
        stakeholderBreadth: form.stakeholderBreadth,
      },
      economics: {
        revenueBand: form.revenueBand,
        marketExposure: form.marketExposure,
        estimatedExposureGBP: Number(form.estimatedExposureGBP) || 0,
        decisionWindow: form.decisionWindow,
        headcountAffected: Number(form.headcountAffected) || 0,
      },
      history: {
        evidenceQuality: form.evidenceQuality,
        evidenceNotes: form.evidenceNotes,
        priorAttemptOutcome: form.priorAttemptOutcome,
      },
      decisionNeed: {
        decisionQuestion: form.decisionQuestion,
        whatHappensIfNothingChanges: form.whatHappensIfNothingChanges,
      },
      diagnosticsMeta: {
        signalReadinessScore: 0,
      },
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    onGenerating();

    try {
      const res = await fetch("/api/executive-reporting/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intake: buildPayload() }),
      });

      const data = (await res.json()) as ExecutiveReportingResult;

      if (!data.ok) {
        setError(data.error ?? "Report generation failed. Check the form and try again.");
        setSubmitting(false);
        return;
      }

      onResult(data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Network error. Please try again.");
      setSubmitting(false);
    }
  }

  React.useEffect(() => {
    if (error) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [error]);

  return (
    <div style={{ backgroundColor: BASE }}>
      <div className="mx-auto max-w-4xl px-6 py-16 lg:px-12 lg:py-20">
        <div className="mb-10">
          <Eyebrow>Mandate intake</Eyebrow>
          <h2
            style={{
              marginTop: "1.25rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "clamp(1.8rem, 3vw, 2.8rem)",
              lineHeight: 1.0,
              letterSpacing: "-0.025em",
              color: "rgba(255,255,255,0.92)",
            }}
          >
            Declare the matter precisely.
          </h2>
          <p
            style={{
              marginTop: "0.85rem",
              fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
              fontWeight: 300,
              fontSize: "1.02rem",
              lineHeight: 1.72,
              color: "rgba(255,255,255,0.38)",
              maxWidth: "48ch",
            }}
          >
            The intake is the diagnostic instrument. Thin answers produce thin diagnoses.
            Every field exists because it drives the constitutional assessment.
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-10">
            <div>
              <GroupHeader label="Identity" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Full name" required>
                  <Input name="fullName" value={form.fullName} onChange={handleChange} />
                </Field>
                <Field label="Email address" required>
                  <Input name="email" value={form.email} onChange={handleChange} type="email" />
                </Field>
                <Field label="Organisation" required>
                  <Input name="organisation" value={form.organisation} onChange={handleChange} />
                </Field>
                <Field label="Role" required>
                  <Input name="role" value={form.role} onChange={handleChange} />
                </Field>
                <Field label="Sector">
                  <Input name="sector" value={form.sector} onChange={handleChange} />
                </Field>
              </div>
            </div>

            <div>
              <GroupHeader label="The matter" />
              <div className="space-y-4">
                <Field label="Problem statement" required>
                  <Textarea
                    name="problemStatement"
                    value={form.problemStatement}
                    onChange={handleChange}
                    rows={6}
                    placeholder="State the actual structural problem. Minimum 120 characters."
                  />
                </Field>
                <Field label="Observed symptoms" required>
                  <Textarea name="symptoms" value={form.symptoms} onChange={handleChange} rows={5} />
                </Field>
                <Field label="Desired outcome" required>
                  <Textarea
                    name="desiredOutcome"
                    value={form.desiredOutcome}
                    onChange={handleChange}
                    rows={3}
                  />
                </Field>
                <Field label="Current constraint" required>
                  <Textarea
                    name="currentConstraint"
                    value={form.currentConstraint}
                    onChange={handleChange}
                    rows={3}
                  />
                </Field>
              </div>
            </div>

            <div>
              <GroupHeader label="Authority & governance" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Authority scope" required>
                  <Select
                    name="authorityScope"
                    value={form.authorityScope}
                    onChange={handleChange}
                    options={[
                      { label: "I decide directly (DIRECT)", value: "DIRECT" },
                      { label: "I influence and sponsor (PROXY)", value: "PROXY" },
                      { label: "I am exploring only (UNCLEAR)", value: "UNCLEAR" },
                    ]}
                  />
                </Field>
                <Field label="Decision sponsor or seat" required>
                  <Input
                    name="sponsorNameOrSeat"
                    value={form.sponsorNameOrSeat}
                    onChange={handleChange}
                  />
                </Field>
                <Field label="Board involved">
                  <Select
                    name="boardInvolved"
                    value={form.boardInvolved}
                    onChange={handleChange}
                    options={[
                      { label: "Yes", value: "YES" },
                      { label: "No", value: "NO" },
                      { label: "Not yet / uncertain", value: "UNCERTAIN" },
                    ]}
                  />
                </Field>
                <Field label="Stakeholder breadth">
                  <Select
                    name="stakeholderBreadth"
                    value={form.stakeholderBreadth}
                    onChange={handleChange}
                    options={[
                      { label: "Individual / local", value: "LOCAL" },
                      { label: "Multi-team", value: "MULTI_TEAM" },
                      { label: "Executive level", value: "EXECUTIVE" },
                      { label: "Board level", value: "BOARD" },
                      { label: "Institutional", value: "INSTITUTIONAL" },
                    ]}
                  />
                </Field>
              </div>
            </div>

            <div>
              <GroupHeader label="Economics & exposure" />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Revenue band" required>
                  <Select
                    name="revenueBand"
                    value={form.revenueBand}
                    onChange={handleChange}
                    options={[
                      { label: "Under £50k", value: "MICRO" },
                      { label: "£50k – £250k", value: "SMB" },
                      { label: "£250k – £1m", value: "MID" },
                      { label: "£1m – £10m", value: "ENTERPRISE" },
                      { label: "Above £10m", value: "WHALE" },
                    ]}
                  />
                </Field>
                <Field label="Market exposure" required>
                  <Select
                    name="marketExposure"
                    value={form.marketExposure}
                    onChange={handleChange}
                    options={[
                      { label: "Stable", value: "LOW" },
                      { label: "Some volatility", value: "MEDIUM" },
                      { label: "Meaningful pressure", value: "HIGH" },
                      { label: "Severe instability", value: "CRITICAL" },
                    ]}
                  />
                </Field>
                <Field label="Estimated financial exposure (£)" required>
                  <Input
                    name="estimatedExposureGBP"
                    value={form.estimatedExposureGBP}
                    onChange={handleChange}
                    type="number"
                  />
                </Field>
                <Field label="Decision window">
                  <Select
                    name="decisionWindow"
                    value={form.decisionWindow}
                    onChange={handleChange}
                    options={[
                      { label: "Immediate / 30 days", value: "IMMEDIATE" },
                      { label: "Quarter / 90 days", value: "NEAR_TERM" },
                      { label: "6–12 months", value: "MID_TERM" },
                      { label: "Long horizon", value: "LONG_HORIZON" },
                    ]}
                  />
                </Field>
                <Field label="Headcount affected">
                  <Input
                    name="headcountAffected"
                    value={form.headcountAffected}
                    onChange={handleChange}
                    type="number"
                  />
                </Field>
              </div>
            </div>

            <div>
              <GroupHeader label="Evidence & history" />
              <div className="space-y-4">
                <Field label="Evidence quality" required>
                  <Select
                    name="evidenceQuality"
                    value={form.evidenceQuality}
                    onChange={handleChange}
                    options={[
                      { label: "High — documented, recent, cross-verified", value: "HIGH" },
                      { label: "Medium — partial documentation", value: "MEDIUM" },
                      { label: "Low — largely anecdotal", value: "LOW" },
                    ]}
                  />
                </Field>
                <Field label="Evidence notes" required>
                  <Textarea
                    name="evidenceNotes"
                    value={form.evidenceNotes}
                    onChange={handleChange}
                    rows={4}
                  />
                </Field>
                <Field label="Prior correction attempts">
                  <Select
                    name="priorAttemptOutcome"
                    value={form.priorAttemptOutcome}
                    onChange={handleChange}
                    options={[
                      { label: "None — first attempt", value: "NONE" },
                      { label: "Attempted — partially worked", value: "PARTIAL" },
                      { label: "Attempted — did not hold", value: "FAILED" },
                      { label: "Attempted — situation worsened", value: "WORSENED" },
                    ]}
                  />
                </Field>
              </div>
            </div>

            <div>
              <GroupHeader label="Decision need" />
              <div className="space-y-4">
                <Field label="Decision question" required>
                  <Textarea
                    name="decisionQuestion"
                    value={form.decisionQuestion}
                    onChange={handleChange}
                    rows={3}
                  />
                </Field>
                <Field label="Cost of inaction" required>
                  <Textarea
                    name="whatHappensIfNothingChanges"
                    value={form.whatHappensIfNothingChanges}
                    onChange={handleChange}
                    rows={3}
                  />
                </Field>
              </div>
            </div>
          </div>

          {error && (
            <div
              style={{
                marginTop: "2rem",
                padding: "1.25rem 1.5rem",
                border: "1px solid rgba(248,113,113,0.20)",
                backgroundColor: "rgba(248,113,113,0.04)",
                display: "flex",
                alignItems: "flex-start",
                gap: "0.75rem",
              }}
            >
              <AlertTriangle
                style={{
                  width: "13px",
                  height: "13px",
                  color: "rgba(252,165,165,0.80)",
                  flexShrink: 0,
                  marginTop: "2px",
                }}
              />
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "0.97rem",
                  lineHeight: 1.65,
                  color: "rgba(252,165,165,0.85)",
                }}
              >
                {error}
              </p>
            </div>
          )}

          <div style={{ marginTop: "2.5rem" }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-3 transition-all duration-300"
              style={{
                padding: "16px 28px",
                border: `1px solid ${isSubmitting ? "rgba(255,255,255,0.07)" : `${GOLD}42`}`,
                backgroundColor: isSubmitting ? "rgba(255,255,255,0.02)" : `${GOLD}10`,
                color: isSubmitting ? "rgba(255,255,255,0.22)" : `${GOLD}CC`,
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "9px",
                letterSpacing: "0.32em",
                textTransform: "uppercase",
                cursor: isSubmitting ? "not-allowed" : "pointer",
              }}
            >
              {isSubmitting ? (
                <>
                  <span
                    className="h-3.5 w-3.5 animate-spin border border-current border-t-transparent"
                    style={{ borderRadius: "50%" }}
                  />
                  Generating executive brief…
                </>
              ) : (
                <>
                  Generate executive intelligence brief
                  <ArrowRight style={{ width: "12px", height: "12px" }} />
                </>
              )}
            </button>

            <p
              style={{
                marginTop: "0.85rem",
                textAlign: "center",
                fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                fontSize: "7px",
                letterSpacing: "0.24em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.14)",
              }}
            >
              Intake is governed. Run record is persisted. Not stored for marketing use.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ExecutiveReportingRunPage() {
  const [pageState, setPageState] = React.useState<PageState>("intake");
  const [result, setResult] = React.useState<Extract<ExecutiveReportingResult, { ok: true }> | null>(
    null,
  );

  function handleGenerating() {
    setPageState("generating");
  }

  function handleResult(r: Extract<ExecutiveReportingResult, { ok: true }>) {
    setResult(r);
    setPageState("result");
  }

  function handleRerun() {
    setResult(null);
    setPageState("intake");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <Layout
      title="Run Executive Diagnostic | Abraham of London"
      description="Generate a board-grade executive intelligence brief from a structured constitutional intake."
      canonicalUrl="/diagnostics/executive-reporting/run"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div style={{ backgroundColor: BASE, minHeight: "100vh", color: "white" }}>
        <div
          style={{
            position: "absolute",
            top: "1.25rem",
            left: 0,
            right: 0,
            zIndex: 60,
          }}
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-12">
            <div className="flex items-center gap-2">
              <Link
                href="/diagnostics/executive-reporting"
                className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-70"
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                }}
              >
                <ArrowLeft style={{ width: "10px", height: "10px" }} />
                Executive Reporting
              </Link>
              <span style={{ color: "rgba(255,255,255,0.10)" }}>/</span>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.20)",
                }}
              >
                {pageState === "result"
                  ? "Brief"
                  : pageState === "generating"
                    ? "Generating"
                    : "Intake"}
              </span>
            </div>
          </div>
        </div>

        {pageState === "intake" && (
          <>
            <section className="relative overflow-hidden" style={{ backgroundColor: VOID }}>
              <div className="pointer-events-none absolute inset-0">
                <div
                  className="absolute"
                  style={{
                    right: "-5%",
                    top: "-15%",
                    width: "500px",
                    height: "500px",
                    borderRadius: "50%",
                    background: `radial-gradient(ellipse at center, ${GOLD}08 0%, transparent 65%)`,
                    filter: "blur(140px)",
                  }}
                />
                <div
                  className="absolute inset-x-0 bottom-0 h-32"
                  style={{ background: `linear-gradient(to top, ${BASE}, transparent)` }}
                />
                <div className="absolute inset-0 opacity-[0.018]" style={GRAIN} />
              </div>

              <div
                className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(to right, transparent, ${GOLD}20, transparent)` }}
              />

              <div className="relative z-10 mx-auto max-w-4xl px-6 lg:px-12">
                <div className="pb-12 pt-28 text-center md:pt-32">
                  <div className="mb-8 flex justify-center">
                    <Eyebrow>Constitutional intake</Eyebrow>
                  </div>

                  <h1
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "clamp(2.2rem, 5vw, 4rem)",
                      lineHeight: 0.94,
                      letterSpacing: "-0.038em",
                      color: "rgba(255,255,255,0.94)",
                    }}
                  >
                    Declare the matter.
                    <br />
                    <span style={{ color: "rgba(255,255,255,0.28)" }}>Receive the reading.</span>
                  </h1>

                  <p
                    style={{
                      margin: "1.25rem auto 0",
                      fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                      fontWeight: 300,
                      fontSize: "1.05rem",
                      lineHeight: 1.72,
                      color: "rgba(255,255,255,0.38)",
                      maxWidth: "46ch",
                    }}
                  >
                    The intake is the diagnostic instrument. Every field drives the
                    constitutional assessment. Thin answers produce thin diagnoses.
                  </p>
                </div>
              </div>
            </section>

            <ExecutiveReportingIntake
              onGenerating={handleGenerating}
              onResult={handleResult}
            />
          </>
        )}

        {pageState === "generating" && (
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: VOID,
            }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-[0.018]" style={GRAIN} />
            <div className="relative z-10 text-center">
              <div
                className="mx-auto mb-6 h-5 w-5 animate-spin border border-current border-t-transparent"
                style={{
                  borderColor: `${GOLD}80`,
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                }}
              />
              <div
                style={{
                  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                  fontSize: "8px",
                  letterSpacing: "0.38em",
                  textTransform: "uppercase",
                  color: `${GOLD}90`,
                  marginBottom: "0.85rem",
                }}
              >
                Assembling constitutional guidance…
              </div>
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                  fontWeight: 300,
                  fontSize: "1.05rem",
                  color: "rgba(255,255,255,0.28)",
                  fontStyle: "italic",
                }}
              >
                Scoring domains, identifying failure modes, synthesising brief.
              </p>
            </div>
          </div>
        )}

        {pageState === "result" && result && (
          <>
            <section
              style={{
                backgroundColor: VOID,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div className="mx-auto max-w-7xl px-6 lg:px-12">
                <div className="pb-8 pt-20">
                  <div
                    className="mb-8 h-px w-8"
                    style={{ background: `linear-gradient(to right, ${GOLD}35, transparent)` }}
                  />
                  <Eyebrow>Executive intelligence brief · Generated</Eyebrow>
                </div>
              </div>
            </section>

            <ResultSurface result={result} onRerun={handleRerun} />
          </>
        )}
      </div>
    </Layout>
  );
}