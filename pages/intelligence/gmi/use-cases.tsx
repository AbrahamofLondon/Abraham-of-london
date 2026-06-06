import * as React from "react";
import type { NextPage } from "next";

import Layout from "@/components/Layout";

const GOLD = "#C9A96E";
const mono: React.CSSProperties = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };
const serif: React.CSSProperties = { fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif", fontWeight: 300 };

const useCases = [
  ["Board preparing capital allocation under policy uncertainty", "Board Pulse / Consequence Index", "GMI-Q1-2026-CALL-006", "Define capital-allocation signals that pause expansion.", "Boardroom Brief"],
  ["Founder deciding whether to delay expansion", "Operator Brief", "GMI-Q1-2026-CALL-001", "Decide whether the macro window changes timing.", "Strategy Room"],
  ["CFO reviewing margin pressure and FX exposure", "Performance Centre / FX watch signal", "GMI-Q1-2026-CALL-004", "Set tariff pass-through thresholds.", "Executive Reporting"],
  ["Operator reviewing supply-chain fragility", "Call Ledger / Board Pulse", "GMI-Q1-2026-CALL-002", "Approve supplier-node exposure mapping.", "Boardroom Brief"],
  ["Investor reviewing regional exposure", "Falsification Register", "GMI-Q1-2026-CALL-008", "Prepare Q3 regional exposure review.", "Retainer"],
  ["Executive team preparing 90-day strategic review", "Decision deadlines", "GMI-Q1-2026-CALL-007", "Prepare alternate-routing options.", "Strategy Room"],
  ["Retainer client monitoring recurring decision pressure", "Board Pulse", "GMI-Q1-2026-CALL-005", "Set retained macro-governance cadence.", "Retainer"],
] as const;

const GmiUseCasesPage: NextPage = () => {
  return (
    <Layout
      title="GMI Boardroom Use Cases | Abraham of London"
      description="Commercial use cases for Global Market Intelligence."
      canonicalUrl="/intelligence/gmi/use-cases"
      fullWidth
      headerTransparent
    >
      <main className="min-h-screen px-6 py-24" style={{ backgroundColor: "rgb(3,3,5)", color: "white" }}>
        <div className="mx-auto max-w-6xl space-y-8">
          <header className="border border-white/10 bg-white/[0.018] p-6">
            <p style={{ ...mono, fontSize: "8px", letterSpacing: "0.24em", textTransform: "uppercase", color: `${GOLD}BB` }}>
              Boardroom use cases
            </p>
            <h1 className="mt-3" style={{ ...serif, fontSize: "clamp(2rem,4vw,3.2rem)", lineHeight: 1.04 }}>
              GMI routes public proof into paid decision depth.
            </h1>
          </header>

          <section className="grid gap-4 md:grid-cols-2">
            {useCases.map(([problem, section, signal, deadline, route]) => (
              <article key={problem} className="border border-white/10 bg-white/[0.015] p-5">
                <p className="text-[8px] uppercase tracking-[0.16em] text-[#E6C98C]/75" style={mono}>{route}</p>
                <h2 className="mt-2 font-serif text-xl text-white">{problem}</h2>
                <div className="mt-4 space-y-2 text-sm leading-6 text-white/50">
                  <p><span className="text-white/70">Relevant GMI section:</span> {section}</p>
                  <p><span className="text-white/70">Call ledger signal:</span> {signal}</p>
                  <p><span className="text-white/70">Decision deadline:</span> {deadline}</p>
                </div>
              </article>
            ))}
          </section>
        </div>
      </main>
    </Layout>
  );
};

export default GmiUseCasesPage;
