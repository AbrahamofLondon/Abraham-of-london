/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */ // <-- Added to silence the Next.js image warning
// pages/print/fathering-without-fear-teaser-mobile.tsx
import Head from "next/head";

const COVER = "/assets/images/books/fathering-without-fear-cover.jpg";
const BRAND = "© 2025 Abraham of London • abrahamoflondon.org";

export default function FatheringWithoutFearTeaserA6() {
  return (
    <>
      <Head>
        <title>Fathering Without Fear — Teaser (A6 Mobile)</title>
        <meta name="robots" content="noindex" />
      </Head>

      <main className="m-root">
        {/* Cover */}
        <section className="m-page m-cover text-cream">
          {/* The <img> that was triggering the warning */}
          <img src={COVER} alt="" className="m-bg" />
          <div className="m-veil" />
          <div className="m-pad">
            <p className="m-eyebrow">FATHERING WITHOUT FEAR</p>
            <h1 className="m-title">A Memoir That Defies Every Boundary</h1>
            <p className="m-tag">They thought they knew the story. He chose to stay.</p>
            <p className="m-foot">{BRAND}</p>
          </div>
        </section>

        {/* Condensed pages */}
        <section className="m-page">
          <h2 className="m-h">Author’s Reflection</h2>
          <p>I may not know your pain… something always happens.</p>
          <h2 className="m-h mt">Dedication</h2>
          <p>To the memory of my father… make something happen for one another.</p>
        </section>

        <section className="m-page">
          <h2 className="m-h">Back Cover</h2>
          <p className="m-pull">“If You give me my life back, I’ll serve You until I’m seventy-five.”</p>
          <p>The prayer of an eight-year-old… Some promises cost more than you know.</p>
          <ul className="m-list">
            <li><strong>Miracle triplets.</strong> Born at 27 weeks… legend has a price.</li>
            <li><strong>Lagos. Akure. London.</strong> Three fires; not everyone survived.</li>
            <li>“Something always happens.” A brother’s words became prophecy.</li>
          </ul>
          <ul className="m-dash">
            <li>Grandmother who spoke to spirits.</li>
            <li>Sister’s death that opened visions.</li>
            <li>Romance that nearly killed him.</li>
            <li>Marriage that tried to erase him.</li>
            <li>A son he still fights to father.</li>
            <li>A brother whose last words echo.</li>
          </ul>
        </section>

        <section className="m-page">
          <p className="m-lead">“Where was God when David died?” … system designed to make fathers disappear.</p>
          <p>This isn’t survival. It’s resurrection. When the world says “finished,” grace says, “Something always happens.”</p>
          <div className="m-card">
            <p className="m-card-h">ABRAHAM OF LONDON</p>
            <p>Miracle child. Marked man. Devoted father. The brother who remembers. The father who refuses to disappear.</p>
          </div>
        </section>

        <section className="m-page">
          <h2 className="m-h">Retailer Description</h2>
          <p>True story spanning Lagos, Akure, London… blueprint for men under pressure. Documentation, boundaries, legacy over litigation.</p>
          <p>If you’ve been told to disappear, this is your brother at the door… grace is louder.</p>
        </section>

        <section className="m-page">
          <h2 className="m-h">One-Page Synopsis</h2>
          <p>Miracle child → strategist and father; denied work; legal maze; fighting to father.</p>
          <p>Chooses structure over spectacle; presence over performance; strategy for legacy.</p>
          <p>He stayed by grace. Because something always happens—so does he.</p>
        </section>

        <section className="m-page">
          <h2 className="m-h">Excerpt — Ch. 18</h2>
          <p>Quiet suffering: delays and silence; nearly two years unable to work… He did not disappear.</p>
          <p>Good men must stop disappearing—even when systems want them to.</p>
          <hr className="m-rule" />
          <h2 className="m-h">Reader Promise</h2>
          <ul className="m-list">
            <li>Language for pain.</li>
            <li>A father’s blueprint.</li>
            <li>A stubborn, earned hope.</li>
          </ul>
          <div className="m-call">You are not a case number. When fear says “stop,” grace says, “Something always happens.”</div>
          <p className="m-cta">
            Read opening chapters • Share with a father under pressure • Join the launch list<br />
            Prefer offline? Get the print-ready teaser at <strong>abrahamoflondon.org/downloads</strong>
          </p>
        </section>
      </main>

      <style jsx global>{`
        @page { size: A6; margin: 10mm; }
        .m-root { font-family: var(--font-serif, Georgia, Cambria, Times, serif); color: var(--color-on-secondary); }
        .m-page { page-break-after: always; min-height: calc(148mm - 20mm); }
        .m-cover { position: relative; }
        .m-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .92; }
        .m-veil { position: absolute; inset: 0; background: radial-gradient(60% 60% at 50% 60%, rgba(212,175,55,.55), transparent 65%), rgba(0,0,0,.38); }
        .m-pad { position: relative; padding: 14mm 10mm; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; }
        .m-eyebrow { letter-spacing: .14em; text-transform: uppercase; color: var(--color-accent); font-size: 9pt; margin-bottom: 2mm; }
        .m-title { font-size: 20pt; line-height: 1.05; }
        .m-tag { margin-top: 3mm; font-size: 9pt; opacity: .9; }
        .m-foot { margin-top: 6mm; font-size: 8pt; opacity: .85; }
        .m-h { font-size: 12pt; color: var(--color-primary); }
        .mt { margin-top: 4mm; }
        .m-lead { font-size: 10.5pt; line-height: 1.6; }
        .m-pull { border-left: 2px solid var(--color-accent); padding-left: 3mm; color: var(--color-primary); font-style: italic; }
        .m-list { margin: 3mm 0; padding-left: 4.5mm; }
        .m-dash { margin: 2mm 0; padding-left: 3.5mm; list-style: "— "; }
        .m-card { border: 1px solid var(--color-lightGrey); background: var(--color-warmWhite); border-radius: 6px; padding: 4mm; margin-top: 3mm; }
        .m-card-h { font-weight: 700; color: var(--color-primary); margin-bottom: 1.5mm; letter-spacing: .02em; }
        .m-rule { border: none; height: 2px; background: linear-gradient(to right, color-mix(in oklab, var(--color-accent) 85%, #fff), transparent 65%); margin: 4mm 0; }
        .m-call { border: 1px solid var(--color-accent); background: color-mix(in oklab, var(--color-accent) 7%, white); border-radius: 6px; padding: 3mm; margin-top: 3mm; }
        .m-cta { margin-top: 3mm; font-size: 9pt; }
      `}</style>
    </>
  );
}