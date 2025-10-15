import Head from "next/head";

export default function LeadersCueCardTwoUp() {
  return (
    <>
      <Head>
        <title>Leader’s Cue Card — A6 Two-Up (Print)</title>
      </Head>
      <main>
        <section className="sheet">
          <div className="card">
            <h1>Leader’s Cue Card</h1>
            <ul>
              <li>Clarify mandate</li>
              <li>Protect standards</li>
              <li>Remove friction</li>
              <li>Guard cadence</li>
            </ul>
          </div>
          <div className="card">
            <h1>Leader’s Cue Card</h1>
            <ul>
              <li>Clarify mandate</li>
              <li>Protect standards</li>
              <li>Remove friction</li>
              <li>Guard cadence</li>
            </ul>
          </div>
        </section>
      </main>
      <style jsx global>{`
        @page { size: A4 landscape; margin: 8mm; }
        html, body { background: #fff; color: #000; }
        .sheet {
          width: 277mm;  /* A4 landscape inner width (297-2*margin approx) */
          height: 189mm; /* A4 landscape inner height (210-2*margin approx) */
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8mm;
        }
        .card {
          box-sizing: border-box;
          width: 129mm;   /* A6 with safe padding */
          height: 182mm;
          padding: 8mm;
          border: 0.3mm solid #e5e5e5;
          border-radius: 4mm;
          display: flex;
          flex-direction: column;
          gap: 4mm;
        }
        h1 {
          margin: 0;
          font-family: "Cormorant Garamond", Georgia, serif;
          font-size: 18pt;
          letter-spacing: 0.2pt;
        }
        ul { margin: 0; padding-left: 4mm; font-size: 11pt; line-height: 1.4; }
        li { margin: 1.5mm 0; }
        @media screen {
          body { padding: 24px; background: #f7f7f7; }
          .sheet { background: white; box-shadow: 0 4px 30px rgba(0,0,0,.08); padding: 8mm; }
        }
      `}</style>
    </>
  );
}
