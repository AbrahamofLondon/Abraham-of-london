// pages/print/fathering-without-fear-teaser-mobile.tsx
import Head from "next/head";

export default function FatheringTeaserMobile() {
  return (
    <main className="mobile-root">
      <Head>
        <title>Fathering Without Fear — Teaser (Mobile)</title>
        <meta name="robots" content="noindex" />
        <style>{`
          /* 1080×1920 portrait canvas for PDF */
          @page { size: 1080px 1920px; margin: 48px; }
          html, body { background: var(--color-secondary); }
          @media print { html, body { background: white !important; } }

          .mobile-root {
            font-family: var(--font-sans, ui-sans-serif), system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
            color: var(--color-on-secondary);
            line-height: 1.6;
          }
          h1,h2 {
            font-family: var(--font-serif, Georgia), Georgia, Cambria, "Times New Roman", Times, serif;
            color: var(--color-primary);
          }
          .rule { height:2px; width:64px; background: var(--color-accent); border-radius:2px; }
          .eyebrow { font-size:.7rem; letter-spacing:.06em; text-transform:uppercase; opacity:.8; }
          .section { margin-top: 28px; }
          .small { font-size:.9rem; opacity:.8; }
        `}</style>
      </Head>

      <header>
        <div className="eyebrow">Teaser</div>
        <h1 style={{fontSize:"2.2rem", lineHeight:1.1, margin:"6px 0 4px"}}>FATHERING WITHOUT FEAR</h1>
        <h2 style={{fontSize:"1.1rem", margin:"0 0 16px"}}>A Memoir That Defies Every Boundary</h2>
        <div className="rule" />
      </header>

      <section className="section">
        <p>
          Win the only battle you fully control — the one inside your chest. A field guide for fathers under pressure:
          prayer and paperwork; courage and cadence; legacy over litigation.
        </p>
        <p style={{borderLeft:"3px solid var(--color-lightGrey)", paddingLeft:12}}>
          “If You give me my life back, I’ll serve You until I’m seventy-five.” Some promises cost more than you know.
        </p>
      </section>

      <section className="section">
        <h2 style={{fontSize:"1.2rem", margin:0}}>Why read this</h2>
        <ul style={{margin:"6px 0 0 18px"}}>
          <li>Language for pain when life hits too hard</li>
          <li>A father’s blueprint: prayer + paperwork</li>
          <li>Stubborn, quiet hope that endures</li>
        </ul>
      </section>

      <footer className="section">
        <div className="rule" />
        <p className="small" style={{marginTop:10}}>
          Read opening chapters free • Join the launch list • Share this with one father under pressure. <br />
          abrahamoflondon.org/downloads
        </p>
      </footer>
    </main>
  );
}
