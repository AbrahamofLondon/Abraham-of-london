import * as React from "react";
import type { GetServerSideProps } from "next";
import Link from "next/link";
import { ArrowRight, Save, ShieldAlert } from "lucide-react";
import Layout from "@/components/Layout";
import WorkspaceNav from "@/components/inner-circle/WorkspaceNav";
import type { InnerCircleProfileState } from "@/lib/inner-circle/operating-repository.server";
import type { RiseDecayScoreResult } from "@/lib/inner-circle/operating-layer";

type Props = {
  profile: InnerCircleProfileState;
};

const GOLD = "#C9A96E";
const RULE = "rgba(255,255,255,0.08)";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

const QUESTIONS = [
  ["authorityClarity", "Authority clarity", "Important decisions have named owners, blockers, and escalation rights."],
  ["decisionLatency", "Decision latency", "Decisions slow down because authority, evidence, or courage is missing."],
  ["founderDependency", "Founder dependency", "The institution still depends on the founder as memory, judgment, and rescue layer."],
  ["evidenceQuality", "Evidence quality", "Signals arrive late, polished, partial, or stripped of consequence."],
  ["operatingCadence", "Operating cadence", "Review rhythm breaks under pressure or becomes performative."],
  ["capitalConstraint", "Capital constraint", "Cash, debt, or counterparties quietly control strategic timing."],
  ["cultureUnderPressure", "Culture under pressure", "Stress reveals exceptions, protected performers, or low-truth habits."],
  ["recoveryReadiness", "Recovery readiness", "The system relies on effort rather than designed recovery paths."],
] as const;

type Answers = Record<(typeof QUESTIONS)[number][0], number> & {
  teamOrEnterpriseSignal: boolean;
  governanceRecurrence: boolean;
};

const defaultAnswers: Answers = {
  authorityClarity: 3,
  decisionLatency: 3,
  founderDependency: 3,
  evidenceQuality: 3,
  operatingCadence: 3,
  capitalConstraint: 3,
  cultureUnderPressure: 3,
  recoveryReadiness: 3,
  teamOrEnterpriseSignal: false,
  governanceRecurrence: false,
};

