// pages/print/a6/principles-for-my-son-cue-card-two-up.tsx
import Head from "next/head";

const Front = () => (
  <section className="card">
    <h1>Principles — The Six (Front)</h1>
    <ol>
      <li><strong>Presence:</strong> Show up—on time, eyes up.</li>
      <li><strong>Truth:</strong> Confess fast; no spin.</li>
      <li><strong>Work:</strong> Finish one thing daily.</li>
      <li><strong>Steward:</strong> Budget, save, give.</li>
      <li><strong>Honor:</strong> Dignify women & elders.</li>
      <li><strong>Courage:</strong> Do hard, right things.</li>
    </ol>
  </section>
);

const Back = () => (
  <section className="card">
    <h1>Principles — The Six (Back)</h1>
    <ol start={7}>
      <li><strong>Speech:</strong> No gossip or slander.</li>
      <li><strong>Learning:</strong> Read, ask, practice.</li>
      <li><strong>Health:</strong> Sleep, train, simple food.</li>
      <li><strong>Craft:</strong> Build things that last.</li>
      <li><strong>Service:</strong> Lift burdens at home first.</li>
      <li><strong>Faith:</strong> Listen, obey, stay planted.</li>
    </ol>
  </section>
);

export default function Print_PrinciplesCueCardTwoUp() {
  return (
    <>
      <Head><title>Principles for My Son — Cue Card (A6 Two-Up)</title></Head>
      <main className="sheet">
        <Front /><Back />
      </main>

      <style jsx global>{`
        @page { size: A4; margin: 10mm; }
        html, body { background: white; }
        .sheet { width: 210mm; height: 297mm; display: grid; gap: 10mm; grid-template-rows: 1fr 1fr; }
        .card {
          box-sizing: border-box; width: 100%; height: 100%;
          border: .6pt solid #dadada; border-radius: 6pt; padding: 8mm;
          font-family: var(--font-sans, ui-sans-serif);
          display: flex; flex-direction: column; justify-content: space-between;
        }
        h1 { font: 700 12pt/1.2 var(--font-serif, Georgia); margin: 0 0 4mm; color: #1a1a1a; }
        ol { margin: 0; padding-left: 4mm; font-size: 10.5pt; }
        li { margin: .9mm 0; }
        @media screen {
          body { padding: 2rem; background: #f6f6f6; }
          .sheet { background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.09); margin: 0 auto; }
        }
      `}</style>
    </>
  );
}
