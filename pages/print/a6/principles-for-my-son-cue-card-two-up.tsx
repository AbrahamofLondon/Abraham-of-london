// pages/print/a6/principles-for-my-son-cue-card-two-up.tsx

import Head from "next/head";
import EmbossedBrandMark from "@/components/print/EmbossedBrandMark"; // Adjust path as needed
import EmbossedSign from "@/components/print/EmbossedSign";   // Adjust path as needed
import * as React from 'react'; // Import React for functional components

const Front = () => (
 <section className="card card-front relative">
  {/* Logo Top Left */}
  <div className="absolute top-3 left-3">
   <EmbossedBrandMark
    src="/assets/images/abraham-logo.jpg"
    alt="Abraham of London Logo"
    width={25}
    height={25}
    effect="emboss"
    //<--- REMOVED
   />
  </div>

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
 <section className="card card-back relative">
  {/* Logo Top Left */}
  <div className="absolute top-3 left-3">
   <EmbossedBrandMark
    src="/assets/images/abraham-logo.jpg"
    alt="Abraham of London Logo"
    width={25}
    height={25}
    effect="emboss"
    //<--- REMOVED
   />
  </div>
 
  <h1>Principles — The Six (Back)</h1>
  <ol start={7}>
   <li><strong>Speech:</strong> No gossip or slander.</li>
   <li><strong>Learning:</strong> Read, ask, practice.</li>
   <li><strong>Health:</strong> Sleep, train, simple food.</li>
   <li><strong>Craft:</strong> Build things that last.</li>
   <li><strong>Service:</strong> Lift burdens at home first.</li>
   <li><strong>Faith:</strong> Listen, obey, stay planted.</li>
  </ol>
  <p className="micro-prompt">
    <em className="text-xs">"Which standard will I live in one small way before noon?"</em>
  </p>

  {/* Signature Bottom Right */}
  <div className="absolute bottom-3 right-3 flex flex-col items-end">
    <EmbossedSign
      src="/assets/images/signature/abraham-of-london-cursive.svg"
      alt="Abraham of London Signature"
      width={70} // Smaller for cue card
      height={20} // Smaller for cue card
      effect="deboss"
      //<--- REMOVED
    />
    <span className="text-[8px] text-[color:var(--color-on-secondary)/0.6] mt-0.5">A.o.L.</span>
  </div>
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
    /* Global Print and Layout Styles */
    @page { size: A4; margin: 10mm; }
    html, body { background: white; margin: 0; padding: 0; }
   
    .sheet {
     width: 210mm;
     height: 297mm;
     display: grid;
     grid-template-columns: calc(105mm - 10mm) calc(105mm - 10mm); /* Adjusted for 10mm margins on A6 */
     grid-template-rows: calc(148.5mm - 10mm); /* A6 height - margins */
     gap: 20mm; /* Space between the two A6 cards on the A4 page, adjust as needed */
     place-content: center; /* Centers the grid on the A4 page */
    }
   
    .card {
     box-sizing: border-box;
     width: 100%;
     height: 100%;
     border: .6pt solid #dadada;
     border-radius: 6pt;
     padding: 8mm; /* Consistent padding */
     font-family: var(--font-sans, ui-sans-serif);
     display: flex;
     flex-direction: column;
     justify-content: space-between;
    }

    h1 {
     font: 700 12pt/1.2 var(--font-serif, Georgia);
     margin: 0 0 4mm;
     color: #1a1a1a;
     text-align: center;
     padding-top: 5mm; /* Make space for the top-left logo */
    }
   
    ol {
     margin: 0;
     padding-left: 4mm;
     font-size: 10.5pt;
    }
   
    li {
     margin: .9mm 0;
    }

    .micro-prompt {
      margin-top: 5mm;
      text-align: center;
      padding-top: 3mm;
      border-top: 1px solid #eeeeee;
      font-size: 9pt; /* Slightly larger for readability */
    }

    /* Screen-only styles for preview */
    @media screen {
     body {
      padding: 2rem;
      background: #f6f6f6;
     }
     .sheet {
      background: #fff;
      box-shadow: 0 10px 30px rgba(0,0,0,.09);
      margin: 0 auto;
      height: fit-content;
     }
     .card {
      height: calc(148.5mm - 10mm); /* Match grid-template-rows height */
     }
    }
   `}</style>
  </>
 );
}