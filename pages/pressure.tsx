import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import { ArrowRight, Copy, RefreshCw, Share2 } from "lucide-react";
import Layout from "@/components/Layout";
import FeedbackWidget from "@/components/feedback/FeedbackWidget";
import { track } from "@/lib/analytics/track";
import type { PressureSignalResult } from "@/lib/inner-circle/operating-layer";

const GOLD = "#C9A96E";
const GREEN = "#6EE7B7";
const AMBER = "#F59E0B";
const RED = "#FB7185";

const bandColor: Record<string, string> = {
  GREEN,
  AMBER,
  RED,
};

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

type Refusal = {
  message: string;
  nextAdmissibleInput: string;
};

export default function PressurePage() {
  const [concern, setConcern] = React.useState("");
  const [result, setResult] = React.useState<PressureSignalResult | null>(null);
  const [refusal, setRefusal] = React.useState<Refusal | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const resultRef = React.useRef<HTMLDivElement>(null);

  async function submit() {
    if (!concern.trim() || loading) return;
    setLoading(true);
    setCopied(false);

    try {
      const response = await fetch("/api/pressure/signal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concern }),
      });
      const payload = await response.json();

      if (payload.ok) {
        setResult(payload.result);
        setRefusal(null);
        track("pressure_signal_completed", {
          pressure_level: payload.result.pressureLevel,
          recommended_product: payload.result.route.productKey,
        });
      } else {
        setResult(null);
        setRefusal(payload.refusal ?? { message: "The concern is not yet decision-grade.", nextAdmissibleInput: "Add decision, owner, pressure, and consequence." });
        track("pressure_signal_refused", { reason: payload.refusal?.error ?? "weak_input" });
      }

      window.setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    } finally {
      setLoading(false);
    }
  }

  const shareText = result
    ? [
        "Decision Pressure Signal",
        `Pressure: ${result.pressureLevel}`,
        `Likely first weakness: ${result.firstWeaknessLikelyToBreak}`,
        `Warning: ${result.consequenceWarning}`,
        `Next step: ${result.recommendedNextStep}`,
        "Run your own signal: https://www.abrahamoflondon.org/pressure",
      ].join("\n")
    : "";

  async function share() {
    if (!shareText) return;
    try {
      if (navigator.share) {
        await navigator.share({ text: shareText });
      } else {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
      }
      track("pressure_signal_shared", { pressure_level: result?.pressureLevel });
    } catch {
      /* optional browser action */
    }
  }

  return (
    <Layout
      title="Pressure Signal | Abraham of London"
      description="A public pressure signal for decisions, governance concerns, and institutional strain."
      canonicalUrl="/pressure"
      fullWidth
      headerTransparent
    >
      <Head>
        <meta property="og:title" content="Pressure Signal - Abraham of London" />
        <meta property="og:description" content="Test the pressure behind a decision or governance concern." />
      </Head>

      <main className="min-h-screen bg-[rgb(3,3,5)] text-white">
        {/* Pain-Proof-Action Framework */}
        <section className="border-b px-6 pt-32 pb-8" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="mx-auto max-w-3xl">
            <div className="grid gap-8 md:grid-cols-3">
              {/* Pain */}
              <div>
                <p style={{ ...mono, fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "0.5rem" }}>
                  The Pain
                </p>
                <p className="text-sm leading-6 text-white/65">
                  Leaders make expensive decisions from incomplete evidence. Internal confidence often exceeds what the facts support.
                </p>
              </div>
              {/* Proof */}
              <div>
                <p style={{ ...mono, fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "0.5rem" }}>
                  The Proof
                </p>
                <p className="text-sm leading-6 text-white/65">
                  This is accountable decision infrastructure—not generic AI advice. It derives judgement by pattern, exposes consequence, and identifies what would falsify your case.
                </p>
              </div>
              {/* Action */}
              <div>
                <p style={{ ...mono, fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: `${GOLD}88`, marginBottom: "0.5rem" }}>
                  The Action
                </p>
                <p className="text-sm leading-6 text-white/65">
                  Enter your decision concern. Get a pressure signal (Red/Amber/Green). See your first weakness. Choose your next route through the product estate.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-16 pt-8">
          <div className="mx-auto max-w-3xl">
            <p style={{ ...mono, color: `${GOLD}AA`, fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase" }}>
              Public Pressure Signal
            </p>
            <h1 className="mt-6 max-w-2xl text-[clamp(2.2rem,5vw,4rem)] italic leading-none" style={serif}>
              Name the pressure before it becomes the decision.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-white/52">
              Enter one decision, pressure, or governance concern. The system returns a Red, Amber, or Green pressure result with the first weakness likely to break and the next route through the product estate.
            </p>

            <div className="mt-9">
              <textarea
                value={concern}
                onChange={(event) => setConcern(event.target.value)}
                rows={6}
                placeholder="Example: We need to decide whether to approve the expansion this month, but the founder is carrying the judgment alone, the board wants speed, and the cash runway is tightening."
                className="w-full border bg-white/[0.025] p-5 text-sm leading-7 text-white outline-none placeholder:text-white/24"
                style={{ borderColor: concern.trim() ? `${GOLD}44` : "rgba(255,255,255,0.10)", resize: "vertical" }}
              />
              <p className="mt-3 text-xs leading-5 text-white/34">
                Raw submitted text is used only to produce the immediate signal. Analytics store derived pressure data only, not the concern itself.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={submit}
                  disabled={!concern.trim() || loading}
                  className="inline-flex min-h-12 items-center gap-3 border px-6 py-3 text-[10px] uppercase tracking-[0.18em] transition disabled:opacity-35"
                  style={{ ...mono, borderColor: `${GOLD}55`, backgroundColor: `${GOLD}18`, color: "white" }}
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : null}
                  {loading ? "Reading pressure" : "Run pressure signal"}
                </button>
                {(result || refusal) ? (
                  <button
                    type="button"
                    onClick={() => {
                      setConcern("");
                      setResult(null);
                      setRefusal(null);
                      setCopied(false);
                    }}
                    className="inline-flex min-h-12 items-center gap-2 px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-white/42"
                    style={mono}
                  >
                    <RefreshCw className="h-3 w-3" />
                    Reset
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </section>

        {(result || refusal) ? (
          <section ref={resultRef} className="border-t px-6 py-14" style={{ borderTopColor: "rgba(255,255,255,0.07)" }}>
            <div className="mx-auto max-w-3xl">
              {refusal ? (
                <div className="border p-6" style={{ borderColor: "rgba(248,113,113,0.26)", backgroundColor: "rgba(248,113,113,0.04)" }}>
                  <p style={{ ...mono, color: "rgba(248,113,113,0.86)", fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" }}>
                    Input not yet decision-grade
                  </p>
                  <p className="mt-4 text-sm leading-7 text-white/68">{refusal.message}</p>
                  <p className="mt-4 text-sm leading-7 text-white/58">{refusal.nextAdmissibleInput}</p>
                </div>
              ) : null}

              {result ? (
                <div className="space-y-5">
                  <div className="border p-6 md:p-8" style={{ borderColor: `${bandColor[result.pressureLevel]}44`, backgroundColor: "rgba(255,255,255,0.018)" }}>
                    <div className="flex flex-wrap items-start justify-between gap-5">
                      <div>
                        <p style={{ ...mono, color: "rgba(255,255,255,0.42)", fontSize: 8, letterSpacing: "0.22em", textTransform: "uppercase" }}>
                          Pressure level
                        </p>
                        <div className="mt-3 flex items-center gap-3">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: bandColor[result.pressureLevel] }} />
                          <span style={{ ...mono, color: bandColor[result.pressureLevel], fontSize: 18, letterSpacing: "0.14em" }}>
                            {result.pressureLevel}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={share}
                        className="inline-flex min-h-10 items-center gap-2 border px-4 py-2 text-[9px] uppercase tracking-[0.14em]"
                        style={{ ...mono, borderColor: `${GOLD}44`, color: `${GOLD}DD` }}
                      >
                        {copied ? <Copy className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
                        {copied ? "Copied" : "Share card"}
                      </button>
                    </div>

                    <ResultBlock label="Consequence warning">{result.consequenceWarning}</ResultBlock>
                    <ResultBlock label="First weakness likely to break">{result.firstWeaknessLikelyToBreak}</ResultBlock>
                    <ResultBlock label="Recommended next step">{result.recommendedNextStep}</ResultBlock>
                  </div>

                  <div className="border p-5" style={{ borderColor: "rgba(201,169,110,0.22)", backgroundColor: "rgba(201,169,110,0.055)" }}>
                    <p className="text-sm leading-7 text-white/68">
                      Recommended route: {result.route.reason}
                    </p>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href={result.route.href}
                        className="inline-flex min-h-11 items-center gap-2 border px-5 py-3 text-[9px] uppercase tracking-[0.15em]"
                        style={{ ...mono, borderColor: `${GOLD}55`, color: "white", backgroundColor: `${GOLD}18` }}
                      >
                        {result.route.label}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      {result.route.productKey !== "free-account" ? (
                        <Link
                          href="/auth/signin?callbackUrl=/inner-circle/dashboard"
                          className="inline-flex min-h-11 items-center gap-2 px-4 py-3 text-[9px] uppercase tracking-[0.15em]"
                          style={{ ...mono, color: "rgba(255,255,255,0.46)" }}
                        >
                          Save decision instead
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : null}
                    </div>
                  </div>

                  <FeedbackWidget
                    surface="pressure_signal_result"
                    subjectType="pressure_signal"
                    subjectId={`${result.pressureLevel}:${result.route.productKey}`}
                    productCode={result.route.productKey}
                    compact
                  />
                </div>
              ) : null}
            </div>
          </section>
        ) : null}
      </main>
    </Layout>
  );
}

function ResultBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 border-t pt-5" style={{ borderTopColor: "rgba(255,255,255,0.07)" }}>
      <p style={{ ...mono, color: `${GOLD}AA`, fontSize: 8, letterSpacing: "0.18em", textTransform: "uppercase" }}>
        {label}
      </p>
      <p className="mt-2 text-sm leading-7 text-white/68">{children}</p>
    </div>
  );
}
