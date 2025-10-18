// pages/print/principles-for-my-son.tsx
import * as React from "react";
import Head from "next/head";

/**
 * Principles for My Son — Full Page (A4)
 * Route: /print/principles-for-my-son
 *
 * Render via your existing pipeline:
 *   npm run print:serve
 *   npm run print:pdfs
 * => outputs /public/downloads/principles-for-my-son.pdf
 */

export default function PrinciplesForMySon() {
  return (
    <>
      <Head>
        <title>Principles for My Son • Print</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="page">
        <header className="mast">
          <div className="eyebrow">Abraham of London • Standards</div>
          <h1>Principles for My Son</h1>
          <p className="dek">
            Son, these are our family standards. They will not stunt your freedom; they will protect it.
            Keep them when it’s easy and when it’s costly.
          </p>
        </header>

        <section className="panel">
          <ol className="principles">
            <li><strong>Seek Wisdom Daily.</strong> Scripture first; advice from wise men, not loud ones.</li>
            <li><strong>Tell the Truth.</strong> No spin, no hiding, no half-light. Integrity beats image.</li>
            <li><strong>Own Your Decisions.</strong> No excuses. If you break it, you fix it.</li>
            <li><strong>Honour Women.</strong> With words, eyes, time, and protection. No exploitation.</li>
            <li><strong>Guard Your Eyes.</strong> What you behold, you become. Starve the poison, feed the good.</li>
            <li><strong>Work Before Reward.</strong> Do the hard, quiet repetitions. Craftsmanship is a ministry.</li>
            <li><strong>Stand with the Weak.</strong> Use strength to serve. Courage is gentle with people, firm with evil.</li>
            <li><strong>Keep Small Promises.</strong> Be on time. Call back. Do what you said—especially when unseen.</li>
            <li><strong>Train the Five.</strong> Sleep • Scripture • Sweat • Sunlight • Support. Show up daily.</li>
            <li><strong>Steward Money.</strong> Give first, save second, spend last. Debt is a leash—avoid it.</li>
            <li><strong>Choose Brotherhood.</strong> Walk with men who sharpen you; reject the crowd that dulls you.</li>
            <li><strong>Think Legacy, Not Likes.</strong> Live so your children are proud and your name is respected.</li>
          </ol>
        </section>

        <section className="grid2">
          <div className="panel">
            <h2>Daily Starter (5 minutes)</h2>
            <ul className="bullets">
              <li>Read 10 verses. Write one sentence of obedience.</li>
              <li>One hard task before messages/social.</li>
              <li>Send one encouragement to a brother.</li>
            </ul>
          </div>
          <div className="panel">
            <h2>Weekly Review (10 minutes)</h2>
            <ul className="bullets">
              <li>One win • one lesson • one repair.</li>
              <li>Who did I serve? Did I keep my word?</li>
              <li>What is next week’s single non-negotiable?</li>
            </ul>
          </div>
        </section>

        <section className="panel pledge">
          <h2>Our Pledge</h2>
          <p>
            I will show up, tell the truth, and carry weight. I will protect women and children,
            keep small promises, and build a life worth inheriting.
          </p>

          <div className="signrow">
            <div className="sig">
              <div className="line" /><span>Father</span>
            </div>
            <div className="sig">
              <div className="line" /><span>Son</span>
            </div>
            <div className="sig">
              <div className="line" /><span>Date</span>
            </div>
          </div>
        </section>

        <footer className="brand">
          <span>abrahamoflondon.org</span>
          <span className="sep">•</span>
          <span>Presence • Truth • Courage • Protection • Production</span>
        </footer>
      </main>

      <style jsx>{`
        :root { --ink:#111; --muted:#666; --rule:#e5e5e5; --gold:#bfa364; }
        html, body { background:#f6f6f6; }
        .page {
          width:210mm; height:297mm; margin:10mm auto; background:#fff;
          box-shadow:0 2mm 6mm rgba(0,0,0,.06); padding:12mm;
          display:grid; grid-auto-rows:min-content; gap:6mm;
        }
        .mast { border-bottom:0.6pt solid var(--rule); padding-bottom:4mm; }
        .eyebrow {
          display:inline-block; font-size:9pt; letter-spacing:.14em; text-transform:uppercase;
          padding:2pt 8pt; border:0.6pt solid var(--gold); color:var(--gold); border-radius:12px;
        }
        h1 { font:700 18pt/1.2 ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; margin:4mm 0 1mm; color:var(--ink); }
        h2 { font:700 13pt/1.25 ui-serif, Georgia, Cambria, "Times New Roman", Times, serif; margin:0 0 2mm; color:var(--ink); }
        .dek { margin:0; color:var(--muted); font:10.5pt/1.45 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; }
        .panel { border:0.6pt solid var(--rule); border-radius:8px; padding:5mm; background:#fff; }
        .principles { margin:0; padding-left:5mm; display:grid; gap:2.4mm; }
        .principles li { font:11.2pt/1.45 Georgia, ui-serif, Cambria, "Times New Roman", Times, serif; color:#222; }
        .grid2 { display:grid; grid-template-columns:1fr 1fr; gap:6mm; }
        .bullets { margin:0; padding-left:5mm; }
        .pledge p { margin:2mm 0 4mm; font:11pt/1.5 Georgia, ui-serif; }
        .signrow { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8mm; margin-top:2mm; }
        .sig { display:flex; flex-direction:column; gap:2mm; align-items:flex-start; }
        .sig .line { width:100%; height:0; border-bottom:0.6pt solid #000; margin-top:8mm; }
        .sig span { font:9pt/1.2 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; color:var(--muted); }
        .brand {
          margin-top:auto; display:flex; gap:3mm; color:var(--muted); font:10pt/1.4 system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
          border-top:0.6pt solid var(--rule); padding-top:3mm;
        }
        .sep { opacity:.5; }
        @media print {
          html, body { background:#fff; }
          .page { margin:0; box-shadow:none; }
          @page { size:A4; margin:10mm; }
        }
      `}</style>
    </>
  );
}
