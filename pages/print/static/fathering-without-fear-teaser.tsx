// pages/print/brotherhood-covenant.tsx
import * as React from "react";
import Head from "next/head";
import Link from "next/link";
import EmbossedBrandMark from "@/components/print/EmbossedBrandMark";
import EmbossedSign from "@/components/print/EmbossedSign";

export default function BrotherhoodCovenant() {
  const currentYear = new Date().getFullYear();
  return (
    <>
      <Head>
        <title>Brotherhood Covenant — Abraham of London (Print)</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="page">
        {/* Header */}
        <header className="header">
          <div className="brand">
            {/* --- Branding: EmbossedBrandMark replaces the Image/Link/Fallback block --- */}
            <div className="logo">
                <EmbossedBrandMark
                    src="/assets/images/abraham-logo.jpg" // Using the generic logo provided
                    alt="Abraham of London"
                    width={50} // Adjust size for better fit in header
                    height={50}
                    effect="emboss"/>
            </div>
            {/* -------------------------------------------------------------------------- */}
            <div className="brand-meta">
              <span className="eyebrow">Brotherhood Code</span>
              <h1>Brotherhood Covenant</h1>
              <p className="subtitle">90-Day Covenant of Presence &amp; Integrity</p>
            </div>
          </div>
          <div className="doc-meta">
            <div><strong>Doc</strong> AOL-BC-2025.10</div>
            <div><strong>Pages</strong> 1 of 1</div>
          </div>
        </header>

        {/* Preamble */}
        <section className="section">
          <p className="lede">
            We commit to a 90-day pilot of weekly presence, truth-telling, and practical care
            so that families are protected, standards are restored, and men are forged together.
          </p>
        </section>

        {/* The Covenant (from the post; lightly typeset for print) */}
        <section className="section">
          <h2>Our Covenant</h2>
          <ol className="list">
            <li><strong>Show up.</strong> Weekly touchpoints. <em>No ghosts.</em></li>
            <li><strong>Tell the truth.</strong> Confess struggles <em>before</em> collapse.</li>
            <li><strong>Carry weight.</strong> Pray, call, turn up at the door.</li>
            <li><strong>Protect families.</strong> No gossip; no shortcuts. <em>Cover, don't expose.</em></li>
            <li><strong>Build together.</strong> Study, train, serve. <em>Produce—not just post.</em></li>
          </ol>
        </section>

        {/* Rhythm */}
        <section className="section">
          <h3 className="h3">Weekly Rhythm (60–90 minutes)</h3>
          <ul className="bullets">
            <li><strong>Scripture (â‰ˆ45m):</strong> Read &amp; discuss for grounding.</li>
            <li><strong>Formation (â‰ˆ30m):</strong> Habits, money, marriage, parenting.</li>
            <li><strong>Intercession (â‰ˆ15m):</strong> Names, needs, next steps.</li>
          </ul>
        </section>

        {/* Accountability Stack */}
        <section className="section">
          <h3 className="h3">Accountability that Builds</h3>
          <ol className="list-tight">
            <li><strong>Facts first</strong> — What happened? When? What did I do / not do?</li>
            <li><strong>Heart next</strong> — What was I feeling? What did I believe?</li>
            <li><strong>Hope last</strong> — Next right step. Who's my accountability partner?</li>
          </ol>
        </section>

        {/* Guardrails */}
        <section className="section">
          <h3 className="h3">Guardrails</h3>
          <ul className="bullets">
            <li><strong>Confidentiality:</strong> Stories stay in the room.</li>
            <li><strong>No fixing during grief:</strong> Listen first; solutions later.</li>
            <li><strong>Short answers, long obedience:</strong> Clear shares; strong commitments.</li>
            <li><strong>Conflict clock (48h):</strong> Address directly within 48 hours; bring one brother if unresolved.</li>
          </ul>
        </section>

        {/* Roles */}
        <section className="section">
          <h3 className="h3">Monthly Roles (Rotate)</h3>
          <ul className="grid2">
            <li><strong>Convener</strong> — books space, sends reminders.</li>
            <li><strong>Timekeeper</strong> — lands content, avoids drift.</li>
            <li><strong>Scribe</strong> — 1–3 actions per man, checks progress.</li>
            <li><strong>Chaplain</strong> — opens/closes in prayer, coordinates care.</li>
          </ul>
        </section>

        {/* Terms */}
        <section className="section">
          <h3 className="h3">Term &amp; Standards</h3>
          <ul className="bullets">
            <li><strong>Term:</strong> 90 days; renew by mutual agreement.</li>
            <li><strong>Attendance:</strong> Weekly presence (in person preferred).</li>
            <li><strong>Integrity:</strong> We correct in love and receive correction with humility.</li>
            <li><strong>Escalation:</strong> Where peace fails, pause leadership roles until restored.</li>
          </ul>
        </section>

        {/* Signature Block */}
        <section className="section signatures">
          <h2>Signatures</h2>
          <p className="micro">
            By signing, we agree to the Covenant above for the stated term.
          </p>

          <table className="sig-table" aria-label="Signature lines">
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  <td className="line"><span aria-hidden>_______________________________</span><br /><span className="label">Name</span></td>
                  <td className="line"><span aria-hidden>_______________________________</span><br /><span className="label">Signature</span></td>
                  <td className="line narrow"><span aria-hidden>______________</span><br /><span className="label">Date</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Footer */}
        <footer className="footer">
          <div className="copyright">© {currentYear} Abraham of London. All rights reserved.</div>
          <div className="flex flex-col items-end">
             {/* --- Branding: EmbossedSign replaces the second link/text block --- */}
            <EmbossedSign
                src="/assets/images/signature/abraham-of-london-cursive.svg"
                alt="Abraham of London Signature"
                width={120}
                height={25}
                effect="deboss"/>
            <div className="muted text-right text-xs mt-0.5">
                <Link href="https://www.abrahamoflondon.org" target="_blank" rel="noopener noreferrer">
                    abrahamoflondon.org
                </Link>
                <span aria-hidden> • Brotherhood is a covenant of presence.</span>
            </div>
          </div>
        </footer>
      </main>

      {/* Print styles (scoped) */}
      <style jsx global>{`
        /* Global styles for print */
        @page { size: A4; margin: 12mm 14mm; }
        @media print {
            html, body { background: #fff; }
            .page { margin: 0; box-shadow: none; }
            a { color: inherit; text-decoration: none; }
        }

        :root {
          --ink: #111;
          --muted: #666;
          --rule: #dcdcdc;
          --brand: #bfa364; /* soft gold accent */
        }

        /* Screen styles */
        html, body { background: #f6f6f6; }
        .page {
          width: 210mm;
          min-height: 297mm;
          margin: 10mm auto;
          background: #fff;
          color: var(--ink);
          box-shadow: 0 2mm 6mm rgba(0,0,0,.06);
          padding: 14mm 16mm;
          font: 12.25pt/1.45 system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        /* Header styles */
        .header {
          display: flex; align-items: flex-start; justify-content: space-between;
          border-bottom: 0.5pt solid var(--rule); padding-bottom: 6mm; margin-bottom: 6mm;
        }
        .brand { display: flex; gap: 10mm; align-items: center; }
        .logo { min-width: 40mm; }
        .brand-meta .eyebrow {
          display: inline-block; font-size: 8.5pt; letter-spacing: .12em; text-transform: uppercase;
          padding: 2pt 6pt; border: 0.6pt solid var(--brand); color: var(--brand); border-radius: 12px;
        }
        .brand-meta h1 { font-size: 20pt; line-height: 1.2; margin: 3mm 0 1mm; }
        .subtitle { color: var(--muted); margin: 0; }
        .doc-meta { text-align: right; font-size: 9pt; color: var(--muted); min-width: 42mm; }

        /* Section/Content styles */
        .section { margin: 6mm 0; }
        .lede { font-size: 12.75pt; }
        h2 { font-size: 14.5pt; margin: 0 0 2mm; }
        .h3 { font-size: 12.75pt; margin: 0 0 2mm; }
        .list { margin: 0; padding-left: 4.5mm; }
        .list li { margin: 1.2mm 0; }
        .list-tight { margin: 0; padding-left: 4.5mm; }
        .list-tight li { margin: .7mm 0; }
        .bullets { margin: 0; padding-left: 4.5mm; list-style: disc; }
        .bullets li { margin: .9mm 0; }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1.6mm 8mm; margin: 0; padding-left: 0; list-style: none; }

        /* Signature styles */
        .signatures h2 { margin-bottom: 1mm; }
        .micro { color: var(--muted); font-size: 9.5pt; margin-top: 0; }
        .sig-table { width: 100%; border-collapse: collapse; margin-top: 2mm; }
        .sig-table td { vertical-align: bottom; padding: 3mm 2mm 0 0; }
        .sig-table td.line { width: 45%; }
        .sig-table td.line.narrow { width: 20%; }
        .sig-table .label { color: var(--muted); font-size: 8.5pt; }

        /* Footer styles */
        .footer {
          border-top: 0.5pt solid var(--rule); margin-top: 8mm; padding-top: 4mm;
          display: flex; align-items: center; justify-content: space-between; font-size: 9.75pt;
        }
        .copyright { font-size: 9.75pt; }
        .muted { color: var(--muted); }
      `}</style>
    </>
  );
}