export default function RiseDecayScorecardPage({ profile }: Props) {
  const [answers, setAnswers] = React.useState<Answers>(defaultAnswers);
  const [result, setResult] = React.useState<(RiseDecayScoreResult & { resultId: string }) | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [worksheet, setWorksheet] = React.useState(profile.worksheet);

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/inner-circle/rise-decay-scorecard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        if (payload.error === "FREE_DIAGNOSTIC_LIMIT_REACHED") {
          setError("Free accounts can complete one diagnostic. Continue from your saved result or upgrade when paid access is launched.");
          return;
        }
        throw new Error(payload.error || "Unable to save scorecard.");
      }
      setResult(payload.result);
    } catch (err: any) {
      setError(err?.message || "Unable to save scorecard.");
    } finally {
      setSaving(false);
    }
  }

  async function saveWorksheet(id: string, patch: Partial<(typeof worksheet)[number]>) {
    const next = worksheet.map((item) => (item.id === id ? { ...item, ...patch } : item));
    setWorksheet(next);

    await fetch("/api/inner-circle/worksheet-action", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...next.find((item) => item.id === id) }),
    }).catch(() => {
      /* keep local edit visible; next server render will reconcile */
    });
  }

  const displayedResult = result ?? null;

  return (
    <Layout title="Rise-Decay Scorecard | Inner Circle" fullWidth>
      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        <WorkspaceNav />
        <section className="border-b px-6 pb-9 pt-20" style={{ borderBottomColor: RULE }}>
          <div className="mx-auto max-w-6xl">
            <p style={{ ...mono, color: `${GOLD}AA`, fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase" }}>
              Rise-Decay Scorecard · Server-gated diagnostic
            </p>
            <h1 className="mt-5 max-w-3xl font-serif text-[clamp(2rem,4vw,3.2rem)] font-light italic leading-none text-white/90">
              Measure structural drift before it becomes institutional habit.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/48">
              Score each domain from 1 to 5. The saved result routes Low and Medium risk back into the path, High risk into Boardroom Brief, and Critical risk into Strategy Room.
            </p>
          </div>
        </section>

        <section className="px-6 py-10">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_0.82fr]">
            <div className="space-y-4">
              {QUESTIONS.map(([key, label, help]) => (
                <div key={key} className="border p-5" style={{ borderColor: RULE, backgroundColor: "rgba(255,255,255,0.014)" }}>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <h2 className="font-serif text-xl italic text-white/84">{label}</h2>
                      <p className="mt-2 text-xs leading-6 text-white/42">{help}</p>
                    </div>
                    <span style={{ ...mono, color: GOLD, fontSize: 18 }}>{answers[key]}</span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={answers[key]}
                    onChange={(event) => setAnswers((current) => ({ ...current, [key]: Number(event.target.value) }))}
                    className="mt-4 w-full"
                  />
                </div>
              ))}

              <div className="grid gap-3 md:grid-cols-2">
                <label className="flex items-start gap-3 border p-4 text-sm leading-6 text-white/58" style={{ borderColor: RULE }}>
                  <input
                    type="checkbox"
                    checked={answers.teamOrEnterpriseSignal}
                    onChange={(event) => setAnswers((current) => ({ ...current, teamOrEnterpriseSignal: event.target.checked }))}
                    className="mt-1"
                  />
                  Team or enterprise indicators are present.
                </label>
                <label className="flex items-start gap-3 border p-4 text-sm leading-6 text-white/58" style={{ borderColor: RULE }}>
                  <input
                    type="checkbox"
                    checked={answers.governanceRecurrence}
                    onChange={(event) => setAnswers((current) => ({ ...current, governanceRecurrence: event.target.checked }))}
                    className="mt-1"
                  />
                  This governance pattern has recurred.
                </label>
              </div>

              <button
                type="button"
                onClick={submit}
                disabled={saving}
                className="inline-flex min-h-12 items-center gap-3 border px-6 py-3 text-[10px] uppercase tracking-[0.17em] disabled:opacity-40"
                style={{ ...mono, borderColor: `${GOLD}55`, backgroundColor: `${GOLD}16`, color: "white" }}
              >
                <Save className="h-4 w-4" />
                {saving ? "Saving result" : "Save scorecard result"}
              </button>

              {error ? <p className="text-sm leading-7 text-red-300/80">{error}</p> : null}
            </div>

            <aside className="space-y-5">
              <div className="border p-5" style={{ borderColor: displayedResult ? `${GOLD}44` : RULE, backgroundColor: "rgba(255,255,255,0.014)" }}>
                <p style={{ ...mono, color: `${GOLD}AA`, fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" }}>
                  Result
                </p>
                {displayedResult ? (
                  <div className="mt-4">
                    <div className="flex items-center gap-3">
                      <ShieldAlert className="h-5 w-5" style={{ color: GOLD }} />
                      <span style={{ ...mono, color: GOLD, fontSize: 20, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                        {displayedResult.riskLevel}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-white/58">
                      Score {displayedResult.score}. {displayedResult.recommendedNextAction}
                    </p>
                    <div className="mt-4">
                      <p style={{ ...mono, color: "rgba(255,255,255,0.34)", fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase" }}>
                        Weakest domains
                      </p>
                      <ul className="mt-2 space-y-1 text-sm text-white/58">
                        {displayedResult.weakestDomains.map((domain) => <li key={domain}>- {domain}</li>)}
                      </ul>
                    </div>
                    <Link
                      href={displayedResult.route.href}
                      className="mt-5 inline-flex min-h-11 items-center gap-2 border px-5 py-3 text-[9px] uppercase tracking-[0.15em]"
                      style={{ ...mono, borderColor: `${GOLD}44`, color: "white", backgroundColor: `${GOLD}14` }}
                    >
                      {displayedResult.route.label}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : profile.latestResult ? (
                  <p className="mt-4 text-sm leading-7 text-white/52">
                    Saved result: {profile.latestResult.riskLevel}, score {profile.latestResult.score}. {profile.latestResult.recommendedNextAction}
                  </p>
                ) : (
                  <p className="mt-4 text-sm leading-7 text-white/42">No saved result yet.</p>
                )}
              </div>

              <div className="border p-5" style={{ borderColor: RULE, backgroundColor: "rgba(255,255,255,0.014)" }}>
                <p style={{ ...mono, color: `${GOLD}AA`, fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" }}>
                  30-day worksheet
                </p>
                <div className="mt-4 space-y-4">
                  {worksheet.map((item) => (
                    <div key={item.id} className="border p-4" style={{ borderColor: RULE }}>
                      <p className="text-sm text-white/72">{item.task}</p>
                      <textarea
                        value={item.response ?? ""}
                        onChange={(event) => saveWorksheet(item.id, { response: event.target.value })}
                        rows={2}
                        placeholder="Write the operating answer."
                        className="mt-3 w-full border bg-white/[0.02] p-3 text-xs leading-6 text-white outline-none placeholder:text-white/24"
                        style={{ borderColor: "rgba(255,255,255,0.09)" }}
                      />
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <input
                          type="date"
                          value={item.deadline?.slice(0, 10) ?? ""}
                          onChange={(event) => saveWorksheet(item.id, { deadline: event.target.value || null })}
                          className="border bg-white/[0.02] p-2 text-xs text-white outline-none"
                          style={{ borderColor: "rgba(255,255,255,0.09)" }}
                        />
                        <select
                          value={item.status}
                          onChange={(event) => saveWorksheet(item.id, { status: event.target.value })}
                          className="border bg-[rgb(3,3,5)] p-2 text-xs text-white outline-none"
                          style={{ borderColor: "rgba(255,255,255,0.09)" }}
                        >
                          <option value="not_started">Not started</option>
                          <option value="in_progress">In progress</option>
                          <option value="completed">Completed</option>
                          <option value="deferred">Deferred</option>
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps<Props> = async (context) => {
  const [{ getServerSession }, { authOptions }, { ensureOperatingProfile }] = await Promise.all([
    import("next-auth/next"),
    import("@/lib/auth/options"),
    import("@/lib/inner-circle/operating-repository.server"),
  ]);

  const session = await getServerSession(context.req, context.res, authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return {
      redirect: {
        destination: "/auth/signin?callbackUrl=/inner-circle/tools/rise-decay-scorecard",
        permanent: false,
      },
    };
  }

  const profile = await ensureOperatingProfile({
    userId,
    email: session.user?.email ?? null,
    name: session.user?.name ?? null,
  });

  return { props: { profile } };
};
