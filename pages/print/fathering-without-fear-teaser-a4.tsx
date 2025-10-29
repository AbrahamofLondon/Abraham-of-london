/* eslint-disable react/no-unescaped-entities */
/* eslint-disable @next/next/no-img-element */
// pages/print/fathering-without-fear-teaser-mobile.tsx

import Head from "next/head";
import React from "react";
import EmbossedBrandMark from "@/components/print/EmbossedBrandMark";
import EmbossedSign from "@/components/print/EmbossedSign";



 export const frontmatter = {
  title: "Fathering-Without-Fear"
  slug: "fathering-without-fear"
  date: "2024-10-22"
  author: "AbrahamofLondon"
  readTime: "6 min"
  category: "Note"
  type: "Download"
};

const COVER = "/assets/images/books/fathering-without-fear-cover.jpg";

export default function FatheringWithoutFearTeaserA6() {
  const currentYear = new Date().getFullYear();
  return (
    <>
      <Head>
        <title>Fathering Without Fear — Teaser (A6 Mobile)</title> {/* FIXED: Replaced '—' with '—' */}
        <meta name="robots" content="noindex" />
      </Head>

      <main className="m-root">
        {/* Cover */}
        <section className="m-page m-cover text-cream relative">
          {/* Branding: Logo Top Left on Cover */}
          <div className="absolute top-[10mm] left-[10mm] z-10">
            {/* FIXED: Re-added EmbossedBrandMark tag and corrected closure */}
            <EmbossedBrandMark
              src="/assets/images/abraham-logo.jpg"
              alt="Abraham of London Logo"
              width={30}
              height={30}
              effect="emboss"
            />
          </div>

          <img src={COVER} alt="" className="m-bg" />
          <div className="m-veil" />
          <div className="m-pad">
            <p className="m-eyebrow">FATHERING WITHOUT FEAR</p>
            <h1 className="m-title">A Memoir That Defies Every Boundary</h1>
            <p className="m-tag">They thought they knew the story. He chose to stay.</p>
            <p className="m-foot">© {currentYear} Abraham of London</p> {/* FIXED: Replaced '©' with '©' */}
          </div>
        </section>

        {/* Condensed pages */}
        <section className="m-page">
          <h2 className="m-h">Author's Reflection</h2> {/* FIXED: Replaced ''' with standard apostrophe */}
          <p>I may not know your pain… something always happens.</p>
          <h2 className="m-h mt">Dedication</h2>
          <p>To the memory of my father… make something happen for one another.</p>
        </section>

        <section className="m-page">
          <h2 className="m-h">Back Cover</h2>
          <p className="m-pull">"If You give me my life back, I'll serve You until I'm seventy-five."</p> {/* FIXED: Replaced '"' and '"' with standard quotes */}
          <p>The prayer of an eight-year-old… Some promises cost more than you know.</p>
          <ul className="m-list">
            <li><strong>Miracle triplets.</strong> Born at 27 weeks… legend has a price.</li>
            <li><strong>Lagos. Akure. London.</strong> Three fires; not everyone survived.</li>
            <li>"Something always happens." A brother's words became prophecy.</li> {/* FIXED: Replaced '"' and '"' with standard quotes */}
          </ul>
          <ul className="m-dash">
            <li>Grandmother who spoke to spirits.</li>
            <li>Sister's death that opened visions.</li>
            <li>Romance that nearly killed him.</li>
            <li>Marriage that tried to erase him.</li>
            <li>A son he still fights to father.</li>
            <li>A brother whose last words echo.</li>
          </ul>
        </section>

        <section className="m-page">
          <p className="m-lead">"Where was God when David died?" … system designed to make fathers disappear.</p> {/* FIXED: Replaced '"' and '"' with standard quotes */}
          <p>This isn't survival. It's resurrection. When the world says "finished," grace says, "Something always happens."</p>
          <div className="m-card">
            <p className="m-card-h">ABRAHAM OF LONDON</p>
            <p>Miracle child. Marked man. Devoted father. The brother who remembers. The father who refuses to disappear.</p>
          </div>
        </section>

        <section className="m-page">
          <h2 className="m-h">Retailer Description</h2>
          <p>True story spanning Lagos, Akure, London… blueprint for men under pressure. Documentation, boundaries, legacy over litigation.</p>
          <p>If you've been told to disappear, this is your brother at the door… grace is louder.</p>
        </section>

        <section className="m-page">
          <h2 className="m-h">One-Page Synopsis</h2>
          <p>Miracle child → strategist and father; denied work; legal maze; fighting to father.</p>
          <p>Chooses structure over spectacle; presence over performance; strategy for legacy.</p>
          <p>He stayed by grace. Because something always happens—so does he.</p>
        </section>

        <section className="m-page relative">
          <h2 className="m-h">Excerpt — Ch. 18</h2>
          <p>Quiet suffering: delays and silence; nearly two years unable to work… He did not disappear.</p>
          <p>Good men must stop disappearing—even when systems want them to.</p>
          <hr className="m-rule" />
          <h2 className="m-h">Reader Promise</h2>
          <ul className="m-list">
            <li>Language for pain.</li>
            <li>A father's blueprint.</li>
            <li>A stubborn, earned hope.</li>
          </ul>
          <div className="m-call">You are not a case number. When fear says "stop," grace says, "Something always happens."</div>
          <p className="m-cta">
            Read opening chapters • Share with a father under pressure • Join the launch list<br />
            Prefer offline? Get the print-ready teaser at <strong>abrahamoflondon.org/downloads</strong>
          </p>

          {/* Branding: Signature Bottom Right on Last Page */}
          <div className="absolute bottom-[10mm] right-[10mm]">
            <EmbossedSign
              src="/assets/images/signature/abraham-of-london-cursive.svg"
              alt="Abraham of London Signature"
              width={90}
              height={22}
              effect="deboss"
              // The original problematic line {/* REMOVED:*/} is deleted here.
            />
          </div>
        </section>
      </main>

      <style jsx global>{`
        /* Defining CSS variables for color consistency */
        :root {
          --color-primary: #0B2E1F; /* Dark Green */
          --color-accent: #D4AF37; /* Gold/Brass accent */
          --color-on-secondary: #fefefe; /* Creamy white */
          --color-lightGrey: #e5e5e5;
          --color-warmWhite: #fdfdfa;
        }

        @page { size: A6; margin: 10mm; }
        .m-root { font-family: var(--font-serif, Georgia, Cambria, Times, serif); color: #333; }
        .m-page {
          page-break-after: always;
          min-height: calc(148mm - 20mm);
          padding: 0; /* Resetting padding for consistent margin */
          position: relative;
        }

        /* Cover specific styles */
        .m-cover {
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: flex-start;
          text-align: left;
        }
        .m-bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: .92; }
        .m-veil { position: absolute; inset: 0; background: radial-gradient(60% 60% at 50% 60%, rgba(212,175,55,.55), transparent 65%), rgba(0,0,0,.38); }
        .m-pad { position: relative; padding: 14mm 10mm; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; width: 100%; }
        .m-eyebrow { letter-spacing: .14em; text-transform: uppercase; color: var(--color-accent); font-size: 9pt; margin-bottom: 2mm; }
        .m-title { font-size: 20pt; line-height: 1.05; color: var(--color-on-secondary); }
        .m-tag { margin-top: 3mm; font-size: 9pt; opacity: .9; color: var(--color-on-secondary); }
        .m-foot { margin-top: 6mm; font-size: 8pt; opacity: .85; color: var(--color-on-secondary); }

        /* General page styles */
        .m-page h2.m-h {
          font-size: 12pt;
          color: var(--color-primary);
          margin-top: 5mm;
          margin-bottom: 3mm;
        }
        .m-page p {
          font-size: 10pt;
          line-height: 1.5;
          margin-bottom: 2mm;
        }
        .mt { margin-top: 4mm; }
        .m-lead { font-size: 10.5pt; line-height: 1.6; }
        .m-pull { border-left: 2px solid var(--color-accent); padding-left: 3mm; color: var(--color-primary); font-style: italic; }
        .m-list { margin: 3mm 0; padding-left: 4.5mm; }
        .m-dash { margin: 2mm 0; padding-left: 3.5mm; list-style: "— "; } {/* FIXED: Replaced '— ' with '— ' */}
        .m-card { border: 1px solid var(--color-lightGrey); background: var(--color-warmWhite); border-radius: 6px; padding: 4mm; margin-top: 3mm; }
        .m-card-h { font-weight: 700; color: var(--color-primary); margin-bottom: 1.5mm; letter-spacing: .02em; }
        .m-rule { border: none; height: 2px; background: linear-gradient(to right, color-mix(in oklab, var(--color-accent) 85%, #fff), transparent 65%); margin: 4mm 0; }
        .m-call { border: 1px solid var(--color-accent); background: color-mix(in oklab, var(--color-accent) 7%, white); border-radius: 6px; padding: 3mm; margin-top: 3mm; font-size: 10pt; }
        .m-cta { margin-top: 3mm; font-size: 9pt; }

        /* Media query for screen preview */
        @media screen {
          body {
            background: #f6f6f6;
            padding: 2rem;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            min-height: 100vh;
          }
          .m-root {
            display: flex;
            flex-direction: column;
            gap: 20mm; /* Space between A6 pages */
            background: none;
          }
          .m-page {
            background: #fff;
            box-shadow: 0 5px 15px rgba(0,0,0,.1);
            width: 105mm; /* A6 width */
            height: 148mm; /* A6 height */
            padding: 10mm; /* Simulate print margin */
            page-break-after: unset; /* Disable page breaks for screen layout */
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
          }
          .m-cover {
            padding: 0; /* Cover handles its own internal padding */
            justify-content: flex-start;
          }
          .m-cover .m-pad {
            padding: 14mm 10mm;
          }
          .m-cover .absolute {
            top: 10mm;
            left: 10mm;
            transform: none;
          }
          .m-page:last-of-type {
            margin-bottom: 0;
          }
          /* Adjustments for signature on last page in screen view */
          .m-page:last-of-type .absolute {
            bottom: 10mm;
            right: 10mm;
            transform: none;
          }
        }
      `}</style>
    </>
  );
}