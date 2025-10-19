// pages/print/family-altar-liturgy.tsx
import Head from "next/head";

export default function Print_FamilyAltarLiturgy() {
  return (
    <>
      <Head><title>Family Altar Liturgy — 2-Page Print</title></Head>
      <main className="sheet">
        <header className="title">
          <h1>Family Altar Liturgy</h1>
          <p className="sub">Short. Kind. Repeatable. Suited for night or week’s beginning.</p>
        </header>

        <section className="grid">
          <div className="block">
            <h2>Opening (Leader)</h2>
            <p><em>We gather to remember God’s love, receive His peace, and commit to one good work.</em></p>

            <h3>Call & Response</h3>
            <ul>
              <li><strong>Leader:</strong> The Lord is near.</li>
              <li><strong>All:</strong> We are not afraid.</li>
              <li><strong>Leader:</strong> His truth is our path.</li>
              <li><strong>All:</strong> We will walk in it.</li>
            </ul>

            <h3>Scripture (1–3 verses)</h3>
            <p>Read slowly. Pause. Ask: “What word or phrase stands out?” One sentence each.</p>

            <h3>Thanksgiving</h3>
            <p>I thank God today for… (children first, then adults)</p>
          </div>

          <div className="block">
            <h2>Intercessions</h2>
            <ul>
              <li>Family: health, work, learning, relationships.</li>
              <li>Neighbors & friends: one name each; one practical help this week.</li>
              <li>Leaders & church: courage, wisdom, integrity.</li>
            </ul>

            <h3>The Lord’s Prayer</h3>
            <p><em>Our Father in heaven…</em></p>

            <h2>Micro-Commitments</h2>
            <ul>
              <li><strong>Truth:</strong> One honest action I will take tomorrow is…</li>
              <li><strong>Service:</strong> One small burden I can lift is…</li>
              <li><strong>Presence:</strong> One device boundary I will keep is…</li>
            </ul>

            <h3>Blessing (Leader)</h3>
            <p><em>May the Lord bless you and keep you. Be strong and kind. Amen.</em></p>
          </div>
        </section>

        <footer className="note">Keep under 12 minutes • Children go first • End with one concrete step.</footer>
      </main>

      <style jsx global>{`
        @page { size: A4; margin: 12mm; }
        html, body { background: white; }
        .sheet { width: 210mm; min-height: 273mm; margin: 0 auto; font-family: var(--font-sans, ui-sans-serif); color: #1a1a1a; }
        .title { text-align: center; margin-bottom: 6mm; }
        h1 { font-family: var(--font-serif, Georgia); font-weight: 700; font-size: 20pt; margin: 0 0 2mm; }
        .sub { color: #555; font-size: 10pt; margin: 0; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7mm; }
        .block h2 { font-family: var(--font-serif, Georgia); font-weight: 700; font-size: 12pt; margin: 0 0 2mm; }
        .block h3 { font-family: var(--font-serif, Georgia); font-weight: 600; font-size: 11pt; margin: 3mm 0 1.5mm; }
        .block p, .block ul { margin: 0 0 3mm; }
        .block ul { padding-left: 4mm; font-size: 10.5pt; line-height: 1.5; }
        .note { color: #667; font-size: 9.5pt; margin-top: 8mm; text-align: center; }
        @media screen { body { background: #f6f6f6; padding: 2rem; } .sheet { background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.08); padding: 10mm; } }
      `}</style>
    </>
  );
}
