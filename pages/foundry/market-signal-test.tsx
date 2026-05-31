/* pages/foundry/market-signal-test.tsx — PUBLIC MARKET SIGNAL TEST
 *
 * Kernel-backed public aperture. Uses the Decision Intelligence Kernel
 * via POST /api/public/kernel-signal. Renders FREE_SIGNAL only.
 *
 * Market-specific context is passed to the kernel for emphasis.
 * No separate isolated intelligence path. No persistence. No paid content.
 */

import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import Layout from "@/components/Layout";
import { FreeSignalResult } from "@/components/kernel/FreeSignalResult";
import { useKernelSignal } from "@/lib/kernel/use-kernel-signal";

const GOLD = "#C9A96E";

const mono: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', ui-monospace, monospace",
};

const serif: React.CSSProperties = {
  fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
  fontWeight: 300,
};

const SAMPLE =
  "We are launching a new product and the marketing team has prepared claims about market leadership and customer adoption. The actual customer data shows only 12 beta users, none of whom have completed the onboarding. The CEO wants to launch with the strong claims anyway.";

export default function MarketSignalTestPage() {
  const [text, setText] = React.useState("");
  const { signal, loading, error, submit, reset } = useKernelSignal();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    submit(text);
  }

  function handleSample() {
    setText(SAMPLE);
  }

  if (signal) {
    return (
      <>
        <Head>
          <title>Market Signal Test — Foundry — Abraham of London</title>
          <meta name="description" content="Free market claim perception check — kernel-backed" />
          <meta name="robots" content="noindex, nofollow" />
        </Head>
        <FreeSignalResult signal={signal} onReset={reset} />
      </>
    );
  }

  return (
    <Layout
      title="Market Signal Test | Foundry | Abraham of London"
      description="Test a market claim. Receive a free perception check: how defensible the claim is, where the evidence gap is, and what the minimum viable next move looks like."
      canonicalUrl="/foundry/market-signal-test"
    >
      <Head>
        <title>Market Signal Test | Foundry | Abraham of London</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <main className="min-h-screen" style={{ backgroundColor: "rgb(3,3,5)" }}>
        <div className="mx-auto max-w-4xl px-6 py-24 lg:px-10">
          <div className="mb-10 flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.3em] text-white/30">
            <Link href="/foundry" className="hover:text-white/60 transition-colors">Foundry</Link>
            <span className="text-white/10">/</span>
            <span style={{ color: `${GOLD}B0` }}>Market Signal Test</span>
          </div>

          <h1 className="font-serif text-4xl font-light italic leading-tight text-white/90 md:text-5xl">
            Test a market claim.
          </h1>
          <p className="mt-4 max-w-[54ch] text-[15px] leading-[1.85] text-white/55">
            Describe a market claim or positioning statement. The system will return
            a free perception check — what kind of claim this is, where the evidence
            gap is, and the direction of the minimum viable move.
          </p>
          <p className="mt-2 text-[13px] leading-[1.7] text-white/35">
            This is not professional advice. It is a structured reading.
          </p>

          <form onSubmit={handleSubmit} className="mt-10">
            <div className="border border-white/[0.10] bg-white/[0.02]">
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder="Describe your market claim or positioning — what is the claim, what evidence supports it, what is the pressure to proceed, and who is involved?"
                rows={6}
                className="w-full border-0 bg-transparent p-5 text-[14px] leading-[1.8] text-white/80 placeholder-white/20 outline-none resize-none"
                style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace", fontSize: "13px" }}
              />
            </div>

            {error && (
              <p className="mt-3 text-[13px] leading-[1.6] text-red-400/80">{error}</p>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="inline-flex min-h-[48px] items-center gap-2 border px-6 py-3 text-[10px] uppercase tracking-widest transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-30"
                style={{
                  borderColor: `${GOLD}40`,
                  backgroundColor: loading ? "transparent" : `${GOLD}10`,
                  color: loading ? `${GOLD}60` : "#F5F5F5",
                  ...mono,
                  letterSpacing: "0.12em",
                }}
              >
                {loading ? "Processing..." : "Read the situation"}
              </button>
              <button
                type="button"
                onClick={handleSample}
                className="inline-flex min-h-[48px] items-center gap-2 border border-white/[0.10] px-6 py-3 text-[10px] uppercase tracking-widest text-white/40 transition-all hover:text-white/60"
                style={{ ...mono, letterSpacing: "0.12em" }}
              >
                Use sample
              </button>
            </div>
          </form>

          <div className="mt-16 border-t border-white/[0.06] pt-8">
            <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.28em", textTransform: "uppercase", color: `${GOLD}60`, marginBottom: "0.75rem" }}>
              How it works
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {[
                { label: "Translation", text: "Your situation is translated into institutional structure. Ambiguity is preserved, not collapsed." },
                { label: "Classification", text: "The claim is classified into one of 12 decision classes. Alternative classifications are noted." },
                { label: "Analysis", text: "Governed lenses assess evidence quality, market claim defensibility, and adversarial pressure." },
                { label: "Signal", text: "You receive a free signal: the primary failure point, governing tension, and direction of move." },
              ].map(({ label, text }) => (
                <div key={label} className="border-l-2 border-white/[0.08] pl-3">
                  <p style={{ ...mono, fontSize: "7px", letterSpacing: "0.18em", textTransform: "uppercase", color: `${GOLD}70`, marginBottom: "0.2rem" }}>{label}</p>
                  <p className="text-[12px] leading-[1.6] text-white/40">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 border-t border-white/[0.04] pt-6">
            <p className="text-[11px] leading-[1.7] text-white/25">
              This is not professional, legal, tax, or financial advice. The free signal is a
              perception check only. No decision should be made solely on the basis of this signal.
              Full governed analysis requires an active case with appropriate disclosure tier.
            </p>
          </div>
        </div>
      </main>
    </Layout>
  );
}