// pages/print/principles-for-my-son-cue-card.tsx
import * as React from "react";
import Head from "next/head";

/**
 * Principles for My Son — Cue Card (A6, Two-Up on A4)
 * Route: /print/principles-for-my-son-cue-card
 *
 * Render:
 *   npm run print:serve
 *   npm run print:pdfs
 * => outputs /public/downloads/principles-for-my-son-cue-card.pdf
 */

function Card() {
  return (
    <div className="card">
      <div className="eyebrow">Standards • A6</div>
      <h1>Principles for My Son</h1>
      <ol className="list">
        <li><strong>Seek wisdom daily.</strong></li>
        <li><strong>Tell the truth.</strong></li>
        <li><strong>Own your decisions.</strong></li>
        <li><strong>Honour women.</strong></li>
        <li><strong>Guard your eyes.</strong></li>
        <li><strong>Work before reward.</strong></li>
        <li><strong>Stand with the weak.</strong></li>
        <li><strong>Keep small promises.</strong></li>
        <li><strong>Train the five.</strong></li>
        <li><strong>Steward money.</strong></li>
        <li><strong>Choose brotherhood.</strong></li>
        <li><strong>Think legacy, not likes.</strong></li>
      </ol>
      <div className="footer">abrahamoflondon.org</div>
    </div>
  );
}

export default function PrinciplesForMySonCueCard() {
  return (
    <>
      <Head>
        <title>Principles for My Son — Cue Card • Print</title>
        <meta name="robots" content="noindex" />
      </Head>

      {/* A4 layout with two A6 columns */}
      <main className="sheet">
        <div className="col"><Card /></div>
        <div className="col"><Card /></div>

        {/* cut marks */}
        <div className="marks">
          <div className="v left" />
          <div className="v right" />
          <div className="h top" />
          <div className="h bottom" />
        </div>
      </main>

      <style jsx>{`
        :root { --ink:#111; --muted:#666; --rule:#dcdcdc; --gold:#bfa364; }
        html, body { background:#f6f6f6; }
        .sheet {
          width:210mm; height:297mm; margin:10mm auto; background:#fff; box-shadow:0 2mm 6mm rgba(0,0,0,.06);
          position:relative; display:grid; grid-template-columns:1fr 1fr; gap:6mm; padding:8mm;
        }
        .col { display:flex; align-items:center; justify-content:center; }
        .card {
          width:148mm; height:105mm; /* A6 landscape */
          border:0.6pt solid var(--rule); border-radius:10px; padding:7mm;
          display:flex; flex-direction:column; justify-content:flex-start; gap:3mm;
        }
        .eyebrow {
          align-self:flex-start; display:inline-block; font-size:8.5pt; letter-spacing:.14em; text-transform:uppercase;
          padding:1.5pt 7pt; border:0.6pt solid var(--gold); color:var(--gold); border-radius:999px;
        }
        h1 { font:700 14pt/1.25 ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; margin:1mm 0 0; color:var(--ink); }
        .list { margin:3mm 0 0; padding-left:4mm; font:10.5pt/1.35 Georgia, ui-serif, Cambria, "Times New Roman", Times, serif; color:#222; display:grid; gap:1.2mm; }
        .footer { margin-top:auto; font:9pt/1.2 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:var(--muted); }
        /* cut marks */
        .marks .v, .marks .h { position:absolute; background:#000; opacity:.5; }
        .marks .v { width:0.5pt; height:8mm; top:calc(50% - 4mm); }
        .marks .v.left  { left:calc(50% - 0.25pt); }
        .marks .v.right { right:calc(50% - 0.25pt); }
        .marks .h { height:0.5pt; width:8mm; left:calc(50% - 4mm); }
        .marks .h.top    { top:calc(50% - 0.25pt); transform:translateY(-53mm); }
        .marks .h.bottom { bottom:calc(50% - 0.25pt); transform:translateY(53mm); }

        @media print {
          html, body { background:#fff; }
          .sheet { margin:0; box-shadow:none; }
          @page { size:A4; margin:6mm; }
        }
      `}</style>
    </>
  );
}
