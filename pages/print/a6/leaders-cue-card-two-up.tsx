// pages/print/a6/leaders-cue-card-two-up.tsx
import * as React from "react";
import Head from "next/head";

/**
 * Leader's Cue Card — A6 two-up on A4, print-ready.
 * Route: /print/a6/leaders-cue-card-two-up
 *
 * Render to PDF with your existing pipeline:
 *   npm run print:serve
 *   npm run print:pdfs
 * => outputs /public/downloads/leaders-cue-card-two-up.pdf
 */

function Card() {
  return (
    <article className="card" aria-label="Leader’s Cue Card (A6)">
      <header className="header">
        <div className="eyebrow">Brotherhood • Leader</div>
        <h1>Leader’s Cue Card</h1>
        <p className="subtitle">Run a 90-day pilot: presence • truth • courage • protection • production.</p>
      </header>

      <section className="block">
        <h2>Meeting Rhythm (60–90 min)</h2>
        <ol className="steps">
          <li><strong>Scripture</strong> (15–45m) — read, reflect, one line each.</li>
          <li><strong>Formation</strong> (20–30m) — habits, money, marriage, parenting.</li>
          <li><strong>Intercession</strong> (10–15m) — names, needs, next steps.</li>
        </ol>
      </section>

      <section className="block">
        <h2>Covenant of Presence</h2>
        <ul className="bullets">
          <li><strong>Show up:</strong> weekly touchpoints; no ghosts.</li>
          <li><strong>Tell the truth:</strong> confess struggles before collapse.</li>
          <li><strong>Carry weight:</strong> pray, call, turn up at the door.</li>
          <li><strong>Protect families:</strong> no gossip; cover, don’t expose.</li>
          <li><strong>Build together:</strong> study, train, serve; produce > post.</li>
        </ul>
      </section>

      <section className="grid2 block">
        <div>
          <h2>Roles (rotate monthly)</h2>
          <ul className="bullets">
            <li><strong>Convener:</strong> books space, sends reminder.</li>
            <li><strong>Timekeeper:</strong> starts on time, lands outcomes.</li>
            <li><strong>Scribe:</strong> 1–3 actions per man; check next week.</li>
            <li><strong>Chaplain:</strong> opens/closes; coordinates care in crisis.</li>
          </ul>
        </div>
        <div>
          <h2>Leader Prompts</h2>
          <ul className="bullets">
            <li>“What happened? Facts first.”</li>
            <li>“What did you believe in the moment?”</li>
            <li>“What’s the next right step, by when, with whom?”</li>
          </ul>
        </div>
      </section>

      <section className="block">
        <h2>Accountability Stack</h2>
        <ol className="steps">
          <li><strong>Facts</strong> — what/when/who.</li>
          <li><strong>Heart</strong> — feelings, beliefs, temptations.</li>
          <li><strong>Hope</strong> — next step + partner + date.</li>
        </ol>
      </section>

      <section className="grid2 tight block">
        <div>
          <h2>Red Flags (deal fast)</h2>
          <ul className="bullets">
            <li>Chronic lateness without accountability.</li>
            <li>Secret-keeping; triangulation.</li>
            <li>Spiritual one-upmanship; public shaming.</li>
          </ul>
        </div>
        <div>
          <h2>Care Escalation (48h)</h2>
          <ul className="bullets">
            <li>Go direct; if stuck, bring one brother.</li>
            <li>Pause leadership roles until peace.</li>
            <li>Protect dignity; stories stay in the room.</li>
          </ul>
        </div>
      </section>

      <section className="block micro">
        <p><strong>Emergency / Stewardship:</strong> call, pray, show up; no texting-only in crisis. Protect time, money, name.</p>
        <p><em>abrahamoflondon.org • Standards protect the work when no one is watching.</em></p>
      </section>
    </article>
  );
}

