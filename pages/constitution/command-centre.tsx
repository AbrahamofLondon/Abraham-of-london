import * as React from "react";
import type { GetServerSideProps, InferGetServerSidePropsType, NextPage } from "next";
import Head from "next/head";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Gavel,
  LineChart,
  Lock,
  Scale,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";

import Layout from "@/components/Layout";
import { buildExecutiveCommandCentreData } from "@/lib/constitution/command-centre";
import type { ExecutiveCommandCentreData } from "@/lib/constitution/command-centre-types";

type Props = {
  data: ExecutiveCommandCentreData;
};

export const getServerSideProps: GetServerSideProps<Props> = async () => {
  const data = buildExecutiveCommandCentreData();

  return {
    props: {
      data,
    },
  };
};

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function toneClass(tone?: "neutral" | "good" | "warn" | "bad") {
  if (tone === "good") return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
  if (tone === "warn") return "border-amber-400/20 bg-amber-500/10 text-amber-300";
  if (tone === "bad") return "border-red-400/20 bg-red-500/10 text-red-300";
  return "border-white/10 bg-white/[0.03] text-white/80";
}

function healthBandClass(band: ExecutiveCommandCentreData["healthBand"]) {
  switch (band) {
    case "SOUND":
      return "border-emerald-400/20 bg-emerald-500/10 text-emerald-300";
    case "WATCH":
      return "border-amber-400/20 bg-amber-500/10 text-amber-300";
    case "STRAINED":
      return "border-orange-400/20 bg-orange-500/10 text-orange-300";
    case "BREACH_RISK":
      return "border-red-400/20 bg-red-500/10 text-red-300";
    default:
      return "border-white/10 bg-white/[0.03] text-white/80";
  }
}

function MetricCard({
  label,
  value,
  tone,
  help,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warn" | "bad";
  help?: string;
}) {
  return (
    <div className={cx("rounded-[22px] border p-5", toneClass(tone))}>
      <div className="text-[10px] font-mono uppercase tracking-[0.22em] text-white/45">
        {label}
      </div>
      <div className="mt-3 text-3xl font-serif">{value}</div>
      {help ? <p className="mt-3 text-sm leading-6 text-white/60">{help}</p> : null}
    </div>
  );
}

function SectionShell({
  title,
  eyebrow,
  children,
}: {
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[30px] border border-white/[0.09] bg-white/[0.03] p-6 md:p-8">
      <div className="text-[10px] font-mono uppercase tracking-[0.26em] text-[#C9A96A]/82">
        {eyebrow}
      </div>
      <h2 className="mt-4 font-serif text-2xl text-white md:text-3xl">{title}</h2>
      <div className="mt-6">{children}</div>
    </section>
  );
}

const CommandCentrePage: NextPage<
  InferGetServerSidePropsType<typeof getServerSideProps>
