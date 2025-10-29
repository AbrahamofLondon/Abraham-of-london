// pages/print/leadership-playbook.tsx

import Head from "next/head";
import React from "react";
import EmbossedBrandMark from "@/components/print/EmbossedBrandMark";
import EmbossedSign from "@/components/print/EmbossedSign";

function FormList({ fields }: { fields: string[] }) {
  return (
    <div className="form">
      <ul>
        {fields.map((f) => (
          <li key={f} className="field">
            <div className="label">{f}</div>
            <div className="lines" />
          </li>
        ))}
      </ul>
    </div>
  );
}

const PageMark = () => (
    <div className="page-mark">
      <EmbossedBrandMark
          src="/assets/images/abraham-logo.jpg"
          alt="Abraham of London Logo"
          width={30}
          height={30}
          effect="deboss"/>
    </div>
);

export default function LeadershipPlaybookPrint() {
  return (
    <main className="print-wrap">
      <Head>
        <title>Leadership Playbook — 30•60•90</title>
        <meta name="robots" content="noindex" />
      </Head>

      {/* --- COVER (Page 1) --- */}
      <section className="page cover-page relative">

        {/* Branding: Large Logo on Cover */}
        <div className="cover-logo">
          <EmbossedBrandMark
              src="/assets/images/abraham-logo.jpg"
              alt="Abraham of London Logo"
              width={120}
              height={120}
              effect="emboss"/>
        </div>

        <h1 className="title">Leadership Playbook</h1>
        <p className="subtitle">30•60•90</p>
        <p className="lead">
          Win your week. Guard the standard. Build what lasts.
        </p>

        {/* Branding: Signature/Sigline */}
        <div className="sigline flex flex-col items-center">
            <EmbossedSign
                src="/assets/images/signature/abraham-of-london-cursive.svg"
                alt="Abraham of London Signature"
                width={120}
                height={30}
                effect="deboss"/>
            <span className="text-xs text-[#666] mt-1">abrahamoflondon.org</span>
        </div>
      </section>

      {/* --- HOW TO USE (Page 2) --- */}
      <section className="page relative">
        <PageMark />
        <h2>How to Use This</h2>
        <ul className="list">
          <li>Structure a first <strong>90-day push</strong> or any focused sprint.</li>
          <li>Weekly loop: <em>Review &rarr; Decide &rarr; Schedule &rarr; Ship &rarr; Reflect</em>.</li> {/* FIXED: Replaced 'â†’' with HTML entity '&rarr;' */}
          <li>Use the A6 <strong>Cue Card</strong> for daily recall.</li>
        </ul>
        <h3>Who this is for</h3>
        <p>Leaders who choose presence over performance and proof over posture.</p>
      </section>

      {/* --- 30•60•90 GRID (Page 3) --- */}
      <section className="page relative">
        <PageMark />
        <h2>30•60•90</h2>
        <div className="grid">
          <div className="cell"><h4>Mandate</h4><p>Why we exist. One sentence.</p></div>
          <div className="cell"><h4>North Star (90d)</h4><p>One outcome that proves progress.</p></div>
          <div className="cell"><h4>30 Days (Foundations)</h4><p>3–5 commitments.</p></div>
          <div className="cell"><h4>60 Days (Proof)</h4><p>3–5 measurable proofs.</p></div>
          <div className="cell"><h4>90 Days (Delivery)</h4><p>3–5 delivered assets.</p></div>
          <div className="cell"><h4>Risks & Guards</h4><p>Top 3 risks + countermeasures.</p></div>
          <div className="cell"><h4>Success Evidence</h4><p>How we will know objectively.</p></div>
        </div>
      </section>

      {/* --- OPERATING RHYTHM (Page 4) --- */}
      <section className="page relative">
        <PageMark />
        <h2>Operating Rhythm</h2>
        <ul className="list tight">
          <li><strong>Mon — Focus:</strong> choose 3 non-negotiables; clear blockers.</li>
          <li><strong>Tue — Build:</strong> deep work; no meetings until 14:00.</li>
          <li><strong>Wed — Review:</strong> metrics + midpoint decisions.</li>
          <li><strong>Thu — Ship:</strong> release one increment, however small.</li>
          <li><strong>Fri — Reflect:</strong> wins, misses, lessons; reset board.</li>
        </ul>
      </section>

      {/* --- WEEKLY REVIEW (FORM) (Page 5) --- */}
      <section className="page relative">
        <PageMark />
        <h2>Weekly Review</h2>
        <FormList fields={[
          "What moved the mission?",
          "Where did we slip the standard?",
          "One constraint to protect next week",
          "One thing to cut",
          "Risks surfaced &rarr; countermeasure", // FIXED: Replaced 'â†’' with HTML entity '&rarr;'
        ]}/>
      </section>

      {/* --- DECISION JOURNAL (Page 6) --- */}
      <section className="page relative">
        <PageMark />
        <h2>Decision Journal</h2>
        <FormList fields={[
          "Decision / Date / Owner",
          "Context (facts only)",
          "Options considered",
          "Chosen because&hellip;", // FIXED: Replaced '…' with &hellip;
          "What would change my mind",
          "Outcome window / Follow-up on",
        ]}/>
      </section>

      {/* --- TEAM STANDARDS (Page 7) --- */}
      <section className="page relative">
        <PageMark />
        <h2>Team Standards</h2>
        <ul className="list">
          <li>Keep counsel private; let public work speak.</li>
          <li>Ship less, better. Constraints preserve quality.</li>
          <li>Cash discipline over clout; stewardship over spectacle.</li>
        </ul>
      </section>

      {/* --- A6 CUE CARD (TWO-UP GUIDE PAGE) (Page 8) --- */}
      <section className="page relative">
        <PageMark />
        <h2>A6 Cue Card — Two-Up</h2>
        <p>Front: 30•60•90 pyramid. Back: &quot;Today&apos;s 3&quot;, &quot;One thing to cut&quot;, &quot;One act of stewardship&quot;.</p> {/* FIXED: Replaced ' with &apos; and " with &quot; */}
        <p className="note">Print tip: A4 landscape, two-up, crop marks; 3 mm bleed if used.</p>
      </section>

      <style jsx global>{`
        /* Define colors for reuse */
        :root {
          --color-primary: #0B2E1F; /* Dark Green */
          --color-secondary: #D4AF37; /* Gold/Brass accent */
        }

        @page { size: A4; margin: 18mm; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

        .print-wrap {
          font: 11.5pt/1.55 var(--font-sans, Inter, system-ui);
          color: #333;
        }

        .page {
          break-after: page;
          padding-top: 5mm; /* Add global top padding for internal pages */
          position: relative;
        }

        /* --- Cover Page Styles --- */
        .cover-page {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 250mm;
          padding: 0;
        }
        .cover-logo {
            margin-bottom: 25mm;
        }
        .title {
          font: 700 28pt var(--font-serif, Georgia);
          color: var(--color-primary);
          margin: 0 0 4mm;
          text-align: center;
        }
        .subtitle {
            font: 600 14pt var(--font-serif, Georgia);
            color: var(--color-primary);
            margin: 0 0 2mm;
            text-align: center;
        }
        .lead {
          font: 400 12.5pt/1.7 var(--font-sans, Inter);
          max-width: 70ch;
          text-align: center;
        }
        .sigline {
          position: absolute;
          bottom: 18mm;
          left: 50%;
          transform: translateX(-50%);
          font-size: 9pt;
          color: #666;
          border-top: 1px solid #ddd;
          padding-top: 4px;
          min-width: 150px;
        }

        /* --- Internal Page Styles --- */
        .page-mark {
            position: absolute;
            top: 0;
            left: 0;
        }
        h2 {
          font: 700 16pt var(--font-serif, Georgia);
          color: var(--color-primary);
          margin: 0 0 6mm;
          padding-top: 10mm; /* Space for logo */
        }
        h3 {
          font: 600 12pt var(--font-serif, Georgia);
          margin: 6mm 0 3mm;
          color: var(--color-primary);
        }
        h4 {
          font: 600 10.5pt var(--font-serif, Georgia);
          margin: 0 0 2mm;
          color: var(--color-primary);
        }
        .list { padding-left: 4.5mm; }
        .list li { margin: 2.5mm 0; }
        .list.tight li { margin: 1.8mm 0; }

        /* --- Grid/Form Styles --- */
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4mm; }
        .cell { border: 0.4pt solid #e5e5e5; border-radius: 4mm; padding: 4mm; min-height: 28mm; }
        .note { color: #666; font-size: 9pt; margin-top: 3mm; }
        .form ul { list-style: none; padding: 0; margin: 0; }
        .field { margin: 4mm 0 8mm; }
        .label { font: 600 10pt var(--font-sans, Inter); color: var(--color-primary); margin-bottom: 2mm; }
        .lines { border: 0.4pt solid #e5e5e5; border-radius: 3mm; height: 22mm; }

        @media screen {
            body { background: #f6f6f6; padding: 2rem; }
            .print-wrap { background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.08); padding: 15mm; }
            /* Adjustments for screen preview */
            .page {
                border: 1px solid #eee;
                margin-bottom: 15mm;
                padding: 15mm;
            }
            .page-mark {
                top: 15mm;
                left: 15mm;
            }
            .cover-page {
                height: 270mm;
                padding: 15mm;
            }
            .sigline {
                position: relative;
                bottom: auto;
                left: auto;
                transform: none;
                margin-top: 20mm;
            }
            .cover-page .title, .cover-page .subtitle, .cover-page .lead {
                 max-width: none;
            }
        }
      `}</style>
    </main>
  );
}