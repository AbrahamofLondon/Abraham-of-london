// pages/print/a6/leaders-cue-card-two-up.tsx
import Head from "next/head";
import React from "react"; // Explicit import of React is good practice

export default function LeadersCueCardTwoUp() {
  return (
    <>
      <Head><title>Leader’s Cue Card — A6 Two-Up (Print)</title></Head>
      <main className="sheet">
        <section className="card">
          <h1>Leader’s Cue Card</h1>
          <h2>Mandate</h2>
          <ul>
            <li>Clarify the goal.</li>
            <li>Guard the standard.</li>
            <li>Remove friction.</li>
          </ul>
          <h2>Check</h2>
          <ul>
            <li>Who is accountable?</li>
            <li>Next irreversible step?</li>
            <li>What must we stop?</li>
          </ul>
        </section>

        <section className="card">
          <h1>Leader’s Cue Card</h1>
          <h2>Cadence</h2>
          <ul>
            <li>Daily: status, blockers, risks.</li>
            <li>Weekly: outcomes & lessons.</li>
            <li>Monthly: standards review.</li>
          </ul>
          <h2>Record</h2>
          <ul>
            <li>Decision log</li>
            <li>Assumptions & tests</li>
            <li>Follow-ups due</li>
          </ul>
        </section>
      </main>

      <style jsx global>{`
        @page { size: A4; margin: 10mm; }
        html, body { background: white; }
        .sheet { width: 210mm; height: 297mm; display: grid; gap: 10mm; grid-template-rows: 1fr 1fr; }
        .card {
          box-sizing: border-box; width: 100%; height: 100%;
          border: .6pt solid #dadada; border-radius: 6pt; padding: 8mm;
          /* FIX: Simplified font fallback to a single quoted value to eliminate parser error */
          font: 10pt/1.45 var(--font-sans, "ui-sans-serif");
          display: flex; flex-direction: column; justify-content: space-between;
        }
        /* FIX: Simplified font fallback */
        h1 { font: 700 12pt/1.2 var(--font-serif, "Georgia"); margin: 0 0 4mm; color: var(--color-primary); }
        /* FIX: Simplified font fallback */
        h2 { font: 600 10pt/1.2 var(--font-serif, "Georgia"); margin: 3mm 0 2mm; color: var(--color-primary); }
        ul { margin: 0; padding-left: 4mm; }
        li { margin: .8mm 0; }
        @media screen {
          body { padding: 2rem; background: #f6f6f6; }
          .sheet { background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.09); margin: 0 auto; }
        }
      `}</style>
    </>
  );
}