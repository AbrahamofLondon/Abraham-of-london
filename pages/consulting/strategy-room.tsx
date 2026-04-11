// pages/consulting/strategy-room.tsx

import * as React from "react";
import Layout from "@/components/Layout";
import dynamic from "next/dynamic";

import StrategyRoomUnifiedIntake from "@/components/strategy/StrategyRoomUnifiedIntake";

const InheritedSignalBanner = dynamic(
  () => import("@/components/diagnostics/InheritedSignalBanner"),
  { ssr: false },
);

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="mt-3 text-sm leading-relaxed text-white/60">
        {children}
      </div>
    </div>
  );
}

export default function StrategyRoomPage() {
  const [result, setResult] = React.useState<any>(null);

  return (
    <Layout title="Strategy Room" className="bg-black text-white">
      <main className="mx-auto max-w-6xl px-6 py-20">
        {/* ───────────────────────────────────────────── */}
        {/* HEADER */}
        {/* ───────────────────────────────────────────── */}

        <div className="max-w-3xl">
          <h1 className="text-5xl font-serif mb-6">
            Strategy Room
          </h1>

          <p className="text-white/60 text-lg leading-relaxed">
            This is not a contact form.  
            It is a governed escalation environment where decisions are interrogated,
            not entertained.
          </p>
        </div>

        {/* ───────────────────────────────────────────── */}
        {/* INHERITED SIGNAL */}
        {/* ───────────────────────────────────────────── */}

        <div className="mt-12">
          <InheritedSignalBanner stage="strategy-room" />
        </div>

        {/* ───────────────────────────────────────────── */}
        {/* POSITIONING GRID */}
        {/* ───────────────────────────────────────────── */}

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <Section title="What qualifies for this room">
            Strategic decisions with real consequence — financial, structural,
            reputational, or institutional — where authority and execution
            alignment materially affect outcome.
          </Section>

          <Section title="What does not belong here">
            Cosmetic optimisation, exploratory curiosity, or decisions without
            clear ownership. Those belong in diagnostic layers, not escalation.
          </Section>

          <Section title="How this room operates">
            Inputs are tested against constitutional thresholds.  
            Weak signal is contained.  
            Strong signal is structured into mandate-grade intervention.
          </Section>
        </div>

        {/* ───────────────────────────────────────────── */}
        {/* INTAKE */}
        {/* ───────────────────────────────────────────── */}

        <div className="mt-16">
          <StrategyRoomUnifiedIntake onResult={setResult} />
        </div>

        {/* ───────────────────────────────────────────── */}
        {/* OUTPUT */}
        {/* ───────────────────────────────────────────── */}

        {result && (
          <div className="mt-16 rounded-3xl border border-white/10 bg-black/40 p-8">
            <h2 className="text-xl font-semibold mb-6">
              Constitutional Output
            </h2>

            {/* POSTURE */}
            <div className="mb-6">
              <div className="text-xs font-mono uppercase tracking-[0.16em] text-white/40 mb-2">
                Constitutional posture
              </div>

              <pre className="text-xs text-white/60 bg-black/30 p-4 rounded-xl overflow-auto">
                {JSON.stringify(
                  result.sections?.constitutionalPosture,
                  null,
                  2
                )}
              </pre>
            </div>

            {/* MANDATE */}
            {result.sections?.mandate && (
              <div className="mb-6">
                <div className="text-xs font-mono uppercase tracking-[0.16em] text-white/40 mb-2">
                  Draft mandate
                </div>

                <div className="text-sm text-white/70 leading-relaxed">
                  {result.sections.mandate}
                </div>
              </div>
            )}

            {/* RISKS */}
            {result.sections?.risks && (
              <div>
                <div className="text-xs font-mono uppercase tracking-[0.16em] text-white/40 mb-2">
                  Risks to contain first
                </div>

                <ul className="space-y-2 text-sm text-white/65">
                  {result.sections.risks.map((r: string) => (
                    <li key={r} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </Layout>
  );
}