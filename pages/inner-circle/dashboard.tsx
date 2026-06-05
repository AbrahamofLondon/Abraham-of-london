import * as React from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { ArrowRight, Gauge, Lock, ShieldCheck } from "lucide-react";
import Layout from "@/components/Layout";
import WorkspaceNav from "@/components/inner-circle/WorkspaceNav";
import {
  companionTools,
  readingPaths,
  type ProductRoute,
} from "@/lib/inner-circle/operating-layer";
import type { InnerCircleProfileState } from "@/lib/inner-circle/operating-repository.server";
import { getConversionBridge, buildSafeContextQuery, type ConversionBridge } from "@/lib/inner-circle/commercial-bridge";

type Props = {
  profile: InnerCircleProfileState;
  recommendedRoute: ProductRoute;
  conversionBridge: ConversionBridge;
};

const GOLD = "#C9A96E";
const FRONTIER = "#7CB8E8";
const RULE = "rgba(255,255,255,0.08)";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

export default function InnerCircleDashboard({ profile, recommendedRoute, conversionBridge }: Props) {
  const activePath = readingPaths.find((path) => path.slug === profile.activePath) ?? readingPaths[0];
  const activeTool = companionTools.find((tool) => tool.slug === "rise-decay-scorecard");
  const plannedTools = companionTools.filter((tool) => tool.status !== "active");

  return (
    <Layout
      title="Inner Circle Dashboard | Abraham of London"
      description="Diagnostic operating layer for Inner Circle members."
      fullWidth
    >
      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <WorkspaceNav />
        <section className="border-b px-6 pb-10 pt-20" style={{ borderBottomColor: RULE }}>
          <div className="mx-auto max-w-6xl">
            <p style={{ ...mono, color: `${GOLD}AA`, fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase" }}>
              Inner Circle Operating Layer
            </p>
            <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div>
                <h1 className="max-w-3xl font-serif text-[clamp(2rem,4vw,3.2rem)] font-light italic leading-none text-white/90">
                  Diagnosis, instruments, cadence, interpretation.
                </h1>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-white/48">
                  This is not a paid reading archive. Public doctrine stays public. The Inner Circle applies the framework through saved diagnostics, governed tools, monthly review cadence, and product routing when risk exceeds self-guided review.
                </p>
              </div>
              <div className="border p-5" style={{ borderColor: "rgba(201,169,110,0.22)", backgroundColor: "rgba(201,169,110,0.045)" }}>
                <p style={{ ...mono, color: "rgba(255,255,255,0.38)", fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" }}>
                  Account state
                </p>
                <div className="mt-4 grid gap-3 text-sm text-white/64">
                  <Metric label="Access" value={profile.accessState} />
                  <Metric label="Tier" value={profile.membershipTier} />
                  <Metric label="Path" value={activePath.label} />
                </div>
              </div>
            </div>

            {/* Beta status banner */}
            <div className="mt-6 border px-4 py-3" style={{ borderColor: "rgba(124,184,232,0.25)", backgroundColor: "rgba(124,184,232,0.06)" }}>
              <div className="flex items-center gap-3">
                <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "#7CB8E8" }} />
                <p className="font-mono text-[8px] uppercase tracking-[0.2em]" style={{ color: "#7CB8E8" }}>
                  Controlled Release
                </p>
              </div>
              <p className="mt-2 text-xs leading-6" style={{ color: "rgba(255,255,255,0.55)" }}>
                Inner Circle Operating Layer is in controlled release. Features, diagnostics, and routing logic are active but subject to review.
              </p>
            </div>

            {/* Conversion bridge — shown when risk exceeds self-guided capacity */}
            {conversionBridge.action !== "continue_inner_circle" ? (
              <div className="mt-6 border px-5 py-4" style={{ borderColor: "rgba(201,169,110,0.22)", backgroundColor: "rgba(201,169,110,0.06)" }}>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" style={{ color: GOLD }} />
                  <p className="font-mono text-[8px] uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                    Recommended Next Action
                  </p>
                </div>
                <p className="mt-3 text-sm leading-7 text-white/60">
                  {conversionBridge.reason}
                </p>
                {conversionBridge.action === "start_boardroom_brief" && conversionBridge.prefillContext?.diagnosticId ? (
                  <button
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/inner-circle/boardroom-bridge", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ diagnosticId: conversionBridge.prefillContext?.diagnosticId }),
                        });
                        const data = await res.json();
                        if (data.ok && data.redirectUrl) {
                          window.location.href = data.redirectUrl;
                        } else {
                          window.location.href = "/boardroom-brief";
                        }
                      } catch {
                        window.location.href = "/boardroom-brief";
                      }
                    }}
                    className="mt-4 inline-flex min-h-10 items-center gap-2 border px-5 py-2.5 text-[9px] uppercase tracking-[0.15em] transition hover:-translate-y-0.5"
                    style={{ ...mono, borderColor: `${GOLD}44`, color: "white", backgroundColor: `${GOLD}14`, cursor: "pointer" }}
                  >
                    {conversionBridge.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <Link
                    href={conversionBridge.href}
                    className="mt-4 inline-flex min-h-10 items-center gap-2 border px-5 py-2.5 text-[9px] uppercase tracking-[0.15em] transition hover:-translate-y-0.5"
                    style={{ ...mono, borderColor: `${GOLD}44`, color: "white", backgroundColor: `${GOLD}14` }}
                  >
                    {conversionBridge.label}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                )}
              </div>
            ) : null}
          </div>
        </section>

        <section className="px-6 py-10">
          <div className="mx-auto grid max-w-6xl gap-5 lg:grid-cols-[1fr_0.9fr]">
            <Panel title="Current Path" eyebrow="MVP path">
              <h2 className="font-serif text-2xl italic text-white/88">{activePath.label}</h2>
              <p className="mt-3 text-sm leading-7 text-white/48">
                Founder Under Pressure is the only active path. The remaining paths are registered but held back until completion and upgrade behaviour proves demand.
              </p>
              <div className="mt-5 grid gap-2">
                {"briefs" in activePath
                  ? activePath.briefs.map((href) => (
                      <Link key={href} href={href} className="flex items-center justify-between border-b py-2 text-sm text-white/62 transition hover:text-white" style={{ borderBottomColor: RULE }}>
                        <span>{href.split("/").pop()?.replace(/-/g, " ")}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-white/30" />
                      </Link>
                    ))
                  : null}
              </div>
            </Panel>

            <Panel title="Recommended Diagnostic" eyebrow="Next action">
              {profile.latestResult ? (
                <div>
                  <div className="flex items-center gap-3">
                    <Gauge className="h-5 w-5" style={{ color: GOLD }} />
                    <span className="font-mono text-xl uppercase tracking-[0.12em]" style={{ color: GOLD }}>
                      {profile.latestResult.riskLevel}
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-white/58">
                    Latest Rise-Decay score: {profile.latestResult.score}. {profile.latestResult.recommendedNextAction}
                  </p>
                  <LinkButton href={recommendedRoute.href} label={recommendedRoute.label} />
                </div>
              ) : (
                <div>
                  <p className="text-sm leading-7 text-white/58">
                    Complete the Rise-Decay Scorecard first. It identifies structural drift, maps the weakest domains, and routes high-risk cases into the correct product path.
                  </p>
                  <LinkButton href="/inner-circle/tools/rise-decay-scorecard" label="Start Rise-Decay Scorecard" />
                </div>
              )}
            </Panel>

            <Panel title="Available Tool" eyebrow="Server-gated">
              <div className="flex items-start gap-4">
                <ShieldCheck className="mt-1 h-5 w-5" style={{ color: GOLD }} />
                <div>
                  <h2 className="font-serif text-2xl italic text-white/88">{activeTool?.title}</h2>
                  <p className="mt-3 text-sm leading-7 text-white/50">
                    {activeTool?.purpose} Free registered users may complete this one diagnostic. Paid access is not launched until completion and upgrade intent are measurable.
                  </p>
                  <LinkButton href="/inner-circle/tools/rise-decay-scorecard" label="Open tool" />
                </div>
              </div>
            </Panel>

            <Panel title="Monthly Briefing" eyebrow="Archive v0">
              <p className="text-sm leading-7 text-white/52">
                This month: audit founder dependency before it becomes institutional design. The briefing links the active path, scorecard, and first governance repair action.
              </p>
              <LinkButton href="/inner-circle/briefings" label="Open briefing archive" />
            </Panel>

            <Panel title="30-Day Action Sequence" eyebrow="Fillable worksheet">
              <div className="space-y-3">
                {profile.worksheet.map((item) => (
                  <div key={item.id} className="border p-4" style={{ borderColor: RULE, backgroundColor: "rgba(255,255,255,0.014)" }}>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-white/74">{item.task}</p>
                      <span style={{ ...mono, color: item.status === "completed" ? "#6EE7B7" : "rgba(255,255,255,0.34)", fontSize: 8, letterSpacing: "0.16em", textTransform: "uppercase" }}>
                        {item.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    {item.response ? <p className="mt-2 text-xs leading-6 text-white/42">{item.response}</p> : null}
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs leading-6 text-white/38">
                Worksheet editing is available inside each tool step and is saved server-side.
              </p>
            </Panel>

            <Panel title="Planned Companion Assets" eyebrow="Restricted, not public worksheets">
              <div className="grid gap-2">
                {plannedTools.map((tool) => (
                  <div key={tool.slug} className="flex items-center justify-between border-b py-2" style={{ borderBottomColor: RULE }}>
                    <span className="flex items-center gap-2 text-sm text-white/58">
                      <Lock className="h-3.5 w-3.5 text-white/28" />
                      {tool.title}
                    </span>
                    <span style={{ ...mono, color: "rgba(255,255,255,0.30)", fontSize: 7, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                      {tool.status}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </section>
      </main>
    </Layout>
  );
}

function Panel({ title, eyebrow, children }: { title: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="border p-5 md:p-6" style={{ borderColor: RULE, backgroundColor: "rgba(255,255,255,0.012)" }}>
      <p style={{ ...mono, color: `${FRONTIER}AA`, fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" }}>
        {eyebrow}
      </p>
      <h2 className="mt-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/36">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b pb-2" style={{ borderBottomColor: RULE }}>
      <span style={{ ...mono, color: "rgba(255,255,255,0.34)", fontSize: 8, letterSpacing: "0.16em", textTransform: "uppercase" }}>
        {label}
      </span>
      <span className="text-sm text-white/72">{value}</span>
    </div>
  );
}

function LinkButton({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="mt-5 inline-flex min-h-11 items-center gap-2 border px-5 py-3 text-[9px] uppercase tracking-[0.15em] transition hover:-translate-y-0.5"
      style={{ ...mono, borderColor: `${GOLD}44`, color: "white", backgroundColor: `${GOLD}14` }}
    >
      {label}
      <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const [{ getServerSession }, { authOptions }, { ensureOperatingProfile }, { productRoute }] = await Promise.all([
    import("next-auth/next"),
    import("@/lib/auth/options"),
    import("@/lib/inner-circle/operating-repository.server"),
    import("@/lib/inner-circle/operating-layer"),
  ]);

  const session = await getServerSession(context.req, context.res, authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return {
      redirect: {
        destination: "/auth/signin?callbackUrl=/inner-circle/dashboard",
        permanent: false,
      },
    };
  }

  const profile = await ensureOperatingProfile({
    userId,
    email: session.user?.email ?? null,
    name: session.user?.name ?? null,
  });

  const riskLevel = profile.latestResult?.riskLevel ?? "Low";
  const isCouncilCandidate = profile.accessState === "Council Candidate";

  const recommendedRoute = profile.latestResult
    ? riskLevel === "Critical"
      ? productRoute("strategy-room")
      : riskLevel === "High"
        ? productRoute("boardroom-brief")
        : productRoute("inner-circle")
    : productRoute("rise-decay-scorecard");

  const conversionBridge = getConversionBridge(
    riskLevel as any,
    isCouncilCandidate,
    profile.latestResult?.id,
  );

  return {
    props: {
      profile,
      recommendedRoute,
      conversionBridge,
    },
  };
};
