// pages/print/principles-for-my-son.tsx
import Head from "next/head";

export default function Print_PrinciplesForMySon() {
  return (
    <>
      <Head><title>Principles for My Son — Print</title></Head>
      <main className="sheet">
        <header className="title">
          <h1>Principles for My Son</h1>
          <p className="sub">Twelve standards. One father–son pledge. Reviewed weekly, renewed quarterly.</p>
        </header>

        <section className="cols">
          <ol className="standards">
            <li><strong>Presence.</strong> We show up—on time, prepared, attentive.</li>
            <li><strong>Truth.</strong> We tell the truth without spin; we confess fast, not last.</li>
            <li><strong>Work.</strong> We finish what we start and keep small promises.</li>
            <li><strong>Stewardship.</strong> We budget, save, give, and repair what we own.</li>
            <li><strong>Courage.</strong> We do hard, right things—especially when unseen.</li>
            <li><strong>Honor.</strong> We dignify women, elders, and authorities; we protect the weak.</li>
            <li><strong>Speech.</strong> We speak cleanly—no gossip, slander, or coarse talk.</li>
            <li><strong>Learning.</strong> We read, ask, practice; we receive correction with humility.</li>
            <li><strong>Health.</strong> We sleep, train, eat simply, and keep our devices in their place.</li>
            <li><strong>Craft.</strong> We build things that work and are worth keeping.</li>
            <li><strong>Service.</strong> We lift burdens at home first, then beyond the door.</li>
            <li><strong>Faith.</strong> We listen for God, obey promptly, and stay planted in truth.</li>
          </ol>

          <div className="rhythms">
            <h2>Daily Rhythm</h2>
            <ul>
              <li><strong>Morning:</strong> Scripture + 5 min silent prayer; bed made; device parked.</li>
              <li><strong>Work/School:</strong> One thing done to completion; one kindness given.</li>
              <li><strong>Evening:</strong> Debrief: truth, one win, one next step. Read 15 min.</li>
            </ul>

            <h2>Weekly Touchpoints</h2>
            <ul>
              <li><strong>Sunday Check-in (20 min):</strong> Review standards; pick one focus.</li>
              <li><strong>Skill Block (60 min):</strong> Hands + head: a skill, a book, a task.</li>
              <li><strong>Service (30–60 min):</strong> A small act beyond ourselves.</li>
            </ul>
          </div>
        </section>

        <section className="pledge">
          <h2>Father–Son Pledge</h2>
          <p>
            We commit to these standards with courage and joy. We will correct in love, receive correction with
            humility, and keep small promises over time. Our name will be known for presence, truth, and service.
          </p>
          <div className="signatures">
            {["Father", "Son"].map((role) => (
              <div key={role} className="sig">
                <div className="line" />
                <div className="label">{role} — Name</div>
                <div className="line" />
                <div className="label">Signature</div>
                <div className="line" />
                <div className="label">Date</div>
              </div>
            ))}
          </div>
          <p className="footer-note">Review: quarterly • Small promises, kept.</p>
        </section>
      </main>

      <style jsx global>{`
        @page { size: A4; margin: 12mm; }
        html, body { background: white; }
        .sheet { width: 210mm; min-height: 273mm; margin: 0 auto; font-family: var(--font-sans, ui-sans-serif); color: #1a1a1a; }
        .title { text-align: center; margin-bottom: 6mm; }
        h1 { font-family: var(--font-serif, Georgia); font-weight: 700; font-size: 20pt; margin: 0 0 2mm; }
        .sub { color: #555; font-size: 10pt; margin: 0; }
        .cols { display: grid; grid-template-columns: 1.3fr 1fr; gap: 8mm; align-items: start; }
        .standards { margin: 0; padding-left: 5mm; font-size: 10.5pt; line-height: 1.5; }
        .standards li { margin: 2mm 0; }
        .rhythms h2, .pledge h2 { font-family: var(--font-serif, Georgia); font-weight: 700; font-size: 12pt; margin: 0 0 2mm; }
        .rhythms ul { margin: 0 0 4mm; padding-left: 4mm; font-size: 10.5pt; }
        .pledge { margin-top: 8mm; }
        .pledge p { font-size: 10.5pt; margin: 0 0 5mm; }
        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 6mm; }
        .sig { border: 0.6pt solid #e2e2e2; border-radius: 6pt; padding: 5mm; }
        .line { height: 6mm; border-bottom: 0.6pt solid #cfcfcf; margin-bottom: 2mm; }
        .label { font-size: 8.5pt; color: #667; margin-bottom: 3mm; }
        .footer-note { color: #667; font-size: 9.5pt; margin-top: 4mm; }
        @media screen { body { background: #f6f6f6; padding: 2rem; } .sheet { background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.08); padding: 10mm; } }
      `}</style>
    </>
  );
}