> = ({ data }) => {
  return (
    <Layout
      title="Executive Command Centre"
      description="Sovereign operating console for constitutional health, route quality, drift, and tribunal governance."
      className="bg-black text-white"
    >
      <Head>
        <title>Executive Command Centre | Abraham of London</title>
        <meta
          name="description"
          content="Constitutional health console, drift register, tribunal queue, and live estate command view."
        />
      </Head>

      <main className="min-h-screen bg-black text-white">
        <section className="border-b border-white/5">
          <div className="mx-auto max-w-7xl px-6 py-16 md:px-8 md:py-20">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-4xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#C9A96A]/20 bg-[#C9A96A]/10 px-4 py-2">
                  <ShieldCheck className="h-4 w-4 text-[#C9A96A]" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.22em] text-[#E6D1A1]">
                    Sovereign operating console
                  </span>
                </div>

                <h1 className="mt-6 font-serif text-4xl leading-tight text-white md:text-6xl">
                  Executive Command Centre
                </h1>

                <p className="mt-5 max-w-3xl text-base leading-8 text-white/62 md:text-lg">
                  This is the board-facing surface for the estate itself: route integrity,
                  breach pressure, tribunal load, drift behaviour, and case flow across
                  the advisory architecture.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div
                  className={cx(
                    "inline-flex items-center justify-center rounded-full border px-4 py-2",
                    healthBandClass(data.healthBand),
                  )}
                >
                  <span className="text-[10px] font-mono uppercase tracking-[0.22em]">
                    Health band · {data.healthBand.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="text-right text-[11px] text-white/36">
                  Generated {new Date(data.generatedAt).toLocaleString("en-GB")}
                </div>
              </div>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.metrics.map((item) => (
                <MetricCard
                  key={item.id}
                  label={item.label}
                  value={item.value}
                  tone={item.tone}
                  help={item.help}
                />
              ))}
            </div>

            {data.notes.length ? (
              <div className="mt-8 rounded-[24px] border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-[#C9A96A]" />
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C9A96A]/80">
                    Executive notes
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {data.notes.map((note) => (
                    <div key={note} className="text-sm leading-7 text-white/68">
                      • {note}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <div className="mx-auto max-w-7xl space-y-8 px-6 py-10 md:px-8 md:py-12">
          <SectionShell eyebrow="Routing balance" title="Estate route distribution">
            <div className="grid gap-4 md:grid-cols-3">
              {data.routeDistribution.map((item) => (
                <div
                  key={item.route}
                  className="rounded-[22px] border border-white/10 bg-black/20 p-5"
                >
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/38">
                    {item.route}
                  </div>
                  <div className="mt-3 text-3xl font-serif text-white">{item.count}</div>
                  <div className="mt-2 text-sm text-white/58">{item.percentage}% of cases</div>
                </div>
              ))}
            </div>
          </SectionShell>

          <SectionShell eyebrow="Live estate" title="Recent live case flow">
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-[10px] font-mono uppercase tracking-[0.18em] text-white/36">
                    <th className="px-4 py-2">Case</th>
                    <th className="px-4 py-2">Route</th>
                    <th className="px-4 py-2">Confidence</th>
                    <th className="px-4 py-2">Seriousness</th>
                    <th className="px-4 py-2">Readiness</th>
                    <th className="px-4 py-2">Trajectory</th>
                    <th className="px-4 py-2">Breaches</th>
                  </tr>
                </thead>
                <tbody>
                  {data.liveCases.map((row) => (
                    <tr
                      key={row.caseKey}
                      className="rounded-[18px] border border-white/10 bg-white/[0.02]"
                    >
                      <td className="px-4 py-4 text-sm text-white/82">{row.caseKey}</td>
                      <td className="px-4 py-4 text-sm text-white/68">{row.latestRoute}</td>
                      <td className="px-4 py-4 text-sm text-white/68">
                        {Math.round(row.confidence * 100)}%
                      </td>
                      <td className="px-4 py-4 text-sm text-white/68">{row.seriousness}</td>
                      <td className="px-4 py-4 text-sm text-white/68">{row.readinessScore}</td>
                      <td className="px-4 py-4 text-sm text-white/68">{row.trajectory}</td>
                      <td className="px-4 py-4 text-sm">
                        <span
                          className={cx(
                            "rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase",
                            row.openBreaches === 0
                              ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-300"
                              : "border-red-400/20 bg-red-500/10 text-red-300",
                          )}
                        >
                          {row.openBreaches}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionShell>

          <div className="grid gap-8 xl:grid-cols-2">
            <SectionShell eyebrow="Operator intelligence" title="Operator behaviour summary">
              <div className="space-y-3">
                {data.operators.map((item) => (
                  <div
                    key={item.operatorKey}
                    className="rounded-[20px] border border-white/10 bg-black/20 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <div className="text-sm font-medium text-white">{item.operatorKey}</div>
                        <div className="mt-1 text-[11px] text-white/46">
                          Last seen {new Date(item.lastSeenAt).toLocaleString("en-GB")}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase text-white/65">
                          Cases {item.totalCases}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase text-white/65">
                          Avg conf {item.averageConfidence}%
                        </span>
                        {item.repeatedWeakSignal ? (
                          <span className="rounded-full border border-red-400/20 bg-red-500/10 px-3 py-1 text-[10px] font-mono uppercase text-red-300">
                            Repeated weak signal
                          </span>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <div className="text-[10px] font-mono uppercase text-white/36">Reject</div>
                        <div className="mt-2 text-lg text-white">{item.rejectCount}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <div className="text-[10px] font-mono uppercase text-white/36">Diagnostic</div>
                        <div className="mt-2 text-lg text-white">{item.diagnosticCount}</div>
                      </div>
                      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                        <div className="text-[10px] font-mono uppercase text-white/36">Strategy</div>
                        <div className="mt-2 text-lg text-white">{item.strategyCount}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </SectionShell>

            <SectionShell eyebrow="Drift governance" title="Drift register and tribunal pressure">
              <div className="space-y-6">
                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-[#C9A96A]" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C9A96A]/80">
                      Drift flags
                    </span>
                  </div>

                  <div className="space-y-3">
                    {data.driftFlags.length ? (
                      data.driftFlags.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-[18px] border border-white/10 bg-black/20 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="text-sm font-medium text-white">{item.title}</div>
                              <div className="mt-1 text-[11px] text-white/46">
                                {item.category} · affected cases {item.affectedCaseCount}
                              </div>
                            </div>
                            <span
                              className={cx(
                                "rounded-full border px-3 py-1 text-[10px] font-mono uppercase",
                                item.severity === "CRITICAL"
                                  ? "border-red-400/20 bg-red-500/10 text-red-300"
                                  : item.severity === "BREACH"
                                    ? "border-orange-400/20 bg-orange-500/10 text-orange-300"
                                    : item.severity === "WARNING"
                                      ? "border-amber-400/20 bg-amber-500/10 text-amber-300"
                                      : "border-white/10 bg-white/[0.03] text-white/60",
                              )}
                            >
                              {item.severity}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[18px] border border-white/10 bg-black/20 p-4 text-sm text-white/56">
                        No drift flags are currently registered.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center gap-2">
                    <Gavel className="h-4 w-4 text-[#C9A96A]" />
                    <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#C9A96A]/80">
                      Tribunal queue
                    </span>
                  </div>

                  <div className="space-y-3">
                    {data.tribunals.length ? (
                      data.tribunals.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-[18px] border border-white/10 bg-black/20 p-4"
                        >
                          <div className="text-sm font-medium text-white">{item.title}</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase text-white/60">
                              {item.status}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase text-white/60">
                              Reviewers {item.reviewers}
                            </span>
                            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-mono uppercase text-white/60">
                              Findings {item.findingsCount}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="rounded-[18px] border border-white/10 bg-black/20 p-4 text-sm text-white/56">
                        No tribunal cases are currently open.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </SectionShell>
          </div>

          <SectionShell eyebrow="Executive actions" title="Next moves">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <Link
                href="/diagnostics"
                className="rounded-[20px] border border-white/10 bg-black/20 p-5 transition hover:border-white/20 hover:bg-white/[0.03]"
              >
                <Activity className="h-5 w-5 text-[#C9A96A]" />
                <div className="mt-4 text-lg font-serif text-white">Diagnostics layer</div>
                <p className="mt-2 text-sm leading-6 text-white/56">
                  Inspect whether the entry layer is producing disciplined signal.
                </p>
              </Link>

              <Link
                href="/diagnostics/executive-reporting"
                className="rounded-[20px] border border-white/10 bg-black/20 p-5 transition hover:border-white/20 hover:bg-white/[0.03]"
              >
                <Scale className="h-5 w-5 text-[#C9A96A]" />
                <div className="mt-4 text-lg font-serif text-white">Executive Reporting</div>
                <p className="mt-2 text-sm leading-6 text-white/56">
                  Review the middle layer where real signal should become disciplined judgment.
                </p>
              </Link>

              <Link
                href="/consulting/strategy-room"
                className="rounded-[20px] border border-white/10 bg-black/20 p-5 transition hover:border-white/20 hover:bg-white/[0.03]"
              >
                <Lock className="h-5 w-5 text-[#C9A96A]" />
                <div className="mt-4 text-lg font-serif text-white">Strategy Room</div>
                <p className="mt-2 text-sm leading-6 text-white/56">
                  Check whether escalations still feel earned rather than cosmetically premium.
                </p>
              </Link>

              <Link
                href="/"
                className="rounded-[20px] border border-white/10 bg-black/20 p-5 transition hover:border-white/20 hover:bg-white/[0.03]"
              >
                <Target className="h-5 w-5 text-[#C9A96A]" />
                <div className="mt-4 text-lg font-serif text-white">Return to estate</div>
                <p className="mt-2 text-sm leading-6 text-white/56">
                  Move back into the broader system once command review is complete.
                </p>
              </Link>
            </div>
          </SectionShell>
        </div>
      </main>
    </Layout>
  );
};

export default CommandCentrePage;