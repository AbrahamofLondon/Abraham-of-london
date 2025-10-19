// pages/print/scripture-track-john14.tsx
import Head from "next/head";

export default function Print_ScriptureTrack_John14() {
  return (
    <>
      <Head><title>Scripture Track — John 14 (Print)</title></Head>
      <main className="sheet">
        <header className="title">
          <h1>Scripture Track — John 14</h1>
          <p className="sub">Assurance • Obedience • The Helper • Peace</p>
        </header>

        <section className="grid">
          <div className="block">
            <h2>How to Run</h2>
            <ul>
              <li><strong>Daily (10–15 min):</strong> Read the text; note one obedience step.</li>
              <li><strong>Weekly (45 min):</strong> Share truth, one win, one next step. Pray names.</li>
              <li><strong>Family:</strong> Read a verse aloud; one sentence prayer each.</li>
            </ul>
          </div>

          <div className="block">
            <h2>Week 1 — Assurance (Jn 14:1–6)</h2>
            <ul>
              <li><strong>Memory:</strong> John 14:6</li>
              <li><strong>Prompt:</strong> Where am I troubled? What would trust look like today?</li>
              <li><strong>Practice:</strong> Name a fear; replace it with a promise.</li>
            </ul>
          </div>

          <div className="block">
            <h2>Week 2 — Obedience (Jn 14:15–21)</h2>
            <ul>
              <li><strong>Memory:</strong> John 14:15</li>
              <li><strong>Prompt:</strong> Which instruction have I delayed?</li>
              <li><strong>Practice:</strong> Same-day obedience on one small step.</li>
            </ul>
          </div>

          <div className="block">
            <h2>Week 3 — The Helper (Jn 14:16–18,26)</h2>
            <ul>
              <li><strong>Memory:</strong> John 14:26</li>
              <li><strong>Prompt:</strong> Where do I need wise help beyond my strength?</li>
              <li><strong>Practice:</strong> Ask the Spirit for counsel; seek godly advice.</li>
            </ul>
          </div>

          <div className="block">
            <h2>Week 4 — Peace Under Pressure (Jn 14:27,31)</h2>
            <ul>
              <li><strong>Memory:</strong> John 14:27</li>
              <li><strong>Prompt:</strong> What robs my peace? What boundary restores it?</li>
              <li><strong>Practice:</strong> Phone off for one hour; pray for someone anxious.</li>
            </ul>
          </div>

          <div className="block">
            <h2>Family Reflection (10 min)</h2>
            <ol>
              <li>What did we hear? One sentence each.</li>
              <li>What will we do? One step each.</li>
              <li>Who will we serve this week? Name a person.</li>
            </ol>
          </div>
        </section>

        <footer className="note">Cadence: daily read • weekly share • one concrete step.</footer>
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
        .block ul, .block ol { margin: 0; padding-left: 4mm; font-size: 10.5pt; line-height: 1.5; }
        .note { color: #667; font-size: 9.5pt; margin-top: 8mm; text-align: center; }
        @media screen { body { background: #f6f6f6; padding: 2rem; } .sheet { background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.08); padding: 10mm; } }
      `}</style>
    </>
  );
}
