// pages/print/fathering-without-fear-teaser.tsx
import Head from "next/head";

export default function FatheringTeaserA4() {
  return (
    <main className="print-root">
      <Head>
        <title>Fathering Without Fear — Teaser (A4)</title>
        <meta name="robots" content="noindex" />
        <style>{`
          @page { size: A4; margin: 12mm; }
          @media print { html, body { background: white !important; } }
          html, body { background: var(--color-secondary); }
          .print-root {
            font-family: var(--font-sans, ui-sans-serif), system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
            color: var(--color-on-secondary);
            line-height: 1.55;
          }
          h1,h2,h3 {
            font-family: var(--font-serif, Georgia), Georgia, Cambria, "Times New Roman", Times, serif;
            color: var(--color-primary);
          }
          .page {
            page-break-after: always;
          }
          .page:last-child { page-break-after: auto; }

          .rule {
            height: 2px;
            width: 72px;
            background: var(--color-accent, #d4af37);
            border-radius: 2px;
          }
          .eyebrow {
            display:inline-block;
            padding:.25rem .6rem;
            border:1px solid var(--color-lightGrey);
            border-radius: 999px;
            font-size: .72rem;
            letter-spacing:.06em;
            text-transform:uppercase;
            color: color-mix(in oklab, var(--color-on-secondary) 80%, black);
          }
          .lede { font-size: 1.05rem; color: color-mix(in oklab, var(--color-on-secondary) 92%, black); }
          .small { font-size:.85rem; color: color-mix(in oklab, var(--color-on-secondary) 70%, black); }
          .callout {
            border-left:3px solid var(--color-lightGrey);
            padding-left:12px;
            color: color-mix(in oklab, var(--color-on-secondary) 90%, black);
          }
          .section { margin-top: 14mm; }
        `}</style>
      </Head>

      {/* PAGE 1 — Cover */}
      <section className="page" aria-label="Cover">
        <div style={{marginTop:"10mm"}}>
          <span className="eyebrow">Teaser</span>
          <h1 style={{fontSize:"2.2rem", lineHeight:1.1, margin:"10mm 0 2mm"}}>
            FATHERING WITHOUT FEAR
          </h1>
          <h2 style={{fontSize:"1.1rem", margin:"0 0 8mm"}}>
            A Memoir That Defies Every Boundary
          </h2>
          <div className="rule" />

          <p className="lede" style={{marginTop:"10mm"}}>
            Win the only battle you fully control — the one inside your chest. A field guide for fathers under pressure:
            prayer and paperwork; courage and cadence; legacy over litigation.
          </p>

          <div className="section">
            <div className="callout">
              <p style={{margin:0}}>
                “If You give me my life back, I’ll serve You until I’m seventy-five.” — the prayer of an eight-year-old
                who died… and came back. Some promises cost more than you know.
              </p>
            </div>
          </div>

          <p className="small" style={{marginTop:"45mm"}}>
            © Abraham of London — Preview edition. Not for resale.
          </p>
        </div>
      </section>

      {/* PAGE 2 — Author’s Reflection & Dedication */}
      <section className="page" aria-label="Author">
        <h2 style={{fontSize:"1.4rem", marginTop:0}}>Author’s Reflection</h2>
        <p>
          I may not know your pain. I may not have walked your roads. But I have walked a path many cannot imagine.
          God always has a purpose and a plan—for all people, in all places. If we dare to trust His love, power, and
          wisdom, He is able to do exceedingly, abundantly above all we ask or even imagine. That is why… something
          always happens.
        </p>

        <div className="section">
          <h3 style={{fontSize:"1.15rem"}}>Dedication</h3>
          <p>
            To the memory of my father, David Akindele Adaramola — a teacher in Ayetoro who welcomed the gift of
            triplets and never scorned the battle. From day one, he fought for us and gave his life to help others.
          </p>
          <p>
            To every friend and family member who became a blessing of love and hope. May we make the world better,
            one person at a time, by making something happen for one another.
          </p>
        </div>
      </section>

      {/* PAGE 3 — Retailer Description */}
      <section className="page" aria-label="Description">
        <h2 style={{fontSize:"1.4rem", marginTop:0}}>Retailer Description</h2>
        <p>
          <em>Fathering Without Fear</em> is the true story of a miracle child from 1977 Lagos who grows into a father
          fighting for his British son in London’s legal labyrinth. Through Lagos, Akure, and London, the through-line
          is loss, mercy, Scripture, and paperwork—grit made practical.
        </p>
        <ul style={{marginLeft:"5mm"}}>
          <li>Themes: fatherhood under pressure • truth vs. narrative • prayer + paperwork • legacy over litigation</li>
          <li>Read if you’re: a father in the storm • a believer wrestling with sovereignty • an advocate near the courts</li>
        </ul>

        <div className="section">
          <h3 style={{fontSize:"1.15rem"}}>Chapter Snapshot (Select)</h3>
          <ul style={{marginLeft:"5mm"}}>
            <li>Ch. 1 — The Miracle Children from the God of Abraham</li>
            <li>Ch. 11 — David Never Came Back</li>
            <li>Ch. 17 — A House Built on Papers and Prayers</li>
            <li>Ch. 18 — The Cost of Being Good</li>
          </ul>
        </div>
      </section>

      {/* PAGE 4 — Excerpt */}
      <section className="page" aria-label="Excerpt">
        <h2 style={{fontSize:"1.4rem", marginTop:0}}>Excerpt — Ch. 18 “The Cost of Being Good”</h2>
        <p>
          The strange thing about suffering is that it doesn’t always announce itself with noise. Sometimes, it arrives
          quietly—through policies, delays, bureaucratic silence. After the marriage ended and fatherhood began, I faced
          a new kind of enemy: the state’s indifference…
        </p>
        <p>
          People say the system is broken. I say: the system works exactly as designed—for men like me, it delays until
          you disappear. But I did not disappear. I wrote. I prayed. I fought. Because being a good man will cost you.
          But it must not destroy you.
        </p>

        <div className="section">
          <div className="rule" />
          <p className="small" style={{marginTop:"6mm"}}>
            Read opening chapters free • Join the launch list • Share this with one father under pressure. <br />
            abrahamoflondon.org/downloads
          </p>
        </div>
      </section>
    </main>
  );
}
