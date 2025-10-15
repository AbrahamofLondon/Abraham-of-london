import Head from "next/head";

export default function LeadersCueCardTwoUp() {
  return (
    <html lang="en">
      <Head>
        <title>Leader’s Cue Card — A6 Two-Up (Print)</title>
        <meta name="description" content="Leader’s Cue Card (A6 Two-Up) for print." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{`
          @page { size: A4; margin: 10mm; }
          @media print { html, body { background: white; } }
          :root {
            --forest: #0B2E1F;
            --charcoal: #333333;
            --light: #e5e5e5;
            --gold: #D4AF37;
          }
          html, body { height: 100%; }
          body {
            font-family: var(--font-sans, Inter, ui-sans-serif, system-ui, Arial);
            color: var(--charcoal);
            margin: 0;
          }
          .sheet {
            width: 100%;
            height: 100%;
            display: grid;
            grid-template-rows: 1fr 1fr;
            gap: 10mm;
            padding: 0;
            box-sizing: border-box;
          }
          .card {
            position: relative;
            border: 1px solid var(--light);
            border-radius: 6mm;
            padding: 8mm;
            display: grid;
            grid-template-rows: auto 1fr auto;
          }
          h1 {
            margin: 0 0 3mm 0;
            font-family: var(--font-serif, 'Cormorant Garamond', Georgia, serif);
            font-size: 16pt;
            line-height: 1.2;
            color: var(--forest);
            letter-spacing: -0.2px;
          }
          .eyebrow {
            display: inline-block;
            font-size: 9pt;
            letter-spacing: .12em;
            text-transform: uppercase;
            color: #666;
            border: 1px solid var(--light);
            border-radius: 999px;
            padding: 2px 8px;
            margin-bottom: 4mm;
          }
          ul { margin: 0; padding-left: 4mm; }
          li { margin: 1.5mm 0; font-size: 10.5pt; }
          .rule { height: 1px; background: var(--gold); opacity: .75; margin: 6mm 0; }
          .foot {
            display: flex; justify-content: space-between; align-items: baseline;
            font-size: 9pt; color: #666;
          }
          .brand { color: var(--forest); font-weight: 600; }
          /* Simple crop marks */
          .card:before, .card:after { content: ""; position: absolute; width: 6mm; height: 6mm; border-color: #999; opacity: .5; }
          .card:before { top: -2mm; left: -2mm; border-top: .3mm solid; border-left: .3mm solid; }
          .card:after { bottom: -2mm; right: -2mm; border-bottom: .3mm solid; border-right: .3mm solid; }
          @media screen {
            body { background: #f5f5f5; }
            .preview { max-width: 210mm; margin: 12mm auto; background: white; padding: 10mm; box-shadow: 0 10px 30px rgba(0,0,0,.08); }
          }
        `}</style>
      </Head>
      <body>
        <main className="preview">
          <section className="sheet print-ready" aria-label="A4 sheet with two A6 cards">
            {/* Card 1 */}
            <article className="card">
              <span className="eyebrow">Leaders</span>
              <h1>Leader’s Cue Card</h1>
              <div>
                <ul>
                  <li>Clarify mandate → who, what, why, when.</li>
                  <li>Remove friction → one constraint at a time.</li>
                  <li>Guard the standard → private order before public output.</li>
                  <li>Decisions in writing → date, owner, effect.</li>
                  <li>Presence over performance → people first.</li>
                </ul>
                <div className="rule" />
                <ul>
                  <li>Cadence: weekly review, daily check-ins.</li>
                  <li>Comms: clear, kind, and complete.</li>
                  <li>Stewardship: budget, risk, reputations.</li>
                </ul>
              </div>
              <footer className="foot">
                <span className="brand">Abraham of London</span>
                <span>A6 • Print</span>
              </footer>
            </article>

            {/* Card 2 (duplicate for two-up) */}
            <article className="card" aria-hidden="true">
              <span className="eyebrow">Leaders</span>
              <h1>Leader’s Cue Card</h1>
              <div>
                <ul>
                  <li>Clarify mandate → who, what, why, when.</li>
                  <li>Remove friction → one constraint at a time.</li>
                  <li>Guard the standard → private order before public output.</li>
                  <li>Decisions in writing → date, owner, effect.</li>
                  <li>Presence over performance → people first.</li>
                </ul>
                <div className="rule" />
                <ul>
                  <li>Cadence: weekly review, daily check-ins.</li>
                  <li>Comms: clear, kind, and complete.</li>
                  <li>Stewardship: budget, risk, reputations.</li>
                </ul>
              </div>
              <footer className="foot">
                <span className="brand">Abraham of London</span>
                <span>A6 • Print</span>
              </footer>
            </article>
          </section>
        </main>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (async () => {
                if (document.fonts && document.fonts.ready) { try { await document.fonts.ready; } catch(e){} }
                window.dispatchEvent(new Event('aol:print-ready'));
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}
