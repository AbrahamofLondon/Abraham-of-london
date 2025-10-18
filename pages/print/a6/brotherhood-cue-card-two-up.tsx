import Head from "next/head";

export default function BrotherhoodCueCardTwoUp() {
  return (
    <>
      <Head><title>Brotherhood Cue Card — A6 Two-Up (Print)</title></Head>
      <main className="sheet">
        <section className="card">
          <h1>Brotherhood Cue Card</h1>
          <h2>Principles</h2>
          <ul>
            <li>Stand together.</li>
            <li>Build trust.</li>
            <li>Share burdens.</li>
          </ul>
          <h2>Actions</h2>
          <ul>
            <li>Connect weekly.</li>
            <li>Support goals.</li>
            <li>Celebrate wins.</li>
          </ul>
        </section>

        <section className="card">
          <h1>Brotherhood Cue Card</h1>
          <h2>Commitments</h2>
          <ul>
            <li>Be present.</li>
            <li>Stay honest.</li>
            <li>Act with integrity.</li>
          </ul>
          <h2>Check-ins</h2>
          <ul>
            <li>Weekly: progress.</li>
            <li>Monthly: alignment.</li>
            <li>Quarterly: vision.</li>
          </ul>
        </section>
      </main>

      <style jsx global>{`
        @page { size: A4; margin: 10mm; }
        html, body { background: white; }
        .sheet { width: 210mm; height: 297mm; display: grid; gap: 10mm; grid-template-rows: 1fr 1fr; }
        .card {
          box-sizing: border-box; width: 100%; height: 100%;
          border: .6pt solid #dadada; border-radius: 6pt; padding: 8mm;
          font: 10pt/1.45 var(--font-sans, "ui-sans-serif, system-ui, sans-serif");
          display: flex; flex-direction: column; justify-content: space-between;
        }
        h1 { font: 700 12pt/1.2 var(--font-serif, "Georgia, serif"); margin: 0 0 4mm; color: var(--color-primary); }
        h2 { font: 600 10pt/1.2 var(--font-serif, "Georgia, serif"); margin: 3mm 0 2mm; color: var(--color-primary); }
        ul { margin: 0; padding-left: 4mm; }
        li { margin: .8mm 0; }
        @media screen {
          body { padding: 2rem; background: #f6f6f6; }
          .sheet { background: #fff; box-shadow: 0 10px 30px rgba(0,0,0,.09); margin: 0 auto; }
        }
      `}</style>
    </>
  );
}