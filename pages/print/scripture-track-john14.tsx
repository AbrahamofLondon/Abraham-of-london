// pages/print/scripture-track-john14.tsx
import * as React from "react";
import Head from "next/head";

/**
 * Scripture Track — John 14 (2 pages, print-ready)
 * Route: /print/scripture-track-john14
 *
 * Render via your pipeline:
 *   npm run print:serve
 *   npm run print:pdfs
 * => outputs /public/downloads/scripture-track-john14.pdf
 */

const Verse: React.FC<{ n: string; children: React.ReactNode }> = ({ n, children }) => (
  <p className="v"><sup>{n}</sup>{children}</p>
);

export default function ScriptureTrackJohn14() {
  return (
    <>
      <Head>
        <title>Scripture Track — John 14 • Print</title>
        <meta name="robots" content="noindex" />
      </Head>

      {/* PAGE 1 */}
      <main className="page">
        <header className="mast">
          <div className="eyebrow">Brotherhood • Scripture Track</div>
          <h1>John 14 — The Presence & Promise of Christ</h1>
          <p className="dek">
            A four-week formation plan to ground men in assurance, obedience, and the comfort of the Helper.
            Read together weekly; work the practices daily.
          </p>
        </header>

        <section className="panel">
          <h2>Memory Verse</h2>
          <blockquote className="mv">
            <span className="mv-text">“Jesus saith unto him, <strong>I am the way, the truth, and the life</strong>: no man cometh unto the Father, but by me.”</span>
            <span className="mv-ref">— John 14:6 (KJV)</span>
          </blockquote>
        </section>

        <section className="grid2">
          <div className="panel">
            <h2>Reading Plan (4 weeks)</h2>
            <ol className="tight">
              <li><strong>Week 1 — Assurance:</strong> John 14:1–7 • “Let not your heart be troubled.”</li>
              <li><strong>Week 2 — Obedience & Love:</strong> John 14:8–15 • “If ye love me, keep my commandments.”</li>
              <li><strong>Week 3 — The Helper:</strong> John 14:16–24 • “Another Comforter… dwelleth with you.”</li>
              <li><strong>Week 4 — Peace & Courage:</strong> John 14:25–31 • “My peace I give unto you.”</li>
            </ol>
            <p className="note">Read daily; on the weekly meet, each man shares one line that gripped him and one obedience step.</p>
          </div>

          <div className="panel">
            <h2>Key Themes</h2>
            <ul className="bullets">
              <li><strong>Presence:</strong> Christ with us; the Spirit in us.</li>
              <li><strong>Way & Truth:</strong> Jesus as exclusive path to the Father.</li>
              <li><strong>Love proves itself:</strong> obedience over opinion.</li>
              <li><strong>Peace under pressure:</strong> courage that does not deny reality.</li>
            </ul>
          </div>
        </section>

        <section className="panel">
          <h2>Selected Excerpts (KJV)</h2>
          <div className="vv">
            <Verse n="1">Let not your heart be troubled: ye believe in God, believe also in me.</Verse>
            <Verse n="6">Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.</Verse>
            <Verse n="15">If ye love me, keep my commandments.</Verse>
            <Verse n="16–17">And I will pray the Father, and he shall give you another Comforter… <em>for he dwelleth with you, and shall be in you.</em></Verse>
            <Verse n="27">Peace I leave with you, my peace I give unto you… Let not your heart be troubled, neither let it be afraid.</Verse>
          </div>
          <p className="legal">Scripture quotations from the King James Version (Public Domain).</p>
        </section>

        <footer className="brand">
          <span>abrahamoflondon.org</span>
          <span className="sep">•</span>
          <span>Standards protect the work when no one is watching.</span>
        </footer>
      </main>

      {/* PAGE 2 */}
      <main className="page">
        <header className="mast mast--small">
          <div className="eyebrow">Brotherhood • John 14</div>
          <h2>Guided Study, Confession & Practice</h2>
        </header>

        <section className="panel">
          <h3>Group Flow (60–90 min)</h3>
          <ol className="tight">
            <li><strong>Scripture (15–45m):</strong> read aloud; each man: one line, one insight.</li>
            <li><strong>Formation (20–30m):</strong> habits, money, marriage, parenting (pick one).</li>
            <li><strong>Intercession (10–15m):</strong> names, needs, next steps.</li>
          </ol>
        </section>

        <section className="grid2">
          <div className="panel">
            <h3>Leader Prompts</h3>
            <ul className="bullets">
              <li>“Where is your heart troubled? Be precise.”</li>
              <li>“What command of Jesus are you resisting this week?”</li>
              <li>“What obedience step will you take by Friday?”</li>
            </ul>
          </div>
          <div className="panel">
            <h3>Accountability Stack</h3>
            <ol className="tight">
              <li><strong>Facts:</strong> what/when/who.</li>
              <li><strong>Heart:</strong> fear, belief, desire underneath.</li>
              <li><strong>Hope:</strong> next right step + partner + date.</li>
            </ol>
          </div>
        </section>

        <section className="panel">
          <h3>Confession & Prayer</h3>
          <ul className="check">
            <li><input type="checkbox" /> I have withheld obedience while asking for peace.</li>
            <li><input type="checkbox" /> I have pursued other “ways” besides Christ.</li>
            <li><input type="checkbox" /> I receive the Spirit’s help to keep Jesus’ word.</li>
          </ul>
          <p className="prayer"><em>Lord Jesus, settle my heart. Anchor me in Your way, train me in obedience, and fill me with the Comforter.
          Let Your peace rule me under pressure. Amen.</em></p>
        </section>

        <section className="grid2">
          <div className="panel">
            <h3>Daily Practice (tick)</h3>
            <ul className="check micro">
              <li><input type="checkbox" /> Morning: read 10 verses; write one obedience step.</li>
              <li><input type="checkbox" /> Midday: 2-minute breath prayer: “Your peace, not my panic.”</li>
              <li><input type="checkbox" /> Evening: review actions; text brother progress.</li>
            </ul>
          </div>
          <div className="panel">
            <h3>Family Reflection (5–10 min)</h3>
            <ul className="bullets micro">
              <li>Ask: “Where did we see Jesus’ peace today?”</li>
              <li>Memorize John 14:6 together (one phrase per day).</li>
              <li>Bless: speak a sentence of courage over each child.</li>
            </ul>
          </div>
        </section>

        <section className="panel">
          <h3>Notes</h3>
          <div className="notes">
            <div className="line" /><div className="line" /><div className="line" />
            <div className="line" /><div className="line" /><div className="line" />
            <div className="line" /><div className="line" /><div className="line" />
          </div>
        </section>

        <footer className="brand">
          <span>abrahamoflondon.org</span>
          <span className="sep">•</span>
          <span>Presence • Truth • Courage • Protection • Production</span>
        </footer>
      </main>

      <style jsx>{`
        :root {
          --ink:#111; --muted:#666; --rule:#e5e5e5; --gold:#bfa364;
        }
        html, body { background:#f6f6f6; }
        .page {
          width:210mm; height:297mm; margin:10mm auto; background:#fff;
          box-shadow:0 2mm 6mm rgba(0,0,0,.06); padding:12mm;
          display:grid; grid-auto-rows:min-content; gap:6mm;
        }
        .mast { border-bottom:0.6pt solid var(--rule); padding-bottom:4mm; }
        .mast--small { border:none; padding-bottom:0; }
        .eyebrow {
          display:inline-block; font-size:9pt; letter-spacing:.14em; text-transform:uppercase;
          padding:2pt 8pt; border:0.6pt solid var(--gold); color:var(--gold); border-radius:12px;
        }
        h1 { font:700 18pt/1.2 ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; margin:4mm 0 1mm; color:var(--ink); }
        h2 { font:700 13pt/1.25 ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; margin:0 0 2mm; color:var(--ink); }
        h3 { font:700 12pt/1.25 ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; margin:0 0 2mm; color:var(--ink); }
        .dek { margin:0; color:var(--muted); font:10.5pt/1.45 system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, sans-serif; }
        .panel {
          border:0.6pt solid var(--rule); border-radius:8px; padding:5mm; background:#fff;
        }
        .mv { margin:0; display:flex; justify-content:space-between; align-items:baseline; gap:6mm; }
        .mv-text { font:italic 12.5pt/1.4 ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; }
        .mv-ref { font:10pt/1.3 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:var(--muted); white-space:nowrap; }
        .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:6mm; }
        .tight { margin:0; padding-left:5mm; }
        .bullets { margin:0; padding-left:5mm; }
        .vv { font:10.5pt/1.55 Georgia, ui-serif, Cambria, "Times New Roman", Times, serif; color:#222; }
        .v { margin:1.6mm 0; }
        .legal { margin-top:3mm; color:var(--muted); font-size:9pt; }
        .check { margin:0; padding-left:0; list-style:none; display:grid; gap:1.8mm; }
        .check input { accent-color: var(--gold); transform: translateY(1px); }
        .prayer { margin:3mm 0 0; color:#222; }
        .notes { display:grid; gap:2.8mm; }
        .notes .line { border-bottom:0.6pt dashed var(--rule); height:8mm; }
        .brand {
          margin-top:auto; display:flex; gap:3mm; color:var(--muted); font:10pt/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          border-top:0.6pt solid var(--rule); padding-top:3mm;
        }
        .sep { opacity:.5; }

        @media print {
          html, body { background:#fff; }
          .page { margin:0; box-shadow:none; }
          @page { size:A4; margin:10mm; }
          .page { page-break-after: always; }
          .page:last-of-type { page-break-after: auto; }
          a, .mv-text strong { color:#000; }
        }
      `}</style>
    </>
  );
}
