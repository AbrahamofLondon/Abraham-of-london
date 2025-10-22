// pages/print/a6/brotherhood-cue-card-two-up.tsx
import Head from "next/head";
import React from "react";
import EmbossedBrandMark from "@/components/print/EmbossedBrandMark"; 
import EmbossedSign from "@/components/print/EmbossedSign";       

const CardFront = () => (
  <section className="card card-front relative">
    {/* Branding: Logo Top Left */}
    <div className="absolute top-3 left-3">
      <EmbossedBrandMark
        src="/assets/images/abraham-logo.jpg"
        alt="Abraham of London Logo"
        width={25}
        height={25}
        effect="emboss"
        baseColor="transparent"
      />
    </div>
    
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
    
    <div className="h-6"></div> {/* Spacer for layout balance */}
  </section>
);

const CardBack = () => (
  <section className="card card-back relative">
    {/* Branding: Logo Top Left */}
    <div className="absolute top-3 left-3">
      <EmbossedBrandMark
        src="/assets/images/abraham-logo.jpg"
        alt="Abraham of London Logo"
        width={25}
        height={25}
        effect="emboss"
        baseColor="transparent"
      />
    </div>
    
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
    
    {/* Branding: Signature Bottom Right */}
    <div className="absolute bottom-3 right-3 flex flex-col items-end">
        <EmbossedSign
            src="/assets/images/signature/abraham-of-london-cursive.svg"
            alt="Abraham of London Signature"
            width={70} 
            height={20} 
            effect="deboss"
            baseColor="transparent"
        />
        <span className="text-[8px] text-[color:var(--color-on-secondary)/0.6] mt-0.5">A.o.L.</span>
    </div>
  </section>
);

export default function BrotherhoodCueCardTwoUp() {
  return (
    <>
      <Head><title>Brotherhood Cue Card â€” A6 Two-Up (Print)</title></Head>
      <main className="sheet">
        <CardFront />
        <CardBack />
      </main>

      <style jsx global>{`
        /* --- Standard A4 Print Setup --- */
        @page { size: A4; margin: 10mm; }
        html, body { background: white; margin: 0; padding: 0; }
        
        /* --- A6 Two-Up Layout on A4 Sheet --- */
        .sheet { 
          width: 210mm; 
          height: 297mm; 
          display: grid; 
          /* Two columns for two A6 cards (approx 105mm wide) with margins */
          grid-template-columns: calc(105mm - 10mm) calc(105mm - 10mm);
          /* One row for A6 height (approx 148.5mm tall) with margins */
          grid-template-rows: calc(148.5mm - 10mm); 
          gap: 20mm; /* Space between the two A6 cards */
          place-content: center; /* Centers the grid on the A4 page */
        }
        
        /* --- Card Styles (A6 size) --- */
        .card {
          box-sizing: border-box; 
          width: 100%; 
          height: 100%; 
          border: .6pt solid #dadada; 
          border-radius: 6pt; 
          padding: 8mm;
          
          /* Using the font property from the original code */
          font: 10pt/1.45 var(--font-sans, "ui-sans-serif, system-ui, sans-serif");
          
          display: flex; 
          flex-direction: column; 
          justify-content: space-between;
        }

        h1 { 
          /* Pushing content down to make space for the top-left logo */
          padding-top: 5mm; 
          font: 700 12pt/1.2 var(--font-serif, "Georgia, serif"); 
          margin: 0 0 4mm; 
          color: var(--color-primary, #1a1a1a);
          text-align: center;
        }
        
        h2 { 
          font: 600 10pt/1.2 var(--font-serif, "Georgia, serif"); 
          margin: 3mm 0 2mm; 
          color: var(--color-primary, #1a1a1a); 
        }
        
        ul { 
          margin: 0; 
          padding-left: 4mm; 
          list-style: disc; /* Ensure bullet points are visible */
        }
        
        li { 
          margin: .8mm 0; 
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
             height: calc(148.5mm - 10mm);
          }
        }
      `}</style>
    </>
  );
}