export default function LeadersCueCardTwoUp() {
  return (
    <>
      <Head>
        <title>Leader’s Cue Card — A6 (Two-Up) • Print</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="sheet">
        {/* Two identical A6 cards on A4 */}
        <div className="frame"><Card /></div>
        <div className="frame"><Card /></div>

        {/* Trim/crop marks */}
        <div className="crops" aria-hidden>
          <div className="crop tl" />
          <div className="crop tr" />
          <div className="crop bl" />
          <div className="crop br" />
          <div className="crop midTop" />
          <div className="crop midBottom" />
        </div>
      </main>

      <style jsx>{`
        :root {
          --ink: #111111;
          --muted: #666;
          --rule: #dcdcdc;
          --gold: #bfa364; /* soft gold */
        }
        html, body { background: #f6f6f6; }

        /* A4 sheet */
        .sheet {
          position: relative;
          width: 210mm;
          height: 297mm;
          margin: 10mm auto;
          background: #fff;
          box-shadow: 0 2mm 6mm rgba(0,0,0,.06);
          padding: 10mm;
          display: grid;
          grid-template-rows: 1fr 1fr;
          gap: 10mm;
        }

        /* A6 frame (no bleed, generous gutter) */
        .frame {
          border: 0.6pt dashed var(--rule);
          border-radius: 6px;
          padding: 6mm;
          display: flex;
        }

        .card {
          flex: 1;
          color: var(--ink);
          font: 10.5pt/1.45 system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif;
          display: grid;
          grid-auto-rows: min-content;
          gap: 4mm;
        }

        .header { border-bottom: 0.6pt solid var(--rule); padding-bottom: 3mm; }
        .eyebrow {
          display: inline-block; font-size: 8pt; letter-spacing: .14em; text-transform: uppercase;
          padding: 1pt 6pt; border: 0.6pt solid var(--gold); color: var(--gold); border-radius: 12px;
        }
        h1 { font-size: 15pt; line-height: 1.2; margin: 3mm 0 1mm; }
        .subtitle { margin: 0; color: var(--muted); font-size: 9.5pt; }

        h2 { font-size: 11.5pt; margin: 0 0 1.5mm; }
        .block { margin: 0; }
        .bullets { margin: 0; padding-left: 4mm; list-style: disc; }
        .bullets li { margin: .8mm 0; }
        .steps { margin: 0; padding-left: 4mm; }
        .steps li { margin: .9mm 0; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
        .tight.grid2 { gap: 4mm; }
        .micro { font-size: 9pt; color: var(--muted); }

        /* Crop marks */
        .crops .crop {
          position: absolute; width: 0; height: 0; border-color: #000; opacity: .6;
        }
        /* corners */
        .crop.tl::before, .crop.tr::before, .crop.bl::before, .crop.br::before,
        .crop.midTop::before, .crop.midBottom::before {
          content: ""; position: absolute; background: #000;
        }
        /* top-left */
        .crop.tl { top: 6mm; left: 6mm; }
        .crop.tl::before { width: 12mm; height: 0.3pt; }
        .crop.tl::after  { content: ""; position: absolute; width: 0.3pt; height: 12mm; background: #000; }
        .crop.tl::after  { left: 0; top: 0; }
        /* top-right */
        .crop.tr { top: 6mm; right: 6mm; }
        .crop.tr::before { width: 12mm; height: 0.3pt; right: 0; }
        .crop.tr::after  { content: ""; position: absolute; width: 0.3pt; height: 12mm; background: #000; right: 0; top: 0; }
        /* bottom-left */
        .crop.bl { bottom: 6mm; left: 6mm; }
        .crop.bl::before { width: 12mm; height: 0.3pt; bottom: 0; }
        .crop.bl::after  { content: ""; position: absolute; width: 0.3pt; height: 12mm; background: #000; left: 0; bottom: 0; }
        /* bottom-right */
        .crop.br { bottom: 6mm; right: 6mm; }
        .crop.br::before { width: 12mm; height: 0.3pt; right: 0; bottom: 0; }
        .crop.br::after  { content: ""; position: absolute; width: 0.3pt; height: 12mm; background: #000; right: 0; bottom: 0; }
        /* mid split marks */
        .crop.midTop { top: calc(50% - 0.15pt); left: 6mm; right: 6mm; height: 0.3pt; background: #000; }
        .crop.midTop::before { display: none; }
        .crop.midBottom { display: none; }

        @media print {
          html, body { background: #fff; }
          .sheet { margin: 0; box-shadow: none; }
          @page { size: A4; margin: 8mm; }
          a { color: inherit; text-decoration: none; }
        }
      `}</style>
    </>
  );
}
