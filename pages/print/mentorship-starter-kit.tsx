// pages/print/mentorship-starter-kit.tsx
import Head from "next/head";

export default function MentorshipStarterKitPrint() {
  return (
    <main className="print-wrap">
      <Head>
        <title>Mentorship Starter Kit</title>
        <meta name="robots" content="noindex" />
      </Head>

      {/* COVER */}
      <section className="page">
        <h1 className="title">Mentorship Starter Kit</h1>
        <p className="lead">Presence over performance. Craft over clout.</p>
        <div className="sigline">Abraham of London • abrahamoflondon.org</div>
      </section>

      {/* COVENANT */}
      <section className="page">
        <h2>Covenant</h2>
        <ul className="list">
          <li><strong>We commit</strong> to show up, tell the truth, and do the work.</li>
          <li><strong>Confidentiality:</strong> Chatham rules.</li>
          <li><strong>Cadence:</strong> Weekly/bi-weekly, 60–75 minutes.</li>
          <li><strong>Ends:</strong> When the mandate is met or either party withdraws with thanks.</li>
        </ul>
        <div className="sign">
          <div>Mentor: __________________  Date: __________</div>
          <div>Mentee: __________________  Date: __________</div>
        </div>
      </section>

      {/* 12-WEEK ARC */}
      <section className="page">
        <h2>12-Week Arc</h2>
        <ol className="list">
          <li><strong>Weeks 1–3 — Clarity</strong>: mandate, constraints, standards.</li>
          <li><strong>Weeks 4–6 — Craft</strong>: habits, reps, review loop.</li>
          <li><strong>Weeks 7–9 — Proof</strong>: ship artifacts, gather evidence.</li>
          <li><strong>Weeks 10–12 — Endurance</strong>: systems, hand-off, next horizon.</li>
        </ol>
      </section>

      {/* MEETING SCRIPT */}
      <section className="page">
        <h2>Meeting Script</h2>
        <ol className="list">
          <li><strong>Report (10m):</strong> what you did, what moved, blockers.</li>
          <li><strong>Review (20m):</strong> inspect artifacts (not promises).</li>
          <li><strong>Teach (20m):</strong> one pattern/tool, pressure-tested.</li>
          <li><strong>Assign (10m):</strong> one clear deliverable + deadline.</li>
          <li><strong>Record (5m):</strong> log in evidence tracker.</li>
        </ol>
      </section>

      {/* FIRST 3 SESSIONS */}
      <section className="page">
        <h2>First Three Sessions</h2>
        <h3>Week 1</h3>
        <p>Mandate, standards, constraints. Deliverable: one-page Mandate.</p>
        <h3>Week 2</h3>
        <p>Time budget & operating rhythm. Deliverable: Weekly Rhythm with hard edges.</p>
        <h3>Week 3</h3>
        <p>First artifact shipped. Deliverable: one finished micro-asset + review criteria.</p>
      </section>

      {/* EVIDENCE LOG (FORM) */}
      <section className="page">
        <h2>Evidence Log</h2>
        <table className="table">
          <thead>
            <tr><th>Date</th><th>Artifact/Action</th><th>Standard Tested</th><th>Outcome/Evidence</th><th>Next Step</th></tr>
          </thead>
          <tbody>
            {Array.from({ length: 14 }).map((_, i) => (
              <tr key={i}><td /><td /><td /><td /><td /></tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* QUESTION BANK */}
      <section className="page">
        <h2>Question Bank</h2>
        <ul className="list">
          <li>“If it were gone tomorrow, what would remain true?”</li>
          <li>“What is the smallest proof that this works?”</li>
          <li>“What constraint—if honoured—would raise quality?”</li>
        </ul>
      </section>

      {/* A6 HANDOUTS */}
      <section className="page">
        <h2>A6 Handouts — Two-Up</h2>
        <p><strong>Mentor Card:</strong> cadence, red-flag list, “say no” script.</p>
        <p><strong>Mentee Card:</strong> weekly checklist, submission format, review criteria.</p>
      </section>

      <style jsx global>{`
        @page { size: A4; margin: 18mm; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .print-wrap { font: 11.5pt/1.55 var(--font-sans, Inter, system-ui); color: #333; }
        .page { break-after: page; }
        .title { font: 700 28pt var(--font-serif, Georgia); color: var(--color-primary, #0B2E1F); margin: 0 0 4mm; }
        .lead { font: 400 12.5pt/1.7 var(--font-sans, Inter); max-width: 70ch; }
        .sigline { position: fixed; bottom: 18mm; left: 18mm; font-size: 9pt; color: #666; }
        h2 { font: 700 16pt var(--font-serif, Georgia); color: #0B2E1F; margin: 0 0 6mm; }
        h3 { font: 600 12pt var(--font-serif, Georgia); margin: 5mm 0 3mm; color: #0B2E1F; }
        .list { padding-left: 4.5mm; }
        .list li { margin: 2.5mm 0; }
        .table { width: 100%; border-collapse: collapse; font-size: 10pt; }
        .table th, .table td { border: 0.4pt solid #e5e5e5; padding: 3mm; }
        .table th { text-align: left; background: #fafaf5; color: #0B2E1F; }
      `}</style>
    </main>
  );
}
